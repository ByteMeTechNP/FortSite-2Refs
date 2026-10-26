import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

describe('Dialog', () => {
  it('opens with an accessible title and description', async () => {
    const user = userEvent.setup();

    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>Open dialog</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Sample dialog</DialogTitle>
          <DialogDescription>
            Demonstrative dialog content only.
          </DialogDescription>
        </DialogContent>
      </Dialog>,
    );

    await user.click(screen.getByRole('button', { name: 'Open dialog' }));

    expect(
      await screen.findByRole('dialog', { name: 'Sample dialog' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Demonstrative dialog content only.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
