import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';

describe('generic states', () => {
  it('exposes loading status content', () => {
    render(<LoadingState message="Loading scaffold…" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading scaffold…');
  });

  it('exposes empty-state title and description', () => {
    render(
      <EmptyState
        title="Nothing here"
        description="There is no data to show yet."
      />,
    );

    expect(
      screen.getByRole('heading', { name: /Nothing here/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/There is no data to show yet\./i),
    ).toBeInTheDocument();
  });

  it('exposes error content and runs retry', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    render(
      <ErrorState
        message="A safe failure message for the user."
        onRetry={onRetry}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'A safe failure message for the user.',
    );

    await user.click(screen.getByRole('button', { name: /Try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
