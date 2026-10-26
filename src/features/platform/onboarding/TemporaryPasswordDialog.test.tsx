import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { TemporaryPasswordDialog } from '@/features/platform/onboarding/TemporaryPasswordDialog';
import { useOneTimePassword } from '@/features/platform/onboarding/use-one-time-password';

function Harness({ withDialog }: { withDialog: boolean }) {
  const [signedIn, setSignedIn] = useState(true);
  const secret = useOneTimePassword(signedIn);
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          secret.reveal('Fs-one-time-secret');
        }}
      >
        Reveal
      </button>
      <button
        type="button"
        onClick={() => {
          setSignedIn(false);
        }}
      >
        Sign out
      </button>
      <p>{secret.password ?? 'cleared'}</p>
      {withDialog ? (
        <TemporaryPasswordDialog
          password={secret.password}
          onClear={() => {
            secret.clear();
          }}
        />
      ) : null}
    </div>
  );
}

describe('TemporaryPasswordDialog', () => {
  it('clears the password when the dialog closes', async () => {
    const user = userEvent.setup();
    render(<Harness withDialog />);
    await user.click(screen.getByRole('button', { name: 'Reveal' }));
    expect(screen.getByLabelText('Temporary password')).toHaveValue(
      'Fs-one-time-secret',
    );
    await user.click(screen.getByRole('button', { name: 'Done' }));
    expect(
      screen.queryByLabelText('Temporary password'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByDisplayValue('Fs-one-time-secret'),
    ).not.toBeInTheDocument();
  });

  it('clears the password on sign-out', async () => {
    const user = userEvent.setup();
    render(<Harness withDialog={false} />);
    await user.click(screen.getByRole('button', { name: 'Reveal' }));
    expect(screen.getByText('Fs-one-time-secret')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Sign out' }));
    expect(screen.getByText('cleared')).toBeInTheDocument();
    expect(screen.queryByText('Fs-one-time-secret')).not.toBeInTheDocument();
  });
});
