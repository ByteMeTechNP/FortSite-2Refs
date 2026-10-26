import { useEffect } from 'react';
import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Button } from '@/components/ui/button';
import { AuthPageShell } from '@/features/auth/components/auth-page-shell';
import { AuthStatusView } from '@/features/auth/components/auth-status-view';
import { getBrowserSupabaseClient } from '@/lib/supabase';

/**
 * Retired invitation route. Does not exchange a token, set a password,
 * or create a membership. Any Auth hash on this URL is discarded.
 */
export function AcceptInvitationPage() {
  useEffect(() => {
    const hash = window.location.hash.toLowerCase();
    const search = window.location.search.toLowerCase();
    const carriedCredential =
      hash.includes('access_token') ||
      hash.includes('type=') ||
      search.includes('type=') ||
      search.includes('token');

    window.history.replaceState(
      {},
      document.title,
      ROUTE_PATHS.authAcceptInvitation,
    );

    if (carriedCredential) {
      void getBrowserSupabaseClient()
        .auth.signOut()
        .catch(() => {
          // The retired page still must not keep an invite session.
        });
    }
  }, []);

  return (
    <AuthPageShell
      title="Invitations retired"
      description="FortSite no longer creates accounts from invitation links."
    >
      <AuthStatusView
        title="This invitation link is not accepted"
        description="Accounts are created by an authorized administrator with an email and an initial password. This page does not create an account, set a password, or grant company access."
        variant="warning"
      >
        <Button asChild>
          <Link to={ROUTE_PATHS.authLogin}>Go to sign in</Link>
        </Button>
      </AuthStatusView>
    </AuthPageShell>
  );
}
