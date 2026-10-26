const APP_ENVIRONMENTS = ['development', 'test', 'production'] as const;

const LOCAL_HTTP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export type AppEnv = Readonly<{
  appName: string;
  appEnv: AppEnvironment;
}>;

export type EnvInput = Readonly<{
  VITE_APP_NAME?: string | undefined;
  VITE_APP_ENV?: string | undefined;
  VITE_SUPABASE_URL?: string | undefined;
  VITE_SUPABASE_PUBLISHABLE_KEY?: string | undefined;
}>;

export type PublicSupabaseConfig = Readonly<{
  url: string;
  publishableKey: string;
}>;

export class SupabaseConfigError extends Error {
  readonly variableNames: readonly string[];

  constructor(variableNames: readonly string[], message: string) {
    super(message);
    this.name = 'SupabaseConfigError';
    this.variableNames = variableNames;
  }
}

function isAppEnvironment(value: string): value is AppEnvironment {
  return (APP_ENVIRONMENTS as readonly string[]).includes(value);
}

/**
 * Parse browser-safe Vite environment values.
 * Unset values use local defaults. Explicit invalid values throw.
 */
export function parseAppEnv(input: EnvInput): AppEnv {
  const rawName = input.VITE_APP_NAME;
  const appName =
    rawName === undefined || rawName.trim() === ''
      ? 'FortSite'
      : rawName.trim();

  const rawEnv = input.VITE_APP_ENV;
  let appEnv: AppEnvironment;

  if (rawEnv === undefined || rawEnv.trim() === '') {
    appEnv = 'development';
  } else {
    const candidate = rawEnv.trim();
    if (!isAppEnvironment(candidate)) {
      throw new Error(
        `Invalid VITE_APP_ENV "${rawEnv}". Allowed values: ${APP_ENVIRONMENTS.join(', ')}.`,
      );
    }
    appEnv = candidate;
  }

  return Object.freeze({
    appName,
    appEnv,
  });
}

function jwtRole(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const payload: unknown = JSON.parse(atob(padded));
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'role' in payload &&
      typeof payload.role === 'string'
    ) {
      return payload.role;
    }
    return null;
  } catch {
    return null;
  }
}

function isSecretBrowserKey(value: string): boolean {
  const secretPrefix = 'sb_' + 'secret_';
  const serviceRole = 'service' + '_role';
  return value.startsWith(secretPrefix) || jwtRole(value) === serviceRole;
}

/**
 * Parse the public Supabase URL and publishable key.
 * Error text names the variable and never includes the supplied value.
 */
export function parseSupabasePublicConfig(
  input: EnvInput,
): PublicSupabaseConfig {
  const variableNames: string[] = [];
  const problems: string[] = [];

  const rawUrl = input.VITE_SUPABASE_URL?.trim() ?? '';
  if (rawUrl === '') {
    variableNames.push('VITE_SUPABASE_URL');
    problems.push('VITE_SUPABASE_URL is missing.');
  } else {
    let parsed: URL | null;
    try {
      parsed = new URL(rawUrl);
    } catch {
      parsed = null;
    }

    if (
      !parsed ||
      (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    ) {
      variableNames.push('VITE_SUPABASE_URL');
      problems.push('VITE_SUPABASE_URL must be an http or https URL.');
    } else if (
      parsed.protocol === 'http:' &&
      !LOCAL_HTTP_HOSTS.has(parsed.hostname)
    ) {
      variableNames.push('VITE_SUPABASE_URL');
      problems.push(
        'VITE_SUPABASE_URL may use http only for localhost development.',
      );
    }
  }

  const rawKey = input.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? '';
  if (rawKey === '') {
    variableNames.push('VITE_SUPABASE_PUBLISHABLE_KEY');
    problems.push('VITE_SUPABASE_PUBLISHABLE_KEY is missing.');
  } else if (isSecretBrowserKey(rawKey)) {
    variableNames.push('VITE_SUPABASE_PUBLISHABLE_KEY');
    problems.push(
      'VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable key, not a secret key.',
    );
  }

  if (problems.length > 0) {
    throw new SupabaseConfigError(variableNames, problems.join(' '));
  }

  return Object.freeze({
    url: rawUrl,
    publishableKey: rawKey,
  });
}

export function supabaseConfigErrorMessage(input: EnvInput): string | null {
  try {
    parseSupabasePublicConfig(input);
    return null;
  } catch (error) {
    if (error instanceof SupabaseConfigError) {
      return error.message;
    }
    return 'Supabase browser configuration is invalid.';
  }
}

export const appEnv: AppEnv = parseAppEnv({
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
});

export function readBrowserSupabaseEnv(): EnvInput {
  return {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env
      .VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}
