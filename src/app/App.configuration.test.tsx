import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/app/App';

describe('App configuration gate', () => {
  it('explains a missing public variable without calling the network', () => {
    render(<App supabaseEnv={{}} />);

    expect(
      screen.getByRole('heading', { name: 'Browser configuration required' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'VITE_SUPABASE_URL is missing.',
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'VITE_SUPABASE_PUBLISHABLE_KEY is missing.',
    );
  });
});
