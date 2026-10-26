-- Phase 10: subscription plans, entitlements, and manual payment records.
-- No seed prices. No payment gateway. No FX. Extends company_is_operational.

-- ---------------------------------------------------------------------------
-- Plan catalogue
-- ---------------------------------------------------------------------------

create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plans_code_check
    check (code ~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$'),
  constraint subscription_plans_name_check
    check (char_length(name) between 1 and 120),
  constraint subscription_plans_description_check
    check (description is null or char_length(description) <= 2000)
);

create unique index subscription_plans_code_uidx
  on public.subscription_plans (lower(code));

comment on table public.subscription_plans is
  'Stable plan catalogue identity. Commercial terms live on immutable versions.';

create table public.subscription_plan_versions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  version_number integer not null,
  status text not null,
  registration_country text not null,
  currency text not null,
  billing_interval text not null,
  price_kind text not null,
  amount numeric(14, 2) not null,
  trial_days integer not null default 0,
  grace_days integer not null default 0,
  entitlements jsonb not null default '{}'::jsonb,
  effective_from timestamptz not null default now(),
  published_at timestamptz,
  retired_at timestamptz,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscription_plan_versions_plan_version_key
    unique (plan_id, version_number),
  constraint subscription_plan_versions_version_check
    check (version_number >= 1),
  constraint subscription_plan_versions_status_check
    check (status in ('draft', 'published', 'retired')),
  constraint subscription_plan_versions_country_check
    check (registration_country in ('Nepal', 'India')),
  constraint subscription_plan_versions_currency_check
    check (currency in ('NPR', 'INR')),
  constraint subscription_plan_versions_country_currency_check
    check (
      (registration_country = 'Nepal' and currency = 'NPR')
      or (registration_country = 'India' and currency = 'INR')
    ),
  constraint subscription_plan_versions_interval_check
    check (billing_interval in ('monthly', 'annual', 'lifetime')),
  constraint subscription_plan_versions_price_kind_check
    check (price_kind in ('paid', 'free')),
  constraint subscription_plan_versions_amount_check
    check (
      amount = round(amount, 2)
      and (
        (price_kind = 'free' and amount = 0)
        or (price_kind = 'paid' and amount > 0)
      )
    ),
  constraint subscription_plan_versions_trial_days_check
    check (trial_days >= 0 and trial_days <= 3650),
  constraint subscription_plan_versions_grace_days_check
    check (grace_days >= 0 and grace_days <= 365),
  constraint subscription_plan_versions_entitlements_object_check
    check (jsonb_typeof(entitlements) = 'object'),
  constraint subscription_plan_versions_publish_check
    check (
      (status = 'draft' and published_at is null and retired_at is null)
      or (status = 'published' and published_at is not null and retired_at is null)
      or (status = 'retired' and published_at is not null and retired_at is not null)
    )
);

create index subscription_plan_versions_plan_status_idx
  on public.subscription_plan_versions (plan_id, status);

create index subscription_plan_versions_country_status_idx
  on public.subscription_plan_versions (registration_country, status);

comment on table public.subscription_plan_versions is
  'Immutable commercial terms for a plan. Publish creates a new version; existing subscriptions keep their snapshot.';

-- ---------------------------------------------------------------------------
-- Company subscriptions
-- ---------------------------------------------------------------------------

create table public.company_subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  plan_id uuid not null references public.subscription_plans (id) on delete restrict,
  plan_version_id uuid not null references public.subscription_plan_versions (id) on delete restrict,
  status text not null,
  term_interval text not null,
  billing_currency text not null,
  price_kind text not null,
  amount numeric(14, 2) not null,
  trial_days integer not null default 0,
  grace_days integer not null default 0,
  entitlements jsonb not null default '{}'::jsonb,
  starts_at timestamptz not null,
  ends_at timestamptz,
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  period_ends_at timestamptz,
  grace_ends_at timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  is_current boolean not null default true,
  idempotency_key text not null,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_subscriptions_status_check
    check (
      status in (
        'trial',
        'active',
        'grace',
        'overdue',
        'suspended',
        'cancelled'
      )
    ),
  constraint company_subscriptions_interval_check
    check (term_interval in ('monthly', 'annual', 'lifetime')),
  constraint company_subscriptions_currency_check
    check (billing_currency in ('NPR', 'INR')),
  constraint company_subscriptions_price_kind_check
    check (price_kind in ('paid', 'free')),
  constraint company_subscriptions_amount_check
    check (
      amount = round(amount, 2)
      and (
        (price_kind = 'free' and amount = 0)
        or (price_kind = 'paid' and amount > 0)
      )
    ),
  constraint company_subscriptions_annual_end_check
    check (
      term_interval <> 'annual'
      or ends_at is not null
    ),
  constraint company_subscriptions_lifetime_end_check
    check (
      term_interval <> 'lifetime'
      or ends_at is null
    ),
  constraint company_subscriptions_trial_window_check
    check (
      (
        status <> 'trial'
        and trial_started_at is null
        and trial_ends_at is null
      )
      or (
        trial_started_at is not null
        and trial_ends_at is not null
        and trial_ends_at > trial_started_at
      )
    ),
  constraint company_subscriptions_idempotency_check
    check (idempotency_key ~ '^[A-Za-z0-9_-]{8,80}$')
);

create unique index company_subscriptions_one_current_idx
  on public.company_subscriptions (company_id)
  where is_current;

create unique index company_subscriptions_idempotency_uidx
  on public.company_subscriptions (idempotency_key);

create index company_subscriptions_status_idx
  on public.company_subscriptions (status);

create index company_subscriptions_plan_version_idx
  on public.company_subscriptions (plan_version_id);

create index company_subscriptions_company_created_idx
  on public.company_subscriptions (company_id, created_at desc);

comment on table public.company_subscriptions is
  'Authoritative company subscription term with immutable commercial snapshot. One current row per company.';

-- ---------------------------------------------------------------------------
-- Payments, adjustments, events
-- ---------------------------------------------------------------------------

create table public.subscription_payments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  subscription_id uuid not null references public.company_subscriptions (id) on delete restrict,
  amount numeric(14, 2) not null,
  currency text not null,
  received_on date not null,
  payment_method text not null,
  external_reference text,
  notes text,
  status text not null default 'recorded',
  idempotency_key text not null,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint subscription_payments_amount_check
    check (amount = round(amount, 2) and amount > 0),
  constraint subscription_payments_currency_check
    check (currency in ('NPR', 'INR')),
  constraint subscription_payments_method_check
    check (
      payment_method in (
        'bank_transfer',
        'cash',
        'cheque',
        'esewa_recorded',
        'khalti_recorded',
        'other'
      )
    ),
  constraint subscription_payments_status_check
    check (status in ('recorded', 'reversed')),
  constraint subscription_payments_reference_check
    check (external_reference is null or char_length(external_reference) <= 120),
  constraint subscription_payments_notes_check
    check (notes is null or char_length(notes) <= 2000),
  constraint subscription_payments_idempotency_check
    check (idempotency_key ~ '^[A-Za-z0-9_-]{8,80}$')
);

create unique index subscription_payments_idempotency_uidx
  on public.subscription_payments (idempotency_key);

create index subscription_payments_subscription_idx
  on public.subscription_payments (subscription_id, created_at desc);

create index subscription_payments_company_idx
  on public.subscription_payments (company_id, created_at desc);

comment on table public.subscription_payments is
  'Manual SaaS subscription receipts. Not operational ERP accounting. No card data. Append-only except status reverse via compensating flow.';

create table public.subscription_adjustments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete restrict,
  subscription_id uuid not null references public.company_subscriptions (id) on delete restrict,
  payment_id uuid references public.subscription_payments (id) on delete restrict,
  kind text not null,
  amount numeric(14, 2) not null,
  currency text not null,
  effective_on date not null,
  reason text not null,
  external_reference text,
  idempotency_key text not null,
  recorded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint subscription_adjustments_kind_check
    check (kind in ('credit', 'debit', 'waiver', 'reversal')),
  constraint subscription_adjustments_amount_check
    check (amount = round(amount, 2) and amount > 0),
  constraint subscription_adjustments_currency_check
    check (currency in ('NPR', 'INR')),
  constraint subscription_adjustments_reason_check
    check (char_length(reason) between 3 and 500),
  constraint subscription_adjustments_reference_check
    check (external_reference is null or char_length(external_reference) <= 120),
  constraint subscription_adjustments_idempotency_check
    check (idempotency_key ~ '^[A-Za-z0-9_-]{8,80}$'),
  constraint subscription_adjustments_reversal_payment_check
    check (
      kind <> 'reversal'
      or payment_id is not null
    )
);

create unique index subscription_adjustments_idempotency_uidx
  on public.subscription_adjustments (idempotency_key);

create index subscription_adjustments_subscription_idx
  on public.subscription_adjustments (subscription_id, created_at desc);

comment on table public.subscription_adjustments is
  'Credits, debits, waivers, and payment reversals for platform subscriptions. Does not extend terms by itself.';

create table public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete restrict,
  subscription_id uuid references public.company_subscriptions (id) on delete set null,
  plan_id uuid references public.subscription_plans (id) on delete set null,
  plan_version_id uuid references public.subscription_plan_versions (id) on delete set null,
  payment_id uuid references public.subscription_payments (id) on delete set null,
  adjustment_id uuid references public.subscription_adjustments (id) on delete set null,
  actor_user_id uuid references auth.users (id) on delete set null,
  action text not null,
  reason text,
  outcome text not null,
  idempotency_key text,
  before_state jsonb not null default '{}'::jsonb,
  after_state jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint subscription_events_action_check
    check (
      action in (
        'plan_draft_created',
        'plan_draft_updated',
        'plan_published',
        'plan_retired',
        'intent_resolved',
        'intent_blocked',
        'trial_converted',
        'plan_changed',
        'term_extended',
        'status_refreshed',
        'subscription_suspended',
        'subscription_reactivated',
        'subscription_cancelled',
        'payment_recorded',
        'payment_reversed',
        'adjustment_recorded'
      )
    ),
  constraint subscription_events_outcome_check
    check (outcome in ('succeeded', 'failed')),
  constraint subscription_events_reason_check
    check (reason is null or char_length(reason) between 3 and 500),
  constraint subscription_events_idempotency_check
    check (
      idempotency_key is null
      or idempotency_key ~ '^[A-Za-z0-9_-]{8,80}$'
    )
);

