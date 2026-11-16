import { useState } from 'react';
import { Icon } from '@/art/Icons';
import { lessonById } from '@/content/paths';
import { mythForDay } from '@/content/myths';
import { play } from '@/audio/sfx';
import { Btn, LinkBtn, Panel } from '@/ui/primitives';

/** One statement a day. The learner calls it, sees why, and is pointed at the lesson that explains it. */
export function MythCard() {
  const [offset, setOffset] = useState(0);
  const [pick, setPick] = useState<boolean | null>(null);
  const myth = mythForDay(Date.now(), offset);
  const lesson = lessonById(myth.lesson);
  const right = pick !== null && pick === myth.fact;
  const answer = (v: boolean) => {
    setPick(v);
    play(v === myth.fact ? 'right' : 'wrong');
  };
  return (
    <Panel lift className="myth">
      <p className="label">Today&apos;s statement</p>
      <p className="myth__statement">“{myth.statement}”</p>
      {pick === null ? (
        <div className="row" role="group" aria-label="Is the statement a myth or a fact?">
          <Btn variant="primary" onClick={() => answer(false)}>It is a myth</Btn>
          <Btn variant="secondary" onClick={() => answer(true)}>It is a fact</Btn>
        </div>
      ) : (
        <div role="status" className="myth__answer">
          <p className={`myth__verdict${right ? ' is-right' : ''}`}>
            <Icon name={right ? 'check' : 'x'} /> {right ? 'Right.' : 'Not quite.'} That one is {myth.fact ? 'a fact' : 'a myth'}.
          </p>
          <p>{myth.why}</p>
          <div className="row">
            {lesson ? <LinkBtn to={`/learn/${lesson.path}/${lesson.id}`} variant="primary" go>Lesson: {lesson.title}</LinkBtn> : null}
            <Btn variant="quiet" icon="reset" onClick={() => { setOffset((o) => o + 1); setPick(null); }}>Try another</Btn>
          </div>
        </div>
      )}
    </Panel>
  );
}
