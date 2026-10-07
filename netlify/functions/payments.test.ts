import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { signToken, verifyToken } from '../../shared/token';
import type { CheckoutSession } from '../lib/stripe';
import { handleRestoreEmail } from './restore-email';
import { handleRestoreLink } from './restore-link';
import { handleUnlock } from './unlock';

const SECRET = 'payments-test-secret-0123456789abcdef';
const SID = 'cs_test_a1B2c3D4e5F6g7H8';

const paid = (over: Partial<CheckoutSession> = {}): CheckoutSession => ({
  id: SID,
  mode: 'payment',
  status: 'complete',
  payment_status: 'paid',
  amount_total: 399,
  currency: 'usd',
  payment_link: 'plink_123',
  customer_details: { email: 'Jo@Example.com' },
  payment_intent: { status: 'succeeded', latest_charge: { refunded: false } },
  ...over,
});

/** Fake Stripe + Resend. `sessions` is what Stripe "has". */
let sessions: CheckoutSession[] = [];
let sentEmails: { to: string[]; text: string }[] = [];
const stripeCalls: string[] = [];

function fakeFetch(input: string | URL | Request, init?: RequestInit) {
  const url = new URL(String(input));
  if (url.host === 'api.resend.com') {
    sentEmails.push(JSON.parse(String(init?.body)));
    return Promise.resolve(new Response('{"id":"em_1"}'));
  }
  stripeCalls.push(url.pathname + url.search);
  expect(new Headers(init?.headers).get('authorization')).toBe('Bearer sk_test_fake');
  const one = /\/v1\/checkout\/sessions\/(.+)$/.exec(url.pathname);
  if (one) {
    const s = sessions.find((x) => x.id === one[1]);
    return Promise.resolve(s ? new Response(JSON.stringify(s)) : new Response('{}', { status: 404 }));
  }
  const email = url.searchParams.get('customer_details[email]');
  return Promise.resolve(new Response(JSON.stringify({ data: sessions.filter((s) => s.customer_details?.email === email) })));
}

