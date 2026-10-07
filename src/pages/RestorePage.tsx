import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { requestRestoreEmail, UnlockError } from '../lib/api';
import { sessionIdFrom, useUnlock } from '../lib/entitlement';
import { ERROR_TEXT, UnlockFailed, UnlockSuccess, useUnlockExchange, Working } from './UnlockPage';

/**
 * /restore                      → restore by email, or paste a personal restore link
 * /restore?session_id=cs_...    → personal restore link (from the unlock screen)
 * /restore?t=...                → link from the restore email
 */
export function RestorePage() {
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const emailToken = params.get('t');
  if (sessionId || emailToken) return <Exchange sessionId={sessionId} emailToken={emailToken} />;
  return <RestoreForms />;
}

function Exchange(props: { sessionId: string | null; emailToken: string | null }) {
  const { state, retry } = useUnlockExchange(props);
  if (state.s === 'working') return <Working text="Restoring your purchase…" />;
  if (state.s === 'error')
    return <UnlockFailed code={state.code} onRetry={state.code === 'network' || state.code === 'server' ? retry : null} />;
  return <UnlockSuccess unlock={state.unlock} fresh />;
}

function RestoreForms() {
  const unlock = useUnlock();
  const [, setParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [link, setLink] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [linkError, setLinkError] = useState('');

  const sendEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await requestRestoreEmail(email.trim());
      setSentTo(email.trim());
    } catch (err) {
      setError(ERROR_TEXT[err instanceof UnlockError ? err.code : 'server'][1]);
    } finally {
      setBusy(false);
    }
  };

  const useLink = (e: FormEvent) => {
    e.preventDefault();
    const sid = sessionIdFrom(link);
    if (!sid) return setLinkError('That doesn’t look like a restore link. It contains “session_id=cs_…”.');
    setParams({ session_id: sid });
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="font-display mt-2 text-4xl text-ink">Restore purchase</h1>
      <p className="mt-1 text-muted">Bought the unlock on another device or browser? Bring it here.</p>

      {unlock && (
        <p className="mt-5 rounded-2xl bg-surface-2 p-4 text-sm text-ink" role="status">
          ✅ This device is already unlocked for <strong>{unlock.email}</strong>.
        </p>
      )}

      <section className="card mt-5 p-6" aria-labelledby="by-email">
        <h2 id="by-email" className="font-display text-xl text-ink">
          With your email
        </h2>
        {sentTo ? (
          <div role="status" className="mt-2">
            <p className="text-ink">
              📬 If <strong>{sentTo}</strong> was used to buy, a restore link is on its way. It works for 30 minutes.
            </p>
            <p className="mt-2 text-sm text-muted">
              Nothing after a few minutes? Check spam, or make sure it’s the email you used at checkout.
            </p>
            <button type="button" className="mt-3 text-sm font-semibold text-primary" onClick={() => setSentTo('')}>
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={sendEmail} className="mt-2">
            <p className="text-sm text-muted">We’ll email a one-tap restore link to the address you used at checkout.</p>
            <label htmlFor="restore-email" className="sr-only">
              Email used at checkout
            </label>
            <input
              id="restore-email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!error}
              aria-describedby="restore-email-error"
              className="mt-3 h-12 w-full rounded-xl bg-surface-2 px-4 text-ink placeholder:text-muted"
            />
            <p id="restore-email-error" className="mt-1 text-sm text-primary" aria-live="polite">
              {error}
            </p>
            <button type="submit" disabled={busy || !email} className="btn btn-primary mt-2 h-12 w-full">
              {busy ? 'Sending…' : 'Email me a restore link'}
            </button>
          </form>
        )}
      </section>

      <section className="card mt-4 p-6" aria-labelledby="by-link">
        <h2 id="by-link" className="font-display text-xl text-ink">
          With your restore link
        </h2>
        <form onSubmit={useLink} className="mt-2">
          <p className="text-sm text-muted">Paste the personal link you saved after buying.</p>
          <label htmlFor="restore-link" className="sr-only">
            Personal restore link
          </label>
          <input
            id="restore-link"
            placeholder="https://calorieguesser.com/restore?session_id=…"
            value={link}
            onChange={(e) => {
              setLink(e.target.value);
              setLinkError('');
            }}
            aria-invalid={!!linkError}
            aria-describedby="restore-link-error"
            className="mt-3 h-12 w-full rounded-xl bg-surface-2 px-4 text-sm text-ink placeholder:text-muted"
          />
          <p id="restore-link-error" className="mt-1 text-sm text-primary" aria-live="polite">
            {linkError}
          </p>
          <button type="submit" disabled={!link} className="btn mt-2 h-12 w-full bg-ink text-bg">
            Restore
          </button>
        </form>
      </section>
    </div>
  );
}
