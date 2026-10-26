import type { ReactNode } from 'react';

import { cn } from 'cn';

type PageHeaderProps = Readonly<{
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  className?: string;
}>;

/**
 * Shared page grammar: optional breadcrumb, title, one-line subtitle, actions.
 * Title is 28px/600 (24px on small screens). Page title lives here, not in the top bar.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex flex-wrap items-start justify-between gap-4',
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        {breadcrumb ? (
          <div className="text-foreground-secondary text-sm">{breadcrumb}</div>
        ) : null}
        {eyebrow ? (
          <p className="text-foreground-secondary text-sm font-medium tracking-wide uppercase">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-[length:var(--fs-text-page-title)]">
          {title}
        </h1>
        {description ? (
          <p className="text-foreground-secondary max-w-2xl text-sm leading-relaxed">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
