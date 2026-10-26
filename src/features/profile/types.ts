export type UserProfile = Readonly<{
  userId: string;
  fullName: string | null;
  displayName: string | null;
  createdAt: string;
  updatedAt: string;
}>;

export type UserProfileInput = Readonly<{
  fullName: string;
  displayName: string;
}>;
