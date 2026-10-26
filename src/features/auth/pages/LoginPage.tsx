import { useId, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { useAuth } from '@/features/auth/context/auth-context';
import { resolveInternalReturnPath } from '@/features/auth/lib/redirects';

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function LoginPage() {
  const { status, signInWithPassword, lastError, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const emailId = useId();
  const passwordId = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === 'signedIn') {
    return <Navigate to={ROUTE_PATHS.account} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();
    setFieldError(null);

    const trimmedEmail = email.trim();
    if (!isValidEmail(trimmedEmail)) {
      setFieldError('Enter a valid email address.');
      return;
    }
    if (password.length === 0) {
      setFieldError('Enter your password.');
      return;
    }

    setSubmitting(true);
    const ok = await signInWithPassword(trimmedEmail, password);
    setSubmitting(false);

    if (ok) {
      const rawState: unknown = location.state;
      const fromState =
        rawState &&
        typeof rawState === 'object' &&
        'from' in rawState &&
        typeof rawState.from === 'string'
          ? rawState.from
          : null;
      void navigate(resolveInternalReturnPath(fromState), { replace: true });
    }
  }

  return (
    <AuthPageShell
      title="Sign in"
      description="Use the email and password for your provisioned FortSite account. There is no public registration."
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          void handleSubmit(event);
        }}
        noValidate
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor={emailId}>Email</Label>
          <Input
            id={emailId}
            name="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={submitting || status === 'initializing'}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor={passwordId}>Password</Label>
          <Input
            id={passwordId}
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={submitting || status === 'initializing'}
            required
          />
        </div>
        {fieldError || lastError ? (
          <Alert variant="danger">
            <AlertDescription>{fieldError ?? lastError}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" loading={submitting} disabled={submitting}>
          Sign in
        </Button>
      </form>
      <p className="text-foreground-secondary text-sm">
        <Link
          to={ROUTE_PATHS.authForgotPassword}
          className="text-link hover:underline"
        >
          Forgot password
        </Link>
      </p>
    </AuthPageShell>
  );
}
