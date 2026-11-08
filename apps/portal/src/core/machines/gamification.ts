import { assign, enqueueActions, setup } from 'xstate';
import type { Effect, GameEvent } from '../gamification';
import type { GamificationEvent } from './types';

export interface GamificationDeps {
  /** Applies a game event to the store and returns its effects. */
  apply(event: GameEvent): Effect[];
  /** Wipes progress and creates a fresh state. */
  reset(): Promise<void>;
  now(): number;
}

/** Quiz and challenge submissions closer together than this are treated as a double click. */
export const DOUBLE_SUBMIT_MS = 400;

/**
 * Gamification engine orchestration. States: `active` (events flow to the pure reducer),
 * `confirmingReset` (a destructive reset needs an explicit second step) and `locked`
 * (integrity failed, progress is frozen).
 */
export function createGamificationMachine(deps: GamificationDeps) {
  return setup({
    types: {
      context: {} as { lastSubmitAt: number },
      events: {} as GamificationEvent,
    },
    guards: {
      notDoubleSubmit: ({ context, event }) => {
        if (event.type !== 'GAME_EVENT') return true;
        const t = event.event.type;
        if (t !== 'QUIZ_SUBMITTED' && t !== 'CHALLENGE_FINISHED') return true;
        return deps.now() - context.lastSubmitAt > DOUBLE_SUBMIT_MS;
      },
    },
    actions: {
      apply: enqueueActions(({ event, enqueue }) => {
        if (event.type !== 'GAME_EVENT') return;
        const effects = deps.apply(event.event);
        const t = event.event.type;
        if (t === 'QUIZ_SUBMITTED' || t === 'CHALLENGE_FINISHED') enqueue.assign({ lastSubmitAt: deps.now() });
        if (effects.length > 0) enqueue.sendParent({ type: 'EFFECTS', effects });
      }),
      performReset: enqueueActions(({ enqueue }) => {
        enqueue(() => {
          void deps.reset();
        });
        enqueue.sendParent({ type: 'RESET_DONE' });
        enqueue.assign({ lastSubmitAt: 0 });
      }),
      clearSubmit: assign({ lastSubmitAt: () => 0 }),
    },
  }).createMachine({
    id: 'gamification',
    context: { lastSubmitAt: 0 },
    initial: 'active',
    on: { INTEGRITY_FAIL: '.locked' },
    states: {
      active: {
        on: {
          GAME_EVENT: { guard: 'notDoubleSubmit', actions: 'apply' },
          RESET_REQUEST: 'confirmingReset',
        },
      },
      confirmingReset: {
        on: {
          RESET_CONFIRM: { target: 'active', actions: 'performReset' },
          RESET_CANCEL: 'active',
        },
      },
      locked: {
        entry: 'clearSubmit',
        type: 'final',
      },
    },
  });
}
