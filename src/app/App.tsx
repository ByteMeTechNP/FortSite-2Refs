import { BrowserRouter } from 'react-router';

import { TooltipProvider } from '@/components/ui/tooltip';

import { AppRouter } from '@/app/router';
import { ConfigurationError } from '@/components/states/ConfigurationError';
import { AppErrorBoundary } from '@/components/states/AppErrorBoundary';
import {
  readBrowserSupabaseEnv,
  supabaseConfigErrorMessage,
  type EnvInput,
} from '@/config/env';
import { InitialPasswordGate } from '@/features/auth/components/initial-password-gate';
import { AuthProvider } from '@/features/auth/context/auth-context';
import type { AuthApi } from '@/features/auth/api/auth-api';

type AppProps = Readonly<{
  supabaseEnv?: EnvInput | undefined;
  authApi?: AuthApi | undefined;
}>;

export function App({ supabaseEnv, authApi }: AppProps = {}) {
  const configError = supabaseConfigErrorMessage(
    supabaseEnv ?? readBrowserSupabaseEnv(),
  );

  if (configError) {
    return <ConfigurationError message={configError} />;
  }

  return (
    <AppErrorBoundary>
      <TooltipProvider>
        <BrowserRouter>
          <AuthProvider authApi={authApi}>
            <InitialPasswordGate>
              <AppRouter />
            </InitialPasswordGate>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </AppErrorBoundary>
  );
}
