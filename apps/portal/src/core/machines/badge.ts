import { emit, setup } from 'xstate';
import type { ModuleId } from '../../content/types';
import type { BadgeEvent } from './types';

/** A burst that never reports back is forced to finish after this long. */
export const BURST_TIMEOUT_MS = 4500;

/**
 * One badge: locked -> unlocking (particle burst plays) -> unlocked. `SYNC` restores the state
 * from saved progress without replaying the burst.
 */
export function createBadgeMachine(module: ModuleId) {
  return setup({
    types: {
      context: {} as { module: ModuleId },
      events: {} as BadgeEvent,
      emitted: {} as { type: 'burst'; module: ModuleId },
    },
    actions: {
      requestBurst: emit(({ context }) => ({ type: 'burst' as const, module: context.module })),
    },
  }).createMachine({
    id: `badge-${module}`,
    context: { module },
    initial: 'locked',
    states: {
      locked: {
        on: {
          UNLOCK: 'unlocking',
          SYNC: { guard: ({ event }) => event.unlocked, target: 'unlocked' },
        },
      },
      unlocking: {
        entry: 'requestBurst',
        after: { [BURST_TIMEOUT_MS]: 'unlocked' },
        on: { BURST_DONE: 'unlocked', RESET: 'locked' },
      },
      unlocked: {
        on: {
          RESET: 'locked',
          SYNC: { guard: ({ event }) => !event.unlocked, target: 'locked' },
        },
      },
    },
  });
}
