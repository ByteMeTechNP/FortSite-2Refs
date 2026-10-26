import { useEffect, useState } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS, platformPlanPath } from '@/app/route-paths';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingState } from '@/components/states/LoadingState';
import { EmptyState } from '@/components/states/EmptyState';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  createBrowserSubscriptionApi,
  type SubscriptionApi,
} from '@/features/platform/subscriptions/api';
import {
  currencyForCountry,
  emptyPlanDraft,
  parseMoneyAmount,
  validatePlanDraft,
  type PlanDraftInput,
} from '@/features/platform/subscriptions/validation';
import type { BillingInterval } from '@/features/platform/subscriptions/types';

type PlanRow = Readonly<{
  plan_id: string;
  code: string;
  name: string;
  current_version?: Readonly<{
    status: string;
    registration_country: string;
    currency: string;
    billing_interval: string;
    amount: number | string;
  }>;
  current_subscription_count?: number;
}>;

type PlansPageProps = Readonly<{
  api?: SubscriptionApi;
}>;

export function PlansPage({
  api = createBrowserSubscriptionApi(),
}: PlansPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [draft, setDraft] = useState<PlanDraftInput>(emptyPlanDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void api.listPlans().then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }
      const payload = result.data as { plans?: PlanRow[] } | null;
      setPlans(Array.isArray(payload?.plans) ? payload.plans : []);
      setError(null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [api, reloadKey]);

  async function createDraft() {
    const problem = validatePlanDraft(draft);
    if (
      problem ||
      (draft.registrationCountry !== 'Nepal' &&
        draft.registrationCountry !== 'India') ||
      !draft.billingInterval ||
      !draft.priceKind
    ) {
      setMessage(problem ?? 'Complete the draft fields.');
      return;
    }
    const amount = parseMoneyAmount(draft.amount);
    if (amount === null) {
      setMessage('Enter a valid amount.');
      return;
    }
    setPending(true);
    setMessage(null);
    const created = await api.createPlanDraft({
      code: draft.code.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      registrationCountry: draft.registrationCountry,
      billingInterval: draft.billingInterval,
      priceKind: draft.priceKind,
      amount,
      trialDays: Number(draft.trialDays),
      graceDays: Number(draft.graceDays),
      entitlements: draft.entitlements,
    });
    setPending(false);
    if (!created.ok) {
      setMessage(created.message);
      return;
    }
    setDraft(emptyPlanDraft());
    setLoading(true);
    setReloadKey((value) => value + 1);
  }

  return (
    <main className="flex flex-col gap-8 px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow="Plans"
        title="Subscription plans"
        description="Create drafts, publish immutable versions, and retire plans. Prices are owner-configured. There is no payment gateway."
      />

      <section className="border-border bg-card flex max-w-xl flex-col gap-4 rounded-[length:var(--fs-radius-card)] border p-4 sm:p-6">
        <h2 className="text-lg font-semibold">New draft</h2>
        {message ? (
          <Alert variant="danger">
            <AlertTitle>Draft needs attention</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : null}
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-code">Plan code</Label>
          <Input
            id="plan-code"
            value={draft.code}
            onChange={(event) => {
              setDraft((current) => ({ ...current, code: event.target.value }));
            }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-name">Name</Label>
          <Input
            id="plan-name"
            value={draft.name}
            onChange={(event) => {
              setDraft((current) => ({ ...current, name: event.target.value }));
            }}
          />
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Country</legend>
          {(['Nepal', 'India'] as const).map((country) => (
            <label key={country} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="plan-country"
                checked={draft.registrationCountry === country}
                onChange={() => {
                  setDraft((current) => ({
                    ...current,
                    registrationCountry: country,
                  }));
                }}
              />
              {country} / {currencyForCountry(country)}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-interval">Billing interval</Label>
          <select
            id="plan-interval"
            className="border-input bg-background h-9 rounded-[length:var(--fs-radius-control)] border px-3 text-sm"
            value={draft.billingInterval}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                billingInterval: event.target.value as BillingInterval | '',
              }));
            }}
          >
            <option value="">Choose…</option>
            <option value="monthly">Monthly</option>
            <option value="annual">Annual</option>
            <option value="lifetime">Lifetime</option>
          </select>
        </div>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium">Price kind</legend>
          {(['paid', 'free'] as const).map((kind) => (
            <label key={kind} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="price-kind"
                checked={draft.priceKind === kind}
                onChange={() => {
                  setDraft((current) => ({
                    ...current,
                    priceKind: kind,
                    amount: kind === 'free' ? '0' : current.amount,
                  }));
                }}
              />
              {kind}
            </label>
          ))}
        </fieldset>
        <div className="flex flex-col gap-2">
          <Label htmlFor="plan-amount">Amount</Label>
          <Input
            id="plan-amount"
            value={draft.amount}
            onChange={(event) => {
              setDraft((current) => ({
                ...current,
                amount: event.target.value,
              }));
            }}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="trial-days">Trial days</Label>
            <Input
              id="trial-days"
              value={draft.trialDays}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  trialDays: event.target.value,
                }));
              }}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="grace-days">Grace days</Label>
            <Input
              id="grace-days"
              value={draft.graceDays}
              onChange={(event) => {
                setDraft((current) => ({
                  ...current,
                  graceDays: event.target.value,
                }));
              }}
            />
          </div>
        </div>
        <Button
          type="button"
          disabled={pending}
          onClick={() => {
            void createDraft();
          }}
        >
          {pending ? 'Saving…' : 'Create draft'}
        </Button>
      </section>

      {loading ? <LoadingState message="Loading plans…" /> : null}
      {error ? (
        <Alert variant="danger">
          <AlertTitle>Plans unavailable</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!loading && !error && plans.length === 0 ? (
        <EmptyState
          title="No plans yet"
          description="Create a draft to start the catalogue. Nothing is seeded."
        />
      ) : null}
      {!loading && !error && plans.length > 0 ? (
        <div className="border-border overflow-x-auto rounded-[length:var(--fs-radius-card)] border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Current Subs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((plan) => (
                <TableRow key={plan.plan_id}>
                  <TableCell>
                    <Link
                      className="text-link hover:underline"
                      to={platformPlanPath(plan.plan_id)}
                    >
                      {plan.code}
                    </Link>
                  </TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{plan.current_version?.status ?? '—'}</TableCell>
                  <TableCell>
                    {plan.current_version?.registration_country ?? '—'} /{' '}
                    {plan.current_version?.currency ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {plan.current_version?.amount ?? '—'}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {plan.current_subscription_count ?? 0}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
