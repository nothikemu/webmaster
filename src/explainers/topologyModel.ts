/**
 * The neural topology instrument's model: a tiny feed-forward network with fixed example weights, so a learner can follow one signal
 * through it by hand. Pure functions, no browser APIs.
 */
export const SIZES = [3, 4, 3, 1] as const;
export const LAYER_NAMES = ['Inputs', 'First hidden layer', 'Second hidden layer', 'Output'] as const;
export const UNIT_NAMES: readonly (readonly string[])[] = [
  ['Input 1', 'Input 2', 'Input 3'],
  ['A1', 'A2', 'A3', 'A4'],
  ['B1', 'B2', 'B3'],
  ['Output'],
];

/** weights[l][j][i] is the weight on the connection from unit i of layer l to unit j of layer l + 1. */
export type Weights = number[][][];

export const INITIAL_WEIGHTS: Weights = [
  [
    [0.9, -0.4, 0.3],
    [-0.6, 0.8, 0.5],
    [0.2, 0.7, -0.9],
    [0.5, 0.1, 0.8],
  ],
  [
    [0.8, -0.5, 0.3, 0.6],
    [-0.4, 0.9, 0.7, -0.2],
    [0.6, 0.2, -0.8, 0.5],
  ],
  [[0.9, -0.7, 0.8]],
];

export const DEFAULT_INPUTS: readonly number[] = [0.8, 0.3, 0.6];

export const cloneWeights = (w: Weights): Weights => w.map((layer) => layer.map((row) => [...row]));
export const sigmoid = (z: number): number => 1 / (1 + Math.exp(-z));

export interface Pass {
  /** z[l][j]: the weighted sum arriving at unit j of layer l (layer 0 has none). */
  z: number[][];
  /** a[l][j]: what unit j of layer l passes on. Layer 0 holds the inputs. */
  a: number[][];
}

export function forward(inputs: readonly number[], w: Weights): Pass {
  const a: number[][] = [[...inputs]];
  const z: number[][] = [[]];
  for (let l = 0; l < w.length; l++) {
    const zs = w[l]!.map((row) => row.reduce((sum, wt, i) => sum + wt * a[l]![i]!, 0));
    z.push(zs);
    a.push(zs.map(sigmoid));
  }
  return { z, a };
}

export interface Connection {
  index: number;
  /** The layer it leaves from. */
  l: number;
  from: number;
  to: number;
  label: string;
}

export const CONNECTIONS: readonly Connection[] = (() => {
  const out: Connection[] = [];
  for (let l = 0; l < SIZES.length - 1; l++) {
    for (let j = 0; j < SIZES[l + 1]!; j++) {
      for (let i = 0; i < SIZES[l]!; i++) out.push({ index: out.length, l, from: i, to: j, label: `${UNIT_NAMES[l]![i]} to ${UNIT_NAMES[l + 1]![j]}` });
    }
  }
  return out;
})();

export const weightOf = (w: Weights, c: Connection): number => w[c.l]![c.to]![c.from]!;

export function withWeight(w: Weights, c: Connection, value: number): Weights {
  const next = cloneWeights(w);
  next[c.l]![c.to]![c.from] = value;
  return next;
}

/** One sentence on what a changed weight did to the answer. */
export function describeEffect(c: Connection, was: number, now: number, before: number, after: number): string {
  const delta = after - before;
  const dir = Math.abs(delta) < 0.005 ? 'barely moved' : delta > 0 ? 'rose' : 'fell';
  const sign = now >= 0 ? 'excites' : 'inhibits';
  const stronger = Math.abs(now) > Math.abs(was);
  return `You changed the weight from ${was.toFixed(2)} to ${now.toFixed(2)} on the connection ${c.label}. A ${now >= 0 ? 'positive' : 'negative'} weight ${sign} the unit that receives it, and a ${stronger ? 'bigger' : 'smaller'} size means it listens ${stronger ? 'harder' : 'less'} to that sender. The output ${dir}${dir === 'barely moved' ? '' : ` by ${Math.abs(delta).toFixed(2)}`}, from ${before.toFixed(2)} to ${after.toFixed(2)}. ${c.l < SIZES.length - 2 ? 'The change passes through the later layers too, so its effect is smaller or larger by the time it arrives.' : 'This connection feeds the output directly, so its effect is the most direct one.'}`;
}
