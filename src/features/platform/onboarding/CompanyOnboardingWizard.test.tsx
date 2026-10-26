import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import type { OnboardingApi } from '@/features/platform/onboarding/api';
import { CompanyOnboardingWizard } from '@/features/platform/onboarding/CompanyOnboardingWizard';

function renderWizard(api: OnboardingApi) {
  return render(
    <MemoryRouter>
      <CompanyOnboardingWizard api={api} />
    </MemoryRouter>,
  );
}

async function reachCountry(user: ReturnType<typeof userEvent.setup>) {
  await user.type(
    screen.getByLabelText('Legal name'),
    'Himalayan Works Pvt Ltd',
  );
  await user.click(screen.getByRole('button', { name: 'Continue' }));
}

describe('CompanyOnboardingWizard', () => {
  it('shows the locked Nepal currency and has no currency field', async () => {
    const user = userEvent.setup();
    const api = {
      beginCompanyOnboarding: vi.fn(),
      provisionFoundingAdmin: vi.fn(),
      resetFoundingAdminPassword: vi.fn(),
      getCompanyOnboarding: vi.fn(),
      transitionCompanyLifecycle: vi.fn(),
    };
    renderWizard(api);
    await reachCountry(user);
    expect(screen.queryByLabelText(/currency/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Nepal' }));
    expect(screen.getByText(/Locked currency NPR/)).toBeInTheDocument();
    expect(screen.getByText(/Asia\/Kathmandu/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'India' }));
    expect(screen.getByText(/Locked currency INR/)).toBeInTheDocument();
    expect(screen.getByText(/Asia\/Kolkata/)).toBeInTheDocument();
    expect(api.beginCompanyOnboarding).not.toHaveBeenCalled();
  });

  it('blocks submit until the administrator email is attested', async () => {
    const user = userEvent.setup();
    const api = {
      beginCompanyOnboarding: vi.fn(),
      provisionFoundingAdmin: vi.fn(),
      resetFoundingAdminPassword: vi.fn(),
      getCompanyOnboarding: vi.fn(),
      transitionCompanyLifecycle: vi.fn(),
    };
    renderWizard(api);
    await reachCountry(user);
    await user.click(screen.getByRole('radio', { name: 'Nepal' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(
      screen.getByLabelText('Founding administrator email'),
      'a@b.co',
    );
    await user.type(
      screen.getByLabelText('Founding administrator name'),
      'Asha Sharma',
    );
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    expect(
      screen.getByText(/Confirm the founding administrator email/),
    ).toBeInTheDocument();
    expect(api.beginCompanyOnboarding).not.toHaveBeenCalled();
  });

  it('shows a generic conflict and does not reveal a password', async () => {
    const user = userEvent.setup();
    const api: OnboardingApi = {
      beginCompanyOnboarding: vi.fn().mockResolvedValue({
        ok: true,
        result: {
          companyId: '11111111-1111-4111-8111-111111111111',
          provisioningId: '22222222-2222-4222-8222-222222222222',
          companyCode: 'FS-NEPAL001',
          registrationCountry: 'Nepal',
          defaultCurrency: 'NPR',
          timezone: 'Asia/Kathmandu',
          lifecycleStatus: 'pending_setup',
          reused: false,
        },
      }),
      provisionFoundingAdmin: vi.fn().mockResolvedValue({ status: 'conflict' }),
      resetFoundingAdminPassword: vi.fn(),
      getCompanyOnboarding: vi.fn(),
      transitionCompanyLifecycle: vi.fn(),
    };
    renderWizard(api);
    await reachCountry(user);
    await user.click(screen.getByRole('radio', { name: 'Nepal' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.type(
      screen.getByLabelText('Founding administrator email'),
      'taken@example.com',
    );
    await user.type(
      screen.getByLabelText('Founding administrator name'),
      'Asha Sharma',
    );
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Continue' }));
    await user.click(screen.getByRole('button', { name: 'Create company' }));
    expect(
      await screen.findByText(
        'This email cannot be used for a new founding administrator.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText('Temporary password'),
    ).not.toBeInTheDocument();
    expect(api.beginCompanyOnboarding).toHaveBeenCalledTimes(1);
  });
});
