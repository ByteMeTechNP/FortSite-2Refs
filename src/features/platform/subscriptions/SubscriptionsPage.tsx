import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import {
  ROUTE_PATHS,
  platformCompanyPath,
  platformSubscriptionPath,
} from '@/app/route-paths';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/states/EmptyState';
import { LoadingState } from '@/components/states/LoadingState';
import {
  createBrowserSubscriptionApi,
  type SubscriptionApi,
} from '@/features/platform/subscriptions/api';
import {
  SUBSCRIPTION_STATUSES,
  isSubscriptionStatus,
  type SubscriptionStatus,
} from '@/features/platform/subscriptions/types';

type SubRow = Readonly<{
  id: string;
  company_id: string;
  company_code: string;
  legal_name: string;
  lifecycle_status: string;
  plan_code: string;
  plan_name: string;
  status: string;
  effective_status: string;
  term_interval: string;
  billing_currency: string;
  amount: number | string;
}>;

type SubscriptionsPageProps = Readonly<{
  api?: SubscriptionApi;
}>;

export function SubscriptionsPage({
  api = createBrowserSubscriptionApi(),
}: SubscriptionsPageProps) {
  const [params, setParams] = useSearchParams();
  const statusParam = params.get('status');
  const statusFilter =
    statusParam && isSubscriptionStatus(statusParam) ? statusParam : undefined;
  const [snapshot, setSnapshot] = useState<{
    filter: SubscriptionStatus | undefined;
    loading: boolean;
    error: string | null;
    rows: SubRow[];
  }>({
    filter: statusFilter,
    loading: true,
    error: null,
    rows: [],
  });
  const loading = snapshot.loading || snapshot.filter !== statusFilter;
  const error = snapshot.filter === statusFilter ? snapshot.error : null;
  const rows = snapshot.filter === statusFilter ? snapshot.rows : [];

  useEffect(() => {
    let cancelled = false;
    void api
      .listSubscriptions(statusFilter ? { status: statusFilter } : undefined)
      .then((result) => {
        if (cancelled) {
          return;
        }
        if (!result.ok) {
          setSnapshot({
            filter: statusFilter,
            loading: false,
            error: result.message,
            rows: [],
          });
          return;
        }
        const payload = result.data as { subscriptions?: SubRow[] } | null;
        setSnapshot({
          filter: statusFilter,
          loading: false,
          error: null,
          rows: Array.isArray(payload?.subscriptions)
            ? payload.subscriptions
            : [],
        });
      });
    return () => {
      cancelled = true;
    };
  }, [api, statusFilter]);

  return (
    <main className="flex flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Subscriptions
        </p>
        <h2 className="text-2xl font-semibold">Company subscriptions</h2>
        <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
          Current terms only. Eligibility uses company lifecycle and
          subscription status together. Payments never extend a term by
          themselves.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonVariants({
            variant: statusFilter ? 'outline' : 'default',
            size: 'sm',
          })}
          onClick={() => {
            setParams({});
          }}
        >
          All
        </button>
        {SUBSCRIPTION_STATUSES.map((status) => (
          <button
            key={status}
            type="button"
            className={buttonVariants({
              variant: statusFilter === status ? 'default' : 'outline',
              size: 'sm',
            })}
            onClick={() => {
              setParams({ status });
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {loading ? <LoadingState message="Loading subscriptions…" /> : null}
      {error ? (
        <Alert variant="danger">
          <AlertTitle>Subscriptions unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && !error && rows.length === 0 ? (
        <EmptyState
          title="No current subscriptions"
          description="Resolve a company onboarding intent after a plan is published."
        />
      ) : null}
      {!loading && !error && rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[48rem] text-left text-sm">
            <thead>
              <tr className="border-border border-b">
                <th className="py-2 font-medium">Company</th>
                <th className="py-2 font-medium">Plan</th>
                <th className="py-2 font-medium">Effective</th>
                <th className="py-2 font-medium">Term</th>
                <th className="py-2 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-border border-b">
                  <td className="py-2">
                    <Link
                      className="text-primary underline-offset-4 hover:underline"
                      to={platformSubscriptionPath(row.id)}
                    >
                      {row.company_code}
                    </Link>
                    <div className="text-muted-foreground">
                      <Link
                        className="underline-offset-4 hover:underline"
                        to={platformCompanyPath(row.company_id)}
                      >
                        {row.legal_name}
                      </Link>{' '}
                      · {row.lifecycle_status}
                    </div>
                  </td>
                  <td className="py-2">
                    {row.plan_name}
                    <div className="text-muted-foreground font-mono text-xs">
                      {row.plan_code}
                    </div>
                  </td>
                  <td className="py-2">{row.effective_status}</td>
                  <td className="py-2">{row.term_interval}</td>
                  <td className="py-2 tabular-nums">
                    {row.amount} {row.billing_currency}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Link
        className={buttonVariants({ variant: 'outline' })}
        to={ROUTE_PATHS.platform}
      >
        Back to overview
      </Link>
    </main>
  );
}

export type { SubscriptionStatus };
