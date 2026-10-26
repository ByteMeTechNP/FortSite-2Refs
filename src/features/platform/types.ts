export const COMPANY_LIFECYCLE_STATUSES = [
  'pending_setup',
  'active',
  'suspended',
  'archived',
] as const;

export type CompanyLifecycleStatus =
  (typeof COMPANY_LIFECYCLE_STATUSES)[number];

export type PlatformCompanyCounts = Readonly<{
  pending_setup: number;
  active: number;
  suspended: number;
  archived: number;
  total: number;
}>;

export type PlatformCompanyRow = Readonly<{
  id: string;
  company_code: string;
  legal_name: string;
  display_name: string | null;
  registration_country: string;
  lifecycle_status: CompanyLifecycleStatus;
  created_at: string;
}>;

export type PlatformCompanyOverview = Readonly<{
  counts: PlatformCompanyCounts;
  companies: readonly PlatformCompanyRow[];
}>;

export type PlatformOverviewLoadState =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'ready'; data: PlatformCompanyOverview }>
  | Readonly<{ status: 'empty'; data: PlatformCompanyOverview }>
  | Readonly<{ status: 'error'; message: string }>;

export function isCompanyLifecycleStatus(
  value: string,
): value is CompanyLifecycleStatus {
  return (COMPANY_LIFECYCLE_STATUSES as readonly string[]).includes(value);
}

export function countsReconcile(counts: PlatformCompanyCounts): boolean {
  return (
    counts.pending_setup +
      counts.active +
      counts.suspended +
      counts.archived ===
    counts.total
  );
}
