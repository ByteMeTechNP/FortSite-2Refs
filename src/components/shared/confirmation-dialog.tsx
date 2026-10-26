import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  requireReason = false,
  pending = false,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  requireReason?: boolean;
  pending?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {requireReason ? (
          <div className="grid gap-2">
            <Label htmlFor="confirm-reason">Reason</Label>
            <Textarea
              id="confirm-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </div>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              type="button"
              disabled={pending || (requireReason && reason.trim().length < 3)}
              onClick={() => onConfirm(reason.trim())}
            >
              {pending ? 'Working…' : confirmLabel}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