create unique index subscription_events_idempotency_uidx
  on public.subscription_events (idempotency_key)
  where idempotency_key is not null;

create index subscription_events_company_created_idx
  on public.subscription_events (company_id, created_at desc);

create index subscription_events_subscription_created_idx
  on public.subscription_events (subscription_id, created_at desc);

comment on table public.subscription_events is
  'Append-only subscription history for Phase 10. Phase 11 may read these rows; do not duplicate into platform_authority_audit_events.';

-- ---------------------------------------------------------------------------
-- Intent resolution columns (additive)
-- ---------------------------------------------------------------------------

alter table public.company_subscription_intents
  add column if not exists resolution_status text not null default 'pending',
  add column if not exists resolved_subscription_id uuid
    references public.company_subscriptions (id) on delete set null,
  add column if not exists resolved_by uuid
    references auth.users (id) on delete set null,
  add column if not exists resolved_at timestamptz,
  add column if not exists resolution_code text,
  add column if not exists resolution_idempotency_key text;

alter table public.company_subscription_intents
  drop constraint if exists company_subscription_intents_resolution_status_check;

alter table public.company_subscription_intents
  add constraint company_subscription_intents_resolution_status_check
    check (resolution_status in ('pending', 'resolved', 'blocked'));

alter table public.company_subscription_intents
  drop constraint if exists company_subscription_intents_resolution_code_check;

alter table public.company_subscription_intents
  add constraint company_subscription_intents_resolution_code_check
    check (
      resolution_code is null
      or resolution_code in (
        'intent_plan_missing',
        'plan_not_assignable',
        'currency_mismatch',
        'subscription_exists',
        'resolved'
      )
    );

alter table public.company_subscription_intents
  drop constraint if exists company_subscription_intents_resolution_idempotency_check;

alter table public.company_subscription_intents
  add constraint company_subscription_intents_resolution_idempotency_check
    check (
      resolution_idempotency_key is null
      or resolution_idempotency_key ~ '^[A-Za-z0-9_-]{8,80}$'
    );

comment on column public.company_subscription_intents.resolution_status is
  'Phase 10 resolution of the onboarding plan/trial intent. Does not invent a term or price.';

-- ---------------------------------------------------------------------------
-- RLS and grants: no client table access
-- ---------------------------------------------------------------------------

alter table public.subscription_plans enable row level security;
alter table public.subscription_plans force row level security;
alter table public.subscription_plan_versions enable row level security;
alter table public.subscription_plan_versions force row level security;
alter table public.company_subscriptions enable row level security;
alter table public.company_subscriptions force row level security;
alter table public.subscription_payments enable row level security;
alter table public.subscription_payments force row level security;
alter table public.subscription_adjustments enable row level security;
alter table public.subscription_adjustments force row level security;
alter table public.subscription_events enable row level security;
alter table public.subscription_events force row level security;

revoke all on table public.subscription_plans from public;
revoke all on table public.subscription_plans from anon;
revoke all on table public.subscription_plans from authenticated;
revoke all on table public.subscription_plan_versions from public;
revoke all on table public.subscription_plan_versions from anon;
revoke all on table public.subscription_plan_versions from authenticated;
revoke all on table public.company_subscriptions from public;
revoke all on table public.company_subscriptions from anon;
revoke all on table public.company_subscriptions from authenticated;
revoke all on table public.subscription_payments from public;
revoke all on table public.subscription_payments from anon;
revoke all on table public.subscription_payments from authenticated;
revoke all on table public.subscription_adjustments from public;
revoke all on table public.subscription_adjustments from anon;
revoke all on table public.subscription_adjustments from authenticated;
revoke all on table public.subscription_events from public;
revoke all on table public.subscription_events from anon;
revoke all on table public.subscription_events from authenticated;

-- ---------------------------------------------------------------------------
-- Entitlement helpers
-- ---------------------------------------------------------------------------

create or replace function public.subscription_entitlements_valid(p_entitlements jsonb)
returns boolean
language plpgsql
immutable
security invoker
set search_path = ''
as $$
declare
  v_key text;
  v_value jsonb;
  v_allowed text[] := array[
    'max_active_projects',
    'max_users',
    'marketplace_enabled',
    'mobile_app_enabled',
    'takeoff_enabled',
    'bim_enabled'
  ];
