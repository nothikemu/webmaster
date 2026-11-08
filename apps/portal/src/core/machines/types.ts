import type { ModuleId } from '../../content/types';
import type { Effect, GameEvent } from '../gamification';

export type HubEvent =
  | { type: 'TOGGLE' }
  | { type: 'OPEN' }
  | { type: 'CLOSE' }
  | { type: 'ANNOUNCE'; message: string };

export type GamificationEvent =
  | { type: 'GAME_EVENT'; event: GameEvent }
  | { type: 'RESET_REQUEST' }
  | { type: 'RESET_CONFIRM' }
  | { type: 'RESET_CANCEL' }
  | { type: 'INTEGRITY_FAIL' };

export type BadgeEvent =
  | { type: 'UNLOCK' }
  | { type: 'BURST_DONE' }
  | { type: 'SYNC'; unlocked: boolean }
  | { type: 'RESET' };

export type ModuleLifecycleEvent =
  | { type: 'MOUNT' }
  | { type: 'READY'; tier: string }
  | { type: 'FAIL'; reason: string }
  | { type: 'INTERACT' }
  | { type: 'UNMOUNT' };

export type RootEvent =
  | GamificationEvent
  | { type: 'EFFECTS'; effects: readonly Effect[] }
  | { type: 'RESET_DONE' }
  | { type: 'ROUTE_CHANGED'; path: string }
  | { type: 'ANNOUNCE'; message: string }
  | { type: 'HUB'; event: HubEvent }
  | { type: 'MODULE'; module: ModuleId; event: ModuleLifecycleEvent }
  | { type: 'BADGE_SYNC'; unlocked: Readonly<Record<ModuleId, boolean>> }
  | { type: 'BADGE_DONE'; module: ModuleId };
