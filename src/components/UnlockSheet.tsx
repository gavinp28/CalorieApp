import { Link } from 'react-router';
import { PAYMENT_LINK, PRICE, useUnlock } from '../lib/entitlement';
import { Sheet } from './Sheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

const PERKS = [
  ['🗂️', 'Every past day', 'The full archive in both modes, not just the last 5 days'],
  ['🎁', '80 bonus puzzles', '40 Single food + 40 Full plate that never appear as dailies'],
  ['♾️', 'Yours for good', 'One payment, no subscription. Restore on any device with your email'],
];

export function UnlockSheet({ open, onClose }: Props) {
  const unlock = useUnlock();
  return (
    <Sheet open={open} onClose={onClose} title={unlock ? 'You’re unlocked' : 'Unlock everything'}>
      {unlock ? (
        <p className="text-muted">
          Everything is unlocked on this device for <strong className="text-ink">{unlock.email}</strong>. Enjoy the archive!
        </p>
      ) : (
        <>
          <p className="text-muted">One purchase unlocks both modes.</p>
          <ul className="mt-5 space-y-3">
            {PERKS.map(([emoji, title, body]) => (
              <li key={title} className="flex gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-surface-2 text-xl" aria-hidden>
                  {emoji}
                </span>
                <span>
                  <span className="block font-bold text-ink">{title}</span>
                  <span className="block text-sm text-muted">{body}</span>
                </span>
              </li>
            ))}
          </ul>
          {/* Same tab: Stripe redirects back to /unlock when payment completes. */}
          <a href={PAYMENT_LINK} className="btn btn-primary mt-6 h-14 w-full text-lg">
            Unlock for {PRICE}
          </a>
          <p className="mt-3 text-center text-xs text-muted">Secure checkout by Stripe. Use an email you can reach to restore later.</p>
          <p className="mt-4 text-center text-sm">
            Already bought?{' '}
            <Link to="/restore" onClick={onClose} className="font-semibold text-primary underline-offset-2 hover:underline">
              Restore your purchase
            </Link>
          </p>
        </>
      )}
    </Sheet>
  );
}
