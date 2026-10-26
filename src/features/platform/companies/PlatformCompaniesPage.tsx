import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';

import { platformCompanyPath, ROUTE_PATHS } from '@/app/route-paths';
import { EmptyState } from '@/components/states/EmptyState';
import { ErrorState } from '@/components/states/ErrorState';
import { LoadingState } from '@/components/states/LoadingState';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
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
    <main className="flex flex-col gap-8 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
            Companies
          </p>
          <h2 className="text-2xl font-semibold">Company directory</h2>
          <p className="text-muted-foreground max-w-2xl text-sm leading-relaxed">
            Platform metadata only. This is not a company workspace and does not
            open projects, files, or finance.
          </p>
          {filter ? (
            <p className="text-sm">
              Filtered to <Badge variant="secondary">{filter}</Badge>{' '}
              <Link
                className="text-primary underline-offset-4 hover:underline"
                to={ROUTE_PATHS.platformCompanies}
              >
                Clear filter
              </Link>
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
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
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Search
          <input
            aria-label="Search companies"
            className="border-input bg-card h-11 rounded-[length:var(--fs-radius-control)] border px-3"
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
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Country
          <select
            aria-label="Country"
            className="border-input bg-card h-11 rounded-[length:var(--fs-radius-control)] border px-3"
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
        </label>
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
        <div className="border-border overflow-x-auto rounded-[length:var(--fs-radius-card)] border">
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
                      className="underline-offset-4 hover:underline"
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
                    <Badge variant="secondary">
                      {company.lifecycle_status}
                    </Badge>
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
