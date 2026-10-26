import { describe, expect, it } from 'vitest';

import {
  parseSupabasePublicConfig,
  supabaseConfigErrorMessage,
  SupabaseConfigError,
} from '@/config/env';

const CLOUD_URL = 'https://rvfoveqprrtobmywaodf.supabase.co';
const PUBLISHABLE = 'sb_publishable_example_key';

function serviceRoleKey(): string {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  const payload = btoa(JSON.stringify({ role: 'service' + '_role' }))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
  return `${header}.${payload}.signature`;
}

describe('parseSupabasePublicConfig', () => {
  it('rejects a missing URL', () => {
    expect(() =>
      parseSupabasePublicConfig({
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      }),
    ).toThrow(SupabaseConfigError);
    expect(
      supabaseConfigErrorMessage({
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      }),
    ).toContain('VITE_SUPABASE_URL is missing.');
  });

  it('rejects a malformed URL without echoing the value', () => {
    const supplied = 'not a url';
    expect(() =>
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: supplied,
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      }),
    ).toThrow(/VITE_SUPABASE_URL must be an http or https URL/);
    try {
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: supplied,
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      });
    } catch (error) {
      expect(error).toBeInstanceOf(SupabaseConfigError);
      expect((error as Error).message).not.toContain(supplied);
    }
  });

  it('rejects non-local http without echoing the value', () => {
    const supplied = 'http://example.com/hidden-path';
    let message = '';
    try {
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: supplied,
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain(
      'VITE_SUPABASE_URL may use http only for localhost',
    );
    expect(message).not.toContain('example.com');
    expect(message).not.toContain('hidden-path');
  });

  it('rejects a missing publishable key', () => {
    expect(
      supabaseConfigErrorMessage({
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
      }),
    ).toContain('VITE_SUPABASE_PUBLISHABLE_KEY is missing.');
  });

  it('accepts a local http URL and publishable key', () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: 'http://127.0.0.1:54321',
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      }),
    ).toEqual({
      url: 'http://127.0.0.1:54321',
      publishableKey: PUBLISHABLE,
    });
  });

  it('accepts the Cloud HTTPS URL without a network call', () => {
    expect(
      parseSupabasePublicConfig({
        VITE_SUPABASE_URL: CLOUD_URL,
        VITE_SUPABASE_PUBLISHABLE_KEY: PUBLISHABLE,
      }).url,
    ).toBe(CLOUD_URL);
  });

  it('rejects a secret-prefixed key and a service-role JWT without echoing them', () => {
    const secretPrefixed = 'sb_' + 'secret_' + 'example';
    const serviceJwt = serviceRoleKey();

    for (const supplied of [secretPrefixed, serviceJwt]) {
      let message = '';
      try {
        parseSupabasePublicConfig({
          VITE_SUPABASE_URL: CLOUD_URL,
          VITE_SUPABASE_PUBLISHABLE_KEY: supplied,
        });
      } catch (error) {
        message = (error as Error).message;
      }
      expect(message).toContain(
        'VITE_SUPABASE_PUBLISHABLE_KEY must be a publishable key',
      );
      expect(message).not.toContain(supplied);
    }
  });
});
