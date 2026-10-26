export const INVITATION_RETIRED_MESSAGE =
  'Company invitations are retired. An administrator provisions the account and any membership separately. This action does not create a membership.';

export type AcceptInvitationResult = Readonly<{
  ok: false;
  error: string;
}>;

/**
 * Invitation acceptance no longer calls the database.
 * The historical RPC always refuses and is not granted to clients.
 */
export function acceptCompanyInvitation(): Promise<AcceptInvitationResult> {
  return Promise.resolve({
    ok: false,
    error: INVITATION_RETIRED_MESSAGE,
  });
}
