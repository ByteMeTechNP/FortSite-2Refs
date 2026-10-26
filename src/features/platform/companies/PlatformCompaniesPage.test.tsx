import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ROUTE_PATHS } from '@/app/route-paths';
import { PlatformCompaniesPage } from '@/features/platform/companies/PlatformCompaniesPage';
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

const readyState: PlatformOverviewLoadState = {
  status: 'ready',
  data: {
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
        company_code: 'FS-PENDING1',
        legal_name: 'Pending Co',
        display_name: null,
        registration_country: 'Nepal',
        lifecycle_status: 'pending_setup',
        created_at: '2026-10-26T12:00:00.000Z',
      },
      {
        id: '22222222-2222-2222-2222-222222222222',
        company_code: 'FS-ACTIVE01',
        legal_name: 'Active Co',
        display_name: 'Active',
        registration_country: 'India',
        lifecycle_status: 'active',
        created_at: '2026-10-26T11:00:00.000Z',
      },
    ],
  },
};

function renderCompanies(search = '') {
  return render(
    <MemoryRouter
      initialEntries={[`${ROUTE_PATHS.platformCompanies}${search}`]}
    >
      <Routes>
        <Route
          path={ROUTE_PATHS.platformCompanies}
          element={<PlatformCompaniesPage />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe('PlatformCompaniesPage', () => {
  beforeEach(() => {
    usePlatformOverviewMock.mockReset();
    usePlatformOverviewMock.mockReturnValue({
      state: readyState,
      refresh: vi.fn(),
    });
  });

  it('filters the same overview payload so counts match rows', async () => {
    renderCompanies('?status=active');
    await waitFor(() => {
      expect(screen.getByText('FS-ACTIVE01')).toBeInTheDocument();
    });
    expect(screen.queryByText('FS-PENDING1')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Showing 1 of 1 expected for this status/),
    ).toBeInTheDocument();
  });

  it('shows an empty state distinct from an error when filtered to zero', async () => {
    renderCompanies('?status=archived');
    await waitFor(() => {
      expect(
        screen.getByText('No companies in this status'),
      ).toBeInTheDocument();
    });
    expect(
      screen.queryByText('Could not load companies'),
    ).not.toBeInTheDocument();
  });

  it('surfaces a safe error state without inventing rows', async () => {
    usePlatformOverviewMock.mockReturnValue({
      state: {
        status: 'error',
        message: 'Platform company metrics could not be loaded.',
      },
      refresh: vi.fn(),
    });
    renderCompanies();
    await waitFor(() => {
      expect(screen.getByText('Could not load companies')).toBeInTheDocument();
    });
    expect(screen.queryByText('FS-ACTIVE01')).not.toBeInTheDocument();
  });
});
