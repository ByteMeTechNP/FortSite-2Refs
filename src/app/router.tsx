import {
  lazy,
  Suspense,
  type LazyExoticComponent,
  type ComponentType,
} from 'react';
import { Route, Routes } from 'react-router';

import { isDesignSystemGalleryEnabled } from '@/app/dev-routes';
import { ROUTE_PATHS } from '@/app/route-paths';
import { LoadingState } from '@/components/states/LoadingState';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { AcceptInvitationPage } from '@/features/auth/pages/AcceptInvitationPage';
import { AccountPage } from '@/features/auth/pages/AccountPage';
import { AuthCallbackPage } from '@/features/auth/pages/AuthCallbackPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { ResetPasswordPage } from '@/features/auth/pages/ResetPasswordPage';
import { PlatformOwnerGuard } from '@/features/platform/auth/platform-owner-guard';
import { PlatformUnauthorizedPage } from '@/features/platform/auth/PlatformUnauthorizedPage';
import { PlatformCompaniesPage } from '@/features/platform/companies/PlatformCompaniesPage';
import { PlatformLayout } from '@/features/platform/layout/PlatformLayout';
import { PlatformOverviewPage } from '@/features/platform/overview/PlatformOverviewPage';
import { FoundationPage } from '@/pages/FoundationPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

// Bound to import.meta.env.DEV so production builds dead-code-eliminate the gallery chunk.
const DesignSystemPage: LazyExoticComponent<ComponentType> | null = import.meta
  .env.DEV
  ? lazy(async () => {
      const module = await import('@/pages/DesignSystemPage');
      return { default: module.DesignSystemPage };
    })
  : null;

export function AppRouter() {
  const showDesignSystem =
    DesignSystemPage !== null && isDesignSystemGalleryEnabled();

  return (
    <Routes>
      <Route path={ROUTE_PATHS.home} element={<FoundationPage />} />
      <Route path={ROUTE_PATHS.authLogin} element={<LoginPage />} />
      <Route
        path={ROUTE_PATHS.authForgotPassword}
        element={<ForgotPasswordPage />}
      />
      <Route
        path={ROUTE_PATHS.authResetPassword}
        element={<ResetPasswordPage />}
      />
      <Route path={ROUTE_PATHS.authCallback} element={<AuthCallbackPage />} />
      <Route
        path={ROUTE_PATHS.authAcceptInvitation}
        element={<AcceptInvitationPage />}
      />
      <Route
        path={ROUTE_PATHS.account}
        element={
          <ProtectedRoute>
            <AccountPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTE_PATHS.platformUnauthorized}
        element={
          <ProtectedRoute>
            <PlatformUnauthorizedPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTE_PATHS.platform}
        element={
          <PlatformOwnerGuard>
            <PlatformLayout />
          </PlatformOwnerGuard>
        }
      >
        <Route index element={<PlatformOverviewPage />} />
        <Route path="companies" element={<PlatformCompaniesPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      {showDesignSystem && DesignSystemPage ? (
        <Route
          path={ROUTE_PATHS.designSystem}
          element={
            <Suspense fallback={<LoadingState message="Loading gallery…" />}>
              <DesignSystemPage />
            </Suspense>
          }
        />
      ) : null}
      <Route path={ROUTE_PATHS.notFound} element={<NotFoundPage />} />
    </Routes>
  );
}
