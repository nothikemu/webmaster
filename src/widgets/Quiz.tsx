import { useId, useState } from 'react';
import type { Question } from '@/content/types';
import { Btn, Callout } from '@/ui/primitives';

type Selection = number[] | boolean | null;

/** Whether a selection answers the question correctly. */
export function isCorrect(q: Question, sel: Selection): boolean {
  if (q.kind === 'single') return Array.isArray(sel) && sel.length === 1 && sel[0] === q.answer;
  if (q.kind === 'tf') return typeof sel === 'boolean' && sel === q.answer;
  if (q.kind === 'multi') {
    if (!Array.isArray(sel)) return false;
    return sel.length === q.answers.length && q.answers.every((a) => sel.includes(a));
  }
  return false;
}

/**
 * A knowledge check. It is for you: untimed, unscored, and it never unlocks anything. After each answer you see an explanation,
 * and you can answer the same question again. Nothing is counted and nothing is saved.
 */
export function Check({ questions, label = 'Check your understanding' }: { questions: readonly Question[]; label?: string }) {
  const uid = useId();
  const [i, setI] = useState(0);
  const [sel, setSel] = useState<Selection>(null);
  const [revealed, setRevealed] = useState(false);
  const [finished, setFinished] = useState(false);
  const q = questions[i]!;
  const last = i === questions.length - 1;

  const ready = q.kind === 'tf' ? typeof sel === 'boolean' : Array.isArray(sel) && sel.length > 0;
  const toggle = (n: number) => {
    if (revealed) return;
    if (q.kind === 'single') setSel([n]);
    else setSel((prev) => (Array.isArray(prev) ? (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]) : [n]));
  };
  const again = () => {
    setSel(null);
    setRevealed(false);
  };
  const next = () => {
    if (last) {
      setFinished(true);
      return;
    }
    setI(i + 1);
    again();
  };
  const restart = () => {
    setI(0);
    setFinished(false);
    again();
  };

  if (finished) {
    return (
      <div className="check" role="status">
        <p className="label">{label}</p>
        <p className="check__done">That was the last question. Nothing was counted, so go back to any answer you want to think about again.</p>
        <div className="row">
          <Btn variant="quiet" icon="reset" onClick={restart}>
            Go through the questions again
          </Btn>
        </div>
      </div>
    );
  }

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
    <div className="check">
      <p className="label" id={`${uid}-n`}>
        {label} · question {i + 1} of {questions.length}
      </p>
      <fieldset aria-describedby={`${uid}-n`}>
        <legend>
          {q.prompt}
          {q.kind === 'multi' ? <span className="check__hint"> Select all that apply.</span> : null}
        </legend>
        {options.map((o, n) => {
          const state = revealed ? (o.right ? 'right' : chosen(n) ? 'wrong' : '') : '';
          return (
            <label key={n} className={`option${state ? ` option--${state}` : ''}`}>
              <input type={inputType} name={`${uid}-q${i}`} checked={chosen(n)} disabled={revealed} onChange={() => (q.kind === 'tf' ? setSel(n === 0) : toggle(n))} />
              <span>{o.text}</span>
              {revealed && state === 'right' ? <span className="option__mark">Correct</span> : null}
              {revealed && state === 'wrong' ? <span className="option__mark">Not this one</span> : null}
            </label>
          );
        })}
      </fieldset>
      {revealed ? (
        <div role="status">
          <Callout icon={wasRight ? 'check' : 'info'} tone={wasRight ? 'good' : 'bad'}>
            <p>
              <strong>{wasRight ? 'That holds up.' : 'Not quite.'}</strong> {q.explain}
            </p>
          </Callout>
        </div>
      ) : null}
      <div className="row check__actions">
        {!revealed ? (
          <Btn variant="primary" disabled={!ready} aria-disabled={!ready} onClick={() => setRevealed(true)}>
            Check my answer
          </Btn>
        ) : (
          <>
            <Btn variant="primary" go onClick={next}>
              {last ? 'Finish' : 'Next question'}
            </Btn>
            {!wasRight ? (
              <Btn variant="quiet" icon="reset" onClick={again}>
                Try this question again
              </Btn>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
