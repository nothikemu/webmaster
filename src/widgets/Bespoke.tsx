import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Btn, Callout } from '@/ui/primitives';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import type { WidgetProps } from './types';
import { KEYWORDS, TRAIN, runBoth } from './logic/spam';
import { TEST_SET, narrowExamples, predict, testAccuracy, variedExamples, type Pt } from './logic/knn';
import { DATASETS, Net, makeData, type DatasetId } from './logic/nn';
import { STARTS, candidates, generate, render } from './logic/lm';
import { INSTRUCTION, STARTER_TEXT, WINDOW, fit, instructionVisible } from './logic/tokens';
import { APPLICANTS, FEATURE_LABEL, PICKS, audit, type Feature } from './logic/bias';

/* ------------------------------------------------------------------ U1 */
export function SpamLearner({ onScore }: WidgetProps) {
  const uid = useId();
  const [keys, setKeys] = useState<string[]>(['free', 'now']);
  const [guess, setGuess] = useState<'rules' | 'learned' | 'same' | null>(null);
  const [ran, setRan] = useState(false);
  const result = useMemo(() => runBoth(keys), [keys]);
  const truth = result.ruleRight === result.learnedRight ? 'same' : result.learnedRight > result.ruleRight ? 'learned' : 'rules';

  const run = () => {
    setRan(true);
    const score = 60 + (guess === truth ? 40 : 0);
    play(guess === truth ? 'right' : 'wrong');
    onScore(score);
  };

  return (
    <div className="stack">
      <div className="bench-cols">
        <fieldset>
          <legend>1. Write your rule filter. Tick the words that should mark a message as spam.</legend>
          <div className="check-grid">
            {KEYWORDS.map((k) => (
              <label key={k} className="option option--compact">
                <input
                  type="checkbox"
                  checked={keys.includes(k)}
                  disabled={ran}
                  onChange={() => setKeys((ks) => (ks.includes(k) ? ks.filter((x) => x !== k) : [...ks, k]))}
                />
                <span>{k}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <p className="label">2. The learned filter studies {TRAIN.length} labeled messages</p>
          <ul className="mini-list">
            {TRAIN.slice(0, 4).map((m) => (
              <li key={m.text}>
                <span className={`tag ${m.spam ? 'tag--bad' : 'tag--good'}`}>{m.spam ? 'Spam' : 'Not spam'}</span> {m.text}
              </li>
            ))}
            <li className="small">…and {TRAIN.length - 4} more. It counts which words show up in each group.</li>
          </ul>
        </div>
      </div>
      <fieldset>
        <legend>3. Predict: on eight new messages, which filter will get more right?</legend>
        <div className="row">
          {(['rules', 'learned', 'same'] as const).map((g) => (
            <label key={g} className="option option--compact">
              <input type="radio" name={`${uid}-g`} checked={guess === g} disabled={ran} onChange={() => setGuess(g)} />
              <span>{g === 'rules' ? 'My rules' : g === 'learned' ? 'The learned filter' : 'About the same'}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {!ran ? (
        <div className="row">
          <Btn variant="primary" go disabled={!guess} aria-disabled={!guess} onClick={run}>Run both filters</Btn>
        </div>
      ) : (
        <div className="stack" role="status">
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Results on eight new messages">
            <table>
              <caption className="visually-hidden">Results on eight new messages</caption>
              <thead>
                <tr>
                  <th scope="col">New message</th>
                  <th scope="col">Really</th>
                  <th scope="col">My rules said</th>
                  <th scope="col">Learned filter said</th>
                </tr>
              </thead>
              <tbody>
                {result.rowVerdicts.map((r) => (
                  <tr key={r.text}>
                    <td>{r.text}</td>
                    <td>{r.spam ? 'Spam' : 'Not spam'}</td>
                    <td>{r.rule ? 'Spam' : 'Not spam'} {r.rule === r.spam ? <Icon name="check" title="correct" /> : <Icon name="x" title="wrong" />}</td>
                    <td>{r.learned ? 'Spam' : 'Not spam'} {r.learned === r.spam ? <Icon name="check" title="correct" /> : <Icon name="x" title="wrong" />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="score-line">
            <strong>Your rules: {result.ruleRight} of 8.</strong> <strong>Learned filter: {result.learnedRight} of 8.</strong>
          </p>
          <Callout icon={guess === truth ? 'check' : 'info'} tone={guess === truth ? 'good' : undefined}>
            <p>
              {guess === truth ? 'Your prediction was right. ' : 'Not what you predicted, and that is the lesson. '}
              Rules break on tricks like "fr33 pr1ze" and on honest messages that happen to contain a flagged word, such as "Is the library free on Saturday?". The learned filter
              weighs many words together, and it found its own weights from the examples.
            </p>
          </Callout>
          <Btn variant="quiet" icon="reset" onClick={() => { setRan(false); setGuess(null); }}>Change my rules and try again</Btn>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ U2 */
const GRID = 20;
export function Classifier({ onScore }: WidgetProps) {
  const [pts, setPts] = useState<Pt[]>([]);
  const [ripe, setRipe] = useState(true);
  const [size, setSize] = useState(60);
  const [sweet, setSweet] = useState(70);
  const [tested, setTested] = useState<ReturnType<typeof testAccuracy> | null>(null);
  const seed = useRef(1);
  const svg = useRef<SVGSVGElement>(null);

  const cells = useMemo(() => {
    const out: { x: number; y: number; ripe: boolean | null }[] = [];
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) out.push({ x: i, y: j, ripe: predict(pts, ((i + 0.5) / GRID) * 100, ((j + 0.5) / GRID) * 100) });
    return out;
  }, [pts]);

  const add = (p: Pt[]) => {
    setPts((cur) => [...cur, ...p]);
    setTested(null);
    play('tick');
  };
  const onClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const r = svg.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = (1 - (e.clientY - r.top) / r.height) * 100;
    add([{ x, y, ripe }]);
  };
  const test = () => {
    const t = testAccuracy(pts);
    setTested(t);
    play(t.pct >= 75 ? 'right' : 'wrong');
    onScore(t.pct);
  };

  return (
    <div className="bench-cols bench-cols--wide">
      <div>
        <svg ref={svg} viewBox="0 0 100 100" className="plot" onClick={onClick} role="img" aria-label={`Plot of fruit by size (across) and sweetness (up). You have added ${pts.length} labeled examples. Click the plot to add one, or use the controls.`}>
          <rect width="100" height="100" fill="var(--paper-hi)" />
          {[25, 50, 75].map((g) => (
            <path key={g} d={`M${g} 0V100M0 ${g}H100`} stroke="var(--paper-line)" strokeWidth="0.4" strokeDasharray="1.2 1.6" />
          ))}
          {cells.map((c) =>
            c.ripe === null ? null : (
              <g key={`${c.x}-${c.y}`}>
                <rect x={c.x * (100 / GRID)} y={100 - (c.y + 1) * (100 / GRID)} width={100 / GRID} height={100 / GRID} fill={c.ripe ? 'var(--teal)' : 'var(--ochre)'} opacity={0.32} />
                {c.ripe ? null : <rect x={c.x * (100 / GRID)} y={100 - (c.y + 1) * (100 / GRID)} width={100 / GRID} height={100 / GRID} fill="url(#hatch)" opacity={0.18} />}
              </g>
            ),
          )}
          {tested
            ? TEST_SET.map((t, i) => {
                const wrong = tested.wrong.includes(t);
                return (
                  <g key={i} transform={`translate(${t.x} ${100 - t.y})`}>
                    {wrong ? <path d="M-2.4 -2.4L2.4 2.4M2.4 -2.4L-2.4 2.4" stroke="var(--seal)" strokeWidth="1.4" strokeLinecap="round" /> : <circle r="2.1" fill="none" stroke="var(--ink)" strokeWidth="0.6" strokeDasharray="1 1" />}
                  </g>
                );
              })
            : null}
          {pts.map((p, i) =>
            p.ripe ? (
              <circle key={i} cx={p.x} cy={100 - p.y} r="2.6" fill="var(--teal)" stroke="var(--ink)" strokeWidth="0.8" />
            ) : (
              <rect key={i} x={p.x - 2.4} y={100 - p.y - 2.4} width="4.8" height="4.8" fill="var(--ochre)" stroke="var(--ink)" strokeWidth="0.8" />
            ),
          )}
          {/* where the next example will land, so the sliders and the map are visibly the same thing */}
          <g transform={`translate(${size} ${100 - sweet})`}>
            {ripe ? <circle r="3.6" fill="none" stroke="var(--ink)" strokeWidth="0.7" strokeDasharray="1.4 1.2" /> : <rect x="-3.4" y="-3.4" width="6.8" height="6.8" fill="none" stroke="var(--ink)" strokeWidth="0.7" strokeDasharray="1.4 1.2" />}
            <path d="M-6.4 0H-4.6M4.6 0H6.4M0 -6.4V-4.6M0 4.6V6.4" stroke="var(--ink)" strokeWidth="0.6" />
          </g>
          {pts.length === 0 ? (
            <text x="50" y="22" textAnchor="middle" className="plot__hint">
              Tap the map or use the sliders to add a fruit
            </text>
          ) : null}
          <rect width="100" height="100" fill="none" stroke="var(--ink)" strokeWidth="1.2" />
        </svg>
        <p className="plot-axis"><span>Size →</span><span>↑ Sweetness</span></p>
        <p className="small">Teal circles are ripe. Ochre squares are not ripe. The map shades where the model would say "ripe" (teal) or "not ripe" (ochre, hatched).</p>
      </div>
      <div className="stack">
        <fieldset>
          <legend>Add an example</legend>
          <div className="field">
            <label htmlFor="c-size">Size: {size}</label>
            <input id="c-size" type="range" min={0} max={100} value={size} onChange={(e) => setSize(+e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="c-sweet">Sweetness: {sweet}</label>
            <input id="c-sweet" type="range" min={0} max={100} value={sweet} onChange={(e) => setSweet(+e.target.value)} />
          </div>
          <div className="row">
            <label className="option option--compact"><input type="radio" name="c-class" checked={ripe} onChange={() => setRipe(true)} /><span>Ripe</span></label>
            <label className="option option--compact"><input type="radio" name="c-class" checked={!ripe} onChange={() => setRipe(false)} /><span>Not ripe</span></label>
          </div>
          <Btn variant="quiet" onClick={() => add([{ x: size, y: sweet, ripe }])}>Add this example</Btn>
        </fieldset>
        <div className="row">
          <Btn variant="quiet" onClick={() => add(variedExamples(seed.current++))}>Add 8 varied examples</Btn>
          <Btn variant="quiet" onClick={() => add(narrowExamples(seed.current++))}>Add 8 from one orchard (small fruit)</Btn>
          <Btn variant="quiet" icon="reset" onClick={() => { setPts([]); setTested(null); }}>Clear</Btn>
        </div>
        <p className="small">Examples so far: <strong>{pts.length}</strong>. Tip: the labels you add are the only thing the model learns from.</p>
        <Btn variant="primary" go disabled={pts.length < 3} aria-disabled={pts.length < 3} onClick={test}>Test on 12 hidden fruits</Btn>
        {tested ? (
          <div role="status">
            <Callout icon={tested.pct >= 75 ? 'check' : 'info'} tone={tested.pct >= 75 ? 'good' : undefined}>
              <p>
                <strong>{tested.right} of {tested.total} right ({tested.pct}%).</strong>{' '}
                {tested.pct >= 75 ? 'Your examples covered the plane well enough.' : 'The model has gaps. Look at where the red marks are, then add examples there.'}
              </p>
            </Callout>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ U3 */
export function NetPlayground({ onScore }: WidgetProps) {
  const [ds, setDs] = useState<DatasetId>('ring');
  const [hidden, setHidden] = useState(3);
  const data = useMemo(() => makeData(ds), [ds]);
  const [net, setNet] = useState(() => new Net(3));
  const [tick, setTick] = useState(0);
  const hard = DATASETS.find((d) => d.id === ds)!.hard;

  const reset = (h = hidden) => {
    setNet(new Net(h));
    setTick((t) => t + 1);
  };
  const train = (n: number) => {
    net.train(data, n);
    setTick((t) => t + 1);
    const acc = net.accuracy(data);
    onScore(hard ? acc : Math.min(acc, 60));
    play('tick');
  };

  const N = 24;
  const cells = useMemo(() => {
    const out: { x: number; y: number; p: number }[] = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) out.push({ x: i, y: j, p: net.predict(-1 + ((i + 0.5) * 2) / N, -1 + ((j + 0.5) * 2) / N) });
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [net, tick]);
  const acc = net.accuracy(data);

  return (
    <div className="bench-cols bench-cols--wide">
      <div>
        <svg viewBox="-1 -1 2 2" className="plot" role="img" aria-label={`Decision map of a network with ${hidden} hidden units on the ${ds} dataset. Accuracy ${acc} percent after ${net.epochs} training steps.`}>
          <g transform="scale(1 -1)">
            <rect x="-1" y="-1" width="2" height="2" fill="var(--paper-hi)" />
            {cells.map((c) => (
              <g key={`${c.x}-${c.y}`}>
                <rect x={-1 + (c.x * 2) / N} y={-1 + (c.y * 2) / N} width={2 / N} height={2 / N} fill={c.p >= 0.5 ? 'var(--teal)' : 'var(--ochre)'} opacity={0.15 + Math.abs(c.p - 0.5) * 0.7} />
                {c.p < 0.5 ? <rect x={-1 + (c.x * 2) / N} y={-1 + (c.y * 2) / N} width={2 / N} height={2 / N} fill="url(#hatch)" opacity={0.1} /> : null}
              </g>
            ))}
            {data.map((s, i) =>
              s.label ? (
                <circle key={i} cx={s.x} cy={s.y} r="0.034" fill="var(--teal)" stroke="var(--ink)" strokeWidth="0.012" />
              ) : (
                <rect key={i} x={s.x - 0.032} y={s.y - 0.032} width="0.064" height="0.064" fill="var(--ochre)" stroke="var(--ink)" strokeWidth="0.012" />
              ),
            )}
            <rect x="-1" y="-1" width="2" height="2" fill="none" stroke="var(--ink)" strokeWidth="0.02" />
          </g>
        </svg>
        <p className="small">Circles are class 1 and squares are class 0. The shaded map is what the network would answer at every point.</p>
      </div>
      <div className="stack">
        <div className="field">
          <label htmlFor="n-ds">Dataset</label>
          <select id="n-ds" className="select" value={ds} onChange={(e) => { setDs(e.target.value as DatasetId); setNet(new Net(hidden)); setTick((t) => t + 1); }}>
            {DATASETS.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="n-h">Hidden units: {hidden}</label>
          <input id="n-h" type="range" min={1} max={6} value={hidden} onChange={(e) => { const h = +e.target.value; setHidden(h); reset(h); }} />
          <span className="field__hint">Changing this resets the network.</span>
        </div>
        <div className="row">
          <Btn variant="quiet" onClick={() => train(1)}>Train 1 step</Btn>
          <Btn variant="primary" onClick={() => train(100)}>Train 100 steps</Btn>
          <Btn variant="quiet" icon="reset" onClick={() => reset()}>Reset</Btn>
        </div>
        <div role="status">
          <dl className="stats">
            <div><dt>Steps trained</dt><dd>{net.epochs}</dd></div>
            <div><dt>Loss (lower is better)</dt><dd>{net.loss(data).toFixed(3)}</dd></div>
            <div><dt>Accuracy</dt><dd>{acc}%</dd></div>
          </dl>
        </div>
        {hard ? (
          <Callout icon="target"><p>Goal: reach <strong>90%</strong>. Try training with 1 hidden unit, then with 4 or 5. Notice what changes.</p></Callout>
        ) : (
          <Callout icon="info"><p>Two blobs are easy. Switch to <strong>Ring</strong> or <strong>Corners</strong> to earn the full score.</p></Callout>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ U4 */
export function NextToken({ onScore }: WidgetProps) {
  const [start, setStart] = useState(0);
  const [temp, setTemp] = useState(0.2);
  const [tokens, setTokens] = useState<string[]>(STARTS[0]!.tokens);
  const [manual, setManual] = useState(0);
  const lastLow = useRef<string | null>(null);
  const lastHigh = useRef<string | null>(null);
  const [tasks, setTasks] = useState({ low: false, high: false, manual: false });
  const cands = useMemo(() => candidates(tokens, temp), [tokens, temp]);

  useEffect(() => {
    const score = (tasks.low ? 34 : 0) + (tasks.high ? 33 : 0) + (tasks.manual ? 33 : 0);
    if (score > 0) onScore(score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks]);

  const gen = () => {
    const out = generate(STARTS[start]!.tokens, 10, temp, Math.random);
    const text = render(out);
    setTokens(out);
    play('tick');
    if (temp <= 0.3) {
      if (lastLow.current === text) setTasks((t) => ({ ...t, low: true }));
      lastLow.current = text;
    } else if (temp >= 1.2) {
      if (lastHigh.current !== null && lastHigh.current !== text) setTasks((t) => ({ ...t, high: true }));
      lastHigh.current = text;
    }
  };
  const choose = (tok: string) => {
    setTokens((t) => [...t, tok]);
    play('tick');
    const n = manual + 1;
    setManual(n);
    if (n >= 3) setTasks((t) => ({ ...t, manual: true }));
  };

  return (
    <div className="bench-cols bench-cols--wide">
      <div className="stack">
        <div className="field">
          <label htmlFor="lm-start">Start the sentence with</label>
          <select id="lm-start" className="select" value={start} onChange={(e) => { const i = +e.target.value; setStart(i); setTokens(STARTS[i]!.tokens); lastLow.current = null; lastHigh.current = null; }}>
            {STARTS.map((s, i) => (
              <option key={s.label} value={i}>{s.label}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="lm-temp">Temperature: {temp.toFixed(1)}</label>
          <input id="lm-temp" type="range" min={0.1} max={2} step={0.1} value={temp} onChange={(e) => setTemp(+e.target.value)} />
          <span className="field__hint">Low is steady and repeats. High is varied and riskier.</span>
        </div>
        <div className="output-sheet" aria-live="polite">
          <p className="label">The model's text</p>
          <p className="output-sheet__text">{render(tokens)}</p>
        </div>
        <div className="row">
          <Btn variant="primary" onClick={gen}>Write 10 more words</Btn>
          <Btn variant="quiet" icon="reset" onClick={() => setTokens(STARTS[start]!.tokens)}>Start over</Btn>
        </div>
        <ul className="tasklist">
          <li className={tasks.low ? 'is-done' : ''}><Icon name={tasks.low ? 'check' : 'target'} /> Set temperature to 0.3 or lower and write twice from the same start. The text should match.</li>
          <li className={tasks.high ? 'is-done' : ''}><Icon name={tasks.high ? 'check' : 'target'} /> Set temperature to 1.2 or higher and write twice. The text should differ.</li>
          <li className={tasks.manual ? 'is-done' : ''}><Icon name={tasks.manual ? 'check' : 'target'} /> Build part of a sentence yourself by picking three next words ({Math.min(manual, 3)} of 3).</li>
        </ul>
      </div>
      <div>
        <p className="label">What could come next, and how likely it is</p>
        <ol className="cands">
          {cands.map((c) => (
            <li key={c.token}>
              <button type="button" className="cand" onClick={() => choose(c.token)}>
                <span className="visually-hidden">Add </span>
                <span className="cand__tok">{c.token}</span> <span className="cand__p">{Math.round(c.p * 100)}%</span>
                <span className="cand__bar" aria-hidden="true" style={{ width: `${Math.max(4, c.p * 100)}%` }} />
              </button>
            </li>
          ))}
        </ol>
        <p className="small">Click a word to add it. This model only knows one short story, so it is tiny. Large models learn from vastly more text, but the job is the same.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ U5 */
export function TokenWindow({ onScore }: WidgetProps) {
  const [text, setText] = useState(STARTER_TEXT);
  const f = fit(text);
  const ok = instructionVisible(text);
  useEffect(() => {
    if (ok && text !== STARTER_TEXT) {
      onScore(100);
      play('right');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ok]);

  return (
    <div className="stack">
      <div className="field">
        <label htmlFor="tw-text">Your message to the model</label>
        <textarea id="tw-text" className="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
        <span className="field__hint">Edit it. Move the instruction, or cut the passage. The instruction starts with “{INSTRUCTION.charAt(0).toUpperCase() + INSTRUCTION.slice(1)}”.</span>
      </div>
      <p className="score-line" role="status">
        <strong>{f.total} tokens.</strong> The window holds the last <strong>{WINDOW}</strong>. {f.dropped.length > 0 ? `${f.dropped.length} fell out and the model cannot see them.` : 'Everything fits.'}
      </p>
      <p className="tokens-view" aria-label="Your text split into tokens. Tokens that fell outside the window are shown crossed out.">
        {f.dropped.slice(-60).map((t, i) => (
          <span key={`d${i}`} className="tok tok--out">{t.replace(/ /g, ' ')}</span>
        ))}
        {f.kept.map((t, i) => (
          <span key={`k${i}`} className={`tok tok--${i % 4}`}>{t.replace(/ /g, ' ')}</span>
        ))}
      </p>
      <Callout icon={ok ? 'check' : 'warning'} tone={ok ? 'good' : 'bad'}>
        <p>{ok ? 'The instruction is inside the window, so the model can see what you asked.' : 'The instruction has fallen out of the window. The model will answer without ever seeing it.'}</p>
      </Callout>
      <Btn variant="quiet" icon="reset" onClick={() => setText(STARTER_TEXT)}>Reset the text</Btn>
    </div>
  );
}

/* ------------------------------------------------------------------ R1 */
export function BiasAudit({ onScore }: WidgetProps) {
  const [on, setOn] = useState<Set<Feature>>(new Set(['skill', 'exp', 'club', 'zip']));
  const a = useMemo(() => audit(on), [on]);
  const toggle = (f: Feature) => {
    play('tick');
    setOn((cur) => {
      const n = new Set(cur);
      if (n.has(f)) n.delete(f);
      else n.add(f);
      return n;
    });
  };
  useEffect(() => {
    onScore(a.score);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [a.score]);
  const sel = new Set(a.selected.map((x) => x.id));

  return (
    <div className="bench-cols bench-cols--wide">
      <div className="stack">
        <fieldset>
          <legend>What the model may look at</legend>
          {(Object.keys(FEATURE_LABEL) as Feature[]).map((f) => (
            <label key={f} className="option option--compact">
              <input type="checkbox" checked={on.has(f)} onChange={() => toggle(f)} />
              <span>{FEATURE_LABEL[f]}</span>
            </label>
          ))}
        </fieldset>
        <div role="status">
          <dl className="stats">
            <div><dt>Neighborhood A picked</dt><dd>{a.rateA}%</dd></div>
            <div><dt>Neighborhood B picked</dt><dd>{a.rateB}%</dd></div>
            <div><dt>Top-skill picked</dt><dd>{a.qualified} of {PICKS}</dd></div>
            <div><dt>Audit score</dt><dd>{a.score}</dd></div>
          </dl>
        </div>
        <Callout icon={a.score >= 80 ? 'check' : 'warning'} tone={a.score >= 80 ? 'good' : 'bad'}>
          <p>
            {a.score >= 80
              ? 'A fair spread, and it still picks the strongest applicants. You removed the proxies without throwing away skill.'
              : a.gap > 30
                ? 'One neighborhood is taking almost every place, with the same skills in both. Something other than skill is driving the choice. Which feature still carries it?'
                : 'Check whether you removed something that measures real skill.'}
          </p>
        </Callout>
      </div>
      <div className="table-wrap" tabIndex={0} role="region" aria-label="The twelve applicants and who the model picks">
        <table>
          <caption className="visually-hidden">The twelve applicants and who the model picks</caption>
          <thead>
            <tr><th scope="col">Applicant</th><th scope="col">Area</th><th scope="col">Skills</th><th scope="col">Years</th><th scope="col">Rowing</th><th scope="col">Picked?</th></tr>
          </thead>
          <tbody>
            {APPLICANTS.map((p) => (
              <tr key={p.id} className={sel.has(p.id) ? 'is-picked' : ''}>
                <th scope="row">{p.id.toUpperCase()}</th>
                <td>{p.zip}</td>
                <td>{p.skill}</td>
                <td>{p.exp}</td>
                <td>{p.club ? 'Yes' : 'No'}</td>
                <td>{sel.has(p.id) ? (<><Icon name="check" /> Picked</>) : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
