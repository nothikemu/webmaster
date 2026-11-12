/**
 * The room runtime: a side-scrolling stage with a walking player, parallax, a following camera and hotspots.
 *
 * Input: arrow keys or A/D to walk (Shift to hurry), E / Enter / Space to use what is near, tap or click the floor to walk there,
 * tap an object to walk to it and use it, on-screen buttons on touch screens. Everything in the room is also listed in a plain
 * "In this room" panel, so a player who cannot walk (or cannot see the stage) can still do everything.
 *
 * Motion is applied straight to the DOM from one animation loop, so walking never re-renders React.
 */
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState, type ComponentType } from 'react';
import { Kernel } from '@/art/Kernel';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import { FLOOR_Y, ROOM_HEIGHT } from './data';
import { nearest, type Hotspot, type RoomDef } from './rooms';
import { Keeper } from './art/Keeper';

export interface RoomHandle {
  /** Move the player to a hotspot and use it, for the "In this room" list. */
  activate(h: Hotspot): void;
  focus(): void;
}

interface RoomProps {
  def: RoomDef;
  Far: ComponentType;
  Near: ComponentType;
  startX: number;
  frozen: boolean;
  found: ReadonlySet<string>;
  done: ReadonlySet<string>;
  locked: ReadonlySet<string>;
  sweep: number;
  onInteract: (h: Hotspot) => void;
}

/** "A torn corner of chart" reads better after a verb as "a torn corner of chart". */
const phrase = (label: string): string => label.replace(/^(A|An|The) /, (m) => m.toLowerCase());
const VERB: Record<Hotspot['kind'], string> = { station: 'Play', door: 'Enter', npc: 'Talk to', relic: 'Examine', link: 'Open', look: 'Look at' };
const FAR_FACTOR = 0.5;
const FAR_EXTRA = 1700;
const WALK = 300;
const RUN = 1.7;

const HotspotButton = memo(function HotspotButton({ h, state, near, onUse }: { h: Hotspot; state: 'new' | 'found' | 'done' | 'locked' | 'open'; near: boolean; onUse: (h: Hotspot) => void }) {
  const lift = h.lift ?? 200;
  const reach = h.reach ?? 90;
  const w = Math.min(190, reach * 1.6);
  return (
    <button
      type="button"
      className={`hs hs--${h.kind} is-${state}${near ? ' is-near' : ''}`}
      style={{ left: `calc(var(--s) * ${h.x - w / 2}px)`, width: `calc(var(--s) * ${w}px)`, top: `calc(var(--s) * ${FLOOR_Y - lift - 56}px)`, height: `calc(var(--s) * ${lift + 56}px)` }}
      aria-label={state === 'locked' ? `${h.label} (locked)` : state === 'found' ? `${h.label} (found)` : state === 'done' ? `${h.label} (cleared)` : h.label}
      onClick={(e) => {
        e.stopPropagation();
        onUse(h);
      }}
      onPointerDown={(e) => e.stopPropagation()}
      tabIndex={-1}
    >
      <span className="hs__mark" aria-hidden="true">
        {h.kind === 'station' ? '◆' : h.kind === 'door' ? (state === 'locked' ? '✕' : '▲') : h.kind === 'npc' ? '…' : h.kind === 'relic' ? '✶' : '●'}
      </span>
    </button>
  );
});

