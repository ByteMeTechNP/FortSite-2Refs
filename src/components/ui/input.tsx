import * as React from 'react';
import { cn } from 'cn';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'border-input bg-card text-foreground file:text-foreground placeholder:text-foreground-secondary/80 focus-visible:border-ring focus-visible:ring-ring/40 disabled:bg-muted aria-invalid:border-destructive aria-invalid:ring-destructive/30 h-10 w-full min-w-0 rounded-[length:var(--fs-radius-control)] border px-3 py-2 text-base transition-colors outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-2 md:h-11 md:text-sm',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
