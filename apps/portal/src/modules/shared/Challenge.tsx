import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ChoiceChallenge, ModuleContent, TuningChallenge } from '../../content';
import { moduleHref } from '../../content';
import { t } from '../../core/assets';
import { Link } from '../../router';
import { useClock, useData, useGame } from '../../ui/hooks';
import { Segmented } from '../../ui/Segmented';
import { Verdict } from '../../ui/Verdict';
import {
  PARAM_KEYS,
  PARAM_META,
  checkRanges,
  paramsStore,
  useParams,
  type RangeMiss,
} from '../ModuleB/params';

type Mode = 'untimed' | 'timed';
type Phase = 'ready' | 'running' | 'done';

const MISTAKE_PENALTY_MS = 5000;
const fmt = (ms: number): string => `${(ms / 1000).toFixed(1)}s`;

interface Shared {
  module: ModuleContent;
}

function useRun(module: ModuleContent) {
  const game = useGame();
  const best = useData().modules[module.id].challenge;
  const [mode, setMode] = useState<Mode>('untimed');
  const [phase, setPhase] = useState<Phase>('ready');
  const [penalty, setPenalty] = useState(0);
  const [final, setFinal] = useState<{ score: number; ms: number } | null>(null);
  const startedAt = useRef(0);
  const now = useClock(phase === 'running' && mode === 'timed');
  const elapsed = phase === 'running' ? now - startedAt.current + penalty : (final?.ms ?? 0);

  const start = (): void => {
    startedAt.current = performance.now();
    setPenalty(0);
    setFinal(null);
    setPhase('running');
  };
  const finish = (score: number, extraPenalty = 0): void => {
    const ms = Math.round(performance.now() - startedAt.current + penalty + extraPenalty);
    setFinal({ score, ms });
    setPhase('done');
    game({
      type: 'CHALLENGE_FINISHED',
      module: module.id,
      score,
      elapsedMs: ms,
      timed: mode === 'timed',
    });
  };
  const reset = (): void => {
    setPhase('ready');
    setFinal(null);
    setPenalty(0);
  };
  return {
    mode,
    setMode,
    phase,
    start,
    finish,
    reset,
    elapsed,
    final,
    best,
    addPenalty: (ms: number) => setPenalty((p) => p + ms),
  };
}

function Intro({
  module,
  mode,
  setMode,
  start,
}: {
  module: ModuleContent;
  mode: Mode;
  setMode: (m: Mode) => void;
  start: () => void;
}): ReactNode {
  const c = module.challenge;
  return (
    <div className="challenge-intro">
      <p className="prose">{c.intro}</p>
      <Segmented
        label={t('challenge.mode')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'untimed', label: t('challenge.untimed') },
          { value: 'timed', label: t('challenge.timed') },
        ]}
      />
      <button type="button" className="btn" onClick={start}>
        {t('challenge.start')}
      </button>
    </div>
  );
}

function Summary({
  module,
  score,
  ms,
  timed,
  reset,
}: {
  module: ModuleContent;
  score: number;
  ms: number;
  timed: boolean;
  reset: () => void;
}): ReactNode {
  const c = module.challenge;
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => ref.current?.focus(), []);
  const passed = score >= c.passMark;
  return (
    <Verdict
      innerRef={ref}
      passed={passed}
      score={score}
      total={c.kind === 'choice' ? c.items.length : c.scenarios.length}
      note={passed ? t('challenge.cleared') : t('challenge.notYet', { n: c.passMark })}
      detail={timed ? t('challenge.time', { t: fmt(ms) }) : undefined}
      actions={
        <>
          <button type="button" className="btn btn-ghost" onClick={reset}>
            {t('challenge.again')}
          </button>
          <Link to={moduleHref(module.id)} className="btn">
            {t('challenge.back')}
          </Link>
        </>
      }
    />
  );
}

