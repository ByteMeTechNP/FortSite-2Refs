import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { LoadingState } from '@/components/states/LoadingState';
import { Button } from '@/components/ui/button';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { AuthStatusView } from '@/features/auth/components/auth-status-view';
import { useAuth } from '@/features/auth/context/auth-context';
import { toAuthUserMessage } from '@/features/auth/lib/auth-errors';
import { getBrowserSupabaseClient } from '@/lib/supabase';

/**
 * Processes Auth email redirects. Relies on the Supabase client session
 * handling for the installed version. Does not parse tokens manually.
 */
export function AuthCallbackPage() {
  const { status } = useAuth();
  const navigate = useNavigate();
  const processedRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (processedRef.current) {
      return;
    }
    processedRef.current = true;

    let cancelled = false;

    void (async () => {
      try {
        const hash = window.location.hash.toLowerCase();
        const search = window.location.search.toLowerCase();
        const isRecovery =
          hash.includes('type=recovery') || search.includes('type=recovery');

        const client = getBrowserSupabaseClient();
        const { data, error: sessionError } = await client.auth.getSession();

        if (cancelled) {
          return;
        }

        // Strip sensitive hash/query material without logging the URL.
        window.history.replaceState(
          {},
          document.title,
          ROUTE_PATHS.authCallback,
        );

        if (sessionError) {
          setError(
            toAuthUserMessage(
              sessionError,
              'This Auth link could not be completed.',
            ),
          );
          return;
        }

        if (!data.session) {
          setError(
            'This Auth link is invalid, expired, or has already been used.',
          );
          return;
        }

        void navigate(
          isRecovery ? ROUTE_PATHS.authResetPassword : ROUTE_PATHS.account,
          { replace: true },
        );
      } catch {
        if (!cancelled) {
          setError('This Auth link could not be completed.');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (status === 'signedIn' && !error) {
      // Session restored through the provider while this page was waiting.
    }
  }, [status, error]);

  if (error) {
    return (
      <AuthPageShell
        title="Auth link problem"
        description="The confirmation or recovery link did not complete."
      >
        <AuthStatusView
          title="Unable to continue"
          description={error}
          variant="danger"
        >
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link to={ROUTE_PATHS.authForgotPassword}>
                Request a new email
              </Link>
            </Button>
            <Button asChild>
              <Link to={ROUTE_PATHS.authLogin}>Sign in</Link>
            </Button>
          </div>
        </AuthStatusView>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell
      title="Completing sign-in"
      description="Finishing the Auth redirect. This page does not display tokens."
    >
      <LoadingState message="Processing Auth callback…" />
    </AuthPageShell>
  );
}
