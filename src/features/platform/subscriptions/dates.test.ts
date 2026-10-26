import { describe, expect, it } from 'vitest';

import {
  addUtcDays,
  computeTermBounds,
  monthlyPeriodEnd,
} from '@/features/platform/subscriptions/dates';

describe('monthlyPeriodEnd', () => {
  it('keeps the same day when the next month has that day', () => {
    const start = new Date(Date.UTC(2024, 0, 15, 12, 0, 0));
    const end = monthlyPeriodEnd(start);
    expect(end.toISOString()).toBe('2024-02-15T12:00:00.000Z');
  });

  it('clamps 31 January to the last day of February', () => {
    const start = new Date(Date.UTC(2024, 0, 31, 8, 30, 0));
    const end = monthlyPeriodEnd(start);
    expect(end.toISOString()).toBe('2024-02-29T08:30:00.000Z');
  });

  it('clamps 31 January in a non-leap year to 28 February', () => {
    const start = new Date(Date.UTC(2025, 0, 31, 0, 0, 0));
    const end = monthlyPeriodEnd(start);
    expect(end.toISOString()).toBe('2025-02-28T00:00:00.000Z');
  });
});

describe('computeTermBounds', () => {
  it('requires an annual end after the start', () => {
    expect(() =>
      computeTermBounds({
        interval: 'annual',
        startsAt: new Date('2026-01-01T00:00:00.000Z'),
        annualEndsAt: null,
        trialDays: 0,
        graceDays: 7,
        trialRequested: false,
      }),
    ).toThrow('annual_end_required');
  });

  it('keeps lifetime ends null', () => {
    const bounds = computeTermBounds({
      interval: 'lifetime',
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      trialDays: 14,
      graceDays: 3,
      trialRequested: false,
    });
    expect(bounds.endsAt).toBeNull();
    expect(bounds.periodEndsAt).toBeNull();
    expect(bounds.trialEndsAt).toBeNull();
    expect(bounds.graceEndsAt).toBeNull();
  });

  it('builds a trial window and grace from trial end', () => {
    const startsAt = new Date('2026-03-01T00:00:00.000Z');
    const bounds = computeTermBounds({
      interval: 'monthly',
      startsAt,
      trialDays: 10,
      graceDays: 5,
      trialRequested: true,
    });
    expect(bounds.trialEndsAt?.toISOString()).toBe(
      addUtcDays(startsAt, 10).toISOString(),
    );
    expect(bounds.graceEndsAt?.toISOString()).toBe(
      addUtcDays(startsAt, 15).toISOString(),
    );
  });
});
