import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from 'cn';
import { Loader2Icon } from 'lucide-react';
import { Slot } from 'radix-ui';
import * as React from 'react';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-transparent text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 aria-busy:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground hover:bg-[color:var(--fs-primary-hover)]',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-[color:var(--fs-secondary-hover)]',
        outline: 'border-input bg-card text-foreground hover:bg-muted',
        ghost: 'text-foreground hover:bg-muted',
        destructive:
          'bg-destructive text-white hover:bg-[color:var(--fs-destructive-hover)]',
        link: 'rounded-none border-0 text-link underline-offset-4 hover:underline',
      },
      size: {
        /* Dense desktop size — documented; not the default touch target */
        sm: 'h-9 min-h-9 gap-1.5 px-3 text-[0.8125rem]',
        /* Default and large aim for ≥44px touch height */
        default: 'h-11 min-h-11 px-4',
        lg: 'h-12 min-h-12 px-5 text-base',
        icon: 'size-11',
        'icon-sm': 'size-9',
        'icon-lg': 'size-12',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

type ButtonProps = React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

function Button({
  className,
  variant = 'default',
  size = 'default',
  asChild = false,
  loading = false,
  disabled,
  children,
  type,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button';
  const isDisabled = Boolean(disabled) || loading;

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={asChild && isDisabled ? true : undefined}
      {...props}
    >
      {loading ? (
        <>
          <Loader2Icon
            aria-hidden="true"
            className="size-4 motion-safe:animate-spin"
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
}

export { Button, buttonVariants };
export type { ButtonProps };
