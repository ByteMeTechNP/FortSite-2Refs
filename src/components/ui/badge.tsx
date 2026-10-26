import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Slot } from 'radix-ui';
import * as React from 'react';

const badgeVariants = cva(
  'inline-flex h-6 w-fit shrink-0 items-center justify-center gap-1 rounded-full border px-2.5 text-xs font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:size-3',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-foreground',
        success: 'border-success-border bg-success-bg text-success-foreground',
        warning: 'border-warning-border bg-warning-bg text-warning-foreground',
        danger: 'border-danger-border bg-danger-bg text-danger-foreground',
        info: 'border-info-border bg-info-bg text-info-foreground',
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border bg-card text-foreground',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
);

function Badge({
  className,
  variant = 'neutral',
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'span';

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