begin
  if p_entitlements is null or jsonb_typeof(p_entitlements) is distinct from 'object' then
    return false;
  end if;

  for v_key, v_value in
    select key, value from jsonb_each(p_entitlements)
  loop
    if not (v_key = any (v_allowed)) then
      return false;
    end if;
    if v_key in ('max_active_projects', 'max_users') then
      if jsonb_typeof(v_value) is distinct from 'number'
         or (v_value #>> '{}')::numeric < 0
         or (v_value #>> '{}')::numeric <> trunc((v_value #>> '{}')::numeric) then
        return false;
      end if;
    else
      if jsonb_typeof(v_value) is distinct from 'boolean' then
        return false;
      end if;
    end if;
  end loop;

  return true;
end;
$$;

comment on function public.subscription_entitlements_valid(jsonb) is
  'Validates the compact Phase 10 entitlement key set. Unknown keys are rejected.';

revoke all on function public.subscription_entitlements_valid(jsonb) from public;
revoke all on function public.subscription_entitlements_valid(jsonb) from anon;
grant execute on function public.subscription_entitlements_valid(jsonb) to authenticated;

create or replace function public.subscription_monthly_period_end(p_starts_at timestamptz)
returns timestamptz
language sql
immutable
security invoker
set search_path = ''
as $$
  select p_starts_at + interval '1 month';
$$;

comment on function public.subscription_monthly_period_end(timestamptz) is
  'Month-end aware period end: 31 Jan + 1 month becomes the last day of February.';

revoke all on function public.subscription_monthly_period_end(timestamptz) from public;
revoke all on function public.subscription_monthly_period_end(timestamptz) from anon;
grant execute on function public.subscription_monthly_period_end(timestamptz) to authenticated;

create or replace function public.subscription_effective_status(
  p_status text,
  p_trial_ends_at timestamptz,
  p_period_ends_at timestamptz,
  p_ends_at timestamptz,
  p_grace_ends_at timestamptz,
  p_cancel_at_period_end boolean,
  p_now timestamptz default now()
)
returns text
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_boundary timestamptz;
begin
  if p_status in ('suspended', 'cancelled', 'overdue') then
    return p_status;
  end if;

  if p_status = 'trial' then
    if p_trial_ends_at is null or p_now < p_trial_ends_at then
      return 'trial';
    end if;
    if p_grace_ends_at is not null and p_now < p_grace_ends_at then
      return 'grace';
    end if;
    return 'overdue';
  end if;

  if p_status = 'grace' then
    if p_grace_ends_at is not null and p_now < p_grace_ends_at then
      return 'grace';
    end if;
    return 'overdue';
  end if;

  if p_status = 'active' then
    v_boundary := coalesce(p_period_ends_at, p_ends_at);
    if v_boundary is null or p_now < v_boundary then
      return 'active';
    end if;
    if p_cancel_at_period_end then
      return 'cancelled';
    end if;
    if p_grace_ends_at is not null and p_now < p_grace_ends_at then
      return 'grace';
    end if;
    return 'overdue';
  end if;

  return p_status;
end;
$$;

comment on function public.subscription_effective_status(text, timestamptz, timestamptz, timestamptz, timestamptz, boolean, timestamptz) is
  'Read-time effective subscription status from stored status and UTC boundaries. No cron required.';

revoke all on function public.subscription_effective_status(text, timestamptz, timestamptz, timestamptz, timestamptz, boolean, timestamptz) from public;
revoke all on function public.subscription_effective_status(text, timestamptz, timestamptz, timestamptz, timestamptz, boolean, timestamptz) from anon;
grant execute on function public.subscription_effective_status(text, timestamptz, timestamptz, timestamptz, timestamptz, boolean, timestamptz) to authenticated;

create or replace function public.subscription_status_is_eligible(p_effective_status text)
returns boolean
language sql
immutable
security invoker
set search_path = ''
as $$
  select p_effective_status in ('trial', 'active', 'grace');
$$;

revoke all on function public.subscription_status_is_eligible(text) from public;
revoke all on function public.subscription_status_is_eligible(text) from anon;
grant execute on function public.subscription_status_is_eligible(text) to authenticated;

create or replace function public.get_company_access_decision(p_company_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_lifecycle text;
  v_member boolean := false;
  v_sub public.company_subscriptions%rowtype;
  v_effective text;
  v_reason text;
  v_explanation text;
  v_end timestamptz;
begin
  if v_uid is null then
    return jsonb_build_object(
      'allowed', false,
      'reason_code', 'permission_denied',
      'explanation', 'Sign in is required.',
      'subscription_status', null,
      'relevant_end_at', null
    );
  end if;

  if public.password_change_required() then
    return jsonb_build_object(
      'allowed', false,
      'reason_code', 'password_change_required',
      'explanation', 'Change the initial password before using company data.',
      'subscription_status', null,
      'relevant_end_at', null
    );
  end if;

  select c.lifecycle_status
  into v_lifecycle
  from public.companies c
  where c.id = p_company_id;

  if not found then
    return jsonb_build_object(
      'allowed', false,
      'reason_code', 'company_not_found',
      'explanation', 'That company is not available.',
      'subscription_status', null,
      'relevant_end_at', null
    );
  end if;

  select exists (
    select 1
    from public.company_memberships m
    where m.company_id = p_company_id
      and m.user_id = v_uid
      and m.status = 'active'
  )
  into v_member;

  if not v_member and not public.is_platform_owner() then
    return jsonb_build_object(
      'allowed', false,
      'reason_code', 'permission_denied',
      'explanation', 'You are not a member of this company.',
      'subscription_status', null,
      'relevant_end_at', null
    );
  end if;

  if v_lifecycle is distinct from 'active' then
    return jsonb_build_object(
      'allowed', false,
      'reason_code', 'company_not_active',
      'explanation', 'Company lifecycle does not permit normal use.',
      'subscription_status', null,
      'relevant_end_at', null
    );
  end if;

  select *
  into v_sub
  from public.company_subscriptions s
  where s.company_id = p_company_id
    and s.is_current
  limit 1;

  if not found then
    return jsonb_build_object(
      'allowed', false,
      'reason_code', 'no_subscription',
      'explanation', 'No current subscription is assigned.',
      'subscription_status', null,
      'relevant_end_at', null
    );
  end if;

  v_effective := public.subscription_effective_status(
    v_sub.status,
    v_sub.trial_ends_at,
    v_sub.period_ends_at,
    v_sub.ends_at,
    v_sub.grace_ends_at,
    v_sub.cancel_at_period_end,
    now()
  );

  v_end := case
    when v_effective = 'trial' then v_sub.trial_ends_at
    when v_effective = 'grace' then v_sub.grace_ends_at
    when v_effective in ('active', 'overdue', 'cancelled') then coalesce(v_sub.period_ends_at, v_sub.ends_at)
    else null
  end;

  if public.subscription_status_is_eligible(v_effective) then
    if not v_member then
      return jsonb_build_object(
        'allowed', false,
        'reason_code', 'permission_denied',
        'explanation', 'Platform operators can manage the subscription but do not receive company operational access.',
        'subscription_status', v_effective,
        'relevant_end_at', v_end,
        'entitlements', v_sub.entitlements
      );
    end if;
    return jsonb_build_object(
      'allowed', true,
      'reason_code', 'ok',
      'explanation', 'Company lifecycle and subscription permit normal use.',
      'subscription_status', v_effective,
      'relevant_end_at', v_end,
      'entitlements', v_sub.entitlements
    );
  end if;

  v_reason := case v_effective
    when 'overdue' then
      case
        when v_sub.status = 'trial' then 'trial_expired'
        else 'subscription_overdue'
      end
    when 'suspended' then 'subscription_suspended'
    when 'cancelled' then 'subscription_cancelled'
    else 'period_expired'
  end;

  v_explanation := case v_reason
    when 'trial_expired' then 'The trial has ended and the grace window is closed.'
    when 'subscription_overdue' then 'The subscription is overdue after the grace window.'
    when 'subscription_suspended' then 'The subscription is suspended.'
    when 'subscription_cancelled' then 'The subscription is cancelled.'
    else 'The subscription term has ended.'
  end;

  return jsonb_build_object(
    'allowed', false,
    'reason_code', v_reason,
    'explanation', v_explanation,
    'subscription_status', v_effective,
    'relevant_end_at', v_end,
    'entitlements', v_sub.entitlements
  );
end;
$$;

comment on function public.get_company_access_decision(uuid) is
  'Trusted company access decision from lifecycle, membership, password gate, and subscription eligibility.';

revoke all on function public.get_company_access_decision(uuid) from public;
revoke all on function public.get_company_access_decision(uuid) from anon;
grant execute on function public.get_company_access_decision(uuid) to authenticated;

create or replace function public.company_is_operational(p_company_id uuid)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select (public.get_company_access_decision(p_company_id) ->> 'allowed')::boolean
    ),
    false
  );
$$;

comment on function public.company_is_operational(uuid) is
  'Active membership, active company lifecycle, clear password gate, and eligible subscription (trial, active, or in-window grace).';

revoke all on function public.company_is_operational(uuid) from public;
revoke all on function public.company_is_operational(uuid) from anon;
grant execute on function public.company_is_operational(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Internal event helper
-- ---------------------------------------------------------------------------

create or replace function public.append_subscription_event(
  p_company_id uuid,
  p_subscription_id uuid,
  p_plan_id uuid,
  p_plan_version_id uuid,
  p_payment_id uuid,
  p_adjustment_id uuid,
  p_action text,
  p_reason text,
  p_outcome text,
  p_idempotency_key text,
  p_before jsonb,
  p_after jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  insert into public.subscription_events (
    company_id,
    subscription_id,
    plan_id,
    plan_version_id,
    payment_id,
    adjustment_id,
    actor_user_id,
    action,
    reason,
    outcome,
    idempotency_key,
    before_state,
    after_state
  )
  values (
    p_company_id,
    p_subscription_id,
    p_plan_id,
    p_plan_version_id,
    p_payment_id,
    p_adjustment_id,
    auth.uid(),
    p_action,
    p_reason,
    p_outcome,
    p_idempotency_key,
    coalesce(p_before, '{}'::jsonb),
    coalesce(p_after, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.append_subscription_event(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, text, jsonb, jsonb
) from public;
revoke all on function public.append_subscription_event(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, text, jsonb, jsonb
) from anon;
revoke all on function public.append_subscription_event(
  uuid, uuid, uuid, uuid, uuid, uuid, text, text, text, text, jsonb, jsonb
) from authenticated;

-- ---------------------------------------------------------------------------
-- Plan owner RPCs
-- ---------------------------------------------------------------------------

create or replace function public.create_subscription_plan_draft(
  p_code text,
  p_name text,
  p_description text,
  p_registration_country text,
  p_billing_interval text,
  p_price_kind text,
  p_amount numeric,
  p_trial_days integer,
  p_grace_days integer,
  p_entitlements jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_code text := btrim(coalesce(p_code, ''));
  v_name text := btrim(coalesce(p_name, ''));
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_country text := btrim(coalesce(p_registration_country, ''));
  v_currency text;
  v_interval text := btrim(coalesce(p_billing_interval, ''));
  v_kind text := btrim(coalesce(p_price_kind, ''));
  v_amount numeric(14, 2);
  v_plan_id uuid;
  v_version_id uuid;
begin
  perform public.require_platform_owner();
  if v_actor is null then
    raise exception 'permission denied'
      using errcode = '42501';
  end if;

  if v_code !~ '^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$' then
    raise exception 'plan_code_invalid'
      using errcode = 'P0001';
  end if;
  if char_length(v_name) < 1 or char_length(v_name) > 120 then
    raise exception 'plan_name_invalid'
      using errcode = 'P0001';
  end if;
  if v_country not in ('Nepal', 'India') then
    raise exception 'registration_country_invalid'
      using errcode = 'P0001';
  end if;
  v_currency := case when v_country = 'Nepal' then 'NPR' else 'INR' end;
  if v_interval not in ('monthly', 'annual', 'lifetime') then
    raise exception 'billing_interval_invalid'
      using errcode = 'P0001';
  end if;
  if v_kind not in ('paid', 'free') then
    raise exception 'price_kind_invalid'
      using errcode = 'P0001';
  end if;
  if p_amount is null then
    raise exception 'amount_required'
      using errcode = 'P0001';
  end if;
  v_amount := round(p_amount, 2);
  if v_amount <> p_amount then
    raise exception 'amount_precision_invalid'
      using errcode = 'P0001';
  end if;
  if (v_kind = 'free' and v_amount <> 0) or (v_kind = 'paid' and v_amount <= 0) then
    raise exception 'amount_invalid'
      using errcode = 'P0001';
  end if;
  if coalesce(p_trial_days, -1) < 0 or coalesce(p_trial_days, -1) > 3650 then
    raise exception 'trial_days_invalid'
      using errcode = 'P0001';
  end if;
  if coalesce(p_grace_days, -1) < 0 or coalesce(p_grace_days, -1) > 365 then
    raise exception 'grace_days_invalid'
      using errcode = 'P0001';
  end if;
  if not public.subscription_entitlements_valid(coalesce(p_entitlements, '{}'::jsonb)) then
    raise exception 'entitlements_invalid'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.subscription_plans p where lower(p.code) = lower(v_code)
  ) then
    raise exception 'plan_code_exists'
      using errcode = 'P0001';
  end if;

  insert into public.subscription_plans (code, name, description, created_by)
  values (v_code, v_name, v_description, v_actor)
  returning id into v_plan_id;

  insert into public.subscription_plan_versions (
    plan_id,
    version_number,
    status,
    registration_country,
    currency,
    billing_interval,
    price_kind,
    amount,
    trial_days,
    grace_days,
    entitlements,
    created_by
  )
  values (
    v_plan_id,
    1,
    'draft',
    v_country,
    v_currency,
    v_interval,
    v_kind,
    v_amount,
    p_trial_days,
    p_grace_days,
    coalesce(p_entitlements, '{}'::jsonb),
    v_actor
  )
  returning id into v_version_id;

  perform public.append_subscription_event(
    null,
    null,
    v_plan_id,
    v_version_id,
    null,
    null,
    'plan_draft_created',
    'plan draft created',
    'succeeded',
    null,
    '{}'::jsonb,
    jsonb_build_object('plan_id', v_plan_id, 'version_id', v_version_id, 'code', v_code)
  );

  return jsonb_build_object(
    'plan_id', v_plan_id,
    'version_id', v_version_id,
    'code', v_code,
    'status', 'draft',
    'currency', v_currency,
    'registration_country', v_country
  );
end;
$$;

comment on function public.create_subscription_plan_draft(
  text, text, text, text, text, text, numeric, integer, integer, jsonb
) is
  'Platform Owner creates a draft plan and version 1. No assignment until published.';

revoke all on function public.create_subscription_plan_draft(
  text, text, text, text, text, text, numeric, integer, integer, jsonb
) from public;
revoke all on function public.create_subscription_plan_draft(
  text, text, text, text, text, text, numeric, integer, integer, jsonb
) from anon;
grant execute on function public.create_subscription_plan_draft(
  text, text, text, text, text, text, numeric, integer, integer, jsonb
) to authenticated;

create or replace function public.update_subscription_plan_draft(
  p_version_id uuid,
  p_name text,
  p_description text,
  p_billing_interval text,
  p_price_kind text,
  p_amount numeric,
  p_trial_days integer,
  p_grace_days integer,
  p_entitlements jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_version public.subscription_plan_versions%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_name text := btrim(coalesce(p_name, ''));
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_interval text := btrim(coalesce(p_billing_interval, ''));
  v_kind text := btrim(coalesce(p_price_kind, ''));
  v_amount numeric(14, 2);
begin
  perform public.require_platform_owner();

  select * into v_version
  from public.subscription_plan_versions v
  where v.id = p_version_id
  for update;

  if not found then
    raise exception 'plan_version_not_found'
      using errcode = 'P0001';
  end if;
  if v_version.status is distinct from 'draft' then
    raise exception 'plan_version_not_draft'
      using errcode = 'P0001';
  end if;

  select * into v_plan from public.subscription_plans p where p.id = v_version.plan_id for update;

  if char_length(v_name) < 1 or char_length(v_name) > 120 then
    raise exception 'plan_name_invalid'
      using errcode = 'P0001';
  end if;
  if v_interval not in ('monthly', 'annual', 'lifetime') then
    raise exception 'billing_interval_invalid'
      using errcode = 'P0001';
  end if;
  if v_kind not in ('paid', 'free') then
    raise exception 'price_kind_invalid'
      using errcode = 'P0001';
  end if;
  if p_amount is null then
    raise exception 'amount_required'
      using errcode = 'P0001';
  end if;
  v_amount := round(p_amount, 2);
  if v_amount <> p_amount
     or (v_kind = 'free' and v_amount <> 0)
     or (v_kind = 'paid' and v_amount <= 0) then
    raise exception 'amount_invalid'
      using errcode = 'P0001';
  end if;
  if coalesce(p_trial_days, -1) < 0 or coalesce(p_trial_days, -1) > 3650 then
    raise exception 'trial_days_invalid'
      using errcode = 'P0001';
  end if;
  if coalesce(p_grace_days, -1) < 0 or coalesce(p_grace_days, -1) > 365 then
    raise exception 'grace_days_invalid'
      using errcode = 'P0001';
  end if;
  if not public.subscription_entitlements_valid(coalesce(p_entitlements, '{}'::jsonb)) then
    raise exception 'entitlements_invalid'
      using errcode = 'P0001';
  end if;

  update public.subscription_plans
  set name = v_name,
      description = v_description,
      updated_at = now()
  where id = v_plan.id;

  update public.subscription_plan_versions
  set billing_interval = v_interval,
      price_kind = v_kind,
      amount = v_amount,
      trial_days = p_trial_days,
      grace_days = p_grace_days,
      entitlements = coalesce(p_entitlements, '{}'::jsonb),
      updated_at = now()
  where id = v_version.id;

  perform public.append_subscription_event(
    null,
    null,
    v_plan.id,
    v_version.id,
    null,
    null,
    'plan_draft_updated',
    'plan draft updated',
    'succeeded',
    null,
    jsonb_build_object('amount', v_version.amount, 'interval', v_version.billing_interval),
    jsonb_build_object('amount', v_amount, 'interval', v_interval)
  );

  return jsonb_build_object(
    'plan_id', v_plan.id,
    'version_id', v_version.id,
    'status', 'draft'
  );
end;
$$;

revoke all on function public.update_subscription_plan_draft(
  uuid, text, text, text, text, numeric, integer, integer, jsonb
) from public;
revoke all on function public.update_subscription_plan_draft(
  uuid, text, text, text, text, numeric, integer, integer, jsonb
) from anon;
grant execute on function public.update_subscription_plan_draft(
  uuid, text, text, text, text, numeric, integer, integer, jsonb
) to authenticated;

create or replace function public.publish_subscription_plan_version(p_version_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.subscription_plan_versions%rowtype;
  v_plan public.subscription_plans%rowtype;
begin
  perform public.require_platform_owner();

  select * into v_version
  from public.subscription_plan_versions v
  where v.id = p_version_id
  for update;

  if not found then
    raise exception 'plan_version_not_found'
      using errcode = 'P0001';
  end if;
  if v_version.status is distinct from 'draft' then
    raise exception 'plan_version_not_draft'
      using errcode = 'P0001';
  end if;
  if not public.subscription_entitlements_valid(v_version.entitlements) then
    raise exception 'entitlements_invalid'
      using errcode = 'P0001';
  end if;

  select * into v_plan from public.subscription_plans where id = v_version.plan_id;

  update public.subscription_plan_versions
  set status = 'retired',
      retired_at = now(),
      updated_at = now()
  where plan_id = v_version.plan_id
    and status = 'published';

  update public.subscription_plan_versions
  set status = 'published',
      published_at = now(),
      updated_at = now()
  where id = v_version.id;

  perform public.append_subscription_event(
    null,
    null,
    v_plan.id,
    v_version.id,
    null,
    null,
    'plan_published',
    'plan version published',
    'succeeded',
    null,
    jsonb_build_object('status', 'draft'),
    jsonb_build_object('status', 'published', 'code', v_plan.code)
  );

  return jsonb_build_object(
    'plan_id', v_plan.id,
    'version_id', v_version.id,
    'code', v_plan.code,
    'status', 'published'
  );
end;
$$;

revoke all on function public.publish_subscription_plan_version(uuid) from public;
revoke all on function public.publish_subscription_plan_version(uuid) from anon;
grant execute on function public.publish_subscription_plan_version(uuid) to authenticated;

create or replace function public.retire_subscription_plan_version(p_version_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.subscription_plan_versions%rowtype;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.require_platform_owner();
  if char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'reason_invalid'
      using errcode = 'P0001';
  end if;

  select * into v_version
  from public.subscription_plan_versions v
  where v.id = p_version_id
  for update;

  if not found then
    raise exception 'plan_version_not_found'
      using errcode = 'P0001';
  end if;
  if v_version.status is distinct from 'published' then
    raise exception 'plan_version_not_published'
      using errcode = 'P0001';
  end if;

  update public.subscription_plan_versions
  set status = 'retired',
      retired_at = now(),
      updated_at = now()
  where id = v_version.id;

  perform public.append_subscription_event(
    null,
    null,
    v_version.plan_id,
    v_version.id,
    null,
    null,
    'plan_retired',
    v_reason,
    'succeeded',
    null,
    jsonb_build_object('status', 'published'),
    jsonb_build_object('status', 'retired')
  );

  return jsonb_build_object(
    'plan_id', v_version.plan_id,
    'version_id', v_version.id,
    'status', 'retired'
  );
end;
$$;

revoke all on function public.retire_subscription_plan_version(uuid, text) from public;
revoke all on function public.retire_subscription_plan_version(uuid, text) from anon;
grant execute on function public.retire_subscription_plan_version(uuid, text) to authenticated;

create or replace function public.create_subscription_plan_version_draft(
  p_plan_id uuid,
  p_billing_interval text,
  p_price_kind text,
  p_amount numeric,
  p_trial_days integer,
  p_grace_days integer,
  p_entitlements jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_plan public.subscription_plans%rowtype;
  v_latest public.subscription_plan_versions%rowtype;
  v_interval text := btrim(coalesce(p_billing_interval, ''));
  v_kind text := btrim(coalesce(p_price_kind, ''));
  v_amount numeric(14, 2);
  v_next integer;
  v_version_id uuid;
begin
  perform public.require_platform_owner();

  select * into v_plan from public.subscription_plans where id = p_plan_id for update;
  if not found then
    raise exception 'plan_not_found'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.subscription_plan_versions v
    where v.plan_id = p_plan_id and v.status = 'draft'
  ) then
    raise exception 'plan_draft_exists'
      using errcode = 'P0001';
  end if;

  select * into v_latest
  from public.subscription_plan_versions v
  where v.plan_id = p_plan_id
  order by v.version_number desc
  limit 1;

  if v_interval not in ('monthly', 'annual', 'lifetime') then
    raise exception 'billing_interval_invalid'
      using errcode = 'P0001';
  end if;
  if v_kind not in ('paid', 'free') then
    raise exception 'price_kind_invalid'
      using errcode = 'P0001';
  end if;
  if p_amount is null then
    raise exception 'amount_required'
      using errcode = 'P0001';
  end if;
  v_amount := round(p_amount, 2);
  if v_amount <> p_amount
     or (v_kind = 'free' and v_amount <> 0)
     or (v_kind = 'paid' and v_amount <= 0) then
    raise exception 'amount_invalid'
      using errcode = 'P0001';
  end if;
  if coalesce(p_trial_days, -1) < 0 or coalesce(p_trial_days, -1) > 3650 then
    raise exception 'trial_days_invalid'
      using errcode = 'P0001';
  end if;
  if coalesce(p_grace_days, -1) < 0 or coalesce(p_grace_days, -1) > 365 then
    raise exception 'grace_days_invalid'
      using errcode = 'P0001';
  end if;
  if not public.subscription_entitlements_valid(coalesce(p_entitlements, '{}'::jsonb)) then
    raise exception 'entitlements_invalid'
      using errcode = 'P0001';
  end if;

  v_next := coalesce(v_latest.version_number, 0) + 1;

  insert into public.subscription_plan_versions (
    plan_id,
    version_number,
    status,
    registration_country,
    currency,
    billing_interval,
    price_kind,
    amount,
    trial_days,
    grace_days,
    entitlements,
    created_by
  )
  values (
    p_plan_id,
    v_next,
    'draft',
    v_latest.registration_country,
    v_latest.currency,
    v_interval,
    v_kind,
    v_amount,
    p_trial_days,
    p_grace_days,
    coalesce(p_entitlements, '{}'::jsonb),
    v_actor
  )
  returning id into v_version_id;

  perform public.append_subscription_event(
    null,
    null,
    p_plan_id,
    v_version_id,
    null,
    null,
    'plan_draft_created',
    'new plan version draft',
    'succeeded',
    null,
    '{}'::jsonb,
    jsonb_build_object('version_number', v_next)
  );

  return jsonb_build_object(
    'plan_id', p_plan_id,
    'version_id', v_version_id,
    'version_number', v_next,
    'status', 'draft'
  );
end;
$$;

revoke all on function public.create_subscription_plan_version_draft(
  uuid, text, text, numeric, integer, integer, jsonb
) from public;
revoke all on function public.create_subscription_plan_version_draft(
  uuid, text, text, numeric, integer, integer, jsonb
) from anon;
grant execute on function public.create_subscription_plan_version_draft(
  uuid, text, text, numeric, integer, integer, jsonb
) to authenticated;

-- ---------------------------------------------------------------------------
-- List / detail reads
-- ---------------------------------------------------------------------------

create or replace function public.list_subscription_plans(
  p_status text default null,
  p_registration_country text default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  perform public.require_platform_owner();

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'plan_id', p.id,
        'code', p.code,
        'name', p.name,
        'description', p.description,
        'current_version',
        jsonb_build_object(
          'id', v.id,
          'version_number', v.version_number,
          'status', v.status,
          'registration_country', v.registration_country,
          'currency', v.currency,
          'billing_interval', v.billing_interval,
          'price_kind', v.price_kind,
          'amount', v.amount,
          'trial_days', v.trial_days,
          'grace_days', v.grace_days,
          'entitlements', v.entitlements,
          'published_at', v.published_at,
          'retired_at', v.retired_at
        ),
        'current_subscription_count',
        (
          select count(*)::int
          from public.company_subscriptions s
          where s.plan_id = p.id
            and s.is_current
        ),
        'created_at', p.created_at
      )
      order by p.code
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.subscription_plans p
  join lateral (
    select *
    from public.subscription_plan_versions vv
    where vv.plan_id = p.id
    order by
      case vv.status
        when 'published' then 0
        when 'draft' then 1
        else 2
      end,
      vv.version_number desc
    limit 1
  ) v on true
  where (p_status is null or v.status = p_status)
    and (
      p_registration_country is null
      or v.registration_country = p_registration_country
    );

  return jsonb_build_object('plans', v_rows);
end;
$$;

revoke all on function public.list_subscription_plans(text, text) from public;
revoke all on function public.list_subscription_plans(text, text) from anon;
grant execute on function public.list_subscription_plans(text, text) to authenticated;

create or replace function public.get_subscription_plan(p_plan_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_plan public.subscription_plans%rowtype;
  v_versions jsonb;
  v_count integer;
begin
  perform public.require_platform_owner();

  select * into v_plan from public.subscription_plans where id = p_plan_id;
  if not found then
    raise exception 'plan_not_found'
      using errcode = 'P0001';
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'version_number', v.version_number,
        'status', v.status,
        'registration_country', v.registration_country,
        'currency', v.currency,
        'billing_interval', v.billing_interval,
        'price_kind', v.price_kind,
        'amount', v.amount,
        'trial_days', v.trial_days,
        'grace_days', v.grace_days,
        'entitlements', v.entitlements,
        'effective_from', v.effective_from,
        'published_at', v.published_at,
        'retired_at', v.retired_at,
        'created_at', v.created_at
      )
      order by v.version_number desc
    ),
    '[]'::jsonb
  )
  into v_versions
  from public.subscription_plan_versions v
  where v.plan_id = p_plan_id;

  select count(*)::int into v_count
  from public.company_subscriptions s
  where s.plan_id = p_plan_id and s.is_current;

  return jsonb_build_object(
    'plan',
    jsonb_build_object(
      'id', v_plan.id,
      'code', v_plan.code,
      'name', v_plan.name,
      'description', v_plan.description,
      'created_at', v_plan.created_at
    ),
    'versions', v_versions,
    'current_subscription_count', v_count
  );
end;
$$;

revoke all on function public.get_subscription_plan(uuid) from public;
revoke all on function public.get_subscription_plan(uuid) from anon;
grant execute on function public.get_subscription_plan(uuid) to authenticated;

create or replace function public.platform_subscription_overview()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  trial_count integer := 0;
  active_count integer := 0;
  grace_count integer := 0;
  overdue_count integer := 0;
  suspended_count integer := 0;
  cancelled_count integer := 0;
  total_count integer := 0;
  published_plans integer := 0;
begin
  perform public.require_platform_owner();

  select
    count(*) filter (
      where public.subscription_effective_status(
        s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
      ) = 'trial'
    ),
    count(*) filter (
      where public.subscription_effective_status(
        s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
      ) = 'active'
    ),
    count(*) filter (
      where public.subscription_effective_status(
        s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
      ) = 'grace'
    ),
    count(*) filter (
      where public.subscription_effective_status(
        s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
      ) = 'overdue'
    ),
    count(*) filter (
      where public.subscription_effective_status(
        s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
      ) = 'suspended'
    ),
    count(*) filter (
      where public.subscription_effective_status(
        s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
      ) = 'cancelled'
    ),
    count(*)
  into
    trial_count,
    active_count,
    grace_count,
    overdue_count,
    suspended_count,
    cancelled_count,
    total_count
  from public.company_subscriptions s
  where s.is_current;

  select count(distinct plan_id)::int into published_plans
  from public.subscription_plan_versions
  where status = 'published';

  return jsonb_build_object(
    'counts',
    jsonb_build_object(
      'trial', trial_count,
      'active', active_count,
      'grace', grace_count,
      'overdue', overdue_count,
      'suspended', suspended_count,
      'cancelled', cancelled_count,
      'total', total_count,
      'published_plans', published_plans
    )
  );
end;
$$;

revoke all on function public.platform_subscription_overview() from public;
revoke all on function public.platform_subscription_overview() from anon;
grant execute on function public.platform_subscription_overview() to authenticated;

-- ---------------------------------------------------------------------------
-- Resolve Phase 09 intent
-- ---------------------------------------------------------------------------

create or replace function public.resolve_subscription_intent(
  p_company_id uuid,
  p_term_interval text,
  p_ends_at timestamptz,
  p_idempotency_key text,
  p_starts_at timestamptz default now(),
  p_reason text default 'resolve onboarding intent'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := (select auth.uid());
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_interval text := btrim(coalesce(p_term_interval, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_company public.companies%rowtype;
  v_intent public.company_subscription_intents%rowtype;
  v_existing public.company_subscriptions%rowtype;
  v_version public.subscription_plan_versions%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_starts timestamptz := coalesce(p_starts_at, now());
  v_ends timestamptz;
  v_period_ends timestamptz;
  v_trial_ends timestamptz;
  v_grace_ends timestamptz;
  v_status text;
  v_sub_id uuid;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' then
    raise exception 'idempotency_key_invalid'
      using errcode = 'P0001';
  end if;
  if char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    raise exception 'reason_invalid'
      using errcode = 'P0001';
  end if;
  if v_interval not in ('monthly', 'annual', 'lifetime') then
    raise exception 'billing_interval_invalid'
      using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_key, 0));

  select * into v_existing
  from public.company_subscriptions s
  where s.idempotency_key = v_key;
  if found then
    return jsonb_build_object(
      'ok', true,
      'reused', true,
      'subscription_id', v_existing.id,
      'status', v_existing.status,
      'company_id', v_existing.company_id
    );
  end if;

  select * into v_company
  from public.companies c
  where c.id = p_company_id
  for update;
  if not found then
    raise exception 'company_not_found'
      using errcode = 'P0001';
  end if;

  select * into v_intent
  from public.company_subscription_intents i
  where i.company_id = p_company_id
  for update;
  if not found then
    raise exception 'intent_not_found'
      using errcode = 'P0001';
  end if;

  if v_intent.resolution_status = 'resolved'
     and v_intent.resolved_subscription_id is not null then
    if v_intent.resolution_idempotency_key is not distinct from v_key then
      select * into v_existing
      from public.company_subscriptions s
      where s.id = v_intent.resolved_subscription_id;
      return jsonb_build_object(
        'ok', true,
        'reused', true,
        'subscription_id', v_existing.id,
        'status', v_existing.status,
        'company_id', p_company_id
      );
    end if;
    raise exception 'intent_already_resolved'
      using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.company_subscriptions s
    where s.company_id = p_company_id and s.is_current
  ) then
    update public.company_subscription_intents
    set resolution_status = 'blocked',
        resolution_code = 'subscription_exists',
        resolved_by = v_actor,
        resolved_at = now(),
        resolution_idempotency_key = v_key
    where company_id = p_company_id;
    raise exception 'subscription_exists'
      using errcode = 'P0001';
  end if;

  if v_intent.requested_plan_code is null then
    update public.company_subscription_intents
    set resolution_status = 'blocked',
        resolution_code = 'intent_plan_missing',
        resolved_by = v_actor,
        resolved_at = now(),
        resolution_idempotency_key = v_key
    where company_id = p_company_id;
    perform public.append_subscription_event(
      p_company_id, null, null, null, null, null,
      'intent_blocked', v_reason, 'failed', v_key,
      '{}'::jsonb, jsonb_build_object('code', 'intent_plan_missing')
    );
    raise exception 'intent_plan_missing'
      using errcode = 'P0001';
  end if;

  select p.* into v_plan
  from public.subscription_plans p
  where lower(p.code) = lower(v_intent.requested_plan_code);
  if not found then
    update public.company_subscription_intents
    set resolution_status = 'blocked',
        resolution_code = 'plan_not_assignable',
        resolved_by = v_actor,
        resolved_at = now(),
        resolution_idempotency_key = v_key
    where company_id = p_company_id;
    raise exception 'plan_not_assignable'
      using errcode = 'P0001';
  end if;

  select v.* into v_version
  from public.subscription_plan_versions v
  where v.plan_id = v_plan.id
    and v.status = 'published'
  order by v.version_number desc
  limit 1;
  if not found then
    update public.company_subscription_intents
    set resolution_status = 'blocked',
        resolution_code = 'plan_not_assignable',
        resolved_by = v_actor,
        resolved_at = now(),
        resolution_idempotency_key = v_key
    where company_id = p_company_id;
    raise exception 'plan_not_assignable'
      using errcode = 'P0001';
  end if;

  if v_version.registration_country is distinct from v_company.registration_country
     or v_version.currency is distinct from v_company.default_currency then
    update public.company_subscription_intents
    set resolution_status = 'blocked',
        resolution_code = 'currency_mismatch',
        resolved_by = v_actor,
        resolved_at = now(),
        resolution_idempotency_key = v_key
    where company_id = p_company_id;
    raise exception 'currency_mismatch'
      using errcode = 'P0001';
  end if;

  if v_interval = 'annual' then
    if p_ends_at is null or p_ends_at <= v_starts then
      raise exception 'annual_end_required'
        using errcode = 'P0001';
    end if;
    v_ends := p_ends_at;
    v_period_ends := p_ends_at;
  elsif v_interval = 'monthly' then
    v_period_ends := public.subscription_monthly_period_end(v_starts);
    v_ends := v_period_ends;
  else
    v_ends := null;
    v_period_ends := null;
  end if;

  if v_intent.trial_requested then
    if v_version.trial_days <= 0 then
      raise exception 'trial_not_available'
        using errcode = 'P0001';
    end if;
    v_status := 'trial';
    v_trial_ends := v_starts + make_interval(days => v_version.trial_days);
    v_grace_ends := v_trial_ends + make_interval(days => v_version.grace_days);
  else
    v_status := 'active';
    v_trial_ends := null;
    if v_period_ends is not null then
      v_grace_ends := v_period_ends + make_interval(days => v_version.grace_days);
    else
      v_grace_ends := null;
    end if;
  end if;

  insert into public.company_subscriptions (
    company_id,
    plan_id,
    plan_version_id,
    status,
    term_interval,
    billing_currency,
    price_kind,
    amount,
    trial_days,
    grace_days,
    entitlements,
    starts_at,
    ends_at,
    trial_started_at,
    trial_ends_at,
    period_ends_at,
    grace_ends_at,
    is_current,
    idempotency_key,
    created_by
  )
  values (
    p_company_id,
    v_plan.id,
    v_version.id,
    v_status,
    v_interval,
    v_version.currency,
    v_version.price_kind,
    v_version.amount,
    v_version.trial_days,
    v_version.grace_days,
    v_version.entitlements,
    v_starts,
    v_ends,
    case when v_status = 'trial' then v_starts else null end,
    v_trial_ends,
    v_period_ends,
    v_grace_ends,
    true,
    v_key,
    v_actor
  )
  returning id into v_sub_id;

  update public.company_subscription_intents
  set resolution_status = 'resolved',
      resolved_subscription_id = v_sub_id,
      resolved_by = v_actor,
      resolved_at = now(),
      resolution_code = 'resolved',
      resolution_idempotency_key = v_key
  where company_id = p_company_id;

  perform public.append_subscription_event(
    p_company_id,
    v_sub_id,
    v_plan.id,
    v_version.id,
    null,
    null,
    'intent_resolved',
    v_reason,
    'succeeded',
    v_key,
    jsonb_build_object(
      'requested_plan_code', v_intent.requested_plan_code,
      'trial_requested', v_intent.trial_requested
    ),
    jsonb_build_object(
      'subscription_id', v_sub_id,
      'status', v_status,
      'term_interval', v_interval
    )
  );

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'subscription_id', v_sub_id,
    'status', v_status,
    'company_id', p_company_id,
    'plan_code', v_plan.code,
    'billing_currency', v_version.currency,
    'term_interval', v_interval
  );
end;
$$;

comment on function public.resolve_subscription_intent(
  uuid, text, timestamptz, text, timestamptz, text
) is
  'Idempotent Platform Owner resolution of Phase 09 plan/trial intent. Owner supplies the term because Phase 09 did not store one.';

revoke all on function public.resolve_subscription_intent(
  uuid, text, timestamptz, text, timestamptz, text
) from public;
revoke all on function public.resolve_subscription_intent(
  uuid, text, timestamptz, text, timestamptz, text
) from anon;
grant execute on function public.resolve_subscription_intent(
  uuid, text, timestamptz, text, timestamptz, text
) to authenticated;

-- ---------------------------------------------------------------------------
-- Subscription administration
-- ---------------------------------------------------------------------------

create or replace function public.list_company_subscriptions(
  p_status text default null,
  p_company_id uuid default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_rows jsonb;
begin
  perform public.require_platform_owner();

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'company_id', s.company_id,
        'company_code', c.company_code,
        'legal_name', c.legal_name,
        'lifecycle_status', c.lifecycle_status,
        'plan_id', s.plan_id,
        'plan_code', p.code,
        'plan_name', p.name,
        'plan_version_id', s.plan_version_id,
        'status', s.status,
        'effective_status', public.subscription_effective_status(
          s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
        ),
        'term_interval', s.term_interval,
        'billing_currency', s.billing_currency,
        'amount', s.amount,
        'starts_at', s.starts_at,
        'ends_at', s.ends_at,
        'trial_ends_at', s.trial_ends_at,
        'period_ends_at', s.period_ends_at,
        'grace_ends_at', s.grace_ends_at,
        'cancel_at_period_end', s.cancel_at_period_end,
        'is_current', s.is_current,
        'created_at', s.created_at
      )
      order by s.created_at desc
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.company_subscriptions s
  join public.companies c on c.id = s.company_id
  join public.subscription_plans p on p.id = s.plan_id
  where s.is_current
    and (p_company_id is null or s.company_id = p_company_id)
    and (
      p_status is null
      or public.subscription_effective_status(
        s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
      ) = p_status
    );

  return jsonb_build_object('subscriptions', v_rows);
end;
$$;

revoke all on function public.list_company_subscriptions(text, uuid) from public;
revoke all on function public.list_company_subscriptions(text, uuid) from anon;
grant execute on function public.list_company_subscriptions(text, uuid) to authenticated;

create or replace function public.get_company_subscription(p_subscription_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_company public.companies%rowtype;
  v_plan public.subscription_plans%rowtype;
  v_payments jsonb;
  v_adjustments jsonb;
  v_events jsonb;
  v_decision jsonb;
begin
  perform public.require_platform_owner();

  select * into v_sub from public.company_subscriptions where id = p_subscription_id;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  select * into v_company from public.companies where id = v_sub.company_id;
  select * into v_plan from public.subscription_plans where id = v_sub.plan_id;
  v_decision := public.get_company_access_decision(v_sub.company_id);

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', pay.id,
        'amount', pay.amount,
        'currency', pay.currency,
        'received_on', pay.received_on,
        'payment_method', pay.payment_method,
        'external_reference', pay.external_reference,
        'notes', pay.notes,
        'status', pay.status,
        'created_at', pay.created_at
      )
      order by pay.created_at desc
    ),
    '[]'::jsonb
  )
  into v_payments
  from public.subscription_payments pay
  where pay.subscription_id = p_subscription_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', adj.id,
        'kind', adj.kind,
        'amount', adj.amount,
        'currency', adj.currency,
        'effective_on', adj.effective_on,
        'reason', adj.reason,
        'payment_id', adj.payment_id,
        'created_at', adj.created_at
      )
      order by adj.created_at desc
    ),
    '[]'::jsonb
  )
  into v_adjustments
  from public.subscription_adjustments adj
  where adj.subscription_id = p_subscription_id;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', e.id,
        'action', e.action,
        'reason', e.reason,
        'outcome', e.outcome,
        'created_at', e.created_at,
        'before_state', e.before_state,
        'after_state', e.after_state
      )
      order by e.created_at desc
    ),
    '[]'::jsonb
  )
  into v_events
  from (
    select *
    from public.subscription_events e
    where e.subscription_id = p_subscription_id
    order by e.created_at desc
    limit 50
  ) e;

  return jsonb_build_object(
    'subscription',
    jsonb_build_object(
      'id', v_sub.id,
      'company_id', v_sub.company_id,
      'status', v_sub.status,
      'effective_status', public.subscription_effective_status(
        v_sub.status, v_sub.trial_ends_at, v_sub.period_ends_at, v_sub.ends_at, v_sub.grace_ends_at, v_sub.cancel_at_period_end, now()
      ),
      'term_interval', v_sub.term_interval,
      'billing_currency', v_sub.billing_currency,
      'price_kind', v_sub.price_kind,
      'amount', v_sub.amount,
      'entitlements', v_sub.entitlements,
      'starts_at', v_sub.starts_at,
      'ends_at', v_sub.ends_at,
      'trial_started_at', v_sub.trial_started_at,
      'trial_ends_at', v_sub.trial_ends_at,
      'period_ends_at', v_sub.period_ends_at,
      'grace_ends_at', v_sub.grace_ends_at,
      'cancel_at_period_end', v_sub.cancel_at_period_end,
      'cancelled_at', v_sub.cancelled_at,
      'is_current', v_sub.is_current,
      'plan_version_id', v_sub.plan_version_id
    ),
    'company',
    jsonb_build_object(
      'id', v_company.id,
      'company_code', v_company.company_code,
      'legal_name', v_company.legal_name,
      'lifecycle_status', v_company.lifecycle_status,
      'registration_country', v_company.registration_country,
      'default_currency', v_company.default_currency
    ),
    'plan',
    jsonb_build_object(
      'id', v_plan.id,
      'code', v_plan.code,
      'name', v_plan.name
    ),
    'access', v_decision,
    'payments', v_payments,
    'adjustments', v_adjustments,
    'events', v_events
  );
