import type { SubscriptionStatus } from '@/features/platform/subscriptions/types';

export type EffectiveStatusInput = Readonly<{
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  periodEndsAt: Date | null;
  endsAt: Date | null;
  graceEndsAt: Date | null;
  cancelAtPeriodEnd: boolean;
  now?: Date;
}>;

export function effectiveSubscriptionStatus(
  input: EffectiveStatusInput,
): SubscriptionStatus {
  const now = input.now ?? new Date();

  if (
    input.status === 'suspended' ||
    input.status === 'cancelled' ||
    input.status === 'overdue'
  ) {
    return input.status;
  }

  if (input.status === 'trial') {
    if (!input.trialEndsAt || now < input.trialEndsAt) {
      return 'trial';
    }
    if (input.graceEndsAt && now < input.graceEndsAt) {
      return 'grace';
    }
    return 'overdue';
  }

  if (input.status === 'grace') {
    if (input.graceEndsAt && now < input.graceEndsAt) {
      return 'grace';
    }
    return 'overdue';
  }

  if (input.status === 'active') {
    const boundary = input.periodEndsAt ?? input.endsAt;
    if (!boundary || now < boundary) {
      return 'active';
    }
    if (input.cancelAtPeriodEnd) {
      return 'cancelled';
    }
    if (input.graceEndsAt && now < input.graceEndsAt) {
      return 'grace';
    }
    return 'overdue';
  }

  return input.status;
}

export function subscriptionStatusIsEligible(
  status: SubscriptionStatus,
): boolean {
  return status === 'trial' || status === 'active' || status === 'grace';
}

export type CompanyLifecycleForAccess =
  'pending_setup' | 'active' | 'paused' | 'suspended' | 'archived';

export function evaluateAccessMatrix(input: {
  lifecycle: CompanyLifecycleForAccess;
  effectiveStatus: SubscriptionStatus | null;
}): Readonly<{ allowed: boolean; reasonCode: string }> {
  if (input.lifecycle !== 'active') {
    return { allowed: false, reasonCode: 'company_not_active' };
  }
  if (!input.effectiveStatus) {
    return { allowed: false, reasonCode: 'no_subscription' };
  }
  if (subscriptionStatusIsEligible(input.effectiveStatus)) {
    return { allowed: true, reasonCode: 'ok' };
  }
  if (input.effectiveStatus === 'suspended') {
    return { allowed: false, reasonCode: 'subscription_suspended' };
  }
  if (input.effectiveStatus === 'cancelled') {
    return { allowed: false, reasonCode: 'subscription_cancelled' };
  }
  return { allowed: false, reasonCode: 'subscription_overdue' };
}
