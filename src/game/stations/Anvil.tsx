/** The Anvil Orders: build a prompt from pieces for a client's job, then strike the (simulated) forge. */
import { useMemo, useState } from 'react';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import { Btn, Callout } from '@/ui/primitives';
import { CAP, ORDERS, TAG_LABEL, forge, type Piece, type Tag, type Verdict } from '../logic/anvil';
import type { StationProps } from './types';

const ORDER: (Tag | 'filler')[] = ['task', 'context', 'audience', 'format', 'limits', 'filler'];

/** A fixed shuffle, so related pieces are not next to each other and the tray is the same for every player. */
const shuffled = (pieces: readonly Piece[], round: number): Piece[] => [...pieces].sort((a, b) => ((a.id.charCodeAt(4) * 7 + round * 13) % 11) - ((b.id.charCodeAt(4) * 7 + round * 13) % 11) || a.id.localeCompare(b.id));

export function Anvil({ round, onClear }: StationProps) {
  const order = ORDERS[round - 1]!;
  const tray = useMemo(() => shuffled(order.pieces, round), [order, round]);
  const [chosen, setChosen] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<Verdict | null>(null);

  const toggle = (id: string) => {
    play('place');
    setVerdict(null);
    setChosen((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= CAP ? c : [...c, id]));
  };
  const picked = tray.filter((p) => chosen.includes(p.id)).sort((a, b) => ORDER.indexOf(a.tag) - ORDER.indexOf(b.tag));

  const strike = () => {
    const v = forge(order, chosen);
    setVerdict(v);
    if (v.pass) onClear();
    else play('wrong');
  };

  return (
    <div className="st st--anvil">
      <div className="order">
        <p className="label">{order.client}</p>
        <h4>{order.title}</h4>
        <p>&ldquo;{order.brief}&rdquo;</p>
        <p className="order__needs">
          <strong>What the order needs:</strong> {order.needs.map((n) => TAG_LABEL[n]).join(', ')}
          {order.leakNote ? '. And nothing private leaves the shop.' : '.'}
        </p>
      </div>
      <div className="st__grid st__grid--anvil">
        <fieldset className="tray">
          <legend>
            Pieces: choose up to {CAP} <span aria-live="polite">({chosen.length} chosen)</span>
          </legend>
          {tray.map((p) => {
            const on = chosen.includes(p.id);
            return (
              <button key={p.id} type="button" className={`piece${on ? ' is-on' : ''}`} aria-pressed={on} data-id={p.id} onClick={() => toggle(p.id)} disabled={!on && chosen.length >= CAP}>
                <span className="piece__tag">{p.tag === 'filler' ? 'Other' : TAG_LABEL[p.tag]}</span>
                <span>{p.text}</span>
              </button>
            );
          })}
        </fieldset>
        <div className="st__side">
          <div className="assembled" aria-label="Your prompt so far">
            <p className="label">Your prompt</p>
            {picked.length ? <ol>{picked.map((p) => <li key={p.id}>{p.text}</li>)}</ol> : <p className="muted">Choose pieces from the tray.</p>}
          </div>
          <div className="row">
            <Btn variant="primary" icon="play" onClick={strike} disabled={!chosen.length}>Strike the forge</Btn>
            <Btn variant="quiet" icon="reset" onClick={() => { setChosen([]); setVerdict(null); }} disabled={!chosen.length}>Clear</Btn>
          </div>
          {verdict ? (
            <div className="forge" role="status">
              <p className="label">The forge shows</p>
              <ul>
                {verdict.lines.map((l) => (
                  <li key={l.tag} className={l.ok ? 'is-ok' : 'is-bad'}>
                    <Icon name={l.ok ? 'check' : 'x'} /> <strong>{TAG_LABEL[l.tag]}.</strong> {l.text}
                  </li>
                ))}
                {verdict.leaks.length ? (
                  <li className="is-bad">
                    <Icon name="warning" /> <strong>Privacy.</strong> {order.leakNote}
                  </li>
                ) : null}
              </ul>
              {verdict.filler.length ? (
                <>
                  <p className="label">Pieces that did not help</p>
                  <ul className="forge__why">
                    {verdict.filler.map((p) => <li key={p.id}>&ldquo;{p.text}&rdquo; {p.why}</li>)}
                  </ul>
                </>
              ) : null}
              {verdict.pass ? <Callout icon="check" tone="good">Order filled. Every need is met and nothing private left the shop.</Callout> : <Callout icon="warning" tone="bad">Not yet. Fix what the forge shows, then strike again.</Callout>}
              {verdict.pass ? (
                <ul className="forge__why">
                  {picked.map((p) => <li key={p.id}><strong>{p.tag === 'filler' ? 'Other' : TAG_LABEL[p.tag]}:</strong> {p.why}</li>)}
                </ul>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
      <p className="st__foot"><Icon name="info" /> The forge is a simulation that follows fixed rules written for this game. It is not a live AI and it does not write anything. It shows what each part of a prompt changes.</p>
    </div>
  );
}
