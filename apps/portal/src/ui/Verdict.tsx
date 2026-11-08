import type { CSSProperties, ReactNode, Ref } from 'react';
import { t } from '../core/assets';

/**
 * The result screen of a check or a challenge: a page of the ledger with a rubber stamp on it and a tally of the
 * score cut in ink, a stroke for each point and a slash through every fifth. The stamp says Cleared in red or
 * Not yet in ink; the word, not the color, carries the state. It is a status region, so a screen reader
 * announces it, and it takes focus when it appears.
 */
const LEAN = [-2, 1.5, -1, 2, 0];

function Tally({ n }: { n: number }): ReactNode {
  const groups = Math.ceil(n / 5);
  return (
    <div className="tally" aria-hidden="true">
      {Array.from({ length: groups }, (_, g) => {
        const count = Math.min(5, n - g * 5);
        return (
          <span key={g} className="tally-group">
            {Array.from({ length: Math.min(4, count) }, (_, i) => (
              <i key={i} style={{ '--r': `${LEAN[(g + i) % 5]}deg` } as CSSProperties} />
            ))}
            {count === 5 && <i data-slash="true" />}
          </span>
        );
      })}
    </div>
  );
}

export function Verdict({
  passed,
  score,
  total,
  note,
  detail,
  actions,
  innerRef,
}: {
  passed: boolean;
  score: number;
  total: number;
  note: string;
  detail?: string | undefined;
  actions: ReactNode;
  innerRef?: Ref<HTMLDivElement>;
}): ReactNode {
  const word = passed ? t('verdict.cleared') : t('verdict.notYet');
  return (
    <div
      className="verdict glass"
      data-state={passed ? 'cleared' : 'notyet'}
      ref={innerRef}
      tabIndex={-1}
      role="status"
    >
      <p className="verdict-stamp">{word}</p>
      <div className="verdict-sheet">
        <p className="num quiz-score">
          {score}
          <span className="muted"> / {total}</span>
        </p>
        <Tally n={score} />
        <p>{note}</p>
        {detail && <p>{detail}</p>}
        <div className="check-actions">{actions}</div>
      </div>
    </div>
  );
}
