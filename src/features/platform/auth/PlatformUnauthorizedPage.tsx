import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Button } from '@/components/ui/button';

/**
 * Signed-in but not a Platform Owner. Reveals no platform metrics.
 */
export function PlatformUnauthorizedPage() {
  return (
    <main className="bg-background flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold">Platform access denied</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        This account is signed in, but it is not an active Platform Owner.
        Company membership does not grant platform administration.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to={ROUTE_PATHS.account}>Go to account</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTE_PATHS.home}>Foundation home</Link>
        </Button>
      </div>
    </main>
  );
}
