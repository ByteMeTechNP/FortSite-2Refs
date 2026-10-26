import { getBrowserSupabaseClient } from '@/lib/supabase';
import {
  mapProvisionPayload,
  parseBeginCompanyResult,
  parseCompanyOnboardingDetail,
  safeRpcMessage,
  type BeginCompanyResult,
  type CompanyOnboardingDetail,
  type ProvisionOutcome,
} from '@/features/platform/onboarding/parse';
import type { RegistrationCountry } from '@/features/platform/onboarding/validation';
import type { CompanyLifecycleStatus } from '@/features/platform/types';

export type BeginCompanyInput = Readonly<{
  legalName: string;
  displayName: string;
  contactEmail: string;
  contactPhone: string;
  locality: string;
  registrationCountry: RegistrationCountry;
  adminEmail: string;
  adminDisplayName: string;
  emailAttested: true;
  requestedPlanCode: string;
  trialRequested: boolean;
  idempotencyKey: string;
}>;

export type BeginOutcome =
  | Readonly<{ ok: true; result: BeginCompanyResult }>
  | Readonly<{ ok: false; message: string }>;

export type DetailOutcome =
  | Readonly<{ ok: true; detail: CompanyOnboardingDetail }>
  | Readonly<{ ok: false; message: string }>;

export type TransitionOutcome =
  Readonly<{ ok: true }> | Readonly<{ ok: false; message: string }>;

export type OnboardingApi = Readonly<{
  beginCompanyOnboarding: (input: BeginCompanyInput) => Promise<BeginOutcome>;
  provisionFoundingAdmin: (provisioningId: string) => Promise<ProvisionOutcome>;
  resetFoundingAdminPassword: (
    provisioningId: string,
  ) => Promise<ProvisionOutcome>;
  getCompanyOnboarding: (companyId: string) => Promise<DetailOutcome>;
  transitionCompanyLifecycle: (input: {
    companyId: string;
    nextStatus: CompanyLifecycleStatus;
    reason: string;
  }) => Promise<TransitionOutcome>;
}>;

type RpcError = { message: string; code?: string };

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: RpcError | null }>;
  functions: {
    invoke: (
      name: string,
      options: { body: Record<string, unknown> },
    ) => Promise<{ data: unknown; error: unknown }>;
  };
};

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

async function readInvokePayload(error: unknown): Promise<unknown> {
  if (!error || typeof error !== 'object' || !('context' in error)) {
    return null;
  }
  const context = (error as { context?: unknown }).context;
  if (context instanceof Response) {
    try {
      return (await context.clone().json()) as unknown;
    } catch {
      return null;
    }
  }
  return null;
}

async function invokeProvisioning(
  client: RpcClient,
  name: string,
  provisioningId: string,
): Promise<ProvisionOutcome> {
  try {
    const { data, error } = await client.functions.invoke(name, {
      body: { provisioning_id: provisioningId },
    });
    if (error) {
      const payload = await readInvokePayload(error);
      return mapProvisionPayload(payload);
    }
    return mapProvisionPayload(data);
  } catch {
    return { status: 'error' };
  }
}

export function createOnboardingApi(client: RpcClient): OnboardingApi {
  return {
    async beginCompanyOnboarding(input) {
      try {
        const { data, error } = await client.rpc('begin_company_onboarding', {
          p_legal_name: input.legalName.trim(),
          p_display_name: blankToNull(input.displayName),
          p_contact_email: blankToNull(input.contactEmail),
          p_contact_phone: blankToNull(input.contactPhone),
          p_locality: blankToNull(input.locality),
          p_registration_country: input.registrationCountry,
          p_admin_email: input.adminEmail.trim(),
          p_admin_display_name: input.adminDisplayName.trim(),
          p_requested_plan_code: blankToNull(input.requestedPlanCode),
          p_trial_requested: input.trialRequested,
          p_idempotency_key: input.idempotencyKey,
          p_email_attested: input.emailAttested,
        });
        if (error) {
          return { ok: false, message: safeRpcMessage(error) };
        }
        const result = parseBeginCompanyResult(data);
        if (!result) {
          return { ok: false, message: 'The request could not be completed.' };
        }
        return { ok: true, result };
      } catch {
        return { ok: false, message: 'The request could not be completed.' };
      }
    },
    provisionFoundingAdmin(provisioningId) {
      return invokeProvisioning(
        client,
        'provision-founding-admin',
        provisioningId,
      );
    },
    resetFoundingAdminPassword(provisioningId) {
      return invokeProvisioning(
        client,
        'reset-founding-admin-password',
        provisioningId,
      );
    },
    async getCompanyOnboarding(companyId) {
      try {
        const { data, error } = await client.rpc('get_company_onboarding', {
          p_company_id: companyId,
        });
        if (error) {
          return { ok: false, message: safeRpcMessage(error) };
        }
        const detail = parseCompanyOnboardingDetail(data);
        if (!detail) {
          return { ok: false, message: 'The request could not be completed.' };
        }
        return { ok: true, detail };
      } catch {
        return { ok: false, message: 'The request could not be completed.' };
      }
    },
    async transitionCompanyLifecycle(input) {
      try {
        const { error } = await client.rpc('transition_company_lifecycle', {
          p_company_id: input.companyId,
          p_next_status: input.nextStatus,
          p_reason: input.reason.trim(),
        });
        if (error) {
          return { ok: false, message: safeRpcMessage(error) };
        }
        return { ok: true };
      } catch {
        return { ok: false, message: 'The request could not be completed.' };
      }
    },
  };
}

export function createBrowserOnboardingApi(): OnboardingApi {
  const client = (): RpcClient =>
    getBrowserSupabaseClient() as unknown as RpcClient;
  return createOnboardingApi({
    rpc: (fn, args) => client().rpc(fn, args),
    functions: {
      invoke: (name, options) => client().functions.invoke(name, options),
    },
  });
}
