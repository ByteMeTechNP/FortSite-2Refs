import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type TemporaryPasswordDialogProps = Readonly<{
  password: string | null;
  onClear: () => void;
}>;

export function TemporaryPasswordDialog({
  password,
  onClear,
}: TemporaryPasswordDialogProps) {
  return (
    <Dialog
      open={password !== null}
      onOpenChange={(open) => {
        if (!open) {
          onClear();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Store this password now</DialogTitle>
          <DialogDescription>
            This password is shown once. Store it now. Closing this dialog,
            leaving the page, or signing out clears it from this screen.
          </DialogDescription>
        </DialogHeader>
        {password ? (
          <Input
            readOnly
            value={password}
            aria-label="Temporary password"
            autoComplete="off"
          />
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClear}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
