import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Button } from '@/components/ui/button';

export function NotFoundPage() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-muted-foreground max-w-md text-sm">
        The path you opened is not part of this application foundation.
      </p>
      <Button asChild>
        <Link to={ROUTE_PATHS.home}>Back to home</Link>
      </Button>
    </main>
  );
}
