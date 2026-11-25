import { useEffect } from 'react';
import type { Lesson } from '@/content/types';
import { Link } from '@/router';
import { GLOSSARY } from '@/content/glossary';
import { coreLessons, furtherLessons, lessonLabel, lessonPath, moduleOf, neighbours } from '@/content/modules';
import { dispatch, useLearning } from '@/learning/store';
import { statusOf } from '@/learning/state';
import { Btn, Figure, GoLink, Status } from '@/ui/primitives';
import { Diagram } from '@/art/Diagram';
import { TuneRule } from '@/art/field/Marks';
import { Widget } from '@/widgets/Widget';
import { Check } from '@/widgets/Quiz';

/** One lesson: a reading column with margin notes, then a guided experiment (where there is one), an unscored check, and the next step. */
export default function LessonPage({ lesson }: { lesson: Lesson }) {
  const mod = moduleOf(lesson);
  const status = useLearning((s) => statusOf(s, lesson.id));
  const complete = status === 'complete';
  const { prev, next } = neighbours(lesson);
  const terms = lesson.glossary.map((id) => GLOSSARY.find((g) => g.id === id)).filter((g) => g !== undefined);
  const core = coreLessons(mod);
  const further = furtherLessons(mod);
  const label = lessonLabel(lesson);

  useEffect(() => {
    dispatch({ type: 'open', lesson: lesson.id });
  }, [lesson.id]);

  const sections = [
    { id: 'read', label: 'Read' },
    ...(lesson.example ? [{ id: 'example', label: 'Example' }] : []),
    ...(lesson.widget ? [{ id: 'experiment', label: 'Experiment' }] : []),
    { id: 'check', label: 'Check' },
  ];

  return (
    <article className={`lesson hue-${mod.id}`} aria-labelledby="lesson-title">
      <header className="lesson__head wrap">
        <nav aria-label="Breadcrumb" className="crumbs">
          <ol>
            <li>
              <Link to="/modules">Modules</Link>
            </li>
            <li>
              <Link to={`/modules/${mod.id}`}>{mod.title}</Link>
            </li>
            <li aria-current="page">{lesson.core ? `Lesson ${label}` : `Go further ${label}`}</li>
          </ol>
        </nav>
        <p className="kicker lesson__kicker">
          <span className="num">{String(mod.number).padStart(2, '0')}</span> {mod.title} · {lesson.core ? `Lesson ${label} of ${core.length}` : 'Go further'} · {lesson.minutes} min
        </p>
        <h1 id="lesson-title" className="lesson__title">
          {lesson.title}
        </h1>
        <p className="lesson__lead">{lesson.objective}</p>
        <TuneRule className="lesson__rule" at={lesson.core ? (Number(label) - 0.5) / core.length : 0.5} />
      </header>

      <div className="wrap lesson__grid">
        <aside className="lesson__rail" aria-label="In this module">
          <div className="rail-block">
            <p className="label">In {mod.title}</p>
            <ol className="rail-list">
              {core.map((l, i) => (
                <li key={l.id}>
                  <Link to={lessonPath(l)} aria-current={l.id === lesson.id ? 'page' : undefined}>
                    <span className="num">{i + 1}</span>
                    {l.title}
                  </Link>
                </li>
              ))}
            </ol>
            {further.length ? (
              <>
                <p className="label rail-block__sub">Go further</p>
                <ol className="rail-list rail-list--further">
                  {further.map((l, i) => (
                    <li key={l.id}>
                      <Link to={lessonPath(l)} aria-current={l.id === lesson.id ? 'page' : undefined}>
                        <span className="num">{String.fromCharCode(65 + i)}</span>
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ol>
              </>
            ) : null}
          </div>
          <nav className="rail-block rail-jump" aria-label="On this page">
            <p className="label">On this page</p>
            <ul>
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`}>{s.label}</a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        <div className="lesson__main">
          <section id="read" aria-label="Read" className="lesson__read">
            {lesson.beats.map((b, i) => (
              <section key={b.heading} className="beat" aria-labelledby={`beat-${i}`}>
                <h2 id={`beat-${i}`}>
                  <span className="beat__no num" aria-hidden="true">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {b.heading}
                </h2>
                {b.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {b.visual ? (
                  <Figure no={`${label}.${i + 1}`} caption={b.visual.caption} className="beat__figure">
                    <Diagram visual={b.visual} />
                  </Figure>
                ) : null}
              </section>
            ))}
          </section>

          {lesson.example ? (
            <section id="example" aria-labelledby="example-h" className="lesson__block worked">
              <p className="label">Worked example</p>
              <h2 id="example-h">{lesson.example.title}</h2>
              <p>{lesson.example.body}</p>
              <p className="worked__take">
                <strong>The point:</strong> {lesson.example.takeaway}
              </p>
            </section>
          ) : null}

          {lesson.widget ? (
            <section id="experiment" aria-labelledby="experiment-h" className="lesson__block experiment">
              <p className="label">Guided experiment</p>
              <h2 id="experiment-h">{lesson.widget.title}</h2>
              <p className="experiment__intro">{lesson.widget.intro}</p>
              <p className="note experiment__note">Nothing here is scored or saved. Try things, change your mind, and start over as often as you like.</p>
              <div className="experiment__bench">
                <Widget spec={lesson.widget} />
              </div>
            </section>
          ) : null}

          <section id="check" aria-labelledby="check-h" className="lesson__block check-block">
            <p className="label">Check</p>
            <h2 id="check-h">Check your understanding</h2>
            <p className="note">These questions are for you. They are untimed and unscored, every answer is explained, and you can try again.</p>
            <Check questions={lesson.check} />
          </section>

          <section aria-label="Lesson summary" className="lesson__block summary">
            <h2>The short version</h2>
            <ul className="summary__list">
              {lesson.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          <section aria-label="Finish this lesson" className="lesson__finish">
            <div className="finish__status">
              <Status status={status} />
              <Btn variant={complete ? 'secondary' : 'primary'} aria-pressed={complete} onClick={() => dispatch({ type: complete ? 'uncomplete' : 'complete', lesson: lesson.id })} icon={complete ? 'reset' : 'check'}>
                {complete ? 'Mark as not complete' : 'Mark this lesson complete'}
              </Btn>
              <p className="note">Saved on this device only. It is a bookmark for you, and it unlocks nothing.</p>
            </div>
            <nav className="finish__nav" aria-label="Next and previous lessons">
              {prev ? (
                <Link to={lessonPath(prev)} className="pager pager--prev">
                  <span className="label">Previous</span>
                  <span className="pager__title">{prev.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next ? (
                <Link to={lessonPath(next)} className="pager pager--next">
                  <span className="label">Next lesson</span>
                  <span className="pager__title">{next.title}</span>
                </Link>
              ) : (
                <Link to={`/modules/${mod.id}`} className="pager pager--next">
                  <span className="label">{lesson.core ? 'End of the core lessons' : 'Back to the module'}</span>
                  <span className="pager__title">{lesson.core ? `${mod.title}: the instrument and further lessons` : mod.title}</span>
                </Link>
              )}
            </nav>
          </section>
        </div>

        <aside className="lesson__margin" aria-label="Notes">
          <div className="margin-note">
            <p className="label">Key ideas</p>
            <ul>
              {lesson.takeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </div>
          {terms.length ? (
            <div className="margin-note margin-note--terms">
              <p className="label">Terms in this lesson</p>
              <dl>
                {terms.map((g) => (
                  <div key={g.id}>
                    <dt>{g.term}</dt>
                    <dd>{g.definition}</dd>
                  </div>
                ))}
              </dl>
              <GoLink to="/glossary">Open the glossary</GoLink>
            </div>
          ) : null}
          {lesson.framework ? (
            <div className="margin-note margin-note--src">
              <p className="label">Aligned with</p>
              <p className="small">{lesson.framework}</p>
            </div>
          ) : null}
        </aside>
      </div>
    </article>
  );
}
