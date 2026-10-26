export const ROUTE_PATHS = {
  home: '/',
  designSystem: '/__dev/design-system',
  authLogin: '/auth/login',
  authForgotPassword: '/auth/forgot-password',
  authResetPassword: '/auth/reset-password',
  authCallback: '/auth/callback',
  authAcceptInvitation: '/auth/accept-invitation',
  authChangeInitialPassword: '/auth/change-initial-password',
  account: '/account',
  platform: '/platform',
  platformCompanies: '/platform/companies',
  platformCompanyNew: '/platform/companies/new',
  platformPlans: '/platform/plans',
  platformSubscriptions: '/platform/subscriptions',
  platformUnauthorized: '/platform/unauthorized',
  notFound: '*',
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export type RouteName = keyof typeof ROUTE_PATHS;

export function platformCompanyPath(companyId: string): string {
  return `/platform/companies/${companyId}`;
}

export function platformPlanPath(planId: string): string {
  return `/platform/plans/${planId}`;
}

export function platformSubscriptionPath(subscriptionId: string): string {
  return `/platform/subscriptions/${subscriptionId}`;
}
