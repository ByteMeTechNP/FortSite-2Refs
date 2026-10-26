import { Badge } from '@/components/ui/badge';
import { cn } from 'cn';

const TONES: Record<string, string> = {
  active: 'bg-[#DCFCE7] text-[#166534] border-transparent',
  lifetime: 'bg-[#DCFCE7] text-[#166534] border-transparent',
  approved: 'bg-[#DCFCE7] text-[#166534] border-transparent',
  published: 'bg-[#DCFCE7] text-[#166534] border-transparent',
  recorded: 'bg-[#DCFCE7] text-[#166534] border-transparent',
  pending: 'bg-accent text-foreground border-transparent',
  pending_setup: 'bg-accent text-foreground border-transparent',
  pending_review: 'bg-accent text-foreground border-transparent',
  invited: 'bg-accent text-foreground border-transparent',
  renewal_due: 'bg-accent text-foreground border-transparent',
  waiting: 'bg-accent text-foreground border-transparent',
  paused: 'bg-accent text-foreground border-transparent',
  grace: 'bg-accent text-foreground border-transparent',
  trial: 'bg-[#DBEAFE] text-[#1D4ED8] border-transparent',
  in_progress: 'bg-[#DBEAFE] text-[#1D4ED8] border-transparent',
  open: 'bg-[#DBEAFE] text-[#1D4ED8] border-transparent',
  suspended: 'bg-[#FEE2E2] text-[#991B1B] border-transparent',
  rejected: 'bg-[#FEE2E2] text-[#991B1B] border-transparent',
  expired: 'bg-[#FEE2E2] text-[#991B1B] border-transparent',
  overdue: 'bg-[#FEE2E2] text-[#991B1B] border-transparent',
  urgent: 'bg-[#FEE2E2] text-[#991B1B] border-transparent',
  high: 'bg-accent text-foreground border-transparent',
  cancelled: 'bg-muted text-muted-foreground border-transparent',
  archived: 'bg-muted text-muted-foreground border-transparent',
  reversed: 'bg-muted text-muted-foreground border-transparent',
  draft: 'bg-muted text-muted-foreground border-transparent',
  retired: 'bg-muted text-muted-foreground border-transparent',
};

export function StatusBadge({
  value,
  label,
}: {
  value: string | null | undefined;
  label?: string;
}) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>;
  }
  const display = label ?? value.replaceAll('_', ' ');
  return (
    <Badge
      variant="outline"
      className={cn('capitalize', TONES[value] ?? 'bg-muted text-foreground')}
    >
      <span className="sr-only">Status:</span>
      {display}
    </Badge>
  );
}
