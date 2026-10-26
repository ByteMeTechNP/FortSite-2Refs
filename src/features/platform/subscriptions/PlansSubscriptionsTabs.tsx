import { useNavigate } from 'react-router';

import { ROUTE_PATHS } from '@/app/route-paths';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PlansSubscriptionsTabs({
  active,
}: {
  active: 'plans' | 'subscriptions';
}) {
  const navigate = useNavigate();
  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        if (value === 'plans') {
          void navigate(ROUTE_PATHS.platformPlans);
        }
        if (value === 'subscriptions') {
          void navigate(ROUTE_PATHS.platformSubscriptions);
        }
      }}
    >
      <TabsList>
        <TabsTrigger value="plans">Plans</TabsTrigger>
        <TabsTrigger value="subscriptions">Company subscriptions</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
