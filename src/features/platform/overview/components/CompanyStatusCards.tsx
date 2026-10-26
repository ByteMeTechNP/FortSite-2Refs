import { Link } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type {
  CompanyLifecycleStatus,
  PlatformCompanyCounts,
} from '@/features/platform/types';

const STATUS_CARDS: ReadonlyArray<{
  key: CompanyLifecycleStatus | 'total';
  title: string;
  description: string;
}> = [
  {
    key: 'total',
    title: 'Total companies',
    description: 'All tenants in the registry',
  },
  {
    key: 'pending_setup',
    title: 'Pending setup',
    description: 'Created but not yet active',
  },
  {
    key: 'active',
    title: 'Active',
    description: 'Lifecycle status active',
  },
  {
    key: 'paused',
    title: 'Paused',
    description: 'Lifecycle status paused',
  },
  {
    key: 'suspended',
    title: 'Suspended',
    description: 'Lifecycle status suspended',
  },
  {
    key: 'archived',
    title: 'Archived',
    description: 'Lifecycle status archived',
  },
];

type CompanyStatusCardsProps = Readonly<{
  counts: PlatformCompanyCounts;
}>;

export function CompanyStatusCards({ counts }: CompanyStatusCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {STATUS_CARDS.map((card) => {
        const value = card.key === 'total' ? counts.total : counts[card.key];
        const href =
          card.key === 'total'
            ? ROUTE_PATHS.platformCompanies
            : `${ROUTE_PATHS.platformCompanies}?status=${card.key}`;
        return (
          <Link
            key={card.key}
            to={href}
            className="focus-visible:ring-ring rounded-xl outline-none focus-visible:ring-3"
          >
            <Card
              size="sm"
              className="hover:bg-muted/40 h-full transition-colors"
            >
              <CardHeader>
                <CardDescription>{card.title}</CardDescription>
                <CardTitle className="text-2xl font-semibold tabular-nums">
                  {value}
                </CardTitle>
                <CardDescription>{card.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