end;
$$;

revoke all on function public.get_company_subscription(uuid) from public;
revoke all on function public.get_company_subscription(uuid) from anon;
grant execute on function public.get_company_subscription(uuid) to authenticated;

create or replace function public.refresh_subscription_status(
  p_subscription_id uuid,
  p_reason text default 'refresh elapsed status'
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_effective text;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  perform public.require_platform_owner();
  if char_length(v_reason) < 3 then
    raise exception 'reason_invalid'
      using errcode = 'P0001';
  end if;

  select * into v_sub
  from public.company_subscriptions
  where id = p_subscription_id
  for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;

  v_effective := public.subscription_effective_status(
    v_sub.status, v_sub.trial_ends_at, v_sub.period_ends_at, v_sub.ends_at, v_sub.grace_ends_at, v_sub.cancel_at_period_end, now()
  );

  if v_effective is distinct from v_sub.status then
    update public.company_subscriptions
    set status = v_effective,
        cancelled_at = case when v_effective = 'cancelled' then coalesce(cancelled_at, now()) else cancelled_at end,
        updated_at = now()
    where id = p_subscription_id;

    perform public.append_subscription_event(
      v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id, null, null,
      'status_refreshed', v_reason, 'succeeded', null,
      jsonb_build_object('status', v_sub.status),
      jsonb_build_object('status', v_effective)
    );
  end if;

  return jsonb_build_object(
    'subscription_id', p_subscription_id,
    'from_status', v_sub.status,
    'to_status', v_effective
  );
end;
$$;

revoke all on function public.refresh_subscription_status(uuid, text) from public;
revoke all on function public.refresh_subscription_status(uuid, text) from anon;
grant execute on function public.refresh_subscription_status(uuid, text) to authenticated;

create or replace function public.convert_subscription_trial(
  p_subscription_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_existing uuid;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' then
    raise exception 'idempotency_key_invalid'
      using errcode = 'P0001';
  end if;
  if char_length(v_reason) < 3 then
    raise exception 'reason_invalid'
      using errcode = 'P0001';
  end if;

  select e.subscription_id into v_existing
  from public.subscription_events e
  where e.idempotency_key = v_key
    and e.action = 'trial_converted'
    and e.outcome = 'succeeded'
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'reused', true, 'subscription_id', v_existing);
  end if;

  select * into v_sub from public.company_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  if public.subscription_effective_status(
       v_sub.status, v_sub.trial_ends_at, v_sub.period_ends_at, v_sub.ends_at, v_sub.grace_ends_at, v_sub.cancel_at_period_end, now()
     ) is distinct from 'trial' then
    raise exception 'subscription_not_trial'
      using errcode = 'P0001';
  end if;

  update public.company_subscriptions
  set status = 'active',
      trial_started_at = trial_started_at,
      trial_ends_at = trial_ends_at,
      updated_at = now()
  where id = p_subscription_id;

  perform public.append_subscription_event(
    v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id, null, null,
    'trial_converted', v_reason, 'succeeded', v_key,
    jsonb_build_object('status', 'trial'),
    jsonb_build_object('status', 'active')
  );

  return jsonb_build_object('ok', true, 'reused', false, 'subscription_id', p_subscription_id, 'status', 'active');
end;
$$;

revoke all on function public.convert_subscription_trial(uuid, text, text) from public;
revoke all on function public.convert_subscription_trial(uuid, text, text) from anon;
grant execute on function public.convert_subscription_trial(uuid, text, text) to authenticated;

create or replace function public.suspend_company_subscription(
  p_subscription_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_existing uuid;
  v_effective text;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' or char_length(v_reason) < 3 then
    raise exception 'input_invalid'
      using errcode = 'P0001';
  end if;

  select e.subscription_id into v_existing
  from public.subscription_events e
  where e.idempotency_key = v_key and e.action = 'subscription_suspended' and e.outcome = 'succeeded'
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'reused', true, 'subscription_id', v_existing);
  end if;

  select * into v_sub from public.company_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  v_effective := public.subscription_effective_status(
    v_sub.status, v_sub.trial_ends_at, v_sub.period_ends_at, v_sub.ends_at, v_sub.grace_ends_at, v_sub.cancel_at_period_end, now()
  );
  if v_effective in ('suspended', 'cancelled') then
    raise exception 'subscription_transition_rejected'
      using errcode = 'P0001';
  end if;

  update public.company_subscriptions
  set status = 'suspended', updated_at = now()
  where id = p_subscription_id;

  perform public.append_subscription_event(
    v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id, null, null,
    'subscription_suspended', v_reason, 'succeeded', v_key,
    jsonb_build_object('status', v_sub.status),
    jsonb_build_object('status', 'suspended')
  );

  return jsonb_build_object('ok', true, 'reused', false, 'subscription_id', p_subscription_id, 'status', 'suspended');
end;
$$;

revoke all on function public.suspend_company_subscription(uuid, text, text) from public;
revoke all on function public.suspend_company_subscription(uuid, text, text) from anon;
grant execute on function public.suspend_company_subscription(uuid, text, text) to authenticated;

create or replace function public.reactivate_company_subscription(
  p_subscription_id uuid,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_existing uuid;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' or char_length(v_reason) < 3 then
    raise exception 'input_invalid'
      using errcode = 'P0001';
  end if;

  select e.subscription_id into v_existing
  from public.subscription_events e
  where e.idempotency_key = v_key and e.action = 'subscription_reactivated' and e.outcome = 'succeeded'
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'reused', true, 'subscription_id', v_existing);
  end if;

  select * into v_sub from public.company_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  if v_sub.status is distinct from 'suspended' then
    raise exception 'subscription_transition_rejected'
      using errcode = 'P0001';
  end if;

  update public.company_subscriptions
  set status = 'active', updated_at = now()
  where id = p_subscription_id;

  perform public.append_subscription_event(
    v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id, null, null,
    'subscription_reactivated', v_reason, 'succeeded', v_key,
    jsonb_build_object('status', 'suspended'),
    jsonb_build_object('status', 'active')
  );

  return jsonb_build_object('ok', true, 'reused', false, 'subscription_id', p_subscription_id, 'status', 'active');
end;
$$;

revoke all on function public.reactivate_company_subscription(uuid, text, text) from public;
revoke all on function public.reactivate_company_subscription(uuid, text, text) from anon;
grant execute on function public.reactivate_company_subscription(uuid, text, text) to authenticated;

create or replace function public.cancel_company_subscription(
  p_subscription_id uuid,
  p_mode text,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_mode text := btrim(coalesce(p_mode, ''));
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_existing uuid;
begin
  perform public.require_platform_owner();
  if v_mode not in ('immediate', 'at_period_end') then
    raise exception 'cancel_mode_invalid'
      using errcode = 'P0001';
  end if;
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' or char_length(v_reason) < 3 then
    raise exception 'input_invalid'
      using errcode = 'P0001';
  end if;

  select e.subscription_id into v_existing
  from public.subscription_events e
  where e.idempotency_key = v_key and e.action = 'subscription_cancelled' and e.outcome = 'succeeded'
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'reused', true, 'subscription_id', v_existing);
  end if;

  select * into v_sub from public.company_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  if v_sub.status = 'cancelled' then
    raise exception 'subscription_transition_rejected'
      using errcode = 'P0001';
  end if;

  if v_mode = 'immediate' then
    update public.company_subscriptions
    set status = 'cancelled',
        cancel_at_period_end = false,
        cancelled_at = now(),
        updated_at = now()
    where id = p_subscription_id;
  else
    if coalesce(v_sub.period_ends_at, v_sub.ends_at) is null then
      raise exception 'period_end_required'
        using errcode = 'P0001';
    end if;
    update public.company_subscriptions
    set cancel_at_period_end = true,
        updated_at = now()
    where id = p_subscription_id;
  end if;

  perform public.append_subscription_event(
    v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id, null, null,
    'subscription_cancelled', v_reason, 'succeeded', v_key,
    jsonb_build_object('status', v_sub.status, 'cancel_at_period_end', v_sub.cancel_at_period_end),
    jsonb_build_object('mode', v_mode)
  );

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'subscription_id', p_subscription_id,
    'mode', v_mode
  );
