import { describe, expect, it, vi } from 'vitest';

import {
  loadPlatformCompanyOverview,
  parsePlatformCompanyOverview,
} from '@/features/platform/data/platform-overview';
import { countsReconcile } from '@/features/platform/types';

const sampleOverview = {
  counts: {
    pending_setup: 1,
    active: 1,
    suspended: 0,
    archived: 0,
    total: 2,
  },
  companies: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      company_code: 'FS-AAAAAAAA',
      legal_name: 'Alpha Builders Pvt Ltd',
      display_name: 'Alpha',
      registration_country: 'Nepal',
      lifecycle_status: 'pending_setup',
      created_at: '2026-10-26T12:00:00.000Z',
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      company_code: 'FS-BBBBBBBB',
      legal_name: 'Beta Construction Ltd',
      display_name: null,
      registration_country: 'India',
      lifecycle_status: 'active',
      created_at: '2026-10-26T11:00:00.000Z',
    },
  ],
};

describe('countsReconcile', () => {
  it('requires status counts to sum to total', () => {
    expect(countsReconcile(sampleOverview.counts)).toBe(true);
    expect(
      countsReconcile({
        pending_setup: 1,
        active: 0,
        suspended: 0,
        archived: 0,
        total: 2,
      }),
    ).toBe(false);
  });
});

describe('parsePlatformCompanyOverview', () => {
  it('accepts the documented field set', () => {
    expect(parsePlatformCompanyOverview(sampleOverview)).toEqual(
      sampleOverview,
    );
  });

  it('rejects mismatched totals and company row counts', () => {
    expect(
      parsePlatformCompanyOverview({
        ...sampleOverview,
        counts: { ...sampleOverview.counts, total: 3 },
      }),
    ).toBeNull();
  });

  it('rejects unexpected company fields that break the contract', () => {
    expect(
      parsePlatformCompanyOverview({
        counts: sampleOverview.counts,
        companies: [
          {
            ...sampleOverview.companies[0],
            lifecycle_status: 'mystery',
          },
        ],
      }),
    ).toBeNull();
  });

  it('parses a zero-company overview', () => {
    const empty = {
      counts: {
        pending_setup: 0,
        active: 0,
        suspended: 0,
        archived: 0,
        total: 0,
      },
      companies: [],
    };
    expect(parsePlatformCompanyOverview(empty)).toEqual(empty);
  });
});

describe('loadPlatformCompanyOverview', () => {
  it('maps permission errors to a safe generic message', async () => {
    const result = await loadPlatformCompanyOverview({
      rpc: () =>
        Promise.resolve({
          data: null,
          error: {
            message: 'permission denied for function platform_company_overview',
            code: '42501',
          },
        }),
    });
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).not.toMatch(/permission denied|42501|sql/i);
      expect(result.message).toContain('could not be loaded');
    }
  });

  it('treats empty registries as empty, not error', async () => {
    const result = await loadPlatformCompanyOverview({
      rpc: () =>
        Promise.resolve({
          data: {
            counts: {
              pending_setup: 0,
              active: 0,
              suspended: 0,
              archived: 0,
              total: 0,
            },
            companies: [],
          },
          error: null,
        }),
    });
    expect(result.status).toBe('empty');
  });

  it('returns ready when counts and rows reconcile', async () => {
    const rpc = vi.fn(() =>
      Promise.resolve({ data: sampleOverview, error: null }),
    );
    const result = await loadPlatformCompanyOverview({ rpc });
    expect(rpc).toHaveBeenCalledWith('platform_company_overview');
    expect(result.status).toBe('ready');
    if (result.status === 'ready') {
      expect(result.data.counts.total).toBe(2);
      expect(result.data.companies).toHaveLength(2);
    }
  });

  it('fails closed on unexpected thrown errors', async () => {
    const result = await loadPlatformCompanyOverview({
      rpc: () => Promise.reject(new Error('network down')),
    });
    expect(result).toEqual({
      status: 'error',
      message:
        'Platform company metrics could not be loaded. Try again, or sign out and return later.',
    });
  });
});
