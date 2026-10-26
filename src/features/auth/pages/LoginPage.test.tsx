import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { AuthProvider } from '@/features/auth/context/auth-context';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import {
  createMockAuthApi,
  sampleSession,
} from '@/features/auth/test/mock-auth-api';

describe('LoginPage', () => {
  it('validates email before calling Auth', async () => {
    const user = userEvent.setup();
    const authApi = createMockAuthApi(null);

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.authLogin]}>
        <AuthProvider authApi={authApi}>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    });

    await user.type(screen.getByLabelText('Email'), 'not-an-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Enter a valid email address.'),
    ).toBeInTheDocument();
    expect(authApi.signInWithPassword).not.toHaveBeenCalled();
  });

  it('disables submit while a request is in flight', async () => {
    const user = userEvent.setup();
    const authApi = createMockAuthApi(null);
    let resolveSignIn: ((value: { error: null }) => void) | undefined;
    authApi.signInWithPassword = vi.fn(
      () =>
        new Promise<{ error: null }>((resolve) => {
          resolveSignIn = resolve;
        }),
    );

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.authLogin]}>
        <AuthProvider authApi={authApi}>
          <Routes>
            <Route path={ROUTE_PATHS.authLogin} element={<LoginPage />} />
            <Route path={ROUTE_PATHS.account} element={<p>Account</p>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    });

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled();
    resolveSignIn?.({ error: null });
    authApi.emit(sampleSession);

    await waitFor(() => {
      expect(screen.getByText('Account')).toBeInTheDocument();
    });
  });

  it('shows a non-sensitive error for invalid credentials', async () => {
    const user = userEvent.setup();
    const authApi = createMockAuthApi(null);
    authApi.signInWithPassword = vi.fn(() =>
      Promise.resolve({
        error: {
          message: 'Invalid login credentials',
          code: 'invalid_credentials',
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={[ROUTE_PATHS.authLogin]}>
        <AuthProvider authApi={authApi}>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled();
    });

    await user.type(screen.getByLabelText('Email'), 'member@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong');
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(
      await screen.findByText('Email or password is incorrect.'),
    ).toBeInTheDocument();
  });
});
