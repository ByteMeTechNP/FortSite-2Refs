-- Phase 07: Platform Owner registry and authorization boundary.
-- No seed data. No real Auth user IDs. No company/tenant bypass.
-- Apply only after explicit approval via MCP apply_migration on
-- project rvfoveqprrtobmywaodf.

-- ---------------------------------------------------------------------------
-- platform_admins
-- ---------------------------------------------------------------------------

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete restrict,
  platform_role text not null,
  status text not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  granted_by_user_id uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_admins_platform_role_check
    check (platform_role = 'owner'),
  constraint platform_admins_status_check
    check (status in ('active', 'suspended', 'revoked'))
);

comment on table public.platform_admins is
  'Protected Platform Owner registry. Not company membership or role.';

comment on column public.platform_admins.granted_by_user_id is
  'Null only for the documented initial controlled bootstrap.';

comment on column public.platform_admins.status is
  'active | suspended | revoked. Revocation is a status change, not a hard delete.';

create index platform_admins_status_idx
  on public.platform_admins (status);

create or replace function public.platform_admins_protect_last_active()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  remaining integer;
  recovery text;
begin
  if tg_op = 'UPDATE'
     and old.status = 'active'
     and new.status is distinct from 'active' then
    select count(*)::integer
    into remaining
    from public.platform_admins pa
    where pa.status = 'active'
      and pa.user_id is distinct from old.user_id;

    if remaining = 0 then
      recovery := current_setting('fortsite.platform_owner_recovery', true);
      if recovery is distinct from 'on' then
        raise exception 'last_active_platform_owner_protected'
          using errcode = 'P0001';
      end if;
    end if;
  end if;

  new.updated_at := now();
  if new.status in ('suspended', 'revoked') and new.revoked_at is null then
    new.revoked_at := now();
  end if;
  if new.status = 'active' then
    new.revoked_at := null;
  end if;
  return new;
end;
$$;

comment on function public.platform_admins_protect_last_active() is
  'Blocks deactivating the last active owner unless fortsite.platform_owner_recovery=on.';

revoke all on function public.platform_admins_protect_last_active() from public;
revoke all on function public.platform_admins_protect_last_active() from anon;
revoke all on function public.platform_admins_protect_last_active() from authenticated;

create trigger platform_admins_protect_last_active_bu
  before update on public.platform_admins
  for each row
  execute function public.platform_admins_protect_last_active();

-- ---------------------------------------------------------------------------
-- platform_authority_audit_events
-- ---------------------------------------------------------------------------

create table public.platform_authority_audit_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  actor_user_id uuid references auth.users (id) on delete set null,
  target_user_id uuid references auth.users (id) on delete set null,
  outcome text not null,
  reason_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint platform_authority_audit_events_event_type_check
    check (
      event_type in (
        'initial_owner_bootstrapped',
        'owner_granted',
        'owner_suspended',
        'owner_revoked',
        'bootstrap_recovery_used'
      )
    ),
  constraint platform_authority_audit_events_outcome_check
    check (outcome in ('succeeded', 'failed'))
);

comment on table public.platform_authority_audit_events is
  'Append-only platform authority security events. Phase 11 must extend/reuse this table; do not create a duplicate log.';

create index platform_authority_audit_events_created_at_idx
  on public.platform_authority_audit_events (created_at desc);

create index platform_authority_audit_events_target_user_id_idx
  on public.platform_authority_audit_events (target_user_id);

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------

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
  );
$$;

comment on function public.is_platform_owner() is
  'SECURITY DEFINER boolean: current auth.uid() is an active Platform Owner. Returns no registry rows. DEFINER required because platform_admins has no client policies.';

create or replace function public.require_platform_owner()
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if not public.is_platform_owner() then
    raise exception 'permission denied: platform owner required'
      using errcode = '42501';
  end if;
end;
$$;

comment on function public.require_platform_owner() is
  'Raises 42501 unless the current caller is an active Platform Owner. No privileged data returned.';

revoke all on function public.is_platform_owner() from public;
revoke all on function public.is_platform_owner() from anon;
grant execute on function public.is_platform_owner() to authenticated;

revoke all on function public.require_platform_owner() from public;
revoke all on function public.require_platform_owner() from anon;
grant execute on function public.require_platform_owner() to authenticated;

-- ---------------------------------------------------------------------------
-- Grants and RLS — browser clients have zero table access
-- ---------------------------------------------------------------------------

alter table public.platform_admins enable row level security;
alter table public.platform_admins force row level security;
alter table public.platform_authority_audit_events enable row level security;
alter table public.platform_authority_audit_events force row level security;

revoke all on table public.platform_admins from anon;
revoke all on table public.platform_admins from authenticated;
revoke all on table public.platform_admins from public;
revoke all on table public.platform_authority_audit_events from anon;
revoke all on table public.platform_authority_audit_events from authenticated;
revoke all on table public.platform_authority_audit_events from public;

-- Zero policies intentionally: clients use is_platform_owner() only.
-- Tenant company policies are unchanged and must not OR is_platform_owner().
