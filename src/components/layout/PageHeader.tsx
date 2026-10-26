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

export function PageHeader({
  eyebrow,
  title,
  description,
  breadcrumb,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {breadcrumb}
        {eyebrow ? <p className="sr-only">{eyebrow}</p> : null}
        <h1 className="text-foreground text-2xl font-semibold tracking-tight">
          {title}
        </h1>
        {description ? (
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}
