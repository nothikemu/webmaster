/**
 * Where everything stands in the 3D world, in metres. Pure data, so the tests can check it.
 *
 * Outdoors ("quay"): a plaza of radius 40 centred on the origin. Six buildings stand on an arc to the north (negative z), their doors
 * facing the middle. The south edge of the plaza is a quay wall at z = 36 with the sea beyond it. The player starts at the south.
 * Indoors: each building is a room centred on the origin with its entrance in the south wall (positive z).
 */
import type { RoomId } from '@/game/data';
import { LOCATIONS, RELICS, STATIONS } from '@/game/data';
import type { HotspotKind } from '@/game/rooms';

export const PLAZA_R = 40;
export const FACADE_R = 44;
export const BUILD_DEPTH = 12;
export const QUAY_Z = 36;
export const WALK_R = 53;
export const START: { x: number; z: number; ry: number } = { x: 0, z: 23, ry: Math.PI };

export type BuildingId = Exclude<RoomId, 'quay'>;
export const ANGLES: Record<BuildingId, number> = { loom: -65, foundry: -39, archive: -13, hall: 13, office: 39, beacon: 65 };

const rad = (d: number) => (d * Math.PI) / 180;
/** Position on the arc at angle a (degrees from north, clockwise) and radius r. */
export const onArc = (a: number, r: number): { x: number; z: number } => ({ x: r * Math.sin(rad(a)), z: -r * Math.cos(rad(a)) });

export function building(id: BuildingId): { x: number; z: number; ry: number; w: number } {
  const a = ANGLES[id];
  const p = onArc(a, FACADE_R + BUILD_DEPTH / 2);
  return { ...p, ry: -rad(a), w: id === 'hall' ? 20 : id === 'archive' ? 18 : id === 'beacon' ? 12 : 16 };
}
/** The spot in front of a building's door where the player stands to go in, and where they come out. */
export const doorFront = (id: BuildingId, r = 41.2): { x: number; z: number; ry: number } => ({ ...onArc(ANGLES[id], r), ry: -rad(ANGLES[id]) });

export const INTERIOR: Record<BuildingId, { w: number; d: number; h: number }> = {
  loom: { w: 26, d: 18, h: 8 },
  foundry: { w: 26, d: 18, h: 8 },
  beacon: { w: 24, d: 20, h: 9 },
  archive: { w: 28, d: 20, h: 10 },
  hall: { w: 28, d: 20, h: 10 },
  office: { w: 20, d: 16, h: 7 },
};
export const interiorSpawn = (id: BuildingId): { x: number; z: number; ry: number } => ({ x: 0, z: INTERIOR[id].d / 2 - 4.4, ry: Math.PI });

export interface Spot {
  id: string;
  kind: HotspotKind;
  ref?: string;
  label: string;
  x: number;
  z: number;
  /** Height of the marker above the floor. */
  y: number;
  reach: number;
  lines?: string[];
  links?: { label: string; to: string }[];
}

const exitSpot = (id: BuildingId): Spot => ({ id: 'exit', kind: 'door', ref: 'quay', label: 'The Quay', x: 0, z: INTERIOR[id].d / 2 - 0.9, y: 3.1, reach: 2.4 });
const relic = (id: string, x: number, z: number, y: number, label: string): Spot => ({ id: `relic:${id}`, kind: 'relic', ref: id, label, x, z, y, reach: 2.2 });
const station = (id: string, x: number, z: number, y: number, label: string): Spot => ({ id: `station:${id}`, kind: 'station', ref: id, label, x, z, y, reach: 3 });

