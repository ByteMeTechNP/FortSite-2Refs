import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { AuthProvider } from '@/features/auth/context/auth-context';
import {
  createMockAuthApi,
  sampleSession,
} from '@/features/auth/test/mock-auth-api';

function renderWithAuth(
  initialEntries: string[],
  session: typeof sampleSession | null,
) {
  const authApi = createMockAuthApi(session);
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider authApi={authApi}>
        <Routes>
          <Route path={ROUTE_PATHS.authLogin} element={<p>Login page</p>} />
          <Route
            path={ROUTE_PATHS.account}
            element={
              <ProtectedRoute>
                <p>Protected content</p>
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  it('does not render children while initializing', () => {
    const authApi = createMockAuthApi(null);
    authApi.getSession = async () =>
      new Promise(() => {
        // Never resolve — stay initializing.
      });

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.account]}>
        <AuthProvider authApi={authApi}>
          <ProtectedRoute>
            <p>Protected content</p>
          </ProtectedRoute>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Checking session…')).toBeInTheDocument();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects signed-out users to login', async () => {
    renderWithAuth([ROUTE_PATHS.account], null);

    await waitFor(() => {
      expect(screen.getByText('Login page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('renders children when signed in', async () => {
    renderWithAuth([ROUTE_PATHS.account], sampleSession);

    await waitFor(() => {
      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });
  });
});
