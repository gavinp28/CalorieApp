import { load, save, useStored } from './storage';

export const PRICE = '$3.99';

/** Stripe Payment Link. Override with VITE_PAYMENT_LINK (e.g. a test-mode link in .env). */
export const PAYMENT_LINK: string = import.meta.env.VITE_PAYMENT_LINK || 'https://buy.stripe.com/fZu6oH1nZfRCfYJ4QldIA01';

export interface Unlock {
  /** Server-signed token; the server verifies it on every locked puzzle request. */
  token: string;
  email: string;
  /** Checkout Session ID, for the personal restore link. Absent after an email restore. */
  sessionId?: string;
}

const KEY = 'unlock';

export const getUnlock = () => load<Unlock | null>(KEY, null);
export const useUnlock = () => useStored<Unlock | null>(KEY, null);
export const saveUnlock = (u: Unlock) => save(KEY, u);
export const clearUnlock = () => save(KEY, null);

export const restoreLinkFor = (sessionId: string) => `${location.origin}/restore?session_id=${encodeURIComponent(sessionId)}`;

/** Pulls a Checkout Session ID out of a pasted restore link (or a bare ID). */
export function sessionIdFrom(input: string): string | null {
  return /cs_(?:test|live)_[A-Za-z0-9]+/.exec(input)?.[0] ?? null;
}
