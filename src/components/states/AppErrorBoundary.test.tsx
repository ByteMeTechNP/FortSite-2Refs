import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AppErrorBoundary } from '@/components/states/AppErrorBoundary';

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('deliberate test render failure');
  }

  return <p>Recovered content</p>;
}

describe('AppErrorBoundary', () => {
  it('shows a fallback for a throwing child and recovers on retry', async () => {
    const user = userEvent.setup();
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const { rerender } = render(
      <AppErrorBoundary>
        <Boom shouldThrow={true} />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByRole('heading', { name: /Application error/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/unexpected render error/i)).toBeInTheDocument();

    rerender(
      <AppErrorBoundary>
        <Boom shouldThrow={false} />
      </AppErrorBoundary>,
    );

    await user.click(screen.getByRole('button', { name: /Try again/i }));

    expect(screen.getByText(/Recovered content/i)).toBeInTheDocument();

    consoleError.mockRestore();
  });
});
