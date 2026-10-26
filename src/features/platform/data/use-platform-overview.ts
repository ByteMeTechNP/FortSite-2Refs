import { useCallback, useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/context/auth-context';
import { loadPlatformCompanyOverview } from '@/features/platform/data/platform-overview';
import type { PlatformOverviewLoadState } from '@/features/platform/types';

/**
 * Loads overview when signed in, with manual refresh.
 * Ignores stale responses after sign-out or a newer request.
 * Initial loading is derived from auth identity so effects never set state
 * synchronously and refs are not read during render.
 */
export function usePlatformOverview(): {
  state: PlatformOverviewLoadState;
  refresh: () => void;
} {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const requestIdRef = useRef(0);
  const [snapshot, setSnapshot] = useState<{
    userId: string;
    value: PlatformOverviewLoadState;
  } | null>(null);

  useEffect(() => {
    if (status !== 'signedIn' || !userId) {
      return;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    void loadPlatformCompanyOverview().then((next) => {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setSnapshot({ userId, value: next });
    });

    return () => {
      requestIdRef.current += 1;
    };
  }, [status, userId]);

  const refresh = useCallback(() => {
    if (status !== 'signedIn' || !userId) {
      return;
    }
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setSnapshot({ userId, value: { status: 'loading' } });
    void loadPlatformCompanyOverview().then((next) => {
      if (requestIdRef.current !== requestId) {
        return;
      }
      setSnapshot({ userId, value: next });
    });
  }, [status, userId]);

  if (status !== 'signedIn' || !userId) {
    return { state: { status: 'idle' }, refresh };
  }

  if (!snapshot || snapshot.userId !== userId) {
    return { state: { status: 'loading' }, refresh };
  }

  return { state: snapshot.value, refresh };
}
