type LoadingStateProps = Readonly<{
  message?: string;
}>;

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div
      role="status"
      className="flex items-center gap-2 text-sm text-neutral-700"
    >
      <span
        aria-hidden="true"
        className="inline-block size-3 rounded-full bg-neutral-400 motion-safe:animate-pulse"
      />
      <span>{message}</span>
    </div>
  );
}
