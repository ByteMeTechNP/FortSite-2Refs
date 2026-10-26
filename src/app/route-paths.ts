export const ROUTE_PATHS = {
  home: '/',
  designSystem: '/__dev/design-system',
  authLogin: '/auth/login',
  authForgotPassword: '/auth/forgot-password',
  authResetPassword: '/auth/reset-password',
  authCallback: '/auth/callback',
  authAcceptInvitation: '/auth/accept-invitation',
  account: '/account',
  notFound: '*',
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export type RouteName = keyof typeof ROUTE_PATHS;
