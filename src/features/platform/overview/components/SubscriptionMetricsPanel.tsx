import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { ErrorState } from '@/components/states/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  createBrowserSubscriptionApi,
  type SubscriptionApi,
} from '@/features/platform/subscriptions/api';
import type { SubscriptionCounts } from '@/features/platform/subscriptions/types';

type Props = Readonly<{
  api?: SubscriptionApi;
}>;

type State =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; message: string }>
  | Readonly<{ status: 'ready'; counts: SubscriptionCounts }>;

export function SubscriptionMetricsPanel({
  api = createBrowserSubscriptionApi(),
}: Props) {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    void api.getOverviewCounts().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setState({ status: 'error', message: result.message });
        return;
      }
      setState({ status: 'ready', counts: result.counts });
    });
    return () => {
      cancelled = true;
    };
  }, [api]);

  if (state.status === 'loading') {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
          <p className="text-muted-foreground mt-2 text-sm">
            Loading subscription counts…
          </p>
        </CardContent>
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <ErrorState title="Subscriptions unavailable" message={state.message} />
    );
  }

  const { counts } = state;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <p className="text-muted-foreground text-sm">
          Current terms only. Published plans: {counts.publishedPlans}.
        </p>
      </CardHeader>
      <div className="grid grid-cols-2 gap-3 px-4 pb-4 text-sm">
        {(
          [
            ['trial', counts.trial],
            ['active', counts.active],
            ['grace', counts.grace],
            ['overdue', counts.overdue],
            ['suspended', counts.suspended],
            ['cancelled', counts.cancelled],
          ] as const
        ).map(([key, value]) => (
          <Link
            key={key}
            className="hover:bg-muted/40 rounded-full p-2"
            to={`${ROUTE_PATHS.platformSubscriptions}?status=${key}`}
          >
            <p className="text-muted-foreground capitalize">{key}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
