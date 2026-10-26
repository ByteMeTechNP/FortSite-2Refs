import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';

import { platformCompanyPath, ROUTE_PATHS } from '@/app/route-paths';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/shared/status-badge';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { usePlatformOverview } from '@/features/platform/data/use-platform-overview';
import {
  isCompanyLifecycleStatus,
  type CompanyLifecycleStatus,
} from '@/features/platform/types';

function statusFilter(raw: string | null): CompanyLifecycleStatus | null {
  if (!raw) {
    return null;
  }
  return isCompanyLifecycleStatus(raw) ? raw : null;
}

export function PlatformCompaniesPage() {
  const { state, refresh } = usePlatformOverview();
  const [params, setParams] = useSearchParams();
  const filter = statusFilter(params.get('status'));
  const countryParam = params.get('country');
  const country =
    countryParam === 'Nepal' || countryParam === 'India' ? countryParam : null;
  const query = (params.get('q') ?? '').trim().toLowerCase();

  const rows = useMemo(() => {
    if (state.status !== 'ready' && state.status !== 'empty') {
      return [];
    }
    return state.data.companies.filter((company) => {
      if (filter && company.lifecycle_status !== filter) {
        return false;
      }
      if (country && company.registration_country !== country) {
        return false;
      }
      if (!query) {
        return true;
      }
      const haystack = [
        company.company_code,
        company.legal_name,
        company.display_name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [state, filter, country, query]);

  return (
    <main className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Companies"
        title="Company directory"
        description="Platform metadata only. This is not a company workspace and does not open projects, files, or finance."
        actions={
          <>
            <Link
              className={buttonVariants()}
              to={ROUTE_PATHS.platformCompanyNew}
            >
              New company
            </Link>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                refresh();
              }}
              disabled={state.status === 'loading'}
            >
              Refresh
            </Button>
          </>
        }
      />

      {filter ? (
        <p className="text-sm">
          Filtered to <Badge variant="secondary">{filter}</Badge>{' '}
          <Link
            className="text-link hover:underline"
            to={ROUTE_PATHS.platformCompanies}
          >
            Clear filter
          </Link>
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="company-search">Search</Label>
          <Input
            id="company-search"
            aria-label="Search companies"
            value={params.get('q') ?? ''}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) {
                next.set('q', event.target.value);
              } else {
                next.delete('q');
              }
              setParams(next);
            }}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="company-country">Country</Label>
          <select
            id="company-country"
            aria-label="Country"
            className="border-input focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full min-w-40 rounded-full border bg-transparent px-3 text-sm outline-none focus-visible:ring-3"
            value={country ?? ''}
            onChange={(event) => {
              const next = new URLSearchParams(params);
              if (event.target.value) {
                next.set('country', event.target.value);
              } else {
                next.delete('country');
              }
              setParams(next);
            }}
          >
            <option value="">All countries</option>
            <option value="Nepal">Nepal</option>
            <option value="India">India</option>
          </select>
        </div>
      </div>

      {state.status === 'idle' || state.status === 'loading' ? (
        <LoadingState message="Loading companies…" />
      ) : null}

      {state.status === 'error' ? (
        <ErrorState
          title="Could not load companies"
          message={state.message}
          onRetry={() => {
            refresh();
          }}
        />
      ) : null}

      {state.status === 'empty' ||
      (state.status === 'ready' && rows.length === 0) ? (
        <EmptyState
          title={filter ? 'No companies in this status' : 'No companies yet'}
          description={
            filter
              ? 'The filter matches zero rows from the current overview payload.'
              : 'The company registry is empty.'
          }
        />
      ) : null}

      {state.status === 'ready' && rows.length > 0 ? (
        <div className="border-border bg-card overflow-hidden rounded-xl border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Legal name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-mono text-xs">
                    <Link
                      className="text-link hover:underline"
                      to={platformCompanyPath(company.id)}
                    >
                      {company.company_code}
                    </Link>
                  </TableCell>
                  <TableCell>
                    {company.display_name
                      ? `${company.legal_name} (${company.display_name})`
                      : company.legal_name}
                  </TableCell>
                  <TableCell>{company.registration_country}</TableCell>
                  <TableCell>
                    <StatusBadge value={company.lifecycle_status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(company.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filter && !country && !query ? (
            <p className="text-muted-foreground px-4 py-3 text-xs">
              Showing {rows.length} of {state.data.counts[filter]} expected for
              this status.
            </p>
          ) : country || query ? (
            <p className="text-muted-foreground px-4 py-3 text-xs">
              Showing {rows.length} matching companies.
            </p>
          ) : (
            <p className="text-muted-foreground px-4 py-3 text-xs">
              Showing {rows.length} of {state.data.counts.total} companies.
            </p>
          )}
        </div>
      ) : null}
    </main>
  );
}
