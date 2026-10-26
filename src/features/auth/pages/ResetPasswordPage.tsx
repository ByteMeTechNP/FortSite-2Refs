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

const MIN_PASSWORD_LENGTH = 8;

export function ResetPasswordPage() {
  const { status, updatePassword } = useAuth();
  const passwordId = useId();
  const confirmId = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'initializing') {
    return (
      <AuthPageShell
        title="Set a new password"
        description="Checking the recovery session…"
      >
        <p className="text-foreground-secondary text-sm">Loading…</p>
      </AuthPageShell>
    );
  }

  if (status !== 'signedIn' && !done) {
    return (
      <AuthPageShell
        title="Recovery link required"
        description="Open a valid password-reset link from your email before setting a new password."
      >
        <AuthStatusView
          title="Link missing or expired"
          description="Request a new password reset email and open the latest link."
          variant="warning"
        >
          <Link
            to={ROUTE_PATHS.authForgotPassword}
            className="text-link text-sm hover:underline"
          >
            Request another email
          </Link>
        </AuthStatusView>
      </AuthPageShell>
    );
  }

  if (done) {
    return (
      <AuthPageShell
        title="Password updated"
        description="Your password has been changed. Organization access is still provisioned separately."
      >
        <AuthStatusView
          title="Success"
          description="You can continue to your account. Changing a password does not grant company membership."
          variant="success"
        >
          <Button asChild>
            <Link to={ROUTE_PATHS.account}>Continue to account</Link>
          </Button>
        </AuthStatusView>
      </AuthPageShell>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setActionError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(
        `Use at least ${MIN_PASSWORD_LENGTH} characters for the new password.`,
      );
      return;
    }
    if (password !== confirm) {
      setFieldError('The password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    const result = await updatePassword(password);
    setSubmitting(false);

    if (!result.ok) {
      setActionError(result.error);
      return;
    }

    setDone(true);
  }

  return (
    <AuthPageShell
      title="Set a new password"
      description="Choose a new password for this account."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={passwordId}>New password</Label>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={confirmId}>Confirm password</Label>
          <Input
            id={confirmId}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
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
          Update password
        </Button>
      </form>
    </AuthPageShell>
  );
}
