import { Route, Routes } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { FoundationPage } from '@/pages/FoundationPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

export function AppRouter() {
  return (
    <Routes>
      <Route path={ROUTE_PATHS.home} element={<FoundationPage />} />
      <Route path={ROUTE_PATHS.notFound} element={<NotFoundPage />} />
    </Routes>
  );
}
