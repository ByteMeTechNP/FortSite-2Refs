import { Skeleton } from '@/components/ui/skeleton';

type LoadingStateProps = Readonly<{
  message?: string;
}>;

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div role="status" className="grid gap-3">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-24 w-full" />
      <span className="text-muted-foreground text-sm">{message}</span>
    </div>
  );
}
