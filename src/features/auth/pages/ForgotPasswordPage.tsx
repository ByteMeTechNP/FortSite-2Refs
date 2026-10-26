import { useId, useState, type FormEvent } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { AuthStatusView } from '@/features/auth/components/auth-status-view';
import { useAuth } from '@/features/auth/context/auth-context';
import { GENERIC_PASSWORD_RESET_SUCCESS } from '@/features/auth/lib/auth-errors';
import {
  authRedirectOriginMissingMessage,
  buildAuthEmailRedirectUrl,
} from '@/features/auth/lib/redirects';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function ForgotPasswordPage() {
  const { resetPasswordForEmail } = useAuth();
  const emailId = useId();
  const [email, setEmail] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setActionError(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setFieldError('Enter a valid email address.');
      return;
    }

    const redirectTo = buildAuthEmailRedirectUrl(
      {
        VITE_AUTH_REDIRECT_ORIGIN: import.meta.env.VITE_AUTH_REDIRECT_ORIGIN,
      },
      window.location.origin,
    );

    if (!redirectTo) {
      setActionError(authRedirectOriginMissingMessage());
      return;
    }

    setSubmitting(true);
    const result = await resetPasswordForEmail(trimmedEmail, redirectTo);
    setSubmitting(false);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    // Always show the same success copy to avoid email enumeration.
    setSubmitted(true);
  }

  return (
    <AuthPageShell
      title="Reset password"
      description="Request a password reset email. The response is the same whether or not the address has an account."
    >
      {submitted ? (
        <AuthStatusView
          title="Check your email"
          description={GENERIC_PASSWORD_RESET_SUCCESS}
          variant="success"
        />
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            void handleSubmit(event);
          }}
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor={emailId}>Email</Label>
            <Input
              id={emailId}
              name="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={submitting}
              required
            />
          </div>
          {fieldError || actionError ? (
            <Alert variant="danger">
              <AlertDescription>{fieldError ?? actionError}</AlertDescription>
            </Alert>
          ) : null}
          <Button type="submit" loading={submitting} disabled={submitting}>
            Send reset email
          </Button>
        </form>
      )}
      <p className="text-muted-foreground text-sm">
        <Link to={ROUTE_PATHS.authLogin} className="text-link hover:underline">
          Back to sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
