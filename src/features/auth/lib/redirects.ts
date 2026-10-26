import { ROUTE_PATHS } from '@/app/route-paths';

const INTERNAL_PATHS = new Set<string>([
  ROUTE_PATHS.account,
  ROUTE_PATHS.authLogin,
  ROUTE_PATHS.authForgotPassword,
  ROUTE_PATHS.authResetPassword,
  ROUTE_PATHS.authCallback,
  ROUTE_PATHS.authAcceptInvitation,
  ROUTE_PATHS.home,
  ROUTE_PATHS.platform,
  ROUTE_PATHS.platformCompanies,
  ROUTE_PATHS.platformUnauthorized,
]);

/**
 * Accept only same-app relative paths. Reject open redirects.
 */
export function resolveInternalReturnPath(
  candidate: string | null | undefined,
  fallback: string = ROUTE_PATHS.account,
): string {
  if (candidate === undefined || candidate === null) {
    return fallback;
  }

  const trimmed = candidate.trim();
  if (trimmed === '') {
    return fallback;
  }

  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) {
    return fallback;
  }

  if (trimmed.includes('\\') || trimmed.includes('://')) {
    return fallback;
  }

  const pathOnly = trimmed.split(/[?#]/, 2)[0] ?? trimmed;
  if (!INTERNAL_PATHS.has(pathOnly) && pathOnly !== ROUTE_PATHS.account) {
    // Allow exact known routes only. Unknown internal paths fall back.
    return fallback;
  }

  return pathOnly;
}

export type AuthRedirectOriginInput = Readonly<{
  VITE_AUTH_REDIRECT_ORIGIN?: string | undefined;
}>;

/**
 * Build the Auth email redirect URL only when the configured origin matches
 * the current browser origin. Returns null when the origin is unset or mismatched.
 */
export function buildAuthEmailRedirectUrl(
  input: AuthRedirectOriginInput,
  currentOrigin: string,
  callbackPath: string = ROUTE_PATHS.authCallback,
): string | null {
  const configured = input.VITE_AUTH_REDIRECT_ORIGIN?.trim() ?? '';
  if (configured === '') {
    return null;
  }

  let configuredOrigin: string;
  try {
    configuredOrigin = new URL(configured).origin;
  } catch {
    return null;
  }

  let current: string;
  try {
    current = new URL(currentOrigin).origin;
  } catch {
    return null;
  }

  if (configuredOrigin !== current) {
    return null;
  }

  return `${configuredOrigin}${callbackPath}`;
}

export function authRedirectOriginMissingMessage(): string {
  return 'VITE_AUTH_REDIRECT_ORIGIN is not configured for this environment. Password reset and invitation emails cannot be sent until an approved application origin is set in the environment and in the Supabase Auth redirect allow-list.';
}
