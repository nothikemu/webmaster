import {
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type LazyExoticComponent,
  type ReactNode,
} from 'react';
import {
  getModule,
  lessonHref,
  moduleHref,
  quizHref,
  challengeHref,
  type ModuleContent,
  type ModuleId,
} from '../content';
import { t } from '../core/assets';
import { BADGE_QUIZ_MIN } from '../core/gamification';
import { Link } from '../router';
import { Badge } from '../ui/Badges';
import { Mark, lessonNodeState, type MarkState } from '../ui/CurriculumMap';
import { KeyArt } from '../ui/KeyArt';
import { Track } from '../ui/ModuleArt';
import { PathList } from '../ui/PathList';
import { useData } from '../ui/hooks';
import { Challenge } from './shared/Challenge';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { LessonReader } from './shared/LessonReader';
import { Quiz } from './shared/Quiz';
import { useBadgeProgress } from './shared/badgeRows';

export type ModuleView =
  { kind: 'overview' } | { kind: 'lesson'; n: number } | { kind: 'quiz' } | { kind: 'challenge' };

type Stage = LazyExoticComponent<ComponentType<{ module: ModuleContent }>>;

const STAGES: Record<ModuleId, Stage> = {
  foundations: lazy(() => import('./ModuleA/ModuleA')),
  synthesis: lazy(() => import('./ModuleB/ModuleB')),
  ethics: lazy(() => import('./ModuleC/ModuleC')),
};

/** Modules, then this module, then the page: real links, so "up" is always one click. */
function Crumbs({ module, view }: { module: ModuleContent; view: ModuleView }): ReactNode {
  const here =
    view.kind === 'lesson'
      ? t('lesson.crumb', { n: view.n })
      : view.kind === 'quiz'
        ? t('quiz.title')
        : view.kind === 'challenge'
          ? t('module.challenge')
          : null;
  return (
    <nav aria-label={t('module.crumbs')} className="crumbs">
      <ol>
        <li>
          <Link to="/modules">{t('hub.title')}</Link>
        </li>
        <li>
          {here ? (
            <Link to={moduleHref(module.id)}>{module.title}</Link>
          ) : (
            <span aria-current="page">{module.title}</span>
          )}
        </li>
        {here && (
          <li>
            <span aria-current="page">{here}</span>
          </li>
        )}
      </ol>
    </nav>
  );
}

/** Where you are in the module, and every other step, each with its state as a shape. */
function Stepper({ module, view }: { module: ModuleContent; view: ModuleView }): ReactNode {
  const d = useData().modules[module.id];
  const checkState: MarkState =
    d.quiz.best >= BADGE_QUIZ_MIN ? 'done' : d.quiz.attempts > 0 ? 'started' : 'none';
  const chState: MarkState = d.challenge.done
    ? 'done'
    : d.challenge.attempts > 0
      ? 'started'
      : 'none';
  const cur = (on: boolean): 'page' | undefined => (on ? 'page' : undefined);
  return (
    <nav aria-label={t('module.sections')} className="stepper">
      <ul>
        <li>
          <Link to={moduleHref(module.id)} aria-current={cur(view.kind === 'overview')}>
            {t('module.overview')}
          </Link>
        </li>
        {module.lessons.map((l, i) => {
          const state = d.lessons[l.id] ?? 'unseen';
          return (
            <li key={l.id}>
              <Link
                to={lessonHref(module.id, i + 1)}
                aria-current={cur(view.kind === 'lesson' && view.n === i + 1)}
                aria-label={t('module.lessonTab', {
                  n: i + 1,
                  title: l.title,
                  state: t(`mastery.${state}`),
                })}
              >
                <Mark kind="lesson" state={lessonNodeState(state)} size={20} />
                <span className="num">{i + 1}</span>
              </Link>
            </li>
          );
        })}
        <li>
          <Link to={quizHref(module.id)} aria-current={cur(view.kind === 'quiz')}>
            <Mark kind="check" state={checkState} size={20} />
            {t('module.check')}
          </Link>
        </li>
        <li>
          <Link to={challengeHref(module.id)} aria-current={cur(view.kind === 'challenge')}>
            <Mark kind="challenge" state={chState} size={20} />
            {t('module.challenge')}
          </Link>
        </li>
        <li className="stepper-jump">
          <a href="#interactive" className="link-arrow">
            {t('module.jump')}
          </a>
        </li>
      </ul>
    </nav>
  );
}

