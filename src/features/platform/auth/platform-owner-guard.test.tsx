import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { AuthProvider } from '@/features/auth/context/auth-context';
import {
  createMockAuthApi,
  sampleSession,
} from '@/features/auth/test/mock-auth-api';
import { PlatformOwnerGuard } from '@/features/platform/auth/platform-owner-guard';
import { PlatformUnauthorizedPage } from '@/features/platform/auth/PlatformUnauthorizedPage';

const usePlatformAuthorityMock = vi.fn(
  (): 'owner' | 'not_owner' | 'unavailable' => 'unavailable',
);

vi.mock('@/features/platform/authority', () => ({
  usePlatformAuthority: () => usePlatformAuthorityMock(),
}));

function renderGuard(
  session: typeof sampleSession | null,
  authority: 'owner' | 'not_owner' | 'unavailable' = 'owner',
  path: string = ROUTE_PATHS.platform,
) {
  usePlatformAuthorityMock.mockReturnValue(authority);
  const authApi = createMockAuthApi(session);
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider authApi={authApi}>
        <Routes>
          <Route path={ROUTE_PATHS.authLogin} element={<p>Login page</p>} />
          <Route
            path={ROUTE_PATHS.platformUnauthorized}
            element={<PlatformUnauthorizedPage />}
          />
          <Route
            path={ROUTE_PATHS.platform}
            element={
              <PlatformOwnerGuard>
                <p>Owner shell</p>
              </PlatformOwnerGuard>
            }
          />
          <Route
            path={`${ROUTE_PATHS.platform}/mystery`}
            element={
              <PlatformOwnerGuard>
                <p>Mystery platform page</p>
              </PlatformOwnerGuard>
            }
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('PlatformOwnerGuard', () => {
  beforeEach(() => {
    usePlatformAuthorityMock.mockReset();
  });

  it('hides privileged content while Auth is initializing', () => {
    usePlatformAuthorityMock.mockReturnValue('unavailable');
    const authApi = createMockAuthApi(null);
    authApi.getSession = async () =>
      new Promise(() => {
        // Stay initializing.
      });

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.platform]}>
        <AuthProvider authApi={authApi}>
          <PlatformOwnerGuard>
            <p>Owner shell</p>
          </PlatformOwnerGuard>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Checking session…')).toBeInTheDocument();
    expect(screen.queryByText('Owner shell')).not.toBeInTheDocument();
  });

  it('sends signed-out users to login', async () => {
    renderGuard(null, 'not_owner');
    await waitFor(() => {
      expect(screen.getByText('Login page')).toBeInTheDocument();
    });
    expect(screen.queryByText('Owner shell')).not.toBeInTheDocument();
  });

  it('denies signed-in non-owners without shell data', async () => {
    renderGuard(sampleSession, 'not_owner');
    await waitFor(() => {
      expect(screen.getByText('Platform access denied')).toBeInTheDocument();
    });
    expect(screen.queryByText('Owner shell')).not.toBeInTheDocument();
  });

  it('fails closed when authority is unavailable', async () => {
    renderGuard(sampleSession, 'unavailable');
    await waitFor(() => {
      expect(
        screen.getByText('Platform authorization unavailable'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText('Owner shell')).not.toBeInTheDocument();
  });

  it('renders children only for confirmed owners', async () => {
    renderGuard(sampleSession, 'owner');
    await waitFor(() => {
      expect(screen.getByText('Owner shell')).toBeInTheDocument();
    });
  });
});