end;
$$;

revoke all on function public.cancel_company_subscription(uuid, text, text, text) from public;
revoke all on function public.cancel_company_subscription(uuid, text, text, text) from anon;
grant execute on function public.cancel_company_subscription(uuid, text, text, text) to authenticated;

create or replace function public.extend_company_subscription(
  p_subscription_id uuid,
  p_new_ends_at timestamptz,
  p_reason text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_existing uuid;
  v_grace timestamptz;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' or char_length(v_reason) < 3 then
    raise exception 'input_invalid'
      using errcode = 'P0001';
  end if;
  if p_new_ends_at is null then
    raise exception 'ends_at_required'
      using errcode = 'P0001';
  end if;

  select e.subscription_id into v_existing
  from public.subscription_events e
  where e.idempotency_key = v_key and e.action = 'term_extended' and e.outcome = 'succeeded'
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'reused', true, 'subscription_id', v_existing);
  end if;

  select * into v_sub from public.company_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  if v_sub.term_interval = 'lifetime' then
    raise exception 'lifetime_has_no_end'
      using errcode = 'P0001';
  end if;
  if p_new_ends_at <= coalesce(v_sub.period_ends_at, v_sub.ends_at, v_sub.starts_at) then
    raise exception 'extension_not_later'
      using errcode = 'P0001';
  end if;

  v_grace := p_new_ends_at + make_interval(days => v_sub.grace_days);

  update public.company_subscriptions
  set ends_at = p_new_ends_at,
      period_ends_at = p_new_ends_at,
      grace_ends_at = v_grace,
      status = 'active',
      cancel_at_period_end = false,
      updated_at = now()
  where id = p_subscription_id;

  perform public.append_subscription_event(
    v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id, null, null,
    'term_extended', v_reason, 'succeeded', v_key,
    jsonb_build_object('ends_at', v_sub.ends_at, 'status', v_sub.status),
    jsonb_build_object('ends_at', p_new_ends_at, 'status', 'active')
  );

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'subscription_id', p_subscription_id,
    'ends_at', p_new_ends_at,
    'status', 'active'
  );
