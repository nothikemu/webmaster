import { useId, useState } from 'react';
import type { ChooserConfig, ClaimReviewConfig, SorterConfig } from '@/content/types';
import { Btn, Callout } from '@/ui/primitives';
import type { WidgetProps } from './types';

/**
 * Generic guided experiments. None of them keeps a score: each one says, item by item, why an answer fits or does not,
 * and every one can be cleared and tried again as often as you like.
 */

/** Sort each item into the bin it belongs to. After you check, every item explains itself. */
export function Sorter({ spec }: WidgetProps) {
  const cfg = spec.config as SorterConfig;
  const uid = useId();
  const [picks, setPicks] = useState<(string | null)[]>(() => cfg.items.map(() => null));
  const [checked, setChecked] = useState(false);
  const allFit = cfg.items.every((it, i) => picks[i] === it.bin);
  const all = picks.every(Boolean);

  const reset = () => {
    setPicks(cfg.items.map(() => null));
    setChecked(false);
  };

  return (
    <div className="stack">
      {cfg.items.map((it, i) => {
        const fits = picks[i] === it.bin;
        return (
          <fieldset key={i} className="sort-item">
            <legend>
              <span className="label">Item {i + 1}</span>
              <br />
              {it.text}
            </legend>
            <div className="sort-bins">
              {cfg.bins.map((b) => {
                const state = checked ? (b.id === it.bin ? 'right' : picks[i] === b.id ? 'wrong' : '') : '';
                return (
                  <label key={b.id} className={`option${state ? ` option--${state}` : ''}`}>
                    <input type="radio" name={`${uid}-${i}`} checked={picks[i] === b.id} disabled={checked} onChange={() => setPicks((p) => p.map((v, j) => (j === i ? b.id : v)))} />
                    <span>{b.label}</span>
                    {state === 'right' ? <span className="option__mark">Fits</span> : null}
                    {state === 'wrong' ? <span className="option__mark">Does not fit</span> : null}
                  </label>
                );
              })}
            </div>
            {checked ? (
              <Callout icon={fits ? 'check' : 'info'} tone={fits ? 'good' : 'bad'}>
                <p>{it.why}</p>
              </Callout>
            ) : null}
          </fieldset>
        );
      })}
      <div className="row" role="status">
        {!checked ? (
          <Btn variant="primary" disabled={!all} aria-disabled={!all} onClick={() => setChecked(true)}>
            Check my sorting
          </Btn>
        ) : (
          <>
            <p className="note">{allFit ? 'Every item fits. The reasons above are still worth a read.' : 'Some items did not fit. Read the reasons, then clear and try again.'}</p>
            <Btn variant="quiet" icon="reset" onClick={reset}>
              Clear and try again
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}

/** One decision at a time, with an explanation after each. Also builds a prompt as you go when `assemble` is set. */
export function Chooser({ spec, assemble }: WidgetProps & { assemble?: boolean }) {
  const cfg = spec.config as ChooserConfig;
  const uid = useId();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => cfg.steps.map(() => null));
  const [done, setDone] = useState(false);
  const [shown, setShown] = useState(false);
  const s = cfg.steps[step]!;
  const choice = picked[step] ?? null;

  const next = () => {
    if (step === cfg.steps.length - 1) {
      setDone(true);
      return;
    }
    setStep(step + 1);
    setShown(false);
  };
  const restart = () => {
    setStep(0);
    setPicked(cfg.steps.map(() => null));
    setShown(false);
    setDone(false);
  };

  const built = assemble ? cfg.steps.map((st, i) => (picked[i] === null || picked[i] === undefined ? null : st.options[picked[i]!])).filter(Boolean) : [];

  return (
    <div className="stack">
      {assemble ? (
        <div className="prompt-sheet" aria-live="polite">
          <p className="label">Your prompt so far</p>
          <p className="prompt-sheet__text">{built.length ? built.join(' ') : 'Pick a sentence for each part. Your prompt builds here.'}</p>
        </div>
      ) : null}
      {!done ? (
        <>
          <fieldset>
            <legend>
              <span className="label">
                Step {step + 1} of {cfg.steps.length}
              </span>
              <br />
              {s.prompt}
            </legend>
            {s.options.map((o, n) => {
              const state = shown ? (n === s.answer ? 'right' : choice === n ? 'wrong' : '') : '';
              return (
                <label key={n} className={`option${state ? ` option--${state}` : ''}`}>
                  <input type="radio" name={`${uid}-${step}`} checked={choice === n} disabled={shown} onChange={() => setPicked((p) => p.map((v, i) => (i === step ? n : v)))} />
                  <span>{o}</span>
                  {state === 'right' ? <span className="option__mark">Strongest choice</span> : null}
                  {state === 'wrong' ? <span className="option__mark">Not this one</span> : null}
                </label>
              );
            })}
          </fieldset>
          {shown ? (
            <div role="status">
              <Callout icon={choice === s.answer ? 'check' : 'info'} tone={choice === s.answer ? 'good' : 'bad'}>
                <p>{s.why}</p>
              </Callout>
            </div>
          ) : null}
          <div className="row">
            {!shown ? (
              <Btn variant="primary" disabled={choice === null} aria-disabled={choice === null} onClick={() => setShown(true)}>
                Show the reasoning
              </Btn>
            ) : (
              <Btn variant="primary" go onClick={next}>
                {step === cfg.steps.length - 1 ? 'Finish' : 'Next step'}
              </Btn>
            )}
          </div>
        </>
      ) : (
        <div role="status" className="stack">
          <p className="note">That is every step.</p>
          {assemble ? (
            <Callout icon="info">
              <p>A prompt with a clear task, context, audience, format and limits gives the model more to work with. It also gives you something to check the result against.</p>
            </Callout>
          ) : null}
          <Btn variant="quiet" icon="reset" onClick={restart}>
            Go through it again
          </Btn>
        </div>
      )}
    </div>
  );
}

type Verdict = 'solid' | 'check' | 'false';
const VERDICTS: { id: Verdict; label: string }[] = [
  { id: 'solid', label: 'Solid' },
  { id: 'check', label: 'Needs checking' },
  { id: 'false', label: 'Wrong or invented' },
];

/** Read an AI-written paragraph and decide, claim by claim, what to do with it. */
export function ClaimReview({ spec }: WidgetProps) {
  const cfg = spec.config as ClaimReviewConfig;
  const uid = useId();
  const [picks, setPicks] = useState<(Verdict | null)[]>(() => cfg.claims.map(() => null));
  const [checked, setChecked] = useState(false);
  const allMatch = cfg.claims.every((c, i) => picks[i] === c.verdict);
  const all = picks.every(Boolean);

  const reset = () => {
    setPicks(cfg.claims.map(() => null));
    setChecked(false);
  };

  return (
    <div className="stack">
      <blockquote className="ai-text">
        <p className="label">What the AI wrote</p>
        <p>{cfg.source}</p>
      </blockquote>
      {cfg.claims.map((c, i) => {
        const matches = picks[i] === c.verdict;
        return (
          <fieldset key={i} className="claim">
            <legend>
              <span className="label">Claim {i + 1}</span>
              <br />
              <q>{c.text}</q>
            </legend>
            <div className="claim__opts">
              {VERDICTS.map((v) => {
                const state = checked ? (v.id === c.verdict ? 'right' : picks[i] === v.id ? 'wrong' : '') : '';
                return (
                  <label key={v.id} className={`option${state ? ` option--${state}` : ''}`}>
                    <input type="radio" name={`${uid}-${i}`} checked={picks[i] === v.id} disabled={checked} onChange={() => setPicks((p) => p.map((x, j) => (j === i ? v.id : x)))} />
                    <span>{v.label}</span>
                    {state === 'right' ? <span className="option__mark">Sound call</span> : null}
                    {state === 'wrong' ? <span className="option__mark">Not this one</span> : null}
                  </label>
                );
              })}
            </div>
            {checked ? (
              <Callout icon={matches ? 'check' : 'info'} tone={matches ? 'good' : 'bad'}>
                <p>{c.why}</p>
              </Callout>
            ) : null}
          </fieldset>
        );
      })}
      <div className="row" role="status">
        {!checked ? (
          <Btn variant="primary" disabled={!all} aria-disabled={!all} onClick={() => setChecked(true)}>
            Show my verdicts against the reasons
          </Btn>
        ) : (
          <>
            <p className="note">{allMatch ? 'Your calls all match. The reasons are the useful part, so read them.' : 'Some calls differed. Read the reasons, then clear and try again.'}</p>
            <Btn variant="quiet" icon="reset" onClick={reset}>
              Clear and try again
            </Btn>
          </>
        )}
      </div>
    </div>
  );
}
