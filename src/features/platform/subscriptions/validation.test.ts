import { describe, expect, it } from 'vitest';

import {
  emptyPlanDraft,
  parseMoneyAmount,
  validatePaymentAmount,
  validatePlanDraft,
} from '@/features/platform/subscriptions/validation';

describe('validatePlanDraft', () => {
  it('accepts a paid Nepal draft', () => {
    const draft = {
      ...emptyPlanDraft(),
      code: 'nepal-starter',
      name: 'Nepal Starter',
      registrationCountry: 'Nepal' as const,
      billingInterval: 'monthly' as const,
      priceKind: 'paid' as const,
      amount: '4999.50',
      trialDays: '14',
      graceDays: '7',
      entitlements: { max_users: 10, marketplace_enabled: false },
    };
    expect(validatePlanDraft(draft)).toBeNull();
  });

  it('rejects a missing amount masquerading as free', () => {
    const draft = {
      ...emptyPlanDraft(),
      code: 'free-plan',
      name: 'Free',
      registrationCountry: 'India' as const,
      billingInterval: 'lifetime' as const,
      priceKind: 'free' as const,
      amount: '',
    };
    expect(validatePlanDraft(draft)).toMatch(/amount/i);
  });

  it('rejects unknown entitlement keys', () => {
    const draft = {
      ...emptyPlanDraft(),
      code: 'india-pro',
      name: 'India Pro',
      registrationCountry: 'India' as const,
      billingInterval: 'annual' as const,
      priceKind: 'paid' as const,
      amount: '1000',
      entitlements: { mystery_flag: true } as never,
    };
    expect(validatePlanDraft(draft)).toMatch(/unknown entitlement/i);
  });
});

describe('money and payment validation', () => {
  it('parses two-decimal amounts only', () => {
    expect(parseMoneyAmount('10.25')).toBe(10.25);
    expect(parseMoneyAmount('10.255')).toBeNull();
    expect(parseMoneyAmount('-1')).toBeNull();
  });

  it('rejects cross-currency payments', () => {
    expect(validatePaymentAmount('100', 'NPR', 'INR')).toMatch(/match/i);
    expect(validatePaymentAmount('0', 'INR', 'INR')).toMatch(
      /greater than zero/i,
    );
    expect(validatePaymentAmount('12.00', 'INR', 'INR')).toBeNull();
  });
});
