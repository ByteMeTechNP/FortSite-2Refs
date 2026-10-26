import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ProfileForm } from '@/features/profile/components/ProfileForm';

const maybeSingle = vi.fn();

vi.mock('@/lib/supabase', () => ({
  getBrowserSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle,
        }),
      }),
      upsert: () => ({
        select: () => ({
          single: vi.fn(),
        }),
      }),
    }),
  }),
}));

describe('ProfileForm', () => {
  beforeEach(() => {
    maybeSingle.mockReset();
  });

  it('fails closed when the profile table is missing', async () => {
    maybeSingle.mockResolvedValue({
      data: null,
      error: {
        message:
          'Could not find the table public.user_profiles in the schema cache',
      },
    });

    render(<ProfileForm userId="11111111-1111-1111-1111-111111111111" />);

    await waitFor(() => {
      expect(
        screen.getByText('Profile storage unavailable'),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Save profile' })).toBeDisabled();
  });
});
