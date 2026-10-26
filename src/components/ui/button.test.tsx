import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '@/components/ui/button';

describe('Button', () => {
  it('renders variants with accessible names', () => {
    render(
      <>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Destructive</Button>
      </>,
    );

    expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Secondary' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Outline' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Destructive' }),
    ).toBeInTheDocument();
  });

  it('exposes disabled and loading busy semantics', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    const { rerender } = render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>,
    );

    const disabledButton = screen.getByRole('button', { name: 'Disabled' });
    expect(disabledButton).toBeDisabled();
    await user.click(disabledButton);
    expect(onClick).not.toHaveBeenCalled();

    rerender(
      <Button loading onClick={onClick}>
        Saving
      </Button>,
    );

    const busyButton = screen.getByRole('button', { name: /Saving/i });
    expect(busyButton).toHaveAttribute('aria-busy', 'true');
    expect(busyButton).toBeDisabled();
    await user.click(busyButton);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('uses type=button by default', () => {
    render(<Button>Action</Button>);
    expect(screen.getByRole('button', { name: 'Action' })).toHaveAttribute(
      'type',
      'button',
    );
  });
});
