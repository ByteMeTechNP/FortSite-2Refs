import { describe, expect, it } from 'vitest';

import { parseAppEnv } from '@/config/env';

describe('parseAppEnv', () => {
  it('returns defaults when values are unset', () => {
    expect(parseAppEnv({})).toEqual({
      appName: 'FortSite',
      appEnv: 'development',
    });
  });

  it('returns defaults when values are blank', () => {
    expect(
      parseAppEnv({
        VITE_APP_NAME: '   ',
        VITE_APP_ENV: '',
      }),
    ).toEqual({
      appName: 'FortSite',
      appEnv: 'development',
    });
  });

  it('accepts valid explicit values', () => {
    expect(
      parseAppEnv({
        VITE_APP_NAME: ' FortSite Local ',
        VITE_APP_ENV: 'test',
      }),
    ).toEqual({
      appName: 'FortSite Local',
      appEnv: 'test',
    });
  });

  it('rejects an explicit invalid environment value', () => {
    expect(() =>
      parseAppEnv({
        VITE_APP_ENV: 'staging',
      }),
    ).toThrow(/Invalid VITE_APP_ENV "staging"/);
  });
});
