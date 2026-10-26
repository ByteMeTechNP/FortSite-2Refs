import { CreditCard, Hammer } from 'lucide-react';
import { NavLink } from 'react-router';

import { NAV_GROUPS, type NavItem } from '@/components/layout/nav-config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from 'cn';

/**
 * Reference nav paths that this app already implements.
 * Users, payments, marketplace, usage, audit, support, and settings stay
 * in nav-config and are not linked.
 */
const MOUNTED_ROUTES: Record<string, { to: string; label?: string }> = {
  '/super-admin': { to: '/platform', label: 'Overview' },
  '/super-admin/companies': { to: '/platform/companies' },
  '/super-admin/subscriptions': {
    to: '/platform/plans',
    label: 'Plans',
  },
};

const SUBSCRIPTIONS_ITEM: NavItem = {
  label: 'Subscriptions',
  to: '/platform/subscriptions',
  icon: CreditCard,
};

export function AppSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <Hammer className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-sm font-semibold tracking-wide">FortSite</p>
          <p className="text-sidebar-foreground/70 text-xs">Super Admin</p>
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 pb-6">
        {NAV_GROUPS.map((group) => {
          const items = group.items.flatMap((item) => {
            const mounted = MOUNTED_ROUTES[item.to];
            if (!mounted) {
              return [];
            }
            return [
              {
                label: mounted.label ?? item.label,
                to: mounted.to,
                icon: item.icon,
                end: mounted.to === '/platform',
              },
            ];
          });
          if (group.label === 'Customers') {
            items.push({ ...SUBSCRIPTIONS_ITEM, end: false });
          }
          if (items.length === 0) {
            return null;
          }
          return (
            <div key={group.label} className="mb-5">
              <p className="text-sidebar-foreground/50 px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                {group.label}
              </p>
              <nav className="grid gap-1" aria-label={group.label}>
                {items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-full px-3 py-2 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground',
                        )
                      }
                    >
                      <Icon className="size-4 shrink-0" aria-hidden="true" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          );
        })}
      </ScrollArea>
    </div>
  );
}
