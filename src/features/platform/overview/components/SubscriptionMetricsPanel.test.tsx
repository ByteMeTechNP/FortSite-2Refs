import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';

import { SubscriptionMetricsPanel } from '@/features/platform/overview/components/SubscriptionMetricsPanel';
import type { SubscriptionApi } from '@/features/platform/subscriptions/api';

describe('SubscriptionMetricsPanel', () => {
  it('shows an error instead of inventing zero counts', async () => {
    const api = {
      getOverviewCounts: vi.fn().mockResolvedValue({
        ok: false,
        message: 'Subscription overview could not be read.',
      }),
    } as Pick<SubscriptionApi, 'getOverviewCounts'>;

    render(
      <MemoryRouter>
        <SubscriptionMetricsPanel api={api as SubscriptionApi} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Subscription overview could not be read.'),
      ).toBeInTheDocument();
    });
    expect(screen.queryByText(/Published plans:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^trial$/i)).not.toBeInTheDocument();
  });

  it('renders live status counts when the owner RPC succeeds', async () => {
    const api = {
      getOverviewCounts: vi.fn().mockResolvedValue({
        ok: true,
        counts: {
          trial: 1,
          active: 4,
          grace: 0,
          overdue: 2,
          suspended: 0,
          cancelled: 1,
          total: 8,
          publishedPlans: 3,
        },
      }),
    } as Pick<SubscriptionApi, 'getOverviewCounts'>;

    render(
      <MemoryRouter>
        <SubscriptionMetricsPanel api={api as SubscriptionApi} />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Published plans: 3/i)).toBeInTheDocument();
    });
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
