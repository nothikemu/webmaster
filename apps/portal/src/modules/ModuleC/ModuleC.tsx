import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { VULNERABILITIES, type ModuleContent } from '../../content';
import { announce } from '../../core/announce';
import { t } from '../../core/assets';
import { useServices } from '../../core/services';
import { VisuallyHidden } from '../../ui/a11y';
import { useGame } from '../../ui/hooks';
import { SceneCanvas, type SceneBinding, type SceneContext } from '../shared/SceneCanvas';
import { WireframeScene } from './WireframeScene';

export default function ModuleC({ module }: { module: ModuleContent }): ReactNode {
  const services = useServices();
  const game = useGame();
  const [active, setActive] = useState<number | null>(null);
  const [inspected, setInspected] = useState<Record<string, true>>({});
  const sceneRef = useRef<WireframeScene | null>(null);
  const pendingRef = useRef<number | null>(null);
  const [counts, setCounts] = useState({ v: 0, e: 0 });

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

  const create = useCallback(async (ctx: SceneContext): Promise<SceneBinding<WireframeScene>> => {
    const scene = await WireframeScene.create({
      handle: ctx.handle,
      reduced: ctx.reduced,
      asset: ctx.asset,
    });
    scene.setMarker(pendingRef.current);
    sceneRef.current = scene;
    setCounts({ v: scene.vertexCount, e: scene.edgeCount });
    return {
      scene,
      release: () => void (sceneRef.current = null),
      note: `${ctx.handle.kind} / ${scene.vertexCount.toLocaleString('en-US')}`,
    };
  }, []);

  const choose = (i: number): void => {
    const v = VULNERABILITIES[i]!;
    pendingRef.current = i;
    sceneRef.current?.setMarker(i);
    setActive(i);
    setInspected((s) => ({ ...s, [v.id]: true }));
    game({ type: 'ACTION', module: module.id, action: v.id });
    sendModule({ type: 'INTERACT' });
    announce(t('c.announce', { name: v.name }));
  };

  const remediate = (): void => {
    pendingRef.current = null;
    sceneRef.current?.setMarker(null);
    setActive(null);
    game({ type: 'ACTION', module: module.id, action: 'remediate' });
    sendModule({ type: 'INTERACT' });
    announce(t('c.remediated'));
  };

  const current = active === null ? null : VULNERABILITIES[active]!;

  return (
    <div className="stage-wrap">
      <SceneCanvas<WireframeScene>
        sceneKey="wire"
        create={create}
        label={t('c.canvas')}
        describedBy="wire-desc"
        role="img"
        className="stage-wire"
        note={
          counts.v
            ? t('c.counts', {
                v: counts.v.toLocaleString('en-US'),
                e: counts.e.toLocaleString('en-US'),
              })
            : ''
        }
        onStatus={(s, reason) => {
          if (s === 'ready') sendModule({ type: 'READY', tier: 'wireframe' });
          if (s === 'failed') sendModule({ type: 'FAIL', reason: reason ?? 'unknown' });
        }}
      ></SceneCanvas>
      <VisuallyHidden id="wire-desc">{module.centerpiece.description}</VisuallyHidden>

      <div className="marker-row" role="group" aria-label={t('c.markers')}>
        {VULNERABILITIES.map((v, i) => (
          <button
            key={v.id}
            type="button"
            className="chip marker"
            aria-pressed={active === i}
            data-seen={inspected[v.id] === true}
            onClick={() => choose(i)}
          >
            {v.name}
          </button>
        ))}
        <button
          type="button"
          className="btn btn-ghost"
          onClick={remediate}
          disabled={active === null}
        >
          {t('c.remediate')}
        </button>
      </div>

      <div className="explain glass" role="region" aria-label={t('c.explain')} aria-live="polite">
        {current && (
          <>
            <h3 className="mono sub">{current.name}</h3>
            <p className="prose">{current.summary}</p>
            <h4 className="mono sub">{t('c.mitigation')}</h4>
            <p className="prose">{current.mitigation}</p>
          </>
        )}
      </div>

      <details className="alt glass">
        <summary>{t('alt.summary')}</summary>
        <p className="prose">{module.centerpiece.description}</p>
        <dl className="alt-defs">
          {VULNERABILITIES.map((v) => (
            <div key={v.id}>
              <dt>{v.name}</dt>
              <dd>
                {v.summary} {v.mitigation}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
