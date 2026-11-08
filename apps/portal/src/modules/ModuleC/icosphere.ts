/**
 * Builds an icosphere by repeatedly splitting each triangle of an icosahedron. Vertices are
 * shared, so level 5 gives exactly 10 * 4^5 + 2 = 10,242 vertices and 30,720 unique edges,
 * which is what the wireframe draws (each edge once, not each triangle outline).
 */
export interface Icosphere {
  /** Unit-length xyz triples. */
  positions: Float32Array;
  /** Pairs of vertex indices, one pair per edge. */
  edges: Uint32Array;
  vertexCount: number;
}

export const WIREFRAME_LEVEL = 5;

export function buildIcosphere(level: number): Icosphere {
  const t = (1 + Math.sqrt(5)) / 2;
  const verts: number[] = [];
  const add = (x: number, y: number, z: number): number => {
    const len = Math.hypot(x, y, z);
    verts.push(x / len, y / len, z / len);
    return verts.length / 3 - 1;
  };
  [
    [-1, t, 0], [1, t, 0], [-1, -t, 0], [1, -t, 0],
    [0, -1, t], [0, 1, t], [0, -1, -t], [0, 1, -t],
    [t, 0, -1], [t, 0, 1], [-t, 0, -1], [-t, 0, 1],
  ].forEach(([x, y, z]) => add(x!, y!, z!));

  let faces: Array<[number, number, number]> = [
    [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
    [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
    [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
    [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
  ];

  for (let l = 0; l < level; l++) {
    const cache = new Map<number, number>();
    const mid = (a: number, b: number): number => {
      const key = a < b ? a * 1_000_003 + b : b * 1_000_003 + a;
      const hit = cache.get(key);
      if (hit !== undefined) return hit;
      const i = add(
        (verts[a * 3]! + verts[b * 3]!) / 2,
        (verts[a * 3 + 1]! + verts[b * 3 + 1]!) / 2,
        (verts[a * 3 + 2]! + verts[b * 3 + 2]!) / 2,
      );
      cache.set(key, i);
      return i;
    };
    const next: Array<[number, number, number]> = [];
    for (const [a, b, c] of faces) {
      const ab = mid(a, b);
      const bc = mid(b, c);
      const ca = mid(c, a);
      next.push([a, ab, ca], [b, bc, ab], [c, ca, bc], [ab, bc, ca]);
    }
    faces = next;
  }

  const seen = new Set<number>();
  const edges: number[] = [];
  const addEdge = (a: number, b: number): void => {
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    const key = lo * 1_000_003 + hi;
    if (seen.has(key)) return;
    seen.add(key);
    edges.push(lo, hi);
  };
  for (const [a, b, c] of faces) {
    addEdge(a, b);
    addEdge(b, c);
    addEdge(c, a);
  }
  return { positions: Float32Array.from(verts), edges: Uint32Array.from(edges), vertexCount: verts.length / 3 };
}
