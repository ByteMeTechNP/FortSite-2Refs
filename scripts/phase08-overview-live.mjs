/**
 * Live Phase 08 platform_company_overview checks against Supabase Cloud.
 * Requires gitignored .env.phase08-fixtures.local.json.
 * Assertions use the publishable key and user sessions only.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

function loadEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const env = loadEnv('.env.local');
const fixturePath = '.env.phase08-fixtures.local.json';
if (!existsSync(fixturePath)) {
  console.error('BLOCKED: missing .env.phase08-fixtures.local.json');
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

const ALLOWED_COMPANY_KEYS = new Set([
  'id',
  'company_code',
  'legal_name',
  'display_name',
  'registration_country',
  'lifecycle_status',
  'created_at',
]);

const ALLOWED_COUNT_KEYS = new Set([
  'pending_setup',
  'active',
  'paused',
  'suspended',
  'archived',
  'total',
]);

const anon = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users = Object.fromEntries(fixtures.users.map((u) => [u.label, u]));

try {
  const owner = await clientFor(users.owner);
  const member = await clientFor(users.member);

  {
    const { data, error } = await anon.rpc('platform_company_overview');
    const denied =
      Boolean(error) &&
      (error.code === '42501' ||
        error.message?.toLowerCase().includes('permission denied'));
    record(
      '1 Anon platform_company_overview denied with 42501',
      denied && data == null,
      error?.code || error?.message || String(data),
    );
  }

  {
    const { data, error } = await member.rpc('platform_company_overview');
    const denied =
      Boolean(error) &&
      (error.code === '42501' ||
        error.message?.toLowerCase().includes('permission denied'));
    record(
      '2 Non-owner platform_company_overview denied with 42501',
      denied && data == null,
      error?.code || error?.message || String(data),
    );
  }

  {
    const { data, error } = await owner.rpc('platform_company_overview');
    let ok = !error && data && typeof data === 'object';
    let detail = error?.message || 'ok';
    if (ok) {
      const counts = data.counts;
      const companies = data.companies;
      const countKeys = Object.keys(counts ?? {});
      const countsOk =
        counts &&
        countKeys.every((k) => ALLOWED_COUNT_KEYS.has(k)) &&
        countKeys.length === ALLOWED_COUNT_KEYS.size &&
        counts.pending_setup +
          counts.active +
          counts.paused +
          counts.suspended +
          counts.archived ===
          counts.total &&
        Array.isArray(companies) &&
        companies.length === counts.total;
      const fieldsOk =
        Array.isArray(companies) &&
        companies.every(
          (row) =>
            row &&
            typeof row === 'object' &&
            Object.keys(row).every((k) => ALLOWED_COMPANY_KEYS.has(k)) &&
            Object.keys(row).length === ALLOWED_COMPANY_KEYS.size,
        );
      const expectedStatuses = new Set(
        fixtures.companies.map((c) => c.lifecycle_status),
      );
      const seenStatuses = new Set(
        (companies ?? []).map((c) => c.lifecycle_status),
      );
      const fixturesPresent = [...expectedStatuses].every((s) =>
        seenStatuses.has(s),
      );
      ok = Boolean(countsOk && fieldsOk && fixturesPresent);
      detail = ok
        ? `total:${counts.total} statuses:${[...seenStatuses].join(',')}`
        : `countsOk:${countsOk} fieldsOk:${fieldsOk} fixturesPresent:${fixturesPresent}`;
    }
    record(
      '3 Owner overview returns documented fields and reconciled counts',
      ok,
      detail,
    );
  }

  {
    const { data, error } = await owner.from('companies').select('id');
    record(
      '4 Owner without membership cannot select companies directly',
      !error && Array.isArray(data) && data.length === 0,
      error?.message || `rows:${data?.length ?? 'n/a'}`,
    );
  }

  {
    const { data, error } = await owner.rpc('platform_company_overview', {
      p_actor_id: users.owner.id,
    });
    const rejected =
      Boolean(error) ||
      data === null ||
      (typeof data === 'object' && data !== null && !('counts' in data));
    record(
      '5 Extra RPC arguments are rejected',
      rejected,
      error?.message || String(data),
    );
  }

  {
    const { data, error } = await owner.rpc('platform_company_overview', {
      p_company_id: fixtures.companies[0]?.id,
    });
    const rejected = Boolean(error);
    record(
      '6 Extra company-id argument is rejected',
      rejected,
      error?.message || String(data),
    );
  }

  await owner.auth.signOut();
  await member.auth.signOut();
} catch (error) {
  record('suite execution', false, error.message);
}

const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(`FAILED ${failed.length}/${results.length}`);
  process.exit(1);
}
console.log(`PASSED ${results.length}/${results.length}`);
