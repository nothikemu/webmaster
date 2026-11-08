import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react';
import { getAsset, t } from '../../core/assets';
import type { Frame } from '../../core/loop';
import { useServices, type Services } from '../../core/services';
import type { QualityTier } from '../../core/quality';
import {
  createRenderHandle,
  type RenderHandle,
  type RendererKind,
} from '../../gpu/rendererFactory';
import { useReducedMotion } from '../../ui/a11y';
import { hairlineClass } from '../../ui/edge';

export interface SceneContext {
  handle: RenderHandle;
  services: Services;
  reduced: boolean;
  tier: QualityTier;
  asset(name: string): string;
}

export interface SceneController {
  resize(width: number, height: number, dpr: number): void;
  update(frame: Frame): void;
  dispose(): void;
}

export interface SceneBinding<S extends SceneController> {
  scene: S;
  /** Attaches input listeners to the canvas; returns the cleanup. */
  bind?(canvas: HTMLCanvasElement): () => void;
  /** Releases resources the scene does not own, such as a simulation backend. */
  release?(): void;
  /** Short note for the status line, e.g. the compute tier in use. */
  note?: string;
}

export type SceneStatus = 'loading' | 'ready' | 'failed';

interface Props<S extends SceneController> {
  /** Changing the key tears the scene down and builds it again (for example on a particle-count change). */
  sceneKey: string;
  create(ctx: SceneContext): Promise<SceneBinding<S>>;
  label: string;
  describedBy: string;
  role: 'application' | 'img';
  className?: string;
  onReady?(info: { kind: RendererKind; scene: S; note: string }): void;
  onStatus?(status: SceneStatus, reason: string | null): void;
  onKeyDown?(event: KeyboardEvent, scene: S): void;
  /** Renderer and compute tier, exposed as data-note for tests; never drawn. */
  note?: string;
  children?: ReactNode;
}

function makeCanvas(
  label: string,
  describedBy: string,
  role: 'application' | 'img',
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.className = 'stage-canvas';
  canvas.setAttribute('role', role);
  canvas.setAttribute('aria-label', label);
  canvas.setAttribute('aria-describedby', describedBy);
  if (role === 'application') canvas.tabIndex = 0;
  return canvas;
}

/**
 * Hosts one GPU scene: creates the canvas and renderer (retrying on a fresh canvas if WebGPU
 * fails), sizes it from its container, subscribes to the master loop only while visible,
 * follows the quality governor, and releases every GPU resource on unmount or context loss.
 */
export function SceneCanvas<S extends SceneController>(props: Props<S>): ReactNode {
  const services = useServices();
  const reduced = useReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const [status, setStatus] = useState<SceneStatus>('loading');
  const [reason, setReason] = useState<string | null>(null);
  const tier = useSyncExternalStore(services.quality.subscribe, services.quality.getSnapshot);
  const tierRef = useRef(tier);
  tierRef.current = tier;
  const applyTier = useRef<(() => void) | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;
    let disposed = false;
    const cleanups: Array<() => void> = [];
    let settled = false;
    const fail = (why: string): void => {
      if (disposed) return;
      settled = true;
      setStatus('failed');
      setReason(why);
      latest.current.onStatus?.('failed', why);
    };
    // A scene that neither starts nor fails within 15 seconds is treated as failed, so the visitor
    // gets the explanation and the text alternative instead of a permanent loading state.
    const watchdog = window.setTimeout(() => {
      if (settled || disposed) return;
      fail(t('stage.timeout'));
      disposed = true;
    }, 15000);
    cleanups.push(() => window.clearTimeout(watchdog));

    void (async () => {
      setStatus('loading');
      setReason(null);
      latest.current.onStatus?.('loading', null);
      const { caps, overrides } = services;
      let pref = overrides.renderer;
      let handle: RenderHandle | null = null;
      let binding: SceneBinding<SceneController> | null = null;
      let canvas: HTMLCanvasElement | null = null;
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 2 && !binding; attempt++) {
        canvas = makeCanvas(latest.current.label, latest.current.describedBy, latest.current.role);
        stage.prepend(canvas);
        try {
          handle = await createRenderHandle(canvas, caps, pref, tierRef.current.post);
          if (disposed) {
            handle.dispose();
            canvas.remove();
            return;
          }
          binding = await latest.current.create({
            handle,
            services,
            reduced: reducedRef.current,
            tier: tierRef.current,
            asset: getAsset,
          });
        } catch (err) {
          lastError = err;
          binding = null;
          handle?.dispose();
          handle = null;
          canvas.remove();
          if (disposed) return;
          if (pref !== 'webgl2' && caps.webgl2) {
            pref = 'webgl2';
            continue;
          }
          break;
        }
      }
      if (!binding || !handle || !canvas) {
        fail(lastError instanceof Error ? lastError.message : 'The 3D scene could not start');
        return;
      }
      if (disposed) {
        binding.scene.dispose();
        binding.release?.();
        handle.dispose();
        canvas.remove();
        return;
      }
      const live = binding;
      const liveHandle = handle;
      const liveCanvas = canvas;
      const size = (): void => {
        const w = Math.max(1, stage.clientWidth);
        const h = Math.max(1, stage.clientHeight);
        const dpr = Math.min(window.devicePixelRatio || 1, tierRef.current.dprCap);
        live.scene.resize(w, h, dpr);
      };
      size();
      liveHandle.setPost(tierRef.current.post);
      applyTier.current = () => {
        liveHandle.setPost(tierRef.current.post);
        size();
      };
      const ro = new ResizeObserver(size);
      ro.observe(stage);
      const sub = services.loop.subscribe((f) => live.scene.update(f), {
        element: stage,
        heavy: true,
      });
      const unbind = live.bind?.(liveCanvas);
      const onKey = (e: KeyboardEvent): void => latest.current.onKeyDown?.(e, live.scene as never);
      liveCanvas.addEventListener('keydown', onKey);
      liveHandle.onLost((why) => fail(why));

      cleanups.push(() => {
        applyTier.current = null;
        sub.dispose();
        ro.disconnect();
        liveCanvas.removeEventListener('keydown', onKey);
        unbind?.();
        live.scene.dispose();
        live.release?.();
        liveHandle.dispose();
        liveCanvas.remove();
      });
      settled = true;
      setStatus('ready');
      latest.current.onStatus?.('ready', null);
      latest.current.onReady?.({
        kind: liveHandle.kind,
        scene: live.scene as never,
        note: live.note ?? '',
      });
    })().catch((err: unknown) =>
      fail(err instanceof Error ? err.message : 'The 3D scene could not start'),
    );

    return () => {
      disposed = true;
      for (const c of cleanups.splice(0)) c();
    };
    // The scene is rebuilt only when its key changes; other inputs are read through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.sceneKey, services]);

  useEffect(() => {
    applyTier.current?.();
  }, [tier]);

  return (
    <div
      className={`stage ${props.className ?? ''}`}
      ref={stageRef}
      data-status={status}
      data-note={props.note || undefined}
    >
      {status === 'loading' && (
        <div className="stage-status" aria-hidden="true">
          <span className={hairlineClass} />
          <span className="mono">{t('stage.loading')}</span>
        </div>
      )}
      {status === 'failed' && (
        <div className="stage-status stage-failed" role="note">
          <span className="mono">{t('stage.unavailable')}</span>
          <span>{t('stage.unavailable.body')}</span>
          {reason && <span className="stage-reason mono">{reason}</span>}
        </div>
      )}
      {props.children}
    </div>
  );
}
