-- Panel-managed credentials remediation.
-- Retire client invitation acceptance. Add a private initial-password gate.
-- No seed rows. No Auth user creation. No companies policy change.
-- Apply only via MCP apply_migration on project rvfoveqprrtobmywaodf.

-- ---------------------------------------------------------------------------
-- account_security: trusted gate. No password column.
-- No row means the account is not in the new forced-change flow.
-- ---------------------------------------------------------------------------

create table public.account_security (
  user_id uuid primary key references auth.users (id) on delete cascade,
  must_change_password boolean not null,
  required_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint account_security_completed_check check (
    (must_change_password = true and completed_at is null)
    or (must_change_password = false and completed_at is not null)
  )
);

comment on table public.account_security is
  'Trusted initial-password gate keyed by Auth UUID. Not a profile, membership, or role. Never store a password.';

create table public.account_security_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  outcome text not null,
  created_at timestamptz not null default now(),
  constraint account_security_events_event_type_check
    check (event_type in ('initial_password_changed')),
  constraint account_security_events_outcome_check
    check (outcome in ('succeeded', 'failed'))
);

comment on table public.account_security_events is
  'Audit of initial-password completion. No password, token, or secret column.';

alter table public.account_security enable row level security;
alter table public.account_security force row level security;
alter table public.account_security_events enable row level security;
alter table public.account_security_events force row level security;

revoke all on table public.account_security from public;
revoke all on table public.account_security from anon;
revoke all on table public.account_security from authenticated;
revoke all on table public.account_security_events from public;
revoke all on table public.account_security_events from anon;
revoke all on table public.account_security_events from authenticated;

-- ---------------------------------------------------------------------------
-- password_change_required
-- ---------------------------------------------------------------------------

create or replace function public.password_change_required()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.account_security s
    where s.user_id = (select auth.uid())
      and s.must_change_password
  );
$$;

comment on function public.password_change_required() is
  'True only when the current Auth user has a trusted must_change_password row. No row means false. Returns no other data.';

revoke all on function public.password_change_required() from public;
revoke all on function public.password_change_required() from anon;
grant execute on function public.password_change_required() to authenticated;

-- ---------------------------------------------------------------------------
-- complete_initial_password: password change and flag clear are one transaction
-- ---------------------------------------------------------------------------

create or replace function public.complete_initial_password(p_new_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_required boolean;
begin
  if v_uid is null then
    raise exception 'permission denied: signed-in user required'
      using errcode = '42501';
  end if;

  if p_new_password is null or char_length(p_new_password) < 12 then
    raise exception 'password_rejected'
      using errcode = 'P0001';
  end if;

  select s.must_change_password
  into v_required
  from public.account_security s
  where s.user_id = v_uid
  for update;

  if not found or v_required is distinct from true then
    return;
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(p_new_password, extensions.gen_salt('bf')),
    updated_at = now()
  where id = v_uid;

  if not found then
    raise exception 'password_rejected'
      using errcode = 'P0001';
  end if;

  update public.account_security
  set
    must_change_password = false,
    completed_at = now()
  where user_id = v_uid
    and must_change_password = true;

  if not found then
    raise exception 'password_rejected'
      using errcode = 'P0001';
  end if;

  insert into public.account_security_events (
    actor_user_id,
    target_user_id,
    event_type,
    outcome
  )
  values (
    v_uid,
    v_uid,
    'initial_password_changed',
    'succeeded'
  );
end;
$$;

comment on function public.complete_initial_password(text) is
  'Sets a new Auth password and clears must_change_password in one transaction. Does not write the password to audit. A later call does not change the password again.';

revoke all on function public.complete_initial_password(text) from public;
revoke all on function public.complete_initial_password(text) from anon;
grant execute on function public.complete_initial_password(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Membership and owner helpers honor the password gate
-- ---------------------------------------------------------------------------

create or replace function public.is_active_company_member(p_company_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships m
    where m.company_id = p_company_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
  )
  and not public.password_change_required();
$$;

comment on function public.is_active_company_member(uuid) is
  'True when the current Auth user has an active membership and does not owe an initial password change.';

create or replace function public.company_is_operational(p_company_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1
    from public.company_memberships m
    join public.companies c on c.id = m.company_id
    where m.company_id = p_company_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and c.lifecycle_status = 'active'
  )
  and not public.password_change_required();
$$;

comment on function public.company_is_operational(uuid) is
  'Active membership, active company lifecycle, and no pending initial password change. Phase 10 will AND subscription eligibility when subscription tables exist.';

create or replace function public.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = (select auth.uid())
      and pa.platform_role = 'owner'
      and pa.status = 'active'
  )
  and not public.password_change_required();
$$;

comment on function public.is_platform_owner() is
  'SECURITY DEFINER boolean: current auth.uid() is an active Platform Owner and does not owe an initial password change. Returns no registry rows.';

-- ---------------------------------------------------------------------------
-- Retire invitation acceptance. Keep the historical table.
-- ---------------------------------------------------------------------------

create or replace function public.accept_company_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  raise exception 'invitation_retired'
    using errcode = 'P0001';
end;
$$;

comment on function public.accept_company_invitation(uuid) is
  'Retired. Invitation acceptance no longer creates memberships. The company_invitations table is retained for history. Argument is ignored.';

revoke all on function public.accept_company_invitation(uuid) from public;
revoke all on function public.accept_company_invitation(uuid) from anon;
revoke all on function public.accept_company_invitation(uuid) from authenticated;
