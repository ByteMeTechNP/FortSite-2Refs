import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
          <CardDescription>Loading subscription counts…</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (state.status === 'error') {
    return (
      <Card size="sm">
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
          <CardDescription>{state.message}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const { counts } = state;
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>
          Current terms only. Published plans: {counts.publishedPlans}.
        </CardDescription>
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
            className="hover:bg-muted/40 rounded-[length:var(--fs-radius-control)] p-2"
            to={`${ROUTE_PATHS.platformSubscriptions}?status=${key}`}
          >
            <p className="text-muted-foreground capitalize">{key}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </Link>
        ))}
      </div>
    </Card>
  );
}
