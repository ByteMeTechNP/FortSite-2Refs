import { useEffect, useId, useState, type FormEvent } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  loadOwnProfile,
  saveOwnProfile,
} from '@/features/profile/api/profile-api';
import type { UserProfile } from '@/features/profile/types';

type ProfileFormProps = Readonly<{
  userId: string;
}>;

export function ProfileForm({ userId }: ProfileFormProps) {
  const fullNameId = useId();
  const displayNameId = useId();
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [missingTable, setMissingTable] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError(null);
      const result = await loadOwnProfile(userId);
      if (cancelled) {
        return;
      }
      if (result.error) {
        setError(result.error);
        setMissingTable(Boolean(result.missingTable));
      } else if (result.data) {
        setProfile(result.data);
        setFullName(result.data.fullName ?? '');
        setDisplayName(result.data.displayName ?? '');
      }
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccess(null);
    setError(null);
    setSaving(true);

    const result = await saveOwnProfile(userId, { fullName, displayName });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      setMissingTable(Boolean(result.missingTable));
      return;
    }

    if (result.data) {
      setProfile(result.data);
      setSuccess('Profile saved. This does not grant organization access.');
    }
  }

  if (loading) {
    return (
      <p className="text-foreground-secondary text-sm">Loading profile…</p>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        void handleSubmit(event);
      }}
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor={fullNameId}>Full name</Label>
        <Input
          id={fullNameId}
          name="fullName"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          disabled={saving || missingTable}
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={displayNameId}>Display name</Label>
        <Input
          id={displayNameId}
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          disabled={saving || missingTable}
        />
      </div>
      {error ? (
        <Alert variant="danger">
          <AlertTitle>
            {missingTable ? 'Profile storage unavailable' : 'Profile error'}
          </AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {success ? (
        <Alert variant="success">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      ) : null}
      {profile ? (
        <p className="text-foreground-secondary text-xs">
          Profile row present. Updated{' '}
          {new Date(profile.updatedAt).toLocaleString()}.
        </p>
      ) : null}
      <Button type="submit" loading={saving} disabled={saving || missingTable}>
        Save profile
      </Button>
    </form>
  );
}
