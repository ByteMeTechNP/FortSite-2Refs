import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Button } from '@/components/ui/button';
import { AuthStatusView } from '@/features/auth/components/auth-status-view';
import { useAuth } from '@/features/auth/context/auth-context';
import { ProfileForm } from '@/features/profile/components/ProfileForm';

/**
 * Signed-in account shell. Shows Auth identity and self-service profile only.
 * Organization access is not provisioned in Phase 05.
 */
export function AccountPage() {
  const { user, signOut, lastError, clearError } = useAuth();

  async function handleSignOut() {
    clearError();
    await signOut();
  }

  return (
    <main className="bg-background mx-auto flex min-h-svh max-w-2xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
          Account
        </p>
        <h1 className="text-foreground text-3xl font-semibold">Your account</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Signed in as {user?.email ?? 'unknown email'}. Authentication is not
          company membership, a role, or platform authority.
        </p>
      </div>

      <AuthStatusView
        title="Account authenticated; organization access is not yet provisioned"
        description="Phase 06 creates company memberships. Until then, this account cannot open company data or role workspaces."
        variant="warning"
      />

      <section className="flex flex-col gap-4">
        <h2 className="text-foreground text-xl font-semibold">Profile</h2>
        <p className="text-muted-foreground text-sm">
          Profile fields are optional display details for this Auth user only.
          They are not a source of roles or tenant access.
        </p>
        {user ? <ProfileForm userId={user.id} /> : null}
      </section>

      {lastError ? (
        <p role="alert" className="text-destructive text-sm">
          {lastError}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            void handleSignOut();
          }}
        >
          Sign out
        </Button>
        <Button asChild variant="ghost">
          <Link to={ROUTE_PATHS.home}>Foundation home</Link>
        </Button>
      </div>
    </main>
  );
}
