import { useCallback, useState } from 'react';
import { Link } from '@/router';
import { Icon } from '@/art/Icons';
import { LESSON_ALT, LessonArt } from '@/art/LessonArt';
import { Diagram } from '@/art/Diagram';
import { Kernel } from '@/art/Kernel';
import { MentorBust } from '@/art/Cast';
import { hookFor, mentorFor } from '@/content/cast';
import { CHECK_PASS, XP, lessonSteps } from '@/engine/progress';
import { dispatch, useProgress } from '@/engine/store';
import { lessonById, lessonNumber, neighbours, pathById } from '@/content/paths';
import { glossaryById } from '@/content/glossary';
import { Btn, Callout, Chip, LinkBtn, Panel } from '@/ui/primitives';
import { Widget } from '@/widgets/Widget';
import { Quiz } from '@/widgets/Quiz';
import NotFound from './NotFound';

export default function LessonPage({ pathId, lessonId }: { pathId: string; lessonId: string }) {
  const lesson = lessonById(lessonId);
  const path = pathById(pathId);
  if (!lesson || !path || lesson.path !== path.id) return <NotFound />;
  return <LessonView key={lesson.id} lessonId={lesson.id} />;
}

function LessonView({ lessonId }: { lessonId: string }) {
  const lesson = lessonById(lessonId)!;
  const path = pathById(lesson.path)!;
  const n = lessonNumber(lesson);
  const steps = useProgress((s) => lessonSteps(s, lesson.id));
  const saved = useProgress((s) => s.lessons[lesson.id]);
  const { prev, next } = neighbours(lesson.id);
  const [quizKey, setQuizKey] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  const onScore = useCallback((score: number) => dispatch({ type: 'tried', lesson: lesson.id, score }), [lesson.id]);
  const best = saved?.tryScore ?? 0;
  const mentor = mentorFor(path.id);
  const hook = hookFor(path.id, lesson.id);

  return (
    <div className="lesson" data-path={path.id}>
      <header className="lesson-hero" data-surface="ink">
        <LessonArt lessonId={lesson.id} path={path.id} index={n - 1} className="lesson-hero__art" label={LESSON_ALT[lesson.id] ?? lesson.title} />
        <div className="wrap lesson-hero__copy">
          <nav aria-label="Breadcrumb" className="crumbs">
            <Link to="/learn">Learn</Link> <span aria-hidden="true">/</span> <Link to={`/learn/${path.id}`}>{path.title}</Link>
          </nav>
          <p className="label">Lesson {n} of {path.lessons.length}, about {lesson.minutes} minutes</p>
          <h1>{lesson.title}</h1>
          <p className="lesson-hero__kicker">{lesson.kicker}</p>
        </div>
      </header>

      <div className="wrap lesson-body">
        <aside className="rail" aria-label="Lesson steps">
          <Panel className="rail__panel">
            <p className="label">Objective</p>
            <p className="rail__objective">{lesson.objective}</p>
            <ol className="stepper">
              {[
                { id: 'learn', label: 'Learn', done: steps.learn },
                { id: 'try', label: 'Try', done: steps.try },
                { id: 'check', label: 'Check', done: steps.check },
                { id: 'seal', label: 'Seal', done: steps.done },
              ].map((s) => (
                <li key={s.id} className={s.done ? 'is-done' : ''}>
                  <a href={`#${s.id}`} onClick={(e) => { e.preventDefault(); document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); document.getElementById(s.id)?.focus({ preventScroll: true }); }}>
                    <span className="stepper__dot" aria-hidden="true">{s.done ? <Icon name="check" /> : null}</span>
                    <span>{s.label}</span>
                    <span className="visually-hidden">{s.done ? ' (done)' : ' (not done yet)'}</span>
                  </a>
                </li>
              ))}
            </ol>
            <p className="small rail__fw">{lesson.framework}</p>
          </Panel>
        </aside>

        <div className="lesson-main">
          <section id="learn" tabIndex={-1} aria-labelledby="learn-h" className="lesson-sec">
            <h2 id="learn-h" className="sec-title"><span className="sec-title__tag">Learn</span></h2>
            {hook ? (
              <figure className="hook">
                <MentorBust who={path.id} className="hook__bust" />
                <blockquote className="hook__words">
                  <p>{hook}</p>
                </blockquote>
                <figcaption className="hook__who">
                  <strong>{mentor.name}</strong>, {mentor.trade}, at {path.place}
                </figcaption>
              </figure>
            ) : null}
            {lesson.beats.map((b, i) => (
              <article key={b.heading} className={`beat${i % 2 ? ' beat--alt' : ''}`}>
                <h3>{b.heading}</h3>
                <div className="beat__text prose">
                  {b.paragraphs.map((p, j) => (
                    <p key={j}>{p}</p>
                  ))}
                </div>
                {b.visual ? <Diagram visual={b.visual} /> : null}
              </article>
            ))}
            <Panel tone="shade" className="example">
              <p className="label">Real-world example</p>
              <h3>{lesson.example.title}</h3>
              <p>{lesson.example.body}</p>
              <p className="example__take"><strong>Takeaway:</strong> {lesson.example.takeaway}</p>
            </Panel>
            <div className="row">
              {steps.learn ? (
                <Chip tone="hue" icon="check">Learn step done</Chip>
              ) : (
                <Btn variant="primary" go onClick={() => dispatch({ type: 'learned', lesson: lesson.id })}>
                  I have read this lesson (+{XP.learn} XP)
                </Btn>
              )}
            </div>
          </section>

          <section id="try" tabIndex={-1} aria-labelledby="try-h" className="lesson-sec">
            <h2 id="try-h" className="sec-title"><span className="sec-title__tag">Try</span> {lesson.widget.title}</h2>
            <p className="lesson-sec__intro">{lesson.widget.intro}</p>
            <Panel className="bench" lift>
              <Widget spec={lesson.widget} best={best} onScore={onScore} />
            </Panel>
            <p className="score-line" role="status">
              {best >= lesson.widget.pass ? (
                <><Icon name="check" /> Experiment solved. Your best score is <strong>{best}</strong>.</>
              ) : (
                <>Reach <strong>{lesson.widget.pass}</strong> to solve this experiment. Your best so far: <strong>{best}</strong>. You earn up to {XP.tryMax} XP in proportion to your score.</>
              )}
            </p>
          </section>

          <section id="check" tabIndex={-1} aria-labelledby="check-h" className="lesson-sec">
            <h2 id="check-h" className="sec-title"><span className="sec-title__tag">Check</span> Knowledge check</h2>
            {result === null ? (
              <Panel className="bench">
                <Quiz
                  key={quizKey}
                  questions={lesson.check}
                  label="Knowledge check"
                  onDone={(c) => {
                    setResult(c);
                    dispatch({ type: 'checked', lesson: lesson.id, correct: c });
                  }}
                />
              </Panel>
            ) : (
              <Panel className="bench" role="status">
                <p className="score-line">
                  You answered <strong>{result} of {lesson.check.length}</strong> correctly. Your best is <strong>{saved?.checkBest ?? result}</strong>.
                </p>
                <p>
                  {result >= CHECK_PASS ? 'That passes the check.' : `You need ${CHECK_PASS} of ${lesson.check.length} to pass. Re-read the part that tripped you up, then try again.`}
                </p>
                <Btn variant="quiet" icon="reset" onClick={() => { setResult(null); setQuizKey((k) => k + 1); }}>Try the check again</Btn>
              </Panel>
            )}
          </section>

          <section id="seal" tabIndex={-1} aria-labelledby="seal-h" className="lesson-sec">
            <h2 id="seal-h" className="sec-title"><span className="sec-title__tag">Seal</span> {steps.done ? 'Lesson complete' : 'What is left'}</h2>
            {steps.done ? (
              <Panel tone="ink" className="seal-panel">
                <Kernel mood="cheer" className="seal-panel__kernel" />
                <div>
                  <p className="label">You finished it</p>
                  <h3>{lesson.title}</h3>
                  <ul className="takeaways">
                    {lesson.takeaways.map((t) => (
                      <li key={t}>{t}</li>
                    ))}
                  </ul>
                  {lesson.codex.length ? (
                    <p className="small">
                      Added to your codex:{' '}
                      {lesson.codex.map((id, i) => (
                        <span key={id}>{i ? ', ' : ''}<Link to="/codex">{glossaryById(id)?.term}</Link></span>
                      ))}
                    </p>
                  ) : null}
                  <div className="row">
                    {next ? <LinkBtn to={`/learn/${next.path}/${next.id}`} variant="primary" go>Next: {next.title}</LinkBtn> : <LinkBtn to="/certification" variant="primary" go>Take the final certification</LinkBtn>}
                    <LinkBtn to="/logbook" variant="quiet">See your logbook</LinkBtn>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel>
                <p>A lesson is finished when you have done all three:</p>
                <ul className="todo">
                  <li className={steps.learn ? 'is-done' : ''}><Icon name={steps.learn ? 'check' : 'target'} /> Read the lesson and press the button.</li>
                  <li className={steps.try ? 'is-done' : ''}><Icon name={steps.try ? 'check' : 'target'} /> Solve the experiment (score {lesson.widget.pass} or more).</li>
                  <li className={steps.check ? 'is-done' : ''}><Icon name={steps.check ? 'check' : 'target'} /> Pass the knowledge check ({CHECK_PASS} of {lesson.check.length}).</li>
                </ul>
                <Callout icon="info"><p>XP is paid once for each step, and again only if you improve a score. Repeating a step you already did earns nothing, so there is no way to grind.</p></Callout>
              </Panel>
            )}
          </section>

          <nav className="lesson-nav" aria-label="Lesson navigation">
            {prev ? <LinkBtn to={`/learn/${prev.path}/${prev.id}`} icon="arrow-left" variant="quiet">Previous: {prev.title}</LinkBtn> : <span />}
            {next ? <LinkBtn to={`/learn/${next.path}/${next.id}`} go variant="quiet">Next: {next.title}</LinkBtn> : null}
          </nav>
        </div>
      </div>
    </div>
  );
}
