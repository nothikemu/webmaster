import { useEffect, useRef, type ReactNode } from 'react';
import { MODULES } from '../content';
import { t } from '../core/assets';
import { HUB_TOGGLE_ID } from '../core/machines/hub';
import { levelInfo } from '../core/gamification';
import { Link } from '../router';
import { useData, useHub, useOverall, useRecommendation, useSnapshot, useTween } from './hooks';
import { Ring } from './Ring';

/**
 * Floating, collapsible, keyboard-operable glass panel: overall and per-module progress as
 * gradient rings, XP toward the next level with a tweened counter, the streak, and the next
 * recommended step. Collapsed state is a single button; Escape closes the panel.
 */
export function TelemetryHub(): ReactNode {
  const hub = useHub();
  const open = useSnapshot(hub).matches('expanded');
  const data = useData();
  const overall = useOverall();
  const rec = useRecommendation();
  const level = levelInfo(data.xp);
  const overallT = useTween(overall);
  const xpT = useTween(data.xp);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open)
      panelRef.current?.querySelector<HTMLElement>('a, button')?.focus({ preventScroll: true });
  }, [open]);

  // Escape closes the panel while focus is inside the hub.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && panelRef.current?.closest('.hub')?.contains(document.activeElement))
        hub.send({ type: 'CLOSE' });
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, hub]);

  return (
    <aside className="hub" aria-label={t('hub.region')} data-open={open}>
      {open && (
        <div
          className="hub-panel glass edge"
          data-surface="ink"
          id="hub-panel"
          data-hub-panel
          ref={panelRef}
        >
          <div className="hub-head">
            <Ring value={overallT} size={84} stroke={6} label={t('hub.overall')}>
              <span className="num">{Math.round(overallT)}</span>
            </Ring>
            <div>
              <p className="mono">{t('hub.level', { level: level.level })}</p>
              <p className="hub-name">{level.name}</p>
              <p className="num hub-xp">
                {Math.round(xpT)} <span className="muted">XP</span>
              </p>
            </div>
          </div>
          <div
            className="hub-bar"
            role="img"
            aria-label={t('hub.toNext', {
              xp: Math.max(0, level.span - level.into),
              level: level.level + 1,
            })}
          >
            <span style={{ transform: `scaleX(${Math.max(0.02, level.fraction)})` }} />
          </div>
          <ul className="hub-modules">
            {MODULES.map((m) => (
              <li key={m.id} data-module={m.id}>
                <span className="mod-bar-n" aria-hidden="true">
                  {String(m.index).padStart(2, '0')}
                </span>
                <span>{m.title}</span>
                <span className="num">{data.modules[m.id].progress}%</span>
              </li>
            ))}
          </ul>
          <Link to={rec.href} className="hub-next">
            <span className="mono">{t('hub.next')}</span>
            <span>{rec.label}</span>
          </Link>
          <Link to="/progress" className="hub-link mono">
            {t('hub.dashboard')}
          </Link>
        </div>
      )}
      <button
        type="button"
        id={HUB_TOGGLE_ID}
        className="hub-toggle"
        data-surface="ink"
        aria-expanded={open}
        aria-controls="hub-panel"
        onClick={() => hub.send({ type: 'TOGGLE' })}
      >
        <Ring value={overallT} size={40} stroke={4} label={t('hub.overall')}>
          <span className="num hub-ring-num">{Math.round(overallT)}</span>
        </Ring>
        <span className="hub-toggle-text">
          <span className="mono">{t('hub.level', { level: level.level })}</span>
          <span className="num">{Math.round(overallT)}%</span>
        </span>
        <span className="sr-only">{open ? t('hub.close') : t('hub.open')}</span>
      </button>
    </aside>
  );
}
