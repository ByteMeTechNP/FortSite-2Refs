/**
 * Live Auth/RLS checks against Supabase Cloud for Phase 05.
 * Requires gitignored fixture file from scripts/phase05-create-fixtures.mjs.
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
  if (!condition) {
    throw new Error(message);
  }
}

const env = loadEnv('.env.local');
const fixturePath = '.env.phase05-fixtures.local.json';
if (!existsSync(fixturePath)) {
  console.error(
    'BLOCKED: missing .env.phase05-fixtures.local.json — run scripts/phase05-create-fixtures.mjs with SUPABASE_SERVICE_ROLE_KEY set in .env.local',
  );
  process.exit(2);
}

const fixtures = JSON.parse(readFileSync(fixturePath, 'utf8'));
const url = env.VITE_SUPABASE_URL;
const publishable = env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert(url && publishable, 'Missing public Supabase env');

const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, detail });
  console.log(
    `${ok ? 'PASS' : 'FAIL'}: ${name}${detail ? ` — ${detail}` : ''}`,
  );
}

const anon = createClient(url, publishable, {
  auth: { persistSession: false, autoRefreshToken: false },
});

{
  const { data, error } = await anon.from('user_profiles').select('*');
  const denied =
    (Array.isArray(data) && data.length === 0 && !error) || Boolean(error);
  record(
    'anon cannot read profiles',
    denied,
    error ? `error:${error.code || 'yes'}` : `rows:${data?.length ?? 0}`,
  );
}

{
  const { error } = await anon.from('user_profiles').insert({
    user_id: '00000000-0000-0000-0000-000000000001',
    full_name: 'anon',
  });
  record(
    'anon cannot insert profiles',
    Boolean(error),
    error?.code || 'no-error',
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

const userA = fixtures.users.find((u) => u.label === 'A');
const userB = fixtures.users.find((u) => u.label === 'B');
assert(userA && userB, 'Fixture users A and B required');

try {
  const a = await clientFor(userA);
  const b = await clientFor(userB);

  {
    const { data, error } = await a
      .from('user_profiles')
      .upsert(
        {
          user_id: userA.id,
          full_name: 'Phase 05 A',
          display_name: 'A',
        },
        { onConflict: 'user_id' },
      )
      .select('user_id, full_name')
      .single();
    record(
      'A can upsert own profile',
      !error && data?.user_id === userA.id,
      error?.message || data?.full_name,
    );
  }

  {
    const { data, error } = await a
      .from('user_profiles')
      .select('user_id, full_name')
      .eq('user_id', userA.id)
      .maybeSingle();
    record(
      'A can read own profile',
      !error && data?.user_id === userA.id,
      error?.message || 'ok',
    );
  }

  {
    const { data, error } = await a
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', userB.id)
      .maybeSingle();
    record(
      'A cannot read B profile',
      !error && data === null,
      error?.message || `row:${data?.user_id || 'none'}`,
    );
  }

  {
    const { data, error } = await a
      .from('user_profiles')
      .update({ full_name: 'hijack' })
      .eq('user_id', userB.id)
      .select('user_id');
    record(
      'A cannot update B profile',
      !error && Array.isArray(data) && data.length === 0,
      error?.message || `rows:${data?.length ?? 'n/a'}`,
    );
  }

  {
    const { data, error } = await b
      .from('user_profiles')
      .upsert(
        {
          user_id: userB.id,
          full_name: 'Phase 05 B',
          display_name: 'B',
        },
        { onConflict: 'user_id' },
      )
      .select('user_id')
      .single();
    record(
      'B can upsert own profile',
      !error && data?.user_id === userB.id,
      error?.message || 'ok',
    );
  }

  await a.auth.signOut();
  await b.auth.signOut();
  record('sign-out completes for A and B', true, 'ok');
} catch (error) {
  record('authenticated flows', false, error.message);
}

const failed = results.filter((r) => !r.ok);
if (failed.length > 0) {
  console.error(`FAILED ${failed.length}/${results.length}`);
  process.exit(1);
}
console.log(`PASSED ${results.length}/${results.length}`);
