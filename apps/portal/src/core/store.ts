/**
 * Zustand store (subscribeWithSelector + a custom persistence middleware). The store holds the
 * persisted progress plus a few session flags. State changes arrive only through `apply`,
 * which runs the pure gamification reducer; nothing polls.
 */
import { createStore, type StateCreator, type StoreMutatorIdentifier } from 'zustand/vanilla';
import { subscribeWithSelector } from 'zustand/middleware';
import { useStore } from 'zustand';
import { applyEvent, levelInfo, overallProgress, recommendNext, type Effect, type GameEvent, type LevelInfo, type Recommendation } from './gamification';
import type { LoadResult, LoadStatus } from './persistence';
import { createInitialState, type PersistedState } from './schema';

export interface PortalState {
  data: PersistedState;
  hydrated: boolean;
  persistent: boolean;
  loadStatus: LoadStatus;
  integrity: 'ok' | 'degraded';
  /** The most recent effects batch and a counter, so UI can react to each new batch once. */
  effects: readonly Effect[];
  effectSeq: number;
}

export interface PortalActions {
  hydrate(result: LoadResult, persistent: boolean): void;
  apply(event: GameEvent, now?: number): Effect[];
  replace(state: PersistedState): void;
  degrade(): void;
}

export type PortalStore = PortalState & PortalActions;

// ---- persistence middleware -------------------------------------------------------------------
export interface PersistOptions {
  /** Signs and writes the state. Errors must be handled inside. */
  save(state: PersistedState): Promise<void> | void;
  delayMs?: number;
}

type PersistShape = { data: PersistedState; hydrated: boolean };

type Persist = <
  T extends PersistShape,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  initializer: StateCreator<T, Mps, Mcs>,
  options: PersistOptions,
) => StateCreator<T, Mps, Mcs>;

/**
 * Wraps `set` so that every change to `data` schedules one debounced write. A write is also
 * forced when the page is hidden or being unloaded, so the last action is never lost.
 */
export const persistProgress: Persist = (initializer, options) => (set, get, api) => {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastSaved: PersistedState | null = null;
  const flush = (): void => {
    if (timer !== null) clearTimeout(timer);
    timer = null;
    const s = get();
    if (!s.hydrated || s.data === lastSaved) return;
    lastSaved = s.data;
    void options.save(s.data);
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) flush();
    });
    addEventListener('pagehide', flush);
  }
  const wrapped = ((...args: unknown[]) => {
    (set as (...a: unknown[]) => void)(...args);
    if (!get().hydrated) return;
    if (timer !== null) clearTimeout(timer);
    timer = setTimeout(flush, options.delayMs ?? 250);
  }) as typeof set;
  return initializer(wrapped, get, api);
};

// ---- store ------------------------------------------------------------------------------------
export function createPortalStore(save: PersistOptions['save']) {
  return createStore<PortalStore>()(
    subscribeWithSelector(
      persistProgress(
        (set, get) => ({
          data: createInitialState(0, '00000000000000000000000000000000'),
          hydrated: false,
          persistent: false,
          loadStatus: 'fresh',
          integrity: 'ok',
          effects: [],
          effectSeq: 0,
          hydrate: (result, persistent) =>
            set({ data: result.state, loadStatus: result.status, persistent, hydrated: true }),
          apply: (event, now = Date.now()) => {
            const prev = get().data;
            const { state, effects } = applyEvent(prev, event, now);
            if (state === prev) return [];
            set((s) => ({ data: state, effects, effectSeq: s.effectSeq + 1 }));
            return effects;
          },
          replace: (state) => set((s) => ({ data: state, effects: [], effectSeq: s.effectSeq + 1 })),
          degrade: () => set({ integrity: 'degraded' }),
        }),
        { save, delayMs: 250 },
      ),
    ),
  );
}

export type PortalStoreApi = ReturnType<typeof createPortalStore>;

// ---- selectors --------------------------------------------------------------------------------
export const selectLevel = (s: PortalStore): LevelInfo => levelInfo(s.data.xp);
export const selectOverall = (s: PortalStore): number => overallProgress(s.data);
export const selectRecommendation = (s: PortalStore): Recommendation => recommendNext(s.data, Date.now());

/** React binding for a store instance. Selectors must return stable (primitive or memoized) values. */
export function useStoreSelector<T>(store: PortalStoreApi, selector: (s: PortalStore) => T): T {
  return useStore(store, selector);
}
