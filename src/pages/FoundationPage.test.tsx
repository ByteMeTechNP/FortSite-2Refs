import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { FoundationPage } from '@/pages/FoundationPage';

describe('FoundationPage', () => {
  it('renders the development scaffold message', () => {
    render(
      <MemoryRouter>
        <FoundationPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', {
        name: /FortSite — application foundation/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This is the development scaffold\. Product modules will be added in later phases\./i,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Development scaffold', { exact: true }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Sign in' })).toBeInTheDocument();
  });
});