const post = (path: string, body: unknown) =>
  new Request(`https://calorieguesser.test${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
  });

beforeEach(() => {
  process.env.UNLOCK_SECRET = SECRET;
  process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
  process.env.RESEND_API_KEY = 're_fake';
  process.env.EMAIL_FROM = 'Test <play@calorieguesser.test>';
  process.env.SITE_URL = 'https://calorieguesser.test';
  delete process.env.STRIPE_PAYMENT_LINK_ID;
  sessions = [paid()];
  sentEmails = [];
  stripeCalls.length = 0;
  vi.stubGlobal('fetch', vi.fn(fakeFetch));
});
afterEach(() => vi.unstubAllGlobals());

describe('POST /api/unlock', () => {
  it('returns a signed unlock token with the buyer email for a paid $3.99 session', async () => {
    const res = await handleUnlock(post('/api/unlock', { session_id: SID }));
    expect(res.status).toBe(200);
    const { token, email } = await res.json();
    expect(email).toBe('Jo@Example.com');
    expect(await verifyToken(token, SECRET, 'unlock')).toMatchObject({ email: 'Jo@Example.com', sid: SID });
  });

  it('rejects unpaid, wrong-amount, wrong-currency and refunded sessions', async () => {
    for (const [over, error] of [
      [{ payment_status: 'unpaid' }, 'not_paid'],
      [{ status: 'open' }, 'not_paid'],
      [{ amount_total: 299 }, 'wrong_product'],
      [{ currency: 'eur' }, 'wrong_product'],
      [{ payment_intent: { latest_charge: { refunded: true } } }, 'refunded'],
    ] as const) {
      sessions = [paid(over as Partial<CheckoutSession>)];
      const res = await handleUnlock(post('/api/unlock', { session_id: SID }));
      expect(res.status, error).toBe(402);
      expect(await res.json()).toEqual({ error });
    }
  });

  it('only accepts our Payment Link when STRIPE_PAYMENT_LINK_ID is set', async () => {
    process.env.STRIPE_PAYMENT_LINK_ID = 'plink_other';
    expect((await handleUnlock(post('/api/unlock', { session_id: SID }))).status).toBe(402);
    process.env.STRIPE_PAYMENT_LINK_ID = 'plink_123';
    expect((await handleUnlock(post('/api/unlock', { session_id: SID }))).status).toBe(200);
  });

  it('404s unknown sessions and never sends malformed IDs to Stripe', async () => {
    expect((await handleUnlock(post('/api/unlock', { session_id: 'cs_test_doesnotexist1' }))).status).toBe(404);
    stripeCalls.length = 0;
    for (const bad of ['../../charges', 'cs_test_abc/../x', 'pi_123', '']) {
      expect((await handleUnlock(post('/api/unlock', { session_id: bad }))).status).toBe(404);
    }
    expect(stripeCalls).toEqual([]);
    expect((await handleUnlock(post('/api/unlock', {}))).status).toBe(400);
  });

  it('reports missing configuration as misconfigured, not a crash', async () => {
    delete process.env.STRIPE_SECRET_KEY;
    const { default: handler } = await import('./unlock');
    const res = await handler(post('/api/unlock', { session_id: SID }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: 'misconfigured' });
  });
});

describe('POST /api/restore-email', () => {
  it('emails a restore link to the address Stripe has on file', async () => {
    sessions = [paid({ customer_details: { email: 'jo@example.com' } })];
    const res = await handleRestoreEmail(post('/api/restore-email', { email: '  JO@example.COM ' }));
    expect(await res.json()).toEqual({ ok: true });
    expect(sentEmails).toHaveLength(1);
    expect(sentEmails[0].to).toEqual(['jo@example.com']);
    expect(sentEmails[0].text).toMatch(/https:\/\/calorieguesser\.test\/restore\?t=/);
  });

  it('finds buyers whose phone capitalized the first letter at checkout', async () => {
    sessions = [paid({ customer_details: { email: 'Jo@example.com' } })];
    await handleRestoreEmail(post('/api/restore-email', { email: 'jo@example.com' }));
    expect(sentEmails[0]?.to).toEqual(['Jo@example.com']);
  });

  it('answers identically when there is no purchase, and sends nothing', async () => {
    const res = await handleRestoreEmail(post('/api/restore-email', { email: 'nobody@example.com' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(sentEmails).toHaveLength(0);
  });

  it('ignores refunded purchases', async () => {
    sessions = [paid({ customer_details: { email: 'jo@example.com' }, payment_intent: { latest_charge: { refunded: true } } })];
    await handleRestoreEmail(post('/api/restore-email', { email: 'jo@example.com' }));
    expect(sentEmails).toHaveLength(0);
  });

  it('rejects things that are not emails', async () => {
    expect((await handleRestoreEmail(post('/api/restore-email', { email: 'nope' }))).status).toBe(400);
  });
});

describe('POST /api/restore-link', () => {
  beforeEach(() => {
    sessions = [paid({ customer_details: { email: 'jo@example.com' } })];
  });

  it('exchanges an emailed link for an unlock token', async () => {
    await handleRestoreEmail(post('/api/restore-email', { email: 'jo@example.com' }));
    const t = new URL(/https:\S+/.exec(sentEmails[0].text)![0]).searchParams.get('t')!;
    const res = await handleRestoreLink(post('/api/restore-link', { token: t }));
    expect(res.status).toBe(200);
    const { token, email } = await res.json();
    expect(email).toBe('jo@example.com');
    expect(await verifyToken(token, SECRET, 'unlock')).toMatchObject({ sid: SID });
  });

  it('rejects expired, forged and wrong-type tokens', async () => {
    const expired = await signToken({ typ: 'restore', email: 'jo@example.com', exp: Date.now() - 1 }, SECRET);
    const forged = await signToken({ typ: 'restore', email: 'jo@example.com', exp: Date.now() + 60_000 }, SECRET + 'x');
    const unlock = await signToken({ typ: 'unlock', email: 'jo@example.com', sid: SID, iat: 0 }, SECRET);
    for (const token of [expired, forged, unlock, 'junk']) {
      expect((await handleRestoreLink(post('/api/restore-link', { token }))).status).toBe(401);
    }
  });

  it('refuses if the purchase was refunded after the email went out', async () => {
    const token = await signToken({ typ: 'restore', email: 'jo@example.com', exp: Date.now() + 60_000 }, SECRET);
    sessions = [];
    expect((await handleRestoreLink(post('/api/restore-link', { token }))).status).toBe(404);
  });
});