export const Room = memo(
  forwardRef<RoomHandle, RoomProps>(function Room({ def, Far, Near, startX, frozen, found, done, locked, sweep, onInteract }, ref) {
    const viewRef = useRef<HTMLDivElement>(null);
    const worldRef = useRef<HTMLDivElement>(null);
    const farRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<HTMLDivElement>(null);
    const buddyRef = useRef<HTMLDivElement>(null);
    const [nearId, setNearId] = useState<string | null>(null);
    const [sweeping, setSweeping] = useState(false);

    const latest = useRef({ frozen, onInteract, locked });
    latest.current = { frozen, onInteract, locked };

    const s = useRef({
      x: startX,
      face: 1 as 1 | -1,
      cam: -1,
      target: null as number | null,
      pending: null as Hotspot | null,
      keys: new Set<string>(),
      touch: 0 as -1 | 0 | 1,
      scale: 1,
      viewW: 1200,
      near: null as string | null,
      stepClock: 0,
      buddy: startX - 80,
      t: 0,
    });

    const use = useCallback((h: Hotspot) => {
      if (latest.current.frozen) return;
      latest.current.onInteract(h);
    }, []);

    const activate = useCallback(
      (h: Hotspot) => {
        const st = s.current;
        st.x = h.x;
        st.target = null;
        st.pending = null;
        use(h);
      },
      [use],
    );

    useImperativeHandle(ref, () => ({
      activate,
      focus() {
        viewRef.current?.focus({ preventScroll: true });
      },
    }));

    // lantern sweep: markers show for a moment
    useEffect(() => {
      if (!sweep) return;
      setSweeping(true);
      const t = window.setTimeout(() => setSweeping(false), 3200);
      return () => window.clearTimeout(t);
    }, [sweep]);

    useEffect(() => {
      const view = viewRef.current!;
      const world = worldRef.current!;
      const far = farRef.current!;
      const player = playerRef.current!;
      const buddy = buddyRef.current!;
      const st = s.current;
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const W = def.width;
      let raf = 0;
      let last = performance.now();

      const measure = () => {
        // The picture always fills the width of the stage; if the stage is wide and short, the top of the room is cropped, never the floor.
        st.scale = Math.max(view.clientHeight / ROOM_HEIGHT, view.clientWidth / W) || 1;
        st.viewW = view.clientWidth / st.scale;
        const top = view.clientHeight - ROOM_HEIGHT * st.scale;
        world.style.setProperty('--s', String(st.scale));
        view.style.setProperty('--s', String(st.scale));
        world.style.width = `${W * st.scale}px`;
        world.style.height = `${ROOM_HEIGHT * st.scale}px`;
        world.style.top = `${top}px`;
        far.style.width = `${(W * FAR_FACTOR + FAR_EXTRA) * st.scale}px`;
        far.style.height = `${ROOM_HEIGHT * st.scale}px`;
        far.style.top = `${top}px`;
        st.cam = -1;
      };
      measure();
      const ro = new ResizeObserver(measure);
      ro.observe(view);

      const frame = (now: number) => {
        const dt = Math.min(0.05, (now - last) / 1000);
        last = now;
        st.t += dt;
        const { frozen: fz } = latest.current;
        const keyDir = (st.keys.has('left') ? -1 : 0) + (st.keys.has('right') ? 1 : 0);
        const dir = fz ? 0 : keyDir || st.touch;
        const run = st.keys.has('shift') ? RUN : 1;
        let vx = 0;
        if (dir) {
          st.target = null;
          st.pending = null;
          vx = dir * WALK * run;
        } else if (st.target !== null && !fz) {
          const dx = st.target - st.x;
          if (Math.abs(dx) <= 8) {
            st.x = st.target;
            st.target = null;
            const p = st.pending;
            st.pending = null;
            if (p) use(p);
          } else vx = Math.sign(dx) * WALK * 1.15;
        }
        if (vx) {
          st.x = Math.min(W - 70, Math.max(70, st.x + vx * dt));
          st.face = vx > 0 ? 1 : -1;
          st.stepClock += dt;
          if (st.stepClock > (run > 1 ? 0.2 : 0.3)) {
            st.stepClock = 0;
            play('step');
          }
        }
        const moving = vx !== 0;
        player.classList.toggle('is-walking', moving);
        player.classList.toggle('is-left', st.face === -1);

        // camera
        const maxCam = Math.max(0, W - st.viewW);
        const want = Math.min(maxCam, Math.max(0, st.x - st.viewW / 2));
        st.cam = st.cam < 0 || reduced ? want : st.cam + (want - st.cam) * Math.min(1, dt * 7);
        world.style.transform = `translate3d(${-st.cam * st.scale}px,0,0)`;
        far.style.transform = `translate3d(${-st.cam * FAR_FACTOR * st.scale}px,0,0)`;
        player.style.transform = `translate3d(${st.x * st.scale}px,0,0)`;
        const want2 = st.x - st.face * 78;
        st.buddy += (want2 - st.buddy) * Math.min(1, dt * 3.2);
        buddy.style.transform = `translate3d(${st.buddy * st.scale}px,${reduced ? 0 : Math.sin(st.t * 2.2) * 6 * st.scale}px,0)`;

        const h = nearest(def, st.x);
        const id = h?.id ?? null;
        if (id !== st.near) {
          st.near = id;
          setNearId(id);
          if (id) play('tick');
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
      view.focus({ preventScroll: true });
      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
      };
    }, [def, use]);

    const keyOf = (e: React.KeyboardEvent): string | null => {
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') return 'left';
      if (k === 'arrowright' || k === 'd') return 'right';
      if (k === 'shift') return 'shift';
      return null;
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const k = keyOf(e);
      if (k) {
        s.current.keys.add(k);
        if (k !== 'shift') e.preventDefault();
        return;
      }
      const key = e.key.toLowerCase();
      const onStage = e.target === e.currentTarget;
      if (key === 'e' || ((key === 'enter' || key === ' ') && onStage)) {
        e.preventDefault();
        if (e.repeat) return;
        const h = nearest(def, s.current.x);
        if (h) use(h);
      }
    };

    const onKeyUp = (e: React.KeyboardEvent) => {
      const k = keyOf(e);
      if (k) s.current.keys.delete(k);
    };

    const onFloor = (e: React.PointerEvent) => {
      if (latest.current.frozen) return;
      const rect = worldRef.current!.getBoundingClientRect();
      const st = s.current;
      st.target = Math.min(def.width - 70, Math.max(70, (e.clientX - rect.left) / st.scale));
      st.pending = null;
      viewRef.current?.focus({ preventScroll: true });
    };

    const tapHotspot = useCallback(
      (h: Hotspot) => {
        const st = s.current;
        if (Math.abs(st.x - h.x) <= (h.reach ?? 90)) use(h);
        else {
          st.target = h.x;
          st.pending = h;
        }
      },
      [use],
    );

    const pad = (dir: -1 | 0 | 1) => ({
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        s.current.touch = dir;
      },
      onPointerUp: () => (s.current.touch = 0),
      onPointerCancel: () => (s.current.touch = 0),
      onLostPointerCapture: () => (s.current.touch = 0),
    });

    const hs = def.hotspots;
    const nearH = hs.find((h) => h.id === nearId);
    const stateOf = (h: Hotspot): 'new' | 'found' | 'done' | 'locked' | 'open' => {
      if (h.kind === 'relic') return found.has(h.ref ?? '') ? 'found' : 'new';
      if (h.kind === 'station') return done.has(h.ref ?? '') ? 'done' : 'open';
      if (h.kind === 'door') return locked.has(h.ref ?? '') ? 'locked' : 'open';
      return 'open';
    };

    return (
      <div className="room" data-room={def.id}>
        {/* The stage is a custom widget (a game view) that has to take keyboard input; everything in it is also in the "In this room" list below. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={viewRef}
          className={`room__view${sweeping ? ' is-sweeping' : ''}`}
          tabIndex={0}
          role="application"
          aria-roledescription="game view"
          aria-label={`Game view. Walk with the arrow keys or A and D. Press E to use what is near. Press L to lift your lantern. Everything here is also listed under In this room.`}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={() => {
            s.current.keys.clear();
            s.current.touch = 0;
          }}
        >
          <div ref={farRef} className="room__far">
            <Far />
          </div>
          <div ref={worldRef} className="room__world" onPointerDown={onFloor}>
            <Near />
            {hs.map((h) => (
              <HotspotButton key={h.id} h={h} state={stateOf(h)} near={h.id === nearId} onUse={tapHotspot} />
            ))}
            <div ref={buddyRef} className="buddy">
              <Kernel mood={sweeping ? 'look' : 'idle'} hold="none" className="buddy__art" />
            </div>
            <div ref={playerRef} className="player">
              <div className="player__glow" />
              <Keeper />
            </div>
          </div>
          <div className="room__vignette" aria-hidden="true" />
          {nearH ? (
            <div className="room__prompt" aria-hidden="true">
              <kbd>E</kbd>
              <span>
                {locked.has(nearH.ref ?? '') && nearH.kind === 'door' ? 'Locked: ' : `${VERB[nearH.kind]} `}
                {phrase(nearH.label)}
              </span>
            </div>
          ) : null}
        </div>
        <div className="room__pad">
          <button type="button" className="padbtn" aria-label="Walk left" {...pad(-1)}>
            <Icon name="arrow-left" />
          </button>
          <button type="button" className="padbtn" aria-label="Walk right" {...pad(1)}>
            <Icon name="arrow-right" />
          </button>
          <button type="button" className="padbtn padbtn--use" disabled={!nearH} onClick={() => nearH && use(nearH)} aria-label={nearH ? `${VERB[nearH.kind]} ${phrase(nearH.label)}` : 'Nothing here to use'}>
            Use
          </button>
        </div>
        <p className="visually-hidden" role="status">
          {nearH ? `${VERB[nearH.kind]} ${phrase(nearH.label)}. Press E.` : ''}
        </p>
        <details className="room__guide">
          <summary>In this room ({hs.length})</summary>
          <ul>
            {hs.map((h) => {
              const state = stateOf(h);
              return (
                <li key={h.id}>
                  <button type="button" className="btn btn--sm" onClick={() => activate(h)}>
                    {VERB[h.kind]} {phrase(h.label)}
                    {state === 'found' ? ' (found)' : state === 'done' ? ' (cleared)' : state === 'locked' ? ' (locked)' : ''}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      </div>
    );
  }),
);
