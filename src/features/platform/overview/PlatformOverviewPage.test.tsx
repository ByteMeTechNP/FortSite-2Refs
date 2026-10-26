import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlatformOverviewPage } from '@/features/platform/overview/PlatformOverviewPage';
import type { PlatformOverviewLoadState } from '@/features/platform/types';
import type { SubscriptionApi } from '@/features/platform/subscriptions/api';

const usePlatformOverviewMock = vi.fn(
  (): {
    state: PlatformOverviewLoadState;
    refresh: () => void;
  } => ({
    state: { status: 'loading' },
    refresh: vi.fn(),
  }),
);

const getOverviewCountsMock = vi.fn<SubscriptionApi['getOverviewCounts']>();

vi.mock('@/features/platform/data/use-platform-overview', () => ({
  usePlatformOverview: () => usePlatformOverviewMock(),
}));

vi.mock('@/features/platform/subscriptions/api', () => ({
  createBrowserSubscriptionApi: () =>
    ({
      getOverviewCounts: getOverviewCountsMock,
    }) as Pick<SubscriptionApi, 'getOverviewCounts'>,
}));

describe('PlatformOverviewPage', () => {
  beforeEach(() => {
    usePlatformOverviewMock.mockReset();
    getOverviewCountsMock.mockReset();
    getOverviewCountsMock.mockResolvedValue({
      ok: true,
      counts: {
        trial: 0,
        active: 0,
        grace: 0,
        overdue: 0,
        suspended: 0,
        cancelled: 0,
        total: 0,
        publishedPlans: 0,
      },
    });
  });

  it('keeps zero companies distinct from an error', async () => {
    usePlatformOverviewMock.mockReturnValue({
      state: {
        status: 'empty',
        data: {
          counts: {
            pending_setup: 0,
            active: 0,
            paused: 0,
            suspended: 0,
            archived: 0,
            total: 0,
          },
          companies: [],
        },
      },
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PlatformOverviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('No companies yet')).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Could not load company metrics'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText('Platform events')).toBeInTheDocument();
  });

  it('shows reconciled status counts for a ready overview', async () => {
    getOverviewCountsMock.mockResolvedValue({
      ok: true,
      counts: {
        trial: 1,
        active: 2,
        grace: 0,
        overdue: 0,
        suspended: 0,
        cancelled: 0,
        total: 3,
        publishedPlans: 1,
      },
    });
    usePlatformOverviewMock.mockReturnValue({
      state: {
        status: 'ready',
        data: {
          counts: {
            pending_setup: 1,
            active: 2,
            paused: 0,
            suspended: 0,
            archived: 0,
            total: 3,
          },
          companies: [],
        },
      },
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PlatformOverviewPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Total companies')).toBeInTheDocument();
    });
    expect(screen.getByText('3')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText(/Published plans: 1/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/Phase 11/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Phase 10/i)).not.toBeInTheDocument();
  });

  it('keeps subscription load failures distinct from zero counts', async () => {
    getOverviewCountsMock.mockResolvedValue({
      ok: false,
      message: 'Subscription overview could not be read.',
    });
    usePlatformOverviewMock.mockReturnValue({
      state: {
        status: 'ready',
        data: {
          counts: {
            pending_setup: 0,
            active: 1,
            paused: 0,
            suspended: 0,
            archived: 0,
            total: 1,
          },
          companies: [],
        },
      },
      refresh: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PlatformOverviewPage />
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
});
