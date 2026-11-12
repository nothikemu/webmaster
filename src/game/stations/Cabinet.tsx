/** The Curator's Cabinet: spend a label budget on the moths that teach the model most, then test it on moths it has never seen. */
import { useMemo, useState } from 'react';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import { Btn, Callout } from '@/ui/primitives';
import { CABINET_ROUNDS, evaluate, missSide, predict, type Moth, type Report } from '../logic/cabinet';
import type { StationProps } from './types';

const NAME = ['pollinator', 'silk-eater'] as const;
const GRID = 18;

export function Cabinet({ round, onClear }: StationProps) {
  const R = CABINET_ROUNDS[round - 1]!;
  const [labeled, setLabeled] = useState<number[]>([]);
  const [scouts, setScouts] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [said, setSaid] = useState('');
  const pool = useMemo<Moth[]>(() => (scouts ? [...R.pool, ...(R.scouts ?? [])] : R.pool), [R, scouts]);
  const budget = R.budget + (scouts ? R.scoutBudget ?? 0 : 0);
  const left = budget - labeled.length;
  const known = useMemo(() => pool.filter((m) => labeled.includes(m.id)), [pool, labeled]);

  const cells = useMemo(() => {
    if (!known.length) return [];
    const out: { x: number; y: number; k: 0 | 1 }[] = [];
    for (let i = 0; i < GRID; i++) for (let j = 0; j < GRID; j++) {
      const x = ((i + 0.5) / GRID) * 100;
      const y = ((j + 0.5) / GRID) * 100;
      out.push({ x, y, k: predict(known, x, y)! });
    }
    return out;
  }, [known]);

  const label = (m: Moth) => {
    if (labeled.includes(m.id) || left <= 0) {
      if (left <= 0 && !labeled.includes(m.id)) setSaid('No labels left. Test the model, or clear your labels and spend them differently.');
      return;
    }
    play('place');
    setLabeled((l) => [...l, m.id]);
    setReport(null);
    setSaid(`That specimen is a ${NAME[m.kind]}. ${left - 1} ${left - 1 === 1 ? 'label' : 'labels'} left.`);
  };

  const test = () => {
    const r = evaluate(known, R);
    setReport(r);
    if (r.pass) {
      setSaid(`The model sorted ${r.right} of ${r.total} hidden moths correctly. Round cleared.`);
      onClear();
    } else {
      play('wrong');
      setSaid(`The model sorted ${r.right} of ${r.total} correctly, ${r.pct} percent. The target is ${R.target}.`);
    }
  };

  const side = report && !report.pass ? missSide(report) : null;

  return (
    <div className="st st--cabinet">
      <p className="st__brief">{R.brief}</p>
      <div className="st__grid">
        <div className="plane" aria-label="Moth plane. Wingspan runs left to right, pattern density runs bottom to top.">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <rect width="100" height="100" fill="var(--paper)" />
            {cells.map((c) => (c.k === 1 ? <rect key={`${c.x}${c.y}`} x={c.x - 50 / GRID} y={100 - c.y - 50 / GRID} width={100 / GRID} height={100 / GRID} fill="url(#hatch)" opacity="0.5" /> : null))}
            {R.round === 3 && !scouts ? <rect x="50" width="50" height="100" fill="url(#tone)" opacity="0.14" /> : null}
            {report?.missed.map((m) => (
              <path key={m.id} d={`M${m.x - 1.8} ${100 - m.y - 1.8}l3.6 3.6m0-3.6l-3.6 3.6`} stroke="var(--ink)" strokeWidth="1.2" fill="none" />
            ))}
          </svg>
          {R.round === 3 && !scouts ? <span className="plane__note">No specimens from here yet</span> : null}
          {pool.map((m, i) => {
            const on = labeled.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                data-id={m.id}
                className={`spec${on ? ` is-labeled is-k${m.kind}` : ''}`}
                style={{ left: `${m.x}%`, top: `${100 - m.y}%` }}
                aria-label={`Specimen ${i + 1}: wingspan ${Math.round(m.x)}, pattern ${Math.round(m.y)}, ${on ? NAME[m.kind] : 'unlabeled'}`}
                aria-pressed={on}
                onClick={() => label(m)}
              >
                <span aria-hidden="true">{on ? (m.kind === 1 ? '◆' : '○') : '?'}</span>
              </button>
            );
          })}
          <span className="plane__x" aria-hidden="true">Wingspan &rarr;</span>
          <span className="plane__y" aria-hidden="true">Pattern &uarr;</span>
        </div>
        <div className="st__side">
          <p className="st__meter" aria-live="polite">
            <strong>{left}</strong> of {budget} labels left
          </p>
          <ul className="legend">
            <li><span aria-hidden="true">{'◆'}</span> silk-eater (eats the loom&apos;s silk)</li>
            <li><span aria-hidden="true">{'○'}</span> pollinator (harmless)</li>
            <li><span aria-hidden="true">?</span> unlabeled: spend a label to look</li>
            <li><span aria-hidden="true" className="legend__hatch" /> hatching: where the model now says silk-eater</li>
          </ul>
          <div className="row">
            <Btn variant="primary" icon="target" onClick={test} disabled={known.length < 2}>Test the model</Btn>
            <Btn variant="quiet" icon="reset" onClick={() => { setLabeled([]); setReport(null); setSaid('Labels cleared.'); }} disabled={!labeled.length}>Clear labels</Btn>
          </div>
          {R.scouts && !scouts && report ? (
            <Btn variant="secondary" onClick={() => { play('select'); setScouts(true); setReport(null); setSaid(`Scouts returned from the east with ${R.scouts!.length} new specimens and ${R.scoutBudget} extra labels.`); }}>
              Send scouts east (+{R.scoutBudget} labels)
            </Btn>
          ) : null}
          {report ? (
            <Callout icon={report.pass ? 'check' : 'warning'} tone={report.pass ? 'good' : 'bad'}>
              <strong>{report.pct}%</strong> of hidden moths sorted correctly ({report.right} of {report.total}). Target: {R.target}%.
              {!report.pass && side === 'east' ? ' Nearly every miss is in the east, where the model never saw a single moth. It guesses from the nearest ones it knows, and the east behaves differently.' : null}
              {!report.pass && side === 'west' ? ' The misses are all in the west.' : null}
              {!report.pass && side === 'mixed' && R.round === 1 ? ' Look at where the crosses cluster: along the slanted boundary. Labels there tell the model the most.' : null}
              {!report.pass && side === 'mixed' && R.round === 2 ? ' Each kind lives in two places. Is there a corner of the plane where you have not labeled anything?' : null}
            </Callout>
          ) : null}
          <p className="visually-hidden" role="status">{said}</p>
        </div>
      </div>
      <p className="st__foot"><Icon name="info" /> A 1-nearest-neighbor model: each hidden moth is sorted like the closest moth you labeled. A teaching model, not a production system.</p>
    </div>
  );
}
