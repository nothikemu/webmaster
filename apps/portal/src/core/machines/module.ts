import { assign, setup } from 'xstate';
import type { ModuleId } from '../../content/types';
import type { ModuleLifecycleEvent } from './types';

/** Time an `interacting` state lingers after the last interaction. */
export const INTERACTION_LINGER_MS = 1200;

/**
 * Lifecycle of a module's centerpiece: idle -> loading -> ready <-> interacting, or `fallback`
 * when the 3D scene could not start (the text alternative stays fully usable).
 */
export function createModuleMachine(module: ModuleId) {
  return setup({
    types: {
      context: {} as { module: ModuleId; tier: string | null; reason: string | null; interactions: number },
      events: {} as ModuleLifecycleEvent,
    },
    actions: {
      setTier: assign({ tier: ({ event }) => (event.type === 'READY' ? event.tier : null), reason: () => null }),
      setReason: assign({ reason: ({ event }) => (event.type === 'FAIL' ? event.reason : null) }),
      countInteraction: assign({ interactions: ({ context }) => context.interactions + 1 }),
      release: assign({ tier: () => null, reason: () => null }),
    },
  }).createMachine({
    id: `module-${module}`,
    context: { module, tier: null, reason: null, interactions: 0 },
    initial: 'idle',
    on: { UNMOUNT: { target: '.idle', actions: 'release' } },
    states: {
      idle: { on: { MOUNT: 'loading' } },
      loading: {
        on: {
          READY: { target: 'ready', actions: 'setTier' },
          FAIL: { target: 'fallback', actions: 'setReason' },
        },
      },
      ready: {
        on: { INTERACT: { target: 'interacting', actions: 'countInteraction' }, FAIL: { target: 'fallback', actions: 'setReason' } },
      },
      interacting: {
        after: { [INTERACTION_LINGER_MS]: 'ready' },
        on: { INTERACT: { target: 'interacting', reenter: true, actions: 'countInteraction' } },
      },
      fallback: { on: { MOUNT: 'loading' } },
    },
  });
}
