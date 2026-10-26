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
