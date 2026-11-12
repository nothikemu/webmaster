/** The Weld Test: the assistant's answer is made of claims, the source packet is sealed, and tests are limited. */
import { useState } from 'react';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import { Btn, Callout } from '@/ui/primitives';
import { CASES, grade, type Flag, type Grade } from '../logic/weld';
import type { StationProps } from './types';

const WORD = { supported: 'Supported by the packet', contradicted: 'Contradicted by the packet', missing: 'Not in the packet' } as const;

export function Weld({ round, onClear }: StationProps) {
  const C = CASES[round - 1]!;
  const [tested, setTested] = useState<string[]>([]);
  const [flags, setFlags] = useState<Record<string, Flag | undefined>>({});
  const [result, setResult] = useState<Grade | null>(null);
  const left = C.tests - tested.length;

  const test = (id: string) => {
    if (tested.includes(id) || left <= 0) return;
    play('select');
    setTested((t) => [...t, id]);
  };
  const submit = () => {
    const g = grade(C, flags);
    setResult(g);
    if (g.pass) onClear();
    else play('wrong');
  };
  const again = () => {
    setTested([]);
    setFlags({});
    setResult(null);
  };
  const answered = C.claims.every((c) => flags[c.id]);

  return (
    <div className="st st--weld">
      <div className="order">
        <p className="label">The question</p>
        <h4>&ldquo;{C.question}&rdquo;</h4>
        <p>The assistant answered from a sealed source packet of {C.packet.length} numbered paragraphs. You have <strong>{left}</strong> of {C.tests} tests left. A test opens the packet at the paragraph that settles one claim.</p>
      </div>
      <ol className="claims">
        {C.claims.map((c, i) => {
          const open = tested.includes(c.id) || !!result;
          const flag = flags[c.id];
          const wrong = result?.wrong.includes(c.id);
          return (
            <li key={c.id} className={`claim${result ? (wrong ? ' is-wrong' : ' is-right') : ''}`}>
              <p className="claim__text"><span className="claim__n">{i + 1}</span> {c.text}</p>
              {open ? (
                <p className={`claim__ev is-${c.truth}`}>
                  <Icon name={c.truth === 'supported' ? 'check' : 'x'} /> <strong>{WORD[c.truth]}.</strong> {c.evidence}
                  {result && c.cue ? <><br /><em>What gave it away: {c.cue}</em></> : null}
                </p>
              ) : null}
              <div className="claim__ctl" role="group" aria-label={`Claim ${i + 1}`}>
                <Btn small variant="secondary" icon="search" onClick={() => test(c.id)} disabled={tested.includes(c.id) || left <= 0 || !!result}>
                  {tested.includes(c.id) ? 'Tested' : 'Test this'}
                </Btn>
                <Btn small variant={flag === 'keep' ? 'primary' : 'quiet'} aria-pressed={flag === 'keep'} onClick={() => !result && setFlags((f) => ({ ...f, [c.id]: 'keep' }))}>Keep</Btn>
                <Btn small variant={flag === 'cut' ? 'primary' : 'quiet'} aria-pressed={flag === 'cut'} onClick={() => !result && setFlags((f) => ({ ...f, [c.id]: 'cut' }))}>Cut</Btn>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="row">
        <Btn variant="primary" icon="check" onClick={submit} disabled={!answered || !!result}>Submit the weld report</Btn>
        {result && !result.pass ? <Btn variant="secondary" icon="reset" onClick={again}>Try the case again</Btn> : null}
        <span className="st__meter" aria-live="polite">{C.claims.filter((c) => flags[c.id]).length} of {C.claims.length} claims marked</span>
      </div>
      {result ? (
        <Callout icon={result.pass ? 'check' : 'warning'} tone={result.pass ? 'good' : 'bad'}>
          {result.pass
            ? `${result.right} of ${result.total} right, and every high-stakes claim handled. The false claims are marked above, with what gave each away.`
            : result.missedHigh.length
              ? `A claim that would have hurt someone got through (${result.missedHigh.map((id) => C.claims.findIndex((c) => c.id === id) + 1).join(', ')}). Everything is open now. Read why, then try the case again.`
              : `${result.right} of ${result.total} right. You may miss at most one. Read the evidence above, then try again.`}
        </Callout>
      ) : null}
      <p className="st__foot"><Icon name="info" /> Claims are judged against the packet written for this game, because the skill is checking against a source you can name. Real checking means finding the real source.</p>
    </div>
  );
}
