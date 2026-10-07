import { PRICE } from '../lib/entitlement';
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
  return (
    <Sheet open={open} onClose={onClose} title="Unlock everything">
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
      <button type="button" disabled className="btn btn-primary mt-6 h-14 w-full text-lg">
        Unlock for {PRICE}
      </button>
      <p className="mt-3 text-center text-xs text-muted">Checkout is being connected (Phase 4).</p>
    </Sheet>
  );
}
