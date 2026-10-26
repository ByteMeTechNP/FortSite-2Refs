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
    <section role="alert" className="flex flex-col gap-3 text-neutral-800">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-sm leading-relaxed text-neutral-600">{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="w-fit rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-900 hover:bg-neutral-50"
        >
          {retryLabel}
        </button>
      ) : null}
    </section>
  );
}
