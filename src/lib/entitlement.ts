import { useStored } from './storage';

/**
 * Whether this browser has unlocked the archive and bonus puzzles.
 * Phase 4 stores a server-signed unlock token here; until then nobody is unlocked.
 */
export function useUnlockToken(): string | null {
  return useStored<string | null>('unlockToken', null);
}

export const PRICE = '$3.99';
