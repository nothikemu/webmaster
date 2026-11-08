import type { ReactNode } from 'react';
import { MODULES, moduleHref, type ModuleContent } from '../content';
import { t } from '../core/assets';
import { BadgeChecklist } from '../modules/ModulePage';
import { useBadgeProgress } from '../modules/shared/badgeRows';
import { Link } from '../router';
import { Badge } from '../ui/Badges';
import { useData } from '../ui/hooks';

/** One badge as a dossier: what it is, what it needs, what is done and what remains, in words and shapes. */
function Dossier({ module, slot }: { module: ModuleContent; slot: 'a' | 'b' | 'c' }): ReactNode {
  const { done, total, earned } = useBadgeProgress(module);
  const status = earned ? 'earned' : done > 0 ? 'progress' : 'none';
  const label = earned
    ? t('ach.earned')
    : done > 0
      ? t('ach.inProgress', { done, total })
      : t('ach.notStarted', { done, total });
  return (
    <li className={`ach ach-${slot}`} data-module={module.id} data-status={status}>
      <article className="glass" aria-labelledby={`ach-${module.id}`}>
        <div className="ach-art">
          <Badge module={module.id} unlocked={earned} size={slot === 'c' ? 150 : 200} anchor />
          <p className="label">{earned ? t('badge.unlocked') : t('badge.locked')}</p>
        </div>
        <div className="ach-main">
          <header>
            <p className="label">
              <b>{String(module.index).padStart(2, '0')}</b> {module.themeSection}
            </p>
            <h2 id={`ach-${module.id}`} className="ach-title">
              {module.badge.name}
            </h2>
          </header>
          <div className="ach-status">
            <span className="status-tag" data-status={status}>
              {label}
            </span>
            <span
              className="bar ach-meter"
              role="img"
              aria-label={t('ach.meter', { name: module.badge.name, done, total })}
            >
              <span style={{ transform: `scaleX(${Math.max(0.01, done / total)})` }} />
            </span>
          </div>
          <p className="ach-criteria">{module.badge.criteria}</p>
          <BadgeChecklist module={module} showState />
          <Link to={moduleHref(module.id)} className="link-arrow">
            {t('ach.open', { title: module.title })}
          </Link>
        </div>
      </article>
    </li>
  );
}

export default function Achievements(): ReactNode {
  const data = useData();
  const earned = MODULES.filter((m) => data.modules[m.id].badge).length;
  return (
    <div className="wrap page">
      <header className="page-head">
        <h1 className="display">{t('ach.title')}</h1>
        <p className="lead">{t('ach.lead', { n: earned, total: MODULES.length })}</p>
      </header>
      <ul className="ach-list">
        <Dossier module={MODULES[0]!} slot="a" />
        <Dossier module={MODULES[1]!} slot="b" />
        <Dossier module={MODULES[2]!} slot="c" />
      </ul>
    </div>
  );
}
