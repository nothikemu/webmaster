import type { ReactNode } from 'react';
import { challengeHref, lessonHref, moduleHref, quizHref, type ModuleContent } from '../content';
import { t } from '../core/assets';
import { BADGE_QUIZ_MIN } from '../core/gamification';
import { Link } from '../router';
import { Mark, lessonNodeState, type MarkState } from './CurriculumMap';
import { useData } from './hooks';

/**
 * A module's whole sequence as one list: its lessons, then the knowledge check, the challenge and
 * the badge. Every row pairs a shape with a word, so state never depends on color.
 */
export function PathList({
  module,
  current,
}: {
  module: ModuleContent;
  current?: string;
}): ReactNode {
  const d = useData().modules[module.id];
  const checkState: MarkState =
    d.quiz.best >= BADGE_QUIZ_MIN ? 'done' : d.quiz.attempts > 0 ? 'started' : 'none';
  const checkWord =
    checkState === 'done'
      ? t('map.s.check.passed', { best: d.quiz.best, total: module.quiz.length })
      : checkState === 'started'
        ? t('map.s.check.tried', { best: d.quiz.best, total: module.quiz.length })
        : t('map.s.check.none');
  const chState: MarkState = d.challenge.done
    ? 'done'
    : d.challenge.attempts > 0
      ? 'started'
      : 'none';
  const chWord = d.challenge.done
    ? t('map.s.ch.done')
    : d.challenge.attempts > 0
      ? t('map.s.ch.tried')
      : t('map.s.ch.none');
  return (
    <ol className="path" data-module={module.id}>
      {module.lessons.map((l, i) => {
        const state = d.lessons[l.id] ?? 'unseen';
        const href = lessonHref(module.id, i + 1);
        return (
          <li key={l.id} data-state={state} data-current={current === href || undefined}>
            <Mark kind="lesson" state={lessonNodeState(state)} />
            <Link to={href} className="path-link">
              <span className="path-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="path-title">{l.title}</span>
            </Link>
            <span className="path-meta">
              {state === 'unseen' ? t('lesson.minutes', { n: l.minutes }) : t(`mastery.${state}`)}
            </span>
          </li>
        );
      })}
      <li className="path-step" data-current={current === quizHref(module.id) || undefined}>
        <Mark kind="check" state={checkState} />
        <Link to={quizHref(module.id)} className="path-link">
          <span className="path-n" aria-hidden="true" />
          <span className="path-title">{t('quiz.title')}</span>
        </Link>
        <span className="path-meta">{checkWord}</span>
      </li>
      <li className="path-step" data-current={current === challengeHref(module.id) || undefined}>
        <Mark kind="challenge" state={chState} />
        <Link to={challengeHref(module.id)} className="path-link">
          <span className="path-n" aria-hidden="true" />
          <span className="path-title">{module.challenge.title}</span>
        </Link>
        <span className="path-meta">{chWord}</span>
      </li>
      <li className="path-step" data-current={current === moduleHref(module.id) || undefined}>
        <Mark kind="badge" state={d.badge ? 'done' : 'none'} />
        <Link to={moduleHref(module.id)} className="path-link">
          <span className="path-n" aria-hidden="true" />
          <span className="path-title">{module.badge.name}</span>
        </Link>
        <span className="path-meta">{d.badge ? t('ach.earned') : t('badge.locked')}</span>
      </li>
    </ol>
  );
}
