import {
  isCompanyLifecycleStatus,
  type CompanyLifecycleStatus,
} from '@/features/platform/types';
import {
  isRegistrationCountry,
  jurisdictionFor,
  type RegistrationCountry,
} from '@/features/platform/onboarding/validation';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const COMPANY_CODE_PATTERN = /^FS-[A-Z0-9]{8}$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

export type BeginCompanyResult = Readonly<{
  companyId: string;
  provisioningId: string;
  companyCode: string;
  registrationCountry: RegistrationCountry;
  defaultCurrency: 'NPR' | 'INR';
  timezone: 'Asia/Kathmandu' | 'Asia/Kolkata';
  lifecycleStatus: string;
  reused: boolean;
}>;

export function parseBeginCompanyResult(
  value: unknown,
): BeginCompanyResult | null {
  if (!isRecord(value)) {
    return null;
  }
  const country = value.registration_country;
  if (typeof country !== 'string' || !isRegistrationCountry(country)) {
    return null;
  }
  const locked = jurisdictionFor(country);
  if (
    typeof value.company_id !== 'string' ||
    !UUID_PATTERN.test(value.company_id) ||
    typeof value.provisioning_id !== 'string' ||
    !UUID_PATTERN.test(value.provisioning_id) ||
    typeof value.company_code !== 'string' ||
    !COMPANY_CODE_PATTERN.test(value.company_code) ||
    value.default_currency !== locked.currency ||
    value.timezone !== locked.timezone ||
    typeof value.lifecycle_status !== 'string' ||
    !isCompanyLifecycleStatus(value.lifecycle_status) ||
    typeof value.reused !== 'boolean'
  ) {
    return null;
  }
  return {
    companyId: value.company_id,
    provisioningId: value.provisioning_id,
    companyCode: value.company_code,
    registrationCountry: country,
    defaultCurrency: locked.currency,
    timezone: locked.timezone,
    lifecycleStatus: value.lifecycle_status,
    reused: value.reused,
  };
}

export type ProvisionOutcome =
  | Readonly<{ status: 'issued'; password: string }>
  | Readonly<{ status: 'already_issued' }>
  | Readonly<{ status: 'conflict' }>
  | Readonly<{ status: 'forbidden' }>
  | Readonly<{ status: 'error' }>;

/**
 * Maps an Edge Function payload to a UI outcome.
 * An already-issued response never becomes a revealed password, even if a
 * password field is present.
 */
export function mapProvisionPayload(value: unknown): ProvisionOutcome {
  if (!isRecord(value)) {
    return { status: 'error' };
  }
  if (value.status === 'already_issued') {
    return { status: 'already_issued' };
  }
  if (value.code === 'email_conflict' || value.status === 'conflict') {
    return { status: 'conflict' };
  }
  if (value.code === 'forbidden') {
    return { status: 'forbidden' };
  }
  if (
    value.ok === true &&
    value.status === 'issued' &&
    typeof value.password === 'string' &&
    value.password.length >= 12
  ) {
    return { status: 'issued', password: value.password };
  }
  return { status: 'error' };
}

const SAFE_RPC_MESSAGES: Readonly<Record<string, string>> = {
  email_attestation_required:
    'Confirm the founding administrator email before continuing.',
  registration_country_invalid:
    'Legal registration country must be Nepal or India.',
  legal_name_invalid: 'Enter the company legal name.',
  admin_email_invalid: 'Enter a valid founding administrator email.',
  admin_display_name_invalid: 'Enter the founding administrator name.',
  contact_email_invalid:
    'Enter a valid company contact email, or leave it blank.',
  contact_phone_invalid: 'Enter a shorter contact phone, or leave it blank.',
  locality_invalid: 'Enter a shorter locality, or leave it blank.',
  plan_code_invalid: 'Plan codes use letters, numbers, and hyphens only.',
  idempotency_key_invalid:
    'The onboarding request could not be started. Refresh and try again.',
  idempotency_conflict:
    'This onboarding attempt does not match the earlier request.',
  lifecycle_reason_required: 'Enter a reason of at least 3 characters.',
  lifecycle_transition_rejected: 'That lifecycle change is not allowed.',
  activation_requirements_missing:
    'Activate only after the founding administrator password has been issued.',
  company_not_found: 'That company is not available.',
};

const GENERIC_RPC_MESSAGE = 'The request could not be completed.';

export function safeRpcMessage(
  error: { message?: string; code?: string } | null,
): string {
  if (!error) {
    return GENERIC_RPC_MESSAGE;
  }
  if (error.code === '42501') {
    return 'You do not have permission to do that.';
  }
  const known = error.message ? SAFE_RPC_MESSAGES[error.message] : undefined;
  return known ?? GENERIC_RPC_MESSAGE;
}

