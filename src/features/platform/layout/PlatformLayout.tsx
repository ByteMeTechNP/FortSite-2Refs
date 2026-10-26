import { useState } from 'react';
import {
  Boxes,
  Building2,
  CreditCard,
  LayoutDashboard,
  Menu,
  ScrollText,
} from 'lucide-react';
import { NavLink, Outlet } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/features/auth/context/auth-context';

const NAV_ITEMS = [
  {
    to: ROUTE_PATHS.platform,
    label: 'Overview',
    end: true,
    icon: LayoutDashboard,
  },
  {
    to: ROUTE_PATHS.platformCompanies,
    label: 'Companies',
    end: false,
    icon: Building2,
  },
  {
    to: ROUTE_PATHS.platformPlans,
    label: 'Plans',
    end: false,
    icon: ScrollText,
  },
  {
    to: ROUTE_PATHS.platformSubscriptions,
    label: 'Subscriptions',
    end: false,
    icon: CreditCard,
  },
] as const;

function navClassName(isActive: boolean): string {
  return [
    'relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors',
    isActive
      ? 'bg-shell-raised text-shell-foreground before:bg-primary before:absolute before:top-1.5 before:bottom-1.5 before:left-0 before:w-[3px] before:rounded-full'
      : 'text-shell-muted hover:bg-shell-raised/70 hover:text-shell-foreground',
  ].join(' ');
}

function PlatformNav({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  return (
    <nav aria-label="Platform" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) => navClassName(isActive)}
          >
            <Icon
              className="size-5 shrink-0"
              aria-hidden="true"
              strokeWidth={1.75}
            />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

function ShellBrand() {
  return (
    <div className="flex items-center gap-3 px-1">
      <span
        className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg"
        aria-hidden="true"
      >
        <Boxes className="size-5" strokeWidth={1.75} />
      </span>
      <div className="flex min-w-0 flex-col">
        <span className="text-shell-foreground text-base font-semibold tracking-tight">
          FortSite
        </span>
        <span className="text-shell-muted text-xs">Platform</span>
      </div>
    </div>
  );
}

function ShellFooter({
  email,
  onSignOut,
}: Readonly<{ email: string; onSignOut: () => void }>) {
  return (
    <div className="border-shell-border mt-auto flex flex-col gap-3 border-t pt-4">
      <p className="text-shell-muted px-1 text-xs break-all">{email}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="border-shell-border text-shell-foreground hover:bg-shell-raised hover:text-shell-foreground bg-transparent"
        onClick={onSignOut}
      >
        Sign out
      </Button>
    </div>
  );
}

/**
 * Platform Administration shell. Distinct from the company workspace.
 * Desktop: expanded Graphite rail at 252px. Mobile/tablet: Dialog drawer.
 * No collapsed icon rail — there is no collapse control.
 */
export function PlatformLayout() {
  const { user, signOut, clearError } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const email = user?.email ?? 'unknown';

  async function handleSignOut() {
    clearError();
    await signOut();
  }

  function onSignOutClick() {
    void handleSignOut();
  }

  return (
    <div className="bg-background text-foreground flex min-h-svh">
      <aside
        className="bg-shell text-shell-foreground border-shell-border sticky top-0 hidden h-svh w-[length:var(--fs-shell-width)] shrink-0 flex-col gap-8 border-r px-4 py-6 md:flex"
        aria-label="Platform navigation"
      >
        <ShellBrand />
        <PlatformNav />
        <ShellFooter email={email} onSignOut={onSignOutClick} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card sticky top-0 z-20 flex h-[length:var(--fs-topbar-height)] items-center gap-3 border-b px-4 md:px-6">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="size-5" />
          </Button>
          <p className="text-foreground-secondary text-sm font-medium md:hidden">
            FortSite Platform
          </p>
        </header>

        <div className="mx-auto w-full max-w-[length:var(--fs-content-max)] flex-1">
          <Outlet />
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showCloseButton
          className="bg-shell text-shell-foreground border-shell-border fixed top-0 left-0 h-svh max-h-svh w-[min(100%,var(--fs-shell-width))] max-w-none translate-x-0 translate-y-0 rounded-none p-4 sm:max-w-none"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Platform navigation</DialogTitle>
          </DialogHeader>
          <div className="flex h-full flex-col gap-8 pt-8">
            <ShellBrand />
            <PlatformNav onNavigate={() => setMobileOpen(false)} />
            <ShellFooter email={email} onSignOut={onSignOutClick} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
