/**
 * Create dedicated Phase 05 Auth test users in Supabase Cloud.
 * Preferred: SUPABASE_SERVICE_ROLE_KEY in .env.local (never VITE_*) and
 * auth.admin.createUser. Fallback used in the approval turn: MCP
 * execute_sql inserts into auth.users + auth.identities with bcrypt via
 * extensions.crypt, then write the same gitignored fixture file shape.
 * Writes credentials to gitignored .env.phase05-fixtures.local.json only.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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

const env = { ...loadEnv('.env.local'), ...process.env };
const url = env.VITE_SUPABASE_URL;
const service = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;

if (!url || !service) {
  console.error(
    'BLOCKED: set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local (not VITE_SERVICE...).',
  );
  process.exit(2);
}

const stamp = Date.now();
const users = [
  {
    email: `phase05.a.${stamp}@fortsite.test`,
    password: `Fs-Test-A-${stamp}-xY9!`,
    label: 'A',
  },
  {
    email: `phase05.b.${stamp}@fortsite.test`,
    password: `Fs-Test-B-${stamp}-xY9!`,
    label: 'B',
  },
];

const admin = createClient(url, service, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const created = [];
for (const u of users) {
  const { data, error } = await admin.auth.admin.createUser({
    email: u.email,
    password: u.password,
    email_confirm: true,
    user_metadata: { phase05_fixture: true, label: u.label },
  });
  if (error) {
    console.error(`FAIL create ${u.label}: ${error.message}`);
    process.exit(1);
  }
  created.push({
    label: u.label,
    id: data.user.id,
    email: u.email,
    password: u.password,
  });
}

writeFileSync(
  '.env.phase05-fixtures.local.json',
  JSON.stringify(
    {
      createdAt: new Date().toISOString(),
      projectUrl: url,
      method: 'service_role_admin',
      note: 'Dedicated Phase 05 fixtures. Do not commit. Delete after tests.',
      users: created,
    },
    null,
    2,
  ),
);

console.log(
  JSON.stringify({
    ok: true,
    users: created.map((u) => ({ label: u.label, id: u.id, email: u.email })),
  }),
);
