import { getBrowserSupabaseClient } from '@/lib/supabase';
import {
  countsReconcile,
  isCompanyLifecycleStatus,
  type PlatformCompanyOverview,
  type PlatformCompanyRow,
  type PlatformOverviewLoadState,
} from '@/features/platform/types';

type OverviewRpcClient = Readonly<{
  rpc: (fn: string) => Promise<{
    data: unknown;
    error: { message: string; code?: string } | null;
  }>;
}>;

const GENERIC_ERROR =
  'Platform company metrics could not be loaded. Try again, or sign out and return later.';

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object';
}

function asNonNegativeInt(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
    ? value
    : null;
}

function parseCompany(value: unknown): PlatformCompanyRow | null {
  if (!isRecord(value)) {
    return null;
  }
  const status = value.lifecycle_status;
  if (typeof status !== 'string' || !isCompanyLifecycleStatus(status)) {
    return null;
  }
  if (
    typeof value.id !== 'string' ||
    typeof value.company_code !== 'string' ||
    typeof value.legal_name !== 'string' ||
    typeof value.registration_country !== 'string' ||
    typeof value.created_at !== 'string'
  ) {
    return null;
  }
  const displayName =
    value.display_name === null || typeof value.display_name === 'string'
      ? value.display_name
      : null;
  if (displayName === undefined) {
    return null;
  }
  return {
    id: value.id,
    company_code: value.company_code,
    legal_name: value.legal_name,
    display_name: displayName,
    registration_country: value.registration_country,
    lifecycle_status: status,
    created_at: value.created_at,
  };
}

export function parsePlatformCompanyOverview(
  value: unknown,
): PlatformCompanyOverview | null {
  if (!isRecord(value) || !isRecord(value.counts)) {
    return null;
  }
  const pending = asNonNegativeInt(value.counts.pending_setup);
  const active = asNonNegativeInt(value.counts.active);
  const suspended = asNonNegativeInt(value.counts.suspended);
  const archived = asNonNegativeInt(value.counts.archived);
  const total = asNonNegativeInt(value.counts.total);
  if (
    pending === null ||
    active === null ||
    suspended === null ||
    archived === null ||
    total === null
  ) {
    return null;
  }
  if (!Array.isArray(value.companies)) {
    return null;
  }
  const companies: PlatformCompanyRow[] = [];
  for (const row of value.companies) {
    const parsed = parseCompany(row);
    if (!parsed) {
      return null;
    }
    companies.push(parsed);
  }
  const counts = {
    pending_setup: pending,
    active,
    suspended,
    archived,
    total,
  };
  if (!countsReconcile(counts) || companies.length !== total) {
    return null;
  }
  return { counts, companies };
}

/**
 * Loads the Phase 08 Platform Owner company overview RPC.
 * Fail closed: permission and parse failures become a safe error state.
 */
export async function loadPlatformCompanyOverview(
  client: OverviewRpcClient = getBrowserSupabaseClient() as unknown as OverviewRpcClient,
): Promise<PlatformOverviewLoadState> {
  try {
    const { data, error } = await client.rpc('platform_company_overview');
    if (error) {
      return { status: 'error', message: GENERIC_ERROR };
    }
    const parsed = parsePlatformCompanyOverview(data);
    if (!parsed) {
      return { status: 'error', message: GENERIC_ERROR };
    }
    if (parsed.counts.total === 0) {
      return { status: 'empty', data: parsed };
    }
    return { status: 'ready', data: parsed };
  } catch {
    return { status: 'error', message: GENERIC_ERROR };
  }
}
