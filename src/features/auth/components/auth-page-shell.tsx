import type { ReactNode } from 'react';
import { Hammer } from 'lucide-react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
} from '@/components/ui/card';

type AuthPageShellProps = Readonly<{
  title: string;
  description: string;
  children: ReactNode;
}>;

export function AuthPageShell({
  title,
  description,
  children,
}: AuthPageShellProps) {
  return (
    <main className="bg-background flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader>
          <div className="bg-primary text-primary-foreground mb-2 flex size-10 items-center justify-center rounded-lg">
            <Hammer className="size-5" aria-hidden="true" />
          </div>
          <h1 className="font-heading text-base leading-snug font-medium">
            {title}
          </h1>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {children}
          <p className="text-sm">
            <Link to={ROUTE_PATHS.home} className="text-link hover:underline">
              Back to foundation home
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
