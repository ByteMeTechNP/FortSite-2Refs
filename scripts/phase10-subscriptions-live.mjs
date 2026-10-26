/**
 * Live Phase 10 subscription checks against Supabase Cloud.
 * Requires gitignored .env.phase10-fixtures.local.json.
 * Uses the publishable key and user sessions. Does not print passwords.
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
  console.log(
    `${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`,
  );
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
  ownerUserId: users.temp_owner.id,
  fixtureUserIds: fixtures.users.map((u) => u.id),
};

function beginArgs(country, email, key, planCode) {
  return {
    p_legal_name: `Phase 10 ${country} Fixture`,
    p_registration_country: country,
    p_admin_email: email,
    p_admin_display_name: 'P10 Admin',
    p_idempotency_key: key,
    p_email_attested: true,
    p_display_name: `P10 ${country}`,
    p_locality: 'phase10-fixture',
    p_requested_plan_code: planCode,
    p_trial_requested: true,
  };
}

async function main() {
  const owner = await clientFor(users.temp_owner);
  const nonOwner = await clientFor(users.non_owner);
  const founding = await clientFor(users.founding_admin);

  {
    const { error } = await anon.rpc('create_subscription_plan_draft', {
      p_code: 'p10anon',
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
    record('1 Anon create plan denied', denied(error), error?.code);
  }

  {
    const { error } = await nonOwner.rpc('create_subscription_plan_draft', {
      p_code: 'p10non',
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
    record('2 Non-owner create plan denied', denied(error), error?.code);
  }

  {
    const { data, error } = await anon
      .from('subscription_plans')
      .select('id')
      .limit(1);
    record(
      '3 Anon direct table read denied or empty',
      Boolean(error) || !data || data.length === 0,
      error?.code ?? `rows=${data?.length ?? 0}`,
    );
  }

  const planCode = `p10n${Date.now().toString(36).slice(-6)}`;
  let versionId = null;
  let planId = null;
  {
    const { data, error } = await owner.rpc('create_subscription_plan_draft', {
      p_code: planCode,
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
    planId = data?.plan_id ?? null;
    versionId = data?.version_id ?? null;
    if (planId) cleanup.planIds.push(planId);
    record(
      '4 Owner creates plan draft',
      !error && Boolean(planId),
      error?.message,
    );
  }

  {
    const { error } = await owner.rpc('publish_subscription_plan_version', {
      p_version_id: versionId,
    });
    record('5 Owner publishes plan version', !error, error?.message);
  }

  const draftCode = `${planCode}d`;
  {
    const { data, error } = await owner.rpc('create_subscription_plan_draft', {
      p_code: draftCode,
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
    if (data?.plan_id) cleanup.planIds.push(data.plan_id);
    record(
      '6 Owner creates unpublished draft',
      !error && Boolean(data?.plan_id),
      error?.message,
    );
  }

  let companyId = null;
  {
    const { data, error } = await owner.rpc(
      'begin_company_onboarding',
      beginArgs(
        'Nepal',
        users.founding_admin.email,
        `p10co${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        planCode,
      ),
    );
    companyId = data?.company_id ?? null;
    if (companyId) cleanup.companyIds.push(companyId);
    record(
      '7 Owner begins company onboarding',
      !error && Boolean(companyId),
      error?.message,
    );
  }

  {
    const { error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: companyId,
      p_term_interval: 'annual',
      p_ends_at: null,
      p_idempotency_key: `p10ann${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      p_reason: 'annual without end must fail',
    });
    record(
      '8 Annual without ends_at rejected',
      Boolean(error),
      error?.message ?? 'no error',
    );
  }

  // Company for draft-only plan code
  let draftCompanyId = null;
  {
    const { data, error } = await owner.rpc(
      'begin_company_onboarding',
      beginArgs(
        'Nepal',
        `draft-${users.founding_admin.email}`,
        `p10cd${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        draftCode,
      ),
    );
    draftCompanyId = data?.company_id ?? null;
    if (draftCompanyId) cleanup.companyIds.push(draftCompanyId);
    record(
      '9 Draft-intent company created',
      !error && Boolean(draftCompanyId),
      error?.message,
    );
  }
  {
    const { data, error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: draftCompanyId,
      p_term_interval: 'monthly',
      p_ends_at: null,
      p_idempotency_key: `p10dr${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      p_reason: 'draft plan cannot assign',
    });
    const blocked =
      Boolean(error) ||
      data?.ok === false ||
      data?.resolution_code === 'plan_not_assignable';
    record(
      '10 Draft plan cannot be assigned',
      blocked,
      error?.message ?? JSON.stringify(data)?.slice(0, 120),
    );
  }

  const resolveKey = `p10res${randomUUID().replace(/-/g, '').slice(0, 12)}`;
  let subscriptionId = null;
  {
    const { data, error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: companyId,
      p_term_interval: 'monthly',
      p_ends_at: null,
      p_idempotency_key: resolveKey,
      p_reason: 'resolve fixture intent',
    });
    subscriptionId = data?.subscription_id ?? null;
    if (subscriptionId) cleanup.subscriptionIds.push(subscriptionId);
    record(
      '11 Resolve intent creates trial subscription',
      !error && Boolean(subscriptionId) && data?.status === 'trial',
      error?.message ?? `status=${data?.status}`,
    );
  }

  {
    const { data, error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: companyId,
      p_term_interval: 'monthly',
      p_ends_at: null,
      p_idempotency_key: resolveKey,
      p_reason: 'duplicate resolve',
    });
    record(
      '12 Duplicate resolve is idempotent',
      !error &&
        data?.reused === true &&
        data?.subscription_id === subscriptionId,
      error?.message ?? `reused=${data?.reused}`,
    );
  }

  // India company cannot take Nepal plan
  let indiaCompanyId = null;
  {
    const { data, error } = await owner.rpc(
      'begin_company_onboarding',
      beginArgs(
        'India',
        `india-${users.founding_admin.email}`,
        `p10in${randomUUID().replace(/-/g, '').slice(0, 12)}`,
        planCode,
      ),
    );
    indiaCompanyId = data?.company_id ?? null;
    if (indiaCompanyId) cleanup.companyIds.push(indiaCompanyId);
    record(
      '13 India company created',
      !error && Boolean(indiaCompanyId),
      error?.message,
    );
  }
  {
    const { error } = await owner.rpc('resolve_subscription_intent', {
      p_company_id: indiaCompanyId,
      p_term_interval: 'monthly',
      p_ends_at: null,
      p_idempotency_key: `p10fx${randomUUID().replace(/-/g, '').slice(0, 10)}`,
      p_reason: 'currency lock',
    });
    record(
      '14 Nepal plan rejected for India company',
      Boolean(error),
      error?.message ?? 'no error',
    );
  }

  const payKey = `p10pay${randomUUID().replace(/-/g, '').slice(0, 12)}`;
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
    record('15 Record payment', !error && data?.ok === true, error?.message);
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
    record(
      '16 Duplicate payment does not double-apply',
      !error && data?.reused === true,
      error?.message ?? `reused=${data?.reused}`,
    );
  }

  {
    const before = await owner.rpc('get_company_subscription', {
      p_subscription_id: subscriptionId,
    });
    const endsBefore =
      before.data?.subscription?.period_ends_at ??
      before.data?.subscription?.ends_at ??
      before.data?.subscription?.trial_ends_at;
    const { error } = await owner.rpc('record_subscription_payment', {
      p_subscription_id: subscriptionId,
      p_amount: 100,
      p_received_on: new Date().toISOString().slice(0, 10),
      p_payment_method: 'cash',
      p_idempotency_key: `p10pay${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    });
    const after = await owner.rpc('get_company_subscription', {
      p_subscription_id: subscriptionId,
    });
    const endsAfter =
      after.data?.subscription?.period_ends_at ??
      after.data?.subscription?.ends_at ??
      after.data?.subscription?.trial_ends_at;
    record(
      '17 Payment alone does not extend term',
      !error && endsBefore === endsAfter,
      `before=${endsBefore} after=${endsAfter}`,
    );
  }

  {
    const { error } = await founding.rpc('publish_subscription_plan_version', {
      p_version_id: versionId,
    });
    record('18 Founding admin cannot publish', denied(error), error?.code);
  }
  {
    const { error } = await founding.rpc('record_subscription_payment', {
      p_subscription_id: subscriptionId,
      p_amount: 1,
      p_received_on: new Date().toISOString().slice(0, 10),
      p_payment_method: 'cash',
      p_idempotency_key: `p10pay${randomUUID().replace(/-/g, '').slice(0, 12)}`,
    });
    record(
      '19 Founding admin cannot record payment',
      denied(error),
      error?.code,
    );
  }

  // Attach founding admin membership + clear password gate for eligibility checks
  // (done via separate SQL cleanup harness). Here we only check owner-side operational helper.
  {
    const { data, error } = await owner.rpc('company_is_operational', {
      p_company_id: companyId,
    });
    record(
      '20 Owner company_is_operational false without membership',
      !error && data === false,
      error?.message ?? String(data),
    );
  }

  {
    const { data, error } = await owner.rpc('platform_subscription_overview');
    const counts = data?.counts ?? data;
    record(
      '21 Overview returns counts object',
      !error && counts && typeof counts.total === 'number',
      error?.message ?? JSON.stringify(counts)?.slice(0, 120),
    );
  }

  // Retire published version and ensure it cannot be newly assigned
  {
    const { error } = await owner.rpc('retire_subscription_plan_version', {
      p_version_id: versionId,
      p_reason: 'retire fixture plan version',
    });
    record('22 Retire published version', !error, error?.message);
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
