/**
 * The 3D stage: a canvas, the renderer, the world, the figures, the input and the labels over the picture.
 *
 * Controls: WASD (or the arrow keys up and down) walk, the mouse drag or the left and right arrow keys turn the camera, Shift runs,
 * Space jumps, E / Enter uses what is near, tap or click a label (or the ground) to walk there. On a touch screen the left thumb
 * steers and the right thumb looks. The same things are listed under the picture, so nothing depends on walking.
 */
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { Color} from 'three';
import { Euler, MathUtils, Raycaster, Vector2, Vector3 } from 'three';
import { play } from '@/audio/sfx';
import type { RoomId } from '@/game/data';
import type { Hotspot } from '@/game/rooms';
import { SUN_DIR, createGfx, type Gfx, type Quality } from './gfx';
import { buildHarbor, type Harbor } from './world';
import { buildInterior, type Interior } from './interiors';
import { makeKernel, makeLamplighter, type Kernel3, type Lamplighter } from './chars';
import { followCamera, newBody, step, type Body, type CamState } from './controls';
import { makeMats } from './mat';
import { INTERIOR, PLAZA_R, QUAY_Z, SPOTS, START, WALK_R, doorFront, interiorSpawn, nearestSpot, type BuildingId, type Spot } from './layout';
import { Icon } from '@/art/Icons';

export interface Stage3DHandle {
  activate(h: Hotspot): void;
  focus(): void;
}

interface Props {
  room: RoomId;
  from: RoomId | null;
  frozen: boolean;
  found: ReadonlySet<string>;
  done: ReadonlySet<string>;
  locked: ReadonlySet<string>;
  sweep: number;
  lit: boolean[];
  quality: Quality | 'auto';
  onInteract: (h: Hotspot) => void;
  /** Called if the 3D view cannot start or is lost, so the game can fall back to 2D. */
  onFail?: () => void;
}

const VERB: Record<Spot['kind'], string> = { station: 'Play', door: 'Enter', npc: 'Talk to', relic: 'Examine', link: 'Open', look: 'Look at' };
const phrase = (label: string): string => label.replace(/^(A|An|The) /, (m) => m.toLowerCase());
export const toHotspot = (s: Spot): Hotspot => ({ id: s.id, kind: s.kind, x: s.x, label: s.label, ref: s.ref, lines: s.lines, links: s.links, reach: s.reach, lift: s.y });

const GLYPH: Record<Spot['kind'], string> = { station: '◆', door: '▲', npc: '…', relic: '✶', link: '●', look: '●' };

