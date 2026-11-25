import { Suspense, lazy } from 'react';
import { Link } from '@/router';
import { MODULES, coreLessons, furtherLessons, lessonPath, moduleById } from '@/content/modules';
import type { Lesson, ModuleId } from '@/content/types';
import { useLearning } from '@/learning/store';
import { moduleProgress, statusOf } from '@/learning/state';
import { GoLink, LinkBtn, Status } from '@/ui/primitives';
import { ModulePlate } from '@/art/field/ModulePlates';

const NeuralTopology = lazy(() => import('@/explainers/NeuralTopology'));
const PromptConsole = lazy(() => import('@/explainers/PromptConsole'));
const VulnerabilityMatrix = lazy(() => import('@/explainers/VulnerabilityMatrix'));

const FURTHER_INTRO: Record<ModuleId, string> = {
  foundations: 'The same ideas, with more to try by hand.',
  synthesis: 'Deeper lessons on language models and everyday tool use. Each one stands on its own.',
  ethics: 'Three more places where AI meets honesty, evidence and credit. Each one stands on its own.',
};

function LessonRow({ lesson, n }: { lesson: Lesson; n: string }) {
  const status = useLearning((s) => statusOf(s, lesson.id));
  return (
    <li className="lesson-row">
      <Link to={lessonPath(lesson)} className="lesson-row__link">
        <span className="lesson-row__no num" aria-hidden="true">
          {n}
        </span>
        <span className="lesson-row__body">
          <span className="lesson-row__title">{lesson.title}</span>
          <span className="lesson-row__obj">{lesson.objective}</span>
        </span>
        <span className="lesson-row__meta">
          <span className="num">{lesson.minutes} min</span>
          <Status status={status} />
        </span>
      </Link>
    </li>
  );
}

function Instrument({ id }: { id: ModuleId }) {
  return (
    <Suspense fallback={<p className="page-loading" role="status">Loading the instrument…</p>}>
      {id === 'foundations' ? <NeuralTopology /> : id === 'synthesis' ? <PromptConsole /> : <VulnerabilityMatrix />}
    </Suspense>
  );
}

/** One module: its question, its five core lessons, optional further lessons, and its instrument. */
export default function ModulePage({ moduleId }: { moduleId: ModuleId }) {
  const m = moduleById(moduleId)!;
  const learner = useLearning((s) => s);
  const p = moduleProgress(learner, m);
  const core = coreLessons(m);
  const further = furtherLessons(m);
  const idx = MODULES.indexOf(m);
  const after = MODULES[idx + 1];
  const resume = p.next ?? core[0]!;
  const started = p.coreDone > 0 || core.some((l) => learner.opened[l.id]);

  return (
    <div className={`module hue-${m.id}`}>
      <header className={`module-hero module-hero--${m.id}`} data-surface={m.id === 'ethics' ? 'night' : undefined}>
        <div className="wrap module-hero__in">
          <div className="module-hero__copy">
            <nav aria-label="Breadcrumb" className="crumbs">
              <ol>
                <li>
                  <Link to="/modules">Modules</Link>
                </li>
                <li aria-current="page">{m.title}</li>
              </ol>
            </nav>
            <p className="kicker">
              <span className="num">Module {String(m.number).padStart(2, '0')}</span> · {m.tsaSection}
            </p>
            <h1 className="module-hero__title">{m.title}</h1>
            <p className="module-hero__tag">{m.tagline}</p>
            <p className="module-hero__obj">
              <span className="label">By the end you can</span>
              {m.objective}
            </p>
            <div className="row">
              <LinkBtn to={lessonPath(resume)} variant="primary" go>
                {started ? `Continue: ${resume.title}` : `Begin with lesson 1`}
              </LinkBtn>
              <GoLink to="#instrument">Go to the instrument</GoLink>
            </div>
          </div>
          <div className="module-hero__art" aria-hidden="true">
            <ModulePlate module={m.id} large />
          </div>
        </div>
      </header>

      <div className="wrap module__body">
        <section aria-labelledby="core-h" className="module__lessons">
          <div className="section-head">
            <h2 id="core-h">Five core lessons</h2>
            <p className="note" role="status">
              {p.coreDone === 0 ? 'None marked complete yet on this device.' : `${p.coreDone} of ${p.coreTotal} marked complete on this device.`} You can read them in any order.
            </p>
          </div>
          <ol className="lesson-rows">
            {core.map((l, i) => (
              <LessonRow key={l.id} lesson={l} n={String(i + 1)} />
            ))}
          </ol>
        </section>

        <section id="instrument" aria-labelledby="inst-h" className="module__instrument">
          <div className="section-head">
            <p className="kicker">The instrument</p>
            <h2 id="inst-h">{m.centerpiece.name}</h2>
            <p className="reading">{m.centerpiece.summary}</p>
          </div>
          <Instrument id={m.id} />
        </section>

        {further.length ? (
          <section aria-labelledby="further-h" className="module__further">
            <div className="section-head">
              <h2 id="further-h">Go further</h2>
              <p className="note">
                {FURTHER_INTRO[m.id]} {p.furtherTotal} {p.furtherTotal === 1 ? 'lesson' : 'lessons'}, all optional.
              </p>
            </div>
            <ol className="lesson-rows lesson-rows--further">
              {further.map((l, i) => (
                <LessonRow key={l.id} lesson={l} n={String.fromCharCode(65 + i)} />
              ))}
            </ol>
          </section>
        ) : null}

        {m.id === 'ethics' ? (
          <section aria-labelledby="cases-h" className="module__aside">
            <h2 id="cases-h">Six cases to talk through</h2>
            <p className="reading">Situations from school life where AI use gets complicated. Each choice explains what follows from it, and nothing is scored.</p>
            <GoLink to="/modules/ethics/cases">Open the cases</GoLink>
          </section>
        ) : null}
        {m.id === 'synthesis' ? (
          <section aria-labelledby="atlas-h" className="module__aside">
            <h2 id="atlas-h">Real tools, checked and dated</h2>
            <p className="reading">The tool atlas lists AI tools students may meet, what each is for, and the age and account rules as read on the maker&apos;s own page.</p>
            <GoLink to="/tools">Open the tool atlas</GoLink>
          </section>
        ) : null}

        {after ? (
          <nav className="module__next" aria-label="Next module">
            <Link to={`/modules/${after.id}`} className="pager pager--next">
              <span className="label">Next module</span>
              <span className="pager__title">
                {String(after.number).padStart(2, '0')} · {after.title}: {after.tagline}
              </span>
            </Link>
          </nav>
        ) : (
          <nav className="module__next" aria-label="Where to go next">
            <Link to="/overview" className="pager pager--next">
              <span className="label">That is all three modules</span>
              <span className="pager__title">See your overview, or read the glossary</span>
            </Link>
          </nav>
        )}
      </div>
    </div>
  );
}