function ChoiceRun({ module, challenge }: Shared & { challenge: ChoiceChallenge }): ReactNode {
  const run = useRun(module);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const item = challenge.items[index];
  const nextRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (picked !== null) nextRef.current?.focus();
  }, [picked]);

  const begin = (): void => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    run.start();
  };
  const next = (): void => {
    const last = index + 1 >= challenge.items.length;
    if (last) run.finish(score);
    else {
      setIndex(index + 1);
      setPicked(null);
    }
  };
  const pick = (i: number): void => {
    if (picked !== null || !item) return;
    setPicked(i);
    if (i === item.answer) setScore((s) => s + 1);
    else if (run.mode === 'timed') run.addPenalty(MISTAKE_PENALTY_MS);
  };

  if (run.phase === 'ready')
    return <Intro module={module} mode={run.mode} setMode={run.setMode} start={begin} />;
  if (run.phase === 'done' && run.final)
    return (
      <Summary
        module={module}
        score={run.final.score}
        ms={run.final.ms}
        timed={run.mode === 'timed'}
        reset={run.reset}
      />
    );
  if (!item) return null;
  return (
    <div className="challenge-run">
      <p className="muted challenge-hud">
        <span>{t('challenge.item', { n: index + 1, total: challenge.items.length })}</span>
        {run.mode === 'timed' && <span className="num">{fmt(run.elapsed)}</span>}
      </p>
      <fieldset className="check glass">
        <legend className="check-prompt">{item.prompt}</legend>
        <div className="options" role="group" aria-label={item.prompt}>
          {challenge.options.map((o, i) => (
            <button
              key={o}
              type="button"
              className="option option-button"
              data-right={picked !== null && i === item.answer}
              data-wrong={picked === i && i !== item.answer}
              disabled={picked !== null}
              onClick={() => pick(i)}
            >
              {o}
            </button>
          ))}
        </div>
        <div
          role="status"
          aria-live="polite"
          className="feedback"
          data-result={picked === null ? 'idle' : picked === item.answer ? 'right' : 'wrong'}
        >
          {picked !== null && (
            <>
              <strong>
                {picked === item.answer
                  ? t('lesson.correct')
                  : t('challenge.missed', { answer: challenge.options[item.answer]! })}
              </strong>{' '}
              {item.explain}
            </>
          )}
        </div>
        {picked !== null && (
          <button type="button" className="btn" onClick={next} ref={nextRef}>
            {index + 1 >= challenge.items.length ? t('challenge.finish') : t('challenge.next')}
          </button>
        )}
      </fieldset>
    </div>
  );
}

function TuningRun({ module, challenge }: Shared & { challenge: TuningChallenge }): ReactNode {
  const run = useRun(module);
  const params = useParams((s) => s.params);
  const [index, setIndex] = useState(0);
  const [misses, setMisses] = useState<RangeMiss[]>([]);
  const [showHint, setShowHint] = useState(false);
  const scenario = challenge.scenarios[index];

  const begin = (): void => {
    setIndex(0);
    setMisses([]);
    setShowHint(false);
    run.start();
  };
  const lock = (): void => {
    if (!scenario) return;
    const missed = checkRanges(paramsStore.getState().params, scenario.ranges);
    setMisses(missed);
    if (missed.length > 0) {
      if (run.mode === 'timed') run.addPenalty(MISTAKE_PENALTY_MS);
      return;
    }
    if (index + 1 >= challenge.scenarios.length) run.finish(challenge.scenarios.length);
    else {
      setIndex(index + 1);
      setShowHint(false);
    }
  };

  if (run.phase === 'ready')
    return <Intro module={module} mode={run.mode} setMode={run.setMode} start={begin} />;
  if (run.phase === 'done' && run.final)
    return (
      <Summary
        module={module}
        score={run.final.score}
        ms={run.final.ms}
        timed={run.mode === 'timed'}
        reset={run.reset}
      />
    );
  if (!scenario) return null;
  return (
    <div className="challenge-run">
      <p className="muted challenge-hud">
        <span>{t('challenge.item', { n: index + 1, total: challenge.scenarios.length })}</span>
        {run.mode === 'timed' && <span className="num">{fmt(run.elapsed)}</span>}
      </p>
      <div className="check glass">
        <p className="check-prompt">{scenario.goal}</p>
        <dl className="param-readout">
          {PARAM_KEYS.map((k) => (
            <div key={k}>
              <dt className="mono">{PARAM_META[k].label}</dt>
              <dd className="num">{params[k]}</dd>
            </div>
          ))}
        </dl>
        <div className="check-actions">
          <button type="button" className="btn" onClick={lock}>
            {t('challenge.lock')}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            aria-expanded={showHint}
            onClick={() => setShowHint((v) => !v)}
          >
            {showHint ? t('challenge.hideHint') : t('challenge.hint')}
          </button>
        </div>
        {showHint && <p className="prose">{scenario.hint}</p>}
        <div
          role="status"
          aria-live="polite"
          className="feedback"
          data-result={misses.length ? 'wrong' : 'idle'}
        >
          {misses.length > 0 && (
            <ul className="misses">
              {misses.map((m) => (
                <li key={m.key}>
                  <strong>{PARAM_META[m.key].label}</strong>{' '}
                  {t('challenge.miss', { v: m.value, lo: m.range[0], hi: m.range[1] })}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

/** Mastery challenge: a choice sequence (Foundations, Ethics) or live slider tuning (Synthesis). */
export function Challenge({ module }: Shared): ReactNode {
  const c = module.challenge;
  return (
    <section className="challenge" aria-labelledby="challenge-h">
      <h2 id="challenge-h" className="lesson-title sr-only">
        {c.title}
      </h2>
      {c.kind === 'choice' ? (
        <ChoiceRun module={module} challenge={c} />
      ) : (
        <TuningRun module={module} challenge={c} />
      )}
    </section>
  );
}
