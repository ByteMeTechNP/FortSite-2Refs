import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Button, buttonVariants } from '@/components/ui/button';
import { usePlatformOverview } from '@/features/platform/data/use-platform-overview';
import { CompanyStatusCards } from '@/features/platform/overview/components/CompanyStatusCards';
import { PlatformEventsUnavailable } from '@/features/platform/overview/components/PlatformEventsUnavailable';
import { SubscriptionMetricsUnavailable } from '@/features/platform/overview/components/SubscriptionMetricsUnavailable';

export function PlatformOverviewPage() {
  const { state, refresh } = usePlatformOverview();

  return (
    <main className="flex flex-col gap-8 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Overview
          </p>
          <h2 className="text-2xl font-semibold">Platform overview</h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Company lifecycle counts come from the trusted Platform Owner
            summary. Subscription and audit panels wait on later phases.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            refresh();
          }}
          disabled={state.status === 'loading'}
        >
          Refresh
        </Button>
      </div>

      {state.status === 'idle' || state.status === 'loading' ? (
        <LoadingState message="Loading platform metrics…" />
      ) : null}

      {state.status === 'error' ? (
        <ErrorState
          title="Could not load company metrics"
          message={state.message}
          onRetry={() => {
            refresh();
          }}
        />
      ) : null}

      {state.status === 'empty' ? (
        <div className="flex flex-col gap-6">
          <EmptyState
            title="No companies yet"
            description="The company registry is empty. Create the first company from the directory."
            action={
              <Link
                className={buttonVariants()}
                to={ROUTE_PATHS.platformCompanyNew}
              >
                New company
              </Link>
            }
          />
          <CompanyStatusCards counts={state.data.counts} />
          <div className="grid gap-4 lg:grid-cols-2">
            <SubscriptionMetricsUnavailable />
            <PlatformEventsUnavailable />
          </div>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <div className="flex flex-col gap-6">
          <CompanyStatusCards counts={state.data.counts} />
          <div className="grid gap-4 lg:grid-cols-2">
            <SubscriptionMetricsUnavailable />
            <PlatformEventsUnavailable />
          </div>
        </div>
      ) : null}
    </main>
  );
}
