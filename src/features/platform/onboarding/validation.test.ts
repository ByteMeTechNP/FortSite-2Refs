import { describe, expect, it } from 'vitest';

import {
  emptyOnboardingDraft,
  jurisdictionFor,
  validateOnboardingDraft,
  type OnboardingDraft,
} from '@/features/platform/onboarding/validation';

function readyDraft(overrides: Partial<OnboardingDraft> = {}): OnboardingDraft {
  return {
    ...emptyOnboardingDraft(),
    legalName: 'Himalayan Works Pvt Ltd',
    registrationCountry: 'Nepal',
    adminEmail: 'admin@example.com',
    adminDisplayName: 'Asha Sharma',
    emailAttested: true,
    ...overrides,
  };
}

describe('onboarding validation', () => {
  it('locks Nepal and India to one currency and timezone each', () => {
    expect(jurisdictionFor('Nepal')).toEqual({
      currency: 'NPR',
      timezone: 'Asia/Kathmandu',
      routeKey: 'nepal_cbms',
    });
    expect(jurisdictionFor('India')).toEqual({
      currency: 'INR',
      timezone: 'Asia/Kolkata',
      routeKey: 'india_irn',
    });
  });

  it('requires a country and an attested admin email', () => {
    expect(
      validateOnboardingDraft(
        readyDraft({ registrationCountry: '', emailAttested: false }),
      ),
    ).toMatch(/Nepal or India/);
    expect(
      validateOnboardingDraft(readyDraft({ emailAttested: false })),
    ).toMatch(/Confirm the founding administrator email/);
    expect(validateOnboardingDraft(readyDraft())).toBeNull();
  });

  it('rejects a plan code that looks like a price', () => {
    expect(
      validateOnboardingDraft(readyDraft({ requestedPlanCode: 'NPR 5000' })),
    ).toMatch(/Plan codes/);
  });
});
