import { describe, expect, it } from 'vitest';

import { COMPANY_LIFECYCLE_STATUSES } from '@/features/platform/types';
import {
  isAllowedLifecycleTransition,
  lifecycleTargets,
} from '@/features/platform/onboarding/lifecycle';

const ALLOWED: ReadonlyArray<readonly [string, string]> = [
  ['pending_setup', 'active'],
  ['pending_setup', 'archived'],
  ['active', 'paused'],
  ['active', 'suspended'],
  ['active', 'archived'],
  ['paused', 'active'],
  ['paused', 'suspended'],
  ['paused', 'archived'],
  ['suspended', 'active'],
  ['suspended', 'archived'],
];

describe('lifecycle transitions', () => {
  it('allows only the onboarding matrix, including paused', () => {
    const allowed = new Set(ALLOWED.map(([from, to]) => `${from}->${to}`));
    for (const from of COMPANY_LIFECYCLE_STATUSES) {
      for (const to of COMPANY_LIFECYCLE_STATUSES) {
        const key = `${from}->${to}`;
        expect(isAllowedLifecycleTransition(from, to)).toBe(allowed.has(key));
      }
    }
  });

  it('does not offer pause from pending setup', () => {
    expect(lifecycleTargets('pending_setup')).toEqual(['active', 'archived']);
  });

  it('does not offer a way back from archived', () => {
    expect(lifecycleTargets('archived')).toEqual([]);
  });
});
