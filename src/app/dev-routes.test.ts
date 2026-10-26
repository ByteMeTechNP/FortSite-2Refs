import { describe, expect, it } from 'vitest';

import { isDesignSystemGalleryEnabled } from '@/app/dev-routes';

describe('isDesignSystemGalleryEnabled', () => {
  it('is enabled in development', () => {
    expect(isDesignSystemGalleryEnabled(true)).toBe(true);
  });

  it('is disabled outside development', () => {
    expect(isDesignSystemGalleryEnabled(false)).toBe(false);
  });
});
