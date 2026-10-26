import { useState } from 'react';

/**
 * Holds a temporary password in component state only.
 * Signing out clears it. Leaving the page drops it with the component.
 */
export function useOneTimePassword(signedIn: boolean) {
  const [password, setPassword] = useState<string | null>(null);
  const [trackedSignIn, setTrackedSignIn] = useState(signedIn);

  if (signedIn !== trackedSignIn) {
    setTrackedSignIn(signedIn);
    if (!signedIn) {
      setPassword(null);
    }
  }

  return {
    password: signedIn ? password : null,
    reveal(next: string) {
      setPassword(next);
    },
    clear() {
      setPassword(null);
    },
  };
}