export const SPOTS: Record<RoomId, Spot[]> = {
  quay: [
    ...LOCATIONS.filter((l) => l.id !== 'quay').map((l): Spot => ({ id: `door:${l.id}`, kind: 'door', ref: l.id, label: l.name, ...onArc(ANGLES[l.id as BuildingId], 40.2), y: 3.3, reach: 3.4 })),
    relic('chart-corner', -17.5, 30.5, 1.6, 'A torn corner of chart, between two crates'),
    relic('lamp-oil', 21, 25, 2.6, 'A flask of lamp oil, under the old signal post'),
    { id: 'tower', kind: 'look', label: 'The Lantern Tower', x: 0, z: 0, y: 7.5, reach: 5.2, lines: ['Fifteen lamps stand around the plaza, one for each lesson. Finish a lesson and its lamp is lit, and the Lantern Tower burns brighter.', 'The three keepers each watch over five. Wren has the first five, Brannock the next, and Sedge the last.'] },
  ],
  loom: [
    exitSpot('loom'),
    relic('rule-card', -6, -7, 2.6, 'A card of rules pinned to the loom frame'),
    station('cabinet', -10, -1, 2.6, "The Curator's Cabinet"),
    { id: 'wren', kind: 'npc', label: 'Wren, the weaver', x: 0, z: -3.2, y: 3, reach: 3, lines: ['A pattern is something you can find in examples. I could write you a rule for every knot, or show you a hundred finished cloths and let you find the pattern yourself.', 'The cabinet teaches you which examples are worth their price. The weight frame shows you what a single neuron really is: three dials and a threshold. Neither one understands moths or threads. That is the lesson.'], links: [{ label: 'Open the Understand AI lessons', to: '/learn/understand' }] },
    relic('thread-weights', 5, -4.5, 3.4, 'Knotted weights hanging from the rafters'),
    station('frame', 10, -1, 2.6, 'The Weight Frame'),
    relic('test-cloth', 9.2, 5, 1.2, 'A folded test cloth under the bench'),
  ],
  foundry: [
    exitSpot('foundry'),
    relic('toolbox-note', -9.5, 4.5, 1.4, 'A note tucked in the toolbox lid'),
    station('anvil', -9, -3, 2.6, 'The Anvil Orders'),
    { id: 'brannock', kind: 'npc', label: 'Brannock, the foundry-master', x: -0.5, z: -3.2, y: 3, reach: 3, lines: ['Orders pile up faster than I can fill them, and most arrive half said. A request is a tool like any other. Say what to make, what I cannot guess, who it is for, what shape, and within what limits.', 'And I test every weld before it leaves this shop. An answer that sounds right is not a tested answer. Spend your tests where a mistake would hurt most.'], links: [{ label: 'Open the Use AI lessons', to: '/learn/use' }, { label: 'Open the Prompt Lab', to: '/lab' }] },
    relic('five-parts', 6, -7.2, 3.4, 'The five-part mold above the forge'),
    station('weld', 10, 0.5, 2.6, 'The Weld Test'),
    relic('cracked-weld', 10.5, 5.8, 1.6, 'A cracked weld behind the barrels'),
  ],
  beacon: [
    exitSpot('beacon'),
    relic('lens', -9.5, 3, 1.8, "The keeper's lens, wrapped in cloth"),
    station('audit', -6, -3.5, 3, 'The Fairness Audit'),
    { id: 'sedge', kind: 'npc', label: 'Sedge, the beacon-keeper', x: 1.5, z: -5, y: 3.2, reach: 3, lines: ['From up here you can see every coast. A chart drawn from one coast will run every other ship aground. Before you trust a system, ask who it was built from, and who it left out.', 'Nobody tells a screener to be unfair. It finds the pattern in what was done before, and what was done before was not fair. Look at the outcomes, not the code.'], links: [{ label: 'Open the Responsible AI lessons', to: '/learn/responsible' }] },
    relic('forged-letter', 7, -3.5, 2.2, "A forged letter in the keeper's desk"),
    relic('sealed-log', 9.5, 3.5, 1.6, 'The sealed log, locked in its chest'),
    { id: 'lamp', kind: 'look', label: 'The great lamp', x: 0, z: -9, y: 4.6, reach: 3, lines: ['The lamp has not been lit for years. Every lesson you finish lights one lantern in the harbor, and when the last is lit, this one answers.'] },
  ],
  archive: [
    exitSpot('archive'),
    relic('first-chess', -11, -4, 2.6, 'A chess score sheet filed under 1997'),
    station('timeline', 0, -2.5, 2.6, 'The Timeline of Minds'),
    relic('eliza-slip', -4, -8.4, 3, 'An ELIZA transcript between two ledgers'),
    relic('gpu-plate', 9.5, -5, 2.6, 'A graphics-chip plate behind glass'),
    { id: 'shelves', kind: 'link', ref: '/codex', label: 'The Codex shelves', x: 11.5, z: 4, y: 3.4, reach: 3 },
  ],
  hall: [
    exitSpot('hall'),
    { id: 'cases', kind: 'link', ref: '/scenarios', label: 'The case files: six school situations', x: -9, z: -8, y: 3.4, reach: 3.2 },
    relic('verdict-form', 0, -5.5, 2.8, "A blank verdict form on the judge's bench"),
    relic('consent-slip', 6, -1, 1.2, 'A consent slip under the witness stand'),
    { id: 'exam', kind: 'link', ref: '/certification', label: 'The final examination', x: 10, z: -8.6, y: 3.8, reach: 3.2 },
  ],
  office: [
    exitSpot('office'),
    { id: 'board', kind: 'link', ref: '/missions', label: 'The mission board', x: -6, z: -6.4, y: 3.2, reach: 3 },
    relic('kernel-log', -2.4, -6.6, 2.8, "Kernel's first log, pinned beside the board"),
    { id: 'logbook', kind: 'link', ref: '/logbook', label: 'The logbook', x: 1.5, z: -3, y: 2.6, reach: 2.6 },
    { id: 'codex', kind: 'link', ref: '/codex', label: 'The Codex', x: 6, z: -5.8, y: 3, reach: 3 },
    { id: 'chart', kind: 'link', ref: '/learn', label: 'The chart table', x: 6, z: 2, y: 2, reach: 2.8 },
  ],
};

export function nearestSpot(room: RoomId, x: number, z: number): Spot | undefined {
  let best: Spot | undefined;
  let bd = Infinity;
  for (const s of SPOTS[room]) {
    const d = Math.hypot(s.x - x, s.z - z);
    if (d <= s.reach && d < bd) {
      bd = d;
      best = s;
    }
  }
  return best;
}

/** Which lamp (0 to 14) belongs to which lesson, left to right around the plaza. */
export const LAMP_COUNT = 15;
export function lampPos(i: number): { x: number; z: number } {
  const a = -150 + (300 / (LAMP_COUNT - 1)) * i;
  return onArc(a, 33.5);
}

export const stationCount = STATIONS.length;
export const relicCount = RELICS.length;
