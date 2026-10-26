import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppRouter } from '@/app/router';
import { ROUTE_PATHS } from '@/app/route-paths';
import { renderWithRouter } from '@/test/test-utils';

describe('DesignSystemPage route', () => {
  it('renders the development gallery in DEV routing', async () => {
    renderWithRouter(<AppRouter />, {
      initialEntries: [ROUTE_PATHS.designSystem],
    });

    expect(
      await screen.findByRole('heading', {
        name: /FortSite Design System — Development Preview/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Examples are illustrative; nothing here is saved or connected to production data\./i,
      ),
    ).toBeInTheDocument();
  });

  it('keeps unknown routes on the not-found page', () => {
    renderWithRouter(<AppRouter />, {
      initialEntries: ['/not-a-real-route'],
    });

    expect(
      screen.getByRole('heading', { name: /Page not found/i }),
    ).toBeInTheDocument();
  });
});
