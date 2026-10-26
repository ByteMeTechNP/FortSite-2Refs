import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  getCurrentPlatformAuthority,
  usePlatformAuthority,
} from '@/features/platform/authority';

const useAuthMock = vi.fn((): { status: string } => ({
  status: 'signedOut',
}));

vi.mock('@/features/auth/context/auth-context', () => ({
  useAuth: () =>
    useAuthMock() as { status: 'initializing' | 'signedOut' | 'signedIn' },
}));

vi.mock('@/lib/supabase', () => ({
  getBrowserSupabaseClient: () => ({
    rpc: vi.fn(),
  }),
}));

describe('getCurrentPlatformAuthority', () => {
  it('returns owner when the RPC is true', async () => {
    const result = await getCurrentPlatformAuthority({
      rpc: () => Promise.resolve({ data: true, error: null }),
    });
    expect(result).toBe('owner');
  });

  it('returns not_owner when the RPC is false', async () => {
    const result = await getCurrentPlatformAuthority({
      rpc: () => Promise.resolve({ data: false, error: null }),
    });
    expect(result).toBe('not_owner');
  });

  it('returns unavailable on RPC error', async () => {
    const result = await getCurrentPlatformAuthority({
      rpc: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
    });
    expect(result).toBe('unavailable');
  });

  it('returns unavailable when the payload is unexpected', async () => {
    const result = await getCurrentPlatformAuthority({
      rpc: () => Promise.resolve({ data: 'yes', error: null }),
    });
    expect(result).toBe('unavailable');
  });
});

describe('usePlatformAuthority', () => {
  beforeEach(() => {
    useAuthMock.mockReset();
  });

  it('clears to not_owner when signed out', async () => {
    useAuthMock.mockReturnValue({ status: 'signedOut' });
    const { result } = renderHook(() => usePlatformAuthority());
    await waitFor(() => {
      expect(result.current).toBe('not_owner');
    });
  });

  it('stays unavailable while Auth is initializing', () => {
    useAuthMock.mockReturnValue({ status: 'initializing' });
    const { result } = renderHook(() => usePlatformAuthority());
    expect(result.current).toBe('unavailable');
  });
});
