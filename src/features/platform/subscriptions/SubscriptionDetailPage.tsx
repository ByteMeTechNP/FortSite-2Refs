import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';

import { ROUTE_PATHS, platformCompanyPath } from '@/app/route-paths';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CurrencyAmount } from '@/components/shared/currency-amount';
import { LoadingState } from '@/components/states/LoadingState';
import {
  createBrowserSubscriptionApi,
  type SubscriptionApi,
} from '@/features/platform/subscriptions/api';
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from '@/features/platform/subscriptions/types';
import {
  parseMoneyAmount,
  validatePaymentAmount,
} from '@/features/platform/subscriptions/validation';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Detail = Readonly<{
  subscription: Readonly<{
    id: string;
    company_id: string;
    status: string;
    effective_status: string;
    term_interval: string;
    billing_currency: 'NPR' | 'INR';
    amount: number | string;
    period_ends_at: string | null;
    trial_ends_at: string | null;
    grace_ends_at: string | null;
    ends_at: string | null;
    cancel_at_period_end: boolean;
  }>;
  company: Readonly<{
    id: string;
    company_code: string;
    legal_name: string;
    lifecycle_status: string;
  }>;
  plan: Readonly<{ code: string; name: string }>;
  access: Readonly<{
    allowed: boolean;
    reason_code: string;
    explanation: string;
  }>;
  payments: ReadonlyArray<
    Readonly<{
      id: string;
      amount: number | string;
      currency: string;
      received_on: string;
      payment_method: string;
      status: string;
    }>
  >;
}>;

type Props = Readonly<{
  subscriptionId: string;
  api?: SubscriptionApi;
}>;

