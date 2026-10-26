import { createClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createBrowserSupabaseClient } from '@/lib/supabase';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({ mocked: true })),
}));

describe('createBrowserSupabaseClient', () => {
  beforeEach(() => {
    vi.mocked(createClient).mockClear();
  });

  it('passes only the public URL and publishable key', () => {
    const client = createBrowserSupabaseClient({
      url: 'https://rvfoveqprrtobmywaodf.supabase.co',
      publishableKey: 'sb_publishable_example_key',
    });

    expect(client).toEqual({ mocked: true });
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      'https://rvfoveqprrtobmywaodf.supabase.co',
      'sb_publishable_example_key',
    );
  });
});
