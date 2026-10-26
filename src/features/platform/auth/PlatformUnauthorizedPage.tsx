import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { AuthStatusView } from '@/features/auth/components/auth-status-view';
import { Button } from '@/components/ui/button';

/**
 * Signed-in but not a Platform Owner. Reveals no platform metrics.
 */
export function PlatformUnauthorizedPage() {
  return (
    <main className="bg-background mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-6 px-6 py-12">
      <AuthStatusView
        title="Platform access denied"
        description="This account is signed in, but it is not an active Platform Owner. Company membership does not grant platform administration."
        variant="warning"
      >
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to={ROUTE_PATHS.account}>Go to account</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to={ROUTE_PATHS.home}>Foundation home</Link>
          </Button>
        </div>
      </AuthStatusView>
    </main>
  );
}