export const Stage3D = memo(
  forwardRef<Stage3DHandle, Props>(function Stage3D({ room, from, frozen, found, done, locked, sweep, lit, quality, onInteract, onFail }, ref) {
    const wrap = useRef<HTMLDivElement>(null);
    const canvas = useRef<HTMLCanvasElement>(null);
    const labels = useRef<Record<string, HTMLButtonElement | null>>({});
    const [nearId, setNearId] = useState<string | null>(null);
    const [sweeping, setSweeping] = useState(false);
    const [qualityNow, setQualityNow] = useState<Quality>('high');
    const [failed, setFailed] = useState(false);

    const latest = useRef({ room, from, frozen, found, done, locked, lit, quality, onInteract });
    latest.current = { room, from, frozen, found, done, locked, lit, quality, onInteract };
    const sweepRef = useRef(false);
    const failRef = useRef(onFail);
    failRef.current = onFail;
    const api = useRef<{ jump(): void; setLit(l: boolean[]): void; enter(room: RoomId, from: RoomId | null): void; walkTo(x: number, z: number, spot?: Spot): void; teleport(s: Spot): void } | null>(null);

    useImperativeHandle(ref, () => ({
      activate(h) {
        const s = SPOTS[latest.current.room].find((x) => x.id === h.id);
        if (s) {
          api.current?.teleport(s);
          latest.current.onInteract(toHotspot(s));
        }
      },
      focus() {
        wrap.current?.focus({ preventScroll: true });
      },
    }));

    useEffect(() => {
      if (!sweep) return;
      setSweeping(true);
      sweepRef.current = true;
      const t = window.setTimeout(() => {
        setSweeping(false);
        sweepRef.current = false;
      }, 3600);
      return () => window.clearTimeout(t);
    }, [sweep]);

    useEffect(() => {
      const el = wrap.current!;
      const cv = canvas.current!;
      let gfx: Gfx;
      try {
        const coarse = window.matchMedia('(pointer: coarse)').matches;
        const q0: Quality = latest.current.quality === 'auto' ? (coarse ? 'medium' : 'high') : latest.current.quality;
        gfx = createGfx(cv, q0);
        setQualityNow(q0);
      } catch {
        setFailed(true);
        return;
      }
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const mats = makeMats();
      const harbor: Harbor = buildHarbor(mats, SUN_DIR, 0.0125);
      gfx.scene.add(harbor.group);
      if (new URLSearchParams(location.search).get('debug')) gfx.setDebug(true);
      gfx.sun.intensity = 30;
      gfx.hemi.intensity = 4.5;
      gfx.fill.intensity = 7;

      const player: Lamplighter = makeLamplighter(mats);
      const kernel: Kernel3 = makeKernel(mats);
      gfx.scene.add(player.group, kernel.group);
      const interiors = new Map<BuildingId, Interior>();
      let current: Interior | null = null;

      const body: Body = newBody(START.x, START.z, START.ry);
      const cam: CamState = { yaw: START.ry + Math.PI, pitch: 0.28, dist: 7.2, pos: new Vector3(0, 3, 40), distNow: 7.2 };
      const keys = new Set<string>();
      const joy = { x: 0, y: 0 };
      let roomNow: RoomId = latest.current.room;
      let colliders = harbor.colliders;
      let camBlockers = harbor.colliders;
      let inside = (x: number, z: number) => z < QUAY_Z - 0.9 && Math.hypot(x, z) < WALK_R;
      let spots: Spot[] = SPOTS.quay;
      let walkTarget: { x: number; z: number; spot?: Spot } | null = null;
      // a tap of Space is remembered until the next frame, so a slow frame cannot lose it
      let jumpQueued = false;
      let fadeGoal = 1;
      let pending: { room: RoomId; from: RoomId | null } | null = { room: latest.current.room, from: latest.current.from };
      gfx.fade = 0;

      const bgFog = gfx.scene.fog as { density: number; color: Color };
      const place = (x: number, z: number, ry: number) => {
        body.pos.set(x, 0, z);
        body.vel.set(0, 0, 0);
        body.face = ry;
        cam.yaw = ry + Math.PI;
        cam.distNow = cam.dist;
        kernel.group.position.set(x + 1, 2, z + 1);
        cam.pos.set(x + Math.sin(cam.yaw) * 6, 3, z + Math.cos(cam.yaw) * 6);
      };

      const swap = (r: RoomId, from: RoomId | null) => {
        roomNow = r;
        spots = SPOTS[r];
        harbor.group.visible = r === 'quay';
        current?.group.removeFromParent();
        current = null;
        if (r === 'quay') {
          colliders = harbor.colliders;
          camBlockers = harbor.colliders;
          inside = (x, z) => z < QUAY_Z - 0.9 && Math.hypot(x, z) < WALK_R;
          gfx.sun.visible = true;
          cam.pitch = 0.28;
          cam.dist = 7.2;
          gfx.hemi.intensity = 4.5;
          gfx.fill.intensity = 7;
          bgFog.density = 0.0125;
          bgFog.color.setScalar(1.25);
          const d = from && from !== 'quay' ? doorFront(from as BuildingId) : START;
          place(d.x, d.z, d.ry);
        } else {
          const id = r as BuildingId;
          let it = interiors.get(id);
          if (!it) {
            it = buildInterior(id, mats);
            interiors.set(id, it);
          }
          current = it;
          gfx.scene.add(it.group);
          colliders = it.colliders;
          camBlockers = it.camBlockers;
          const { w, d } = INTERIOR[id];
          inside = (x, z) => Math.abs(x) < w / 2 - 0.7 && Math.abs(z) < d / 2 - 0.7;
          gfx.sun.visible = false;
          gfx.fill.intensity = 0;
          gfx.hemi.intensity = 3.2;
          cam.pitch = 0.3;
          cam.dist = 8.4;
          bgFog.density = 0.014;
          bgFog.color.setScalar(0.2);
          const sp = interiorSpawn(id);
          place(sp.x, sp.z, sp.ry);
        }
        walkTarget = null;
        setNearId(null);
      };

      api.current = {
        setLit(l) {
          harbor.setLit(l);
        },
        jump() {
          jumpQueued = true;
        },
        enter(r, f) {
          pending = { room: r, from: f };
          fadeGoal = 0;
        },
        walkTo(x, z, spot) {
          walkTarget = { x, z, spot };
        },
        teleport(s) {
          const dx = body.pos.x - s.x;
          const dz = body.pos.z - s.z;
          const d = Math.hypot(dx, dz) || 1;
          // stand a little in front of it, on the side the player came from
          body.pos.x = s.x + (dx / d) * Math.min(1.6, s.reach * 0.6);
          body.pos.z = s.z + (dz / d) * Math.min(1.6, s.reach * 0.6);
          body.face = Math.atan2(s.x - body.pos.x, s.z - body.pos.z);
          cam.yaw = body.face + Math.PI;
        },
      };

      // ---- input
      const keyOf = (e: KeyboardEvent): string => e.key.toLowerCase();
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = keyOf(e);
        if (k === ' ') {
          e.preventDefault();
          if (!e.repeat) jumpQueued = true;
          return;
        }
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
          keys.add(k);
          if (k !== 'shift') e.preventDefault();
          walkTarget = null;
          return;
        }
        if ((k === 'e' || (k === 'enter' && e.target === el)) && !e.repeat) {
          e.preventDefault();
          const s = nearestSpot(roomNow, body.pos.x, body.pos.z);
          if (s && !latest.current.frozen) latest.current.onInteract(toHotspot(s));
        }
      };
      const onKeyUp = (e: KeyboardEvent) => keys.delete(keyOf(e));
      el.addEventListener('keydown', onKeyDown);
      el.addEventListener('keyup', onKeyUp);
      el.addEventListener('blur', () => keys.clear());

      let drag: { id: number; x: number; y: number; moved: number; t: number } | null = null;
      const ray = new Raycaster();
      const onDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).closest('.hs3,.joy,.stage3d__pad')) return;
        drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
        try {
          cv.setPointerCapture(e.pointerId);
        } catch {
          // a pointer that has already gone (or a synthetic one) cannot be captured; dragging still works without it
        }
        el.focus({ preventScroll: true });
      };
      const onMove = (e: PointerEvent) => {
        if (!drag || drag.id !== e.pointerId) return;
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
        drag.moved += Math.abs(dx) + Math.abs(dy);
        cam.yaw -= dx * 0.0052;
        cam.pitch = MathUtils.clamp(cam.pitch + dy * 0.004, -0.05, 1.1);
      };
      const onUp = (e: PointerEvent) => {
        if (!drag || drag.id !== e.pointerId) return;
        const tap = drag.moved < 7 && performance.now() - drag.t < 350;
        drag = null;
        if (!tap || latest.current.frozen) return;
        const r = cv.getBoundingClientRect();
        ray.setFromCamera(new Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)), gfx.camera);
        const o = ray.ray.origin;
        const dir = ray.ray.direction;
        if (dir.y < -0.01) {
          const t = -o.y / dir.y;
          const x = o.x + dir.x * t;
          const z = o.z + dir.z * t;
          if (inside(x, z)) walkTarget = { x, z };
        }
      };
      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        cam.dist = MathUtils.clamp(cam.dist + e.deltaY * 0.006, 3, 13);
      };
      cv.addEventListener('pointerdown', onDown);
      cv.addEventListener('pointermove', onMove);
      cv.addEventListener('pointerup', onUp);
      cv.addEventListener('pointercancel', () => (drag = null));
      cv.addEventListener('wheel', onWheel, { passive: false });

      // touch stick
      const stick = el.querySelector<HTMLElement>('.joy');
      let stickId: number | null = null;
      const stickMove = (e: PointerEvent) => {
        if (stickId !== e.pointerId || !stick) return;
        const r = stick.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        const y = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const m = Math.hypot(x, y);
        joy.x = m > 1 ? x / m : x;
        joy.y = m > 1 ? y / m : y;
        const knob = stick.firstElementChild as HTMLElement | null;
        if (knob) knob.style.transform = `translate(${joy.x * 34}px, ${joy.y * 34}px)`;
        walkTarget = null;
      };
      const stickEnd = (e: PointerEvent) => {
        if (stickId !== e.pointerId) return;
        stickId = null;
        joy.x = joy.y = 0;
        const knob = stick?.firstElementChild as HTMLElement | null;
        if (knob) knob.style.transform = '';
      };
      stick?.addEventListener('pointerdown', (e) => {
        stickId = e.pointerId;
        try {
          stick.setPointerCapture(e.pointerId);
        } catch {
          // see above
        }
        stickMove(e);
      });
      stick?.addEventListener('pointermove', stickMove);
      stick?.addEventListener('pointerup', stickEnd);
      stick?.addEventListener('pointercancel', stickEnd);

      // ---- size
      const ro = new ResizeObserver(() => gfx.resize(el.clientWidth, el.clientHeight));
      ro.observe(el);
      gfx.resize(el.clientWidth, el.clientHeight);
      harbor.setLit(latest.current.lit);

      // ---- loop
      let raf = 0;
      let last = performance.now();
      let t = 0;
      const slow: number[] = [];
      let lastQualityCheck = 0;
      const look = new Vector3();
      const proj = new Vector3();
      const tmpEuler = new Euler();
      let nearNow: string | null = null;
      let stepClock = 0;
      let sweepK = 0;

      const frame = (now: number) => {
        const rawDt = (now - last) / 1000;
        last = now;
        const dt = Math.min(0.1, rawDt);
        t += dt;
        const L = latest.current;

        // adapt quality from the real frame time
        slow.push(rawDt);
        if (slow.length > 60) slow.shift();
        if (L.quality === 'auto' && t - lastQualityCheck > 2.5 && slow.length >= 40) {
          lastQualityCheck = t;
          const avg = slow.reduce((a, b) => a + b, 0) / slow.length;
          if (avg > 0.036 && gfx.quality !== 'low') {
            gfx.setQuality(gfx.quality === 'high' ? 'medium' : 'low');
            setQualityNow(gfx.quality);
            slow.length = 0;
          }
        } else if (L.quality !== 'auto' && gfx.quality !== L.quality) {
          gfx.setQuality(L.quality);
          setQualityNow(L.quality);
        }

        // fade between places
        if (pending && gfx.fade <= 0.02) {
          swap(pending.room, pending.from);
          pending = null;
          fadeGoal = 1;
        }
        gfx.fade += (fadeGoal - gfx.fade) * Math.min(1, dt * (reduced ? 40 : 9));
        if (Math.abs(gfx.fade - fadeGoal) < 0.01) gfx.fade = fadeGoal;

        // input to movement
        const frozen = L.frozen || pending !== null;
        let mx = joy.x;
        let mz = -joy.y;
        if (keys.has('a')) mx -= 1;
        if (keys.has('d')) mx += 1;
        if (keys.has('w') || keys.has('arrowup')) mz += 1;
        if (keys.has('s') || keys.has('arrowdown')) mz -= 1;
        if (keys.has('arrowleft')) cam.yaw += dt * 2.0;
        if (keys.has('arrowright')) cam.yaw -= dt * 2.0;
        let run = keys.has('shift') || Math.hypot(joy.x, joy.y) > 0.9;
        if (walkTarget && !frozen) {
          const dx = walkTarget.x - body.pos.x;
          const dz = walkTarget.z - body.pos.z;
          const d = Math.hypot(dx, dz);
          const arrive = walkTarget.spot ? Math.max(0.6, walkTarget.spot.reach * 0.55) : 0.5;
          if (d < arrive) {
            const s = walkTarget.spot;
            walkTarget = null;
            if (s) latest.current.onInteract(toHotspot(s));
          } else {
            // convert the world direction to camera-relative input
            const fx = -Math.sin(cam.yaw);
            const fz = -Math.cos(cam.yaw);
            const rx = Math.cos(cam.yaw);
            const rz = -Math.sin(cam.yaw);
            mz = (dx / d) * fx + (dz / d) * fz;
            mx = (dx / d) * rx + (dz / d) * rz;
            run = d > 9;
          }
        }
        if (frozen) {
          mx = 0;
          mz = 0;
        }
        const jump = jumpQueued && !frozen;
        jumpQueued = false;
        step(body, { moveX: mx, moveZ: mz, run, jump }, cam.yaw, dt, colliders, inside);
        stepClock += dt * body.speed;
        if (stepClock > 1.9 && body.grounded) {
          stepClock = 0;
          play('step');
        }

        // figures
        player.group.position.copy(body.pos);
        player.group.rotation.y = body.face;
        player.update(dt, body.speed, body.grounded, t);
        look.set(body.pos.x + Math.sin(body.face) * 3, 1.5, body.pos.z + Math.cos(body.face) * 3);
        const off = new Vector3(-1.0, 1.9 + Math.sin(t * 1.3) * 0.12, -0.9).applyAxisAngle(new Vector3(0, 1, 0), body.face);
        kernel.update(dt, t, new Vector3(body.pos.x + off.x, off.y, body.pos.z + off.z), look, false);
        const near = nearestSpot(roomNow, body.pos.x, body.pos.z);
        if ((near?.id ?? null) !== nearNow) {
          nearNow = near?.id ?? null;
          setNearId(nearNow);
          if (nearNow) play('tick');
        }
        sweepK += ((sweepRef.current ? 1 : 0) - sweepK) * Math.min(1, dt * 4);
        if (current) {
          current.setFound(L.found);
          current.setSweep(sweepK);
          current.setPlayer(body.pos);
          current.update(dt, t);
          for (const n of current.npcs) n.npc.update(dt, t, near?.id === n.id, body.pos);
        } else harbor.update(dt, t, body.pos, gfx.camera);
        if (!current) harbor.water.update(t, gfx.camera.position.x, gfx.camera.position.z);

        // camera
        followCamera(cam, body.pos, dt, camBlockers, reduced);
        gfx.camera.position.copy(cam.pos);
        gfx.camera.lookAt(body.pos.x, body.pos.y * 0.5 + 1.45, body.pos.z);
        const fov = 52 + (reduced ? 0 : Math.min(1, body.speed / 7.6) * 4);
        if (Math.abs(gfx.camera.fov - fov) > 0.05) {
          gfx.camera.fov += (fov - gfx.camera.fov) * Math.min(1, dt * 4);
          gfx.camera.updateProjectionMatrix();
        }
        void tmpEuler;
        gfx.followShadow(body.pos);

        // labels over the picture
        const W = el.clientWidth;
        const H = el.clientHeight;
        for (const s of spots) {
          const b = labels.current[s.id];
          if (!b) continue;
          proj.set(s.x, s.y, s.z).project(gfx.camera);
          const d = Math.hypot(s.x - body.pos.x, s.z - body.pos.z);
          const isFound = s.kind === 'relic' && L.found.has(s.ref ?? '');
          const reveal = s.kind !== 'relic' || (sweepRef.current && !isFound) || (!isFound && d < s.reach * 2.4);
          const visible = reveal && proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1 && d < (s.kind === 'relic' ? 22 : 110);
          b.style.display = visible ? '' : 'none';
          if (visible) {
            const px = Math.min(W - 60, Math.max(60, ((proj.x + 1) / 2) * W));
            const py = Math.min(H - 40, Math.max(40, ((1 - proj.y) / 2) * H));
            b.style.transform = `translate(${px}px, ${py}px) translate(-50%, -50%)`;
          }
        }

        wrap.current?.setAttribute('data-px', body.pos.x.toFixed(2));
        wrap.current?.setAttribute('data-pz', body.pos.z.toFixed(2));
        wrap.current?.setAttribute('data-yaw', cam.yaw.toFixed(2));
        wrap.current?.setAttribute('data-py', body.pos.y.toFixed(2));
        wrap.current?.setAttribute('data-room', roomNow);
        wrap.current?.setAttribute('data-fps', String(Math.round(1 / Math.max(0.001, slow.reduce((a, b) => a + b, 0) / Math.max(1, slow.length)))));
        gfx.render(dt);
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);

      const onLost = (e: Event) => {
        e.preventDefault();
        setFailed(true);
      };
      cv.addEventListener('webglcontextlost', onLost);
      el.focus({ preventScroll: true });
      void PLAZA_R;

      return () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        el.removeEventListener('keydown', onKeyDown);
        el.removeEventListener('keyup', onKeyUp);
        cv.removeEventListener('pointerdown', onDown);
        cv.removeEventListener('pointermove', onMove);
        cv.removeEventListener('pointerup', onUp);
        cv.removeEventListener('wheel', onWheel);
        cv.removeEventListener('webglcontextlost', onLost);
        api.current = null;
        gfx.dispose();
      };
    }, []);

    // react to room, progress and quality changes
    useEffect(() => {
      api.current?.enter(room, from);
    }, [room, from]);
    useEffect(() => {
      api.current?.setLit(lit);
    }, [lit]);

    const spots = SPOTS[room];
    const nearSpot = spots.find((s) => s.id === nearId);
    const use = useCallback((s: Spot) => {
      if (latest.current.frozen) return;
      const d = Math.hypot(s.x - (Number(wrap.current?.dataset.px) || 0), s.z - (Number(wrap.current?.dataset.pz) || 0));
      if (d <= s.reach) latest.current.onInteract(toHotspot(s));
      else api.current?.walkTo(s.x, s.z, s);
    }, []);
    const stateOf = (s: Spot): 'new' | 'found' | 'done' | 'locked' | 'open' => {
      if (s.kind === 'relic') return found.has(s.ref ?? '') ? 'found' : 'new';
      if (s.kind === 'station') return done.has(s.ref ?? '') ? 'done' : 'open';
      if (s.kind === 'door') return locked.has(s.ref ?? '') ? 'locked' : 'open';
      return 'open';
    };

    useEffect(() => {
      if (failed) failRef.current?.();
    }, [failed]);

    if (failed)
      return (
        <p className="callout" role="alert">
          The 3D view could not start on this device. Switch to the classic 2D game from the pause menu.
        </p>
      );

    return (
      <div className="stage3d-wrap">
        {/* The stage is a custom widget (a game view) that has to take keyboard input; everything in it is also in the list below. */}
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <div
          ref={wrap}
          className={`stage3d${sweeping ? ' is-sweeping' : ''}`}
          tabIndex={0}
          role="application"
          aria-roledescription="3D game view"
          aria-label="3D game view. Walk with W A S D. Turn the camera with the mouse or the left and right arrow keys. Press E to use what is near. Everything here is also listed under Places and objects."
        >
          <canvas ref={canvas} className="stage3d__canvas" />
          <div className="stage3d__labels">
            {spots.map((s) => {
              const st = stateOf(s);
              return (
                <button
                  key={s.id}
                  ref={(el) => {
                    labels.current[s.id] = el;
                  }}
                  type="button"
                  tabIndex={-1}
                  className={`hs3 hs3--${s.kind} is-${st}${s.id === nearId ? ' is-near' : ''}`}
                  aria-label={st === 'locked' ? `${s.label} (locked)` : st === 'found' ? `${s.label} (found)` : st === 'done' ? `${s.label} (cleared)` : s.label}
                  onClick={() => use(s)}
                >
                  <span className="hs3__mark" aria-hidden="true">{st === 'locked' ? '✕' : GLYPH[s.kind]}</span>
                  <span className="hs3__name" aria-hidden="true">{s.label}</span>
                </button>
              );
            })}
          </div>
          {nearSpot ? (
            <div className="stage3d__prompt" aria-hidden="true">
              <kbd>E</kbd>
              <span>
                {locked.has(nearSpot.ref ?? '') && nearSpot.kind === 'door' ? 'Locked: ' : `${VERB[nearSpot.kind]} `}
                {phrase(nearSpot.label)}
              </span>
            </div>
          ) : null}
          <div className="joy" aria-hidden="true">
            <span />
          </div>
          <div className="stage3d__pad">
            <button type="button" className="padbtn" aria-label="Jump" onClick={() => api.current?.jump()}>
              <Icon name="arrow-left" className="rot-up" />
            </button>
            <button type="button" className="padbtn padbtn--use" disabled={!nearSpot} aria-label={nearSpot ? `${VERB[nearSpot.kind]} ${phrase(nearSpot.label)}` : 'Nothing here to use'} onClick={() => nearSpot && use(nearSpot)}>
              Use
            </button>
          </div>
          <span className="visually-hidden" data-quality={qualityNow} />
        </div>
        <p className="visually-hidden" role="status">
          {nearSpot ? `${VERB[nearSpot.kind]} ${phrase(nearSpot.label)}. Press E.` : ''}
        </p>
        <details className="room__guide">
          <summary>Places and objects ({spots.length})</summary>
          <ul>
            {spots.map((s) => {
              const st = stateOf(s);
              return (
                <li key={s.id}>
                  <button
                    type="button"
                    className="btn btn--sm"
                    onClick={() => {
                      api.current?.teleport(s);
                      if (!latest.current.frozen) latest.current.onInteract(toHotspot(s));
                    }}
                  >
                    {VERB[s.kind]} {phrase(s.label)}
                    {st === 'found' ? ' (found)' : st === 'done' ? ' (cleared)' : st === 'locked' ? ' (locked)' : ''}
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
