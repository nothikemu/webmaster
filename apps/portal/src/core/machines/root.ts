import { assign, enqueueActions, sendTo, setup, type ActorRefFrom } from 'xstate';
import { MODULE_IDS, type ModuleId } from '../../content/types';
import type { Effect } from '../gamification';
import { createBadgeMachine } from './badge';
import { createGamificationMachine, type GamificationDeps } from './gamification';
import { hubMachine } from './hub';
import { createModuleMachine } from './module';
import type { RootEvent } from './types';

const badgeFoundations = createBadgeMachine('foundations');
const badgeSynthesis = createBadgeMachine('synthesis');
const badgeEthics = createBadgeMachine('ethics');
const moduleFoundations = createModuleMachine('foundations');
const moduleSynthesis = createModuleMachine('synthesis');
const moduleEthics = createModuleMachine('ethics');

/** Turns an effects batch into one short, readable announcement. */
export function describeEffects(effects: readonly Effect[]): string {
  const parts: string[] = [];
  let xp = 0;
  for (const fx of effects) {
    if (fx.type === 'xp') xp += fx.amount;
    else if (fx.type === 'level') parts.push(`Level ${fx.level}, ${fx.name}`);
    else if (fx.type === 'badge') parts.push('Badge unlocked');
    else if (fx.type === 'streak' && fx.days > 1) parts.push(`${fx.days} day streak`);
  }
  if (xp > 0) parts.unshift(`${xp} XP`);
  return parts.join('. ');
}

export function createRootMachine(deps: GamificationDeps) {
  const gamification = createGamificationMachine(deps);
  return setup({
    types: {
      context: {} as {
        path: string;
        hub: ActorRefFrom<typeof hubMachine>;
        game: ActorRefFrom<typeof gamification>;
        badges: Record<ModuleId, ActorRefFrom<typeof badgeFoundations>>;
        modules: Record<ModuleId, ActorRefFrom<typeof moduleFoundations>>;
      },
      events: {} as RootEvent,
    },
    actors: {
      hub: hubMachine,
      gamification,
      badgeFoundations,
      badgeSynthesis,
      badgeEthics,
      moduleFoundations,
      moduleSynthesis,
      moduleEthics,
    },
    actions: {
      route: assign({ path: ({ event }) => (event.type === 'ROUTE_CHANGED' ? event.path : '/') }),
      fanOutEffects: enqueueActions(({ event, context, enqueue }) => {
        if (event.type !== 'EFFECTS') return;
        const message = describeEffects(event.effects);
        if (message) enqueue.sendTo(context.hub, { type: 'ANNOUNCE', message });
        for (const fx of event.effects) {
          if (fx.type === 'badge') enqueue.sendTo(context.badges[fx.module], { type: 'UNLOCK' });
        }
      }),
      syncBadges: enqueueActions(({ event, context, enqueue }) => {
        if (event.type !== 'BADGE_SYNC') return;
        for (const id of MODULE_IDS) enqueue.sendTo(context.badges[id], { type: 'SYNC', unlocked: event.unlocked[id] });
      }),
      resetBadges: enqueueActions(({ context, enqueue }) => {
        for (const id of MODULE_IDS) enqueue.sendTo(context.badges[id], { type: 'RESET' });
        enqueue.sendTo(context.hub, { type: 'ANNOUNCE', message: 'Progress reset' });
      }),
      forwardGame: sendTo(({ context }) => context.game, ({ event }) => event as never),
      forwardHub: sendTo(({ context }) => context.hub, ({ event }) => (event.type === 'HUB' ? event.event : { type: 'CLOSE' as const })),
      announce: sendTo(({ context }) => context.hub, ({ event }) => (event.type === 'ANNOUNCE' ? event : { type: 'CLOSE' as const })),
      forwardModule: enqueueActions(({ event, context, enqueue }) => {
        if (event.type !== 'MODULE') return;
        enqueue.sendTo(context.modules[event.module], event.event);
      }),
      badgeDone: enqueueActions(({ event, context, enqueue }) => {
        if (event.type !== 'BADGE_DONE') return;
        enqueue.sendTo(context.badges[event.module], { type: 'BURST_DONE' });
      }),
    },
  }).createMachine({
    id: 'portal',
    context: ({ spawn }) => ({
      path: '/',
      hub: spawn('hub', { id: 'hub' }),
      game: spawn('gamification', { id: 'game' }),
      badges: {
        foundations: spawn('badgeFoundations', { id: 'badge-foundations' }),
        synthesis: spawn('badgeSynthesis', { id: 'badge-synthesis' }),
        ethics: spawn('badgeEthics', { id: 'badge-ethics' }),
      },
      modules: {
        foundations: spawn('moduleFoundations', { id: 'module-foundations' }),
        synthesis: spawn('moduleSynthesis', { id: 'module-synthesis' }),
        ethics: spawn('moduleEthics', { id: 'module-ethics' }),
      },
    }),
    on: {
      ROUTE_CHANGED: { actions: 'route' },
      GAME_EVENT: { actions: 'forwardGame' },
      RESET_REQUEST: { actions: 'forwardGame' },
      RESET_CONFIRM: { actions: 'forwardGame' },
      RESET_CANCEL: { actions: 'forwardGame' },
      INTEGRITY_FAIL: { actions: 'forwardGame' },
      EFFECTS: { actions: 'fanOutEffects' },
      RESET_DONE: { actions: 'resetBadges' },
      BADGE_SYNC: { actions: 'syncBadges' },
      BADGE_DONE: { actions: 'badgeDone' },
      HUB: { actions: 'forwardHub' },
      ANNOUNCE: { actions: 'announce' },
      MODULE: { actions: 'forwardModule' },
    },
  });
}

export type RootMachine = ReturnType<typeof createRootMachine>;
