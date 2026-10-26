import { useMemo } from 'react';

import { useAuth } from '@/features/auth/context/auth-context';
import { createBrowserOnboardingApi } from '@/features/platform/onboarding/api';
import { CompanyOnboardingWizard } from '@/features/platform/onboarding/CompanyOnboardingWizard';

export function CompanyOnboardingPage() {
  const { user } = useAuth();
  const api = useMemo(() => createBrowserOnboardingApi(), []);
  return <CompanyOnboardingWizard api={api} signedIn={Boolean(user)} />;
}
