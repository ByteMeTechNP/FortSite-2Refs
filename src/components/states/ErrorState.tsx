import { Button } from '@/components/ui/button';

type ErrorStateProps = Readonly<{
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}>;

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <section
      role="alert"
      className="border-destructive/20 flex flex-col items-start gap-3 rounded-xl border bg-[#FEE2E2] px-4 py-4 text-sm text-[#991B1B]"
    >
      <h2 className="text-sm font-medium">{title}</h2>
      <p>{message}</p>
      {onRetry ? (
        <Button type="button" variant="outline" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </section>
  );
}
