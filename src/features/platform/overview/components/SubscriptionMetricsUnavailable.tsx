import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function SubscriptionMetricsUnavailable() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>
          Subscription metrics become available in Phase 10. This panel is not a
          count of zero plans.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
