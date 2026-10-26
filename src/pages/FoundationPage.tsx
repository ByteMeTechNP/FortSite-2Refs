import { appEnv } from '@/config/env';

export function FoundationPage() {
  return (
    <main className="mx-auto flex min-h-svh max-w-2xl flex-col justify-center gap-4 px-6 py-12">
      <p className="text-sm font-medium tracking-wide text-neutral-500 uppercase">
        Development scaffold
      </p>
      <h1 className="text-3xl font-semibold text-neutral-900">
        {appEnv.appName} — application foundation
      </h1>
      <p className="text-base leading-relaxed text-neutral-700">
        This is the development scaffold. Product modules will be added in later
        phases.
      </p>
      <p className="text-sm text-neutral-500">
        Environment: {appEnv.appEnv}. Business features, authentication, and
        Supabase are not implemented in Phase 02.
      </p>
    </main>
  );
}
