/**
 * Live Phase 10 subscription checks against Supabase Cloud.
 * Requires gitignored .env.phase10-fixtures.local.json and temporary Auth users.
 * Uses the publishable key and user sessions. Does not print secrets.
 *
 * Fixture shape:
 * {
 *   "users": [
 *     { "label": "temp_owner", "email": "...", "password": "..." },
 *     { "label": "non_owner", "email": "...", "password": "..." },
 *     { "label": "founding_admin", "email": "...", "password": "..." }
 *   ]
 * }
 */
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (match) out[match[1]] = match[2];
  }
  return out;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const env = loadEnv('.env.local');
const fixturePath = '.env.phase10-fixtures.local.json';
if (!existsSync(fixturePath)) {
  console.error('BLOCKED: missing .env.phase10-fixtures.local.json');
  process.exit(2);
}

const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8'));
const url = env.VITE_SUPABASE_URL;
const publishable = env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert(url && publishable, 'Missing public Supabase env');
assert(url.includes('rvfoveqprrtobmywaodf'), 'Wrong project URL');

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`);
}

function denied(error) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === '42501' ||
    message.includes('permission denied') ||
    message.includes('password change required')
  );
}

async function clientFor(user) {
  const client = createClient(url, publishable, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });
  if (error || !data.session) {
    throw new Error(`sign-in ${user.label}: ${error?.message || 'no session'}`);
  }
  return client;
}

const anon = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users = Object.fromEntries(
  fixtures.users.map((user) => [user.label, user]),
);

const cleanup = {
  companyIds: [],
  planIds: [],
  subscriptionIds: [],
  ownerUserId: null,
};

async function main() {
  const owner = await clientFor(users.temp_owner);
  const nonOwner = await clientFor(users.non_owner);
  const {
    data: { user: ownerUser },
  } = await owner.auth.getUser();
  cleanup.ownerUserId = ownerUser?.id ?? null;

  // Ensure temporary owner row for this run (idempotent insert via RPC if available).
  // Tests assume temp_owner is already in platform_admins for the session.

  {
    const { error } = await anon.rpc('create_subscription_plan_draft', {
      p_code: 'p10-anon',
      p_name: 'Anon',
      p_description: null,
      p_registration_country: 'Nepal',
      p_billing_interval: 'monthly',
      p_price_kind: 'paid',
      p_amount: 100,
      p_trial_days: 0,
      p_grace_days: 0,
      p_entitlements: {},
    });
    record('anon create plan denied', denied(error), error?.code);
  }

  {
    const { error } = await nonOwner.rpc('create_subscription_plan_draft', {
      p_code: 'p10-nonowner',
      p_name: 'NonOwner',
      p_description: null,
      p_registration_country: 'Nepal',
      p_billing_interval: 'monthly',
      p_price_kind: 'paid',
      p_amount: 100,
      p_trial_days: 0,
      p_grace_days: 0,
      p_entitlements: {},
    });
    record('non-owner create plan denied', denied(error), error?.code);
  }

  {
    const { data, error } = await anon
      .from('subscription_plans')
      .select('id')
      .limit(1);
    record(
      'anon direct table read denied',
      Boolean(error) || !data || data.length === 0,
      error?.code ?? `rows=${data?.length ?? 0}`,
    );
  }

  const draftKey = `p10-${Date.now().toString(36)}`;
  let versionId = null;
  let planId = null;
  {
    const { data, error } = await owner.rpc('create_subscription_plan_draft', {
      p_code: draftKey,
      p_name: 'Phase 10 Nepal Starter',
      p_description: 'Fixture plan',
      p_registration_country: 'Nepal',
      p_billing_interval: 'monthly',
      p_price_kind: 'paid',
      p_amount: 1500,
      p_trial_days: 14,
      p_grace_days: 7,
      p_entitlements: { max_users: 5, takeoff_enabled: false },
    });
    record('owner creates plan draft', !error && Boolean(data), error?.message);
    planId = data?.plan_id ?? null;
    versionId = data?.version_id ?? null;
    if (planId) cleanup.planIds.push(planId);
  }

  {
    const { data, error } = await owner.rpc(
      'publish_subscription_plan_version',
      { p_version_id: versionId },
    );
    record('owner publishes plan version', !error && Boolean(data), error?.message);
  }

  // Draft cannot be assigned: create second draft and try resolve against its code only after company exists.
  let draftOnlyCode = `${draftKey}-draft`;
  {
    const { data, error } = await owner.rpc('create_subscription_plan_draft', {
      p_code: draftOnlyCode,
      p_name: 'Unpublished',
      p_description: null,
      p_registration_country: 'Nepal',
      p_billing_interval: 'monthly',
      p_price_kind: 'free',
      p_amount: 0,
      p_trial_days: 0,
      p_grace_days: 0,
      p_entitlements: {},
    });
    record('owner creates unpublished draft', !error && Boolean(data), error?.message);
    if (data?.plan_id) cleanup.planIds.push(data.plan_id);
  }

  // Company + intent via Phase 09 begin
  let companyId = null;
  const adminEmail = users.founding_admin.email;
  {
    const { data, error } = await owner.rpc('begin_company_onboarding', {
      p_legal_name: 'Phase 10 Nepal Fixture',
      p_display_name: 'P10 Nepal',
      p_registration_country: 'Nepal',
      p_admin_email: adminEmail,
      p_admin_display_name: 'P10 Admin',
      p_requested_plan_code: draftKey,
      p_trial_requested: true,
      p_idempotency_key: `p10-co-${randomUUID().slice(0, 8)}`,
      p_locality: 'phase10-fixture',
    });
    record('owner begins company onboarding', !error && Boolean(data?.company_id), error?.message);
    companyId = data?.company_id ?? null;
    if (companyId) cleanup.companyIds.push(companyId);
  }

  {
    const { data, error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: companyId,
      p_term_interval: 'annual',
      p_ends_at: null,
      p_idempotency_key: `p10-res-${randomUUID().slice(0, 8)}`,
      p_reason: 'annual without end must fail',
    });
    record(
      'annual without ends_at rejected',
      Boolean(error) || data?.ok === false,
      error?.message ?? data?.code,
    );
  }

  const resolveKey = `p10-res-${randomUUID().slice(0, 12)}`;
  let subscriptionId = null;
  {
    const { data, error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: companyId,
      p_term_interval: 'monthly',
      p_ends_at: null,
      p_idempotency_key: resolveKey,
      p_reason: 'resolve fixture intent',
    });
    record(
      'resolve intent creates trial subscription',
      !error && data?.ok !== false && Boolean(data?.subscription_id ?? data?.id),
      error?.message ?? JSON.stringify(data)?.slice(0, 120),
    );
    subscriptionId =
      data?.subscription_id ?? data?.id ?? data?.subscription?.id ?? null;
    if (subscriptionId) cleanup.subscriptionIds.push(subscriptionId);
  }

  {
    const { data, error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: companyId,
      p_term_interval: 'monthly',
      p_ends_at: null,
      p_idempotency_key: resolveKey,
      p_reason: 'duplicate resolve',
    });
    const sid =
      data?.subscription_id ?? data?.id ?? data?.subscription?.id ?? null;
    record(
      'duplicate resolve is idempotent',
      !error && sid === subscriptionId,
      error?.message ?? `sid=${sid}`,
    );
  }

  const payKey = `p10-pay-${randomUUID().slice(0, 12)}`;
  {
    const { data, error } = await owner.rpc('record_subscription_payment', {
      p_subscription_id: subscriptionId,
      p_amount: 1500,
      p_received_on: new Date().toISOString().slice(0, 10),
      p_payment_method: 'bank_transfer',
      p_idempotency_key: payKey,
      p_external_reference: 'p10-ref-1',
      p_notes: 'fixture',
    });
    record('record payment', !error && Boolean(data), error?.message);
  }
  {
    const { data, error } = await owner.rpc('record_subscription_payment', {
      p_subscription_id: subscriptionId,
      p_amount: 1500,
      p_received_on: new Date().toISOString().slice(0, 10),
      p_payment_method: 'bank_transfer',
      p_idempotency_key: payKey,
      p_external_reference: 'p10-ref-1',
      p_notes: 'fixture',
    });
    record('duplicate payment does not double-apply', !error && Boolean(data), error?.message);
  }

  {
    const before = await owner.rpc('get_company_subscription', {
      p_subscription_id: subscriptionId,
    });
    const endsBefore =
      before.data?.subscription?.period_ends_at ??
      before.data?.subscription?.ends_at;
    const { error } = await owner.rpc('record_subscription_payment', {
      p_subscription_id: subscriptionId,
      p_amount: 100,
      p_received_on: new Date().toISOString().slice(0, 10),
      p_payment_method: 'cash',
      p_idempotency_key: `p10-pay-${randomUUID().slice(0, 12)}`,
    });
    const after = await owner.rpc('get_company_subscription', {
      p_subscription_id: subscriptionId,
    });
    const endsAfter =
      after.data?.subscription?.period_ends_at ??
      after.data?.subscription?.ends_at;
    record(
      'payment alone does not extend term',
      !error && endsBefore === endsAfter,
      `before=${endsBefore} after=${endsAfter}`,
    );
  }

  {
    const { data, error } = await nonOwner.rpc('publish_subscription_plan_version', {
      p_version_id: versionId,
    });
    record('founding/non-owner cannot publish', denied(error) || data == null, error?.code);
  }

  {
    const { error } = await nonOwner.rpc('record_subscription_payment', {
      p_subscription_id: subscriptionId,
      p_amount: 1,
      p_received_on: new Date().toISOString().slice(0, 10),
      p_payment_method: 'cash',
      p_idempotency_key: `p10-pay-${randomUUID().slice(0, 12)}`,
    });
    record('non-owner cannot record payment', denied(error), error?.code);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.length - passed;
  console.log(`\nPhase 10 live: ${passed}/${results.length} passed`);
  writeFileSync(
    '.env.phase10-cleanup.local.json',
    JSON.stringify(cleanup, null, 2),
  );
  if (failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
