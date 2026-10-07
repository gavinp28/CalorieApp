/**
 * Stateless signed tokens: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
 * Server-only in practice (the secret never leaves Netlify), but written against
 * Web Crypto so it runs identically in Netlify Functions and in tests.
 */

export type TokenType = 'unlock' | 'restore';

export interface UnlockClaims {
  typ: 'unlock';
  /** Buyer's email from Stripe. */
  email: string;
  /** Stripe Checkout Session that paid. */
  sid: string;
  iat: number;
}

export interface RestoreClaims {
  typ: 'restore';
  email: string;
  /** Expiry, ms since epoch. */
  exp: number;
}

type Claims = UnlockClaims | RestoreClaims;

const enc = new TextEncoder();
const dec = new TextDecoder();
const MIN_SECRET_LENGTH = 32;

function b64url(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64url(s: string): Uint8Array<ArrayBuffer> {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function key(secret: string) {
  if (!secret || secret.length < MIN_SECRET_LENGTH) throw new Error(`Signing secret must be at least ${MIN_SECRET_LENGTH} characters`);
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function signToken(claims: Claims, secret: string): Promise<string> {
  const body = b64url(enc.encode(JSON.stringify(claims)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await key(secret), enc.encode(body)));
  return `${body}.${b64url(sig)}`;
}

/**
 * Returns the claims if the signature is valid, the type matches and it hasn't
 * expired; otherwise null. Never throws on bad input (only on a bad secret).
 */
export async function verifyToken<T extends TokenType>(
  token: string,
  secret: string,
  typ: T,
  now: number = Date.now(),
): Promise<Extract<Claims, { typ: T }> | null> {
  const k = await key(secret);
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 2 || token.length > 2048) return null;
  try {
    // crypto.subtle.verify compares in constant time.
    const ok = await crypto.subtle.verify('HMAC', k, fromB64url(parts[1]), enc.encode(parts[0]));
    if (!ok) return null;
    const claims = JSON.parse(dec.decode(fromB64url(parts[0]))) as Claims;
    if (claims?.typ !== typ) return null;
    if ('exp' in claims && !(claims.exp > now)) return null;
    return claims as Extract<Claims, { typ: T }>;
  } catch {
    return null;
  }
}
