import { BrowserRouter } from 'react-router';

import { AppRouter } from '@/app/router';
import { ConfigurationError } from '@/components/states/ConfigurationError';
import { AppErrorBoundary } from '@/components/states/AppErrorBoundary';
import {
  readBrowserSupabaseEnv,
  supabaseConfigErrorMessage,
  type EnvInput,
} from '@/config/env';

type AppProps = Readonly<{
  supabaseEnv?: EnvInput;
}>;

export function App({ supabaseEnv }: AppProps = {}) {
  const configError = supabaseConfigErrorMessage(
    supabaseEnv ?? readBrowserSupabaseEnv(),
  );

  if (configError) {
    return <ConfigurationError message={configError} />;
  }

  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
