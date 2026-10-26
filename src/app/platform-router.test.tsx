import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppRouter } from '@/app/router';
import { AuthProvider } from '@/features/auth/context/auth-context';
import {
  createMockAuthApi,
  sampleSession,
} from '@/features/auth/test/mock-auth-api';

const usePlatformAuthorityMock = vi.fn(
  (): 'owner' | 'not_owner' | 'unavailable' => 'owner',
);

vi.mock('@/features/platform/authority', () => ({
  usePlatformAuthority: () => usePlatformAuthorityMock(),
  getCurrentPlatformAuthority: vi.fn(),
}));

vi.mock('@/features/platform/data/use-platform-overview', () => ({
  usePlatformOverview: () => ({
    state: {
      status: 'empty',
      data: {
        counts: {
          pending_setup: 0,
          active: 0,
          suspended: 0,
          archived: 0,
          total: 0,
        },
        companies: [],
      },
    },
    refresh: vi.fn(),
  }),
}));

describe('platform routes', () => {
  beforeEach(() => {
    usePlatformAuthorityMock.mockReset();
    usePlatformAuthorityMock.mockReturnValue('owner');
  });

  it('renders not-found inside the owner guard for unknown platform paths', async () => {
    const authApi = createMockAuthApi(sampleSession);
    render(
      <MemoryRouter initialEntries={['/platform/does-not-exist']}>
        <AuthProvider authApi={authApi}>
          <AppRouter />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Page not found')).toBeInTheDocument();
    });
    expect(screen.getByText('Platform Administration')).toBeInTheDocument();
    expect(screen.queryByText('Company directory')).not.toBeInTheDocument();
  });
});
