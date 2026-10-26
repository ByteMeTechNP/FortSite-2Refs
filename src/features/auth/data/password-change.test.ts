import { describe, expect, it, vi } from 'vitest';

import {
  completeInitialPassword,
  loadPasswordChangeRequired,
  PASSWORD_CHANGE_ERROR,
} from '@/features/auth/data/password-change';

describe('loadPasswordChangeRequired', () => {
  it('maps true, false, and errors without SQL text', async () => {
    await expect(
      loadPasswordChangeRequired({
        rpc: () => Promise.resolve({ data: true, error: null }),
      }),
    ).resolves.toBe('required');
    await expect(
      loadPasswordChangeRequired({
        rpc: () => Promise.resolve({ data: false, error: null }),
      }),
    ).resolves.toBe('clear');
    const unavailable = await loadPasswordChangeRequired({
      rpc: () =>
        Promise.resolve({
          data: null,
          error: { message: 'permission denied for function', code: '42501' },
        }),
    });
    expect(unavailable).toBe('unavailable');
  });
});

describe('completeInitialPassword', () => {
  it('does not call the RPC for a short password', async () => {
    const rpc = vi.fn();
    const result = await completeInitialPassword('short-pass', { rpc });
    expect(rpc).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });

  it('hides database errors', async () => {
    const result = await completeInitialPassword(
      'a-sufficiently-long-password',
      {
        rpc: () =>
          Promise.resolve({
            data: null,
            error: { message: 'password_rejected duplicate key sql' },
          }),
      },
    );
    expect(result).toEqual({ ok: false, message: PASSWORD_CHANGE_ERROR });
    expect(PASSWORD_CHANGE_ERROR).not.toMatch(/sql|password_rejected/i);
  });

  it('sends only the new password argument', async () => {
    const rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));
    const result = await completeInitialPassword(
      'a-sufficiently-long-password',
      {
        rpc,
      },
    );
    expect(result).toEqual({ ok: true });
    expect(rpc).toHaveBeenCalledWith('complete_initial_password', {
      p_new_password: 'a-sufficiently-long-password',
    });
  });
});
