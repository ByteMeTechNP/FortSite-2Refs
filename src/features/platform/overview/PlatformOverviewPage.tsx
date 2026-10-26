import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Button, buttonVariants } from '@/components/ui/button';
import { usePlatformOverview } from '@/features/platform/data/use-platform-overview';
import { CompanyStatusCards } from '@/features/platform/overview/components/CompanyStatusCards';
import { PlatformEventsUnavailable } from '@/features/platform/overview/components/PlatformEventsUnavailable';
import { SubscriptionMetricsPanel } from '@/features/platform/overview/components/SubscriptionMetricsPanel';

export function PlatformOverviewPage() {
  const { state, refresh } = usePlatformOverview();

  return (
    <main className="flex flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Overview"
        title="Platform overview"
        description="Company lifecycle counts come from the trusted Platform Owner summary. Subscription counts come from current terms. Platform events wait on Phase 11."
        actions={
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
        }
      />

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
            <SubscriptionMetricsPanel />
            <PlatformEventsUnavailable />
          </div>
        </div>
      ) : null}

      {state.status === 'ready' ? (
        <div className="flex flex-col gap-6">
          <CompanyStatusCards counts={state.data.counts} />
          <div className="grid gap-4 lg:grid-cols-2">
            <SubscriptionMetricsPanel />
            <PlatformEventsUnavailable />
          </div>
        </div>
      ) : null}
    </main>
  );
}
