import type { ReactNode } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AuthStatusViewProps = Readonly<{
  title: string;
  description: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children?: ReactNode;
}>;

export function AuthStatusView({
  title,
  description,
  variant = 'info',
  children,
}: AuthStatusViewProps) {
  return (
    <div className="flex flex-col gap-4">
      <Alert variant={variant}>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{description}</AlertDescription>
      </Alert>
      {children}
    </div>
  );
}
