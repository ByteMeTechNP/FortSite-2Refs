import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { InitialPasswordGate } from '@/features/auth/components/initial-password-gate';
import { AuthProvider } from '@/features/auth/context/auth-context';
import {
  createMockAuthApi,
  sampleSession,
} from '@/features/auth/test/mock-auth-api';
import type { PasswordChangeView } from '@/features/auth/data/use-password-change-required';

const usePasswordChangeRequiredMock = vi.fn((): PasswordChangeView => 'clear');

vi.mock('@/features/auth/data/use-password-change-required', () => ({
  usePasswordChangeRequired: () => usePasswordChangeRequiredMock(),
}));

function renderGate(path: string) {
  const authApi = createMockAuthApi(sampleSession);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider authApi={authApi}>
        <InitialPasswordGate>
          <Routes>
            <Route
              path={ROUTE_PATHS.platform}
              element={<p>Platform shell</p>}
            />
            <Route
              path={ROUTE_PATHS.authChangeInitialPassword}
              element={<p>Change initial password</p>}
            />
            <Route
              path={ROUTE_PATHS.authForgotPassword}
              element={<p>Forgot password</p>}
            />
          </Routes>
        </InitialPasswordGate>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('InitialPasswordGate', () => {
  beforeEach(() => {
    usePasswordChangeRequiredMock.mockReset();
    usePasswordChangeRequiredMock.mockReturnValue('clear');
  });

  it('hides platform content while a password change is required', async () => {
    usePasswordChangeRequiredMock.mockReturnValue('required');
    renderGate(ROUTE_PATHS.platform);

    await waitFor(() => {
      expect(screen.getByText('Change initial password')).toBeInTheDocument();
    });
    expect(screen.queryByText('Platform shell')).not.toBeInTheDocument();
  });

  it('leaves the platform shell in place when no change is required', async () => {
    renderGate(ROUTE_PATHS.platform);
    await waitFor(() => {
      expect(screen.getByText('Platform shell')).toBeInTheDocument();
    });
  });

  it('keeps password recovery reachable while a change is required', async () => {
    usePasswordChangeRequiredMock.mockReturnValue('required');
    renderGate(ROUTE_PATHS.authForgotPassword);
    await waitFor(() => {
      expect(screen.getByText('Forgot password')).toBeInTheDocument();
    });
  });

  it('fails closed when the security check is unavailable', async () => {
    usePasswordChangeRequiredMock.mockReturnValue('unavailable');
    renderGate(ROUTE_PATHS.platform);
    await waitFor(() => {
      expect(
        screen.getByText('Account security check unavailable'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Platform shell')).not.toBeInTheDocument();
  });
});
