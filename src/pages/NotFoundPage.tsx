import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';

export function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6 py-12">
      <h1 className="text-foreground text-3xl font-semibold">Page not found</h1>
      <p className="text-foreground-secondary text-base leading-relaxed">
        The path you opened is not part of this application foundation.
      </p>
      <p>
        <Link
          to={ROUTE_PATHS.home}
          className="text-link font-medium underline underline-offset-4"
        >
          Back to home
        </Link>
      </p>
    </main>
  );
}
