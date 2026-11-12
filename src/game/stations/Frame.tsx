/** The Weight Frame: three dials on one neuron, turned by hand or by gradient descent. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import { Btn, Callout } from '@/ui/primitives';
import { FRAME_ROUNDS, accuracy, clampDial, loss, step, type Dials } from '../logic/frame';
import type { StationProps } from './types';

const ZERO: Dials = { w1: 0, w2: 0, b: 0 };
const px = (v: number) => 50 + v * 48;
const py = (v: number) => 50 - v * 48;

/** The two ends of the line w1*x + w2*y + b = 0 inside the plane, or null if it never crosses. */
function lineEnds(d: Dials): [number, number, number, number] | null {
  const pts: [number, number][] = [];
  const add = (x: number, y: number) => {
    if (x >= -1.001 && x <= 1.001 && y >= -1.001 && y <= 1.001) pts.push([x, y]);
  };
  if (Math.abs(d.w2) > 1e-6) {
    add(-1, -(d.b - d.w1) / d.w2);
    add(1, -(d.b + d.w1) / d.w2);
  }
  if (Math.abs(d.w1) > 1e-6) {
    add(-(d.b - d.w2) / d.w1, -1);
    add(-(d.b + d.w2) / d.w1, 1);
  }
  if (pts.length < 2) return null;
  return [pts[0]![0], pts[0]![1], pts[1]![0], pts[1]![1]];
}

export function Frame({ round, onClear }: StationProps) {
  const R = FRAME_ROUNDS[round - 1]!;
  const [d, setD] = useState<Dials>(ZERO);
  const [history, setHistory] = useState<number[]>([loss(ZERO, R.threads)]);
  const [turned, setTurned] = useState(false);
  const cleared = useRef(false);
  const acc = useMemo(() => accuracy(d, R.threads), [d, R]);
  const l = useMemo(() => loss(d, R.threads), [d, R]);
  const line = lineEnds(d);

  useEffect(() => {
    if (turned && acc.pct === 100 && !cleared.current) {
      cleared.current = true;
      onClear();
    }
  }, [acc.pct, turned, onClear]);

  const set = (k: keyof Dials, v: number) => {
    setTurned(true);
    const next = { ...d, [k]: clampDial(v) };
    setD(next);
    setHistory((h) => [...h.slice(-59), loss(next, R.threads)]);
  };
  const learn = (n: number) => {
    setTurned(true);
    play('tick');
    let cur = d;
    const hist: number[] = [];
    for (let i = 0; i < n; i++) {
      cur = step(cur, R.threads);
      hist.push(loss(cur, R.threads));
    }
    const clamped = { w1: clampDial(cur.w1), w2: clampDial(cur.w2), b: clampDial(cur.b) };
    setD(clamped);
    setHistory((h) => [...h, ...hist].slice(-60));
  };

  const max = Math.max(...history, 0.01);
  const spark = history.map((v, i) => `${(i / Math.max(1, history.length - 1)) * 100},${40 - (v / max) * 36}`).join(' ');

  return (
    <div className="st st--frame">
      <p className="st__brief">{R.brief}</p>
      <div className="st__grid">
        <div className="plane plane--frame" role="img" aria-label={`Frame with ${R.threads.length} threads. ${acc.right} are sorted correctly.`}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect width="100" height="100" fill="var(--paper)" />
            {line ? (
              <>
                <path d={`M${px(line[0])} ${py(line[1])}L${px(line[2])} ${py(line[3])}`} stroke="var(--ink)" strokeWidth="1.6" />
                <polygon points={halfPlane(d)} fill="url(#hatch)" opacity="0.35" />
              </>
            ) : null}
            <path d="M50 0V100M0 50H100" stroke="var(--ink)" strokeWidth="0.3" opacity="0.4" />
            {R.threads.map((t, i) => {
              const wrong = acc.wrong.includes(t);
              return (
                <g key={i}>
                  {t.label ? <path d={`M${px(t.x)} ${py(t.y) - 3}l3 3-3 3-3-3z`} fill="var(--ink)" /> : <circle cx={px(t.x)} cy={py(t.y)} r="2.6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="0.9" />}
                  {wrong ? <circle cx={px(t.x)} cy={py(t.y)} r="5" fill="none" stroke="var(--ink)" strokeWidth="0.8" strokeDasharray="1.6 1.4" /> : null}
                </g>
              );
            })}
          </svg>
        </div>
        <div className="st__side">
          <div className="dials">
            <Dial label="Weight 1: how much left-right matters" value={d.w1} onChange={(v) => set('w1', v)} />
            <Dial label="Weight 2: how much up-down matters" value={d.w2} onChange={(v) => set('w2', v)} />
            <Dial label="Bias: slides the line without turning it" value={d.b} onChange={(v) => set('b', v)} />
          </div>
          <p className="st__meter" aria-live="polite">
            <strong>{acc.right}</strong> of {acc.total} threads sorted &middot; error <strong>{l.toFixed(2)}</strong>
          </p>
          <svg className="spark" viewBox="0 0 100 40" aria-label="Error over your last changes" role="img">
            <polyline points={spark} fill="none" stroke="var(--ink)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          </svg>
          <div className="row">
            <Btn variant="secondary" onClick={() => learn(1)}>Nudge once</Btn>
            <Btn variant="primary" icon="play" onClick={() => learn(60)}>Let it learn</Btn>
            <Btn variant="quiet" icon="reset" onClick={() => { setD(ZERO); setHistory([loss(ZERO, R.threads)]); }}>Reset dials</Btn>
          </div>
          {acc.pct === 100 && turned ? (
            <Callout icon="check" tone="good">Every thread is sorted. Dark diamonds sit on one side of the line and open circles on the other.</Callout>
          ) : (
            <Callout icon="info">Diamonds should end up on the hatched side and circles on the other. Dashed rings mark threads on the wrong side.</Callout>
          )}
        </div>
      </div>
      <p className="st__foot"><Icon name="info" /> One neuron: it says &ldquo;diamond&rdquo; when weight 1 &times; x + weight 2 &times; y + bias is above zero. &ldquo;Let it learn&rdquo; nudges all three dials to lower the error, which is what training means.</p>
    </div>
  );
}

function Dial({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="dial">
      <span className="dial__label">{label}</span>
      <span className="dial__row">
        <input type="range" min={-6} max={6} step={0.1} value={value} onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={`${value.toFixed(1)}`} />
        <output>{value.toFixed(1)}</output>
      </span>
    </label>
  );
}

/** The corners of the plane on the positive side of the line, as an SVG polygon. */
function halfPlane(d: Dials): string {
  const corners: [number, number][] = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
  const f = (x: number, y: number) => d.w1 * x + d.w2 * y + d.b;
  const out: [number, number][] = [];
  for (let i = 0; i < 4; i++) {
    const a = corners[i]!;
    const b = corners[(i + 1) % 4]!;
    const fa = f(a[0], a[1]);
    const fb = f(b[0], b[1]);
    if (fa > 0) out.push(a);
    if (fa > 0 !== fb > 0) {
      const t = fa / (fa - fb);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out.map(([x, y]) => `${px(x)},${py(y)}`).join(' ');
}
