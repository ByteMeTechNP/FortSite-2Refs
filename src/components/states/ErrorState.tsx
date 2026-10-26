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
    <section role="alert" className="text-foreground flex flex-col gap-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-muted-foreground text-sm leading-relaxed">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="border-input bg-card text-foreground hover:bg-muted focus-visible:outline-ring h-11 w-fit rounded-full border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
