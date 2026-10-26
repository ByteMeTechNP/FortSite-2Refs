import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { AcceptInvitationPage } from '@/features/auth/pages/AcceptInvitationPage';
import { createMockAuthApi } from '@/features/auth/test/mock-auth-api';

const getSession = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getBrowserSupabaseClient: () => ({
    auth: {
      getSession,
    },
  }),
}));

describe('AcceptInvitationPage', () => {
  beforeEach(() => {
    getSession.mockReset();
  });

  it('shows a recovery message when the invitation session is missing', async () => {
    getSession.mockResolvedValue({ data: { session: null }, error: null });
    const authApi = createMockAuthApi(null);

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.authAcceptInvitation]}>
        <AuthProvider authApi={authApi}>
          <AcceptInvitationPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Expired or invalid invitation'),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute(
      'href',
      ROUTE_PATHS.authLogin,
    );
  });
});
