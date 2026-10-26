import type { RegistrationCountry } from '@/features/platform/onboarding/validation';
import {
  ENTITLEMENT_KEYS,
  type BillingInterval,
  type PlanEntitlements,
  type PriceKind,
} from '@/features/platform/subscriptions/types';

const PLAN_CODE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;

export type PlanDraftInput = Readonly<{
  code: string;
  name: string;
  description: string;
  registrationCountry: RegistrationCountry | '';
  billingInterval: BillingInterval | '';
  priceKind: PriceKind | '';
  amount: string;
  trialDays: string;
  graceDays: string;
  entitlements: PlanEntitlements;
}>;

export function emptyPlanDraft(): PlanDraftInput {
  return {
    code: '',
    name: '',
    description: '',
    registrationCountry: '',
    billingInterval: '',
    priceKind: '',
    amount: '',
    trialDays: '0',
    graceDays: '0',
    entitlements: {},
  };
}

export function currencyForCountry(
  country: RegistrationCountry,
): 'NPR' | 'INR' {
  return country === 'Nepal' ? 'NPR' : 'INR';
}

export function parseMoneyAmount(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return null;
  }
  return value;
}

export function validatePlanEntitlements(
  entitlements: PlanEntitlements,
): string | null {
  for (const key of Object.keys(entitlements)) {
    if (!(ENTITLEMENT_KEYS as readonly string[]).includes(key)) {
      return 'Unknown entitlement keys are not allowed.';
    }
  }
  if (
    entitlements.max_active_projects !== undefined &&
    (!Number.isInteger(entitlements.max_active_projects) ||
      entitlements.max_active_projects < 0)
  ) {
    return 'max_active_projects must be a non-negative integer.';
  }
  if (
    entitlements.max_users !== undefined &&
    (!Number.isInteger(entitlements.max_users) || entitlements.max_users < 0)
  ) {
    return 'max_users must be a non-negative integer.';
  }
  return null;
}

export function validatePlanDraft(draft: PlanDraftInput): string | null {
  if (!PLAN_CODE.test(draft.code.trim())) {
    return 'Enter a stable plan code of 1–40 letters, numbers, underscores, or hyphens.';
  }
  if (draft.name.trim().length < 1 || draft.name.trim().length > 120) {
    return 'Enter a plan name between 1 and 120 characters.';
  }
  if (
    draft.registrationCountry !== 'Nepal' &&
    draft.registrationCountry !== 'India'
  ) {
    return 'Choose Nepal or India.';
  }
  if (
    draft.billingInterval !== 'monthly' &&
    draft.billingInterval !== 'annual' &&
    draft.billingInterval !== 'lifetime'
  ) {
    return 'Choose monthly, annual, or lifetime.';
  }
  if (draft.priceKind !== 'paid' && draft.priceKind !== 'free') {
    return 'Choose paid or free.';
  }
  const amount = parseMoneyAmount(draft.amount);
  if (amount === null) {
    return 'Enter an amount with up to two decimal places.';
  }
  if (draft.priceKind === 'free' && amount !== 0) {
    return 'A free plan amount must be 0.';
  }
  if (draft.priceKind === 'paid' && amount <= 0) {
    return 'A paid plan amount must be greater than zero.';
  }
  const trialDays = Number(draft.trialDays);
  const graceDays = Number(draft.graceDays);
  if (!Number.isInteger(trialDays) || trialDays < 0 || trialDays > 3650) {
    return 'Trial days must be an integer from 0 to 3650.';
  }
  if (!Number.isInteger(graceDays) || graceDays < 0 || graceDays > 365) {
    return 'Grace days must be an integer from 0 to 365.';
  }
  return validatePlanEntitlements(draft.entitlements);
}

export function validatePaymentAmount(
  amount: string,
  currency: 'NPR' | 'INR',
  subscriptionCurrency: 'NPR' | 'INR',
): string | null {
  if (currency !== subscriptionCurrency) {
    return 'Payment currency must match the subscription billing currency.';
  }
  const value = parseMoneyAmount(amount);
  if (value === null || value <= 0) {
    return 'Enter a payment amount greater than zero.';
  }
  return null;
}
