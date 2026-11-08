/**
 * The portal's state container: one object, subscribers, and a `dispatch` that runs the pure rules in progress.ts.
 * React reads it with `useProgress`. No library needed.
 */
import { useSyncExternalStore } from 'react';
import { applyEvent, createState, type GameEvent, type PortalState, type Reward } from './progress';
import { clear, importJson, load, pickStorage, save, type LoadStatus, type StorageLike } from './persistence';

let storage: StorageLike;
let persistent = true;
let loadStatus: LoadStatus = 'fresh';
let state: PortalState;
let saveFailed = false;

const listeners = new Set<() => void>();
const rewardListeners = new Set<(rewards: Reward[]) => void>();

function init() {
  const picked = pickStorage();
  storage = picked.storage;
  persistent = picked.persistent;
  const loaded = load(storage, Date.now());
  state = loaded.state;
  loadStatus = loaded.status;
}
init();

const emit = () => listeners.forEach((l) => l());

export const getState = (): PortalState => state;
export const storageInfo = () => ({ persistent, loadStatus, saveFailed });

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function onRewards(fn: (rewards: Reward[]) => void): () => void {
  rewardListeners.add(fn);
  return () => rewardListeners.delete(fn);
}

export function dispatch(ev: GameEvent): Reward[] {
  const result = applyEvent(state, ev, Date.now());
  state = result.state;
  saveFailed = !save(storage, state);
  emit();
  if (result.rewards.length) rewardListeners.forEach((l) => l(result.rewards));
  return result.rewards;
}

/** Wipe everything and start again. The caller must confirm with the player first. */
export function resetAll(): void {
  clear(storage);
  state = createState(Date.now());
  saveFailed = false;
  emit();
}

export function importProgress(text: string): { ok: true } | { ok: false; reason: string } {
  const r = importJson(text, Date.now());
  if (!r.ok) return r;
  state = r.state;
  saveFailed = !save(storage, state);
  emit();
  return { ok: true };
}

export function useProgress<T>(select: (s: PortalState) => T): T {
  const s = useSyncExternalStore(subscribe, getState, getState);
  return select(s);
}
