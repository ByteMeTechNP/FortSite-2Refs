import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { App } from '@/app/App';

describe('App', () => {
  it('renders without a missing-provider exception', () => {
    expect(() => render(<App />)).not.toThrow();

    expect(
      screen.getByRole('heading', {
        name: /FortSite — application foundation/i,
      }),
    ).toBeInTheDocument();
  });
});
