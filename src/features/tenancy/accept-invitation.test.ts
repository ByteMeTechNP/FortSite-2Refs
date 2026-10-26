import { describe, expect, it } from 'vitest';

import {
  acceptCompanyInvitation,
  INVITATION_RETIRED_MESSAGE,
} from '@/features/tenancy/accept-invitation';

describe('acceptCompanyInvitation', () => {
  it('refuses every id and does not describe a successful membership', async () => {
    const result = await acceptCompanyInvitation();
    expect(result).toEqual({
      ok: false,
      error: INVITATION_RETIRED_MESSAGE,
    });
    expect(result.ok).toBe(false);
    expect(JSON.stringify(result)).not.toMatch(/companyId|membershipId/);
  });

  it('refuses a blank id the same way', async () => {
    const result = await acceptCompanyInvitation();
    expect(result.ok).toBe(false);
    expect(result.error).toBe(INVITATION_RETIRED_MESSAGE);
  });
});
