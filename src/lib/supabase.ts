import { createClient } from '@supabase/supabase-js';

import {
  parseSupabasePublicConfig,
  readBrowserSupabaseEnv,
  type PublicSupabaseConfig,
} from '@/config/env';

let browserClient: ReturnType<typeof createClient> | null = null;

/**
 * Build the single browser client from an already validated public config.
 * Callers must not pass a secret key or a database URL.
 */
export function createBrowserSupabaseClient(
  config: PublicSupabaseConfig,
): ReturnType<typeof createClient> {
  return createClient(config.url, config.publishableKey);
}

/** One shared browser client. Does not query tables or start an Auth flow. */
export function getBrowserSupabaseClient(): ReturnType<typeof createClient> {
  if (browserClient) {
    return browserClient;
  }

  const config = parseSupabasePublicConfig(readBrowserSupabaseEnv());
  browserClient = createBrowserSupabaseClient(config);
  return browserClient;
}
