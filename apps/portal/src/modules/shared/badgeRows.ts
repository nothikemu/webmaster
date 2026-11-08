import type { ModuleContent } from '../../content';
import { t } from '../../core/assets';
import { BADGE_LESSON_RATIO, BADGE_QUIZ_MIN } from '../../core/gamification';
import { masteryRank } from '../../core/schema';
import { useData } from '../../ui/hooks';

export interface BadgeRow {
  label: string;
  done: boolean;
}

export interface BadgeProgress {
  rows: BadgeRow[];
  done: number;
  total: number;
  earned: boolean;
}

/**
 * The requirements for a module's badge, each with its current state. One source for the module
 * page, the achievements page and the one-line summary, so the three can never disagree.
 */
export function useBadgeProgress(module: ModuleContent): BadgeProgress {
  const data = useData().modules[module.id];
  const need = Math.ceil(module.lessons.length * BADGE_LESSON_RATIO);
  const practiced = module.lessons.filter(
    (l) => masteryRank(data.lessons[l.id] ?? 'unseen') >= 2,
  ).length;
  const rows: BadgeRow[] = [
    {
      label: t('check.lessons', { n: practiced, need, total: module.lessons.length }),
      done: practiced >= need,
    },
    ...module.requiredActions.map((a) => ({ label: a.label, done: data.actions[a.id] === true })),
    {
      label: t('check.quiz', { best: data.quiz.best, min: BADGE_QUIZ_MIN }),
      done: data.quiz.best >= BADGE_QUIZ_MIN,
    },
    { label: t('check.challenge', { title: module.challenge.title }), done: data.challenge.done },
  ];
  return { rows, done: rows.filter((r) => r.done).length, total: rows.length, earned: data.badge };
}
