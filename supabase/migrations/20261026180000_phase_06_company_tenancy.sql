-- Phase 06: company tenancy, memberships, invitations, and access helpers.
-- No seed data. No roles. No platform-owner or subscription tables.
-- Apply only after explicit approval via MCP apply_migration on
-- project rvfoveqprrtobmywaodf.

-- ---------------------------------------------------------------------------
-- companies
-- ---------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  company_code text not null,
  legal_name text not null,
  display_name text,
  registration_country text not null,
  default_currency text not null,
  timezone text not null,
  lifecycle_status text not null default 'pending_setup',
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_company_code_format
    check (company_code ~ '^FS-[A-Z0-9]{8}$'),
  constraint companies_registration_country_check
    check (registration_country in ('Nepal', 'India')),
  constraint companies_default_currency_check
    check (default_currency in ('NPR', 'INR')),
  constraint companies_lifecycle_status_check
    check (
      lifecycle_status in (
        'pending_setup',
        'active',
        'suspended',
        'archived'
      )
    ),
  constraint companies_country_currency_timezone_check
    check (
      (
        registration_country = 'Nepal'
        and default_currency = 'NPR'
        and timezone = 'Asia/Kathmandu'
      )
      or (
        registration_country = 'India'
        and default_currency = 'INR'
        and timezone = 'Asia/Kolkata'
      )
    )
);

comment on table public.companies is
  'Tenant identity and lifecycle. Not membership, role, or subscription.';

comment on column public.companies.company_code is
  'Immutable human-readable tenant code. Generated server-side.';

comment on column public.companies.lifecycle_status is
  'pending_setup | active | suspended | archived. Operational eligibility is separate.';

create unique index companies_company_code_key on public.companies (company_code);

create or replace function public.companies_assign_code()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  candidate text;
  attempts integer := 0;
begin
  if new.company_code is not null and btrim(new.company_code) <> '' then
    new.company_code := upper(btrim(new.company_code));
    return new;
  end if;

  loop
    attempts := attempts + 1;
    if attempts > 20 then
      raise exception 'company_code_generation_failed'
        using errcode = 'P0001';
    end if;

    candidate :=
      'FS-'
      || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    if not exists (
      select 1
      from public.companies c
      where c.company_code = candidate
    ) then
      new.company_code := candidate;
      return new;
    end if;
  end loop;
end;
$$;

comment on function public.companies_assign_code() is
  'BEFORE INSERT: assign a unique FS-######## company_code when unset.';

revoke all on function public.companies_assign_code() from public;
revoke all on function public.companies_assign_code() from anon;
revoke all on function public.companies_assign_code() from authenticated;

create trigger companies_assign_code_bi
  before insert on public.companies
  for each row
  execute function public.companies_assign_code();

create or replace function public.companies_prevent_code_change()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if new.company_code is distinct from old.company_code then
    raise exception 'company_code_immutable'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.companies_prevent_code_change() from public;
revoke all on function public.companies_prevent_code_change() from anon;
revoke all on function public.companies_prevent_code_change() from authenticated;

create trigger companies_prevent_code_change_bu
  before update on public.companies
  for each row
  execute function public.companies_prevent_code_change();

-- ---------------------------------------------------------------------------
-- company_memberships
-- ---------------------------------------------------------------------------

create table public.company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null,
  joined_at timestamptz not null default now(),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_memberships_status_check
    check (status in ('active', 'suspended', 'removed')),
  constraint company_memberships_company_user_key unique (company_id, user_id),
  constraint company_memberships_company_id_id_key unique (company_id, id)
);

comment on table public.company_memberships is
  'Auth user to company relationship. Not a role or permission grant.';

comment on column public.company_memberships.status is
  'active | suspended | removed. Active membership does not override company suspension.';

create index company_memberships_user_id_idx
  on public.company_memberships (user_id);

-- ---------------------------------------------------------------------------
-- company_invitations
-- ---------------------------------------------------------------------------

create table public.company_invitations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users (id) on delete set null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  accepted_by uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_invitations_status_check
    check (
      status in ('pending', 'accepted', 'revoked', 'expired')
    )
);

comment on table public.company_invitations is
  'Company invitation lifecycle. No plaintext bearer tokens. Acceptance via RPC only.';

create or replace function public.company_invitations_normalize_email()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.email := lower(btrim(new.email));
  if new.email = '' then
    raise exception 'invitation_email_required'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.company_invitations_normalize_email() from public;
revoke all on function public.company_invitations_normalize_email() from anon;
revoke all on function public.company_invitations_normalize_email() from authenticated;

create trigger company_invitations_normalize_email_bi
  before insert or update of email on public.company_invitations
  for each row
  execute function public.company_invitations_normalize_email();

