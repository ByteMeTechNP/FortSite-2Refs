import type { ReactNode } from 'react';

type EmptyStateProps = Readonly<{
  title: string;
  description: string;
  action?: ReactNode;
}>;

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <section className="flex flex-col gap-2 text-neutral-800">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm leading-relaxed text-neutral-600">{description}</p>
      {action ? <div className="pt-1">{action}</div> : null}
    </section>
  );
}
