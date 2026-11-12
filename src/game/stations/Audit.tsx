/** The Fairness Audit: find which traits stand in for district, then change the screener until it is fair and still accurate. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@/art/Icons';
import { Btn, Callout } from '@/ui/primitives';
import { AUDIT_ROUNDS, FEATURE_LABEL, SLICE_LABEL, run, slice, type Feature, type SliceKey } from '../logic/audit';
import type { StationProps } from './types';

export function Audit({ round, onClear }: StationProps) {
  const R = AUDIT_ROUNDS[round - 1]!;
  const [on, setOn] = useState<Set<Feature>>(new Set(R.features));
  const [review, setReview] = useState(false);
  const [key, setKey] = useState<SliceKey>('district');
  const [submitted, setSubmitted] = useState(false);
  const cleared = useRef(false);
  const out = useMemo(() => run(R, { on, review }), [R, on, review]);
  const base = useMemo(() => run(R, { on: new Set(R.features), review: false }), [R]);
  const rows = useMemo(() => slice(R, base.approved, key), [R, base, key]);
  const keys = (['district', 'device', 'club', 'prep', 'grades'] as SliceKey[]).filter((k) => k === 'district' || k === 'grades' || R.features.includes(k as Feature));
  const scholarships = R.applicants.filter((a) => a.qualified).length;

  useEffect(() => {
    if (submitted && out.pass && !cleared.current) {
      cleared.current = true;
      onClear();
    }
  }, [submitted, out.pass, onClear]);

  const flip = (f: Feature) => {
    setSubmitted(false);
    setOn((s) => {
      const n = new Set(s);
      if (n.has(f)) n.delete(f);
      else n.add(f);
      return n;
    });
  };
  const criteria = [
    { ok: out.gap <= R.gapMax, text: `Gap between districts ${out.gap} points (needs ${R.gapMax} or fewer)` },
    { ok: out.accuracy >= R.accMin, text: `Accuracy ${out.accuracy}% (needs ${R.accMin}% or more)` },
    { ok: out.reviewed <= R.reviewMax, text: `Files re-read by a person: ${out.reviewed} (up to ${R.reviewMax})` },
  ];

  return (
    <div className="st st--audit">
      <p className="st__brief">{R.brief} The screener approves {scholarships} of {R.applicants.length} applicants, one per qualified applicant. Both districts have the same spread of ability by design, so any gap in who is approved is the screener&apos;s doing.</p>
      <div className="st__grid st__grid--audit">
        <section aria-labelledby="aud-i">
          <h4 id="aud-i">1. Investigate the current screener</h4>
          <fieldset className="slices">
            <legend>Slice the applicants by</legend>
            {keys.map((k) => (
              <label key={k} className={`chipbtn${key === k ? ' is-on' : ''}`}>
                <input type="radio" name="slice" checked={key === k} onChange={() => setKey(k)} />
                {SLICE_LABEL[k]}
              </label>
            ))}
          </fieldset>
          <table className="aud-table">
            <caption className="visually-hidden">Approval rate and qualified rate by {SLICE_LABEL[key]}</caption>
            <thead>
              <tr><th scope="col">Group</th><th scope="col">People</th><th scope="col">From South</th><th scope="col">Approved</th><th scope="col">Actually qualified</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.group}>
                  <th scope="row">{r.group}</th>
                  <td>{r.n}</td>
                  <td>{r.southShare}%</td>
                  <td><strong>{r.approvedPct}%</strong></td>
                  <td>{r.qualifiedPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="muted small">Look for a trait where the approved rate is far from the qualified rate, and where one district is over-represented.</p>
        </section>
        <section aria-labelledby="aud-f">
          <h4 id="aud-f">2. Change the screener</h4>
          <fieldset className="features">
            <legend>Information the screener may use</legend>
            {R.features.map((f) => (
              <label key={f} className="check">
                <input type="checkbox" checked={on.has(f)} onChange={() => flip(f)} /> {FEATURE_LABEL[f]}
              </label>
            ))}
            <label className="check">
              <input type="checkbox" checked={review} onChange={() => { setReview((v) => !v); setSubmitted(false); }} /> A person re-reads the borderline files ({R.reviewMax} files)
            </label>
          </fieldset>
          <dl className="aud-stats">
            <div><dt>North approved</dt><dd>{out.rate.North}%</dd></div>
            <div><dt>South approved</dt><dd>{out.rate.South}%</dd></div>
            <div><dt>Gap</dt><dd>{out.gap} pts</dd></div>
            <div><dt>Accuracy</dt><dd>{out.accuracy}%</dd></div>
            <div><dt>Qualified, turned away</dt><dd>{out.qualifiedRejected}</dd></div>
          </dl>
          <ul className="criteria">
            {criteria.map((c) => (
              <li key={c.text} className={c.ok ? 'is-ok' : 'is-bad'}>
                <Icon name={c.ok ? 'check' : 'x'} /> {c.text}
              </li>
            ))}
          </ul>
          <Btn variant="primary" icon="check" onClick={() => setSubmitted(true)}>Submit this screener</Btn>
          {submitted ? (
            out.pass ? (
              <Callout icon="check" tone="good">Fair and accurate. {R.proxies.map((p) => FEATURE_LABEL[p]).join(' and ')} stood in for district: it carried the old unfairness without ever naming it. Removing it did not cost accuracy here, because the information it added was not about merit. In real data you rarely know who is qualified, which is why you audit outcomes.</Callout>
            ) : (
              <Callout icon="warning" tone="bad">Not yet. Check the three requirements above. If something got worse after you changed it, undo that change.</Callout>
            )
          ) : null}
        </section>
      </div>
      <p className="st__foot"><Icon name="info" /> All applicants are invented. The screener is a scoring rule built to show how a model trained on past decisions can carry their bias. It is not a real system.</p>
    </div>
  );
}
