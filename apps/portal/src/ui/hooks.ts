import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ActorRefFrom, AnyActorRef, SnapshotFrom } from 'xstate';
import { levelInfo, overallProgress, recommendNext, type GameEvent, type LevelInfo, type Recommendation } from '../core/gamification';
import { Spring, stepCritical } from '../core/spring';
import { useServices } from '../core/services';
import { useStoreSelector, type PortalStore } from '../core/store';
import type { PersistedState } from '../core/schema';
import type { hubMachine } from '../core/machines/hub';
import { useReducedMotion } from './a11y';

/** Selects from the portal store. Selectors must return primitives or stable references. */
export function usePortal<T>(selector: (s: PortalStore) => T): T {
  const { store } = useServices();
  return useStoreSelector(store, selector);
}

export function useData(): PersistedState {
  return usePortal((s) => s.data);
}

/** Sends a game event through the root actor so guards and announcements run. */
export function useGame(): (event: GameEvent) => void {
  const { actor } = useServices();
  return useCallback((event: GameEvent) => actor.send({ type: 'GAME_EVENT', event }), [actor]);
}

export function useLevel(): LevelInfo {
  const xp = usePortal((s) => s.data.xp);
  return levelInfo(xp);
}

export function useOverall(): number {
  const data = useData();
  return overallProgress(data);
}

export function useRecommendation(): Recommendation {
  const data = useData();
  return recommendNext(data, Date.now());
}

/** Subscribes to any XState actor's snapshot. */
export function useSnapshot<A extends AnyActorRef>(actor: A): SnapshotFrom<A> {
  return useSyncExternalStore(
    (cb) => actor.subscribe(cb).unsubscribe,
    () => actor.getSnapshot() as SnapshotFrom<A>,
    () => actor.getSnapshot() as SnapshotFrom<A>,
  );
}

export function useHub(): ActorRefFrom<typeof hubMachine> {
  const { actor } = useServices();
  return actor.getSnapshot().context.hub;
}

/**
 * Eases a displayed number toward `target` with a critically damped spring driven by the master
 * loop, so counters and rings glide instead of jumping. Reduced motion jumps straight there.
 */
export function useTween(target: number, omega = 9): number {
  const { loop } = useServices();
  const reduced = useReducedMotion();
  const spring = useRef(new Spring(target, omega));
  const [value, setValue] = useState(target);
  useEffect(() => {
    const s = spring.current;
    s.target = target;
    if (reduced) {
      s.set(target);
      setValue(target);
      return undefined;
    }
    const handle = loop.subscribe((f) => {
      // Raw dt (not the simulation clamp) so the counter finishes in wall-clock time at any frame rate.
      stepCritical(s.state, s.target, s.omega, Math.min(f.rawDt, 0.5));
      setValue(s.state.x);
      if (s.settled(0.01)) {
        s.set(target);
        setValue(target);
        handle.setActive(false);
      }
    });
    return () => handle.dispose();
  }, [target, loop, reduced]);
  return value;
}

/** Re-renders at a low rate while `active`, for timers. Uses the master loop, not setInterval. */
export function useClock(active: boolean, everyMs = 250): number {
  const { loop } = useServices();
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    if (!active) return undefined;
    let last = 0;
    const handle = loop.subscribe(() => {
      const t = performance.now();
      if (t - last >= everyMs) {
        last = t;
        setNow(t);
      }
    });
    return () => handle.dispose();
  }, [active, everyMs, loop]);
  return now;
}
