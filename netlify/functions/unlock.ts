import type { Config } from '@netlify/functions';
import { guard, json, readJson } from '../lib/http';
import { verifySession } from '../lib/stripe';
import { issueUnlockToken } from '../lib/unlock';

/**
 * POST /api/unlock { session_id }
 * Used by the after-payment redirect (/unlock?session_id=...) and by personal
 * restore links. Verifies the Checkout Session with Stripe, then returns a
 * signed unlock token.
 */
export async function handleUnlock(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  const { session_id } = await readJson<{ session_id: string }>(req);
  if (typeof session_id !== 'string') return json(400, { error: 'bad_request' });

  const result = await verifySession(session_id.trim());
  if ('rejected' in result) return json(result.rejected === 'not_found' ? 404 : 402, { error: result.rejected });
  return json(200, await issueUnlockToken(result.session));
}

export default guard(handleUnlock);
export const config: Config = { path: '/api/unlock' };
