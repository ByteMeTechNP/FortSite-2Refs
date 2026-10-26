import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PlatformEventsUnavailable } from '@/features/platform/overview/components/PlatformEventsUnavailable';

describe('Phase 11 unavailable panels', () => {
  it('does not invent platform event rows', () => {
    render(<PlatformEventsUnavailable />);
    expect(screen.getByText('Platform events')).toBeInTheDocument();
    expect(screen.getByText(/Phase 11/i)).toBeInTheDocument();
    expect(screen.queryByText(/^0$/)).not.toBeInTheDocument();
    expect(screen.getByText(/No activity is invented/i)).toBeInTheDocument();
  });
});