end;
$$;

revoke all on function public.extend_company_subscription(uuid, timestamptz, text, text) from public;
revoke all on function public.extend_company_subscription(uuid, timestamptz, text, text) from anon;
grant execute on function public.extend_company_subscription(uuid, timestamptz, text, text) to authenticated;

create or replace function public.change_company_subscription_plan(
  p_subscription_id uuid,
  p_plan_version_id uuid,
  p_term_interval text,
  p_ends_at timestamptz,
  p_reason text,
  p_idempotency_key text,
  p_starts_at timestamptz default now()
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.company_subscriptions%rowtype;
  v_version public.subscription_plan_versions%rowtype;
  v_company public.companies%rowtype;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_interval text := btrim(coalesce(p_term_interval, ''));
  v_starts timestamptz := coalesce(p_starts_at, now());
  v_existing uuid;
  v_new_id uuid;
  v_ends timestamptz;
  v_period timestamptz;
  v_grace timestamptz;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' or char_length(v_reason) < 3 then
    raise exception 'input_invalid'
      using errcode = 'P0001';
  end if;
  if v_interval not in ('monthly', 'annual', 'lifetime') then
    raise exception 'billing_interval_invalid'
      using errcode = 'P0001';
  end if;

  select e.subscription_id into v_existing
  from public.subscription_events e
  where e.idempotency_key = v_key and e.action = 'plan_changed' and e.outcome = 'succeeded'
  limit 1;
  if found then
    return jsonb_build_object('ok', true, 'reused', true, 'subscription_id', v_existing);
  end if;

  select * into v_old from public.company_subscriptions where id = p_subscription_id for update;
  if not found or not v_old.is_current then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  select * into v_company from public.companies where id = v_old.company_id for update;
  select * into v_version from public.subscription_plan_versions where id = p_plan_version_id;
  if not found or v_version.status is distinct from 'published' then
    raise exception 'plan_not_assignable'
      using errcode = 'P0001';
  end if;
  if v_version.registration_country is distinct from v_company.registration_country
     or v_version.currency is distinct from v_company.default_currency then
    raise exception 'currency_mismatch'
      using errcode = 'P0001';
  end if;

  if v_interval = 'annual' then
    if p_ends_at is null or p_ends_at <= v_starts then
      raise exception 'annual_end_required'
        using errcode = 'P0001';
    end if;
    v_ends := p_ends_at;
    v_period := p_ends_at;
  elsif v_interval = 'monthly' then
    v_period := public.subscription_monthly_period_end(v_starts);
    v_ends := v_period;
  else
    v_ends := null;
    v_period := null;
  end if;
  v_grace := case
    when v_period is null then null
    else v_period + make_interval(days => v_version.grace_days)
  end;

  update public.company_subscriptions
  set is_current = false,
      status = case when status = 'cancelled' then status else 'cancelled' end,
      cancelled_at = coalesce(cancelled_at, now()),
      updated_at = now()
  where id = p_subscription_id;

  insert into public.company_subscriptions (
    company_id, plan_id, plan_version_id, status, term_interval, billing_currency,
    price_kind, amount, trial_days, grace_days, entitlements, starts_at, ends_at,
    period_ends_at, grace_ends_at, is_current, idempotency_key, created_by
  )
  values (
    v_old.company_id, v_version.plan_id, v_version.id, 'active', v_interval, v_version.currency,
    v_version.price_kind, v_version.amount, v_version.trial_days, v_version.grace_days,
    v_version.entitlements, v_starts, v_ends, v_period, v_grace, true, v_key, auth.uid()
  )
  returning id into v_new_id;

  perform public.append_subscription_event(
    v_old.company_id, v_new_id, v_version.plan_id, v_version.id, null, null,
    'plan_changed', v_reason, 'succeeded', v_key,
    jsonb_build_object('subscription_id', v_old.id, 'plan_version_id', v_old.plan_version_id),
    jsonb_build_object('subscription_id', v_new_id, 'plan_version_id', v_version.id)
  );

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'subscription_id', v_new_id,
    'previous_subscription_id', v_old.id
  );
