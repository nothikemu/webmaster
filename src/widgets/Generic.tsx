import { useId, useState } from 'react';
import type { ChooserConfig, ClaimReviewConfig, SorterConfig } from '@/content/types';
import { Btn, Callout } from '@/ui/primitives';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import type { WidgetProps } from './types';

/** Sort each item into the right bin. Reveals the reason for every item after you check. */
export function Sorter({ spec, onScore }: WidgetProps) {
  const cfg = spec.config as SorterConfig;
  const uid = useId();
  const [picks, setPicks] = useState<(string | null)[]>(() => cfg.items.map(() => null));
  const [checked, setChecked] = useState(false);
  const right = cfg.items.filter((it, i) => picks[i] === it.bin).length;
  const all = picks.every(Boolean);

  const check = () => {
    setChecked(true);
    const score = Math.round((right / cfg.items.length) * 100);
    play(score >= spec.pass ? 'right' : 'wrong');
    onScore(score);
  };
  const reset = () => {
    setPicks(cfg.items.map(() => null));
    setChecked(false);
  };

  return (
    <div className="stack">
      {cfg.items.map((it, i) => {
        const ok = picks[i] === it.bin;
        return (
          <fieldset key={i} className="sort-item">
            <legend>{it.text}</legend>
            <div className="sort-bins">
              {cfg.bins.map((b) => {
                const state = checked ? (b.id === it.bin ? 'right' : picks[i] === b.id ? 'wrong' : '') : '';
                return (
                  <label key={b.id} className={`option${state ? ` option--${state}` : ''}`}>
                    <input
                      type="radio"
                      name={`${uid}-${i}`}
                      checked={picks[i] === b.id}
                      disabled={checked}
                      onChange={() => {
                        play('tick');
                        setPicks((p) => p.map((v, j) => (j === i ? b.id : v)));
                      }}
                    />
                    <span>{b.label}</span>
                    {state === 'right' ? <span className="option__mark"><Icon name="check" /> Best fit</span> : null}
                    {state === 'wrong' ? <span className="option__mark"><Icon name="x" /> Not this</span> : null}
                  </label>
                );
              })}
            </div>
            {checked ? (
              <Callout icon={ok ? 'check' : 'info'} tone={ok ? 'good' : 'bad'}>
                <p>{it.why}</p>
              </Callout>
            ) : null}
          </fieldset>
        );
      })}
      <div className="row" role="status">
        {!checked ? (
          <Btn variant="primary" disabled={!all} aria-disabled={!all} onClick={check}>
            Check my sorting
          </Btn>
        ) : (
          <>
            <p className="score-line">
              <strong>{right} of {cfg.items.length}</strong> placed correctly.
            </p>
            <Btn variant="quiet" icon="reset" onClick={reset}>Try again</Btn>
          </>
        )}
      </div>
    </div>
  );
}

/** One decision at a time, with feedback after each. Also builds a prompt as you go when `assemble` is set. */
export function Chooser({ spec, onScore, assemble }: WidgetProps & { assemble?: boolean }) {
  const cfg = spec.config as ChooserConfig;
  const uid = useId();
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<(number | null)[]>(() => cfg.steps.map(() => null));
  const [done, setDone] = useState(false);
  const s = cfg.steps[step]!;
  const choice = picked[step];
  const revealed = choice !== null && choice !== undefined && picked[step] !== null;
  const [shown, setShown] = useState(false);
  const rightCount = cfg.steps.filter((st, i) => picked[i] === st.answer).length;

  const reveal = () => {
    setShown(true);
    play(choice === s.answer ? 'right' : 'wrong');
  };
  const next = () => {
    if (step === cfg.steps.length - 1) {
      setDone(true);
      const score = Math.round((rightCount / cfg.steps.length) * 100);
      onScore(score);
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
              <span className="label">Step {step + 1} of {cfg.steps.length}</span>
              <br />
              {s.prompt}
            </legend>
            {s.options.map((o, n) => {
              const state = shown ? (n === s.answer ? 'right' : choice === n ? 'wrong' : '') : '';
              return (
                <label key={n} className={`option${state ? ` option--${state}` : ''}`}>
                  <input
                    type="radio"
                    name={`${uid}-${step}`}
                    checked={choice === n}
                    disabled={shown}
                    onChange={() => {
                      play('tick');
                      setPicked((p) => p.map((v, i) => (i === step ? n : v)));
                    }}
                  />
                  <span>{o}</span>
                  {state === 'right' ? <span className="option__mark"><Icon name="check" /> Best choice</span> : null}
                  {state === 'wrong' ? <span className="option__mark"><Icon name="x" /> Not this</span> : null}
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
              <Btn variant="primary" disabled={!revealed} aria-disabled={!revealed} onClick={reveal}>
                Lock in my choice
              </Btn>
            ) : (
              <Btn variant="primary" go onClick={next}>
                {step === cfg.steps.length - 1 ? 'See my result' : 'Next step'}
              </Btn>
            )}
          </div>
        </>
      ) : (
        <div role="status" className="stack">
          <p className="score-line">
            <strong>{rightCount} of {cfg.steps.length}</strong> best choices.
          </p>
          {assemble ? (
            <Callout icon="info">
              <p>A prompt with a clear task, context, audience, format and limits gives the model more to work with. It also gives you something to check the result against.</p>
            </Callout>
          ) : null}
          <Btn variant="quiet" icon="reset" onClick={restart}>Try again</Btn>
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
export function ClaimReview({ spec, onScore }: WidgetProps) {
  const cfg = spec.config as ClaimReviewConfig;
  const uid = useId();
  const [picks, setPicks] = useState<(Verdict | null)[]>(() => cfg.claims.map(() => null));
  const [checked, setChecked] = useState(false);
  const right = cfg.claims.filter((c, i) => picks[i] === c.verdict).length;
  const all = picks.every(Boolean);

  const check = () => {
    setChecked(true);
    const score = Math.round((right / cfg.claims.length) * 100);
    play(score >= spec.pass ? 'right' : 'wrong');
    onScore(score);
  };
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
        const ok = picks[i] === c.verdict;
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
                    <input
                      type="radio"
                      name={`${uid}-${i}`}
                      checked={picks[i] === v.id}
                      disabled={checked}
                      onChange={() => {
                        play('tick');
                        setPicks((p) => p.map((x, j) => (j === i ? v.id : x)));
                      }}
                    />
                    <span>{v.label}</span>
                    {state === 'right' ? <span className="option__mark"><Icon name="check" /> Right call</span> : null}
                    {state === 'wrong' ? <span className="option__mark"><Icon name="x" /> Not this</span> : null}
                  </label>
                );
              })}
            </div>
            {checked ? (
              <Callout icon={ok ? 'check' : 'info'} tone={ok ? 'good' : 'bad'}>
                <p>{c.why}</p>
              </Callout>
            ) : null}
          </fieldset>
        );
      })}
      <div className="row" role="status">
        {!checked ? (
          <Btn variant="primary" disabled={!all} aria-disabled={!all} onClick={check}>
            Check my verdicts
          </Btn>
        ) : (
          <>
            <p className="score-line">
              <strong>{right} of {cfg.claims.length}</strong> claims handled correctly.
            </p>
            <Btn variant="quiet" icon="reset" onClick={reset}>Try again</Btn>
          </>
        )}
      </div>
    </div>
  );
}
