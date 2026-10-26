import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/context/auth-context';
import { getBrowserSupabaseClient } from '@/lib/supabase';

export type PlatformAuthorityState = 'owner' | 'not_owner' | 'unavailable';

type AuthorityRpcClient = Readonly<{
  rpc: (fn: string) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}>;

/**
 * Asks the database whether the current Auth session is an active Platform Owner.
 * Errors fail closed as `unavailable`, distinct from a confirmed `not_owner`.
 */
export async function getCurrentPlatformAuthority(
  client: AuthorityRpcClient = getBrowserSupabaseClient() as unknown as AuthorityRpcClient,
): Promise<PlatformAuthorityState> {
  try {
    const { data, error } = await client.rpc('is_platform_owner');
    if (error) {
      return 'unavailable';
    }
    if (data === true) {
      return 'owner';
    }
    if (data === false) {
      return 'not_owner';
    }
    return 'unavailable';
  } catch {
    return 'unavailable';
  }
}

/**
 * Re-evaluates platform authority when Auth status changes.
 * Signed-out is `not_owner`. Errors fail closed as `unavailable`.
 * Does not mount any platform UI.
 */
export function usePlatformAuthority(): PlatformAuthorityState {
  const { status } = useAuth();
  const [signedInCheck, setSignedInCheck] = useState<{
    sessionKey: string;
    value: PlatformAuthorityState;
  } | null>(null);

  useEffect(() => {
    if (status !== 'signedIn') {
      return;
    }

    const sessionKey = String(Date.now());
    let cancelled = false;

    void getCurrentPlatformAuthority().then((value) => {
      if (!cancelled) {
        setSignedInCheck({ sessionKey, value });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [status]);

  if (status === 'initializing') {
    return 'unavailable';
  }
  if (status === 'signedOut') {
    return 'not_owner';
  }
  return signedInCheck?.value ?? 'unavailable';
}
