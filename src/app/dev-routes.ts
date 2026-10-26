/**
 * Development-only route helpers.
 * Production builds must keep the design-system gallery unregistered.
 */
export function isDesignSystemGalleryEnabled(
  isDev: boolean = import.meta.env.DEV,
): boolean {
  return isDev;
}
