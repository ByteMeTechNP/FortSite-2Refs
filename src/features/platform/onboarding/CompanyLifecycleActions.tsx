import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ARCHIVE_CONFIRMATION,
  lifecycleActionLabel,
  lifecycleTargets,
} from '@/features/platform/onboarding/lifecycle';
import type { CompanyLifecycleStatus } from '@/features/platform/types';

type CompanyLifecycleActionsProps = Readonly<{
  status: CompanyLifecycleStatus;
  disabled?: boolean;
  onTransition: (
    nextStatus: CompanyLifecycleStatus,
    reason: string,
  ) => Promise<void>;
}>;

export function CompanyLifecycleActions({
  status,
  disabled = false,
  onTransition,
}: CompanyLifecycleActionsProps) {
  const targets = lifecycleTargets(status);
  const [nextStatus, setNextStatus] = useState<CompanyLifecycleStatus>(
    targets[0] ?? 'archived',
  );
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const selected = targets.includes(nextStatus) ? nextStatus : targets[0];
  const archiveReady =
    selected !== 'archived' || confirmation === ARCHIVE_CONFIRMATION;
  const reasonReady = reason.trim().length >= 3;
  const canSubmit =
    Boolean(selected) && archiveReady && reasonReady && !pending;

  if (!selected || targets.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Archived companies stay archived. There is no delete and no ordinary
        unarchive.
      </p>
    );
  }

  return (
    <form
      className="flex max-w-xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSubmit) {
          return;
        }
        setPending(true);
        void onTransition(selected, reason.trim()).finally(() => {
          setPending(false);
          setReason('');
          setConfirmation('');
        });
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="lifecycle-next">Next status</Label>
        <select
          id="lifecycle-next"
          className="border-input bg-card h-11 rounded-[length:var(--fs-radius-control)] border px-3 text-sm"
          value={selected}
          onChange={(event) => {
            setNextStatus(event.target.value as CompanyLifecycleStatus);
            setConfirmation('');
          }}
        >
          {targets.map((target) => (
            <option key={target} value={target}>
              {lifecycleActionLabel(status, target)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="lifecycle-reason">Reason</Label>
        <Textarea
          id="lifecycle-reason"
          value={reason}
          onChange={(event) => {
            setReason(event.target.value);
          }}
          required
          minLength={3}
          maxLength={500}
        />
      </div>
      {selected === 'archived' ? (
        <div className="flex flex-col gap-2">
          <Label htmlFor="lifecycle-archive">Type ARCHIVE to confirm</Label>
          <input
            id="lifecycle-archive"
            className="border-input bg-card h-11 rounded-[length:var(--fs-radius-control)] border px-3 text-sm"
            value={confirmation}
            onChange={(event) => {
              setConfirmation(event.target.value);
            }}
            autoComplete="off"
          />
        </div>
      ) : null}
      <Button type="submit" disabled={!canSubmit || disabled}>
        {lifecycleActionLabel(status, selected)}
      </Button>
    </form>
  );
}
