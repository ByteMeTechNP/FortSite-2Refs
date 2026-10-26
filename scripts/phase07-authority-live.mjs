/**
 * Live Phase 07 platform-authority checks against Supabase Cloud.
 * Requires gitignored .env.phase07-fixtures.local.json.
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
const fixturePath = '.env.phase07-fixtures.local.json';
if (!existsSync(fixturePath)) {
  console.error('BLOCKED: missing .env.phase07-fixtures.local.json');
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

const anon = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const users = Object.fromEntries(fixtures.users.map((u) => [u.label, u]));

try {
  const owner = await clientFor(users.activeOwner);
  const suspended = await clientFor(users.suspendedOwner);
  const revoked = await clientFor(users.revokedOwner);
  const member = await clientFor(users.member);
  const secondOwner = await clientFor(users.secondOwner);

  {
    const { data, error } = await anon.rpc('is_platform_owner');
    record(
      '1 Anon is_platform_owner false or denied',
      Boolean(error) || data === false,
      error?.code || String(data),
    );
  }

  {
    const { data, error } = await member.rpc('is_platform_owner');
    record(
      '2 Ordinary member is not platform owner',
      !error && data === false,
      error?.message || String(data),
    );
  }

  {
    const { data: s, error: e1 } = await suspended.rpc('is_platform_owner');
    const { data: r, error: e2 } = await revoked.rpc('is_platform_owner');
    record(
      '3 Suspended and revoked owners are false',
      !e1 && !e2 && s === false && r === false,
      `s:${s} r:${r}`,
    );
  }

  {
    const { data, error } = await owner.rpc('is_platform_owner');
    record(
      '4 Active synthetic owner is true',
      !error && data === true,
      error?.message || String(data),
    );
  }

  {
    const { error: metaErr } = await member.auth.updateUser({
      data: { is_platform_owner: true },
    });
    const { data, error } = await member.rpc('is_platform_owner');
    record(
      '5 Editable user_metadata does not grant ownership',
      !metaErr && !error && data === false,
      error?.message || String(data),
    );
  }

  {
    // Function has no user_id argument; calling with unexpected args must not succeed as owner check.
    const { data, error } = await member.rpc('is_platform_owner', {
      p_user_id: users.activeOwner.id,
    });
    const deniedOrFalse = Boolean(error) || data === false || data === null;
    record(
      '6 Cannot pass another user id to is_platform_owner',
      deniedOrFalse,
      error?.message || String(data),
    );
  }

  {
    for (const table of [
      'platform_admins',
      'platform_authority_audit_events',
    ]) {
      for (const [label, client] of [
        ['anon', anon],
        ['member', member],
        ['owner', owner],
      ]) {
        const { error: se } = await client.from(table).select('*').limit(1);
        const insertRow =
          table === 'platform_admins'
            ? {
                user_id: users.member.id,
                platform_role: 'owner',
                status: 'active',
              }
            : {
                event_type: 'owner_granted',
                outcome: 'succeeded',
              };
        const { error: ie } = await client.from(table).insert(insertRow);
        const { error: ue } = await client
          .from(table)
          .update(
            table === 'platform_admins' ? { notes: 'x' } : { reason_code: 'x' },
          )
          .neq('created_at', '1970-01-01T00:00:00Z');
        const { error: de } = await client
          .from(table)
          .delete()
          .neq('created_at', '1970-01-01T00:00:00Z');
        record(
          `7 ${label} denied on ${table}`,
          Boolean(se) && Boolean(ie) && Boolean(ue) && Boolean(de),
          `s:${se?.code} i:${ie?.code} u:${ue?.code} d:${de?.code}`,
        );
      }
    }
  }

  {
    const { error } = await member.rpc('require_platform_owner');
    record(
      '8 Non-owner require_platform_owner raises 42501',
      Boolean(error) &&
        (error.code === '42501' ||
          error.message?.toLowerCase().includes('permission denied')),
      error?.code || error?.message || 'no-error',
    );
  }

  {
    const { error } = await owner.rpc('require_platform_owner');
    record(
      '9 Active owner require_platform_owner succeeds',
      !error,
      error?.message || 'ok',
    );
  }

  {
    const { data, error } = await owner.from('companies').select('id');
    record(
      '10 Owner without membership cannot read companies',
      !error && Array.isArray(data) && data.length === 0,
      error?.message || `rows:${data?.length ?? 'n/a'}`,
    );
  }

  {
    const { data: isOwner, error: e1 } = await member.rpc('is_platform_owner');
    const { data: operational, error: e2 } = await member.rpc(
      'company_is_operational',
      { p_company_id: fixtures.company.id },
    );
    record(
      '11 Member remains non-owner and company eligibility unchanged',
      !e1 && !e2 && isOwner === false && operational === true,
      `owner:${isOwner} operational:${operational}`,
    );
  }

  {
    // Last active owner cannot be suspended without recovery setting.
    // Clients have no UPDATE grant, so this must fail with permission error.
    const { data, error } = await owner
      .from('platform_admins')
      .update({ status: 'suspended' })
      .eq('user_id', users.activeOwner.id)
      .select('user_id');
    record(
      '12 Client cannot update platform_admins (last-owner protected path)',
      Boolean(error) || (Array.isArray(data) && data.length === 0),
      error?.code || `rows:${data?.length ?? 0}`,
    );
  }

  {
    const { data: secondIsOwner, error } =
      await secondOwner.rpc('is_platform_owner');
    record(
      '13 Second active synthetic owner evaluates true',
      !error && secondIsOwner === true,
      error?.message || String(secondIsOwner),
    );
  }

  await owner.auth.signOut();
  await suspended.auth.signOut();
  await revoked.auth.signOut();
  await member.auth.signOut();
  await secondOwner.auth.signOut();
} catch (error) {
  record('suite execution', false, error.message);
}

const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(`FAILED ${failed.length}/${results.length}`);
  process.exit(1);
}
console.log(`PASSED ${results.length}/${results.length}`);
