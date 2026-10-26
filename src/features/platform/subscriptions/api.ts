import { getBrowserSupabaseClient } from '@/lib/supabase';
import type { RegistrationCountry } from '@/features/platform/onboarding/validation';
import {
  parseAccessDecision,
  parseSubscriptionCounts,
  safeRpcMessage,
} from '@/features/platform/subscriptions/parse';
import type {
  AdjustmentKind,
  BillingInterval,
  PaymentMethod,
  PlanEntitlements,
  PriceKind,
  SubscriptionCounts,
  SubscriptionStatus,
} from '@/features/platform/subscriptions/types';

type RpcError = { message: string; code?: string };

type RpcClient = {
  rpc: (
    fn: string,
    args?: Record<string, unknown>,
  ) => Promise<{ data: unknown; error: RpcError | null }>;
};

export type CreatePlanDraftInput = Readonly<{
  code: string;
  name: string;
  description: string;
  registrationCountry: RegistrationCountry;
  billingInterval: BillingInterval;
  priceKind: PriceKind;
  amount: number;
  trialDays: number;
  graceDays: number;
  entitlements: PlanEntitlements;
}>;

type Outcome = { ok: true; data: unknown } | { ok: false; message: string };

export type SubscriptionApi = Readonly<{
  createPlanDraft: (input: CreatePlanDraftInput) => Promise<Outcome>;
  publishPlanVersion: (versionId: string) => Promise<Outcome>;
  retirePlanVersion: (versionId: string, reason: string) => Promise<Outcome>;
  listPlans: (filters?: {
    status?: string;
    country?: string;
  }) => Promise<Outcome>;
  getPlan: (planId: string) => Promise<Outcome>;
  listSubscriptions: (filters?: {
    status?: SubscriptionStatus;
    companyId?: string;
  }) => Promise<Outcome>;
  getSubscription: (subscriptionId: string) => Promise<Outcome>;
  resolveIntent: (input: {
    companyId: string;
    termInterval: BillingInterval;
    endsAt: string | null;
    idempotencyKey: string;
    reason: string;
  }) => Promise<Outcome>;
  convertTrial: (input: {
    subscriptionId: string;
    reason: string;
    idempotencyKey: string;
  }) => Promise<Outcome>;
  suspendSubscription: (input: {
    subscriptionId: string;
    reason: string;
    idempotencyKey: string;
  }) => Promise<Outcome>;
  reactivateSubscription: (input: {
    subscriptionId: string;
    reason: string;
    idempotencyKey: string;
  }) => Promise<Outcome>;
  cancelSubscription: (input: {
    subscriptionId: string;
    mode: 'immediate' | 'at_period_end';
    reason: string;
    idempotencyKey: string;
  }) => Promise<Outcome>;
  extendSubscription: (input: {
    subscriptionId: string;
    newEndsAt: string;
    reason: string;
    idempotencyKey: string;
  }) => Promise<Outcome>;
  recordPayment: (input: {
    subscriptionId: string;
    amount: number;
    receivedOn: string;
    paymentMethod: PaymentMethod;
    idempotencyKey: string;
    externalReference?: string;
    notes?: string;
  }) => Promise<Outcome>;
  recordAdjustment: (input: {
    subscriptionId: string;
    kind: AdjustmentKind;
    amount: number;
    effectiveOn: string;
    reason: string;
    idempotencyKey: string;
    paymentId?: string;
  }) => Promise<Outcome>;
  getOverviewCounts: () => Promise<
    { ok: true; counts: SubscriptionCounts } | { ok: false; message: string }
  >;
  getMySummary: () => Promise<Outcome>;
}>;

async function rpcResult(
  client: RpcClient,
  fn: string,
  args?: Record<string, unknown>,
): Promise<Outcome> {
  try {
    const { data, error } = await client.rpc(fn, args);
    if (error) {
      return { ok: false, message: safeRpcMessage(error) };
    }
    return { ok: true, data };
  } catch {
    return { ok: false, message: 'The request could not be completed.' };
  }
}

