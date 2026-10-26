import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const patterns = [
  {
    label: 'secret-key',
    value: new RegExp('sb_' + 'secret_' + '[A-Za-z0-9_-]{8,}'),
  },
  { label: 'postgres-url', value: new RegExp('postgres' + '://', 'i') },
  { label: 'postgresql-url', value: new RegExp('postgresql' + '://', 'i') },
];

const serviceRole = 'service' + '_role';

function hasServiceRoleJwt(text) {
  const jwtPattern = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;
  for (const token of text.match(jwtPattern) ?? []) {
    const payload = token.split('.')[1];
    if (!payload) {
      continue;
    }
    try {
      const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
      const parsed = JSON.parse(atob(padded));
      if (parsed && typeof parsed === 'object' && parsed.role === serviceRole) {
        return true;
      }
    } catch {
      continue;
    }
  }
  return false;
}

function walk(directory, files) {
  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      walk(fullPath, files);
    } else if (stats.isFile()) {
      files.push(fullPath);
    }
  }
}

function trackedSourceFiles() {
  const output = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' });
  return output
    .split('\0')
    .filter(Boolean)
    .filter((file) => !file.endsWith('.md') && !file.endsWith('.pdf'));
}

const files = new Set(trackedSourceFiles());

if (existsSync('dist')) {
  const built = [];
  walk('dist', built);
  for (const file of built) {
    files.add(file);
  }
}

const findings = [];

for (const file of files) {
  let text;
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  if (text.includes('\0')) {
    continue;
  }
  for (const pattern of patterns) {
    if (pattern.value.test(text)) {
      findings.push(`${file}: ${pattern.label}`);
    }
  }
  if (hasServiceRoleJwt(text)) {
    findings.push(`${file}: service-role-jwt`);
  }
}

if (findings.length > 0) {
  console.error('Secret scan found disallowed material:');
  for (const finding of findings) {
    console.error(finding);
  }
  console.error(
    'The report lists locations only. Rotate any real credential that was committed or built.',
  );
  process.exit(1);
}

console.log(
  `Secret scan passed (${files.size} files). Scanners miss unknown formats; review still required.`,
);
