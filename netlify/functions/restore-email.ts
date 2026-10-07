import type { Config } from '@netlify/functions';
import { signToken } from '../../shared/token';
import { sendRestoreEmail } from '../lib/email';
import { env, guard, json, readJson } from '../lib/http';
import { findPurchaseByEmail, sessionEmail } from '../lib/stripe';

export const LINK_TTL_MS = 30 * 60_000;
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/**
 * POST /api/restore-email { email }
 * If the email has a paid purchase in Stripe, emails it a sign-in link that is
 * valid for 30 minutes. Always answers the same way, so it can't be used to find
 * out who has bought.
 */
export async function handleRestoreEmail(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const { email } = await readJson<{ email: string }>(req);
  if (typeof email !== 'string' || !EMAIL_RE.test(email.trim())) return json(400, { error: 'bad_email' });

  const purchase = await findPurchaseByEmail(email);
  if (purchase) {
    // Send to the address Stripe has on file, not whatever casing was typed.
    const to = sessionEmail(purchase) || email.trim();
    const token = await signToken({ typ: 'restore', email: to, exp: Date.now() + LINK_TTL_MS }, env('UNLOCK_SECRET'));
    const site = process.env.SITE_URL || new URL(req.url).origin;
    await sendRestoreEmail(to, `${site}/restore?t=${encodeURIComponent(token)}`);
  }
  return json(200, { ok: true });
}

export default guard(handleRestoreEmail);
export const config: Config = { path: '/api/restore-email' };
