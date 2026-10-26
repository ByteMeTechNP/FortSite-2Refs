-- Phase 09: company onboarding, compliance profile, founding-admin
-- provisioning, and audited lifecycle transitions.
-- No prices, no Phase 12 roles, no government calls, no seed companies.
-- Apply only via MCP apply_migration on project rvfoveqprrtobmywaodf.

-- ---------------------------------------------------------------------------
-- Company contact fields and paused lifecycle
-- ---------------------------------------------------------------------------

alter table public.companies
  add column contact_email text,
  add column contact_phone text,
  add column locality text;

alter table public.companies
  drop constraint companies_lifecycle_status_check;

alter table public.companies
  add constraint companies_lifecycle_status_check
    check (
      lifecycle_status in (
        'pending_setup',
        'active',
        'paused',
        'suspended',
        'archived'
      )
    );

alter table public.companies
  add constraint companies_contact_email_check
    check (
      contact_email is null
      or (
        char_length(contact_email) between 3 and 254
        and contact_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
      )
    ),
  add constraint companies_contact_phone_check
    check (
      contact_phone is null
      or char_length(contact_phone) between 3 and 32
    ),
  add constraint companies_locality_check
    check (
      locality is null
      or char_length(locality) between 1 and 120
    );

comment on column public.companies.lifecycle_status is
  'pending_setup | active | paused | suspended | archived. Operational eligibility stays separate and requires active.';

comment on column public.companies.contact_email is
  'Optional company contact. Not an Auth login and not a founding-admin credential.';

-- ---------------------------------------------------------------------------
-- Founding-admin marker. Not a Phase 12 role.
-- ---------------------------------------------------------------------------

alter table public.company_memberships
  add column founding_admin boolean not null default false;

comment on column public.company_memberships.founding_admin is
  'Server-written marker: the first admin membership for this company. Not permission to manage staff, settings, or finance. Clients cannot set it.';

create unique index company_memberships_one_founding_admin_idx
  on public.company_memberships (company_id)
  where founding_admin;

create or replace function public.company_memberships_guard_founding_admin()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and new.founding_admin then
    if coalesce(auth.role(), '') is distinct from 'service_role' then
      raise exception 'founding_admin_server_only'
        using errcode = 'P0001';
    end if;
  elsif tg_op = 'UPDATE'
    and new.founding_admin is distinct from old.founding_admin
    and coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'founding_admin_server_only'
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;

comment on function public.company_memberships_guard_founding_admin() is
  'Rejects client writes that set founding_admin. Service-role provisioning is the only writer.';

revoke all on function public.company_memberships_guard_founding_admin() from public;
revoke all on function public.company_memberships_guard_founding_admin() from anon;
revoke all on function public.company_memberships_guard_founding_admin() from authenticated;

create trigger company_memberships_guard_founding_admin_biu
  before insert or update on public.company_memberships
  for each row
  execute function public.company_memberships_guard_founding_admin();

-- ---------------------------------------------------------------------------
-- Compliance profile, subscription intent, provisioning, lifecycle events
-- ---------------------------------------------------------------------------

create table public.company_compliance_profiles (
  company_id uuid primary key references public.companies (id) on delete cascade,
  registration_country text not null,
  route_key text not null,
  setup_state text not null default 'not_configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_compliance_profiles_country_check
    check (registration_country in ('Nepal', 'India')),
  constraint company_compliance_profiles_route_check
    check (
      (
        registration_country = 'Nepal'
        and route_key = 'nepal_cbms'
      )
      or (
        registration_country = 'India'
        and route_key = 'india_irn'
      )
    ),
  constraint company_compliance_profiles_state_check
    check (setup_state = 'not_configured')
);

comment on table public.company_compliance_profiles is
  'Country compliance route metadata only. setup_state stays not_configured until Phase 67. No secrets and no government call.';

create table public.company_subscription_intents (
  company_id uuid primary key references public.companies (id) on delete cascade,
  requested_plan_code text,
  trial_requested boolean not null default false,
  created_at timestamptz not null default now(),
  constraint company_subscription_intents_plan_code_check
    check (
      requested_plan_code is null
      or requested_plan_code ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$'
    )
);

comment on table public.company_subscription_intents is
  'Optional plan-code intent captured at onboarding. No price, limit, duration, or entitlement. Pending Phase 10.';

