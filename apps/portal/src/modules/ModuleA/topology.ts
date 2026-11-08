import { rng } from '../../core/burst';
import type { Kernels } from '../../core/wasm';

/**
 * Rest layout for the Module A swarm: five layers of neuron clusters joined by beaded threads.
 * Deterministic for a given particle count, so every compute backend starts from identical data.
 */
export interface Topology {
  count: number;
  /** xyz triples. */
  rest: Float32Array;
  /** One ambient-drift phase per particle. */
  phase: Float32Array;
  /** Neighbour search radius used to build links. */
  linkRadius: number;
}

export interface LinkGeometry {
  /** [a0, b0, a1, b1, ...] particle indices. */
  edges: Uint32Array;
  /** Per-edge base opacity from the rest distance (closer neighbours are brighter). */
  base: Float32Array;
  /** Per-edge position along the network in [0, 1], used for colour. */
  t: Float32Array;
}

export const LAYER_X = [-2.2, -1.1, 0, 1.1, 2.2] as const;
export const NODES_PER_LAYER = [10, 8, 7, 8, 4] as const;
const FAN_OUT = [3, 3, 3, 2] as const;
const CLUSTER_SHARE = 0.36;
const CLUSTER_SIGMA = 0.095;
const THREAD_JITTER = 0.0035;
export const LINK_NEIGHBOURS = 2;
export const SEED = 20262027;

interface Node {
  x: number;
  y: number;
  z: number;
}

export function generateTopology(count: number, seed = SEED): Topology {
  const rand = rng(seed);
  const gauss = (): number => (rand() + rand() + rand() - 1.5) / 1.5;

  const layers: Node[][] = LAYER_X.map((x, l) => {
    const m: number = NODES_PER_LAYER[l]!;
    return Array.from({ length: m }, (_, i) => ({
      x,
      y: m === 1 ? 0 : -1.3 + (2.6 * i) / (m - 1),
      z: (rand() - 0.5) * 1.1,
    }));
  });
  const nodes = layers.flat();

  const threads: Array<[Node, Node]> = [];
  for (let l = 0; l < layers.length - 1; l++) {
    const from = layers[l]!;
    const to = layers[l + 1]!;
    for (let i = 0; i < from.length; i++) {
      const a = from[i]!;
      const ranked = [...to].sort((p, q) => Math.abs(p.y - a.y) - Math.abs(q.y - a.y));
      for (const b of ranked.slice(0, FAN_OUT[l]!)) threads.push([a, b]);
    }
  }

  const clusterTotal = Math.round(count * CLUSTER_SHARE);
  const perCluster = Math.floor(clusterTotal / nodes.length);
  const threadTotal = count - perCluster * nodes.length;
  const perThread = Math.floor(threadTotal / threads.length);
  const rest = new Float32Array(count * 3);
  let k = 0;
  const put = (x: number, y: number, z: number): void => {
    rest[k * 3] = x;
    rest[k * 3 + 1] = y;
    rest[k * 3 + 2] = z;
    k++;
  };

  for (const n of nodes) {
    for (let i = 0; i < perCluster; i++) put(n.x + gauss() * CLUSTER_SIGMA, n.y + gauss() * CLUSTER_SIGMA, n.z + gauss() * CLUSTER_SIGMA);
  }
  for (const [a, b] of threads) {
    for (let i = 0; i < perThread; i++) {
      const t = (i + 0.5 + (rand() - 0.5) * 0.4) / perThread;
      put(
        a.x + (b.x - a.x) * t + gauss() * THREAD_JITTER,
        a.y + (b.y - a.y) * t + gauss() * THREAD_JITTER,
        a.z + (b.z - a.z) * t + gauss() * THREAD_JITTER,
      );
    }
  }
  // Rounding leftovers join random threads so the count is exact.
  while (k < count) {
    const [a, b] = threads[Math.floor(rand() * threads.length)]!;
    const t = rand();
    put(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, a.z + (b.z - a.z) * t);
  }

  const phase = new Float32Array(count);
  const prand = rng(seed ^ 0x9e3779b9);
  for (let i = 0; i < count; i++) phase[i] = prand() * Math.PI * 2;

  const threadSpacing = 1.15 / Math.max(1, perThread);
  return { count, rest, phase, linkRadius: Math.max(0.07, threadSpacing * 2.3) };
}

/** Per-particle value in [0, 1) that varies size and brightness. Deterministic, no RNG state. */
export function particleSeeds(count: number): Float32Array {
  const seeds = new Float32Array(count);
  for (let i = 0; i < count; i++) seeds[i] = (((i * 2654435761) >>> 0) % 1000) / 1000;
  return seeds;
}

/** Builds neighbour links through the kernel (WASM or TypeScript) and derives per-edge attributes. */
export function buildLinks(topology: Topology, kernels: Kernels): LinkGeometry {
  const edges = kernels.buildNeighborGraph(topology.rest, LINK_NEIGHBOURS, topology.linkRadius);
  const n = edges.length / 2;
  const base = new Float32Array(n);
  const t = new Float32Array(n);
  const r = topology.rest;
  for (let e = 0; e < n; e++) {
    const i = edges[e * 2]! * 3;
    const j = edges[e * 2 + 1]! * 3;
    const dx = r[i]! - r[j]!;
    const dy = r[i + 1]! - r[j + 1]!;
    const dz = r[i + 2]! - r[j + 2]!;
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    base[e] = Math.max(0.12, Math.pow(1 - Math.min(1, d / topology.linkRadius), 1.1));
    t[e] = Math.min(1, Math.max(0, ((r[i]! + r[j]!) / 2 + 2.4) / 4.8));
  }
  return { edges, base, t };
}
