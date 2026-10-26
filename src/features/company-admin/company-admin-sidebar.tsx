import { Hammer } from 'lucide-react';
import { NavLink } from 'react-router';

import { COMPANY_ADMIN_NAV } from '@/features/company-admin/nav-config';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from 'cn';

/**
 * NOT MOUNTED. Visual copy of the reference company-admin sidebar.
 * No /company-admin route renders this component.
 */
export function CompanyAdminSidebar({
  companyName,
  companyCode,
  onNavigate,
}: {
  companyName?: string | null;
  companyCode?: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="bg-sidebar text-sidebar-foreground flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-lg">
          <Hammer className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-wide">FortSite</p>
          <p className="text-sidebar-foreground/70 truncate text-xs">
            Company Admin
          </p>
        </div>
      </div>
      {companyName || companyCode ? (
        <div className="border-sidebar-border/40 bg-sidebar-accent/40 mx-4 mb-4 rounded-xl border px-3 py-2">
          <p className="truncate text-sm font-medium">{companyName}</p>
          {companyCode ? (
            <p className="text-sidebar-foreground/60 text-xs">{companyCode}</p>
          ) : null}
        </div>
      ) : null}
      <ScrollArea className="flex-1 px-3 pb-6">
        {COMPANY_ADMIN_NAV.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="text-sidebar-foreground/50 px-3 pb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
              {group.label}
            </p>
            <nav className="grid gap-1" aria-label={group.label}>
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/company-admin'}
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
            {group.upcoming?.length ? (
              <div className="mt-4 px-3">
                <p className="text-sidebar-foreground/40 pb-2 text-[11px] font-semibold tracking-[0.14em] uppercase">
                  Coming in a future phase
                </p>
                <ul className="text-sidebar-foreground/45 grid gap-1 text-xs">
                  {group.upcoming.map((label) => (
                    <li key={label} className="rounded-full px-3 py-1.5">
                      {label}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}