export function SubscriptionDetailView({
  subscriptionId,
  api = createBrowserSubscriptionApi(),
}: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [receivedOn, setReceivedOn] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('bank_transfer');
  const [extendEndsAt, setExtendEndsAt] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const actionKey = useRef(crypto.randomUUID());

  useEffect(() => {
    let cancelled = false;
    void api.getSubscription(subscriptionId).then((result) => {
      if (cancelled) {
        return;
      }
      if (!result.ok) {
        setError(result.message);
        setDetail(null);
        setLoading(false);
        return;
      }
      setDetail(result.data as Detail);
      setError(null);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [api, subscriptionId, reloadKey]);

  function nextKey() {
    actionKey.current = crypto.randomUUID();
  }

  async function run(
    action: () => Promise<{ ok: true } | { ok: false; message: string }>,
  ) {
    setMessage(null);
    const result = await action();
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    nextKey();
    setReason('');
    setLoading(true);
    setReloadKey((value) => value + 1);
  }

  if (loading) {
    return <LoadingState message="Loading subscription…" />;
  }
  if (error || !detail) {
    return (
      <main className="flex flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <Alert variant="danger">
          <AlertTitle>Subscription unavailable</AlertTitle>
          <AlertDescription>{error ?? 'Not found.'}</AlertDescription>
        </Alert>
        <Link to={ROUTE_PATHS.platformSubscriptions}>Back</Link>
      </main>
    );
  }

  const currency = detail.subscription.billing_currency;

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        breadcrumb={
          <Link
            className="text-link hover:underline"
            to={ROUTE_PATHS.platformSubscriptions}
          >
            Subscriptions
          </Link>
        }
        title={detail.company.legal_name}
        description={`${detail.plan.name} (${detail.plan.code}) · stored ${detail.subscription.status} · effective ${detail.subscription.effective_status} · ${detail.subscription.term_interval} · ${detail.subscription.amount} ${currency}`}
      />
      <p className="text-sm">
        <Link
          className="text-link hover:underline"
          to={platformCompanyPath(detail.company.id)}
        >
          {detail.company.company_code}
        </Link>{' '}
        · company {detail.company.lifecycle_status}
      </p>
      <Alert variant={detail.access.allowed ? 'success' : 'warning'}>
        <AlertTitle>
          {detail.access.allowed ? 'Eligible' : 'Not eligible'}
        </AlertTitle>
        <AlertDescription>
          {detail.access.explanation} ({detail.access.reason_code})
        </AlertDescription>
      </Alert>

      {message ? (
        <Alert variant="danger">
          <AlertTitle>Action needs attention</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <section className="border-border flex max-w-xl flex-col gap-3 rounded-xl border p-4">
        <h3 className="font-semibold">Lifecycle actions</h3>
        <p className="text-muted-foreground text-sm">
          These change the subscription only. They do not change company
          lifecycle.
        </p>
        <Label htmlFor="sub-reason">Reason</Label>
        <Textarea
          id="sub-reason"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
        />
        <div className="flex flex-wrap gap-2">
          {detail.subscription.effective_status === 'trial' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void run(async () => {
                  if (reason.trim().length < 3) {
                    return { ok: false, message: 'Enter a reason.' };
                  }
                  return api.convertTrial({
                    subscriptionId,
                    reason: reason.trim(),
                    idempotencyKey: actionKey.current,
                  });
                });
              }}
            >
              Convert trial
            </Button>
          ) : null}
          {detail.subscription.effective_status !== 'suspended' &&
          detail.subscription.effective_status !== 'cancelled' ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                void run(async () => {
                  if (reason.trim().length < 3) {
                    return { ok: false, message: 'Enter a reason.' };
                  }
                  return api.suspendSubscription({
                    subscriptionId,
                    reason: reason.trim(),
                    idempotencyKey: actionKey.current,
                  });
                });
              }}
            >
              Suspend
            </Button>
          ) : null}
          {detail.subscription.status === 'suspended' ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void run(async () => {
                  if (reason.trim().length < 3) {
                    return { ok: false, message: 'Enter a reason.' };
                  }
                  return api.reactivateSubscription({
                    subscriptionId,
                    reason: reason.trim(),
                    idempotencyKey: actionKey.current,
                  });
                });
              }}
            >
              Reactivate
            </Button>
          ) : null}
          {detail.subscription.status !== 'cancelled' ? (
            <>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void run(async () => {
                    if (reason.trim().length < 3) {
                      return { ok: false, message: 'Enter a reason.' };
                    }
                    return api.cancelSubscription({
                      subscriptionId,
                      mode: 'immediate',
                      reason: reason.trim(),
                      idempotencyKey: actionKey.current,
                    });
                  });
                }}
              >
                Cancel now
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  void run(async () => {
                    if (reason.trim().length < 3) {
                      return { ok: false, message: 'Enter a reason.' };
                    }
                    return api.cancelSubscription({
                      subscriptionId,
                      mode: 'at_period_end',
                      reason: reason.trim(),
                      idempotencyKey: actionKey.current,
                    });
                  });
                }}
              >
                Cancel at period end
              </Button>
            </>
          ) : null}
        </div>
        {detail.subscription.term_interval !== 'lifetime' ? (
          <div className="mt-2 flex flex-col gap-2">
            <Label htmlFor="extend-end">Extend ends at (UTC ISO)</Label>
            <Input
              id="extend-end"
              value={extendEndsAt}
              onChange={(event) => {
                setExtendEndsAt(event.target.value);
              }}
              placeholder="2027-01-01T00:00:00.000Z"
            />
            <Button
              type="button"
              size="sm"
              onClick={() => {
                void run(async () => {
                  if (reason.trim().length < 3) {
                    return { ok: false, message: 'Enter a reason.' };
                  }
                  if (!extendEndsAt.trim()) {
                    return { ok: false, message: 'Enter a new end date.' };
                  }
                  return api.extendSubscription({
                    subscriptionId,
                    newEndsAt: extendEndsAt.trim(),
                    reason: reason.trim(),
                    idempotencyKey: actionKey.current,
                  });
                });
              }}
            >
              Extend term
            </Button>
          </div>
        ) : null}
      </section>

      <section className="border-border flex max-w-xl flex-col gap-3 rounded-xl border p-4">
        <h3 className="font-semibold">Record manual payment</h3>
        <p className="text-muted-foreground text-sm">
          Currency is locked to {currency}. Recording a payment does not renew
          or reactivate the subscription.
        </p>
        <Label htmlFor="pay-amount">Amount</Label>
        <Input
          id="pay-amount"
          value={amount}
          onChange={(event) => {
            setAmount(event.target.value);
          }}
        />
        <Label htmlFor="pay-date">Received on</Label>
        <Input
          id="pay-date"
          type="date"
          value={receivedOn}
          onChange={(event) => {
            setReceivedOn(event.target.value);
          }}
        />
        <Label htmlFor="pay-method">Method</Label>
        <select
          id="pay-method"
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-full border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
          value={method}
          onChange={(event) => {
            setMethod(event.target.value as PaymentMethod);
          }}
        >
          {PAYMENT_METHODS.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
        <Button
          type="button"
          onClick={() => {
            void run(async () => {
              const parsed = parseMoneyAmount(amount);
              const problem = validatePaymentAmount(amount, currency, currency);
              if (problem || parsed === null) {
                return { ok: false, message: problem ?? 'Invalid amount.' };
              }
              if (!receivedOn) {
                return { ok: false, message: 'Enter the received date.' };
              }
              return api.recordPayment({
                subscriptionId,
                amount: parsed,
                receivedOn,
                paymentMethod: method,
                idempotencyKey: actionKey.current,
              });
            });
          }}
        >
          Record payment
        </Button>
        <ul className="text-muted-foreground mt-2 flex flex-col gap-1 text-sm">
          {detail.payments.map((payment) => (
            <li key={payment.id}>
              {payment.received_on}:{' '}
              <CurrencyAmount
                amount={payment.amount}
                currency={payment.currency}
              />{' '}
              via {payment.payment_method} ({payment.status})
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export function SubscriptionDetailPage() {
  const { subscriptionId } = useParams();
  if (!subscriptionId || !UUID.test(subscriptionId)) {
    return (
      <main className="px-4 py-6 sm:px-6 sm:py-8">
        <p>That subscription is not available.</p>
      </main>
    );
  }
  return <SubscriptionDetailView subscriptionId={subscriptionId} />;
}
