/**
 * Live checks for panel-managed credential remediation.
 * Requires gitignored .env.credentials-fixtures.local.json.
 * Uses the publishable key and user sessions only. Does not print passwords.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

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
const fixturePath = '.env.credentials-fixtures.local.json';
if (!existsSync(fixturePath)) {
  console.error('BLOCKED: missing .env.credentials-fixtures.local.json');
  process.exit(2);
}

const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8'));
const url = env.VITE_SUPABASE_URL;
const publishable = env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert(url && publishable, 'Missing public Supabase env');
assert(url.includes('rvfoveqprrtobmywaodf'), 'Wrong project URL');

const replacementPassword = fixtures.replacementPassword;
assert(
  typeof replacementPassword === 'string' && replacementPassword.length >= 12,
  'Fixture replacement password missing',
);

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

function denied(error) {
  if (!error) return false;
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.code === '42501' ||
    error.code === 'PGRST202' ||
    message.includes('permission denied') ||
    message.includes('could not find the function') ||
    message.includes('invitation_retired')
  );
}

const anon = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users = Object.fromEntries(
  fixtures.users.map((user) => [user.label, user]),
);

try {
  const owner = await clientFor(users.owner);
  const member = await clientFor(users.member);

  {
    const { data, error } = await anon.rpc('accept_company_invitation', {
      p_invitation_id: '00000000-0000-0000-0000-000000000000',
    });
    record(
      '1 Anon cannot accept an invitation',
      denied(error) && data == null,
      error?.code || error?.message || String(data),
    );
  }

  {
    const { data, error } = await member.rpc('accept_company_invitation', {
      p_invitation_id: '00000000-0000-0000-0000-000000000000',
    });
    record(
      '2 Member cannot accept an invitation',
      denied(error) && data == null,
      error?.code || error?.message || String(data),
    );
  }

  {
    const { data, error } = await owner.rpc('is_platform_owner');
    record(
      '3 Owner without a security row is still an owner',
      !error && data === true,
      error?.message || String(data),
    );
  }

  {
    const { data, error } = await owner.rpc('platform_company_overview');
    const counts = data?.counts;
    record(
      '4 Owner overview still returns reconciled counts',
      !error &&
        counts &&
        counts.pending_setup +
          counts.active +
          counts.paused +
          counts.suspended +
          counts.archived ===
          counts.total &&
        counts.total >= 1,
      error?.message || `total:${counts?.total ?? 'n/a'}`,
    );
  }

  {
    const { data, error } = await owner.from('companies').select('id');
    record(
      '5 Owner without membership still cannot select companies',
      !error && Array.isArray(data) && data.length === 0,
      error?.message || `rows:${data?.length ?? 'n/a'}`,
    );
  }

  {
    const { data: ownerFlag, error: ownerError } =
      await member.rpc('is_platform_owner');
    const { data: required, error: requiredError } = await member.rpc(
      'password_change_required',
    );
    const { data: companies, error: companyError } = await member
      .from('companies')
      .select('id');
    record(
      '6 Must-change member is not an owner and cannot read companies',
      !ownerError &&
        ownerFlag === false &&
        !requiredError &&
        required === true &&
        !companyError &&
        Array.isArray(companies) &&
        companies.length === 0,
      `owner:${ownerFlag} required:${required} rows:${companies?.length ?? 'n/a'}`,
    );
  }

  {
    const { data, error } = await member
      .from('account_security')
      .update({ must_change_password: false })
      .eq('user_id', users.member.id)
      .select('user_id');
    record(
      '7 Member cannot clear account_security directly',
      Boolean(error) || (Array.isArray(data) && data.length === 0),
      error?.code || `rows:${data?.length ?? 0}`,
    );
  }

  {
    const { error } = await member.rpc('complete_initial_password', {
      p_new_password: replacementPassword,
    });
    const { data: required, error: requiredError } = await member.rpc(
      'password_change_required',
    );
    const { data: companies, error: companyError } = await member
      .from('companies')
      .select('id');
    record(
      '8 Password completion clears the gate and restores company read',
      !error &&
        !requiredError &&
        required === false &&
        !companyError &&
        Array.isArray(companies) &&
        companies.length === 1,
      error?.message ||
        `required:${required} rows:${companies?.length ?? 'n/a'}`,
    );
  }

  {
    const { error } = await member.rpc('complete_initial_password', {
      p_new_password: `${replacementPassword}-second`,
    });
    const retryClient = createClient(url, publishable, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data, error: signError } =
      await retryClient.auth.signInWithPassword({
        email: users.member.email,
        password: replacementPassword,
      });
    record(
      '9 A second completion does not replace the new password',
      !error && !signError && Boolean(data.session),
      error?.message || signError?.message || 'ok',
    );
    await retryClient.auth.signOut();
  }

  await owner.auth.signOut();
  await member.auth.signOut();
} catch (error) {
  record('suite execution', false, error.message);
}

const failed = results.filter((item) => !item.ok);
if (failed.length > 0) {
  console.error(`FAILED ${failed.length}/${results.length}`);
  process.exit(1);
}
console.log(`PASSED ${results.length}/${results.length}`);