create table public.company_admin_provisioning (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  idempotency_key text not null,
  admin_email text not null,
  admin_display_name text not null,
  auth_user_id uuid references auth.users (id) on delete set null,
  state text not null,
  email_attested boolean not null default false,
  attested_by uuid references auth.users (id) on delete set null,
  attested_at timestamptz,
  handoff text not null default 'not_issued',
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_admin_provisioning_company_key unique (company_id),
  constraint company_admin_provisioning_idempotency_key unique (idempotency_key),
  constraint company_admin_provisioning_email_check
    check (
      char_length(admin_email) between 3 and 254
      and admin_email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
    ),
  constraint company_admin_provisioning_name_check
    check (char_length(admin_display_name) between 1 and 120),
  constraint company_admin_provisioning_idempotency_check
    check (idempotency_key ~ '^[A-Za-z0-9_-]{8,80}$'),
  constraint company_admin_provisioning_state_check
    check (state in ('company_recorded', 'auth_created', 'linked')),
  constraint company_admin_provisioning_handoff_check
    check (handoff in ('not_issued', 'issued')),
  constraint company_admin_provisioning_failure_check
    check (
      failure_code is null
      or failure_code in ('email_conflict', 'auth_failed', 'link_failed')
    ),
  constraint company_admin_provisioning_attestation_check
    check (
      email_attested = true
      and attested_by is not null
      and attested_at is not null
    )
);

comment on table public.company_admin_provisioning is
  'Founding-admin handoff state. No password column. A temporary password is generated in the Edge Function and returned once.';

create index company_admin_provisioning_auth_user_id_idx
  on public.company_admin_provisioning (auth_user_id);

create table public.company_lifecycle_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  actor_user_id uuid references auth.users (id) on delete set null,
  event_type text not null,
  from_status text,
  to_status text,
  reason text,
  outcome text not null,
  correlation_id text,
  created_at timestamptz not null default now(),
  constraint company_lifecycle_events_type_check
    check (
      event_type in (
        'company_created',
        'lifecycle_transition',
        'provision_linked',
        'handoff_issued',
        'password_reset'
      )
    ),
  constraint company_lifecycle_events_outcome_check
    check (outcome in ('succeeded', 'rejected')),
  constraint company_lifecycle_events_reason_check
    check (reason is null or char_length(reason) between 1 and 500),
  constraint company_lifecycle_events_correlation_check
    check (
      correlation_id is null
      or correlation_id ~ '^[A-Za-z0-9_-]{8,80}$'
    )
);

comment on table public.company_lifecycle_events is
  'Append-only company lifecycle audit. No client writes. No passwords.';

create index company_lifecycle_events_company_created_idx
  on public.company_lifecycle_events (company_id, created_at desc);

alter table public.company_compliance_profiles enable row level security;
alter table public.company_compliance_profiles force row level security;
alter table public.company_subscription_intents enable row level security;
alter table public.company_subscription_intents force row level security;
alter table public.company_admin_provisioning enable row level security;
alter table public.company_admin_provisioning force row level security;
alter table public.company_lifecycle_events enable row level security;
alter table public.company_lifecycle_events force row level security;

revoke all on table public.company_compliance_profiles from public;
revoke all on table public.company_compliance_profiles from anon;
revoke all on table public.company_compliance_profiles from authenticated;
revoke all on table public.company_subscription_intents from public;
revoke all on table public.company_subscription_intents from anon;
revoke all on table public.company_subscription_intents from authenticated;
revoke all on table public.company_admin_provisioning from public;
revoke all on table public.company_admin_provisioning from anon;
revoke all on table public.company_admin_provisioning from authenticated;
revoke all on table public.company_lifecycle_events from public;
revoke all on table public.company_lifecycle_events from anon;
revoke all on table public.company_lifecycle_events from authenticated;

-- ---------------------------------------------------------------------------
-- Service-role gate
-- ---------------------------------------------------------------------------

create or replace function public.assert_service_role()
returns void
language plpgsql
stable
security invoker
set search_path = ''
as $$
begin
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    raise exception 'permission denied: service role required'
      using errcode = '42501';
  end if;
end;
$$;

comment on function public.assert_service_role() is
  'Raises 42501 unless the request JWT role is service_role. No data returned.';

revoke all on function public.assert_service_role() from public;
revoke all on function public.assert_service_role() from anon;
revoke all on function public.assert_service_role() from authenticated;
grant execute on function public.assert_service_role() to service_role;

-- ---------------------------------------------------------------------------
-- begin_company_onboarding
-- ---------------------------------------------------------------------------

