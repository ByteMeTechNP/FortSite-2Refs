import { getBrowserSupabaseClient } from '@/lib/supabase';

import type { UserProfile, UserProfileInput } from '@/features/profile/types';

type ProfileRow = Readonly<{
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  created_at: string;
  updated_at: string;
}>;

export type ProfileApiResult<T> = Readonly<{
  data: T | null;
  error: string | null;
  missingTable?: boolean;
}>;

function mapRow(row: ProfileRow): UserProfile {
  return {
    userId: row.user_id,
    fullName: row.full_name,
    displayName: row.display_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isMissingRelation(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('could not find the table') ||
    (lower.includes('relation') && lower.includes('does not exist')) ||
    lower.includes('schema cache')
  );
}

function isProfileRow(value: unknown): value is ProfileRow {
  if (!value || typeof value !== 'object') {
    return false;
  }
  return 'user_id' in value && typeof value.user_id === 'string';
}

/**
 * Profile table access before generated Database types exist.
 * Uses a narrow untyped query surface so we do not invent schema types.
 */
function profileTable() {
  const client = getBrowserSupabaseClient();
  return client.from('user_profiles') as unknown as {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string,
      ) => {
        maybeSingle: () => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
    };
    upsert: (
      values: Record<string, unknown>,
      options: { onConflict: string },
    ) => {
      select: (columns: string) => {
        single: () => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      };
    };
  };
}

export async function loadOwnProfile(
  userId: string,
): Promise<ProfileApiResult<UserProfile>> {
  const { data, error } = await profileTable()
    .select('user_id, full_name, display_name, created_at, updated_at')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    return {
      data: null,
      error: isMissingRelation(error.message)
        ? 'The user profile table is not available yet. The Phase 05 migration has not been applied.'
        : 'Could not load the profile.',
      missingTable: isMissingRelation(error.message),
    };
  }

  if (!data) {
    return { data: null, error: null };
  }

  if (!isProfileRow(data)) {
    return { data: null, error: 'Could not load the profile.' };
  }

  return { data: mapRow(data), error: null };
}

export async function saveOwnProfile(
  userId: string,
  input: UserProfileInput,
): Promise<ProfileApiResult<UserProfile>> {
  const payload = {
    user_id: userId,
    full_name: input.fullName.trim() === '' ? null : input.fullName.trim(),
    display_name:
      input.displayName.trim() === '' ? null : input.displayName.trim(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await profileTable()
    .upsert(payload, { onConflict: 'user_id' })
    .select('user_id, full_name, display_name, created_at, updated_at')
    .single();

  if (error) {
    return {
      data: null,
      error: isMissingRelation(error.message)
        ? 'The user profile table is not available yet. The Phase 05 migration has not been applied.'
        : 'Could not save the profile.',
      missingTable: isMissingRelation(error.message),
    };
  }

  if (!isProfileRow(data)) {
    return { data: null, error: 'Could not save the profile.' };
  }

  return { data: mapRow(data), error: null };
}
