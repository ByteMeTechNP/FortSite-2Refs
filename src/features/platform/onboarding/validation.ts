export const REGISTRATION_COUNTRIES = ['Nepal', 'India'] as const;

export type RegistrationCountry = (typeof REGISTRATION_COUNTRIES)[number];

export type JurisdictionProfile = Readonly<{
  currency: 'NPR' | 'INR';
  timezone: 'Asia/Kathmandu' | 'Asia/Kolkata';
  routeKey: 'nepal_cbms' | 'india_irn';
}>;

const JURISDICTIONS: Record<RegistrationCountry, JurisdictionProfile> = {
  Nepal: {
    currency: 'NPR',
    timezone: 'Asia/Kathmandu',
    routeKey: 'nepal_cbms',
  },
  India: {
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    routeKey: 'india_irn',
  },
};

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const PLAN_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,39}$/;

export function isRegistrationCountry(
  value: string,
): value is RegistrationCountry {
  return (REGISTRATION_COUNTRIES as readonly string[]).includes(value);
}

export function jurisdictionFor(
  country: RegistrationCountry,
): JurisdictionProfile {
  return JURISDICTIONS[country];
}

export type OnboardingDraft = Readonly<{
  legalName: string;
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  locality: string;
  registrationCountry: RegistrationCountry | '';
  adminEmail: string;
  adminDisplayName: string;
  emailAttested: boolean;
  requestedPlanCode: string;
  trialRequested: boolean;
}>;

export function emptyOnboardingDraft(): OnboardingDraft {
  return {
    legalName: '',
    displayName: '',
    contactEmail: '',
    contactPhone: '',
    locality: '',
    registrationCountry: '',
    adminEmail: '',
    adminDisplayName: '',
    emailAttested: false,
    requestedPlanCode: '',
    trialRequested: false,
  };
}

function optionalEmail(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (
    trimmed.length < 3 ||
    trimmed.length > 254 ||
    !EMAIL_PATTERN.test(trimmed)
  ) {
    return `Enter a valid ${label}, or leave it blank.`;
  }
  return null;
}

export function validateOnboardingDraft(draft: OnboardingDraft): string | null {
  const legalName = draft.legalName.trim();
  if (legalName.length < 2 || legalName.length > 200) {
    return 'Enter the company legal name.';
  }
  if (!isRegistrationCountry(draft.registrationCountry)) {
    return 'Choose Nepal or India. Currency and timezone follow that country.';
  }
  const contactEmail = optionalEmail(draft.contactEmail, 'contact email');
  if (contactEmail) {
    return contactEmail;
  }
  const phone = draft.contactPhone.trim();
  if (phone && (phone.length < 3 || phone.length > 32)) {
    return 'Enter a contact phone between 3 and 32 characters, or leave it blank.';
  }
  const locality = draft.locality.trim();
  if (locality.length > 120) {
    return 'Enter a shorter locality, or leave it blank.';
  }
  const adminEmail = draft.adminEmail.trim();
  if (
    adminEmail.length < 3 ||
    adminEmail.length > 254 ||
    !EMAIL_PATTERN.test(adminEmail)
  ) {
    return 'Enter a valid founding administrator email.';
  }
  const adminName = draft.adminDisplayName.trim();
  if (adminName.length < 1 || adminName.length > 120) {
    return 'Enter the founding administrator name.';
  }
  if (!draft.emailAttested) {
    return 'Confirm the founding administrator email before continuing.';
  }
  const plan = draft.requestedPlanCode.trim();
  if (plan && !PLAN_CODE_PATTERN.test(plan)) {
    return 'Plan codes use letters, numbers, and hyphens only.';
  }
  return null;
}

export function validateOnboardingStep(
  draft: OnboardingDraft,
  step: number,
): string | null {
  if (step === 0) {
    const legalName = draft.legalName.trim();
    if (legalName.length < 2 || legalName.length > 200) {
      return 'Enter the company legal name.';
    }
    const contactEmail = optionalEmail(draft.contactEmail, 'contact email');
    if (contactEmail) {
      return contactEmail;
    }
    const phone = draft.contactPhone.trim();
    if (phone && (phone.length < 3 || phone.length > 32)) {
      return 'Enter a contact phone between 3 and 32 characters, or leave it blank.';
    }
    if (draft.locality.trim().length > 120) {
      return 'Enter a shorter locality, or leave it blank.';
    }
    return null;
  }
  if (step === 1 && !isRegistrationCountry(draft.registrationCountry)) {
    return 'Choose Nepal or India. Currency and timezone follow that country.';
  }
  if (step === 2) {
    const adminEmail = draft.adminEmail.trim();
    if (
      adminEmail.length < 3 ||
      adminEmail.length > 254 ||
      !EMAIL_PATTERN.test(adminEmail)
    ) {
      return 'Enter a valid founding administrator email.';
    }
    const adminName = draft.adminDisplayName.trim();
    if (adminName.length < 1 || adminName.length > 120) {
      return 'Enter the founding administrator name.';
    }
    if (!draft.emailAttested) {
      return 'Confirm the founding administrator email before continuing.';
    }
    return null;
  }
  if (step === 3) {
    const plan = draft.requestedPlanCode.trim();
    if (plan && !PLAN_CODE_PATTERN.test(plan)) {
      return 'Plan codes use letters, numbers, and hyphens only.';
    }
  }
  return null;
}
