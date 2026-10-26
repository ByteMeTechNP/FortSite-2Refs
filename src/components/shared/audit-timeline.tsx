export type AuditTimelineRow = Readonly<{
  id: string;
  action: string;
  createdAt: string;
  entityType?: string | null;
  entityId?: string | null;
  reason?: string | null;
}>;

/**
 * Presentational audit list. Not mounted: Phase 11 events stay unavailable
 * and this component is never given invented rows.
 */
export function AuditTimeline({ rows }: { rows: readonly AuditTimelineRow[] }) {
  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No audit events yet.</p>
    );
  }
  return (
    <ol className="grid gap-3">
      {rows.map((row) => (
        <li
          key={row.id}
          className="border-border bg-card rounded-xl border px-4 py-3"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-medium">{row.action}</p>
            <p className="text-muted-foreground text-xs">{row.createdAt}</p>
          </div>
          {row.entityType ? (
            <p className="text-muted-foreground mt-1 text-xs">
              {row.entityType}
              {row.entityId ? ` · ${row.entityId}` : ''}
            </p>
          ) : null}
          {row.reason ? <p className="mt-2 text-sm">{row.reason}</p> : null}
        </li>
      ))}
    </ol>
  );
}
