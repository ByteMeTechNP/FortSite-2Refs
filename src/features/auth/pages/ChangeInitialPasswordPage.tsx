import { useEffect, useId, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  completeInitialPassword,
  MIN_INITIAL_PASSWORD_LENGTH,
} from '@/features/auth/data/password-change';
import {
  markPasswordChangeCleared,
  usePasswordChangeRequired,
} from '@/features/auth/data/use-password-change-required';
import { resolveInternalReturnPath } from '@/features/auth/lib/redirects';

/**
 * Mandatory initial password change. The password lives only in this form
 * until submit, then it is cleared. It is not written to storage or the URL.
 */
export function ChangeInitialPasswordPage() {
  const { status, user, signOut, clearError } = useAuth();
  const requirement = usePasswordChangeRequired();
  const location = useLocation();
  const passwordId = useId();
  const confirmId = useId();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [donePath, setDonePath] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      setPassword('');
      setConfirm('');
    };
  }, []);

  if (status === 'initializing' || requirement === 'checking') {
    return (
      <AuthPageShell
        title="Change initial password"
        description="Checking the account security state…"
      >
        <p className="text-muted-foreground text-sm">Loading…</p>
      </AuthPageShell>
    );
  }

  if (status !== 'signedIn') {
    return (
      <Navigate
        to={ROUTE_PATHS.authLogin}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (requirement === 'clear' || donePath) {
    const rawState: unknown = location.state;
    const from =
      rawState &&
      typeof rawState === 'object' &&
      'from' in rawState &&
      typeof rawState.from === 'string'
        ? rawState.from
        : null;
    return (
      <Navigate to={donePath ?? resolveInternalReturnPath(from)} replace />
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setActionError(null);

    if (password.length < MIN_INITIAL_PASSWORD_LENGTH) {
      setFieldError(`Use at least ${MIN_INITIAL_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setFieldError('The password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    const result = await completeInitialPassword(password);
    setPassword('');
    setConfirm('');
    setSubmitting(false);

    if (!result.ok) {
      setActionError(result.message);
      return;
    }

    if (user?.id) {
      markPasswordChangeCleared(user.id);
    }

    const rawState: unknown = location.state;
    const from =
      rawState &&
      typeof rawState === 'object' &&
      'from' in rawState &&
      typeof rawState.from === 'string'
        ? rawState.from
        : null;
    setDonePath(resolveInternalReturnPath(from));
  }

  async function handleSignOut() {
    clearError();
    setPassword('');
    setConfirm('');
    await signOut();
  }

  return (
    <AuthPageShell
      title="Change initial password"
      description="This account was provisioned with a temporary password. Choose a new password before opening company or platform data."
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
            disabled={submitting || requirement === 'unavailable'}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={confirmId}>Confirm new password</Label>
          <Input
            id={confirmId}
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            disabled={submitting || requirement === 'unavailable'}
            required
          />
        </div>
        {fieldError || actionError ? (
          <Alert variant="danger">
            <AlertDescription>{fieldError ?? actionError}</AlertDescription>
          </Alert>
        ) : null}
        {requirement === 'unavailable' ? (
          <Alert variant="warning">
            <AlertDescription>
              The security check is unavailable, so this password cannot be
              saved yet.
            </AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-wrap gap-3">
          <Button
            type="submit"
            loading={submitting}
            disabled={submitting || requirement === 'unavailable'}
          >
            Save new password
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void handleSignOut();
            }}
          >
            Sign out
          </Button>
        </div>
      </form>
      <p className="text-muted-foreground text-sm">
        <Link
          to={ROUTE_PATHS.authLogin}
          className="text-link underline-offset-4 hover:underline"
        >
          Return to sign in
        </Link>
      </p>
    </AuthPageShell>
  );
}