export function createSubscriptionApi(client: RpcClient): SubscriptionApi {
  return {
    createPlanDraft(input) {
      return rpcResult(client, 'create_subscription_plan_draft', {
        p_code: input.code,
        p_name: input.name,
        p_description: input.description || null,
        p_registration_country: input.registrationCountry,
        p_billing_interval: input.billingInterval,
        p_price_kind: input.priceKind,
        p_amount: input.amount,
        p_trial_days: input.trialDays,
        p_grace_days: input.graceDays,
        p_entitlements: input.entitlements,
      });
    },
    publishPlanVersion(versionId) {
      return rpcResult(client, 'publish_subscription_plan_version', {
        p_version_id: versionId,
      });
    },
    retirePlanVersion(versionId, reason) {
      return rpcResult(client, 'retire_subscription_plan_version', {
        p_version_id: versionId,
        p_reason: reason,
      });
    },
    listPlans(filters = {}) {
      return rpcResult(client, 'list_subscription_plans', {
        p_status: filters.status ?? null,
        p_registration_country: filters.country ?? null,
      });
    },
    getPlan(planId) {
      return rpcResult(client, 'get_subscription_plan', {
        p_plan_id: planId,
      });
    },
    listSubscriptions(filters = {}) {
      return rpcResult(client, 'list_company_subscriptions', {
        p_status: filters.status ?? null,
        p_company_id: filters.companyId ?? null,
      });
    },
    getSubscription(subscriptionId) {
      return rpcResult(client, 'get_company_subscription', {
        p_subscription_id: subscriptionId,
      });
    },
    resolveIntent(input) {
      return rpcResult(client, 'resolve_subscription_intent', {
        p_company_id: input.companyId,
        p_term_interval: input.termInterval,
        p_ends_at: input.endsAt,
        p_idempotency_key: input.idempotencyKey,
        p_reason: input.reason,
      });
    },
    convertTrial(input) {
      return rpcResult(client, 'convert_subscription_trial', {
        p_subscription_id: input.subscriptionId,
        p_reason: input.reason,
        p_idempotency_key: input.idempotencyKey,
      });
    },
    suspendSubscription(input) {
      return rpcResult(client, 'suspend_company_subscription', {
        p_subscription_id: input.subscriptionId,
        p_reason: input.reason,
        p_idempotency_key: input.idempotencyKey,
      });
    },
    reactivateSubscription(input) {
      return rpcResult(client, 'reactivate_company_subscription', {
        p_subscription_id: input.subscriptionId,
        p_reason: input.reason,
        p_idempotency_key: input.idempotencyKey,
      });
    },
    cancelSubscription(input) {
      return rpcResult(client, 'cancel_company_subscription', {
        p_subscription_id: input.subscriptionId,
        p_mode: input.mode,
        p_reason: input.reason,
        p_idempotency_key: input.idempotencyKey,
      });
    },
    extendSubscription(input) {
      return rpcResult(client, 'extend_company_subscription', {
        p_subscription_id: input.subscriptionId,
        p_new_ends_at: input.newEndsAt,
        p_reason: input.reason,
        p_idempotency_key: input.idempotencyKey,
      });
    },
    recordPayment(input) {
      return rpcResult(client, 'record_subscription_payment', {
        p_subscription_id: input.subscriptionId,
        p_amount: input.amount,
        p_received_on: input.receivedOn,
        p_payment_method: input.paymentMethod,
        p_idempotency_key: input.idempotencyKey,
        p_external_reference: input.externalReference ?? null,
        p_notes: input.notes ?? null,
      });
    },
    recordAdjustment(input) {
      return rpcResult(client, 'record_subscription_adjustment', {
        p_subscription_id: input.subscriptionId,
        p_kind: input.kind,
        p_amount: input.amount,
        p_effective_on: input.effectiveOn,
        p_reason: input.reason,
        p_idempotency_key: input.idempotencyKey,
        p_payment_id: input.paymentId ?? null,
      });
    },
    async getOverviewCounts() {
      const result = await rpcResult(client, 'platform_subscription_overview');
      if (!result.ok) {
        return result;
      }
      const counts = parseSubscriptionCounts(result.data);
      if (!counts) {
        return {
          ok: false,
          message: 'Subscription overview could not be read.',
        };
      }
      return { ok: true, counts };
    },
    getMySummary() {
      return rpcResult(client, 'get_my_subscription_summary');
    },
  };
}

export function createBrowserSubscriptionApi(): SubscriptionApi {
  const client = (): RpcClient =>
    getBrowserSupabaseClient() as unknown as RpcClient;
  return createSubscriptionApi({
    rpc: (fn, args) => client().rpc(fn, args),
  });
}

export function readAccessFromUnknown(value: unknown) {
  return parseAccessDecision(value);
}
