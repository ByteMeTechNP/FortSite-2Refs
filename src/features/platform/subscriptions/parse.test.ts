import { describe, expect, it } from 'vitest';

import {
  parseAccessDecision,
  parseSubscriptionCounts,
  safeRpcMessage,
} from '@/features/platform/subscriptions/parse';

describe('parseSubscriptionCounts', () => {
  it('requires the six statuses to sum to total', () => {
    expect(
      parseSubscriptionCounts({
        counts: {
          trial: 1,
          active: 2,
          grace: 0,
          overdue: 0,
          suspended: 0,
          cancelled: 1,
          total: 4,
          published_plans: 2,
        },
      }),
    ).toEqual({
      trial: 1,
      active: 2,
      grace: 0,
      overdue: 0,
      suspended: 0,
      cancelled: 1,
      total: 4,
      publishedPlans: 2,
    });
  });

  it('rejects a mismatched total', () => {
    expect(
      parseSubscriptionCounts({
        counts: {
          trial: 1,
          active: 0,
          grace: 0,
          overdue: 0,
          suspended: 0,
          cancelled: 0,
          total: 2,
          published_plans: 0,
        },
      }),
    ).toBeNull();
  });
});

describe('parseAccessDecision and safeRpcMessage', () => {
  it('parses an allowed decision', () => {
    expect(
      parseAccessDecision({
        allowed: true,
        reason_code: 'ok',
        explanation: 'ok',
        subscription_status: 'active',
        relevant_end_at: null,
        entitlements: { max_users: 5 },
      }),
    ).toMatchObject({
      allowed: true,
      reasonCode: 'ok',
      subscriptionStatus: 'active',
    });
  });

  it('maps known RPC codes and hides unknown SQL text', () => {
    expect(safeRpcMessage({ message: 'currency_mismatch' })).toMatch(
      /currency/i,
    );
    expect(
      safeRpcMessage({ code: '42501', message: 'permission denied' }),
    ).toMatch(/permission/i);
    expect(
      safeRpcMessage({
        message: 'duplicate key value violates unique constraint "secret"',
      }),
    ).toBe('The request could not be completed.');
  });
});
