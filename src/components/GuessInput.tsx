import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { MAX_GUESSES, parseGuess } from '../../shared/grading';

interface Props {
  guessCount: number;
  previous: number[];
  onGuess: (n: number) => void;
}

export function GuessInput({ guessCount, previous, onGuess }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();

  // Desktop keeps focus in the box between guesses; on touch devices this would
  // pop the keyboard over the food card, so we leave it alone there.
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
  }, [guessCount]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const n = parseGuess(value);
    if (n == null) return setError('Enter a whole number from 1 to 9,999.');
    if (previous.includes(n)) return setError(`You already guessed ${n.toLocaleString()}.`);
    setError('');
    setValue('');
    onGuess(n);
  };

  const left = MAX_GUESSES - guessCount;

  return (
    <form onSubmit={submit} noValidate className="card p-3">
      <label htmlFor="guess" className="sr-only">
        Your guess, in calories
      </label>
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            id="guess"
            name="guess"
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="go"
            placeholder="Your guess"
            value={value}
            onChange={(e) => {
              setValue(e.target.value.replace(/[^\d,]/g, '').slice(0, 6));
              if (error) setError('');
            }}
            aria-invalid={!!error}
            aria-describedby={hintId}
            className="h-14 w-full rounded-2xl bg-surface-2 pl-5 pr-16 font-display text-2xl tabular-nums text-ink placeholder:font-sans placeholder:text-lg placeholder:font-medium placeholder:text-muted focus:outline-none focus-visible:outline-3 focus-visible:outline-primary"
          />
          <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted">kcal</span>
        </div>
        <button type="submit" className="btn btn-primary h-14 px-6 text-lg" disabled={!value}>
          Guess
        </button>
      </div>
      <p id={hintId} className={`px-2 pt-2 text-sm font-medium ${error ? 'text-primary' : 'text-muted'}`} aria-live="polite">
        {error || `${left} ${left === 1 ? 'guess' : 'guesses'} left · within 5% wins`}
      </p>
    </form>
  );
}
