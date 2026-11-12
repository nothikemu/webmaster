/**
 * Where everything stands. x is a position along the room in world units; the floor is at y = 520.
 * Each hotspot names an object that the room's artwork draws at the same x, so what you see is what you can use.
 */
import { FLOOR_Y, LOCATIONS, QUAY_WIDTH, type RoomId, type StationId } from './data';

export type HotspotKind = 'station' | 'relic' | 'door' | 'npc' | 'link' | 'look';
export interface Hotspot {
  id: string;
  kind: HotspotKind;
  x: number;
  /** What a screen reader and the on-screen prompt call it. */
  label: string;
  /** Station id, relic id, room id (door) or route (link). */
  ref?: string;
  /** Spoken or read text for npc and look. */
  lines?: string[];
  /** Optional links offered in a conversation. */
  links?: { label: string; to: string }[];
  /** How close the player must be, in world units. */
  reach?: number;
  /** Height of the marker above the floor. */
  lift?: number;
}
export interface RoomDef {
  id: RoomId;
  width: number;
  spawn: number;
  hotspots: Hotspot[];
}

const exit: Hotspot = { id: 'exit', kind: 'door', x: 120, label: 'The Quay', ref: 'quay', reach: 110, lift: 250 };
const rel = (id: string, x: number, label: string, lift = 200): Hotspot => ({ id: `relic:${id}`, kind: 'relic', x, label, ref: id, reach: 80, lift });
const st = (id: StationId, x: number, label: string): Hotspot => ({ id: `station:${id}`, kind: 'station', x, label, ref: id, reach: 130, lift: 280 });

const doors: Hotspot[] = LOCATIONS.filter((l) => l.id !== 'quay').map((l): Hotspot => ({ id: `door:${l.id}`, kind: 'door', x: l.doorX, label: l.name, ref: l.id, reach: 120, lift: 330 }));

