/**
 * WCAG 2.2 relative-luminance contrast checker for FortSite tokens.
 * No external dependencies. Run: node scripts/contrast.mjs
 *
 * A zero exit means listed pairs behaved as expected. Accessibility is
 * complete only when components actually use these tested tokens.
 */

function linearize(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex) {
  const value = hex.replace('#', '');
  const r = Number.parseInt(value.slice(0, 2), 16);
  const g = Number.parseInt(value.slice(2, 4), 16);
  const b = Number.parseInt(value.slice(4, 6), 16);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

function contrastRatio(foreground, background) {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

const pairs = [
  {
    name: 'Primary text on Canvas',
    fg: '#0F172A',
    bg: '#F8FAFC',
    threshold: 4.5,
  },
  {
    name: 'Primary text on Surface',
    fg: '#0F172A',
    bg: '#FFFFFF',
    threshold: 4.5,
  },
  {
    name: 'Primary text on Construction Amber (primary button)',
    fg: '#111827',
    bg: '#F59E0B',
    threshold: 4.5,
  },
  {
    name: 'White text on Construction Amber (forbidden)',
    fg: '#FFFFFF',
    bg: '#F59E0B',
    threshold: 4.5,
    expectFail: true,
  },
  {
    name: 'Secondary text on Canvas',
    fg: '#475569',
    bg: '#F8FAFC',
    threshold: 4.5,
  },
  {
    name: 'Secondary text on Surface',
    fg: '#475569',
    bg: '#FFFFFF',
    threshold: 4.5,
  },
  {
    name: 'Secondary text on subtle surface (captions)',
    fg: '#475569',
    bg: '#F1F5F9',
    threshold: 4.5,
  },
  {
    name: 'Muted text on subtle surface (forbidden for readable text)',
    fg: '#64748B',
    bg: '#F1F5F9',
    threshold: 4.5,
    expectFail: true,
  },
  {
    name: 'Muted helper text on Canvas',
    fg: '#64748B',
    bg: '#F8FAFC',
    threshold: 4.5,
  },
  {
    name: 'Muted helper text on Surface',
    fg: '#64748B',
    bg: '#FFFFFF',
    threshold: 4.5,
  },
  {
    name: 'Blueprint Blue link on Surface',
    fg: '#2563EB',
    bg: '#FFFFFF',
    threshold: 4.5,
  },
  {
    name: 'Blueprint Blue link on Canvas',
    fg: '#2563EB',
    bg: '#F8FAFC',
    threshold: 4.5,
  },
  {
    name: 'Secondary button Graphite on secondary surface',
    fg: '#1F2937',
    bg: '#F1F5F9',
    threshold: 4.5,
  },
  {
    name: 'Outline button Graphite on Surface',
    fg: '#1F2937',
    bg: '#FFFFFF',
    threshold: 4.5,
  },
  {
    name: 'Reference destructive text on pale red (fails 4.5:1)',
    fg: '#DC2626',
    bg: '#FEE2E2',
    threshold: 4.5,
    expectFail: true,
  },
  {
    name: 'Reference success text on pale green (fails 4.5:1)',
    fg: '#16A34A',
    bg: '#DCFCE7',
    threshold: 4.5,
    expectFail: true,
  },
  {
    name: 'Reference amber ring on Surface (fails 3:1)',
    fg: '#F59E0B',
    bg: '#FFFFFF',
    threshold: 3,
    expectFail: true,
  },
  {
    name: 'Applied focus ring on Surface (non-text UI)',
    fg: '#D97706',
    bg: '#FFFFFF',
    threshold: 3,
  },
  {
    name: 'Success badge text on success background',
    fg: '#166534',
    bg: '#DCFCE7',
    threshold: 4.5,
  },
  {
    name: 'Warning badge text on warning background',
    fg: '#92400E',
    bg: '#FEF3C7',
    threshold: 4.5,
  },
  {
    name: 'Danger badge text on danger background',
    fg: '#991B1B',
    bg: '#FEE2E2',
    threshold: 4.5,
  },
  {
    name: 'Info badge text on info background',
    fg: '#1D4ED8',
    bg: '#DBEAFE',
    threshold: 4.5,
  },
  {
    name: 'Shell light text on Graphite',
    fg: '#F8FAFC',
    bg: '#1F2937',
    threshold: 4.5,
  },
  {
    name: 'Shell muted text on Graphite',
    fg: '#CBD5E1',
    bg: '#1F2937',
    threshold: 4.5,
  },
  {
    name: 'Separator on Surface (non-interactive only)',
    fg: '#CBD5E1',
    bg: '#FFFFFF',
    threshold: 3,
    expectFail: true,
  },
  {
    name: 'Steel Border on Surface (decorative only)',
    fg: '#E2E8F0',
    bg: '#FFFFFF',
    threshold: 3,
    expectFail: true,
  },
  {
    name: 'Strong input border on Surface (non-text UI)',
    fg: '#64748B',
    bg: '#FFFFFF',
    threshold: 3,
  },
  {
    name: 'Blueprint link on Surface (non-text, also a link color)',
    fg: '#2563EB',
    bg: '#FFFFFF',
    threshold: 3,
  },
];

let failures = 0;

console.log('| Pairing | FG | BG | Ratio | Threshold | Result |');
console.log('|---|---|---|---:|---:|---|');

for (const pair of pairs) {
  const ratio = contrastRatio(pair.fg, pair.bg);
  const passes = ratio >= pair.threshold;
  const expected = pair.expectFail ? !passes : passes;
  if (!expected) {
    failures += 1;
  }
  const label = pair.expectFail
    ? passes
      ? 'UNEXPECTED PASS'
      : 'FAIL (expected)'
    : passes
      ? 'PASS'
      : 'FAIL';
  console.log(
    `| ${pair.name} | ${pair.fg} | ${pair.bg} | ${ratio.toFixed(2)}:1 | ${pair.threshold}:1 | ${label} |`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} unexpected contrast failure(s).`);
  process.exit(1);
}

console.log('\nAll required contrast checks behaved as expected.');
