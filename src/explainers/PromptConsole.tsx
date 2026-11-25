import { useId, useMemo, useState } from 'react';
import { Btn, Callout } from '@/ui/primitives';
import {
  BRIEFS,
  DEFAULT_PARAMS,
  FORMAL,
  PARAM_KEYS,
  PARAM_META,
  PRESETS,
  TEMPERATURE,
  WORDS,
  buildPrompt,
  checkBrief,
  draws,
  explainChange,
  simulate,
  startingPoint,
  type Params,
  type ParamKey,
  type PresetId,
} from './consoleModel';

const pct = (v: number): number => Math.round(v * 100);

function Slider({ k, value, band, onChange }: { k: ParamKey; value: number; band?: readonly [number, number]; onChange: (v: number) => void }) {
  const id = useId();
  const m = PARAM_META[k];
  return (
    <div className="slider">
      <div className="slider__head">
        <label htmlFor={id}>{m.label}</label>
        <output htmlFor={id} className="num">
          {k === 'temperature' ? TEMPERATURE({ temperature: value } as Params).toFixed(2) : value}
        </output>
      </div>
      <div className="slider__track" style={band ? ({ '--lo': `${band[0]}%`, '--hi': `${band[1]}%` } as React.CSSProperties) : undefined}>
        {band ? <span className="slider__band" aria-hidden="true" /> : null}
        <input id={id} type="range" min={0} max={100} value={value} onChange={(e) => onChange(+e.target.value)} aria-describedby={`${id}-h`} />
      </div>
      <p className="slider__hint" id={`${id}-h`}>
        {m.hint}
        {band ? ` Suggested for this brief: ${band[0]} to ${band[1]}.` : ''}
      </p>
    </div>
  );
}

