type ConfigurationErrorProps = Readonly<{
  message: string;
}>;

/**
 * Shown when public browser configuration is missing or invalid.
 * This is not a network or API outage. The message must not include values.
 */
export function ConfigurationError({ message }: ConfigurationErrorProps) {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6 py-12">
      <p className="text-foreground-secondary text-sm font-medium tracking-wide uppercase">
        Configuration
      </p>
      <h1 className="text-foreground text-3xl font-semibold">
        Browser configuration required
      </h1>
      <p role="alert" className="text-foreground text-base leading-relaxed">
        {message}
      </p>
      <p className="text-foreground-secondary text-sm leading-relaxed">
        Set the named variables in a local environment file and restart the dev
        server. This screen does not mean the Supabase API is down, and it does
        not retry the network.
      </p>
    </main>
  );
}