create unique index company_invitations_pending_company_email_key
  on public.company_invitations (company_id, email)
  where status = 'pending';

create index company_invitations_email_idx
  on public.company_invitations (email);

create index company_invitations_status_expires_idx
  on public.company_invitations (status, expires_at);

-- ---------------------------------------------------------------------------
-- Trusted helpers
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
  );
$$;

comment on function public.is_active_company_member(uuid) is
  'True when the current Auth user has an active membership in the company.';

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
  );
$$;

comment on function public.company_is_operational(uuid) is
  'Active membership plus company lifecycle active. Phase 10 will AND subscription eligibility when subscription tables exist.';

create or replace function public.accept_company_invitation(p_invitation_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_email text;
  v_invite public.company_invitations%rowtype;
  v_existing public.company_memberships%rowtype;
  v_membership_id uuid;
begin
  if v_uid is null then
    raise exception 'invitation_unavailable'
      using errcode = 'P0001';
  end if;

  select lower(btrim(u.email))
  into v_email
  from auth.users u
  where u.id = v_uid
    and u.email_confirmed_at is not null;

  if v_email is null or v_email = '' then
    raise exception 'invitation_unavailable'
      using errcode = 'P0001';
  end if;

  select *
  into v_invite
  from public.company_invitations i
  where i.id = p_invitation_id
  for update;

  if not found then
    raise exception 'invitation_unavailable'
      using errcode = 'P0001';
  end if;

  -- Idempotent retry for the same accepter.
  if v_invite.status = 'accepted'
     and v_invite.accepted_by = v_uid
     and v_invite.email = v_email then
    select *
    into v_existing
    from public.company_memberships m
    where m.company_id = v_invite.company_id
      and m.user_id = v_uid;

    if found and v_existing.status = 'active' then
      return jsonb_build_object(
        'company_id', v_invite.company_id,
        'membership_id', v_existing.id
      );
    end if;

    raise exception 'invitation_unavailable'
      using errcode = 'P0001';
  end if;

  if v_invite.status is distinct from 'pending'
     or v_invite.expires_at <= now()
     or v_invite.email is distinct from v_email then
    raise exception 'invitation_unavailable'
      using errcode = 'P0001';
  end if;

  select *
  into v_existing
  from public.company_memberships m
  where m.company_id = v_invite.company_id
    and m.user_id = v_uid
  for update;

  if found then
    -- Fail closed: do not reactivate suspended/removed memberships here.
    if v_existing.status is distinct from 'active' then
      raise exception 'invitation_unavailable'
        using errcode = 'P0001';
    end if;
    v_membership_id := v_existing.id;
  else
    insert into public.company_memberships (
      company_id,
      user_id,
      status,
      created_by
    )
    values (
      v_invite.company_id,
      v_uid,
      'active',
      v_invite.invited_by
    )
    returning id into v_membership_id;
  end if;

  update public.company_invitations
  set
    status = 'accepted',
    accepted_by = v_uid,
    accepted_at = now(),
    updated_at = now()
  where id = v_invite.id
    and status = 'pending';

  if not found then
    raise exception 'invitation_unavailable'
      using errcode = 'P0001';
  end if;

  return jsonb_build_object(
    'company_id', v_invite.company_id,
    'membership_id', v_membership_id
  );
end;
$$;

comment on function public.accept_company_invitation(uuid) is
  'SECURITY DEFINER invitation acceptance. Matches Auth email to pending invite. Creates membership only; no role.';

revoke all on function public.is_active_company_member(uuid) from public;
revoke all on function public.is_active_company_member(uuid) from anon;
grant execute on function public.is_active_company_member(uuid) to authenticated;

revoke all on function public.company_is_operational(uuid) from public;
revoke all on function public.company_is_operational(uuid) from anon;
grant execute on function public.company_is_operational(uuid) to authenticated;

revoke all on function public.accept_company_invitation(uuid) from public;
revoke all on function public.accept_company_invitation(uuid) from anon;
grant execute on function public.accept_company_invitation(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Grants and RLS
-- ---------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.company_memberships enable row level security;
alter table public.company_invitations enable row level security;

revoke all on table public.companies from anon;
revoke all on table public.companies from authenticated;
revoke all on table public.company_memberships from anon;
revoke all on table public.company_memberships from authenticated;
revoke all on table public.company_invitations from anon;
revoke all on table public.company_invitations from authenticated;

grant select on table public.companies to authenticated;
grant select on table public.company_memberships to authenticated;
-- company_invitations: no direct client grants

create policy companies_select_member
  on public.companies
  for select
  to authenticated
  using (public.is_active_company_member(id));

create policy company_memberships_select_own
  on public.company_memberships
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- company_invitations: RLS enabled, zero policies for anon/authenticated.
