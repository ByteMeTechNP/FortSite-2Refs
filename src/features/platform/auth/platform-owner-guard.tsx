import { Navigate, useLocation } from 'react-router';
import type { ReactNode } from 'react';

import { ROUTE_PATHS } from '@/app/route-paths';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { useAuth } from '@/features/auth/context/auth-context';
import { usePlatformAuthority } from '@/features/platform/authority';

type PlatformOwnerGuardProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Navigation UX for `/platform/*`. Not a database authorization boundary.
 * Privileged children render only after Phase 07 reports `owner`.
 */
export function PlatformOwnerGuard({ children }: PlatformOwnerGuardProps) {
  const { status } = useAuth();
  const authority = usePlatformAuthority();
  const location = useLocation();

  if (status === 'initializing') {
    return <LoadingState message="Checking session…" />;
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

  if (authority === 'unavailable') {
    return (
      <main className="bg-background mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 px-6 py-12">
        <ErrorState
          title="Platform authorization unavailable"
          message="FortSite could not verify Platform Owner authority. Privileged content is hidden until the check succeeds."
          onRetry={() => {
            window.location.reload();
          }}
        />
      </main>
    );
  }

  if (authority === 'not_owner') {
    return <Navigate to={ROUTE_PATHS.platformUnauthorized} replace />;
  }

  return children;
}
