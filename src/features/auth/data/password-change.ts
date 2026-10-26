import { getBrowserSupabaseClient } from '@/lib/supabase';

export const MIN_INITIAL_PASSWORD_LENGTH = 12;

export const PASSWORD_CHANGE_ERROR =
  'The password could not be updated. Try again, or sign out and return later.';

export type PasswordChangeFlag = 'required' | 'clear' | 'unavailable';

type RpcClient = Readonly<{
  rpc: (
    fn: string,
    args?: Readonly<Record<string, unknown>>,
  ) => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
}>;

/**
 * Trusted read of the current user's initial-password gate.
 * Errors fail closed as unavailable. SQL text is not returned.
 */
export async function loadPasswordChangeRequired(
  client: RpcClient = getBrowserSupabaseClient() as unknown as RpcClient,
): Promise<PasswordChangeFlag> {
  try {
    const { data, error } = await client.rpc('password_change_required');
    if (error) {
      return 'unavailable';
    }
    if (data === true) {
      return 'required';
    }
    if (data === false) {
      return 'clear';
    }
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/**
 * One trusted completion call. Does not clear the gate by itself in the UI;
 * the database function changes the Auth password and the flag together.
 */
export async function completeInitialPassword(
  password: string,
  client: RpcClient = getBrowserSupabaseClient() as unknown as RpcClient,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (password.length < MIN_INITIAL_PASSWORD_LENGTH) {
    return {
      ok: false,
      message: `Use at least ${MIN_INITIAL_PASSWORD_LENGTH} characters.`,
    };
  }

  try {
    const { error } = await client.rpc('complete_initial_password', {
      p_new_password: password,
    });
    if (error) {
      return { ok: false, message: PASSWORD_CHANGE_ERROR };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: PASSWORD_CHANGE_ERROR };
  }
}
