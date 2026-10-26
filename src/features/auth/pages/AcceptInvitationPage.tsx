import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { LoadingState } from '@/components/states/LoadingState';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { AuthStatusView } from '@/features/auth/components/auth-status-view';
import { useAuth } from '@/features/auth/context/auth-context';
import { toAuthUserMessage } from '@/features/auth/lib/auth-errors';
import { getBrowserSupabaseClient } from '@/lib/supabase';

const MIN_PASSWORD_LENGTH = 8;

/**
 * Completes an Auth invitation session. Does not create company membership.
 * Invitation sending is not implemented in the browser.
 */
export function AcceptInvitationPage() {
  const { status, updatePassword, user } = useAuth();
  const passwordId = useId();
  const confirmId = useId();
  const checkedRef = useRef(false);
  const [checking, setChecking] = useState(true);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (checkedRef.current) {
      return;
    }
    checkedRef.current = true;

    let cancelled = false;

    void (async () => {
      try {
        const client = getBrowserSupabaseClient();
        const { data, error } = await client.auth.getSession();
        if (cancelled) {
          return;
        }

        window.history.replaceState(
          {},
          document.title,
          ROUTE_PATHS.authAcceptInvitation,
        );

        if (error) {
          setLinkError(
            toAuthUserMessage(
              error,
              'This invitation link could not be completed.',
            ),
          );
        } else if (!data.session) {
          setLinkError(
            'This invitation link is invalid, expired, or has already been used.',
          );
        }
      } catch {
        if (!cancelled) {
          setLinkError('This invitation link could not be completed.');
        }
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (checking || status === 'initializing') {
    return (
      <AuthPageShell
        title="Accept invitation"
        description="Checking the invitation session…"
      >
        <LoadingState message="Checking invitation…" />
      </AuthPageShell>
    );
  }

  if (linkError || status !== 'signedIn') {
    return (
      <AuthPageShell
        title="Invitation unavailable"
        description="The Auth invitation could not be completed."
      >
        <AuthStatusView
          title="Expired or invalid invitation"
          description={
            linkError ??
            'Open the latest invitation email, or contact the person who invited you.'
          }
          variant="warning"
        >
          <Button asChild>
            <Link to={ROUTE_PATHS.authLogin}>Go to sign in</Link>
          </Button>
        </AuthStatusView>
      </AuthPageShell>
    );
  }

  if (done) {
    return <Navigate to={ROUTE_PATHS.account} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldError(null);
    setActionError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFieldError(
        `Use at least ${MIN_PASSWORD_LENGTH} characters for the password.`,
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
      title="Complete invitation"
      description="Set a password for this Auth account. Organization membership is provisioned in a later phase."
    >
      <p className="text-muted-foreground text-sm">
        Signed in as {user?.email ?? 'invited account'}.
      </p>
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={passwordId}>Password</Label>
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
          Save password and continue
        </Button>
      </form>
    </AuthPageShell>
  );
}
