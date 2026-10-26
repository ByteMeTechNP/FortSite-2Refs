import { describe, expect, it } from 'vitest';

import {
  mapProvisionPayload,
  safeRpcMessage,
} from '@/features/platform/onboarding/parse';

describe('provisioning responses', () => {
  it('hides a password that arrives with an already-issued handoff', () => {
    expect(
      mapProvisionPayload({
        ok: true,
        status: 'already_issued',
        password: 'Fs-should-not-render',
      }),
    ).toEqual({ status: 'already_issued' });
  });

  it('turns a duplicate email into a generic conflict', () => {
    expect(mapProvisionPayload({ ok: false, code: 'email_conflict' })).toEqual({
      status: 'conflict',
    });
  });

  it('does not pass raw database text through to the operator', () => {
    expect(
      safeRpcMessage({
        message: 'duplicate key value violates unique constraint users_email',
        code: '23505',
      }),
    ).toBe('The request could not be completed.');
    expect(
      safeRpcMessage({ message: 'permission denied', code: '42501' }),
    ).toBe('You do not have permission to do that.');
  });
});
