import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { AuthStatusView } from '@/features/auth/components/auth-status-view';
import { useAuth } from '@/features/auth/context/auth-context';
import { ProfileForm } from '@/features/profile/components/ProfileForm';
import { createBrowserSubscriptionApi } from '@/features/platform/subscriptions/api';

/**
 * Signed-in account shell. Shows Auth identity, self-service profile, and a
 * founding-admin subscription summary when one exists.
 */
export function AccountPage() {
  const { user, signOut, lastError, clearError } = useAuth();
  const [summary, setSummary] = useState<unknown[] | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void createBrowserSubscriptionApi()
      .getMySummary()
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setSummary(null);
          setSummaryError(null);
          return;
        }
        setSummary(Array.isArray(result.data) ? result.data : []);
        setSummaryError(null);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  async function handleSignOut() {
    clearError();
    await signOut();
  }

  return (
    <main className="bg-background mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <PageHeader
        eyebrow="Account"
        title="Your account"
        description={`Signed in as ${user?.email ?? 'unknown email'}. Authentication is not company membership, a role, or platform authority.`}
      />

      {summary && summary.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h2 className="text-foreground text-xl font-semibold">
            Subscription status
          </h2>
          <p className="text-foreground-secondary text-sm">
            Read-only summary for your founding-admin company. Plan and payment
            changes stay with the Platform Owner.
          </p>
          <ul className="flex flex-col gap-3 text-sm">
            {summary.map((row) => {
              const item = row as {
                company_code?: string;
                legal_name?: string;
                plan_name?: string;
                effective_status?: string;
                access?: { explanation?: string; allowed?: boolean };
              };
              return (
                <li
                  key={item.company_code ?? item.legal_name}
                  className="border-border rounded-[length:var(--fs-radius-card)] border p-3"
                >
                  <p className="font-medium">
                    {item.legal_name} ({item.company_code})
                  </p>
                  <p className="text-foreground-secondary">
                    {item.plan_name ?? 'No plan'} ·{' '}
                    {item.effective_status ?? 'no subscription'}
                  </p>
                  <p className="text-foreground-secondary mt-1">
                    {item.access?.explanation ??
                      (item.access?.allowed
                        ? 'Eligible'
                        : 'Not eligible for normal use')}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : (
        <AuthStatusView
          title="Account authenticated"
          description="Company membership and subscription summaries appear here for founding administrators after Phase 09/10 provisioning."
          variant="warning"
        />
      )}
      {summaryError ? (
        <p role="alert" className="text-destructive text-sm">
          {summaryError}
        </p>
      ) : null}

      <section className="flex flex-col gap-4">
        <h2 className="text-foreground text-xl font-semibold">Profile</h2>
        <p className="text-foreground-secondary text-sm">
          Profile fields are optional display details for this Auth user only.
          They are not a source of roles or tenant access.
        </p>
        {user ? <ProfileForm userId={user.id} /> : null}
      </section>

      {lastError ? (
        <p role="alert" className="text-destructive text-sm">
          {lastError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void handleSignOut();
          }}
        >
          Sign out
        </Button>
        <Button asChild variant="ghost">
          <Link to={ROUTE_PATHS.home}>Foundation home</Link>
        </Button>
      </div>
    </main>
  );
}
