import type { ReactNode } from 'react';

type EmptyStateProps = Readonly<{
  title: string;
  description: string;
  action?: ReactNode;
}>;

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="border-border bg-card flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-12 text-center">
      <h2 className="text-foreground text-sm font-medium">{title}</h2>
      <p className="text-muted-foreground max-w-md text-sm">{description}</p>
      {action}
    </section>
  );
}
