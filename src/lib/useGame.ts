import { useCallback, useEffect, useState } from 'react';
import { answerRange, gameStatus, gradeGuess, MAX_GUESSES, type Grade } from '../../shared/grading';
import { puzzleId, type Mode, type Puzzle, type PuzzleKind } from '../../shared/types';
import { fetchPuzzle, PuzzleError, type PuzzleErrorCode } from './api';
import { load, save } from './storage';

/** What we keep per puzzle so a refresh resumes mid-game and finished games stay finished. */
interface SavedGame {
  guesses: number[];
}

/** Finished-game record, used by stats and the archive (Phase 3). */
export interface GameResult {
  id: string;
  mode: Mode;
  kind: PuzzleKind;
  number: number;
  won: boolean;
  guesses: number[];
  /** Missing on results imported from the prototype. */
  answer?: number;
  emoji?: string;
  name?: string;
  /** True when a daily was finished on its own day (counts toward streaks). */
  onTheDay: boolean;
  finishedAt: string;
}

export const resultsKey = (mode: Mode) => `results:${mode}`;

export type GameLoad = { state: 'loading' } | { state: 'error'; code: PuzzleErrorCode } | { state: 'ready'; puzzle: Puzzle };

export function useGame(mode: Mode, kind: PuzzleKind, number: number, today: number) {
  const id = puzzleId(mode, kind, number);
  const [load_, setLoad] = useState<GameLoad>({ state: 'loading' });
  const [guesses, setGuesses] = useState<number[]>(() => load<SavedGame>(`game:${id}`, { guesses: [] }).guesses);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setGuesses(load<SavedGame>(`game:${id}`, { guesses: [] }).guesses);
    const ctrl = new AbortController();
    setLoad({ state: 'loading' });
    fetchPuzzle(mode, kind, number, ctrl.signal)
      .then((puzzle) => setLoad({ state: 'ready', puzzle }))
      .catch((e: unknown) => {
        if (e instanceof PuzzleError) setLoad({ state: 'error', code: e.code });
        else if ((e as Error).name !== 'AbortError') setLoad({ state: 'error', code: 'server' });
      });
    return () => ctrl.abort();
  }, [id, mode, kind, number, attempt]);

  const puzzle = load_.state === 'ready' ? load_.puzzle : null;
  const answer = puzzle?.kcal ?? 0;
  const status = puzzle ? gameStatus(guesses, answer) : 'playing';
  const grades: Grade[] = puzzle ? guesses.map((g) => gradeGuess(g, answer)) : [];
  const range = answerRange(guesses, answer);

  const submit = useCallback(
    (guess: number): Grade | null => {
      if (!puzzle || gameStatus(guesses, puzzle.kcal) !== 'playing' || guesses.length >= MAX_GUESSES) return null;
      const next = [...guesses, guess];
      setGuesses(next);
      save(`game:${id}`, { guesses: next } satisfies SavedGame);

      const after = gameStatus(next, puzzle.kcal);
      if (after !== 'playing') {
        const results = load<Record<string, GameResult>>(resultsKey(mode), {});
        if (!results[id]) {
          results[id] = {
            id,
            mode,
            kind,
            number,
            won: after === 'won',
            guesses: next,
            answer: puzzle.kcal,
            emoji: puzzle.emoji,
            name: puzzle.name,
            onTheDay: kind === 'daily' && number === today,
            finishedAt: new Date().toISOString(),
          };
          save(resultsKey(mode), results);
        }
      }
      return gradeGuess(guess, puzzle.kcal);
    },
    [puzzle, guesses, id, mode, kind, number, today],
  );

  return { load: load_, puzzle, guesses, grades, status, range, submit, retry: () => setAttempt((a) => a + 1) };
}
