/** The Timeline of Minds: put seven milestones in order. After each guess, the Archive says how many are in the right place. */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import { Btn, Callout } from '@/ui/primitives';
import { MILESTONES, START_ORDER, correctCount, isSolved, move, placed, starsFor } from '../logic/timeline';
import type { StationProps } from './types';

const byId = Object.fromEntries(MILESTONES.map((m) => [m.id, m]));

export function Timeline({ onClear }: StationProps) {
  const [order, setOrder] = useState<string[]>([...START_ORDER]);
  const [guesses, setGuesses] = useState(0);
  const [checked, setChecked] = useState<boolean[] | null>(null);
  const [said, setSaid] = useState('');
  const cleared = useRef(false);
  const solved = checked !== null && isSolved(order) && checked.every(Boolean);

  useEffect(() => {
    if (solved && !cleared.current) {
      cleared.current = true;
      onClear();
    }
  }, [solved, onClear]);

  const shift = (i: number, d: -1 | 1) => {
    if (solved) return;
    play('place');
    setOrder((o) => move(o, i, i + d));
    setChecked(null);
    setSaid(`${byId[order[i]!]!.title} moved ${d < 0 ? 'earlier' : 'later'}, to position ${i + d + 1}.`);
  };
  const check = () => {
    const p = placed(order);
    setChecked(p);
    setGuesses((g) => g + 1);
    setSaid(`${correctCount(order)} of ${order.length} cards are in the right place.`);
    if (!isSolved(order)) play('wrong');
  };

  return (
    <div className="st st--timeline">
      <p className="st__brief">Earliest at the top. Move cards with the arrows, then press Check. Cards in the right place show their year and what they taught.</p>
      <ol className="cards">
        {order.map((id, i) => {
          const m = byId[id]!;
          const ok = checked?.[i];
          return (
            <li key={id} className={`tcard${ok ? ' is-ok' : ''}`}>
              <div className="tcard__move">
                <Btn small variant="quiet" aria-label={`Move ${m.title} earlier`} disabled={i === 0 || solved} onClick={() => shift(i, -1)}><Icon name="arrow-left" className="rot-up" /></Btn>
                <Btn small variant="quiet" aria-label={`Move ${m.title} later`} disabled={i === order.length - 1 || solved} onClick={() => shift(i, 1)}><Icon name="arrow-right" className="rot-down" /></Btn>
              </div>
              <div className="tcard__body">
                <p className="tcard__title">{ok ? <><strong>{m.year}</strong> &middot; </> : null}{m.title}</p>
                <p>{m.clue}</p>
                {ok ? <p className="tcard__lesson"><Icon name="check" /> {m.lesson}</p> : null}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="row">
        <Btn variant="primary" icon="check" onClick={check} disabled={solved}>Check the order</Btn>
        <span className="st__meter" aria-live="polite">Guesses: <strong>{guesses}</strong>{checked ? <> &middot; <strong>{correctCount(order)}</strong> of {order.length} in place</> : null}</span>
      </div>
      {solved ? <Callout icon="check" tone="good">Solved in {guesses} {guesses === 1 ? 'guess' : 'guesses'}: {'★'.repeat(starsFor(guesses))}{'☆'.repeat(3 - starsFor(guesses))}. The jumps came when new methods met more data and faster hardware.</Callout> : null}
      <p className="visually-hidden" role="status">{said}</p>
    </div>
  );
}