export const ROOMS: Record<RoomId, RoomDef> = {
  quay: {
    id: 'quay',
    width: QUAY_WIDTH,
    spawn: 160,
    hotspots: ([
      rel('chart-corner', 700, 'A torn corner of chart, between two crates', 90),
      ...doors.slice(0, 3),
      rel('lamp-oil', 1380, 'A flask of lamp oil, under the old signal post', 100),
      ...doors.slice(3),
    ] as Hotspot[]).sort((a, b) => a.x - b.x),
  },
  loom: {
    id: 'loom',
    width: 1900,
    spawn: 220,
    hotspots: [
      exit,
      rel('rule-card', 430, 'A card of rules pinned to the loom frame', 300),
      st('cabinet', 780, "The Curator's Cabinet"),
      { id: 'wren', kind: 'npc', x: 1090, label: 'Wren, the weaver', reach: 120, lift: 270, lines: ['A pattern is something you can find in examples. I could write you a rule for every knot, or show you a hundred finished cloths and let you find the pattern yourself.', 'The cabinet teaches you which examples are worth their price. The weight frame shows you what a single neuron really is: three dials and a threshold. Neither one understands moths or threads. That is the lesson.'], links: [{ label: 'Open the Understand AI lessons', to: '/learn/understand' }] },
      rel('thread-weights', 1290, 'Knotted weights hanging from the rafters', 330),
      st('frame', 1540, 'The Weight Frame'),
      rel('test-cloth', 1780, 'A folded test cloth under the bench', 90),
    ],
  },
  foundry: {
    id: 'foundry',
    width: 1900,
    spawn: 220,
    hotspots: [
      exit,
      rel('toolbox-note', 420, "A note tucked in the toolbox lid", 150),
      st('anvil', 740, 'The Anvil Orders'),
      { id: 'brannock', kind: 'npc', x: 1060, label: 'Brannock, the foundry-master', reach: 120, lift: 270, lines: ['Orders pile up faster than I can fill them, and most arrive half said. A request is a tool like any other. Say what to make, what I cannot guess, who it is for, what shape, and within what limits.', 'And I test every weld before it leaves this shop. An answer that sounds right is not a tested answer. Spend your tests where a mistake would hurt most.'], links: [{ label: 'Open the Use AI lessons', to: '/learn/use' }, { label: 'Open the Prompt Lab', to: '/lab' }] },
      rel('five-parts', 1270, 'The five-part mold above the forge', 340),
      st('weld', 1520, 'The Weld Test'),
      rel('cracked-weld', 1780, 'A cracked weld behind the barrels', 90),
    ],
  },
  beacon: {
    id: 'beacon',
    width: 1900,
    spawn: 220,
    hotspots: [
      exit,
      rel('lens', 430, "The keeper's lens, wrapped in cloth", 180),
      st('audit', 760, 'The Fairness Audit'),
      { id: 'sedge', kind: 'npc', x: 1070, label: 'Sedge, the beacon-keeper', reach: 120, lift: 270, lines: ['From up here you can see every coast. A chart drawn from one coast will run every other ship aground. Before you trust a system, ask who it was built from, and who it left out.', 'Nobody tells a screener to be unfair. It finds the pattern in what was done before, and what was done before was not fair. Look at the outcomes, not the code.'], links: [{ label: 'Open the Responsible AI lessons', to: '/learn/responsible' }] },
      rel('forged-letter', 1300, 'A forged letter in the keeper’s desk', 200),
      rel('sealed-log', 1560, 'The sealed log, locked in its chest', 130),
      { id: 'lamp', kind: 'look', x: 1790, label: 'The great lamp', reach: 90, lift: 330, lines: ['The lamp has not been lit for years. Every lesson you finish lights one lantern in the harbor, and when the last is lit, this one answers.'] },
    ],
  },
  archive: {
    id: 'archive',
    width: 1800,
    spawn: 220,
    hotspots: [
      exit,
      rel('first-chess', 440, 'A chess score sheet filed under 1997', 200),
      st('timeline', 850, 'The Timeline of Minds'),
      rel('eliza-slip', 1180, 'An ELIZA transcript between two ledgers', 180),
      rel('gpu-plate', 1450, 'A graphics-chip plate behind glass', 220),
      { id: 'shelves', kind: 'link', x: 1700, label: 'The Codex shelves', ref: '/codex', reach: 100, lift: 300 },
    ],
  },
  hall: {
    id: 'hall',
    width: 1800,
    spawn: 220,
    hotspots: [
      exit,
      { id: 'cases', kind: 'link', x: 520, label: 'The case files: six school situations', ref: '/scenarios', reach: 130, lift: 280 },
      rel('verdict-form', 880, 'A blank verdict form on the judge’s bench', 190),
      rel('consent-slip', 1190, 'A consent slip under the witness stand', 90),
      { id: 'exam', kind: 'link', x: 1560, label: 'The final examination', ref: '/certification', reach: 130, lift: 320 },
    ],
  },
  office: {
    id: 'office',
    width: 1500,
    spawn: 220,
    hotspots: [
      exit,
      { id: 'board', kind: 'link', x: 360, label: 'The mission board', ref: '/missions', reach: 120, lift: 300 },
      rel('kernel-log', 590, "Kernel's first log, pinned beside the board", 220),
      { id: 'logbook', kind: 'link', x: 830, label: 'The logbook', ref: '/logbook', reach: 110, lift: 230 },
      { id: 'codex', kind: 'link', x: 1060, label: 'The Codex', ref: '/codex', reach: 110, lift: 270 },
      { id: 'chart', kind: 'link', x: 1290, label: 'The chart table', ref: '/learn', reach: 120, lift: 240 },
    ],
  },
};

export const FLOOR = FLOOR_Y;
export const hotspotById = (room: RoomId, id: string): Hotspot | undefined => ROOMS[room].hotspots.find((h) => h.id === id);

/** The hotspot nearest to x that is within its own reach, or undefined. */
export function nearest(room: RoomDef, x: number): Hotspot | undefined {
  let best: Hotspot | undefined;
  let bd = Infinity;
  for (const h of room.hotspots) {
    const d = Math.abs(h.x - x);
    if (d <= (h.reach ?? 90) && d < bd) {
      bd = d;
      best = h;
    }
  }
  return best;
}