end;
$$;

revoke all on function public.change_company_subscription_plan(
  uuid, uuid, text, timestamptz, text, text, timestamptz
) from public;
revoke all on function public.change_company_subscription_plan(
  uuid, uuid, text, timestamptz, text, text, timestamptz
) from anon;
grant execute on function public.change_company_subscription_plan(
  uuid, uuid, text, timestamptz, text, text, timestamptz
) to authenticated;

create or replace function public.record_subscription_payment(
  p_subscription_id uuid,
  p_amount numeric,
  p_received_on date,
  p_payment_method text,
  p_idempotency_key text,
  p_external_reference text default null,
  p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_method text := btrim(coalesce(p_payment_method, ''));
  v_amount numeric(14, 2);
  v_ref text := nullif(btrim(coalesce(p_external_reference, '')), '');
  v_notes text := nullif(btrim(coalesce(p_notes, '')), '');
  v_existing public.subscription_payments%rowtype;
  v_payment_id uuid;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' then
    raise exception 'idempotency_key_invalid'
      using errcode = 'P0001';
  end if;

  select * into v_existing from public.subscription_payments where idempotency_key = v_key;
  if found then
    return jsonb_build_object(
      'ok', true,
      'reused', true,
      'payment_id', v_existing.id,
      'subscription_id', v_existing.subscription_id
    );
  end if;

  select * into v_sub from public.company_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  if p_amount is null then
    raise exception 'amount_required'
      using errcode = 'P0001';
  end if;
  v_amount := round(p_amount, 2);
  if v_amount <> p_amount or v_amount <= 0 then
    raise exception 'amount_invalid'
      using errcode = 'P0001';
  end if;
  if p_received_on is null then
    raise exception 'received_on_required'
      using errcode = 'P0001';
  end if;
  if v_method not in ('bank_transfer', 'cash', 'cheque', 'esewa_recorded', 'khalti_recorded', 'other') then
    raise exception 'payment_method_invalid'
      using errcode = 'P0001';
  end if;

  insert into public.subscription_payments (
    company_id, subscription_id, amount, currency, received_on, payment_method,
    external_reference, notes, status, idempotency_key, recorded_by
  )
  values (
    v_sub.company_id, p_subscription_id, v_amount, v_sub.billing_currency, p_received_on, v_method,
    v_ref, v_notes, 'recorded', v_key, auth.uid()
  )
  returning id into v_payment_id;

  perform public.append_subscription_event(
    v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id, v_payment_id, null,
    'payment_recorded', 'manual payment recorded', 'succeeded', v_key,
    '{}'::jsonb,
    jsonb_build_object('payment_id', v_payment_id, 'amount', v_amount, 'currency', v_sub.billing_currency)
  );

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'payment_id', v_payment_id,
    'subscription_id', p_subscription_id,
    'currency', v_sub.billing_currency,
    'amount', v_amount
  );
