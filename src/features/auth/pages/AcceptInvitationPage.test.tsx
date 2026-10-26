import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { AcceptInvitationPage } from '@/features/auth/pages/AcceptInvitationPage';

const signOut = vi.fn(() => Promise.resolve({ error: null }));

vi.mock('@/lib/supabase', () => ({
  getBrowserSupabaseClient: () => ({
    auth: {
      signOut,
    },
  }),
}));

describe('AcceptInvitationPage', () => {
  it('shows the retired message and does not offer a password form', () => {
    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.authAcceptInvitation]}>
        <AcceptInvitationPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByText('This invitation link is not accepted'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to sign in' })).toHaveAttribute(
      'href',
      ROUTE_PATHS.authLogin,
    );
  });
});
