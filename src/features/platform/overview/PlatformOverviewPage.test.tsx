import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PlatformOverviewPage } from '@/features/platform/overview/PlatformOverviewPage';
import type { PlatformOverviewLoadState } from '@/features/platform/types';

const usePlatformOverviewMock = vi.fn(
  (): {
    state: PlatformOverviewLoadState;
    refresh: () => void;
  } => ({
    state: { status: 'loading' },
    refresh: vi.fn(),
  }),
);

vi.mock('@/features/platform/data/use-platform-overview', () => ({
  usePlatformOverview: () => usePlatformOverviewMock(),
}));

describe('PlatformOverviewPage', () => {
  beforeEach(() => {
    usePlatformOverviewMock.mockReset();
  });

  it('keeps zero companies distinct from an error', async () => {
    usePlatformOverviewMock.mockReturnValue({
      state: {
        status: 'empty',
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
    usePlatformOverviewMock.mockReturnValue({
      state: {
        status: 'ready',
        data: {
          counts: {
            pending_setup: 1,
            active: 2,
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
    expect(screen.getByText(/Phase 10/i)).toBeInTheDocument();
    expect(screen.getByText(/Phase 11/i)).toBeInTheDocument();
  });
});
