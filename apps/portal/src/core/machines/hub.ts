import { assign, setup } from 'xstate';
import { announce } from '../announce';
import type { HubEvent } from './types';

export const HUB_TOGGLE_ID = 'hub-toggle';

/** Telemetry hub: collapsed or expanded, plus the latest polite announcement. */
export const hubMachine = setup({
  types: {
    context: {} as { announcement: string; openedAt: number | null },
    events: {} as HubEvent,
  },
  actions: {
    remember: assign({ announcement: ({ event }) => (event.type === 'ANNOUNCE' ? event.message : '') }),
    speak: ({ event }) => {
      if (event.type === 'ANNOUNCE') announce(event.message);
    },
    markOpened: assign({ openedAt: () => Date.now() }),
    clearOpened: assign({ openedAt: () => null }),
    restoreFocus: () => {
      if (typeof document === 'undefined') return;
      const toggle = document.getElementById(HUB_TOGGLE_ID);
      const active = document.activeElement;
      // Return focus to the toggle only when focus was inside the panel that is closing.
      if (toggle && (active === document.body || active?.closest('[data-hub-panel]'))) toggle.focus();
    },
  },
}).createMachine({
  id: 'hub',
  context: { announcement: '', openedAt: null },
  initial: 'collapsed',
  on: { ANNOUNCE: { actions: ['remember', 'speak'] } },
  states: {
    collapsed: {
      on: { TOGGLE: 'expanded', OPEN: 'expanded' },
    },
    expanded: {
      entry: 'markOpened',
      exit: ['clearOpened', 'restoreFocus'],
      on: { TOGGLE: 'collapsed', CLOSE: 'collapsed' },
    },
  },
});
