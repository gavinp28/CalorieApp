import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Confetti } from '../components/Confetti';
import { ShareIcon } from '../components/Icons';
import { useToast } from '../components/Toast';
import { UnlockError, unlockWithEmailLink, unlockWithSession, type UnlockErrorCode } from '../lib/api';
import { haptic } from '../lib/feedback';
import { restoreLinkFor, saveUnlock, type Unlock } from '../lib/entitlement';

type State = { s: 'working' } | { s: 'done'; unlock: Unlock } | { s: 'error'; code: UnlockErrorCode };

export const ERROR_TEXT: Record<UnlockErrorCode, [string, string]> = {
  not_paid: ['Payment not finished', 'Stripe hasn’t confirmed this payment yet. If you just paid, wait a few seconds and try again.'],
  not_found: ['We couldn’t find that purchase', 'Check the link, or restore with the email you used at checkout.'],
  wrong_product: ['That purchase isn’t the unlock', 'This payment wasn’t for the archive unlock. Contact us if that looks wrong.'],
  refunded: ['This purchase was refunded', 'Refunded purchases no longer unlock the archive.'],
  link_expired: ['That link has expired', 'Email links work for 30 minutes. Request a new one below.'],
  bad_email: ['That email doesn’t look right', 'Check the address and try again.'],
  network: ['You’re offline', 'Check your connection and try again.'],
  server: ['Something went wrong', 'Please try again in a minute.'],
};

/**
 * Exchanges a Checkout Session ID or an emailed link token for an unlock, once.
 * Shared by /unlock (after payment) and /restore (restore links).
 */
export function useUnlockExchange(input: { sessionId?: string | null; emailToken?: string | null }) {
  const [state, setState] = useState<State>({ s: 'working' });
  const [attempt, setAttempt] = useState(0);
  const started = useRef('');

  useEffect(() => {
    const key = `${input.sessionId}|${input.emailToken}|${attempt}`;
    if (started.current === key) return; // StrictMode runs effects twice in dev
    started.current = key;
    setState({ s: 'working' });
    const run = input.emailToken ? unlockWithEmailLink(input.emailToken) : unlockWithSession(input.sessionId ?? '');
    run
      .then((unlock) => {
        saveUnlock(unlock);
        haptic('win');
        setState({ s: 'done', unlock });
      })
      .catch((e: unknown) => setState({ s: 'error', code: e instanceof UnlockError ? e.code : 'server' }));
  }, [input.sessionId, input.emailToken, attempt]);

  return { state, retry: () => setAttempt((a) => a + 1) };
}

/** /unlock?session_id=cs_... — where Stripe sends buyers after paying. */
export function UnlockPage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const { state, retry } = useUnlockExchange({ sessionId });

  if (!sessionId) return <UnlockFailed code="not_found" onRetry={null} />;
  if (state.s === 'working') return <Working text="Confirming your payment with Stripe…" />;
  if (state.s === 'error')
    return (
      <UnlockFailed
        code={state.code}
        onRetry={state.code === 'not_paid' || state.code === 'network' || state.code === 'server' ? retry : null}
      />
    );
  return <UnlockSuccess unlock={state.unlock} fresh />;
}

export function Working({ text }: { text: string }) {
  return (
    <div className="card mx-auto mt-6 max-w-md p-10 text-center" aria-busy="true">
      <div className="mx-auto size-12 animate-spin rounded-full border-4 border-surface-2 border-t-primary" aria-hidden />
      <p className="mt-5 font-semibold text-ink" role="status">
        {text}
      </p>
    </div>
  );
}

export function UnlockFailed({ code, onRetry }: { code: UnlockErrorCode; onRetry: (() => void) | null }) {
  const [title, body] = ERROR_TEXT[code];
  return (
    <div className="card animate-fade-up mx-auto mt-6 max-w-md p-8 text-center">
      <p className="text-5xl" aria-hidden>
        🧾
      </p>
      <h1 className="font-display mt-3 text-2xl text-ink">{title}</h1>
      <p className="mt-2 text-muted">{body}</p>
      <div className="mt-6 flex flex-col gap-2">
        {onRetry && (
          <button type="button" className="btn btn-primary h-12" onClick={onRetry}>
            Try again
          </button>
        )}
        <Link to="/restore" className="btn h-12 bg-surface-2 text-ink">
          Restore with email
        </Link>
      </div>
    </div>
  );
}

export function UnlockSuccess({ unlock, fresh }: { unlock: Unlock; fresh: boolean }) {
  const toast = useToast();
  const link = unlock.sessionId ? restoreLinkFor(unlock.sessionId) : null;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link!);
      toast('Restore link copied');
    } catch {
      toast('Select the link and copy it');
    }
  };

  return (
    <div className="card animate-fade-up relative mx-auto mt-6 max-w-md overflow-visible p-8 text-center">
      {fresh && <Confetti />}
      <p className="text-6xl" aria-hidden>
        🎉
      </p>
      <h1 className="font-display mt-3 text-3xl text-ink">Everything’s unlocked</h1>
      <p className="mt-2 text-muted">
        Every past day and all 80 bonus puzzles, in both modes. Unlocked for <strong className="text-ink">{unlock.email}</strong>.
      </p>

      {link && (
        <div className="mt-6 rounded-2xl bg-surface-2 p-4 text-left">
          <p className="text-sm font-bold text-ink">Your personal restore link</p>
          <p className="mt-1 text-sm text-muted">
            Save it somewhere safe. It unlocks any device or browser. You can also restore with your email.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              readOnly
              value={link}
              aria-label="Personal restore link"
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 rounded-xl bg-surface px-3 py-2 font-mono text-xs text-ink"
            />
            <button type="button" onClick={copy} className="btn h-10 shrink-0 bg-ink px-4 text-sm text-bg">
              <ShareIcon className="size-4" /> Copy
            </button>
          </div>
        </div>
      )}

      <Link to="/archive" className="btn btn-primary mt-6 h-14 w-full text-lg">
        Open the archive
      </Link>
    </div>
  );
}
