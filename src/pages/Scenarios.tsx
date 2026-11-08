import { useState } from 'react';
import { SCENARIOS, scenarioBounds, scenarioScore } from '@/content/scenarios';
import { dispatch, useProgress } from '@/engine/store';
import { lessonById } from '@/content/paths';
import { Btn, Callout, Chip, LinkBtn, PageHead, Panel } from '@/ui/primitives';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import type { Scenario } from '@/content/types';

const METERS = [
  { key: 'integrity', label: 'Honesty' },
  { key: 'learning', label: 'Learning' },
  { key: 'privacy', label: 'Privacy' },
] as const;

export default function Scenarios() {
  const [openId, setOpenId] = useState<string | null>(null);
  const challenges = useProgress((s) => s.challenges);
  const scenario = SCENARIOS.find((s) => s.id === openId);
  return (
    <div className="wrap page" data-path="responsible">
      <PageHead title="Scenarios" kicker="Case files" lead="Real situations from school. Each choice moves three meters: honesty, learning and privacy. There is always a best path, but the reasons matter more than the score." />
      {scenario ? (
        <Play key={scenario.id} scenario={scenario} onExit={() => setOpenId(null)} />
      ) : (
        <ul className="cases">
          {SCENARIOS.map((s, i) => {
            const best = challenges[s.id]?.best;
            return (
              <li key={s.id} className={`cases__item cases__item--${i % 3}`}>
                <button type="button" className="panel panel--lift case" onClick={() => { play('press'); setOpenId(s.id); }}>
                  <span className="label">Case {i + 1}</span>
                  <span className="case__title">{s.title}</span>
                  <span className="case__set">{s.setting}</span>
                  <span className="case__foot">
                    {best !== undefined ? <Chip tone="hue" icon="check">Best {best}</Chip> : <Chip>Not played</Chip>}
                    <span className="case__open">Open case <Icon name="arrow-right" /></span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Play({ scenario, onExit }: { scenario: Scenario; onExit: () => void }) {
  const [step, setStep] = useState(0);
  const [picks, setPicks] = useState<number[]>([]);
  const [chosen, setChosen] = useState<number | null>(null);
  const [done, setDone] = useState(false);
  const s = scenario.steps[step]!;

  const totals = picks.reduce(
    (acc, p, i) => {
      const c = scenario.steps[i]!.choices[p]!;
      return { integrity: acc.integrity + c.integrity, learning: acc.learning + c.learning, privacy: acc.privacy + c.privacy };
    },
    { integrity: 0, learning: 0, privacy: 0 },
  );
  const range = scenario.steps.length * 2;

  const lock = (n: number) => {
    setChosen(n);
    const c = s.choices[n]!;
    play(c.integrity + c.learning + c.privacy >= 2 ? 'right' : 'wrong');
  };
  const advance = () => {
    const nextPicks = [...picks, chosen!];
    setPicks(nextPicks);
    setChosen(null);
    if (step === scenario.steps.length - 1) {
      setDone(true);
      dispatch({ type: 'challenge', id: scenario.id, score: scenarioScore(scenario, nextPicks), passMark: 60, xp: 25, label: `Scenario: ${scenario.title}` });
    } else setStep(step + 1);
  };

  const score = done ? scenarioScore(scenario, picks) : 0;
  const lesson = lessonById(scenario.lesson);

  return (
    <Panel lift className="play">
      <div className="play__head">
        <div>
          <p className="label">Case file</p>
          <h2>{scenario.title}</h2>
        </div>
        <Btn variant="quiet" small onClick={onExit}>Back to all cases</Btn>
      </div>
      <p className="play__set">{scenario.setting}</p>
      <dl className="meters" aria-label="Your meters">
        {METERS.map((m) => (
          <div key={m.key} className="meters__m">
            <dt>{m.label}</dt>
            <dd>
              <span className="meters__track" aria-hidden="true"><span style={{ left: `${50 + (totals[m.key] / range) * 50}%` }} /></span>
              <span>{totals[m.key] > 0 ? '+' : ''}{totals[m.key]}</span>
            </dd>
          </div>
        ))}
      </dl>
      {!done ? (
        <>
          <fieldset>
            <legend><span className="label">Decision {step + 1} of {scenario.steps.length}</span><br />{s.prompt}</legend>
            {s.choices.map((c, n) => {
              const total = c.integrity + c.learning + c.privacy;
              const state = chosen !== null ? (n === chosen ? (total >= 2 ? 'right' : 'wrong') : '') : '';
              return (
                <label key={n} className={`option${state ? ` option--${state}` : ''}`}>
                  <input type="radio" name={`sc-${step}`} checked={chosen === n} disabled={chosen !== null} onChange={() => lock(n)} />
                  <span>{c.text}</span>
                  {state === 'right' ? <span className="option__mark"><Icon name="check" /> Good call</span> : null}
                  {state === 'wrong' ? <span className="option__mark"><Icon name="x" /> Costly</span> : null}
                </label>
              );
            })}
          </fieldset>
          {chosen !== null ? (
            <div role="status" className="stack">
              <Callout icon={s.choices[chosen]!.integrity + s.choices[chosen]!.learning + s.choices[chosen]!.privacy >= 2 ? 'check' : 'info'} tone={s.choices[chosen]!.integrity + s.choices[chosen]!.learning + s.choices[chosen]!.privacy >= 2 ? 'good' : 'bad'}>
                <p>{s.choices[chosen]!.response}</p>
                <p className="small">Honesty {fmt(s.choices[chosen]!.integrity)} · Learning {fmt(s.choices[chosen]!.learning)} · Privacy {fmt(s.choices[chosen]!.privacy)}</p>
              </Callout>
              <Btn variant="primary" go onClick={advance}>{step === scenario.steps.length - 1 ? 'See how it went' : 'Next decision'}</Btn>
            </div>
          ) : null}
        </>
      ) : (
        <div role="status" className="stack">
          <h3>Result: {score} out of 100</h3>
          <p>
            Your path scored between the worst possible ({scenarioBounds(scenario).min}) and the best possible ({scenarioBounds(scenario).max}) total.{' '}
            {score >= 80 ? 'You found the responsible path.' : score >= 50 ? 'Part of the way there. Read the reasons again and replay.' : 'Rough outcome. Replay and compare each choice\'s reason.'}
          </p>
          <div className="row">
            <Btn variant="primary" icon="reset" onClick={() => { setStep(0); setPicks([]); setChosen(null); setDone(false); }}>Replay this case</Btn>
            <Btn variant="quiet" onClick={onExit}>Choose another case</Btn>
            {lesson ? <LinkBtn to={`/learn/${lesson.path}/${lesson.id}`} variant="quiet">Related lesson: {lesson.title}</LinkBtn> : null}
          </div>
        </div>
      )}
    </Panel>
  );
}

const fmt = (n: number) => (n > 0 ? `+${n}` : `${n}`);
