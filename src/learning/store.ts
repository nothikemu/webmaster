/**
 * The learner's state container: one object, subscribers, and a `dispatch` that runs the pure rules in state.ts.
 * React reads it with `useLearning`. No library needed.
 */
import { useSyncExternalStore } from 'react';
import { applyEvent, createState, type LearningEvent, type LearningState } from './state';
import { clear, importJson, load, pickStorage, save, type LoadStatus, type StorageLike } from './persistence';

let storage: StorageLike;
let persistent = true;
let loadStatus: LoadStatus = 'fresh';
let carried = 0;
let state: LearningState;
let saveFailed = false;

const listeners = new Set<() => void>();

function init() {
  const picked = pickStorage();
  storage = picked.storage;
  persistent = picked.persistent;
  const loaded = load(storage, Date.now());
  state = loaded.state;
  loadStatus = loaded.status;
  carried = loaded.carried;
}
init();

const emit = () => listeners.forEach((l) => l());

export const getState = (): LearningState => state;
export const storageInfo = () => ({ persistent, loadStatus, carried, saveFailed });

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function dispatch(ev: LearningEvent): void {
  const next = applyEvent(state, ev, Date.now());
  if (next === state) return;
  state = next;
  saveFailed = !save(storage, state);
  emit();
}

/** Erase everything this site has stored here, including earlier saves. The caller must confirm with the learner first. */
export function eraseAll(): void {
  clear(storage);
  state = createState();
  saveFailed = false;
  loadStatus = 'fresh';
  carried = 0;
  emit();
}

export function importLearning(text: string): { ok: true; carried: number } | { ok: false; reason: string } {
  const r = importJson(text, Date.now());
  if (!r.ok) return r;
  state = r.state;
  saveFailed = !save(storage, state);
  emit();
  return { ok: true, carried: r.carried };
}

export function useLearning<T>(select: (s: LearningState) => T): T {
  const s = useSyncExternalStore(subscribe, getState, getState);
  return select(s);
}
