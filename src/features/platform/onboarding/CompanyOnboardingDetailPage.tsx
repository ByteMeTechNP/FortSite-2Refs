import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/context/auth-context';
import {
  createBrowserOnboardingApi,
  type OnboardingApi,
} from '@/features/platform/onboarding/api';
import { CompanyLifecycleActions } from '@/features/platform/onboarding/CompanyLifecycleActions';
import {
  provisionFailureMessage,
  type CompanyOnboardingDetail,
  type ProvisionOutcome,
} from '@/features/platform/onboarding/parse';
import { TemporaryPasswordDialog } from '@/features/platform/onboarding/TemporaryPasswordDialog';
import { useOneTimePassword } from '@/features/platform/onboarding/use-one-time-password';
import type { CompanyLifecycleStatus } from '@/features/platform/types';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function outcomeMessage(outcome: ProvisionOutcome): string {
  if (outcome.status === 'already_issued') {
    return 'A temporary password was already issued. It is not shown again.';
  }
  if (outcome.status === 'conflict') {
    return 'This email cannot be used for a new founding administrator.';
  }
  if (outcome.status === 'forbidden') {
    return 'You do not have permission to do that.';
  }
  return 'The founding administrator could not be provisioned.';
}

type DetailState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; message: string }>
  | Readonly<{ status: 'ready'; detail: CompanyOnboardingDetail }>;

type CompanyOnboardingDetailViewProps = Readonly<{
  companyId: string;
  api: OnboardingApi;
  signedIn: boolean;
}>;

export function CompanyOnboardingDetailView({
  companyId,
  api,
  signedIn,
}: CompanyOnboardingDetailViewProps) {
  const [state, setState] = useState<DetailState>({ status: 'loading' });
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const secret = useOneTimePassword(signedIn);
  const companyIdValid = UUID_PATTERN.test(companyId);

  useEffect(() => {
    if (!companyIdValid) {
      return;
    }
    let cancelled = false;
    void api.getCompanyOnboarding(companyId).then((outcome) => {
      if (cancelled) {
        return;
      }
      if (!outcome.ok) {
        setState({ status: 'error', message: outcome.message });
        return;
      }
      setState({ status: 'ready', detail: outcome.detail });
    });
    return () => {
      cancelled = true;
    };
  }, [api, companyId, companyIdValid, reloadKey]);

  async function issuePassword(detail: CompanyOnboardingDetail) {
    if (!detail.provisioning) {
      setMessage('The founding administrator could not be provisioned.');
      return;
    }
    setPending(true);
    setMessage(null);
    const outcome =
      detail.provisioning.handoff === 'issued'
        ? await api.resetFoundingAdminPassword(detail.provisioning.id)
        : await api.provisionFoundingAdmin(detail.provisioning.id);
    setPending(false);
    if (outcome.status === 'issued') {
      secret.reveal(outcome.password);
    } else {
      setMessage(outcomeMessage(outcome));
    }
    setState({ status: 'loading' });
    setReloadKey((current) => current + 1);
  }

  async function transition(
    nextStatus: CompanyLifecycleStatus,
    reason: string,
  ) {
    setMessage(null);
    const outcome = await api.transitionCompanyLifecycle({
      companyId,
      nextStatus,
      reason,
    });
    if (!outcome.ok) {
      setMessage(outcome.message);
      return;
    }
    setState({ status: 'loading' });
    setReloadKey((current) => current + 1);
  }

  const visibleState: DetailState = companyIdValid
    ? state
    : { status: 'error', message: 'That company is not available.' };
  const detail = visibleState.status === 'ready' ? visibleState.detail : null;
  const failure = provisionFailureMessage(
    detail?.provisioning?.failureCode ?? null,
  );

  return (
    <main className="flex flex-col gap-8 px-6 py-8">
      <div className="flex flex-col gap-2">
        <Link
          className="text-muted-foreground text-sm underline-offset-4 hover:underline"
          to={ROUTE_PATHS.platformCompanies}
        >
          Companies
        </Link>
        <h2 className="text-2xl font-semibold">
          {detail?.company.legalName ?? 'Company'}
        </h2>
      </div>

      {message ? (
        <Alert variant="danger">
          <AlertTitle>Action needs attention</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {visibleState.status === 'loading' ? (
        <LoadingState message="Loading company…" />
      ) : null}
      {visibleState.status === 'error' ? (
        <ErrorState
          title="Could not load company"
          message={visibleState.message}
        />
      ) : null}

      {detail ? (
        <div className="flex max-w-3xl flex-col gap-8">
          <section className="flex flex-col gap-3 text-sm">
            <p className="font-mono">{detail.company.companyCode}</p>
            <p>
              <Badge variant="secondary">
                {detail.company.lifecycleStatus}
              </Badge>
            </p>
            <p>
              {detail.company.registrationCountry} /{' '}
              {detail.company.defaultCurrency} / {detail.company.timezone}
            </p>
            <p className="text-muted-foreground">
              Compliance is not connected. Government filing is pending Phase 67
              {detail.compliance
                ? ` (${detail.compliance.routeKey}, ${detail.compliance.setupState}).`
                : '.'}
            </p>
            <p className="text-muted-foreground">
              Subscription intent
              {detail.subscriptionIntent?.requestedPlanCode
                ? ` ${detail.subscriptionIntent.requestedPlanCode}`
                : ''}{' '}
              is pending Phase 10 and is not an entitlement.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Founding administrator</h3>
            {detail.provisioning ? (
              <>
                <p className="text-sm">
                  {detail.provisioning.adminDisplayName} (
                  {detail.provisioning.adminEmail})
                </p>
                <p className="text-muted-foreground text-sm">
                  Provisioning {detail.provisioning.state}. Credential handoff{' '}
                  {detail.provisioning.handoff === 'issued'
                    ? 'issued'
                    : 'not issued'}
                  .
                </p>
                {failure ? (
                  <Alert variant="warning">
                    <AlertTitle>Provisioning</AlertTitle>
                    <AlertDescription>{failure}</AlertDescription>
                  </Alert>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => {
                    void issuePassword(detail);
                  }}
                >
                  {detail.provisioning.handoff === 'issued'
                    ? 'Issue a new temporary password'
                    : 'Issue temporary password'}
                </Button>
              </>
            ) : (
              <p className="text-muted-foreground text-sm">
                No founding administrator has been recorded.
              </p>
            )}
          </section>

          <section className="flex flex-col gap-3">
            <h3 className="text-lg font-semibold">Lifecycle</h3>
            <CompanyLifecycleActions
              key={detail.company.lifecycleStatus}
              status={detail.company.lifecycleStatus}
              disabled={pending}
              onTransition={transition}
            />
          </section>
        </div>
      ) : null}

      <TemporaryPasswordDialog
        password={secret.password}
        onClear={() => {
          secret.clear();
        }}
      />
    </main>
  );
}

export function CompanyOnboardingDetailPage() {
  const { companyId = '' } = useParams();
  const { user } = useAuth();
  const api = useMemo(() => createBrowserOnboardingApi(), []);
  return (
    <CompanyOnboardingDetailView
      companyId={companyId}
      api={api}
      signedIn={Boolean(user)}
    />
  );
}
