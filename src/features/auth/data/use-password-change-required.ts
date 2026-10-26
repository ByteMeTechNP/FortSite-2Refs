import { useEffect, useState } from 'react';

import { useAuth } from '@/features/auth/context/auth-context';
import {
  loadPasswordChangeRequired,
  type PasswordChangeFlag,
} from '@/features/auth/data/password-change';

export type PasswordChangeView =
  'checking' | 'required' | 'clear' | 'unavailable';

let clearedForUserId: string | null = null;

/** Lets the change screen and the route gate agree after a successful RPC. */
export function markPasswordChangeCleared(userId: string): void {
  clearedForUserId = userId;
}

export function usePasswordChangeRequired(): PasswordChangeView {
  const { status, user } = useAuth();
  const userId = user?.id ?? null;
  const [snapshot, setSnapshot] = useState<{
    userId: string;
    value: PasswordChangeFlag;
  } | null>(null);

  useEffect(() => {
    if (status !== 'signedIn') {
      clearedForUserId = null;
    }
  }, [status]);

  useEffect(() => {
    if (status !== 'signedIn' || !userId) {
      return;
    }
    if (clearedForUserId === userId) {
      return;
    }

    let cancelled = false;
    void loadPasswordChangeRequired().then((value) => {
      if (!cancelled) {
        setSnapshot({ userId, value });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [status, userId]);

  if (status !== 'signedIn' || !userId) {
    return 'clear';
  }

  if (clearedForUserId === userId) {
    return 'clear';
  }

  if (!snapshot || snapshot.userId !== userId) {
    return 'checking';
  }

  return snapshot.value;
}
