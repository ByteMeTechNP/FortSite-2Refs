import { vi } from 'vitest';

import type { AuthApi, AuthSessionSummary } from '@/features/auth/api/auth-api';

type Listener = (session: AuthSessionSummary | null) => void;

export function createMockAuthApi(
  initialSession: AuthSessionSummary | null = null,
): AuthApi & {
  listeners: Listener[];
  emit: (session: AuthSessionSummary | null) => void;
} {
  let session = initialSession;
  const listeners: Listener[] = [];

  const api: AuthApi & {
    listeners: Listener[];
    emit: (session: AuthSessionSummary | null) => void;
  } = {
    listeners,
    emit(next) {
      session = next;
      for (const listener of listeners) {
        listener(next);
      }
    },
    getSession: vi.fn(() => Promise.resolve({ session, error: null })),
    onAuthStateChange: vi.fn((listener: Listener) => {
      listeners.push(listener);
      return {
        unsubscribe: () => {
          const index = listeners.indexOf(listener);
          if (index >= 0) {
            listeners.splice(index, 1);
          }
        },
      };
    }),
    signInWithPassword: vi.fn(() => Promise.resolve({ error: null })),
    signOut: vi.fn(() => {
      session = null;
      return Promise.resolve({ error: null });
    }),
    resetPasswordForEmail: vi.fn(() => Promise.resolve({ error: null })),
    updatePassword: vi.fn(() => Promise.resolve({ error: null })),
  };

  return api;
}

export const sampleUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'member@example.com',
} as const;

export const sampleSession = {
  user: sampleUser,
} as const;
