import { beforeEach, describe, expect, it, vi } from 'vitest';

import { acceptCompanyInvitation } from '@/features/tenancy/accept-invitation';

describe('acceptCompanyInvitation', () => {
  const rpc = vi.fn();

  beforeEach(() => {
    rpc.mockReset();
  });

  it('returns company and membership ids on success', async () => {
    rpc.mockResolvedValue({
      data: {
        company_id: '11111111-1111-1111-1111-111111111111',
        membership_id: '22222222-2222-2222-2222-222222222222',
      },
      error: null,
    });

    const result = await acceptCompanyInvitation(
      '33333333-3333-3333-3333-333333333333',
      {
        rpc,
      },
    );

    expect(rpc).toHaveBeenCalledWith('accept_company_invitation', {
      p_invitation_id: '33333333-3333-3333-3333-333333333333',
    });
    expect(result).toEqual({
      ok: true,
      companyId: '11111111-1111-1111-1111-111111111111',
      membershipId: '22222222-2222-2222-2222-222222222222',
    });
  });

  it('maps RPC failures to a generic unavailable message', async () => {
    rpc.mockResolvedValue({
      data: null,
      error: { message: 'invitation_unavailable' },
    });

    const result = await acceptCompanyInvitation(
      '44444444-4444-4444-4444-444444444444',
      { rpc },
    );

    expect(result).toEqual({
      ok: false,
      error:
        'This invitation is unavailable. It may be invalid, expired, revoked, or meant for a different account.',
    });
  });

  it('rejects a blank invitation id without calling the RPC', async () => {
    const result = await acceptCompanyInvitation('   ', { rpc });
    expect(rpc).not.toHaveBeenCalled();
    expect(result.ok).toBe(false);
  });
});
