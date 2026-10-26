import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function PlatformEventsUnavailable() {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Platform events</CardTitle>
        <CardDescription>
          The platform event feed becomes available in Phase 11. No activity is
          invented here.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
