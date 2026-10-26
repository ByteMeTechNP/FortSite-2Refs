import * as React from 'react';
import { cn } from 'cn';

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        'border-input bg-card text-foreground placeholder:text-foreground-secondary focus-visible:border-ring focus-visible:ring-ring/40 disabled:bg-muted aria-invalid:border-destructive aria-invalid:ring-destructive/30 flex field-sizing-content min-h-24 w-full rounded-[length:var(--fs-radius-control)] border px-3 py-2 text-base transition-colors outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
