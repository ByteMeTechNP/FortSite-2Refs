import {
  countsReconcile,
  isSubscriptionStatus,
  type AccessDecision,
  type PlanEntitlements,
  type SubscriptionCounts,
  type SubscriptionStatus,
} from '@/features/platform/subscriptions/types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asNonNegInt(value: unknown): number | null {
  const n = asNumber(value);
  if (n === null || !Number.isInteger(n) || n < 0) {
    return null;
  }
  return n;
}

function asText(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

export function parseEntitlements(value: unknown): PlanEntitlements | null {
  if (!isRecord(value)) {
    return null;
  }
  const out: {
    max_active_projects?: number;
    max_users?: number;
    marketplace_enabled?: boolean;
    mobile_app_enabled?: boolean;
    takeoff_enabled?: boolean;
    bim_enabled?: boolean;
  } = {};
  for (const [key, raw] of Object.entries(value)) {
    if (key === 'max_active_projects' || key === 'max_users') {
      const n = asNonNegInt(raw);
      if (n === null) {
        return null;
      }
      out[key] = n;
      continue;
    }
    if (
      key === 'marketplace_enabled' ||
      key === 'mobile_app_enabled' ||
      key === 'takeoff_enabled' ||
      key === 'bim_enabled'
    ) {
      if (typeof raw !== 'boolean') {
        return null;
      }
      out[key] = raw;
      continue;
    }
    return null;
  }
  return out;
}

export function parseAccessDecision(value: unknown): AccessDecision | null {
  if (!isRecord(value)) {
    return null;
  }
  if (typeof value.allowed !== 'boolean') {
    return null;
  }
  const reasonCode = asText(value.reason_code);
  const explanation = asText(value.explanation);
  if (!reasonCode || !explanation) {
    return null;
  }
  let subscriptionStatus: SubscriptionStatus | null = null;
  if (
    value.subscription_status !== null &&
    value.subscription_status !== undefined
  ) {
    const status = asText(value.subscription_status);
    if (!status || !isSubscriptionStatus(status)) {
      return null;
    }
    subscriptionStatus = status;
  }
  const relevantEndAt =
    value.relevant_end_at === null || value.relevant_end_at === undefined
      ? null
      : asText(value.relevant_end_at);
  if (
    value.relevant_end_at !== null &&
    value.relevant_end_at !== undefined &&
    !relevantEndAt
  ) {
    return null;
  }
  let entitlements: PlanEntitlements | null = null;
  if (value.entitlements !== null && value.entitlements !== undefined) {
    entitlements = parseEntitlements(value.entitlements);
    if (!entitlements) {
      return null;
    }
  }
  return {
    allowed: value.allowed,
    reasonCode,
    explanation,
    subscriptionStatus,
    relevantEndAt,
    entitlements,
  };
}

export function parseSubscriptionCounts(
  value: unknown,
): SubscriptionCounts | null {
  if (!isRecord(value)) {
    return null;
  }
  const countsRaw = isRecord(value.counts) ? value.counts : value;
  const trial = asNonNegInt(countsRaw.trial);
  const active = asNonNegInt(countsRaw.active);
  const grace = asNonNegInt(countsRaw.grace);
  const overdue = asNonNegInt(countsRaw.overdue);
  const suspended = asNonNegInt(countsRaw.suspended);
  const cancelled = asNonNegInt(countsRaw.cancelled);
  const total = asNonNegInt(countsRaw.total);
  const publishedPlans = asNonNegInt(countsRaw.published_plans);
  if (
    trial === null ||
    active === null ||
    grace === null ||
    overdue === null ||
    suspended === null ||
    cancelled === null ||
    total === null ||
    publishedPlans === null
  ) {
    return null;
  }
  const counts = {
    trial,
    active,
    grace,
    overdue,
    suspended,
    cancelled,
    total,
    publishedPlans,
  };
  if (!countsReconcile(counts)) {
    return null;
  }
  return counts;
}

const SAFE_RPC_MESSAGES: Record<string, string> = {
  plan_code_invalid: 'Enter a valid plan code.',
  plan_code_exists: 'That plan code is already in use.',
  plan_name_invalid: 'Enter a valid plan name.',
  registration_country_invalid: 'Choose Nepal or India.',
  billing_interval_invalid: 'Choose monthly, annual, or lifetime.',
  price_kind_invalid: 'Choose paid or free.',
  amount_required: 'An amount is required.',
  amount_invalid: 'Enter a valid amount for the price kind.',
  amount_precision_invalid: 'Use at most two decimal places.',
  trial_days_invalid: 'Enter valid trial days.',
  grace_days_invalid: 'Enter valid grace days.',
  entitlements_invalid: 'Entitlement keys or values are invalid.',
  plan_version_not_found: 'That plan version is not available.',
  plan_version_not_draft: 'Only a draft version can be edited or published.',
  plan_version_not_published: 'Only a published version can be retired.',
  plan_not_found: 'That plan is not available.',
  plan_draft_exists: 'A draft version already exists for this plan.',
  plan_not_assignable: 'That plan is not published and assignable.',
  intent_plan_missing: 'This company has no requested plan code to resolve.',
  intent_already_resolved: 'That onboarding intent was already resolved.',
  intent_not_found: 'No subscription intent exists for that company.',
  currency_mismatch: 'Plan currency must match the company currency.',
  subscription_exists: 'This company already has a current subscription.',
  annual_end_required: 'An annual term requires an end date after the start.',
  trial_not_available: 'This plan does not offer a trial.',
  subscription_not_found: 'That subscription is not available.',
  subscription_not_trial: 'Only a trial subscription can be converted.',
  subscription_transition_rejected:
    'That subscription transition is not allowed.',
  cancel_mode_invalid: 'Choose immediate or at-period-end cancellation.',
  period_end_required: 'A scheduled cancellation needs a period end date.',
  lifetime_has_no_end: 'A lifetime term has no end date to extend.',
  extension_not_later: 'The new end date must be later than the current end.',
  ends_at_required: 'An end date is required.',
  payment_method_invalid: 'Choose a supported payment method label.',
  received_on_required: 'Enter the payment received date.',
  payment_not_found: 'That payment is not available.',
  payment_already_reversed: 'That payment was already reversed.',
  payment_required: 'A reversal must link to the original payment.',
  reversal_amount_mismatch:
    'A reversal must match the payment amount and currency.',
  adjustment_kind_invalid: 'Choose a valid adjustment kind.',
  reason_invalid: 'Enter a reason between 3 and 500 characters.',
  input_invalid: 'Check the required fields and try again.',
  idempotency_key_invalid: 'The request could not be completed.',
  company_not_found: 'That company is not available.',
  '42501': 'You do not have permission to do that.',
};

const GENERIC = 'The request could not be completed.';

export function safeRpcMessage(
  error: {
    message?: string;
    code?: string;
  } | null,
): string {
  if (!error) {
    return GENERIC;
  }
  if (error.code === '42501') {
    return SAFE_RPC_MESSAGES['42501'] ?? GENERIC;
  }
  const message = error.message ?? '';
  const known = SAFE_RPC_MESSAGES[message];
  return known ?? GENERIC;
}
