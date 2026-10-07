import type { Config } from '@netlify/functions';
import { verifyToken } from '../../shared/token';
import { env, guard, json, readJson } from '../lib/http';
import { findPurchaseByEmail } from '../lib/stripe';
import { issueUnlockToken } from '../lib/unlock';

/**
 * POST /api/restore-link { token }
 * Exchanges the emailed link's token for an unlock token, re-checking Stripe so
 * a refund in the meantime is respected.
 */
export async function handleRestoreLink(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const { token } = await readJson<{ token: string }>(req);
  const claims = typeof token === 'string' ? await verifyToken(token, env('UNLOCK_SECRET'), 'restore') : null;
  if (!claims) return json(401, { error: 'link_expired' });

  const purchase = await findPurchaseByEmail(claims.email);
  if (!purchase) return json(404, { error: 'not_found' });
  return json(200, await issueUnlockToken(purchase));
}

export default guard(handleRestoreLink);
export const config: Config = { path: '/api/restore-link' };
