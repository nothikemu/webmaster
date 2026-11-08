import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { getAsset, t } from '../core/assets';
import { Spring } from '../core/spring';
import { useServices } from '../core/services';
import { getModule, type ModuleId } from '../content';
import { useReducedMotion } from './a11y';

interface BadgeProps {
  module: ModuleId;
  unlocked: boolean;
  size?: number;
  /** Anchor id used by the unlock burst to find where to start. */
  anchor?: boolean;
}

const MAX_TILT = 16;

/**
 * A layered-polygon SVG badge. Locked badges are dimmed and desaturated. Unlocked badges tilt in
 * 3D toward the pointer (rotateX / rotateY with a moving specular highlight) and ease back to
 * neutral when it leaves. Arrow keys tilt it for keyboard users; reduced motion disables tilt.
 * The SVG markup comes from the encrypted asset table.
 */
export function Badge({ module, unlocked, size = 176, anchor = false }: BadgeProps): ReactNode {
  const { loop } = useServices();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const tilt = useRef({
    rx: new Spring(0, 11),
    ry: new Spring(0, 11),
    hx: new Spring(50, 11),
    hy: new Spring(30, 11),
  });
  const sub = useRef<ReturnType<typeof loop.subscribe> | null>(null);
  const content = getModule(module);
  const state = unlocked ? t('badge.unlocked') : t('badge.locked');

  useEffect(() => {
    const el = ref.current;
    if (!el || !unlocked || reduced) return undefined;
    const s = tilt.current;
    const handle = loop.subscribe(
      (f) => {
        s.rx.step(f.dt);
        s.ry.step(f.dt);
        s.hx.step(f.dt);
        s.hy.step(f.dt);
        el.style.setProperty('--rx', `${s.rx.value.toFixed(2)}deg`);
        el.style.setProperty('--ry', `${s.ry.value.toFixed(2)}deg`);
        el.style.setProperty('--hx', `${s.hx.value.toFixed(1)}%`);
        el.style.setProperty('--hy', `${s.hy.value.toFixed(1)}%`);
        if (s.rx.settled(0.02) && s.ry.settled(0.02) && s.hx.settled(0.1) && s.hy.settled(0.1))
          handle.setActive(false);
      },
      { element: el, active: false },
    );
    sub.current = handle;
    const move = (e: PointerEvent): void => {
      const r = el.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * 2 - 1;
      const py = ((e.clientY - r.top) / r.height) * 2 - 1;
      s.ry.target = px * MAX_TILT;
      s.rx.target = -py * MAX_TILT;
      s.hx.target = 50 + px * 40;
      s.hy.target = 40 + py * 40;
      handle.setActive(true);
    };
    const leave = (): void => {
      s.rx.target = 0;
      s.ry.target = 0;
      s.hx.target = 50;
      s.hy.target = 30;
      handle.setActive(true);
    };
    el.addEventListener('pointermove', move, { passive: true });
    el.addEventListener('pointerleave', leave, { passive: true });
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      handle.dispose();
      sub.current = null;
    };
  }, [unlocked, reduced, loop]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>): void => {
    if (!unlocked || reduced) return;
    const s = tilt.current;
    const step = 9;
    if (e.key === 'ArrowLeft') s.ry.target = Math.max(-MAX_TILT, s.ry.target - step);
    else if (e.key === 'ArrowRight') s.ry.target = Math.min(MAX_TILT, s.ry.target + step);
    else if (e.key === 'ArrowUp') s.rx.target = Math.min(MAX_TILT, s.rx.target + step);
    else if (e.key === 'ArrowDown') s.rx.target = Math.max(-MAX_TILT, s.rx.target - step);
    else if (e.key === 'Escape') {
      s.rx.target = 0;
      s.ry.target = 0;
    } else return;
    s.hx.target = 50 + s.ry.target * 2.5;
    s.hy.target = 40 - s.rx.target * 2.5;
    e.preventDefault();
    sub.current?.setActive(true);
  };

  // The image and the tilt control are siblings: an element with role="img" must not contain a
  // focusable control, so the label sits on an inner wrapper and the button stays outside it.
  return (
    <div
      ref={ref}
      className={`badge ${unlocked ? 'is-unlocked' : 'is-locked'}`}
      style={{ width: size, height: size * 1.02 }}
      data-badge={anchor ? module : undefined}
    >
      <div className="badge-art" role="img" aria-label={`${content.badge.name} badge, ${state}`}>
        <svg
          viewBox="0 0 200 204"
          width="100%"
          height="100%"
          aria-hidden="true"
          focusable="false"
          dangerouslySetInnerHTML={{ __html: getAsset(`badges/${module}.svg`) }}
        />
        <span className="badge-glint" aria-hidden="true" />
      </div>
      {unlocked && !reduced && (
        <button
          type="button"
          className="badge-key"
          aria-label={t('badge.tilt', { name: content.badge.name })}
          onKeyDown={onKey}
        />
      )}
    </div>
  );
}
