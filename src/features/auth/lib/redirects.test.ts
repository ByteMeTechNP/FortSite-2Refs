import { describe, expect, it } from 'vitest';

import {
  authRedirectOriginMissingMessage,
  buildAuthEmailRedirectUrl,
  resolveInternalReturnPath,
} from '@/features/auth/lib/redirects';

describe('resolveInternalReturnPath', () => {
  it('accepts known internal paths', () => {
    expect(resolveInternalReturnPath('/account')).toBe('/account');
    expect(resolveInternalReturnPath('/auth/login')).toBe('/auth/login');
    expect(resolveInternalReturnPath('/platform')).toBe('/platform');
    expect(resolveInternalReturnPath('/platform/companies')).toBe(
      '/platform/companies',
    );
  });

  it('rejects open redirects and unknown paths', () => {
    expect(resolveInternalReturnPath('https://evil.example')).toBe('/account');
    expect(resolveInternalReturnPath('//evil.example')).toBe('/account');
    expect(resolveInternalReturnPath('/company/secret')).toBe('/account');
    expect(resolveInternalReturnPath('/auth/accept-invitation')).toBe(
      '/account',
    );
    expect(resolveInternalReturnPath('\\evil')).toBe('/account');
  });
});

describe('buildAuthEmailRedirectUrl', () => {
  it('returns null when the origin is unset', () => {
    expect(buildAuthEmailRedirectUrl({}, 'http://127.0.0.1:5173')).toBeNull();
  });

  it('returns the callback URL when origins match', () => {
    expect(
      buildAuthEmailRedirectUrl(
        { VITE_AUTH_REDIRECT_ORIGIN: 'https://app.example.com' },
        'https://app.example.com',
      ),
    ).toBe('https://app.example.com/auth/callback');
  });

  it('returns null when origins differ', () => {
    expect(
      buildAuthEmailRedirectUrl(
        { VITE_AUTH_REDIRECT_ORIGIN: 'https://app.example.com' },
        'http://127.0.0.1:5173',
      ),
    ).toBeNull();
  });

  it('names the missing origin without a secret value', () => {
    expect(authRedirectOriginMissingMessage()).toContain(
      'VITE_AUTH_REDIRECT_ORIGIN',
    );
  });
});
