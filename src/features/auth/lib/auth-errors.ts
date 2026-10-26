/**
 * Map Supabase Auth errors to short, non-sensitive user messages.
 * Never include tokens, stack traces, or raw error objects.
 */
export function toAuthUserMessage(
  error:
    | {
        message?: string | undefined;
        status?: number | undefined;
        code?: string | undefined;
      }
    | null
    | undefined,
  fallback: string,
): string {
  if (!error) {
    return fallback;
  }

  const code = error.code?.toLowerCase() ?? '';
  const message = error.message?.toLowerCase() ?? '';

  if (
    code.includes('invalid_credentials') ||
    message.includes('invalid login credentials')
  ) {
    return 'Email or password is incorrect.';
  }

  if (
    code.includes('email_not_confirmed') ||
    message.includes('email not confirmed')
  ) {
    return 'Confirm the email address for this account before signing in.';
  }

  if (
    code.includes('over_request_rate_limit') ||
    message.includes('rate limit') ||
    error.status === 429
  ) {
    return 'Too many attempts. Wait a moment and try again.';
  }

  if (
    code.includes('otp_expired') ||
    message.includes('expired') ||
    message.includes('otp_expired')
  ) {
    return 'This link has expired. Request a new email and try again.';
  }

  if (
    code.includes('token') ||
    message.includes('invalid') ||
    message.includes('not valid')
  ) {
    return 'This link is invalid or has already been used.';
  }

  if (message.includes('network') || message.includes('fetch')) {
    return 'Network error. Check your connection and try again.';
  }

  return fallback;
}

export const GENERIC_PASSWORD_RESET_SUCCESS =
  'If an account exists for that email, a password reset message has been sent. Check your inbox and spam folder.';
