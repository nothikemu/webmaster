import type { ReactNode } from 'react';
import { getModule, type ModuleId } from '../content';
import { masteryRank } from '../core/schema';
import { t } from '../core/assets';
import { useData } from './hooks';

/** Lesson-by-lesson progress for one module: one segment per lesson, filled by how well it is known. */
export function Track({ id }: { id: ModuleId }): ReactNode {
  const m = getModule(id);
  const d = useData().modules[id];
  const known = m.lessons.filter((l) => masteryRank(d.lessons[l.id] ?? 'unseen') >= 2).length;
  return (
    <span
      className="track"
      role="img"
      aria-label={t('track.label', { n: known, total: m.lessons.length })}
    >
      {m.lessons.map((l) => (
        <i key={l.id} data-state={d.lessons[l.id] ?? 'unseen'} />
      ))}
    </span>
  );
}
