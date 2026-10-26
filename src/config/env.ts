const APP_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export type AppEnvironment = (typeof APP_ENVIRONMENTS)[number];

export type AppEnv = Readonly<{
  appName: string;
  appEnv: AppEnvironment;
}>;

export type EnvInput = Readonly<{
  VITE_APP_NAME?: string | undefined;
  VITE_APP_ENV?: string | undefined;
}>;

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

export const appEnv: AppEnv = parseAppEnv({
  VITE_APP_NAME: import.meta.env.VITE_APP_NAME,
  VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
});
