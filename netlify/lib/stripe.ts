import { env, optionalEnv } from './http';

/** The one product: $3.99, one-time. */
export const PRICE_CENTS = 399;
export const CURRENCY = 'usd';

export const SESSION_ID_RE = /^cs_(test|live)_[A-Za-z0-9]{10,200}$/;

interface Charge {
  refunded?: boolean;
}
interface PaymentIntent {
  status?: string;
  latest_charge?: Charge | string | null;
}
export interface CheckoutSession {
  id: string;
  mode?: string;
  status?: string | null;
  payment_status?: string;
  amount_total?: number | null;
  currency?: string | null;
  payment_link?: string | null;
  customer_details?: { email?: string | null } | null;
  customer_email?: string | null;
  payment_intent?: PaymentIntent | string | null;
}

export type Rejection = 'not_found' | 'not_paid' | 'wrong_product' | 'refunded';

async function stripeGet<T>(path: string): Promise<T | null> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    headers: { authorization: `Bearer ${env('STRIPE_SECRET_KEY')}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Stripe ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

export const sessionEmail = (s: CheckoutSession) => (s.customer_details?.email || s.customer_email || '').trim();

/** Why a session doesn't count as a purchase of the unlock, or null if it does. */
export function checkSession(s: CheckoutSession): Rejection | null {
  if (s.status !== 'complete' || s.payment_status !== 'paid') return 'not_paid';
  if (s.amount_total !== PRICE_CENTS || s.currency !== CURRENCY) return 'wrong_product';
  // Optional, recommended: only accept sessions from our Payment Link (plink_...).
  const link = optionalEnv('STRIPE_PAYMENT_LINK_ID');
  if (link && s.payment_link !== link) return 'wrong_product';
  const pi = s.payment_intent;
  if (pi && typeof pi === 'object' && pi.latest_charge && typeof pi.latest_charge === 'object' && pi.latest_charge.refunded) {
    return 'refunded';
  }
  return null;
}

export async function verifySession(sessionId: string): Promise<{ session: CheckoutSession } | { rejected: Rejection }> {
  if (!SESSION_ID_RE.test(sessionId)) return { rejected: 'not_found' };
  const s = await stripeGet<CheckoutSession>(`checkout/sessions/${sessionId}?expand[]=payment_intent.latest_charge`);
  if (!s) return { rejected: 'not_found' };
  const rejected = checkSession(s);
  return rejected ? { rejected } : { session: s };
}

/**
 * Finds a valid purchase made with this email. Stripe's filter is an exact match,
 * so we try the address as typed, lowercased, and with a capital first letter
 * (phones often auto-capitalize it at checkout).
 */
export async function findPurchaseByEmail(email: string): Promise<CheckoutSession | null> {
  const typed = email.trim();
  const lower = typed.toLowerCase();
  const variants = [...new Set([typed, lower, lower.charAt(0).toUpperCase() + lower.slice(1)])];
  for (const e of variants) {
    const list = await stripeGet<{ data: CheckoutSession[] }>(
      `checkout/sessions?limit=100&status=complete&customer_details[email]=${encodeURIComponent(e)}&expand[]=data.payment_intent.latest_charge`,
    );
    const hit = list?.data.find((s) => checkSession(s) === null);
    if (hit) return hit;
  }
  return null;
}
