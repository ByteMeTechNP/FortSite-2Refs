import type { AuthError, Session, User } from '@supabase/supabase-js';

import { getBrowserSupabaseClient } from '@/lib/supabase';

export type AuthUserSummary = Readonly<{
  id: string;
  email: string | null;
}>;

export type AuthSessionSummary = Readonly<{
  user: AuthUserSummary;
}>;

export type AuthApiError = {
  message: string;
  status?: number | undefined;
  code?: string | undefined;
};

export type AuthApiResult = Readonly<{
  error: AuthApiError | null;
}>;

export type AuthApi = {
  getSession: () => Promise<{
    session: AuthSessionSummary | null;
    error: AuthApiError | null;
  }>;
  onAuthStateChange: (
    listener: (session: AuthSessionSummary | null) => void,
  ) => { unsubscribe: () => void };
  signInWithPassword: (
    email: string,
    password: string,
  ) => Promise<AuthApiResult>;
  signOut: () => Promise<AuthApiResult>;
  resetPasswordForEmail: (
    email: string,
    redirectTo: string,
  ) => Promise<AuthApiResult>;
  updatePassword: (password: string) => Promise<AuthApiResult>;
};

function toUserSummary(user: User | null | undefined): AuthUserSummary | null {
  if (!user) {
    return null;
  }
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

function toSessionSummary(
  session: Session | null | undefined,
): AuthSessionSummary | null {
  const user = toUserSummary(session?.user);
  if (!user) {
    return null;
  }
  return { user };
}

function toError(error: AuthError | null): AuthApiError | null {
  if (!error) {
    return null;
  }
  const mapped: AuthApiError = {
    message: error.message,
  };
  if (error.status !== undefined) {
    mapped.status = error.status;
  }
  if ('code' in error && error.code !== undefined) {
    mapped.code = String(error.code);
  }
  return mapped;
}

/** Public-browser Auth operations. Never call Auth Admin APIs here. */
export function createSupabaseAuthApi(
  client: ReturnType<
    typeof getBrowserSupabaseClient
  > = getBrowserSupabaseClient(),
): AuthApi {
  return {
    async getSession() {
      const { data, error } = await client.auth.getSession();
      return {
        session: toSessionSummary(data.session),
        error: toError(error),
      };
    },

    onAuthStateChange(listener) {
      const { data } = client.auth.onAuthStateChange((_event, session) => {
        listener(toSessionSummary(session));
      });
      return {
        unsubscribe: () => {
          data.subscription.unsubscribe();
        },
      };
    },

    async signInWithPassword(email, password) {
      const { error } = await client.auth.signInWithPassword({
        email,
        password,
      });
      return { error: toError(error) };
    },

    async signOut() {
      const { error } = await client.auth.signOut();
      return { error: toError(error) };
    },

    async resetPasswordForEmail(email, redirectTo) {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo,
      });
      return { error: toError(error) };
    },

    async updatePassword(password) {
      const { error } = await client.auth.updateUser({ password });
      return { error: toError(error) };
    },
  };
}