export type CompanyOnboardingDetail = Readonly<{
  company: Readonly<{
    id: string;
    companyCode: string;
    legalName: string;
    displayName: string | null;
    registrationCountry: RegistrationCountry;
    defaultCurrency: 'NPR' | 'INR';
    timezone: 'Asia/Kathmandu' | 'Asia/Kolkata';
    lifecycleStatus: CompanyLifecycleStatus;
    contactEmail: string | null;
    contactPhone: string | null;
    locality: string | null;
  }>;
  compliance: Readonly<{
    routeKey: string;
    setupState: 'not_configured';
  }> | null;
  subscriptionIntent: Readonly<{
    requestedPlanCode: string | null;
    trialRequested: boolean;
  }> | null;
  provisioning: Readonly<{
    id: string;
    adminEmail: string;
    adminDisplayName: string;
    state: 'company_recorded' | 'auth_created' | 'linked';
    handoff: 'not_issued' | 'issued';
    failureCode: 'email_conflict' | 'auth_failed' | 'link_failed' | null;
  }> | null;
}>;

function optionalText(value: unknown): string | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

export function parseCompanyOnboardingDetail(
  value: unknown,
): CompanyOnboardingDetail | null {
  if (!isRecord(value) || !isRecord(value.company)) {
    return null;
  }
  const company = value.company;
  const country = company.registration_country;
  if (typeof country !== 'string' || !isRegistrationCountry(country)) {
    return null;
  }
  const locked = jurisdictionFor(country);
  const lifecycle = company.lifecycle_status;
  if (
    typeof company.id !== 'string' ||
    typeof company.company_code !== 'string' ||
    typeof company.legal_name !== 'string' ||
    typeof lifecycle !== 'string' ||
    !isCompanyLifecycleStatus(lifecycle) ||
    company.default_currency !== locked.currency ||
    company.timezone !== locked.timezone
  ) {
    return null;
  }
  const displayName = optionalText(company.display_name);
  const contactEmail = optionalText(company.contact_email);
  const contactPhone = optionalText(company.contact_phone);
  const locality = optionalText(company.locality);
  if (
    displayName === undefined ||
    contactEmail === undefined ||
    contactPhone === undefined ||
    locality === undefined
  ) {
    return null;
  }

  let compliance: CompanyOnboardingDetail['compliance'] = null;
  if (value.compliance !== null && value.compliance !== undefined) {
    if (!isRecord(value.compliance)) {
      return null;
    }
    if (
      value.compliance.setup_state !== 'not_configured' ||
      typeof value.compliance.route_key !== 'string'
    ) {
      return null;
    }
    compliance = {
      routeKey: value.compliance.route_key,
      setupState: 'not_configured',
    };
  }

  let subscriptionIntent: CompanyOnboardingDetail['subscriptionIntent'] = null;
  if (
    value.subscription_intent !== null &&
    value.subscription_intent !== undefined
  ) {
    if (!isRecord(value.subscription_intent)) {
      return null;
    }
    const plan = optionalText(value.subscription_intent.requested_plan_code);
    if (
      plan === undefined ||
      typeof value.subscription_intent.trial_requested !== 'boolean'
    ) {
      return null;
    }
    subscriptionIntent = {
      requestedPlanCode: plan,
      trialRequested: value.subscription_intent.trial_requested,
    };
  }

  let provisioning: CompanyOnboardingDetail['provisioning'] = null;
  if (value.provisioning !== null && value.provisioning !== undefined) {
    if (!isRecord(value.provisioning)) {
      return null;
    }
    const state = value.provisioning.state;
    const handoff = value.provisioning.handoff;
    const failure = value.provisioning.failure_code;
    const failureCode =
      failure === 'email_conflict' ||
      failure === 'auth_failed' ||
      failure === 'link_failed'
        ? failure
        : failure === null
          ? null
          : undefined;
    if (
      typeof value.provisioning.id !== 'string' ||
      typeof value.provisioning.admin_email !== 'string' ||
      typeof value.provisioning.admin_display_name !== 'string' ||
      (state !== 'company_recorded' &&
        state !== 'auth_created' &&
        state !== 'linked') ||
      (handoff !== 'not_issued' && handoff !== 'issued') ||
      failureCode === undefined
    ) {
      return null;
    }
    provisioning = {
      id: value.provisioning.id,
      adminEmail: value.provisioning.admin_email,
      adminDisplayName: value.provisioning.admin_display_name,
      state,
      handoff,
      failureCode,
    };
  }

  return {
    company: {
      id: company.id,
      companyCode: company.company_code,
      legalName: company.legal_name,
      displayName,
      registrationCountry: country,
      defaultCurrency: locked.currency,
      timezone: locked.timezone,
      lifecycleStatus: lifecycle,
      contactEmail,
      contactPhone,
      locality,
    },
    compliance,
    subscriptionIntent,
    provisioning,
  };
}

export function provisionFailureMessage(
  code: 'email_conflict' | 'auth_failed' | 'link_failed' | null,
): string | null {
  if (code === 'email_conflict') {
    return 'This email cannot be used for a new founding administrator.';
  }
  if (code === 'auth_failed' || code === 'link_failed') {
    return 'The founding administrator could not be provisioned.';
  }
  return null;
}
