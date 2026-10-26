import { useRef, useState } from 'react';
import { Link } from 'react-router';

import { platformCompanyPath, ROUTE_PATHS } from '@/app/route-paths';
import { PageHeader } from '@/components/layout/PageHeader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { OnboardingApi } from '@/features/platform/onboarding/api';
import { TemporaryPasswordDialog } from '@/features/platform/onboarding/TemporaryPasswordDialog';
import { useOneTimePassword } from '@/features/platform/onboarding/use-one-time-password';
import {
  emptyOnboardingDraft,
  isRegistrationCountry,
  jurisdictionFor,
  REGISTRATION_COUNTRIES,
  validateOnboardingDraft,
  validateOnboardingStep,
  type OnboardingDraft,
} from '@/features/platform/onboarding/validation';
import type {
  BeginCompanyResult,
  ProvisionOutcome,
} from '@/features/platform/onboarding/parse';

const STEPS = [
  'Identity',
  'Country',
  'Administrator',
  'Subscription intent',
  'Review',
] as const;

function outcomeMessage(outcome: ProvisionOutcome): string | null {
  if (outcome.status === 'issued') {
    return null;
  }
  if (outcome.status === 'already_issued') {
    return 'A temporary password was already issued. It is not shown again. Issue a new one from the company page.';
  }
  if (outcome.status === 'conflict') {
    return 'This email cannot be used for a new founding administrator.';
  }
  if (outcome.status === 'forbidden') {
    return 'You do not have permission to do that.';
  }
  return 'The founding administrator could not be provisioned.';
}

type CompanyOnboardingWizardProps = Readonly<{
  api: OnboardingApi;
  signedIn?: boolean;
}>;

