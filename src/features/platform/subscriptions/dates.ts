import type { BillingInterval } from '@/features/platform/subscriptions/types';

/**
 * Month-end aware period end matching Postgres `timestamp + interval '1 month'`.
 */
export function monthlyPeriodEnd(startsAt: Date): Date {
  const year = startsAt.getUTCFullYear();
  const month = startsAt.getUTCMonth();
  const day = startsAt.getUTCDate();
  const hours = startsAt.getUTCHours();
  const minutes = startsAt.getUTCMinutes();
  const seconds = startsAt.getUTCSeconds();
  const ms = startsAt.getUTCMilliseconds();

  const nextMonth = month + 1;
  const candidate = new Date(
    Date.UTC(year, nextMonth, day, hours, minutes, seconds, ms),
  );
  // JS Date already clamps overflow days (31 Jan -> 2/3 Mar). Match Postgres
  // by using the last day of next month when the day overflows.
  if (candidate.getUTCMonth() !== ((nextMonth % 12) + 12) % 12) {
    return new Date(
      Date.UTC(year, nextMonth + 1, 0, hours, minutes, seconds, ms),
    );
  }
  return candidate;
}

export function addUtcDays(start: Date, days: number): Date {
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function computeTermBounds(input: {
  interval: BillingInterval;
  startsAt: Date;
  annualEndsAt?: Date | null;
  trialDays: number;
  graceDays: number;
  trialRequested: boolean;
}): Readonly<{
  endsAt: Date | null;
  periodEndsAt: Date | null;
  trialEndsAt: Date | null;
  graceEndsAt: Date | null;
}> {
  let endsAt: Date | null = null;
  let periodEndsAt: Date | null = null;

  if (input.interval === 'annual') {
    if (!input.annualEndsAt || input.annualEndsAt <= input.startsAt) {
      throw new Error('annual_end_required');
    }
    endsAt = input.annualEndsAt;
    periodEndsAt = input.annualEndsAt;
  } else if (input.interval === 'monthly') {
    periodEndsAt = monthlyPeriodEnd(input.startsAt);
    endsAt = periodEndsAt;
  }

  const trialEndsAt =
    input.trialRequested && input.trialDays > 0
      ? addUtcDays(input.startsAt, input.trialDays)
      : null;

  const boundary = trialEndsAt ?? periodEndsAt;
  const graceEndsAt =
    boundary && input.graceDays >= 0
      ? addUtcDays(boundary, input.graceDays)
      : null;

  return { endsAt, periodEndsAt, trialEndsAt, graceEndsAt };
}