/** A requirement is met (a filled square with a tick) or open (an empty square). Shape, not color, says which. */
function RequirementMark({ done }: { done: boolean }): ReactNode {
  return (
    <svg className="req-mark" viewBox="0 0 22 22" aria-hidden="true" focusable="false">
      {done ? (
        <>
          <rect
            x="1.5"
            y="1.5"
            width="19"
            height="19"
            fill="currentColor"
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d="M5.6 11.6l3.8 3.8 7-8"
            fill="none"
            stroke="var(--req-tick, #ece8e1)"
            strokeWidth="3"
            strokeLinecap="square"
          />
        </>
      ) : (
        <rect
          x="2"
          y="2"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
      )}
    </svg>
  );
}

export function BadgeChecklist({
  module,
  showState = false,
}: {
  module: ModuleContent;
  showState?: boolean;
}): ReactNode {
  const { rows } = useBadgeProgress(module);
  return (
    <ul className="requirements">
      {rows.map((r) => (
        <li key={r.label} data-done={r.done}>
          <RequirementMark done={r.done} />
          <span>{r.label}</span>
          {showState ? (
            <span className="req-state">{r.done ? t('check.done') : t('check.remaining')}</span>
          ) : (
            <span className="sr-only">{r.done ? t('check.done') : t('check.todo')}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/**
 * What the frame shows while the scene's code downloads. If that takes longer than 15 seconds the
 * visitor gets the scene's written description and a way to retry, not an endless loading state.
 */
function StageLoading({ module }: { module: ModuleContent }): ReactNode {
  const [late, setLate] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setLate(true), 15000);
    return () => window.clearTimeout(id);
  }, []);
  if (!late) {
    return (
      <div className="stage" aria-busy="true">
        <div className="stage-status">
          <span className="stage-hairline" />
          <span className="mono">{t('stage.loading')}</span>
        </div>
      </div>
    );
  }
  return (
    <div className="stage stage-failed" role="alert" data-status="failed">
      <span className="label">{t('stage.unavailable')}</span>
      <span>{t('stage.timeout')}</span>
      <p className="prose">{module.centerpiece.description}</p>
      <button type="button" className="btn btn-ghost" onClick={() => window.location.reload()}>
        {t('stage.retry')}
      </button>
    </div>
  );
}

/** The interactive centerpiece in a labelled frame. A simulation says so in the frame itself. */
function Instrument({ module }: { module: ModuleContent }): ReactNode {
  const Scene = STAGES[module.id];
  const simulated = module.id === 'synthesis';
  return (
    <section
      className="instrument glass edge"
      data-surface="ink"
      id="interactive"
      tabIndex={-1}
      aria-labelledby="interactive-h"
    >
      <header className="instrument-bar">
        <h2 id="interactive-h" className="instrument-name">
          {module.centerpiece.name}
        </h2>
        <span className="instrument-kind" data-kind={simulated ? 'simulation' : 'interactive'}>
          {simulated ? t('module.simulation') : t('module.interactive')}
        </span>
      </header>
      <ErrorBoundary
        resetKey={module.id}
        fallback={(reset) => (
          <div className="stage stage-failed" role="alert">
            <span className="label">{t('stage.crashed')}</span>
            <span>{t('stage.crashed.body')}</span>
            <button type="button" className="btn btn-ghost" onClick={reset}>
              {t('stage.retry')}
            </button>
          </div>
        )}
      >
        <Suspense fallback={<StageLoading module={module} />}>
          <Scene module={module} />
        </Suspense>
      </ErrorBoundary>
    </section>
  );
}

function Overview({ module }: { module: ModuleContent }): ReactNode {
  const data = useData().modules[module.id];
  const { done, total } = useBadgeProgress(module);
  const minutes = module.lessons.reduce((a, l) => a + l.minutes, 0);
  const parts = {
    objective: (
      <section key="obj" className="mp-objective" aria-labelledby="obj-h">
        <h2 id="obj-h" className="label">
          {t('module.objective')}
        </h2>
        <p>{module.objective}</p>
        <dl className="mod-facts">
          <div>
            <dt>{t('module.lessons')}</dt>
            <dd className="num">{module.lessons.length}</dd>
          </div>
          <div>
            <dt>{t('home.reading')}</dt>
            <dd className="num">{t('lesson.minutes', { n: minutes })}</dd>
          </div>
          <div>
            <dt>{t('home.centerpiece')}</dt>
            <dd>{module.centerpiece.name}</dd>
          </div>
        </dl>
      </section>
    ),
    sequence: (
      <section key="seq" className="mp-sequence" aria-labelledby="seq-h">
        <div className="mp-sequence-head">
          <h2 id="seq-h" className="label">
            {t('module.sequence')}
          </h2>
          <Track id={module.id} />
        </div>
        <PathList module={module} />
      </section>
    ),
    badge: (
      <section key="badge" className="mp-badge glass edge" aria-labelledby="badge-h">
        <div className="mp-badge-head">
          <div>
            <h2 id="badge-h" className="label">
              {t('module.requirements')}
            </h2>
            <p className="mp-badge-name">{module.badge.name}</p>
            <p className="mono">
              {data.badge ? t('ach.earned') : t('module.requirementsMet', { done, total })}
            </p>
          </div>
          <Badge module={module.id} unlocked={data.badge} size={112} />
        </div>
        <span className="bar" role="img" aria-label={t('module.requirementsMet', { done, total })}>
          <span style={{ transform: `scaleX(${Math.max(0.01, done / total)})` }} />
        </span>
        <BadgeChecklist module={module} />
      </section>
    ),
    stage: <Instrument key="stage" module={module} />,
  };
  // The same four parts in a different composition for each module. Reading order follows the page.
  const order =
    module.id === 'foundations'
      ? [parts.objective, parts.sequence, parts.badge, parts.stage]
      : module.id === 'synthesis'
        ? [parts.objective, parts.stage, parts.sequence, parts.badge]
        : [parts.stage, parts.objective, parts.sequence, parts.badge];
  return (
    <div className="mp-overview" data-module={module.id}>
      {order}
    </div>
  );
}

export function ModulePage({ id, view }: { id: ModuleId; view: ModuleView }): ReactNode {
  const module = getModule(id);
  const lesson = view.kind === 'lesson' ? module.lessons[view.n - 1] : undefined;
  const heading =
    view.kind === 'quiz'
      ? t('quiz.pageTitle', { title: module.title })
      : view.kind === 'challenge'
        ? module.challenge.title
        : view.kind === 'lesson' && lesson
          ? lesson.title
          : module.title;

  return (
    <div className="module-page" data-module={id} data-view={view.kind}>
      <header className="mp-head" data-surface="ink">
        <div className="mp-head-art">
          <KeyArt id={id} w={1600} h={700} shift={0.22} scale={0.92} />
        </div>
        <div className="mp-head-shade" aria-hidden="true" />
        <div className="wrap mp-head-inner">
          <Crumbs module={module} view={view} />
          <div className="mp-title">
            {view.kind === 'overview' && <p className="label">{module.themeSection}</p>}
            <h1 className="display">{heading}</h1>
            {view.kind === 'overview' && <p className="mod-tagline">{module.tagline}</p>}
          </div>
          <Stepper module={module} view={view} />
        </div>
      </header>
      <div className="wrap mp-main">
        {view.kind === 'overview' ? (
          <Overview module={module} />
        ) : (
          <div className="mp-grid">
            <div
              className={`mp-panel${view.kind === 'lesson' ? ' glass' : ''}`}
              data-surface={view.kind === 'lesson' ? 'paper' : undefined}
            >
              {view.kind === 'lesson' && <LessonReader key={view.n} module={module} n={view.n} />}
              {view.kind === 'quiz' && <Quiz module={module} />}
              {view.kind === 'challenge' && <Challenge module={module} />}
            </div>
            <Instrument module={module} />
          </div>
        )}
      </div>
    </div>
  );
}
