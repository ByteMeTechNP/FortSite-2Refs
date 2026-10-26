import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CompanyLifecycleActions } from '@/features/platform/onboarding/CompanyLifecycleActions';

describe('CompanyLifecycleActions', () => {
  it('does not offer pause from pending setup', () => {
    render(
      <CompanyLifecycleActions status="pending_setup" onTransition={vi.fn()} />,
    );
    expect(
      screen.getByRole('option', { name: 'Activate' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Archive' })).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: 'Pause' }),
    ).not.toBeInTheDocument();
  });

  it('requires the operator to type ARCHIVE', async () => {
    const user = userEvent.setup();
    const onTransition = vi.fn().mockResolvedValue(undefined);
    render(
      <CompanyLifecycleActions status="active" onTransition={onTransition} />,
    );
    await user.selectOptions(screen.getByLabelText('Next status'), 'archived');
    await user.type(screen.getByLabelText('Reason'), 'Close the tenant');
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled();
    await user.type(
      screen.getByLabelText('Type ARCHIVE to confirm'),
      'ARCHIVE',
    );
    await user.click(screen.getByRole('button', { name: 'Archive' }));
    expect(onTransition).toHaveBeenCalledWith('archived', 'Close the tenant');
  });
});