create or replace function public.begin_company_onboarding(
  p_legal_name text,
  p_registration_country text,
  p_admin_email text,
  p_admin_display_name text,
  p_idempotency_key text,
  p_email_attested boolean,
  p_display_name text default null,
  p_contact_email text default null,
  p_contact_phone text default null,
  p_locality text default null,
  p_requested_plan_code text default null,
  p_trial_requested boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_legal text := btrim(coalesce(p_legal_name, ''));
  v_display text := nullif(btrim(coalesce(p_display_name, '')), '');
  v_country text := btrim(coalesce(p_registration_country, ''));
  v_currency text;
  v_timezone text;
  v_route text;
  v_contact_email text := nullif(lower(btrim(coalesce(p_contact_email, ''))), '');
  v_contact_phone text := nullif(btrim(coalesce(p_contact_phone, '')), '');
  v_locality text := nullif(btrim(coalesce(p_locality, '')), '');
  v_admin_email text := lower(btrim(coalesce(p_admin_email, '')));
  v_admin_name text := btrim(coalesce(p_admin_display_name, ''));
  v_plan text := nullif(btrim(coalesce(p_requested_plan_code, '')), '');
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_company_id uuid;
  v_company_code text;
  v_provisioning_id uuid;
  v_existing_email text;
  v_existing_country text;
  v_existing_status text;
begin
  perform public.require_platform_owner();

  if v_actor is null then
    raise exception 'permission denied: platform owner required'
      using errcode = '42501';
  end if;

  if p_email_attested is distinct from true then
    raise exception 'email_attestation_required'
      using errcode = 'P0001';
  end if;

  if char_length(v_legal) < 2 or char_length(v_legal) > 200 then
    raise exception 'legal_name_invalid'
      using errcode = 'P0001';
  end if;

  if v_country = 'Nepal' then
    v_currency := 'NPR';
    v_timezone := 'Asia/Kathmandu';
    v_route := 'nepal_cbms';
  elsif v_country = 'India' then
    v_currency := 'INR';
    v_timezone := 'Asia/Kolkata';
    v_route := 'india_irn';
  else
    raise exception 'registration_country_invalid'
      using errcode = 'P0001';
  end if;

  if v_contact_email is not null
     and (
       char_length(v_contact_email) < 3
       or char_length(v_contact_email) > 254
       or v_contact_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'
     ) then
    raise exception 'contact_email_invalid'
      using errcode = 'P0001';
  end if;

  if v_contact_phone is not null
     and (
       char_length(v_contact_phone) < 3
       or char_length(v_contact_phone) > 32
     ) then
    raise exception 'contact_phone_invalid'
      using errcode = 'P0001';
  end if;

  if v_locality is not null
     and (char_length(v_locality) < 1 or char_length(v_locality) > 120) then
    raise exception 'locality_invalid'
      using errcode = 'P0001';
  end if;

  if char_length(v_admin_email) < 3
     or char_length(v_admin_email) > 254
     or v_admin_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'admin_email_invalid'
      using errcode = 'P0001';
  end if;

  if char_length(v_admin_name) < 1 or char_length(v_admin_name) > 120 then
    raise exception 'admin_display_name_invalid'
      using errcode = 'P0001';
  end if;

  if v_plan is not null
     and v_plan !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$' then
    raise exception 'plan_code_invalid'
      using errcode = 'P0001';
  end if;

  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' then
    raise exception 'idempotency_key_invalid'
      using errcode = 'P0001';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_key, 0));

  select
    p.admin_email,
    c.registration_country,
    p.id,
    c.id,
    c.company_code,
    c.lifecycle_status
  into
    v_existing_email,
    v_existing_country,
    v_provisioning_id,
    v_company_id,
    v_company_code,
    v_existing_status
  from public.company_admin_provisioning p
  join public.companies c on c.id = p.company_id
  where p.idempotency_key = v_key;

  if found then
    if v_existing_email is distinct from v_admin_email
       or v_existing_country is distinct from v_country then
      raise exception 'idempotency_conflict'
        using errcode = 'P0001';
    end if;

    return jsonb_build_object(
      'company_id', v_company_id,
      'provisioning_id', v_provisioning_id,
      'company_code', v_company_code,
      'registration_country', v_country,
      'default_currency', v_currency,
      'timezone', v_timezone,
      'lifecycle_status', v_existing_status,
      'reused', true
    );
  end if;

  insert into public.companies (
    company_code,
    legal_name,
    display_name,
    registration_country,
    default_currency,
    timezone,
    lifecycle_status,
    contact_email,
    contact_phone,
    locality,
    created_by
  )
  values (
    null,
    v_legal,
    v_display,
    v_country,
    v_currency,
    v_timezone,
    'pending_setup',
    v_contact_email,
    v_contact_phone,
    v_locality,
    v_actor
  )
  returning id, company_code
  into v_company_id, v_company_code;

  insert into public.company_compliance_profiles (
    company_id,
    registration_country,
    route_key,
    setup_state
  )
  values (
    v_company_id,
    v_country,
    v_route,
    'not_configured'
  );

  insert into public.company_subscription_intents (
    company_id,
    requested_plan_code,
    trial_requested
  )
  values (
    v_company_id,
    v_plan,
    coalesce(p_trial_requested, false)
  );

  insert into public.company_admin_provisioning (
    company_id,
    idempotency_key,
    admin_email,
    admin_display_name,
    state,
    email_attested,
    attested_by,
    attested_at,
    handoff
  )
  values (
    v_company_id,
    v_key,
    v_admin_email,
    v_admin_name,
    'company_recorded',
    true,
    v_actor,
    now(),
    'not_issued'
  )
  returning id into v_provisioning_id;

  insert into public.company_lifecycle_events (
    company_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    reason,
    outcome,
    correlation_id
  )
  values (
    v_company_id,
    v_actor,
    'company_created',
    null,
    'pending_setup',
    'onboarding',
    'succeeded',
    v_key
  );

  return jsonb_build_object(
    'company_id', v_company_id,
    'provisioning_id', v_provisioning_id,
    'company_code', v_company_code,
    'registration_country', v_country,
    'default_currency', v_currency,
    'timezone', v_timezone,
    'lifecycle_status', 'pending_setup',
    'reused', false
  );