export function CompanyOnboardingWizard({
  api,
  signedIn = true,
}: CompanyOnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(emptyOnboardingDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [created, setCreated] = useState<BeginCompanyResult | null>(null);
  const idempotencyKey = useRef(crypto.randomUUID());
  const secret = useOneTimePassword(signedIn);
  const jurisdiction = isRegistrationCountry(draft.registrationCountry)
    ? jurisdictionFor(draft.registrationCountry)
    : null;

  function update(patch: Partial<OnboardingDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  async function submit() {
    const problem = validateOnboardingDraft(draft);
    if (problem || !isRegistrationCountry(draft.registrationCountry)) {
      setMessage(problem ?? 'Choose Nepal or India.');
      return;
    }
    setPending(true);
    setMessage(null);
    const begun = await api.beginCompanyOnboarding({
      legalName: draft.legalName,
      displayName: draft.displayName,
      contactEmail: draft.contactEmail,
      contactPhone: draft.contactPhone,
      locality: draft.locality,
      registrationCountry: draft.registrationCountry,
      adminEmail: draft.adminEmail,
      adminDisplayName: draft.adminDisplayName,
      emailAttested: true,
      requestedPlanCode: draft.requestedPlanCode,
      trialRequested: draft.trialRequested,
      idempotencyKey: idempotencyKey.current,
    });
    if (!begun.ok) {
      setPending(false);
      setMessage(begun.message);
      return;
    }
    const issued = await api.provisionFoundingAdmin(
      begun.result.provisioningId,
    );
    setCreated(begun.result);
    setPending(false);
    if (issued.status === 'issued') {
      secret.reveal(issued.password);
      return;
    }
    setMessage(outcomeMessage(issued));
  }

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Companies"
        title="Create a company"
        description="Nepal and India are the only registration countries. Currency and timezone are locked from that choice. The founding administrator password is generated on the server and shown once."
      />

      <ol className="flex flex-wrap gap-2" aria-label="Onboarding steps">
        {STEPS.map((label, index) => {
          const active = index === step;
          const done = index < step;
          return (
            <li
              key={label}
              className={[
                'flex h-9 items-center gap-2 rounded-full border px-3 text-sm',
                active
                  ? 'border-primary bg-primary/15 text-foreground font-medium'
                  : done
                    ? 'border-border bg-card text-foreground'
                    : 'border-border text-muted-foreground',
              ].join(' ')}
            >
              <span
                className={[
                  'flex size-5 items-center justify-center rounded-full text-xs font-semibold',
                  active || done
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                ].join(' ')}
                aria-hidden="true"
              >
                {index + 1}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {message ? (
        <Alert variant="danger">
          <AlertTitle>Onboarding needs attention</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      {created ? (
        <Alert variant="success">
          <AlertTitle>Company recorded</AlertTitle>
          <AlertDescription>
            <span className="font-mono">{created.companyCode}</span> is in{' '}
            {created.lifecycleStatus}. {created.defaultCurrency} /{' '}
            {created.timezone}.{' '}
            <Link
              className="underline underline-offset-4"
              to={platformCompanyPath(created.companyId)}
            >
              Open company
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      <form
        className="flex max-w-xl flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (step < STEPS.length - 1) {
            const problem = validateOnboardingStep(draft, step);
            setMessage(problem);
            if (!problem) {
              setStep((current) => current + 1);
            }
            return;
          }
          void submit();
        }}
      >
        {step === 0 ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="legal-name">Legal name</Label>
              <Input
                id="legal-name"
                value={draft.legalName}
                onChange={(event) => {
                  update({ legalName: event.target.value });
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={draft.displayName}
                onChange={(event) => {
                  update({ displayName: event.target.value });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-email">Contact email</Label>
              <Input
                id="contact-email"
                type="email"
                value={draft.contactEmail}
                onChange={(event) => {
                  update({ contactEmail: event.target.value });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-phone">Contact phone</Label>
              <Input
                id="contact-phone"
                value={draft.contactPhone}
                onChange={(event) => {
                  update({ contactPhone: event.target.value });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="locality">Locality</Label>
              <Input
                id="locality"
                value={draft.locality}
                onChange={(event) => {
                  update({ locality: event.target.value });
                }}
              />
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <fieldset className="flex flex-col gap-3">
            <legend className="text-sm font-medium">
              Legal registration country
            </legend>
            {REGISTRATION_COUNTRIES.map((country) => (
              <label key={country} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="registration-country"
                  value={country}
                  checked={draft.registrationCountry === country}
                  onChange={() => {
                    update({ registrationCountry: country });
                  }}
                />
                {country}
              </label>
            ))}
            {jurisdiction ? (
              <p className="text-muted-foreground text-sm">
                Locked currency {jurisdiction.currency}. Locked timezone{' '}
                {jurisdiction.timezone}. Compliance route{' '}
                {jurisdiction.routeKey} stays not connected, pending Phase 67.
              </p>
            ) : (
              <p className="text-muted-foreground text-sm">
                Choose a country to lock currency and timezone. There is no
                separate currency field.
              </p>
            )}
          </fieldset>
        ) : null}

        {step === 2 ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="admin-email">Founding administrator email</Label>
              <Input
                id="admin-email"
                type="email"
                value={draft.adminEmail}
                onChange={(event) => {
                  update({ adminEmail: event.target.value });
                }}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="admin-name">Founding administrator name</Label>
              <Input
                id="admin-name"
                value={draft.adminDisplayName}
                onChange={(event) => {
                  update({ adminDisplayName: event.target.value });
                }}
                required
              />
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1"
                checked={draft.emailAttested}
                onChange={(event) => {
                  update({ emailAttested: event.target.checked });
                }}
              />
              <span>
                I attest this email belongs to the founding administrator and
                may be confirmed without an invitation message.
              </span>
            </label>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Subscription intent is pending Phase 10. A plan code does not set
              a price, limit, duration, or entitlement.
            </p>
            <div className="grid gap-2">
              <Label htmlFor="plan-code">Requested plan code</Label>
              <Input
                id="plan-code"
                value={draft.requestedPlanCode}
                onChange={(event) => {
                  update({ requestedPlanCode: event.target.value });
                }}
              />
            </div>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={draft.trialRequested}
                onChange={(event) => {
                  update({ trialRequested: event.target.checked });
                }}
              />
              Trial requested
            </label>
          </>
        ) : null}

        {step === 4 && jurisdiction ? (
          <div className="border-border flex flex-col gap-2 rounded-xl border p-4 text-sm">
            <p>
              <span className="text-muted-foreground">Legal name. </span>
              {draft.legalName}
            </p>
            <p>
              <span className="text-muted-foreground">Country. </span>
              {draft.registrationCountry} / {jurisdiction.currency} /{' '}
              {jurisdiction.timezone}
            </p>
            <p>
              <span className="text-muted-foreground">Administrator. </span>
              {draft.adminDisplayName} ({draft.adminEmail})
            </p>
            <p>
              Compliance will be recorded as not connected, pending Phase 67.
            </p>
            <p>
              Subscription intent
              {draft.requestedPlanCode.trim()
                ? ` ${draft.requestedPlanCode.trim()}`
                : ''}{' '}
              is pending Phase 10 and does not grant access.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          {step > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setMessage(null);
                setStep((current) => current - 1);
              }}
            >
              Back
            </Button>
          ) : (
            <Link
              className="text-muted-foreground self-center text-sm hover:underline"
              to={ROUTE_PATHS.platformCompanies}
            >
              Cancel
            </Link>
          )}
          <Button type="submit" disabled={pending}>
            {step < STEPS.length - 1
              ? 'Continue'
              : pending
                ? 'Creating…'
                : 'Create company'}
          </Button>
        </div>
      </form>

      <TemporaryPasswordDialog
        password={secret.password}
        onClear={() => {
          secret.clear();
        }}
      />
    </main>
  );
}
