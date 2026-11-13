/**
 * Route planning for the guide path: a small grid A* over the same colliders the player collides with, then straightened so the
 * chevrons make clean runs instead of a staircase. Pure, so it is tested without a renderer.
 */
import type { Collider } from './world';

export interface Pt {
  x: number;
  z: number;
}

/** True if a body of radius r standing at (x, z) would be inside a collider. */
export function blockedAt(x: number, z: number, cols: readonly Collider[], r: number): boolean {
  for (const c of cols) {
    if (c.circle) {
      if (Math.hypot(x - c.x, z - c.z) < c.hx + r) return true;
      continue;
    }
    const cos = Math.cos(-c.rot);
    const sin = Math.sin(-c.rot);
    const dx = x - c.x;
    const dz = z - c.z;
    const lx = dx * cos - dz * sin;
    const lz = dx * sin + dz * cos;
    if (Math.abs(lx) < c.hx + r && Math.abs(lz) < c.hz + r) return true;
  }
  return false;
}

const CELL = 1.1;

/** A route from `from` to `to`, as points; empty if there is none. The first point is `from` and the last is `to` (or the nearest reachable spot). */
export function planRoute(from: Pt, to: Pt, cols: readonly Collider[], inside: (x: number, z: number) => boolean, r = 0.6): Pt[] {
  const pad = 14;
  const minX = Math.min(from.x, to.x) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const minZ = Math.min(from.z, to.z) - pad;
  const maxZ = Math.max(from.z, to.z) + pad;
  const W = Math.max(2, Math.ceil((maxX - minX) / CELL) + 1);
  const H = Math.max(2, Math.ceil((maxZ - minZ) / CELL) + 1);
  const wx = (i: number) => minX + i * CELL;
  const wz = (j: number) => minZ + j * CELL;
  const blocked = new Uint8Array(W * H);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      const x = wx(i);
      const z = wz(j);
      if (!inside(x, z) || blockedAt(x, z, cols, r)) blocked[j * W + i] = 1;
    }
  }
  const cellOf = (p: Pt) => ({ i: Math.max(0, Math.min(W - 1, Math.round((p.x - minX) / CELL))), j: Math.max(0, Math.min(H - 1, Math.round((p.z - minZ) / CELL))) });
  // if the start or the goal sits in a blocked cell (a station inside its own furniture), use the nearest free cell
  const free = (c: { i: number; j: number }) => {
    if (!blocked[c.j * W + c.i]) return c;
    for (let ring = 1; ring < 8; ring++) {
      let best: { i: number; j: number } | null = null;
      let bd = Infinity;
      for (let dj = -ring; dj <= ring; dj++) {
        for (let di = -ring; di <= ring; di++) {
          if (Math.max(Math.abs(di), Math.abs(dj)) !== ring) continue;
          const i = c.i + di;
          const j = c.j + dj;
          if (i < 0 || j < 0 || i >= W || j >= H || blocked[j * W + i]) continue;
          const d = di * di + dj * dj;
          if (d < bd) {
            bd = d;
            best = { i, j };
          }
        }
      }
      if (best) return best;
    }
    return null;
  };
  const s = free(cellOf(from));
  const g = free(cellOf(to));
  if (!s || !g) return [];

  const N = W * H;
  const gScore = new Float32Array(N).fill(Infinity);
  const came = new Int32Array(N).fill(-1);
  const closed = new Uint8Array(N);
  // a binary heap of [f, index]
  const heap: [number, number][] = [];
  const push = (f: number, idx: number) => {
    heap.push([f, idx]);
    let k = heap.length - 1;
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (heap[p]![0] <= heap[k]![0]) break;
      [heap[p], heap[k]] = [heap[k]!, heap[p]!];
      k = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0]!;
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const rr = l + 1;
        let m = k;
        if (l < heap.length && heap[l]![0] < heap[m]![0]) m = l;
        if (rr < heap.length && heap[rr]![0] < heap[m]![0]) m = rr;
        if (m === k) break;
        [heap[m], heap[k]] = [heap[k]!, heap[m]!];
        k = m;
      }
    }
    return top;
  };
  const h = (i: number, j: number) => Math.hypot(i - g.i, j - g.j);
  const si = s.j * W + s.i;
  gScore[si] = 0;
  push(h(s.i, s.j), si);
  const goal = g.j * W + g.i;
  while (heap.length) {
    const [, cur] = pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === goal) break;
    const ci = cur % W;
    const cj = (cur / W) | 0;
    for (let dj = -1; dj <= 1; dj++) {
      for (let di = -1; di <= 1; di++) {
        if (!di && !dj) continue;
        const i = ci + di;
        const j = cj + dj;
        if (i < 0 || j < 0 || i >= W || j >= H) continue;
        const n = j * W + i;
        if (blocked[n] || closed[n]) continue;
        // no cutting corners between two blocked cells
        if (di && dj && (blocked[cj * W + i] || blocked[j * W + ci])) continue;
        const t = gScore[cur]! + (di && dj ? 1.4142 : 1);
        if (t < gScore[n]!) {
          gScore[n] = t;
          came[n] = cur;
          push(t + h(i, j), n);
        }
      }
    }
  }
  if (!closed[goal]) return [];
  const cells: Pt[] = [];
  for (let k = goal; k !== -1; k = came[k]!) cells.push({ x: wx(k % W), z: wz((k / W) | 0) });
  cells.reverse();
  cells[0] = { x: from.x, z: from.z };
  cells[cells.length - 1] = { x: wx(g.i), z: wz(g.j) };

  // string pulling: keep a point only when the straight line to the one after it would hit something
  const clear = (a: Pt, b: Pt) => {
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    const n = Math.max(1, Math.ceil(len / 0.4));
    for (let k = 1; k < n; k++) {
      const x = a.x + ((b.x - a.x) * k) / n;
      const z = a.z + ((b.z - a.z) * k) / n;
      if (!inside(x, z) || blockedAt(x, z, cols, r * 0.8)) return false;
    }
    return true;
  };
  const out: Pt[] = [cells[0]!];
  let anchor = 0;
  for (let k = 2; k < cells.length; k++) {
    if (!clear(cells[anchor]!, cells[k]!)) {
      out.push(cells[k - 1]!);
      anchor = k - 1;
    }
  }
  out.push(cells[cells.length - 1]!);
  return out;
}

/** Points spaced `gap` apart along a polyline, starting `offset` along it, each with the heading of its segment, up to `max` of them and `limit` metres. */
export function sampleRoute(route: readonly Pt[], gap: number, offset: number, max: number, limit: number): { x: number; z: number; ang: number; at: number }[] {
  const out: { x: number; z: number; ang: number; at: number }[] = [];
  let travelled = 0;
  let next = ((offset % gap) + gap) % gap;
  for (let k = 0; k + 1 < route.length && out.length < max; k++) {
    const a = route[k]!;
    const b = route[k + 1]!;
    const len = Math.hypot(b.x - a.x, b.z - a.z);
    if (len < 1e-6) continue;
    const ang = Math.atan2(b.x - a.x, b.z - a.z);
    while (next <= travelled + len && out.length < max && next <= limit) {
      const f = (next - travelled) / len;
      out.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f, ang, at: next });
      next += gap;
    }
    travelled += len;
  }
  return out;
}

/** Length of a polyline. */
export const routeLength = (route: readonly Pt[]): number => route.reduce((a, p, i) => (i ? a + Math.hypot(p.x - route[i - 1]!.x, p.z - route[i - 1]!.z) : 0), 0);
