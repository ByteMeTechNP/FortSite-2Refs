import {
  COMPANY_LIFECYCLE_STATUSES,
  type CompanyLifecycleStatus,
} from '@/features/platform/types';

/**
 * Owner-facing transition matrix. The database function is the authority.
 * Subscription intent is never a reason to allow or refuse a transition.
 */
export function isAllowedLifecycleTransition(
  from: CompanyLifecycleStatus,
  to: CompanyLifecycleStatus,
): boolean {
  if (from === to || from === 'archived') {
    return false;
  }
  if (to === 'archived') {
    return true;
  }
  if (from === 'pending_setup') {
    return to === 'active';
  }
  if (from === 'active') {
    return to === 'paused' || to === 'suspended';
  }
  if (from === 'paused') {
    return to === 'active' || to === 'suspended';
  }
  if (from === 'suspended') {
    return to === 'active';
  }
  return false;
}

export function lifecycleTargets(
  from: CompanyLifecycleStatus,
): readonly CompanyLifecycleStatus[] {
  return COMPANY_LIFECYCLE_STATUSES.filter((status) =>
    isAllowedLifecycleTransition(from, status),
  );
}

export function lifecycleActionLabel(
  from: CompanyLifecycleStatus,
  to: CompanyLifecycleStatus,
): string {
  if (to === 'archived') {
    return 'Archive';
  }
  if (to === 'paused') {
    return 'Pause';
  }
  if (to === 'suspended') {
    return 'Suspend';
  }
  if (from === 'pending_setup') {
    return 'Activate';
  }
  return 'Resume';
}

export const ARCHIVE_CONFIRMATION = 'ARCHIVE';
