import { useId, useMemo, useState, type ReactNode } from 'react';
import { Btn, Callout } from '@/ui/primitives';
import { type Pt } from '@/art/ink';
import { C } from '@/art/palette';
import { Pen, Round } from '@/art/field/ink';
import {
  CONNECTIONS,
  DEFAULT_INPUTS,
  INITIAL_WEIGHTS,
  LAYER_NAMES,
  SIZES,
  UNIT_NAMES,
  cloneWeights,
  describeEffect,
  forward,
  weightOf,
  withWeight,
} from './topologyModel';

const W = 800;
const H = 470;
const LX = [100, 300, 500, 700];
const unitY = (l: number, i: number): number => H / 2 + (i - (SIZES[l]! - 1) / 2) * 100;
const pos = (l: number, i: number): Pt => [LX[l]!, unitY(l, i)];

/** A neural network small enough to follow by hand: see its parts, send a signal through it layer by layer, and change a weight. */
export default function NeuralTopology() {
  const uid = useId();
  const [inputs, setInputs] = useState<number[]>([...DEFAULT_INPUTS]);
  const [weights, setWeights] = useState(() => cloneWeights(INITIAL_WEIGHTS));
  const [reached, setReached] = useState(3);
  const [sel, setSel] = useState(0);
  const [effect, setEffect] = useState<string>('Choose a connection, then move the weight. The note here will say what happened to the output.');

  const pass = useMemo(() => forward(inputs, weights), [inputs, weights]);
  const original = useMemo(() => forward(inputs, INITIAL_WEIGHTS).a[3]![0]!, [inputs]);
  const out = pass.a[3]![0]!;
  const c = CONNECTIONS[sel]!;
  const wv = weightOf(weights, c);
  const changed = JSON.stringify(weights) !== JSON.stringify(INITIAL_WEIGHTS);

  // static hand-inked rings, drawn once
  const rings = useMemo(() => {
    const out: ReactNode[] = [];
    SIZES.forEach((n, l) => {
      for (let i = 0; i < n; i++) out.push(<Round key={`r${l}-${i}`} cx={LX[l]!} cy={unitY(l, i)} r={27} w={2.4} seed={l * 20 + i + 3} irr={0.03} />);
    });
    return out;
  }, []);

  const lines = useMemo(() => {
    const out: ReactNode[] = [];
    for (const k of CONNECTIONS) {
      const w = weightOf(weights, k);
      const a = pos(k.l, k.from);
      const b = pos(k.l + 1, k.to);
      const lit = reached >= k.l + 1;
      const width = 1 + Math.abs(w) * 7;
      const op = lit ? 0.85 : 0.16;
      const color = w >= 0 ? C.cobalt : C.vermilion;
      const start: Pt = [a[0] + 27, a[1] + (b[1] - a[1]) * 0.1];
      const end: Pt = [b[0] - 27, b[1] - (b[1] - a[1]) * 0.1];
      if (k.index === sel) out.push(<Pen key={`h${k.index}`} pts={[start, end]} w={width + 7} color={C.ink} opacity={0.14} smooth={false} wob={0} taper={0.05} seed={k.index} />);
      if (w >= 0) {
        out.push(<Pen key={`c${k.index}`} pts={[start, end]} w={width} color={color} opacity={op} smooth={false} wob={1} taper={0.1} seed={k.index + 7} />);
      } else {
        // negative weights are dashed, so sign is never carried by colour alone
        for (let d = 0; d < 7; d++) {
          const t0 = d / 7 + 0.01;
          const t1 = d / 7 + 0.09;
          out.push(<Pen key={`c${k.index}-${d}`} pts={[[start[0] + (end[0] - start[0]) * t0, start[1] + (end[1] - start[1]) * t0], [start[0] + (end[0] - start[0]) * t1, start[1] + (end[1] - start[1]) * t1]]} w={width} color={color} opacity={op} smooth={false} wob={0.3} taper={0.1} seed={k.index * 9 + d} />);
        }
      }
    }
    return out;
  }, [weights, reached, sel]);

  const mid: Pt = [(pos(c.l, c.from)[0] + pos(c.l + 1, c.to)[0]) / 2, (pos(c.l, c.from)[1] + pos(c.l + 1, c.to)[1]) / 2];

  const onWeight = (v: number) => {
    const next = withWeight(weights, c, v);
    setWeights(next);
    setEffect(describeEffect(c, weightOf(INITIAL_WEIGHTS, c), v, original, forward(inputs, next).a[3]![0]!));
  };
  const setInput = (i: number, v: number) => setInputs((cur) => cur.map((x, j) => (j === i ? v : x)));

  const layerText = reached === 0 ? 'Only the inputs are showing.' : `Showing the signal as far as ${LAYER_NAMES[reached]!.toLowerCase()} (layer ${reached + 1} of 4).`;

  return (
    <div className="instrument topology">
      <div className="instrument__grid instrument__grid--wide">
        <figure className="figure topology__fig">
          <div className="plate">
            <svg viewBox={`0 0 ${W} ${H}`} aria-hidden="true" focusable="false" className="topology__svg">
              {LAYER_NAMES.map((n, l) => (
                <text key={n} x={LX[l]} y={26} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={C.graphite2} letterSpacing="0.06em">
                  {n.toUpperCase()}
                </text>
              ))}
              {lines}
              {SIZES.flatMap((n, l) =>
                Array.from({ length: n }, (_, i) => {
                  const lit = l === 0 || reached >= l;
                  const a = pass.a[l]![i]!;
                  return (
                    <g key={`n${l}-${i}`}>
                      <circle cx={LX[l]} cy={unitY(l, i)} r={26} fill={C.boneHi} />
                      {lit ? <circle cx={LX[l]} cy={unitY(l, i)} r={26} fill={C.cobalt} fillOpacity={0.08 + a * 0.62} /> : null}
                      {lit ? (
                        <text x={LX[l]} y={unitY(l, i) + 4.5} textAnchor="middle" fontSize="13" fontFamily="var(--font-mono)" fill={a > 0.6 ? C.boneHi : C.ink}>
                          {a.toFixed(2)}
                        </text>
                      ) : null}
                      <text x={LX[l]} y={unitY(l, i) + 46} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill={C.graphite2}>
                        {UNIT_NAMES[l]![i]}
                      </text>
                    </g>
                  );
                }),
              )}
              {rings}
              <g>
                <rect x={mid[0] - 30} y={mid[1] - 11} width={60} height={22} fill={C.boneHi} stroke={C.ink} strokeWidth="1.2" />
                <text x={mid[0]} y={mid[1] + 4} textAnchor="middle" fontSize="12" fontFamily="var(--font-mono)" fill={C.ink}>
                  w {wv.toFixed(2)}
                </text>
              </g>
            </svg>
          </div>
          <figcaption>
            <span className="fig-no">Key</span>
            <span>
              Each circle is a unit and its number is what it passes on, from 0 to 1. A thicker line is a bigger weight. Solid blue lines excite the unit they reach (positive weight). Dashed red lines inhibit it (negative weight). The boxed connection is the one you are editing.
            </span>
          </figcaption>
        </figure>

        <div className="controls">
          <fieldset>
            <legend>1. Choose the numbers going in</legend>
            {inputs.map((v, i) => (
              <div className="slider" key={i}>
                <div className="slider__head">
                  <label htmlFor={`${uid}-in${i}`}>Input {i + 1}</label>
                  <output htmlFor={`${uid}-in${i}`} className="num">
                    {v.toFixed(2)}
                  </output>
                </div>
                <input id={`${uid}-in${i}`} type="range" min={0} max={1} step={0.05} value={v} onChange={(e) => setInput(i, +e.target.value)} />
              </div>
            ))}
          </fieldset>

          <fieldset>
            <legend>2. Send the signal through, layer by layer</legend>
            <div className="row">
              <Btn small icon="arrow-left" disabled={reached === 0} aria-disabled={reached === 0} onClick={() => setReached(Math.max(0, reached - 1))}>
                Back a layer
              </Btn>
              <Btn small variant="primary" go disabled={reached === 3} aria-disabled={reached === 3} onClick={() => setReached(Math.min(3, reached + 1))}>
                Next layer
              </Btn>
              <Btn small variant="quiet" onClick={() => setReached(3)}>
                Show every layer
              </Btn>
            </div>
            <p className="note" role="status">
              {layerText}
            </p>
          </fieldset>

          <fieldset>
            <legend>3. Change one weight</legend>
            <div className="field">
              <label htmlFor={`${uid}-conn`}>Connection</label>
              <select id={`${uid}-conn`} className="select" value={sel} onChange={(e) => setSel(+e.target.value)}>
                {LAYER_NAMES.slice(0, 3).map((n, l) => (
                  <optgroup key={n} label={`${n} to ${LAYER_NAMES[l + 1]!.toLowerCase()}`}>
                    {CONNECTIONS.filter((k) => k.l === l).map((k) => (
                      <option key={k.index} value={k.index}>
                        {k.label} (weight {weightOf(weights, k).toFixed(2)})
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="slider">
              <div className="slider__head">
                <label htmlFor={`${uid}-w`}>Weight</label>
                <output htmlFor={`${uid}-w`} className="num">
                  {wv.toFixed(2)}
                </output>
              </div>
              <input id={`${uid}-w`} type="range" min={-1} max={1} step={0.05} value={wv} onChange={(e) => onWeight(+e.target.value)} />
            </div>
            <div className="row">
              <Btn small variant="quiet" icon="reset" disabled={!changed} aria-disabled={!changed} onClick={() => { setWeights(cloneWeights(INITIAL_WEIGHTS)); setEffect('Every weight is back to where it started.'); }}>
                Put every weight back
              </Btn>
            </div>
          </fieldset>
        </div>
      </div>

      <div className="topology__out">
        <dl className="metrics">
          <div>
            <dt>Output now</dt>
            <dd className="num">{out.toFixed(2)}</dd>
          </div>
          <div>
            <dt>With the original weights</dt>
            <dd className="num">{original.toFixed(2)}</dd>
          </div>
        </dl>
        <div className="change" role="status" aria-live="polite">
          <p className="label">What happened</p>
          <p>{effect}</p>
        </div>
      </div>

      <details className="disclosure">
        <summary>The arithmetic, unit by unit</summary>
        <div className="disclosure__body">
          <div className="table-wrap" tabIndex={0} role="region" aria-label="Weighted sum and output for each unit">
            <table>
              <caption className="visually-hidden">Weighted sum and output for each unit shown</caption>
              <thead>
                <tr>
                  <th scope="col">Layer</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Weighted sum</th>
                  <th scope="col">Passes on</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.flatMap((n, l) =>
                  l > reached
                    ? []
                    : Array.from({ length: n }, (_, i) => (
                        <tr key={`${l}-${i}`}>
                          <td>{LAYER_NAMES[l]}</td>
                          <th scope="row">{UNIT_NAMES[l]![i]}</th>
                          <td className="num">{l === 0 ? 'given' : pass.z[l]![i]!.toFixed(2)}</td>
                          <td className="num">{pass.a[l]![i]!.toFixed(2)}</td>
                        </tr>
                      )),
                )}
              </tbody>
            </table>
          </div>
          <p className="note">The weighted sum is each number a unit receives times its weight, added together. The unit then squashes that sum into a number between 0 and 1 with an S-shaped curve, and passes the result on.</p>
        </div>
      </details>

      <Callout icon="info">
        <p>
          <strong>What this shows.</strong> A neural network is layers of simple units joined by weighted connections. Nothing inside it is a rule anyone wrote: the weights are just numbers. <em>Training</em> is the search for good numbers, by nudging every weight a tiny amount in whichever direction makes the output more correct. Here you nudge one by hand to see why that is powerful, and why a network with millions of them cannot be checked by looking at them.
        </p>
      </Callout>
    </div>
  );
}
