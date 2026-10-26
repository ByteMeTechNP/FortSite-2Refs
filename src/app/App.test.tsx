import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/app/App';

describe('App', () => {
  it('renders without a missing-provider exception', async () => {
    expect(() => render(<App />)).not.toThrow();

    await waitFor(() => {
      expect(
        screen.getByRole('heading', {
          name: /FortSite — application foundation/i,
        }),
      ).toBeInTheDocument();
    });
  });
});
