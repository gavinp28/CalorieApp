import { describe, expect, it } from 'vitest';
import { signToken, verifyToken, type RestoreClaims, type UnlockClaims } from './token';

const SECRET = 'test-secret-0123456789abcdef0123456789';
const unlock: UnlockClaims = { typ: 'unlock', email: 'jo@example.com', sid: 'cs_test_abc', iat: 1_700_000_000_000 };

describe('unlock tokens', () => {
  it('round-trips claims', async () => {
    const t = await signToken(unlock, SECRET);
    expect(await verifyToken(t, SECRET, 'unlock')).toEqual(unlock);
  });

  it('handles non-ASCII emails', async () => {
    const t = await signToken({ ...unlock, email: 'zoë@exämple.com' }, SECRET);
    expect((await verifyToken(t, SECRET, 'unlock'))?.email).toBe('zoë@exämple.com');
  });

  it('rejects a token signed with a different secret', async () => {
    const t = await signToken(unlock, SECRET);
    expect(await verifyToken(t, SECRET + 'x', 'unlock')).toBeNull();
  });

  it('rejects tampered payloads and signatures', async () => {
    const t = await signToken(unlock, SECRET);
    const [body, sig] = t.split('.');
    const forged = btoa(JSON.stringify({ ...unlock, email: 'mallory@example.com' })).replace(/=+$/, '');
    expect(await verifyToken(`${forged}.${sig}`, SECRET, 'unlock')).toBeNull();
    const flipped = sig.slice(0, -1) + (sig.endsWith('A') ? 'B' : 'A');
    expect(await verifyToken(`${body}.${flipped}`, SECRET, 'unlock')).toBeNull();
  });

  it('rejects garbage without throwing', async () => {
    for (const bad of ['', 'abc', 'a.b.c', '.', '!!!.???', 'x'.repeat(5000)]) {
      expect(await verifyToken(bad, SECRET, 'unlock')).toBeNull();
    }
    expect(await verifyToken(undefined as unknown as string, SECRET, 'unlock')).toBeNull();
  });

  it('refuses short or missing secrets', async () => {
    await expect(signToken(unlock, 'short')).rejects.toThrow();
    await expect(verifyToken('a.b', '', 'unlock')).rejects.toThrow();
  });
});

describe('restore (email link) tokens', () => {
  const now = 1_700_000_000_000;
  const restore: RestoreClaims = { typ: 'restore', email: 'jo@example.com', exp: now + 30 * 60_000 };

  it('is valid until it expires', async () => {
    const t = await signToken(restore, SECRET);
    expect(await verifyToken(t, SECRET, 'restore', now)).toEqual(restore);
    expect(await verifyToken(t, SECRET, 'restore', now + 30 * 60_000)).toBeNull();
  });

  it('cannot be used as an unlock token, or vice versa', async () => {
    expect(await verifyToken(await signToken(restore, SECRET), SECRET, 'unlock', now)).toBeNull();
    expect(await verifyToken(await signToken(unlock, SECRET), SECRET, 'restore', now)).toBeNull();
  });
});
