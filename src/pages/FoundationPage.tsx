import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Button } from '@/components/ui/button';
import { appEnv } from '@/config/env';

export function FoundationPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6 py-12">
      <p className="text-foreground-secondary text-sm font-medium tracking-wide uppercase">
        Development scaffold
      </p>
      <h1 className="text-foreground text-3xl font-semibold">
        {appEnv.appName} — application foundation
      </h1>
      <p className="text-foreground-secondary text-base leading-relaxed">
        This is the development scaffold. Product modules will be added in later
        phases.
      </p>
      <p className="text-foreground-secondary text-sm">
        Environment: {appEnv.appEnv}. Email/password Auth screens are available.
        Organization membership and business modules are not implemented yet.
        The browser uses the public Supabase API only.
      </p>
      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild>
          <Link to={ROUTE_PATHS.authLogin}>Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={ROUTE_PATHS.account}>Account</Link>
        </Button>
      </div>
    </main>
  );
}
