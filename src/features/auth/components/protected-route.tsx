import { Navigate, useLocation } from 'react-router';
import type { ReactNode } from 'react';

import { ROUTE_PATHS } from '@/app/route-paths';
import { LoadingState } from '@/components/states/LoadingState';
import { useAuth } from '@/features/auth/context/auth-context';

type ProtectedRouteProps = Readonly<{
  children: ReactNode;
}>;

/**
 * Navigation UX only. Not a database authorization boundary.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { status } = useAuth();
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

  return children;
}
