/** TypeScript twin of crates/core/src/noise.rs (same permutation shuffle, same fractal sum). */

function makePerm(seed: number): Uint8Array {
  const base = new Uint8Array(256);
  for (let i = 0; i < 256; i++) base[i] = i;
  let state = seed >>> 0;
  for (let i = 255; i >= 1; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const j = (state >>> 8) % (i + 1);
    const tmp = base[i]!;
    base[i] = base[j]!;
    base[j] = tmp;
  }
  const full = new Uint8Array(512);
  full.set(base);
  full.set(base, 256);
  return full;
}

const fade = (t: number): number => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (t: number, a: number, b: number): number => a + t * (b - a);

function grad(hash: number, x: number, y: number, z: number): number {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

function perlin3(p: Uint8Array, x: number, y: number, z: number): number {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  const fz = Math.floor(z);
  const xi = fx & 255;
  const yi = fy & 255;
  const zi = fz & 255;
  x -= fx;
  y -= fy;
  z -= fz;
  const u = fade(x);
  const v = fade(y);
  const w = fade(z);
  const a = p[xi]! + yi;
  const aa = p[a]! + zi;
  const ab = p[a + 1]! + zi;
  const b = p[xi + 1]! + yi;
  const ba = p[b]! + zi;
  const bb = p[b + 1]! + zi;
  return lerp(
    w,
    lerp(
      v,
      lerp(u, grad(p[aa]!, x, y, z), grad(p[ba]!, x - 1, y, z)),
      lerp(u, grad(p[ab]!, x, y - 1, z), grad(p[bb]!, x - 1, y - 1, z)),
    ),
    lerp(
      v,
      lerp(u, grad(p[aa + 1]!, x, y, z - 1), grad(p[ba + 1]!, x - 1, y, z - 1)),
      lerp(u, grad(p[ab + 1]!, x, y - 1, z - 1), grad(p[bb + 1]!, x - 1, y - 1, z - 1)),
    ),
  );
}

const permCache = new Map<number, Uint8Array>();

export function fbmFieldTs(
  out: Float32Array,
  w: number,
  h: number,
  t: number,
  scale: number,
  octaves: number,
  seed: number,
): void {
  if (w <= 0 || h <= 0 || out.length < w * h) return;
  let perm = permCache.get(seed);
  if (!perm) {
    perm = makePerm(seed);
    permCache.set(seed, perm);
  }
  const oct = Math.min(8, Math.max(1, octaves | 0));
  let total = 0;
  let amp = 0.5;
  for (let o = 0; o < oct; o++) {
    total += amp;
    amp *= 0.5;
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x / w) * scale;
      const ny = (y / h) * scale;
      let sum = 0;
      let a = 0.5;
      let fq = 1;
      for (let o = 0; o < oct; o++) {
        sum += a * perlin3(perm, nx * fq, ny * fq, t + o * 17);
        a *= 0.5;
        fq *= 2;
      }
      const v = 0.5 + (0.5 * sum) / total;
      out[y * w + x] = v < 0 ? 0 : v > 1 ? 1 : v;
    }
  }
}
