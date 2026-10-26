type LoadingStateProps = Readonly<{
  message?: string;
}>;

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div
      role="status"
      className="text-muted-foreground flex items-center gap-2 text-sm"
    >
      <span
        aria-hidden="true"
        className="bg-muted-foreground/40 inline-block size-3 rounded-full motion-safe:animate-pulse"
      />
      <span>{message}</span>
    </div>
  );
}
