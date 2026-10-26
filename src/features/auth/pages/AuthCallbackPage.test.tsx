import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';
import {
  createMockAuthApi,
  sampleSession,
} from '@/features/auth/test/mock-auth-api';

const getSession = vi.fn();
const signOut = vi.fn(() => Promise.resolve({ error: null }));

vi.mock('@/lib/supabase', () => ({
  getBrowserSupabaseClient: () => ({
    auth: {
      getSession,
      signOut,
    },
  }),
}));

function renderCallback() {
  const authApi = createMockAuthApi(sampleSession);
  return render(
    <MemoryRouter initialEntries={[ROUTE_PATHS.authCallback]}>
      <AuthProvider authApi={authApi}>
        <Routes>
          <Route
            path={ROUTE_PATHS.authCallback}
            element={<AuthCallbackPage />}
          />
          <Route
            path={ROUTE_PATHS.authResetPassword}
            element={<p>Reset password page</p>}
          />
          <Route path={ROUTE_PATHS.account} element={<p>Account page</p>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    getSession.mockReset();
    signOut.mockClear();
    window.history.replaceState({}, '', ROUTE_PATHS.authCallback);
  });

  it('signs out and refuses invite links', async () => {
    window.history.replaceState(
      {},
      '',
      `${ROUTE_PATHS.authCallback}#access_token=secret&type=invite`,
    );
    renderCallback();

    expect(
      await screen.findByText(/invitations and public sign-up links/i),
    ).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
    expect(screen.queryByText('Account page')).not.toBeInTheDocument();
    expect(window.location.hash).toBe('');
  });

  it('signs out and refuses signup links', async () => {
    window.history.replaceState(
      {},
      '',
      `${ROUTE_PATHS.authCallback}?type=signup`,
    );
    renderCallback();

    expect(
      await screen.findByText(/invitations and public sign-up links/i),
    ).toBeInTheDocument();
    expect(signOut).toHaveBeenCalled();
  });

  it('still sends a recovery session to the reset page', async () => {
    window.history.replaceState(
      {},
      '',
      `${ROUTE_PATHS.authCallback}#type=recovery`,
    );
    getSession.mockResolvedValue({
      data: { session: { user: { id: '1', email: 'a@example.com' } } },
      error: null,
    });
    renderCallback();

    await waitFor(() => {
      expect(screen.getByText('Reset password page')).toBeInTheDocument();
    });
    expect(signOut).not.toHaveBeenCalled();
  });
});
