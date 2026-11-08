/**
 * TypeScript twin of crates/core/src/spatial_hash.rs. Squared distances are accumulated with
 * Math.fround at every step so candidate ordering matches the Rust f32 arithmetic exactly.
 */

const f = Math.fround;

export function buildNeighborGraphTs(positions: Float32Array, k: number, radius: number): Uint32Array {
  const n = Math.floor(positions.length / 3);
  if (n < 2 || k <= 0 || radius <= 0) return new Uint32Array(0);
  const size = f(radius);
  const r2 = f(size * size);
  const cellOf = (v: number): number => Math.floor(f(v / size));
  const grid = new Map<string, number[]>();
  for (let i = 0; i < n; i++) {
    const key = `${cellOf(positions[i * 3]!)},${cellOf(positions[i * 3 + 1]!)},${cellOf(positions[i * 3 + 2]!)}`;
    const list = grid.get(key);
    if (list) list.push(i);
    else grid.set(key, [i]);
  }
  const edges: number[] = [];
  const cand: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const px = positions[i * 3]!;
    const py = positions[i * 3 + 1]!;
    const pz = positions[i * 3 + 2]!;
    const cx = cellOf(px);
    const cy = cellOf(py);
    const cz = cellOf(pz);
    cand.length = 0;
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const list = grid.get(`${cx + dx},${cy + dy},${cz + dz}`);
          if (!list) continue;
          for (const j of list) {
            if (j === i) continue;
            const ddx = f(px - positions[j * 3]!);
            const ddy = f(py - positions[j * 3 + 1]!);
            const ddz = f(pz - positions[j * 3 + 2]!);
            const d2 = f(f(f(ddx * ddx) + f(ddy * ddy)) + f(ddz * ddz));
            if (d2 <= r2) cand.push([d2, j]);
          }
        }
      }
    }
    cand.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const take = Math.min(k, cand.length);
    for (let c = 0; c < take; c++) {
      const j = cand[c]![1];
      const a = Math.min(i, j);
      const b = Math.max(i, j);
      edges.push(a * 4294967296 + b);
    }
  }
  edges.sort((a, b) => a - b);
  const out: number[] = [];
  let prev = -1;
  for (const e of edges) {
    if (e === prev) continue;
    prev = e;
    out.push(Math.floor(e / 4294967296), e % 4294967296);
  }
  return Uint32Array.from(out);
}
