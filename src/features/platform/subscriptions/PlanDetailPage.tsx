import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/states/LoadingState';
import {
  createBrowserSubscriptionApi,
  type SubscriptionApi,
} from '@/features/platform/subscriptions/api';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Version = Readonly<{
  id: string;
  version_number: number;
  status: string;
  registration_country: string;
  currency: string;
  billing_interval: string;
  price_kind: string;
  amount: number | string;
  trial_days: number;
  grace_days: number;
  published_at: string | null;
  retired_at: string | null;
}>;

type PlanDetail = Readonly<{
  plan: Readonly<{
    id: string;
    code: string;
    name: string;
    description: string | null;
  }>;
  versions: Version[];
  current_subscription_count: number;
}>;

type PlanDetailViewProps = Readonly<{
  planId: string;
  api?: SubscriptionApi;
}>;

export function PlanDetailView({
  planId,
  api = createBrowserSubscriptionApi(),
}: PlanDetailViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<PlanDetail | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void api.getPlan(planId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.message);
        setDetail(null);
        setLoading(false);
        return;
      }
      setDetail(result.data as PlanDetail);
      setError(null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [api, planId, reloadKey]);

  async function publish(versionId: string) {
    setMessage(null);
    const result = await api.publishPlanVersion(versionId);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setLoading(true);
    setReloadKey((value) => value + 1);
  }

  async function retire(versionId: string) {
    setMessage(null);
    if (reason.trim().length < 3) {
      setMessage('Enter a retirement reason.');
      return;
    }
    const result = await api.retirePlanVersion(versionId, reason.trim());
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    setReason('');
    setLoading(true);
    setReloadKey((value) => value + 1);
  }

  if (loading) {
    return <LoadingState message="Loading plan…" />;
  }
  if (error || !detail) {
    return (
      <main className="flex flex-col gap-4 px-6 py-8">
        <Alert variant="danger">
          <AlertTitle>Plan unavailable</AlertTitle>
          <AlertDescription>{error ?? 'Not found.'}</AlertDescription>
        </Alert>
        <Link to={ROUTE_PATHS.platformPlans}>Back to plans</Link>
      </main>
    );
  }

  return (
    <main className="flex flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Link
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          to={ROUTE_PATHS.platformPlans}
        >
          Plans
        </Link>
        <h2 className="text-2xl font-semibold">{detail.plan.name}</h2>
        <p className="font-mono text-sm">{detail.plan.code}</p>
        <p className="text-muted-foreground text-sm">
          Current subscriptions using this plan:{' '}
          <span className="text-foreground tabular-nums">
            {detail.current_subscription_count}
          </span>
        </p>
        {detail.plan.description ? (
          <p className="text-muted-foreground max-w-2xl text-sm">
            {detail.plan.description}
          </p>
        ) : null}
      </div>

      {message ? (
        <Alert variant="danger">
          <AlertTitle>Action needs attention</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold">Versions</h3>
        <p className="text-muted-foreground text-sm">
          Published commercial terms are immutable. A change creates a new
          version. Existing subscriptions keep their snapshot.
        </p>
        <div className="flex max-w-md flex-col gap-2">
          <Label htmlFor="retire-reason">Retirement reason</Label>
          <Input
            id="retire-reason"
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
            }}
          />
        </div>
        <ul className="flex flex-col gap-4">
          {detail.versions.map((version) => (
            <li
              key={version.id}
              className="border-border rounded-[length:var(--fs-radius-card)] border p-4 text-sm"
            >
              <p className="font-medium">
                Version {version.version_number} · {version.status}
              </p>
              <p className="text-muted-foreground mt-1">
                {version.registration_country} / {version.currency} /{' '}
                {version.billing_interval} / {version.price_kind}{' '}
                {version.amount}
              </p>
              <p className="text-muted-foreground mt-1">
                Trial {version.trial_days} days · Grace {version.grace_days}{' '}
                days
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {version.status === 'draft' ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      void publish(version.id);
                    }}
                  >
                    Publish
                  </Button>
                ) : null}
                {version.status === 'published' ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void retire(version.id);
                    }}
                  >
                    Retire
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export function PlanDetailPage() {
  const { planId } = useParams();
  if (!planId || !UUID.test(planId)) {
    return (
      <main className="px-6 py-8">
        <p>That plan is not available.</p>
      </main>
    );
  }
  return <PlanDetailView planId={planId} />;
}
