/**
 * Historical Phase 06 tenant-isolation checks against Supabase Cloud.
 * Invitation acceptance was retired by panel_managed_credentials.
 * Do not treat a fresh run of the accept_* cases as the current contract.
 * Use scripts/credentials-remediation-live.mjs for the retired flow.
 * Requires gitignored .env.phase06-fixtures.local.json from the fixture setup.
 * Assertions use the publishable key and user sessions only.
 * Never prints passwords or tokens.
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
const fixturePath = '.env.phase06-fixtures.local.json';
if (!existsSync(fixturePath)) {
  console.error(
    'BLOCKED: missing .env.phase06-fixtures.local.json — create fixtures first',
  );
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
const {
  companyA,
  companyB,
  companyMulti,
  companySuspended,
  inviteValid,
  inviteExpired,
  inviteRevoked,
  inviteWrongEmail,
  inviteForOutsider,
} = fixtures;

try {
  const a = await clientFor(users.A);
  const b = await clientFor(users.B);
  const outsider = await clientFor(users.outsider);
  const wrongEmail = await clientFor(users.wrongEmail);

  {
    const { data, error } = await a
      .from('companies')
      .select('id, lifecycle_status')
      .eq('id', companyA.id)
      .maybeSingle();
    record(
      '1 Company A member reads company A',
      !error && data?.id === companyA.id,
      error?.message || data?.lifecycle_status,
    );
  }

  {
    const { data, error } = await a
      .from('company_memberships')
      .select('id, company_id, user_id, status')
      .eq('company_id', companyA.id)
      .maybeSingle();
    record(
      '1b Company A member reads own membership',
      !error &&
        data?.user_id === users.A.id &&
        data?.company_id === companyA.id,
      error?.message || data?.status,
    );
  }

  {
    const { data, error } = await b
      .from('companies')
      .select('id')
      .eq('id', companyA.id)
      .maybeSingle();
    record(
      '2 Company B cannot read company A',
      !error && data === null,
      error?.message || `row:${data?.id || 'none'}`,
    );
  }

  {
    // wrongEmail never successfully accepts an invite, so stays a non-member.
    // outsider may already hold membership from the acceptance scenarios.
    const { data: cos, error: e1 } = await wrongEmail
      .from('companies')
      .select('id');
    const { data: mems, error: e2 } = await wrongEmail
      .from('company_memberships')
      .select('id');
    record(
      '3 Non-member cannot list companies or memberships',
      !e1 &&
        !e2 &&
        Array.isArray(cos) &&
        cos.length === 0 &&
        Array.isArray(mems) &&
        mems.length === 0,
      `companies:${cos?.length ?? 'err'} memberships:${mems?.length ?? 'err'}`,
    );
  }

  {
    const { data: cos, error: e1 } = await anon.from('companies').select('id');
    const { data: mems, error: e2 } = await anon
      .from('company_memberships')
      .select('id');
    const denied =
      Boolean(e1) ||
      Boolean(e2) ||
      (Array.isArray(cos) &&
        cos.length === 0 &&
        Array.isArray(mems) &&
        mems.length === 0);
    record(
      '4 Anonymous cannot read tenant rows',
      denied,
      `c:${e1?.code || cos?.length} m:${e2?.code || mems?.length}`,
    );
  }

  {
    const { data, error } = await a
      .from('companies')
      .select('id')
      .eq('id', companyB.id)
      .maybeSingle();
    record(
      '5 Forged company B id as A returns no row',
      !error && data === null,
      error?.message || `row:${data?.id || 'none'}`,
    );
  }

  {
    const attempts = [];
    for (const table of [
      'companies',
      'company_memberships',
      'company_invitations',
    ]) {
      const { error: ie } = await a.from(table).insert({
        id: '00000000-0000-4000-8000-000000000099',
      });
      attempts.push({ table, op: 'insert', denied: Boolean(ie) });
      const { data: ud, error: ue } = await a
        .from(table)
        .update({ updated_at: new Date().toISOString() })
        .eq('id', companyA.id)
        .select('id');
      attempts.push({
        table,
        op: 'update',
        denied: Boolean(ue) || (Array.isArray(ud) && ud.length === 0),
      });
      const { data: dd, error: de } = await a
        .from(table)
        .delete()
        .eq('id', companyA.id)
        .select('id');
      attempts.push({
        table,
        op: 'delete',
        denied: Boolean(de) || (Array.isArray(dd) && dd.length === 0),
      });
    }
    const allDenied = attempts.every((x) => x.denied);
    const { data: still } = await a
      .from('companies')
      .select('id')
      .eq('id', companyA.id)
      .maybeSingle();
    record(
      '6 Unauthorized inserts/updates/deletes denied',
      allDenied && still?.id === companyA.id,
      allDenied
        ? 'no side effect'
        : JSON.stringify(attempts.filter((x) => !x.denied)),
    );
  }

  {
    const { data: before } = await a
      .from('company_memberships')
      .select('company_id, status')
      .eq('id', fixtures.membershipA.id)
      .maybeSingle();
    const { data: ud, error } = await a
      .from('company_memberships')
      .update({
        company_id: companyB.id,
        status: 'suspended',
        user_id: users.B.id,
      })
      .eq('id', fixtures.membershipA.id)
      .select('id');
    const { data: after } = await a
      .from('company_memberships')
      .select('company_id, status, user_id')
      .eq('id', fixtures.membershipA.id)
      .maybeSingle();
    record(
      '7 Self-promotion / membership mutation denied',
      (Boolean(error) || (Array.isArray(ud) && ud.length === 0)) &&
        after?.company_id === before?.company_id &&
        after?.status === before?.status &&
        after?.user_id === users.A.id,
      error?.code || `rows:${ud?.length ?? 0}`,
    );
  }

  {
    // Composite uniqueness of (company_id, user_id) and no client write path.
    // Cross-company relationship: A cannot attach a membership row to B.
    const { error } = await a.from('company_memberships').insert({
      company_id: companyB.id,
      user_id: users.A.id,
      status: 'active',
    });
    record(
      '8 Cross-company membership insert denied',
      Boolean(error),
      error?.code || 'no-error',
    );
  }

  {
    const { data, error } = await outsider.rpc('accept_company_invitation', {
      p_invitation_id: inviteForOutsider.id,
    });
    const { data: mem } = await outsider
      .from('company_memberships')
      .select('id, company_id')
      .eq('company_id', companyA.id)
      .maybeSingle();
    record(
      '9 Valid invite acceptance creates membership',
      !error &&
        data?.company_id === companyA.id &&
        typeof data?.membership_id === 'string' &&
        mem?.company_id === companyA.id,
      error?.message || data?.membership_id,
    );
  }

  {
    const { data, error } = await wrongEmail.rpc('accept_company_invitation', {
      p_invitation_id: inviteWrongEmail.id,
    });
    record(
      '10 Wrong-email invite acceptance fails closed',
      Boolean(error) && !data,
      error?.message || 'unexpected-success',
    );
  }

  {
    const expired = await outsider.rpc('accept_company_invitation', {
      p_invitation_id: inviteExpired.id,
    });
    const revoked = await outsider.rpc('accept_company_invitation', {
      p_invitation_id: inviteRevoked.id,
    });
    const missing = await outsider.rpc('accept_company_invitation', {
      p_invitation_id: '00000000-0000-4000-8000-000000000000',
    });
    const msgs = [
      expired.error?.message,
      revoked.error?.message,
      missing.error?.message,
    ];
    record(
      '11 Expired/revoked/nonexistent invitation fails closed',
      Boolean(expired.error) &&
        Boolean(revoked.error) &&
        Boolean(missing.error) &&
        msgs.every((m) => m && m.includes('invitation_unavailable')),
      msgs.join(' | '),
    );
  }

  {
    const first = await outsider.rpc('accept_company_invitation', {
      p_invitation_id: inviteForOutsider.id,
    });
    const second = await outsider.rpc('accept_company_invitation', {
      p_invitation_id: inviteForOutsider.id,
    });
    const { data: mems } = await outsider
      .from('company_memberships')
      .select('id')
      .eq('company_id', companyA.id)
      .eq('user_id', users.outsider.id);
    record(
      '12 Double accept is idempotent',
      !first.error &&
        !second.error &&
        first.data?.membership_id === second.data?.membership_id &&
        Array.isArray(mems) &&
        mems.length === 1,
      `count:${mems?.length ?? 0}`,
    );
  }

  {
    const { data: aRows, error: e1 } = await a
      .from('company_memberships')
      .select('company_id, status')
      .eq('user_id', users.A.id)
      .eq('status', 'active');
    const companyIds = new Set((aRows || []).map((r) => r.company_id));
    record(
      '13 Multi-company user has separate memberships',
      !e1 &&
        companyIds.has(companyA.id) &&
        companyIds.has(companyMulti.id) &&
        !companyIds.has(companyB.id),
      `count:${companyIds.size}`,
    );
  }

  {
    const { data: company, error: e1 } = await a
      .from('companies')
      .select('id, lifecycle_status')
      .eq('id', companySuspended.id)
      .maybeSingle();
    const { data: operational, error: e2 } = await a.rpc(
      'company_is_operational',
      { p_company_id: companySuspended.id },
    );
    record(
      '14 Suspended company visible but not operational',
      !e1 &&
        !e2 &&
        company?.lifecycle_status === 'suspended' &&
        operational === false,
      `status:${company?.lifecycle_status} operational:${operational}`,
    );
  }

  {
    const { error: e1 } = await anon.rpc('is_active_company_member', {
      p_company_id: companyA.id,
    });
    const { error: e2 } = await anon.rpc('company_is_operational', {
      p_company_id: companyA.id,
    });
    const { error: e3 } = await anon.rpc('accept_company_invitation', {
      p_invitation_id: inviteValid.id,
    });
    record(
      '15 Anon cannot execute privileged RPCs',
      Boolean(e1) && Boolean(e2) && Boolean(e3),
      [e1?.code, e2?.code, e3?.code].join(','),
    );
  }

  {
    const { data: inv, error } = await a
      .from('company_invitations')
      .select('id')
      .eq('id', inviteValid.id)
      .maybeSingle();
    record(
      '16 Authenticated cannot read invitations directly',
      Boolean(error) || inv === null,
      error?.code || `row:${inv?.id || 'none'}`,
    );
  }

  await a.auth.signOut();
  await b.auth.signOut();
  await outsider.auth.signOut();
  await wrongEmail.auth.signOut();
} catch (error) {
  record('suite execution', false, error.message);
}

const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(`FAILED ${failed.length}/${results.length}`);
  process.exit(1);
}
console.log(`PASSED ${results.length}/${results.length}`);
