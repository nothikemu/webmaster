import { TsSim } from '../../gpu/sim/tsSim';
import type { SimMode } from '../../gpu/sim/types';
import { INFLUENCE_RADIUS } from './SwarmScene';
import { generateTopology } from './topology';

export interface ModeInfo {
  id: 'deflect' | 'attract' | 'orbit';
  mode: SimMode;
  label: string;
  key: string;
  action: string;
  strength: number;
  blurb: string;
}

export const MODES: readonly ModeInfo[] = [
  { id: 'deflect', mode: 0, label: 'Deflect', key: '1', action: 'mode-deflect', strength: 26, blurb: 'Particles inside the influence radius are pushed away from the pointer.' },
  { id: 'attract', mode: 1, label: 'Attract', key: '2', action: 'mode-attract', strength: 30, blurb: 'Particles are pulled toward the pointer and damped as they arrive.' },
  { id: 'orbit', mode: 2, label: 'Orbit', key: '3', action: 'mode-orbit', strength: 30, blurb: 'Particles swirl around the pointer while drifting slightly inward.' },
];

const SAMPLE = 3000;
const HOLD_STEPS = 90;
const RELEASE_STEPS = 120;
const DT = 1 / 60;

/**
 * Runs the real TypeScript kernel on a 3,000-particle network and describes the result in words
 * and numbers: the non-visual equivalent of moving the pointer through the field.
 */
export function describeMode(info: ModeInfo): string {
  const topo = generateTopology(SAMPLE);
  const sim = new TsSim(topo.rest, topo.phase);
  const pointer = { x: 0, y: 0, z: 0, radius: INFLUENCE_RADIUS, strength: info.strength, mode: info.mode };
  for (let i = 0; i < HOLD_STEPS; i++) sim.step({ dt: DT, time: i * DT, pointer });
  let moved = 0;
  let radialChange = 0;
  for (let k = 0; k < SAMPLE; k++) {
    const dx = sim.positions[k * 3]! - topo.rest[k * 3]!;
    const dy = sim.positions[k * 3 + 1]! - topo.rest[k * 3 + 1]!;
    const dz = sim.positions[k * 3 + 2]! - topo.rest[k * 3 + 2]!;
    if (Math.hypot(dx, dy, dz) > 0.2) {
      moved++;
      radialChange += Math.hypot(sim.positions[k * 3]!, sim.positions[k * 3 + 1]!) - Math.hypot(topo.rest[k * 3]!, topo.rest[k * 3 + 1]!);
    }
  }
  const idle = { ...pointer, strength: 0 };
  for (let i = 0; i < RELEASE_STEPS; i++) sim.step({ dt: DT, time: (HOLD_STEPS + i) * DT, pointer: idle });
  let home = 0;
  for (let k = 0; k < SAMPLE; k++) {
    const d = Math.hypot(sim.positions[k * 3]! - topo.rest[k * 3]!, sim.positions[k * 3 + 1]! - topo.rest[k * 3 + 1]!, sim.positions[k * 3 + 2]! - topo.rest[k * 3 + 2]!);
    if (d < 0.1) home++;
  }
  const direction = moved === 0 ? 'no net radial change' : radialChange / moved >= 0 ? `${(radialChange / moved).toFixed(2)} units farther from the centre on average` : `${Math.abs(radialChange / moved).toFixed(2)} units closer to the centre on average`;
  return `${info.label}: ${info.blurb} In a measured run on ${SAMPLE.toLocaleString('en-US')} particles, the pointer held for 1.5 seconds moved ${moved.toLocaleString('en-US')} of them more than 0.2 units from rest, ${direction}. Two seconds after release, ${Math.round((home / SAMPLE) * 100)} percent were back within 0.1 units of their layered position.`;
}