end;
$$;

comment on function public.begin_company_onboarding(
  text, text, text, text, text, boolean, text, text, text, text, text, boolean
) is
  'Platform Owner company onboarding. Country forces currency, timezone, and compliance route. Does not create an Auth user or return a password.';

revoke all on function public.begin_company_onboarding(
  text, text, text, text, text, boolean, text, text, text, text, text, boolean
) from public;
revoke all on function public.begin_company_onboarding(
  text, text, text, text, text, boolean, text, text, text, text, text, boolean
) from anon;
grant execute on function public.begin_company_onboarding(
  text, text, text, text, text, boolean, text, text, text, text, text, boolean
) to authenticated;

-- ---------------------------------------------------------------------------
-- transition_company_lifecycle
-- ---------------------------------------------------------------------------

create or replace function public.transition_company_lifecycle(
  p_company_id uuid,
  p_next_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_from text;
  v_next text := btrim(coalesce(p_next_status, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_allowed boolean := false;
  v_ready boolean;
begin
  perform public.require_platform_owner();

  if v_actor is null or p_company_id is null then
    raise exception 'permission denied: platform owner required'
      using errcode = '42501';
  end if;

  if char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'lifecycle_reason_required'
      using errcode = 'P0001';
  end if;

  select c.lifecycle_status
  into v_from
  from public.companies c
  where c.id = p_company_id
  for update;

  if not found then
    raise exception 'company_not_found'
      using errcode = 'P0001';
  end if;

  if v_next = 'archived' and v_from <> 'archived' then
    v_allowed := true;
  elsif v_from = 'pending_setup' and v_next = 'active' then
    v_allowed := true;
  elsif v_from = 'active' and v_next in ('paused', 'suspended') then
    v_allowed := true;
  elsif v_from = 'paused' and v_next in ('active', 'suspended') then
    v_allowed := true;
  elsif v_from = 'suspended' and v_next = 'active' then
    v_allowed := true;
  end if;

  if not v_allowed then
    raise exception 'lifecycle_transition_rejected'
      using errcode = 'P0001';
  end if;

  if v_from = 'pending_setup' and v_next = 'active' then
    select
      exists (
        select 1
        from public.company_memberships m
        where m.company_id = p_company_id
          and m.founding_admin
          and m.status = 'active'
      )
      and exists (
        select 1
        from public.company_memberships m
        join public.account_security s on s.user_id = m.user_id
        where m.company_id = p_company_id
          and m.founding_admin
          and m.status = 'active'
      )
      and exists (
        select 1
        from public.company_admin_provisioning p
        where p.company_id = p_company_id
          and p.state = 'linked'
          and p.handoff = 'issued'
      )
      and exists (
        select 1
        from public.company_compliance_profiles c
        where c.company_id = p_company_id
          and c.setup_state = 'not_configured'
      )
    into v_ready;

    if not coalesce(v_ready, false) then
      raise exception 'activation_requirements_missing'
        using errcode = 'P0001';
    end if;
  end if;

  update public.companies
  set
    lifecycle_status = v_next,
    updated_at = now()
  where id = p_company_id;

  insert into public.company_lifecycle_events (
    company_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    reason,
    outcome
  )
  values (
    p_company_id,
    v_actor,
    'lifecycle_transition',
    v_from,
    v_next,
    v_reason,
    'succeeded'
  );

  return jsonb_build_object(
    'company_id', p_company_id,
    'from_status', v_from,
    'to_status', v_next
  );
end;
$$;

comment on function public.transition_company_lifecycle(uuid, text, text) is
  'Platform Owner lifecycle transition with a row lock and an append-only event. Activation requires a linked founding admin, account security, issued handoff, and a compliance row. Subscription intent is not an entitlement.';

revoke all on function public.transition_company_lifecycle(uuid, text, text) from public;
revoke all on function public.transition_company_lifecycle(uuid, text, text) from anon;
grant execute on function public.transition_company_lifecycle(uuid, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- get_company_onboarding (owner) and get_my_company_onboarding (founding admin)
-- ---------------------------------------------------------------------------

create or replace function public.get_company_onboarding(p_company_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_company public.companies%rowtype;
  v_compliance jsonb;
  v_intent jsonb;
  v_provisioning jsonb;
  v_events jsonb;
begin
  perform public.require_platform_owner();

  select *
  into v_company
  from public.companies c
  where c.id = p_company_id;

  if not found then
    raise exception 'company_not_found'
      using errcode = 'P0001';
  end if;

  select jsonb_build_object(
    'registration_country', cp.registration_country,
    'route_key', cp.route_key,
    'setup_state', cp.setup_state
  )
  into v_compliance
  from public.company_compliance_profiles cp
  where cp.company_id = p_company_id;

  select jsonb_build_object(
    'requested_plan_code', si.requested_plan_code,
    'trial_requested', si.trial_requested,
    'label', 'pending_phase_10'
  )
  into v_intent
  from public.company_subscription_intents si
  where si.company_id = p_company_id;

  select jsonb_build_object(
    'id', p.id,
    'admin_email', p.admin_email,
    'admin_display_name', p.admin_display_name,
    'state', p.state,
    'handoff', p.handoff,
    'email_attested', p.email_attested,
    'auth_user_id', p.auth_user_id,
    'failure_code', p.failure_code
  )
  into v_provisioning
  from public.company_admin_provisioning p
  where p.company_id = p_company_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'event_type', e.event_type,
        'from_status', e.from_status,
        'to_status', e.to_status,
        'reason', e.reason,
        'outcome', e.outcome,
        'created_at', e.created_at
      )
      order by e.created_at desc
    ),
    '[]'::jsonb
  )
  into v_events
  from (
    select *
    from public.company_lifecycle_events e
    where e.company_id = p_company_id
    order by e.created_at desc
    limit 20
  ) e;

  return jsonb_build_object(
    'company',
    jsonb_build_object(
      'id', v_company.id,
      'company_code', v_company.company_code,
      'legal_name', v_company.legal_name,
      'display_name', v_company.display_name,
      'registration_country', v_company.registration_country,
      'default_currency', v_company.default_currency,
      'timezone', v_company.timezone,
      'lifecycle_status', v_company.lifecycle_status,
      'contact_email', v_company.contact_email,
      'contact_phone', v_company.contact_phone,
      'locality', v_company.locality,
      'created_at', v_company.created_at
    ),
    'compliance', v_compliance,
    'subscription_intent', v_intent,
    'provisioning', v_provisioning,
    'events', v_events
  );
end;
$$;

comment on function public.get_company_onboarding(uuid) is
  'Platform Owner onboarding summary. No password. Compliance remains not_configured until Phase 67.';

revoke all on function public.get_company_onboarding(uuid) from public;
revoke all on function public.get_company_onboarding(uuid) from anon;
grant execute on function public.get_company_onboarding(uuid) to authenticated;

create or replace function public.get_my_company_onboarding()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_rows jsonb;
begin
  if v_uid is null or public.password_change_required() then
    raise exception 'permission denied: initial password change required'
      using errcode = '42501';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'company_id', c.id,
        'company_code', c.company_code,
        'legal_name', c.legal_name,
        'display_name', c.display_name,
        'registration_country', c.registration_country,
        'default_currency', c.default_currency,
        'timezone', c.timezone,
        'lifecycle_status', c.lifecycle_status,
        'compliance',
        jsonb_build_object(
          'route_key', cp.route_key,
          'setup_state', cp.setup_state
        ),
        'subscription_intent',
        jsonb_build_object('label', 'pending_phase_10')
      )
      order by c.company_code
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.company_memberships m
  join public.companies c on c.id = m.company_id
  left join public.company_compliance_profiles cp on cp.company_id = c.id
  where m.user_id = v_uid
    and m.founding_admin
    and m.status = 'active';

  if v_rows = '[]'::jsonb then
    raise exception 'permission denied'
      using errcode = '42501';
  end if;

  return v_rows;
end;
$$;

comment on function public.get_my_company_onboarding() is
  'Founding admin summary for the caller only, after the initial password gate is clear. No other company, no platform event reasons, no password.';

revoke all on function public.get_my_company_onboarding() from public;
revoke all on function public.get_my_company_onboarding() from anon;
grant execute on function public.get_my_company_onboarding() to authenticated;

-- ---------------------------------------------------------------------------
-- Service-role provisioning RPCs. No password arguments.
-- ---------------------------------------------------------------------------

create or replace function public.read_provisioning_for_service(p_provisioning_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_row jsonb;
begin
  perform public.assert_service_role();

  select jsonb_build_object(
    'id', p.id,
    'company_id', p.company_id,
    'admin_email', p.admin_email,
    'admin_display_name', p.admin_display_name,
    'auth_user_id', p.auth_user_id,
    'state', p.state,
    'handoff', p.handoff,
    'email_attested', p.email_attested,
    'idempotency_key', p.idempotency_key
  )
  into v_row
  from public.company_admin_provisioning p
  where p.id = p_provisioning_id;

  if v_row is null then
    raise exception 'provisioning_not_found'
      using errcode = 'P0001';
  end if;

  return v_row;
end;
$$;

comment on function public.read_provisioning_for_service(uuid) is
  'Service-role read of provisioning state. No password column exists.';

revoke all on function public.read_provisioning_for_service(uuid) from public;
revoke all on function public.read_provisioning_for_service(uuid) from anon;
revoke all on function public.read_provisioning_for_service(uuid) from authenticated;
grant execute on function public.read_provisioning_for_service(uuid) to service_role;

create or replace function public.claim_founding_admin_auth(
  p_provisioning_id uuid,
  p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_auth_email text;
  v_auth_user uuid;
  v_handoff text;
  v_state text;
begin
  perform public.assert_service_role();

  select p.admin_email, p.auth_user_id, p.handoff, p.state
  into v_email, v_auth_user, v_handoff, v_state
  from public.company_admin_provisioning p
  where p.id = p_provisioning_id
  for update;

  if not found then
    raise exception 'provisioning_not_found'
      using errcode = 'P0001';
  end if;

  if v_handoff = 'issued' then
    if v_auth_user is distinct from p_auth_user_id then
      raise exception 'handoff_already_issued'
        using errcode = 'P0001';
    end if;
    return;
  end if;

  select lower(btrim(u.email))
  into v_auth_email
  from auth.users u
  where u.id = p_auth_user_id;

  if v_auth_email is null or v_auth_email is distinct from v_email then
    raise exception 'auth_email_mismatch'
      using errcode = 'P0001';
  end if;

  if v_auth_user is not null and v_auth_user is distinct from p_auth_user_id then
    raise exception 'provision_user_mismatch'
      using errcode = 'P0001';
  end if;

  update public.company_admin_provisioning
  set
    auth_user_id = p_auth_user_id,
    state = case when v_state = 'linked' then 'linked' else 'auth_created' end,
    failure_code = null,
    updated_at = now()
  where id = p_provisioning_id;
end;
$$;

comment on function public.claim_founding_admin_auth(uuid, uuid) is
  'Stores the Auth user id for a provisioning row after the email matches. Does not attach membership or return a password.';

revoke all on function public.claim_founding_admin_auth(uuid, uuid) from public;
revoke all on function public.claim_founding_admin_auth(uuid, uuid) from anon;
revoke all on function public.claim_founding_admin_auth(uuid, uuid) from authenticated;
grant execute on function public.claim_founding_admin_auth(uuid, uuid) to service_role;

create or replace function public.attach_founding_admin(
  p_provisioning_id uuid,
  p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_email text;
  v_name text;
  v_auth_user uuid;
  v_attested_by uuid;
  v_state text;
  v_auth_email text;
begin
  perform public.assert_service_role();

  select p.company_id, p.admin_email, p.admin_display_name, p.auth_user_id, p.attested_by, p.state
  into v_company_id, v_email, v_name, v_auth_user, v_attested_by, v_state
  from public.company_admin_provisioning p
  where p.id = p_provisioning_id
  for update;

  if not found then
    raise exception 'provisioning_not_found'
      using errcode = 'P0001';
  end if;

  if v_auth_user is not null and v_auth_user is distinct from p_auth_user_id then
    raise exception 'provision_user_mismatch'
      using errcode = 'P0001';
  end if;

  select lower(btrim(u.email))
  into v_auth_email
  from auth.users u
  where u.id = p_auth_user_id;

  if v_auth_email is null or v_auth_email is distinct from v_email then
    raise exception 'auth_email_mismatch'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.company_memberships m
    where m.company_id = v_company_id
      and m.founding_admin
      and m.user_id is distinct from p_auth_user_id
  ) then
    raise exception 'founding_admin_exists'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.company_memberships m
    where m.company_id = v_company_id
      and m.user_id = p_auth_user_id
      and m.founding_admin = false
  ) then
    raise exception 'membership_conflict'
      using errcode = 'P0001';
  end if;

  insert into public.user_profiles (user_id, display_name)
  values (p_auth_user_id, v_name)
  on conflict (user_id) do update
  set
    display_name = coalesce(public.user_profiles.display_name, excluded.display_name),
    updated_at = now();

  begin
    insert into public.company_memberships (
      company_id,
      user_id,
      status,
      founding_admin,
      created_by
    )
    values (
      v_company_id,
      p_auth_user_id,
      'active',
      true,
      v_attested_by
    )
    on conflict (company_id, user_id) do nothing;
  exception
    when unique_violation then
      raise exception 'founding_admin_exists'
        using errcode = 'P0001';
  end;

  if not exists (
    select 1
    from public.company_memberships m
    where m.company_id = v_company_id
      and m.user_id = p_auth_user_id
      and m.founding_admin
      and m.status = 'active'
  ) then
    raise exception 'membership_conflict'
      using errcode = 'P0001';
  end if;

  insert into public.account_security (
    user_id,
    must_change_password,
    required_at,
    completed_at
  )
  values (
    p_auth_user_id,
    true,
    now(),
    null
  )
  on conflict (user_id) do nothing;

  if not exists (
    select 1
    from public.account_security s
    where s.user_id = p_auth_user_id
  ) then
    raise exception 'account_security_missing'
      using errcode = 'P0001';
  end if;

  update public.company_admin_provisioning
  set
    auth_user_id = p_auth_user_id,
    state = 'linked',
    failure_code = null,
    updated_at = now()
  where id = p_provisioning_id;

  if v_state is distinct from 'linked' then
    insert into public.company_lifecycle_events (
      company_id,
      actor_user_id,
      event_type,
      from_status,
      to_status,
      reason,
      outcome
    )
    values (
      v_company_id,
      v_attested_by,
      'provision_linked',
      null,
      null,
      'founding admin linked',
      'succeeded'
    );
  end if;
end;
$$;

comment on function public.attach_founding_admin(uuid, uuid) is
  'Links the attested Auth user as the single founding admin and inserts account_security when missing. Refuses a second founding admin and an email mismatch. Does not reset an unrelated user.';

revoke all on function public.attach_founding_admin(uuid, uuid) from public;
revoke all on function public.attach_founding_admin(uuid, uuid) from anon;
revoke all on function public.attach_founding_admin(uuid, uuid) from authenticated;
grant execute on function public.attach_founding_admin(uuid, uuid) to service_role;

create or replace function public.mark_provision_handoff(p_provisioning_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_state text;
  v_handoff text;
  v_attested_by uuid;
begin
  perform public.assert_service_role();

  select p.company_id, p.state, p.handoff, p.attested_by
  into v_company_id, v_state, v_handoff, v_attested_by
  from public.company_admin_provisioning p
  where p.id = p_provisioning_id
  for update;

  if not found then
    raise exception 'provisioning_not_found'
      using errcode = 'P0001';
  end if;

  if v_state is distinct from 'linked' then
    raise exception 'provision_not_linked'
      using errcode = 'P0001';
  end if;

  if v_handoff = 'issued' then
    return;
  end if;

  update public.company_admin_provisioning
  set
    handoff = 'issued',
    updated_at = now()
  where id = p_provisioning_id;

  insert into public.company_lifecycle_events (
    company_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    reason,
    outcome
  )
  values (
    v_company_id,
    v_attested_by,
    'handoff_issued',
    null,
    null,
    'temporary password issued once',
    'succeeded'
  );
end;
$$;

comment on function public.mark_provision_handoff(uuid) is
  'Marks credential handoff issued after the founding admin is linked. Does not store or return a password.';

revoke all on function public.mark_provision_handoff(uuid) from public;
revoke all on function public.mark_provision_handoff(uuid) from anon;
revoke all on function public.mark_provision_handoff(uuid) from authenticated;
grant execute on function public.mark_provision_handoff(uuid) to service_role;

create or replace function public.record_provision_failure(
  p_provisioning_id uuid,
  p_code text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.assert_service_role();

  if p_code is null
     or p_code not in ('email_conflict', 'auth_failed', 'link_failed') then
    raise exception 'failure_code_invalid'
      using errcode = 'P0001';
  end if;

  update public.company_admin_provisioning
  set
    failure_code = p_code,
    updated_at = now()
  where id = p_provisioning_id
    and handoff = 'not_issued'
    and state in ('company_recorded', 'auth_created');
end;
$$;

comment on function public.record_provision_failure(uuid, text) is
  'Stores a sanitized provisioning failure code. Does not attach membership or change a password.';

revoke all on function public.record_provision_failure(uuid, text) from public;
revoke all on function public.record_provision_failure(uuid, text) from anon;
revoke all on function public.record_provision_failure(uuid, text) from authenticated;
grant execute on function public.record_provision_failure(uuid, text) to service_role;

create or replace function public.require_founding_admin_password_change(
  p_provisioning_id uuid,
  p_auth_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id uuid;
  v_attested_by uuid;
begin
  perform public.assert_service_role();

  select p.company_id, p.attested_by
  into v_company_id, v_attested_by
  from public.company_admin_provisioning p
  where p.id = p_provisioning_id
    and p.auth_user_id = p_auth_user_id
    and p.state = 'linked'
  for update;

  if not found then
    raise exception 'unrelated_user'
      using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.company_memberships m
    where m.company_id = v_company_id
      and m.user_id = p_auth_user_id
      and m.founding_admin
      and m.status = 'active'
  ) then
    raise exception 'unrelated_user'
      using errcode = 'P0001';
  end if;

  insert into public.account_security (
    user_id,
    must_change_password,
    required_at,
    completed_at
  )
  values (
    p_auth_user_id,
    true,
    now(),
    null
  )
  on conflict (user_id) do update
  set
    must_change_password = true,
    completed_at = null,
    required_at = now();

  insert into public.company_lifecycle_events (
    company_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    reason,
    outcome
  )
  values (
    v_company_id,
    v_attested_by,
    'password_reset',
    null,
    null,
    'temporary password replaced',
    'succeeded'
  );
end;
$$;

comment on function public.require_founding_admin_password_change(uuid, uuid) is
  'Sets must_change_password for the linked founding admin of this provisioning row only. Does not store or return a password.';

revoke all on function public.require_founding_admin_password_change(uuid, uuid) from public;
revoke all on function public.require_founding_admin_password_change(uuid, uuid) from anon;
revoke all on function public.require_founding_admin_password_change(uuid, uuid) from authenticated;
grant execute on function public.require_founding_admin_password_change(uuid, uuid) to service_role;

-- ---------------------------------------------------------------------------
-- Overview counts include paused. The five statuses sum to total.
-- ---------------------------------------------------------------------------

create or replace function public.platform_company_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  pending_setup integer := 0;
  active_count integer := 0;
  paused_count integer := 0;
  suspended_count integer := 0;
  archived_count integer := 0;
  total_count integer := 0;
  company_rows jsonb := '[]'::jsonb;
begin
  if not public.is_platform_owner() then
    raise exception 'permission denied: platform owner required'
      using errcode = '42501';
  end if;

  select
    count(*) filter (where c.lifecycle_status = 'pending_setup'),
    count(*) filter (where c.lifecycle_status = 'active'),
    count(*) filter (where c.lifecycle_status = 'paused'),
    count(*) filter (where c.lifecycle_status = 'suspended'),
    count(*) filter (where c.lifecycle_status = 'archived'),
    count(*)
  into
    pending_setup,
    active_count,
    paused_count,
    suspended_count,
    archived_count,
    total_count
  from public.companies c;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'company_code', c.company_code,
        'legal_name', c.legal_name,
        'display_name', c.display_name,
        'registration_country', c.registration_country,
        'lifecycle_status', c.lifecycle_status,
        'created_at', c.created_at
      )
      order by c.created_at desc, c.company_code asc
    ),
    '[]'::jsonb
  )
  into company_rows
  from public.companies c;

  return jsonb_build_object(
    'counts',
    jsonb_build_object(
      'pending_setup', pending_setup,
      'active', active_count,
      'paused', paused_count,
      'suspended', suspended_count,
      'archived', archived_count,
      'total', total_count
    ),
    'companies',
    company_rows
  );
end;
$$;

comment on function public.platform_company_overview() is
  'SECURITY DEFINER aggregate for Platform Owners only. Counts pending_setup, active, paused, suspended, and archived. Those five sum to total.';
