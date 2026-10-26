import type { ReactNode } from 'react';
import { Boxes } from 'lucide-react';
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
    <main className="bg-background flex min-h-svh flex-col items-center justify-center px-4 py-12">
      <div className="border-border bg-card flex w-full max-w-[length:var(--fs-auth-max)] flex-col gap-6 rounded-[length:var(--fs-radius-card)] border p-6 sm:p-8">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-lg"
              aria-hidden="true"
            >
              <Boxes className="size-4" strokeWidth={1.75} />
            </span>
            <p className="text-foreground text-sm font-semibold tracking-tight">
              {appEnv.appName}
            </p>
          </div>
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-foreground-secondary text-sm leading-relaxed">
            {description}
          </p>
        </div>
        {children}
        <p className="text-foreground-secondary text-sm">
          <Link to={ROUTE_PATHS.home} className="text-link hover:underline">
            Back to foundation home
          </Link>
        </p>
      </div>
    </main>
  );
}
