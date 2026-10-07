import { Navigate, useParams } from 'react-router';
import type { Mode, PuzzleKind } from '../../shared/types';
import { GameView } from '../components/GameView';
import { useToday } from '../lib/useToday';

/** /play/:mode/:kind/:n — an archive day or a bonus puzzle. */
export function PlayPage() {
  const { mode, kind, n } = useParams();
  const today = useToday();
  const number = Number(n);
  if ((mode !== 'food' && mode !== 'plate') || (kind !== 'daily' && kind !== 'bonus') || !Number.isInteger(number) || number < 1) {
    return <Navigate to="/archive" replace />;
  }
  if (kind === 'daily' && number === today) return <Navigate to={mode === 'plate' ? '/plate' : '/'} replace />;
  return <GameView key={`${mode}-${kind}-${number}`} mode={mode as Mode} kind={kind as PuzzleKind} number={number} today={today} />;
}
