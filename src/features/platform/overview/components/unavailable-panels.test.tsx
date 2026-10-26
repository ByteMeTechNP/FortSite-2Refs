import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PlatformEventsUnavailable } from '@/features/platform/overview/components/PlatformEventsUnavailable';
import { SubscriptionMetricsUnavailable } from '@/features/platform/overview/components/SubscriptionMetricsUnavailable';

describe('Phase 10/11 unavailable panels', () => {
  it('does not invent a subscription count of zero', () => {
    render(<SubscriptionMetricsUnavailable />);
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();
    expect(screen.getByText(/Phase 10/i)).toBeInTheDocument();
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
    expect(screen.getByText(/not a count of zero/i)).toBeInTheDocument();
  });

  it('does not invent platform event rows', () => {
    render(<PlatformEventsUnavailable />);
    expect(screen.getByText('Platform events')).toBeInTheDocument();
    expect(screen.getByText(/Phase 11/i)).toBeInTheDocument();
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
    expect(screen.getByText(/No activity is invented/i)).toBeInTheDocument();
  });
});
