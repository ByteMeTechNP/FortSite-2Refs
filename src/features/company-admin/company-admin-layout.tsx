import { useState } from 'react';
import { Menu, UserRound } from 'lucide-react';

import { CompanyAdminSidebar } from '@/features/company-admin/company-admin-sidebar';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

/**
 * NOT MOUNTED. Visual shell only.
 * Company-admin session, company switching, invite acceptance, and sign-out
 * are not copied. No route renders this layout.
 */
export function CompanyAdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-background flex min-h-svh">
      <aside className="hidden w-64 shrink-0 md:block">
        <div className="sticky top-0 h-svh">
          <CompanyAdminSidebar />
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
              <SheetTitle className="sr-only">Company navigation</SheetTitle>
              <CompanyAdminSidebar onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="ml-auto">
            <Button variant="ghost" size="sm" className="gap-2" type="button">
              <UserRound className="size-4" />
              <span className="hidden max-w-[140px] truncate sm:inline">
                Account
              </span>
            </Button>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6" />
      </div>
    </div>
  );
}
