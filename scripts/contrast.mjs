/**
 * WCAG 2.2 relative-luminance contrast checker for FortSite tokens.
 * No external dependencies. Run: node scripts/contrast.mjs
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
    name: 'Graphite text on Canvas',
    fg: '#1F2937',
    bg: '#F8FAFC',
    threshold: 4.5,
  },
  {
    name: 'Graphite text on Surface',
    fg: '#1F2937',
    bg: '#FFFFFF',
    threshold: 4.5,
  },
  {
    name: 'Graphite text on Construction Amber (primary button)',
    fg: '#1F2937',
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
    bg: '#E5E7EB',
    threshold: 4.5,
  },
  {
    name: 'Outline button Graphite on Surface',
    fg: '#1F2937',
    bg: '#FFFFFF',
    threshold: 4.5,
  },
  {
    name: 'Destructive button white on danger red',
    fg: '#FFFFFF',
    bg: '#DC2626',
    threshold: 4.5,
  },
  {
    name: 'Muted helper text on Canvas',
    fg: '#4B5563',
    bg: '#F8FAFC',
    threshold: 4.5,
  },
  {
    name: 'Muted helper text on Surface',
    fg: '#4B5563',
    bg: '#FFFFFF',
    threshold: 4.5,
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
    fg: '#1E40AF',
    bg: '#DBEAFE',
    threshold: 4.5,
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
    name: 'Blueprint focus ring on Surface (non-text UI)',
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