/** Four settings, four prompt styles, and a simulated model: change one thing, and see what moved and why. */
export default function PromptConsole() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS);
  const [preset, setPreset] = useState<PresetId | null>(null);
  const [briefId, setBriefId] = useState<string>('none');
  const [note, setNote] = useState<string>('Move a slider or choose a prompt style. This note will say what changed, and why.');
  const sim = useMemo(() => simulate(params), [params]);
  const parts = useMemo(() => buildPrompt(params, preset), [params, preset]);
  const sampled = useMemo(() => draws(sim.probs), [sim]);
  const brief = BRIEFS.find((b) => b.id === briefId);
  const verdict = brief ? checkBrief(params, brief) : null;
  const top = Math.max(...sim.probs);

  const setValue = (key: ParamKey, v: number) => {
    const next = { ...params, [key]: v };
    setNote(explainChange({ key, from: params[key], to: v, before: sim, after: simulate(next) }));
    setParams(next);
    setPreset(null);
  };
  const applyPreset = (id: PresetId) => {
    const p = PRESETS.find((x) => x.id === id)!;
    const after = simulate(p.values);
    setNote(
      `${p.name}: ${p.summary} Together its settings changed variety from ${pct(sim.variety)}% to ${pct(after.variety)}% and the on-task share from ${pct(sim.onTask)}% to ${pct(after.onTask)}%. Look at the prompt on the right to see which parts it adds.`,
    );
    setParams(p.values);
    setPreset(id);
  };
  const reset = () => {
    setParams(DEFAULT_PARAMS);
    setPreset(null);
    setNote('Back to the loose starting prompt. Notice how spread out the bars are.');
  };

  return (
    <div className="instrument console">
      <Callout icon="info">
        <p>
          <strong>This is a simulation.</strong> No AI model is called. It is a small calculation that shows how prompt settings shift the odds of the first word of an answer, and the same settings always give the same numbers. A real model works with far more than eight words, but the pattern it shows is real.
        </p>
      </Callout>

      <div className="instrument__grid">
        <div className="controls">
          <fieldset className="presets">
            <legend>Prompt styles</legend>
            <div className="presets__row">
              {PRESETS.map((p) => (
                <button key={p.id} type="button" className="preset" aria-pressed={preset === p.id} onClick={() => applyPreset(p.id)}>
                  <span className="preset__name">{p.name}</span>
                  <span className="preset__sum">{p.summary}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <div className="sliders">
            {PARAM_KEYS.map((k) => (
              <Slider key={k} k={k} value={params[k]} band={brief?.ranges[k]} onChange={(v) => setValue(k, v)} />
            ))}
          </div>
          <div className="row">
            <Btn variant="quiet" icon="reset" onClick={reset}>
              Back to the loose prompt
            </Btn>
          </div>

          <fieldset className="briefs">
            <legend>Try a brief</legend>
            <p className="note">Pick a job and the sliders show the range that suits it. Nothing is scored: the point is the reason for each range.</p>
            <div className="filters" role="radiogroup" aria-label="Brief">
              {[{ id: 'none', goal: 'No brief' }, ...BRIEFS].map((b) => (
                <label key={b.id} className="option option--compact brief-opt">
                  <input type="radio" name="brief" checked={briefId === b.id} onChange={() => setBriefId(b.id)} />
                  <span>{b.id === 'none' ? 'No brief' : b.goal}</span>
                </label>
              ))}
            </div>
            {brief && verdict ? (
              <div className="brief" role="status">
                <p className="note">{brief.hint}</p>
                <ul className="brief__list">
                  {verdict.map((v) => (
                    <li key={v.key} className={v.inside ? 'is-in' : 'is-out'}>
                      <span className="tag">{v.inside ? 'Inside the range' : 'Outside the range'}</span> <strong>{PARAM_META[v.key].label}</strong> ({v.value}; suggested {v.range[0]} to {v.range[1]}). {brief.reasons[v.key]}
                    </li>
                  ))}
                </ul>
                <Btn variant="quiet" onClick={() => { setParams(startingPoint(brief)); setPreset(null); setNote(`Moved every setting to the middle of its suggested range for “${brief.goal}”`); }}>
                  Start from the middle of each range
                </Btn>
              </div>
            ) : null}
          </fieldset>
        </div>

        <div className="readout">
          <section aria-labelledby="pc-prompt">
            <h3 id="pc-prompt" className="label">
              The prompt these settings describe
            </h3>
            <dl className="prompt-parts">
              {parts.map((p) => (
                <div key={p.id} className={p.active ? 'is-on' : 'is-off'}>
                  <dt>
                    {p.label} <span className="tag">{p.active ? 'In the prompt' : 'Left out'}</span>
                  </dt>
                  <dd>{p.lines.join(' ')}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section aria-labelledby="pc-odds">
            <h3 id="pc-odds" className="label">
              The simulated odds for the answer’s first word
            </h3>
            <ol className="odds">
              {WORDS.map((w, i) => (
                <li key={w} className={FORMAL[i] ? 'odds--formal' : 'odds--casual'}>
                  <span className="odds__word">{w}</span>
                  <span className="odds__bar" aria-hidden="true">
                    <span style={{ width: `${(sim.probs[i]! / Math.max(top, 0.0001)) * 100}%` }} />
                  </span>
                  <span className="odds__pct num">{pct(sim.probs[i]!)}%</span>
                  <span className="odds__kind">{FORMAL[i] ? 'on-task' : 'casual'}</span>
                </li>
              ))}
            </ol>
          </section>

          <dl className="metrics">
            <div>
              <dt>Variety</dt>
              <dd className="num">{pct(sim.variety)}%</dd>
            </div>
            <div>
              <dt>On-task share</dt>
              <dd className="num">{pct(sim.onTask)}%</dd>
            </div>
            <div>
              <dt>Drift risk</dt>
              <dd className="num">{pct(sim.drift)}%</dd>
            </div>
          </dl>

          <section aria-labelledby="pc-draws">
            <h3 id="pc-draws" className="label">
              Ten draws from these settings
            </h3>
            <p className="draws" aria-label={`Ten simulated first words: ${sampled.map((i) => WORDS[i]).join(', ')}`}>
              {sampled.map((i, n) => (
                <span key={n} className={`tok ${FORMAL[i] ? 'tok--1' : 'tok--out'}`}>
                  {WORDS[i]}
                </span>
              ))}
            </p>
            <p className="note">Each draw uses the same ten fixed random numbers, so when the chips change, it is because the settings changed.</p>
          </section>

          <div className="change" role="status" aria-live="polite">
            <p className="label">What changed, and why</p>
            <p>{note}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
