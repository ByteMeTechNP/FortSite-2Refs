import { BrowserRouter } from 'react-router';

import { AppRouter } from '@/app/router';
import { AppErrorBoundary } from '@/components/states/AppErrorBoundary';

export function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AppErrorBoundary>
  );
}
