/**
 * Live Phase 09 onboarding checks against Supabase Cloud.
 * Requires gitignored .env.phase09-fixtures.local.json.
 * Uses the publishable key and user sessions. Does not print passwords.
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
const fixturePath = '.env.phase09-fixtures.local.json';
if (!existsSync(fixturePath)) {
  console.error('BLOCKED: missing .env.phase09-fixtures.local.json');
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
  const safeDetail = detail
    ? String(detail).replace(/Fs-[A-Za-z0-9]{12,}/g, '[password]')
    : '';
  console.log(
    `${ok ? 'PASS' : 'FAIL'}: ${name}${safeDetail ? ` — ${safeDetail}` : ''}`,
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

function beginArgs(country, email, key) {
  return {
    p_legal_name: `Phase 09 ${country} Fixture`,
    p_registration_country: country,
    p_admin_email: email,
    p_admin_display_name: 'Phase Nine Admin',
    p_idempotency_key: key,
    p_email_attested: true,
    p_locality: 'phase09-fixture',
  };
}

try {
  const owner = await clientFor(users.owner);
  const member = await clientFor(users.member);

  {
    const { data, error } = await anon.rpc(
      'begin_company_onboarding',
      beginArgs('Nepal', 'anon-admin@fortsite.test', 'phase09anon01'),
    );
    record(
      '1 Anon cannot begin company onboarding',
      denied(error) && data == null,
      error?.code || error?.message || String(data),
    );
  }

  {
    const { data, error } = await member.rpc(
      'begin_company_onboarding',
      beginArgs('Nepal', 'member-admin@fortsite.test', 'phase09mem0001'),
    );
    record(
      '2 Non-owner cannot begin company onboarding',
      denied(error) && data == null,
      error?.code || error?.message || String(data),
    );
  }

  const nepal = await owner.rpc(
    'begin_company_onboarding',
    beginArgs('Nepal', fixtures.adminEmail, fixtures.nepalKey),
  );
  record(
    '3 Nepal company locks NPR and Asia/Kathmandu',
    !nepal.error &&
      nepal.data?.registration_country === 'Nepal' &&
      nepal.data?.default_currency === 'NPR' &&
      nepal.data?.timezone === 'Asia/Kathmandu' &&
      typeof nepal.data?.company_code === 'string' &&
      nepal.data.company_code.startsWith('FS-'),
    nepal.error?.message || nepal.data?.company_code,
  );

  const india = await owner.rpc(
    'begin_company_onboarding',
    beginArgs('India', fixtures.takenEmail, fixtures.indiaKey),
  );
  record(
    '4 India company locks INR and Asia/Kolkata',
    !india.error &&
      india.data?.registration_country === 'India' &&
      india.data?.default_currency === 'INR' &&
      india.data?.timezone === 'Asia/Kolkata',
    india.error?.message || india.data?.default_currency,
  );

  const reused = await owner.rpc(
    'begin_company_onboarding',
    beginArgs('Nepal', fixtures.adminEmail, fixtures.nepalKey),
  );
  record(
    '5 The same idempotency key does not create a second company',
    !reused.error &&
      reused.data?.reused === true &&
      reused.data?.company_id === nepal.data?.company_id,
    reused.error?.message || `reused:${reused.data?.reused}`,
  );

  const earlyActive = await owner.rpc('transition_company_lifecycle', {
    p_company_id: nepal.data?.company_id,
    p_next_status: 'active',
    p_reason: 'too early',
  });
  record(
    '6 Activation before credential handoff is rejected',
    Boolean(earlyActive.error) &&
      earlyActive.error.message === 'activation_requirements_missing',
    earlyActive.error?.message || String(earlyActive.data),
  );

  const illegal = await owner.rpc('transition_company_lifecycle', {
    p_company_id: nepal.data?.company_id,
    p_next_status: 'paused',
    p_reason: 'illegal jump',
  });
  record(
    '7 Pending setup cannot jump to paused',
    Boolean(illegal.error) &&
      illegal.error.message === 'lifecycle_transition_rejected',
    illegal.error?.message || String(illegal.data),
  );

  const provision = await owner.functions.invoke('provision-founding-admin', {
    body: { provisioning_id: nepal.data?.provisioning_id },
  });
  const issued = provision.data;
  record(
    '8 Founding admin provisioning returns one temporary password',
    !provision.error &&
      issued?.ok === true &&
      issued?.status === 'issued' &&
      typeof issued?.password === 'string' &&
      issued.password.length >= 12 &&
      !('password' in (provision.error ?? {})),
    provision.error?.message || issued?.status || 'no status',
  );

  const again = await owner.functions.invoke('provision-founding-admin', {
    body: { provisioning_id: nepal.data?.provisioning_id },
  });
  record(
    '9 A second provision does not return the password again',
    !again.error &&
      again.data?.status === 'already_issued' &&
      !('password' in (again.data ?? {})),
    again.error?.message || again.data?.status,
  );

  const duplicate = await owner.functions.invoke('provision-founding-admin', {
    body: { provisioning_id: india.data?.provisioning_id },
  });
  record(
    '10 Duplicate email is a generic conflict and does not attach',
    duplicate.data?.code === 'email_conflict' &&
      !('password' in (duplicate.data ?? {})),
    duplicate.data?.code || duplicate.error?.message || 'no code',
  );

  const adminClient = await clientFor({
    label: 'admin',
    email: fixtures.adminEmail,
    password: issued?.password,
  });
  const beforeGate = await adminClient.rpc('get_my_company_onboarding');
  const beforeRows = await adminClient.from('companies').select('id');
  record(
    '11 New admin cannot read the company before the password change',
    denied(beforeGate.error) &&
      beforeGate.data == null &&
      !beforeRows.error &&
      Array.isArray(beforeRows.data) &&
      beforeRows.data.length === 0,
    beforeGate.error?.code || `rows:${beforeRows.data?.length ?? 'n/a'}`,
  );

  const changed = await adminClient.rpc('complete_initial_password', {
    p_new_password: fixtures.replacementPassword,
  });
  const mine = await adminClient.rpc('get_my_company_onboarding');
  const visible = await adminClient.from('companies').select('id');
  const onlyOwn =
    Array.isArray(mine.data) &&
    mine.data.length === 1 &&
    mine.data[0]?.company_id === nepal.data?.company_id;
  record(
    '12 After the password change the admin can read only their company',
    !changed.error && !mine.error && onlyOwn && visible.data?.length === 1,
    changed.error?.message ||
      `summary:${mine.data?.length} rows:${visible.data?.length}`,
  );

  const adminTransition = await adminClient.rpc(
    'transition_company_lifecycle',
    {
      p_company_id: nepal.data?.company_id,
      p_next_status: 'active',
      p_reason: 'admin must not do this',
    },
  );
  record(
    '13 Founding admin cannot change lifecycle',
    denied(adminTransition.error) && adminTransition.data == null,
    adminTransition.error?.code || adminTransition.error?.message,
  );

  const beforeActive = await adminClient.rpc('company_is_operational', {
    p_company_id: nepal.data?.company_id,
  });
  const activated = await owner.rpc('transition_company_lifecycle', {
    p_company_id: nepal.data?.company_id,
    p_next_status: 'active',
    p_reason: 'founding admin handoff issued',
  });
  const whileActive = await adminClient.rpc('company_is_operational', {
    p_company_id: nepal.data?.company_id,
  });
  const paused = await owner.rpc('transition_company_lifecycle', {
    p_company_id: nepal.data?.company_id,
    p_next_status: 'paused',
    p_reason: 'operator pause',
  });
  const whilePaused = await adminClient.rpc('company_is_operational', {
    p_company_id: nepal.data?.company_id,
  });
  const overview = await owner.rpc('platform_company_overview');
  const counts = overview.data?.counts;
  record(
    '14 Owner can activate, pause, and the overview counts include paused',
    !beforeActive.error &&
      beforeActive.data === false &&
      !activated.error &&
      whileActive.data === true &&
      !paused.error &&
      whilePaused.data === false &&
      paused.data?.to_status === 'paused' &&
      counts &&
      counts.pending_setup +
        counts.active +
        counts.paused +
        counts.suspended +
        counts.archived ===
        counts.total &&
      counts.paused >= 1,
    activated.error?.message ||
      paused.error?.message ||
      `before:${beforeActive.data} active:${whileActive.data} paused:${whilePaused.data} count:${counts?.paused}`,
  );

  await adminClient.auth.signOut();
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
