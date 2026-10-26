export const ROUTE_PATHS = {
  home: '/',
  designSystem: '/__dev/design-system',
  notFound: '*',
} as const;

export type RoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export type RouteName = keyof typeof ROUTE_PATHS;
