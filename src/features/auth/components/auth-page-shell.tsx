import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { appEnv } from '@/config/env';

type AuthPageShellProps = Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}>;

export function AuthPageShell({
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <main className="bg-background mx-auto flex min-h-svh max-w-md flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          {appEnv.appName}
        </p>
        <h1 className="text-foreground text-3xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
      {children}
      <p className="text-muted-foreground text-sm">
        <Link
          to={ROUTE_PATHS.home}
          className="text-link underline-offset-4 hover:underline"
        >
          Back to foundation home
        </Link>
      </p>
    </main>
  );
}
