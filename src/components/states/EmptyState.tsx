import type { ReactNode } from 'react';

type EmptyStateProps = Readonly<{
  title: string;
  description: string;
  action?: ReactNode;
}>;

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="text-foreground flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  );
}
