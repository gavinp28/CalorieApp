import { signToken, verifyToken, type UnlockClaims } from '../../shared/token';
import { env } from './http';
import { sessionEmail, type CheckoutSession } from './stripe';

export async function issueUnlockToken(session: CheckoutSession): Promise<{ token: string; email: string }> {
  const email = sessionEmail(session);
  const claims: UnlockClaims = { typ: 'unlock', email, sid: session.id, iat: Date.now() };
  return { token: await signToken(claims, env('UNLOCK_SECRET')), email };
}

/** Reads "Authorization: Bearer <token>" and verifies it. */
export async function unlockFromRequest(req: Request): Promise<UnlockClaims | null> {
  const m = /^Bearer (.+)$/.exec(req.headers.get('authorization') ?? '');
  if (!m) return null;
  return verifyToken(m[1], env('UNLOCK_SECRET'), 'unlock');
}
