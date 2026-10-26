import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  createSupabaseAuthApi,
  type AuthApi,
  type AuthSessionSummary,
  type AuthUserSummary,
} from '@/features/auth/api/auth-api';
import { toAuthUserMessage } from '@/features/auth/lib/auth-errors';

export type AuthStatus = 'initializing' | 'signedOut' | 'signedIn';

export type AuthContextValue = Readonly<{
  status: AuthStatus;
  user: AuthUserSummary | null;
  lastError: string | null;
  clearError: () => void;
  signInWithPassword: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<boolean>;
  resetPasswordForEmail: (
    email: string,
    redirectTo: string,
  ) => Promise<{ ok: boolean; error: string | null }>;
  updatePassword: (
    password: string,
  ) => Promise<{ ok: boolean; error: string | null }>;
}>;

const AuthContext = createContext<AuthContextValue | null>(null);

type AuthProviderProps = Readonly<{
  children: ReactNode;
  authApi?: AuthApi | undefined;
}>;

export function AuthProvider({ children, authApi }: AuthProviderProps) {
  const apiRef = useRef(authApi ?? createSupabaseAuthApi());
  const [status, setStatus] = useState<AuthStatus>('initializing');
  const [user, setUser] = useState<AuthUserSummary | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  const applySession = useCallback((session: AuthSessionSummary | null) => {
    if (session) {
      setUser(session.user);
      setStatus('signedIn');
    } else {
      setUser(null);
      setStatus('signedOut');
    }
  }, []);

  useEffect(() => {
    const api = apiRef.current;
    let cancelled = false;

    void (async () => {
      const { session, error } = await api.getSession();
      if (cancelled) {
        return;
      }
      if (error) {
        setLastError(
          toAuthUserMessage(error, 'Could not restore the session.'),
        );
      }
      applySession(session);
    })();

    const subscription = api.onAuthStateChange((session) => {
      if (cancelled) {
        return;
      }
      // Schedule outside the auth callback path.
      queueMicrotask(() => {
        if (!cancelled) {
          applySession(session);
        }
      });
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [applySession]);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      setLastError(null);
      const { error } = await apiRef.current.signInWithPassword(
        email,
        password,
      );
      if (error) {
        setLastError(
          toAuthUserMessage(error, 'Sign-in failed. Check your details.'),
        );
        return false;
      }
      return true;
    },
    [],
  );

  const signOut = useCallback(async () => {
    setLastError(null);
    const { error } = await apiRef.current.signOut();
    if (error) {
      setLastError(
        toAuthUserMessage(error, 'Sign-out did not complete. Try again.'),
      );
      return false;
    }
    applySession(null);
    return true;
  }, [applySession]);

  const resetPasswordForEmail = useCallback(
    async (email: string, redirectTo: string) => {
      const { error } = await apiRef.current.resetPasswordForEmail(
        email,
        redirectTo,
      );
      if (error) {
        return {
          ok: false,
          error: toAuthUserMessage(
            error,
            'Could not send a password reset email.',
          ),
        };
      }
      return { ok: true, error: null };
    },
    [],
  );

  const updatePassword = useCallback(async (password: string) => {
    const { error } = await apiRef.current.updatePassword(password);
    if (error) {
      return {
        ok: false,
        error: toAuthUserMessage(error, 'Could not update the password.'),
      };
    }
    return { ok: true, error: null };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      lastError,
      clearError,
      signInWithPassword,
      signOut,
      resetPasswordForEmail,
      updatePassword,
    }),
    [
      status,
      user,
      lastError,
      clearError,
      signInWithPassword,
      signOut,
      resetPasswordForEmail,
      updatePassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return value;
}
