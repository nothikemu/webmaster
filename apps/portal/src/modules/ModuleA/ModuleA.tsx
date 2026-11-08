import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { ModuleContent } from '../../content';
import { announce } from '../../core/announce';
import { t } from '../../core/assets';
import { chooseComputeTier } from '../../core/caps';
import { useServices } from '../../core/services';
import { createSimulation } from '../../gpu/sim/createSim';
import type { SimMode } from '../../gpu/sim/types';
import { VisuallyHidden } from '../../ui/a11y';
import { useGame } from '../../ui/hooks';
import { Segmented } from '../../ui/Segmented';
import { SceneCanvas, type SceneBinding, type SceneContext } from '../shared/SceneCanvas';
import { MODES, describeMode, type ModeInfo } from './modes';
import { SwarmScene } from './SwarmScene';
import { buildLinks, generateTopology } from './topology';

const ENGAGE_MOVES = 6;
const INTERACT_THROTTLE_MS = 900;

export default function ModuleA({ module }: { module: ModuleContent }): ReactNode {
  const services = useServices();
  const game = useGame();
  const [tier, setTier] = useState(() => services.quality.tier);
  const [mode, setModeState] = useState<ModeInfo['id']>('deflect');
  const [note, setNote] = useState('');
  const [, setStatus] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [altText, setAltText] = useState('');
  const sceneRef = useRef<SwarmScene | null>(null);
  const modeRef = useRef<ModeInfo>(MODES[0]!);
  const moves = useRef<Record<string, number>>({});
  const lastInteract = useRef(0);

  useEffect(
    () => services.quality.subscribe(() => setTier(services.quality.tier)),
    [services.quality],
  );

  const sendModule = useCallback(
    (
      event:
        | { type: 'MOUNT' }
        | { type: 'READY'; tier: string }
        | { type: 'FAIL'; reason: string }
        | { type: 'INTERACT' }
        | { type: 'UNMOUNT' },
    ) => services.actor.send({ type: 'MODULE', module: module.id, event }),
    [services.actor, module.id],
  );
  useEffect(() => {
    sendModule({ type: 'MOUNT' });
    return () => sendModule({ type: 'UNMOUNT' });
  }, [sendModule]);

  const engage = useCallback(
    (info: ModeInfo): void => {
      const n = (moves.current[info.id] = (moves.current[info.id] ?? 0) + 1);
      if (n === ENGAGE_MOVES) game({ type: 'ACTION', module: module.id, action: info.action });
      const now = performance.now();
      if (now - lastInteract.current > INTERACT_THROTTLE_MS) {
        lastInteract.current = now;
        sendModule({ type: 'INTERACT' });
      }
    },
    [game, module.id, sendModule],
  );

  const setMode = useCallback((id: ModeInfo['id']): void => {
    const info = MODES.find((m) => m.id === id)!;
    modeRef.current = info;
    setModeState(id);
    sceneRef.current?.setMode(info.mode as SimMode);
    announce(t('a.modeAnnounce', { mode: info.label }));
  }, []);

  const create = useCallback(
    async (ctx: SceneContext): Promise<SceneBinding<SwarmScene>> => {
      const { caps, kernels, overrides } = ctx.services;
      const topology = generateTopology(ctx.tier.particles);
      const links = buildLinks(topology, kernels);
      const wanted = chooseComputeTier(caps, kernels.tier !== 'ts', overrides.compute);
      const sim = await createSimulation({
        rest: topology.rest,
        phase: topology.phase,
        caps,
        kernels,
        tier: wanted,
        renderer: { kind: ctx.handle.kind, webgl: ctx.handle.webgl },
        asset: ctx.asset,
      });
      let scene: SwarmScene;
      try {
        scene = await SwarmScene.create({
          handle: ctx.handle,
          sim,
          topology,
          links,
          reduced: ctx.reduced,
          asset: ctx.asset,
        });
      } catch (err) {
        sim.dispose();
        throw err;
      }
      scene.setMode(modeRef.current.mode as SimMode);
      sceneRef.current = scene;
      const bind = (canvas: HTMLCanvasElement): (() => void) => {
        const move = (e: PointerEvent): void => {
          const r = canvas.getBoundingClientRect();
          scene.pointerMove(
            ((e.clientX - r.left) / r.width) * 2 - 1,
            -(((e.clientY - r.top) / r.height) * 2 - 1),
          );
          engage(modeRef.current);
        };
        const leave = (): void => scene.pointerLeave();
        const focus = (): void => scene.setKeyboardActive(true);
        const blur = (): void => scene.setKeyboardActive(false);
        canvas.addEventListener('pointermove', move, { passive: true });
        canvas.addEventListener('pointerleave', leave, { passive: true });
        canvas.addEventListener('pointercancel', leave, { passive: true });
        canvas.addEventListener('focus', focus);
        canvas.addEventListener('blur', blur);
        return () => {
          canvas.removeEventListener('pointermove', move);
          canvas.removeEventListener('pointerleave', leave);
          canvas.removeEventListener('pointercancel', leave);
          canvas.removeEventListener('focus', focus);
          canvas.removeEventListener('blur', blur);
        };
      };
      return {
        scene,
        bind,
        release: () => {
          sceneRef.current = null;
          sim.dispose();
        },
        note: `${ctx.handle.kind} / ${sim.kind} / ${topology.count.toLocaleString('en-US')}`,
      };
    },
    [engage],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent, scene: SwarmScene): void => {
      const map: Record<string, [number, number]> = {
        ArrowLeft: [-1, 0],
        ArrowRight: [1, 0],
        ArrowUp: [0, 1],
        ArrowDown: [0, -1],
      };
      const dir = map[e.key];
      if (dir) {
        e.preventDefault();
        scene.nudge(dir[0], dir[1]);
        engage(modeRef.current);
        return;
      }
      const byKey = MODES.find((m) => m.key === e.key);
      if (byKey) {
        e.preventDefault();
        setMode(byKey.id);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setMode(MODES[(modeRef.current.mode + 1) % MODES.length]!.id);
      } else if (e.key === 'Escape') {
        scene.setKeyboardActive(false);
      }
    },
    [engage, setMode],
  );

  return (
    <div className="stage-wrap">
      <SceneCanvas<SwarmScene>
        sceneKey={`swarm-${tier.particles}`}
        create={create}
        label={t('a.canvas')}
        describedBy="swarm-desc"
        role="application"
        className="stage-swarm"
        note={note}
        onKeyDown={onKeyDown}
        onStatus={(s, reason) => {
          setStatus(s);
          if (s === 'failed') sendModule({ type: 'FAIL', reason: reason ?? 'unknown' });
        }}
        onReady={({ note: n }) => {
          setNote(n);
          sendModule({ type: 'READY', tier: n });
        }}
      ></SceneCanvas>
      <VisuallyHidden id="swarm-desc">{`${module.centerpiece.description} ${t('a.keys')}`}</VisuallyHidden>

      <div className="stage-controls">
        <Segmented
          label={t('a.modes')}
          value={mode}
          onChange={setMode}
          options={MODES.map((m) => ({ value: m.id, label: m.label, hint: m.key }))}
        />
      </div>

      <details className="alt glass">
        <summary>{t('alt.summary')}</summary>
        <p className="prose">{module.centerpiece.description}</p>
        <div className="alt-actions" role="group" aria-label={t('a.altGroup')}>
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                setAltText(describeMode(m));
                game({ type: 'ACTION', module: module.id, action: m.action });
              }}
            >
              {t('a.describe', { mode: m.label })}
            </button>
          ))}
        </div>
        <p className="prose" role="status" aria-live="polite">
          {altText}
        </p>
      </details>
    </div>
  );
}
