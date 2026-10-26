import { NavLink, Outlet } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Button } from '@/components/ui/button';
import { appEnv } from '@/config/env';
import { useAuth } from '@/features/auth/context/auth-context';

const NAV_ITEMS = [
  { to: ROUTE_PATHS.platform, label: 'Overview', end: true },
  { to: ROUTE_PATHS.platformCompanies, label: 'Companies', end: false },
] as const;

/**
 * Platform Administration shell. Distinct from the company workspace.
 */
export function PlatformLayout() {
  const { user, signOut, clearError } = useAuth();

  async function handleSignOut() {
    clearError();
    await signOut();
  }

  return (
    <div className="bg-background text-foreground flex min-h-svh flex-col md:flex-row">
      <aside className="border-border bg-card flex w-full flex-col gap-6 border-b px-5 py-6 md:w-64 md:border-r md:border-b-0">
        <div className="flex flex-col gap-1">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            FortSite
          </p>
          <h1 className="text-lg font-semibold">Platform Administration</h1>
          <p className="text-muted-foreground text-xs">
            Environment: {appEnv.appEnv}
          </p>
        </div>

        <nav aria-label="Platform" className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                [
                  'rounded-[length:var(--fs-radius-control)] px-3 py-2 text-sm font-medium',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3">
          <p className="text-muted-foreground text-xs break-all">
            Signed in as {user?.email ?? 'unknown'}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              void handleSignOut();
            }}
          >
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  );
}
