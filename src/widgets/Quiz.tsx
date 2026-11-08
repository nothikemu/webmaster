import { useId, useState } from 'react';
import type { Question } from '@/content/types';
import { Btn, Callout } from '@/ui/primitives';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';

type Selection = number[] | boolean | null;

/** Ask a question, reveal the right answer and the reason. Returns whether the player was right. */
export function isCorrect(q: Question, sel: Selection): boolean {
  if (q.kind === 'single') return Array.isArray(sel) && sel.length === 1 && sel[0] === q.answer;
  if (q.kind === 'tf') return typeof sel === 'boolean' && sel === q.answer;
  if (q.kind === 'multi') {
    if (!Array.isArray(sel)) return false;
    return sel.length === q.answers.length && q.answers.every((a) => sel.includes(a));
  }
  return false;
}

interface Props {
  questions: readonly Question[];
  label: string;
  onDone: (correct: number) => void;
  /** Called once per question after it is checked, so callers can build a per-topic breakdown. */
  onAnswer?: (index: number, correct: boolean) => void;
  doneLabel?: string;
}

export function Quiz({ questions, label, onDone, onAnswer, doneLabel = 'Finish check' }: Props) {
  const uid = useId();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<Selection>(null);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const q = questions[i]!;
  const last = i === questions.length - 1;

  const ready = q.kind === 'tf' ? typeof sel === 'boolean' : Array.isArray(sel) && sel.length > 0;
  const toggle = (n: number) => {
    if (revealed) return;
    if (q.kind === 'single') setSel([n]);
    else setSel((prev) => (Array.isArray(prev) ? (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]) : [n]));
  };

  const check = () => {
    const ok = isCorrect(q, sel);
    setRevealed(true);
    if (ok) setCorrect((c) => c + 1);
    onAnswer?.(i, ok);
    play(ok ? 'right' : 'wrong');
  };
  const next = () => {
    if (last) {
      onDone(correct);
      return;
    }
    setI(i + 1);
    setSel(null);
    setRevealed(false);
  };

  const options: { text: string; right: boolean }[] =
    q.kind === 'tf'
      ? [
          { text: 'True', right: q.answer === true },
          { text: 'False', right: q.answer === false },
        ]
      : q.options.map((text, n) => ({ text, right: q.kind === 'single' ? n === q.answer : q.answers.includes(n) }));

  const chosen = (n: number): boolean => (q.kind === 'tf' ? sel === (n === 0) : Array.isArray(sel) && sel.includes(n));
  const wasRight = revealed && isCorrect(q, sel);
  const inputType = q.kind === 'multi' ? 'checkbox' : 'radio';

  return (
    <div className="quiz">
      <p className="label" id={`${uid}-n`}>
        {label}: question {i + 1} of {questions.length}
      </p>
      <fieldset aria-describedby={`${uid}-n`}>
        <legend>
          {q.prompt}
          {q.kind === 'multi' ? <span className="quiz__hint"> Select all that apply.</span> : null}
        </legend>
        {options.map((o, n) => {
          const state = revealed ? (o.right ? 'right' : chosen(n) ? 'wrong' : '') : '';
          return (
            <label key={n} className={`option${state ? ` option--${state}` : ''}`}>
              <input
                type={inputType}
                name={`${uid}-q${i}`}
                checked={chosen(n)}
                disabled={revealed}
                onChange={() => (q.kind === 'tf' ? setSel(n === 0) : toggle(n))}
              />
              <span>{o.text}</span>
              {revealed && state === 'right' ? (
                <span className="option__mark">
                  <Icon name="check" /> Correct
                </span>
              ) : null}
              {revealed && state === 'wrong' ? (
                <span className="option__mark">
                  <Icon name="x" /> Not this one
                </span>
              ) : null}
            </label>
          );
        })}
      </fieldset>
      {revealed ? (
        <div role="status">
          <Callout icon={wasRight ? 'check' : 'info'} tone={wasRight ? 'good' : 'bad'}>
            <p>
              <strong>{wasRight ? 'Right.' : 'Not quite.'}</strong> {q.explain}
            </p>
          </Callout>
        </div>
      ) : null}
      <div className="row quiz__actions">
        {!revealed ? (
          <Btn variant="primary" disabled={!ready} aria-disabled={!ready} onClick={check}>
            Check answer
          </Btn>
        ) : (
          <Btn variant="primary" go onClick={next}>
            {last ? doneLabel : 'Next question'}
          </Btn>
        )}
      </div>
    </div>
  );
}
