import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AuthProvider, useAuth } from '@/features/auth/context/auth-context';
import {
  createMockAuthApi,
  sampleSession,
} from '@/features/auth/test/mock-auth-api';

function StatusProbe() {
  const { status, user } = useAuth();
  return (
    <p>
      {status}:{user?.email ?? 'none'}
    </p>
  );
}

describe('AuthProvider', () => {
  it('starts initializing then becomes signed out', async () => {
    const authApi = createMockAuthApi(null);
    render(
      <AuthProvider authApi={authApi}>
        <StatusProbe />
      </AuthProvider>,
    );

    expect(screen.getByText(/initializing/)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('signedOut:none')).toBeInTheDocument();
    });
  });

  it('restores a signed-in session and unsubscribes on unmount', async () => {
    const authApi = createMockAuthApi(sampleSession);
    const { unmount } = render(
      <AuthProvider authApi={authApi}>
        <StatusProbe />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('signedIn:member@example.com'),
      ).toBeInTheDocument();
    });

    expect(authApi.listeners).toHaveLength(1);
    unmount();
    expect(authApi.listeners).toHaveLength(0);
  });
});
