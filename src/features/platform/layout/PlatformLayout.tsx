import { useState } from 'react';
import { LogOut, Menu, UserRound } from 'lucide-react';
import { Link, Outlet, useLocation } from 'react-router';

import { AppSidebar } from '@/components/layout/app-sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/context/auth-context';

export function PlatformLayout() {
  const location = useLocation();
  const { user, signOut, clearError } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const email = user?.email ?? 'Account';
  const crumbs = location.pathname.split('/').filter(Boolean);

  async function handleSignOut() {
    clearError();
    await signOut();
  }

  return (
    <div className="bg-background flex min-h-svh">
      <aside
        className="hidden w-64 shrink-0 md:block"
        aria-label="Platform navigation"
      >
        <div className="sticky top-0 h-svh">
          <AppSidebar />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border bg-card sticky top-0 z-20 flex h-16 items-center gap-3 border-b px-4">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="sr-only">Platform navigation</SheetTitle>
              <AppSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <Breadcrumb className="hidden min-w-0 sm:flex">
            <BreadcrumbList>
              {crumbs.map((crumb, index) => {
                const href = `/${crumbs.slice(0, index + 1).join('/')}`;
                const isLast = index === crumbs.length - 1;
                return (
                  <span key={href} className="contents">
                    {index > 0 ? <BreadcrumbSeparator /> : null}
                    <BreadcrumbItem>
                      {isLast ? (
                        <BreadcrumbPage className="capitalize">
                          {crumb.replaceAll('-', ' ')}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={href} className="capitalize">
                            {crumb.replaceAll('-', ' ')}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </span>
                );
              })}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <UserRound className="size-4" />
                  <span className="max-w-40 truncate">{email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel className="font-normal">
                  Platform owner
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    void handleSignOut();
                  }}
                >
                  <LogOut className="size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
