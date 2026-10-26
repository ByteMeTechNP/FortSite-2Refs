export const PLAN_VERSION_STATUSES = ['draft', 'published', 'retired'] as const;
export type PlanVersionStatus = (typeof PLAN_VERSION_STATUSES)[number];

export const BILLING_INTERVALS = ['monthly', 'annual', 'lifetime'] as const;
export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const PRICE_KINDS = ['paid', 'free'] as const;
export type PriceKind = (typeof PRICE_KINDS)[number];

export const SUBSCRIPTION_STATUSES = [
  'trial',
  'active',
  'grace',
  'overdue',
  'suspended',
  'cancelled',
] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export const PAYMENT_METHODS = [
  'bank_transfer',
  'cash',
  'cheque',
  'esewa_recorded',
  'khalti_recorded',
  'other',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const ADJUSTMENT_KINDS = [
  'credit',
  'debit',
  'waiver',
  'reversal',
] as const;
export type AdjustmentKind = (typeof ADJUSTMENT_KINDS)[number];

export const ENTITLEMENT_KEYS = [
  'max_active_projects',
  'max_users',
  'marketplace_enabled',
  'mobile_app_enabled',
  'takeoff_enabled',
  'bim_enabled',
] as const;
export type EntitlementKey = (typeof ENTITLEMENT_KEYS)[number];

export type PlanEntitlements = Readonly<
  Partial<{
    max_active_projects: number;
    max_users: number;
    marketplace_enabled: boolean;
    mobile_app_enabled: boolean;
    takeoff_enabled: boolean;
    bim_enabled: boolean;
  }>
>;

export type AccessDecision = Readonly<{
  allowed: boolean;
  reasonCode: string;
  explanation: string;
  subscriptionStatus: SubscriptionStatus | null;
  relevantEndAt: string | null;
  entitlements: PlanEntitlements | null;
}>;

export type SubscriptionCounts = Readonly<{
  trial: number;
  active: number;
  grace: number;
  overdue: number;
  suspended: number;
  cancelled: number;
  total: number;
  publishedPlans: number;
}>;

export function isBillingInterval(value: string): value is BillingInterval {
  return (BILLING_INTERVALS as readonly string[]).includes(value);
}

export function isSubscriptionStatus(
  value: string,
): value is SubscriptionStatus {
  return (SUBSCRIPTION_STATUSES as readonly string[]).includes(value);
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return (PAYMENT_METHODS as readonly string[]).includes(value);
}

export function isAdjustmentKind(value: string): value is AdjustmentKind {
  return (ADJUSTMENT_KINDS as readonly string[]).includes(value);
}

export function countsReconcile(counts: SubscriptionCounts): boolean {
  return (
    counts.trial +
      counts.active +
      counts.grace +
      counts.overdue +
      counts.suspended +
      counts.cancelled ===
    counts.total
  );
}
