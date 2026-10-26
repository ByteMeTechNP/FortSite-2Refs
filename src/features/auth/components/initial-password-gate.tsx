import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { useAuth } from '@/features/auth/context/auth-context';
import { usePasswordChangeRequired } from '@/features/auth/data/use-password-change-required';

const PASSWORD_GATE_EXEMPT = new Set<string>([
  ROUTE_PATHS.authLogin,
  ROUTE_PATHS.authForgotPassword,
  ROUTE_PATHS.authResetPassword,
  ROUTE_PATHS.authCallback,
  ROUTE_PATHS.authAcceptInvitation,
  ROUTE_PATHS.authChangeInitialPassword,
]);

type InitialPasswordGateProps = Readonly<{
  children: ReactNode;
}>;

/**
 * UX gate for the trusted initial-password flag.
 * Database helpers still deny company and platform data when the flag is set.
 */
export function InitialPasswordGate({ children }: InitialPasswordGateProps) {
  const { status } = useAuth();
  const location = useLocation();
  const requirement = usePasswordChangeRequired();

  if (status === 'initializing') {
    return <LoadingState message="Checking session…" />;
  }

  if (status !== 'signedIn') {
    return children;
  }

  if (requirement === 'checking') {
    return <LoadingState message="Checking account security…" />;
  }

  if (requirement === 'unavailable') {
    return (
      <main className="bg-background mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 px-6 py-12">
        <ErrorState
          title="Account security check unavailable"
          message="FortSite could not verify whether this account must change its password. Business and platform pages stay hidden until the check succeeds."
          onRetry={() => {
            window.location.reload();
          }}
        />
      </main>
    );
  }

  if (
    requirement === 'required' &&
    !PASSWORD_GATE_EXEMPT.has(location.pathname)
  ) {
    return (
      <Navigate
        to={ROUTE_PATHS.authChangeInitialPassword}
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  return children;
}
