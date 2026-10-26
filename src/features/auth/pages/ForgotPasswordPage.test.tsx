import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { GENERIC_PASSWORD_RESET_SUCCESS } from '@/features/auth/lib/auth-errors';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { createMockAuthApi } from '@/features/auth/test/mock-auth-api';

describe('ForgotPasswordPage', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('blocks the request when the redirect origin is unset', async () => {
    const user = userEvent.setup();
    const authApi = createMockAuthApi(null);
    vi.stubEnv('VITE_AUTH_REDIRECT_ORIGIN', '');

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.authForgotPassword]}>
        <AuthProvider authApi={authApi}>
          <ForgotPasswordPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Send reset email' }),
      ).toBeEnabled();
    });

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset email' }));

    expect(
      await screen.findByText(/VITE_AUTH_REDIRECT_ORIGIN is not configured/),
    ).toBeInTheDocument();
    expect(authApi.resetPasswordForEmail).not.toHaveBeenCalled();
  });

  it('shows generic success copy when the origin matches', async () => {
    const user = userEvent.setup();
    const authApi = createMockAuthApi(null);
    vi.stubEnv('VITE_AUTH_REDIRECT_ORIGIN', 'http://localhost:5173');
    Object.defineProperty(window, 'location', {
      value: { ...window.location, origin: 'http://localhost:5173' },
      writable: true,
    });

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.authForgotPassword]}>
        <AuthProvider authApi={authApi}>
          <ForgotPasswordPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Send reset email' }),
      ).toBeEnabled();
    });

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.click(screen.getByRole('button', { name: 'Send reset email' }));

    expect(
      await screen.findByText(GENERIC_PASSWORD_RESET_SUCCESS),
    ).toBeInTheDocument();
    expect(authApi.resetPasswordForEmail).toHaveBeenCalledWith(
      'member@example.com',
      'http://localhost:5173/auth/callback',
    );
  });
});
