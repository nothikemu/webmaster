import { useId, useState } from 'react';
import { CASES } from '@/content/cases';
import type { CaseChoice, CaseStudy } from '@/content/types';
import { lessonById, lessonPath } from '@/content/modules';
import { Link } from '@/router';
import { Btn, Callout, GoLink } from '@/ui/primitives';

const FIT: Record<CaseChoice['fit'], { label: string; icon: 'check' | 'info' | 'warning'; tone?: 'good' | 'bad' }> = {
  strong: { label: 'Holds up', icon: 'check', tone: 'good' },
  mixed: { label: 'Holds up in part', icon: 'info' },
  weak: { label: 'Does not hold up', icon: 'warning', tone: 'bad' },
};

function Walkthrough({ c, onBack }: { c: CaseStudy; onBack: () => void }) {
  const uid = useId();
  const [step, setStep] = useState(0);
  const [pick, setPick] = useState<number | null>(null);
  const [shown, setShown] = useState(false);
  const [done, setDone] = useState(false);
  const s = c.steps[step]!;
  const last = step === c.steps.length - 1;
  const lesson = lessonById(c.lesson);

  const next = () => {
    if (last) {
      setDone(true);
      return;
    }
    setStep(step + 1);
    setPick(null);
    setShown(false);
  };
  const restart = () => {
    setStep(0);
    setPick(null);
    setShown(false);
    setDone(false);
  };

  return (
    <div className="case">
      <p className="label">Case</p>
      <h2>{c.title}</h2>
      <p className="case__setting">{c.setting}</p>
      {done ? (
        <div className="stack" role="status">
          <Callout icon="info">
            <p>
              That is the end of this case. There is no score: the point is the reasoning behind each choice.
              {lesson ? (
                <>
                  {' '}
                  The idea behind it is taught in <Link to={lessonPath(lesson)}>{lesson.title}</Link>.
                </>
              ) : null}
            </p>
          </Callout>
          <div className="row">
            <Btn icon="reset" onClick={restart}>
              Go through it again, choosing differently
            </Btn>
            <Btn variant="quiet" onClick={onBack}>
              Choose another case
            </Btn>
          </div>
        </div>
      ) : (
        <>
          <fieldset>
            <legend>
              <span className="label">
                Decision {step + 1} of {c.steps.length}
              </span>
              <br />
              {s.prompt}
            </legend>
            {s.choices.map((ch, n) => (
              <label key={n} className={`option${shown && pick === n ? ' option--right' : ''}`}>
                <input type="radio" name={`${uid}-${step}`} checked={pick === n} disabled={shown} onChange={() => setPick(n)} />
                <span>{ch.text}</span>
              </label>
            ))}
          </fieldset>
          {shown && pick !== null ? (
            <div role="status" className="stack">
              <Callout icon={FIT[s.choices[pick]!.fit].icon} tone={FIT[s.choices[pick]!.fit].tone}>
                <p>
                  <strong>{FIT[s.choices[pick]!.fit].label}.</strong> {s.choices[pick]!.response}
                </p>
              </Callout>
              <details className="disclosure">
                <summary>What the other choices would lead to</summary>
                <div className="disclosure__body">
                  <ul className="branches">
                    {s.choices.map((ch, n) =>
                      n === pick ? null : (
                        <li key={n}>
                          <p>
                            <strong>{ch.text}</strong>
                          </p>
                          <p>
                            <span className="tag">{FIT[ch.fit].label}</span> {ch.response}
                          </p>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              </details>
            </div>
          ) : null}
          <div className="row">
            {!shown ? (
              <Btn variant="primary" disabled={pick === null} aria-disabled={pick === null} onClick={() => setShown(true)}>
                See what follows
              </Btn>
            ) : (
              <Btn variant="primary" go onClick={next}>
                {last ? 'Finish the case' : 'Next decision'}
              </Btn>
            )}
            <Btn variant="quiet" onClick={onBack}>
              Back to all cases
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}

export default function Cases() {
  const [open, setOpen] = useState<string | null>(null);
  const current = CASES.find((c) => c.id === open);
  return (
    <div className="wrap page cases hue-ethics">
      <header className="page-head">
        <nav aria-label="Breadcrumb" className="crumbs">
          <ol>
            <li>
              <Link to="/modules">Modules</Link>
            </li>
            <li>
              <Link to="/modules/ethics">Ethics</Link>
            </li>
            <li aria-current="page">Cases</li>
          </ol>
        </nav>
        <p className="kicker">Ethics · for thinking and talking</p>
        <h1>
          Six <em>cases</em> from school life
        </h1>
        <p className="page-head__lead">
          Pick a situation and make each decision. After every choice you will see what follows from it, and what the other choices would have led to. Nothing is counted, and there is rarely one perfect answer.
        </p>
      </header>
      {current ? (
        <Walkthrough key={current.id} c={current} onBack={() => setOpen(null)} />
      ) : (
        <ol className="case-list">
          {CASES.map((c, i) => (
            <li key={c.id}>
              <button type="button" className="case-card" onClick={() => setOpen(c.id)}>
                <span className="case-card__no num">{String(i + 1).padStart(2, '0')}</span>
                <span className="case-card__title">{c.title}</span>
                <span className="case-card__setting">{c.setting}</span>
                <span className="case-card__meta">{c.steps.length} decisions</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      <p className="small cases__back">
        <GoLink to="/modules/ethics">Back to the Ethics module</GoLink>
      </p>
    </div>
  );
}
