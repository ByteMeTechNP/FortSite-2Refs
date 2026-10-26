import { describe, expect, it } from 'vitest';

import {
  effectiveSubscriptionStatus,
  evaluateAccessMatrix,
  subscriptionStatusIsEligible,
} from '@/features/platform/subscriptions/eligibility';

describe('effectiveSubscriptionStatus', () => {
  const base = {
    trialEndsAt: null as Date | null,
    periodEndsAt: null as Date | null,
    endsAt: null as Date | null,
    graceEndsAt: null as Date | null,
    cancelAtPeriodEnd: false,
  };

  it('keeps an active term before the period end', () => {
    expect(
      effectiveSubscriptionStatus({
        ...base,
        status: 'active',
        periodEndsAt: new Date('2026-12-01T00:00:00.000Z'),
        now: new Date('2026-06-01T00:00:00.000Z'),
      }),
    ).toBe('active');
  });

  it('moves an expired trial into grace before grace ends', () => {
    expect(
      effectiveSubscriptionStatus({
        ...base,
        status: 'trial',
        trialEndsAt: new Date('2026-01-10T00:00:00.000Z'),
        graceEndsAt: new Date('2026-01-17T00:00:00.000Z'),
        now: new Date('2026-01-12T00:00:00.000Z'),
      }),
    ).toBe('grace');
  });

  it('marks post-grace trial as overdue', () => {
    expect(
      effectiveSubscriptionStatus({
        ...base,
        status: 'trial',
        trialEndsAt: new Date('2026-01-10T00:00:00.000Z'),
        graceEndsAt: new Date('2026-01-17T00:00:00.000Z'),
        now: new Date('2026-01-18T00:00:00.000Z'),
      }),
    ).toBe('overdue');
  });

  it('honours cancel_at_period_end as cancelled after the boundary', () => {
    expect(
      effectiveSubscriptionStatus({
        ...base,
        status: 'active',
        periodEndsAt: new Date('2026-02-01T00:00:00.000Z'),
        cancelAtPeriodEnd: true,
        now: new Date('2026-02-02T00:00:00.000Z'),
      }),
    ).toBe('cancelled');
  });

  it('never treats lifetime with a far-future end', () => {
    expect(
      effectiveSubscriptionStatus({
        ...base,
        status: 'active',
        endsAt: null,
        periodEndsAt: null,
        now: new Date('2099-01-01T00:00:00.000Z'),
      }),
    ).toBe('active');
  });
});

describe('evaluateAccessMatrix', () => {
  it('denies paused companies even with an active subscription', () => {
    expect(
      evaluateAccessMatrix({
        lifecycle: 'paused',
        effectiveStatus: 'active',
      }),
    ).toEqual({ allowed: false, reasonCode: 'company_not_active' });
  });

  it('allows active companies in grace', () => {
    expect(
      evaluateAccessMatrix({
        lifecycle: 'active',
        effectiveStatus: 'grace',
      }),
    ).toEqual({ allowed: true, reasonCode: 'ok' });
    expect(subscriptionStatusIsEligible('grace')).toBe(true);
  });

  it('denies overdue after grace', () => {
    expect(
      evaluateAccessMatrix({
        lifecycle: 'active',
        effectiveStatus: 'overdue',
      }),
    ).toEqual({ allowed: false, reasonCode: 'subscription_overdue' });
  });
});
