import { getBrowserSupabaseClient } from '@/lib/supabase';

export type AcceptInvitationSuccess = Readonly<{
  ok: true;
  companyId: string;
  membershipId: string;
}>;

export type AcceptInvitationFailure = Readonly<{
  ok: false;
  error: string;
}>;

export type AcceptInvitationResult =
  AcceptInvitationSuccess | AcceptInvitationFailure;

type AcceptInvitationRpcClient = Readonly<{
  rpc: (
    fn: string,
    args: { p_invitation_id: string },
  ) => Promise<{
    data: unknown;
    error: { message: string } | null;
  }>;
}>;

const UNAVAILABLE_MESSAGE =
  'This invitation is unavailable. It may be invalid, expired, revoked, or meant for a different account.';

function isAcceptPayload(
  value: unknown,
): value is { company_id: string; membership_id: string } {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.company_id === 'string' &&
    typeof record.membership_id === 'string'
  );
}

/**
 * Calls the Phase 06 accept_company_invitation RPC.
 * Does not assign a role. Maps all failures to a generic message.
 */
export async function acceptCompanyInvitation(
  invitationId: string,
  client: AcceptInvitationRpcClient = getBrowserSupabaseClient() as unknown as AcceptInvitationRpcClient,
): Promise<AcceptInvitationResult> {
  const trimmed = invitationId.trim();
  if (!trimmed) {
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }

  const { data, error } = await client.rpc('accept_company_invitation', {
    p_invitation_id: trimmed,
  });

  if (error || !isAcceptPayload(data)) {
    return { ok: false, error: UNAVAILABLE_MESSAGE };
  }

  return {
    ok: true,
    companyId: data.company_id,
    membershipId: data.membership_id,
  };
}
