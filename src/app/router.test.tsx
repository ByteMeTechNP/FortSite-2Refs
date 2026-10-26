import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/router';
import { renderWithRouter } from '@/test/test-utils';

describe('AppRouter', () => {
  it('resolves the root route to the foundation page', () => {
    renderWithRouter(<AppRouter />, { initialEntries: ['/'] });

    expect(
      screen.getByRole('heading', {
        name: /FortSite — application foundation/i,
      }),
    ).toBeInTheDocument();
  });

  it('shows the not-found page for an unknown path and returns home', async () => {
    const user = userEvent.setup();
    renderWithRouter(<AppRouter />, {
      initialEntries: ['/this-route-does-not-exist'],
    });

    expect(
      screen.getByRole('heading', { name: /Page not found/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('link', { name: /Back to home/i }));

    expect(
      screen.getByRole('heading', {
        name: /FortSite — application foundation/i,
      }),
    ).toBeInTheDocument();
  });
});
