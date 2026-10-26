import { appEnv } from '@/config/env';

export function FoundationPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6 py-12">
      <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Development scaffold
      </p>
      <h1 className="text-foreground text-3xl font-semibold">
        {appEnv.appName} — application foundation
      </h1>
      <p className="text-muted-foreground text-base leading-relaxed">
        This is the development scaffold. Product modules will be added in later
        phases.
      </p>
      <p className="text-muted-foreground text-sm">
        Environment: {appEnv.appEnv}. Business features, authentication, and
        Supabase are not implemented in Phase 02.
      </p>
    </main>
  );
}
