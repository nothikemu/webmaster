import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Lesson, ModuleContent } from '../../content';
import { lessonHref, quizHref } from '../../content';
import { t } from '../../core/assets';
import { BADGE_QUIZ_MIN, REVIEW_AFTER_MS } from '../../core/gamification';
import { masteryRank, type Mastery } from '../../core/schema';
import { Link } from '../../router';
import { useData, useGame } from '../../ui/hooks';

const DWELL_MS = 4000;

export function MasteryPill({ state }: { state: Mastery }): ReactNode {
  return (
    <span className="pill mono" data-state={state}>
      {t(`mastery.${state}`)}
    </span>
  );
}

function MicroCheck({ module, lesson }: { module: ModuleContent; lesson: Lesson }): ReactNode {
  const game = useGame();
  const [selected, setSelected] = useState<number | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const check = lesson.check;

  const submit = (): void => {
    if (selected === null) return;
    const correct = selected === check.answer;
    game({
      type: 'LESSON_CHECKED',
      module: module.id,
      lesson: lesson.id,
      correct,
      firstTry: attempts === 0,
    });
    setAttempts((a) => a + 1);
    setResult(correct ? 'right' : 'wrong');
  };

  return (
    <fieldset className="check">
      <legend className="label">{t('lesson.check')}</legend>
      <p className="check-prompt">{check.prompt}</p>
      <div className="options" role="radiogroup" aria-label={check.prompt}>
        {check.options.map((option, i) => (
          <label
            key={option}
            className="option"
            data-chosen={selected === i}
            data-right={result === 'right' && i === check.answer}
          >
            <input
              type="radio"
              name={`check-${lesson.id}`}
              checked={selected === i}
              disabled={result === 'right'}
              onChange={() => {
                setSelected(i);
                setResult('idle');
              }}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <div className="check-actions">
        <button
          type="button"
          className="btn"
          onClick={submit}
          disabled={selected === null || result === 'right'}
        >
          {t('lesson.checkAnswer')}
        </button>
        <p role="status" aria-live="polite" className="feedback" data-result={result}>
          {result === 'right' && (
            <>
              <strong>{t('lesson.correct')}</strong> {check.explain}
            </>
          )}
          {result === 'wrong' && <strong>{t('lesson.wrong')}</strong>}
        </p>
      </div>
    </fieldset>
  );
}

/** One lesson: text, key points and a one-question check. Opening it for a few seconds marks it seen. */
export function LessonReader({ module, n }: { module: ModuleContent; n: number }): ReactNode {
  const lesson = module.lessons[n - 1];
  const game = useGame();
  const data = useData();
  const state: Mastery = lesson
    ? (data.modules[module.id].lessons[lesson.id] ?? 'unseen')
    : 'unseen';
  const stateRef = useRef(state);
  stateRef.current = state;
  const reviewedAt = lesson ? data.modules[module.id].reviewedAt[lesson.id] : undefined;
  const createdAt = data.createdAt;

  useEffect(() => {
    if (!lesson) return undefined;
    const timer = setTimeout(
      () => game({ type: 'LESSON_OPENED', module: module.id, lesson: lesson.id }),
      DWELL_MS,
    );
    return () => clearTimeout(timer);
  }, [lesson, module.id, game]);

  useEffect(() => {
    if (!lesson || masteryRank(stateRef.current) < 2) return;
    if (Date.now() - (reviewedAt ?? createdAt) > REVIEW_AFTER_MS)
      game({ type: 'LESSON_REVIEWED', module: module.id, lesson: lesson.id });
    // Run once per lesson visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  if (!lesson) return <p>{t('lesson.missing')}</p>;
  const total = module.lessons.length;
  const next = module.lessons[n];
  const reached = masteryRank(state);
  const steps: Array<[Mastery, string]> = [
    ['seen', t('mastery.seen')],
    ['practiced', t('mastery.practiced')],
    ['mastered', t('mastery.mastered')],
  ];
  return (
    <article className="lesson" aria-labelledby="lesson-title">
      <div className="lesson-meta">
        <p className="label">
          <b>{t('lesson.of', { n, total })}</b>
        </p>
        <p className="label">{t('lesson.minutes', { n: lesson.minutes })}</p>
        <ol className="meter" aria-label={t('lesson.progress')}>
          {steps.map(([key, word], i) => (
            <li key={key} data-reached={reached >= i + 1}>
              <i aria-hidden="true" />
              {word}
            </li>
          ))}
        </ol>
      </div>
      <h2 id="lesson-title" className="lesson-title sr-only">
        {lesson.title}
      </h2>
      <div className="lesson-body">
        {lesson.body.map((p) => (
          <p key={p.slice(0, 32)}>{p}</p>
        ))}
      </div>
      <aside className="keypoints-box" aria-labelledby="kp-h">
        <h3 id="kp-h" className="label">
          {t('lesson.keyPoints')}
        </h3>
        <ol className="keypoints">
          {lesson.keyPoints.map((k) => (
            <li key={k}>{k}</li>
          ))}
        </ol>
      </aside>
      <MicroCheck key={lesson.id} module={module} lesson={lesson} />
      <nav className="next-step" data-surface="ink" aria-label={t('lesson.nav')}>
        <div className="next-copy">
          <p className="label">{next ? t('lesson.next') : t('lesson.toQuiz')}</p>
          <p className="next-title">{next ? next.title : t('quiz.title')}</p>
          <p className="next-meta">
            {next
              ? t('lesson.upNextMeta', { minutes: next.minutes })
              : t('lesson.upNextQuiz', { min: BADGE_QUIZ_MIN, total: module.quiz.length })}
          </p>
        </div>
        <div className="next-actions">
          {n > 1 && (
            <Link to={lessonHref(module.id, n - 1)} className="btn btn-ghost">
              {t('lesson.prev')}
            </Link>
          )}
          {next ? (
            <Link to={lessonHref(module.id, n + 1)} className="btn btn-primary">
              {t('lesson.next')}
            </Link>
          ) : (
            <Link to={quizHref(module.id)} className="btn btn-primary">
              {t('lesson.toQuiz')}
            </Link>
          )}
        </div>
      </nav>
    </article>
  );
}