end;
$$;

comment on function public.record_subscription_payment(
  uuid, numeric, date, text, text, text, text
) is
  'Records a manual SaaS payment. Does not extend the term or change access.';

revoke all on function public.record_subscription_payment(
  uuid, numeric, date, text, text, text, text
) from public;
revoke all on function public.record_subscription_payment(
  uuid, numeric, date, text, text, text, text
) from anon;
grant execute on function public.record_subscription_payment(
  uuid, numeric, date, text, text, text, text
) to authenticated;

create or replace function public.record_subscription_adjustment(
  p_subscription_id uuid,
  p_kind text,
  p_amount numeric,
  p_effective_on date,
  p_reason text,
  p_idempotency_key text,
  p_payment_id uuid default null,
  p_external_reference text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_sub public.company_subscriptions%rowtype;
  v_kind text := btrim(coalesce(p_kind, ''));
  v_key text := btrim(coalesce(p_idempotency_key, ''));
  v_reason text := btrim(coalesce(p_reason, ''));
  v_amount numeric(14, 2);
  v_existing public.subscription_adjustments%rowtype;
  v_payment public.subscription_payments%rowtype;
  v_adj_id uuid;
begin
  perform public.require_platform_owner();
  if v_key !~ '^[A-Za-z0-9_-]{8,80}$' or char_length(v_reason) < 3 then
    raise exception 'input_invalid'
      using errcode = 'P0001';
  end if;
  if v_kind not in ('credit', 'debit', 'waiver', 'reversal') then
    raise exception 'adjustment_kind_invalid'
      using errcode = 'P0001';
  end if;

  select * into v_existing from public.subscription_adjustments where idempotency_key = v_key;
  if found then
    return jsonb_build_object('ok', true, 'reused', true, 'adjustment_id', v_existing.id);
  end if;

  select * into v_sub from public.company_subscriptions where id = p_subscription_id for update;
  if not found then
    raise exception 'subscription_not_found'
      using errcode = 'P0001';
  end if;
  if p_amount is null then
    raise exception 'amount_required'
      using errcode = 'P0001';
  end if;
  v_amount := round(p_amount, 2);
  if v_amount <> p_amount or v_amount <= 0 then
    raise exception 'amount_invalid'
      using errcode = 'P0001';
  end if;
  if p_effective_on is null then
    raise exception 'effective_on_required'
      using errcode = 'P0001';
  end if;

  if v_kind = 'reversal' then
    if p_payment_id is null then
      raise exception 'payment_required'
        using errcode = 'P0001';
    end if;
    select * into v_payment
    from public.subscription_payments
    where id = p_payment_id
      and subscription_id = p_subscription_id
    for update;
    if not found then
      raise exception 'payment_not_found'
        using errcode = 'P0001';
    end if;
    if v_payment.status is distinct from 'recorded' then
      raise exception 'payment_already_reversed'
        using errcode = 'P0001';
    end if;
    if v_payment.currency is distinct from v_sub.billing_currency
       or v_amount is distinct from v_payment.amount then
      raise exception 'reversal_amount_mismatch'
        using errcode = 'P0001';
    end if;
    update public.subscription_payments
    set status = 'reversed'
    where id = p_payment_id;
  end if;

  insert into public.subscription_adjustments (
    company_id, subscription_id, payment_id, kind, amount, currency,
    effective_on, reason, external_reference, idempotency_key, recorded_by
  )
  values (
    v_sub.company_id, p_subscription_id, p_payment_id, v_kind, v_amount, v_sub.billing_currency,
    p_effective_on, v_reason, nullif(btrim(coalesce(p_external_reference, '')), ''), v_key, auth.uid()
  )
  returning id into v_adj_id;

  perform public.append_subscription_event(
    v_sub.company_id, p_subscription_id, v_sub.plan_id, v_sub.plan_version_id,
    p_payment_id, v_adj_id,
    case when v_kind = 'reversal' then 'payment_reversed' else 'adjustment_recorded' end,
    v_reason, 'succeeded', v_key,
    '{}'::jsonb,
    jsonb_build_object('adjustment_id', v_adj_id, 'kind', v_kind, 'amount', v_amount)
  );

  return jsonb_build_object(
    'ok', true,
    'reused', false,
    'adjustment_id', v_adj_id,
    'subscription_id', p_subscription_id,
    'kind', v_kind
  );
end;
$$;

revoke all on function public.record_subscription_adjustment(
  uuid, text, numeric, date, text, text, uuid, text
) from public;
revoke all on function public.record_subscription_adjustment(
  uuid, text, numeric, date, text, text, uuid, text
) from anon;
grant execute on function public.record_subscription_adjustment(
  uuid, text, numeric, date, text, text, uuid, text
) to authenticated;

create or replace function public.get_my_subscription_summary()
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
        'lifecycle_status', c.lifecycle_status,
        'plan_code', p.code,
        'plan_name', p.name,
        'status', s.status,
        'effective_status', public.subscription_effective_status(
          s.status, s.trial_ends_at, s.period_ends_at, s.ends_at, s.grace_ends_at, s.cancel_at_period_end, now()
        ),
        'term_interval', s.term_interval,
        'billing_currency', s.billing_currency,
        'trial_ends_at', s.trial_ends_at,
        'period_ends_at', s.period_ends_at,
        'grace_ends_at', s.grace_ends_at,
        'ends_at', s.ends_at,
        'access', public.get_company_access_decision(c.id)
      )
      order by c.company_code
    ),
    '[]'::jsonb
  )
  into v_rows
  from public.company_memberships m
  join public.companies c on c.id = m.company_id
  left join public.company_subscriptions s
    on s.company_id = c.id and s.is_current
  left join public.subscription_plans p on p.id = s.plan_id
  where m.user_id = v_uid
    and m.status = 'active'
    and m.founding_admin;

  if v_rows = '[]'::jsonb then
    raise exception 'permission denied'
      using errcode = '42501';
  end if;

  return v_rows;
end;
$$;

comment on function public.get_my_subscription_summary() is
  'Founding-admin subscription summary for the caller only. No payment notes and no mutations.';

revoke all on function public.get_my_subscription_summary() from public;
revoke all on function public.get_my_subscription_summary() from anon;
grant execute on function public.get_my_subscription_summary() to authenticated;
