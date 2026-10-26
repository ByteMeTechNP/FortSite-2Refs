import { describe, expect, it } from 'vitest';

import bootstrap from '../../../scripts/operations/bootstrap-platform-owner.template.sql?raw';
import recovery from '../../../scripts/operations/recover-platform-owner.template.sql?raw';

describe('platform owner operation templates', () => {
  it('refuses unresolved bootstrap placeholders', () => {
    expect(bootstrap).toContain('placeholder_unresolved');
    expect(bootstrap).toContain('__TARGET_USER_ID__');
    expect(bootstrap).toContain('__REASON_CODE__');
    expect(bootstrap).toContain('active_platform_owner_already_exists');
    expect(bootstrap).toContain('NEVER AUTO-RUN');
    expect(bootstrap).toContain('Do not add this file to supabase/migrations');
  });

  it('documents recovery with the session setting and audit event', () => {
    expect(recovery).toContain('placeholder_unresolved');
    expect(recovery).toContain('fortsite.platform_owner_recovery');
    expect(recovery).toContain('bootstrap_recovery_used');
    expect(recovery).toContain('NEVER AUTO-RUN');
  });
});
