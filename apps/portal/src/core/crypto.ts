/**
 * Pure TypeScript SHA-256, HMAC-SHA-256 and ChaCha20, byte-for-byte equal to the Rust kernels in
 * crates/core. Used when WebAssembly is unavailable, by the build plugins, and by the tests that
 * pin all implementations to the same vectors. Also wraps SubtleCrypto as the alternate HMAC.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotr = (x: number, n: number): number => (x >>> n) | (x << (32 - n));

export function sha256Ts(data: Uint8Array): Uint8Array {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const len = data.length;
  const padded = ((len + 9 + 63) >> 6) << 6;
  const buf = new Uint8Array(padded);
  buf.set(data);
  buf[len] = 0x80;
  const view = new DataView(buf.buffer);
  view.setUint32(padded - 8, Math.floor(len / 0x20000000), false);
  view.setUint32(padded - 4, (len << 3) >>> 0, false);
  const w = new Uint32Array(64);
  for (let off = 0; off < padded; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const w15 = w[i - 15]!;
      const w2 = w[i - 2]!;
      const s0 = rotr(w15, 7) ^ rotr(w15, 18) ^ (w15 >>> 3);
      const s1 = rotr(w2, 17) ^ rotr(w2, 19) ^ (w2 >>> 10);
      w[i] = w[i - 16]! + s0 + w[i - 7]! + s1;
    }
    let a = h[0]!;
    let b = h[1]!;
    let c = h[2]!;
    let d = h[3]!;
    let e = h[4]!;
    let f = h[5]!;
    let g = h[6]!;
    let hh = h[7]!;
    for (let i = 0; i < 64; i++) {
      const s1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + s1 + ch + K[i]! + w[i]!) >>> 0;
      const s0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (s0 + maj) >>> 0;
      hh = g;
      g = f;
      f = e;
      e = (d + t1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (t1 + t2) >>> 0;
    }
    h[0] = h[0]! + a;
    h[1] = h[1]! + b;
    h[2] = h[2]! + c;
    h[3] = h[3]! + d;
    h[4] = h[4]! + e;
    h[5] = h[5]! + f;
    h[6] = h[6]! + g;
    h[7] = h[7]! + hh;
  }
  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  for (let i = 0; i < 8; i++) ov.setUint32(i * 4, h[i]!, false);
  return out;
}

export function hmacSha256Ts(key: Uint8Array, message: Uint8Array): Uint8Array {
  const k0 = new Uint8Array(64);
  if (key.length > 64) k0.set(sha256Ts(key));
  else k0.set(key);
  const inner = new Uint8Array(64 + message.length);
  const outer = new Uint8Array(96);
  for (let i = 0; i < 64; i++) {
    inner[i] = k0[i]! ^ 0x36;
    outer[i] = k0[i]! ^ 0x5c;
  }
  inner.set(message, 64);
  outer.set(sha256Ts(inner), 64);
  return sha256Ts(outer);
}

function quarter(s: Uint32Array, a: number, b: number, c: number, d: number): void {
  s[a] = s[a]! + s[b]!;
  s[d] = rotl(s[d]! ^ s[a]!, 16);
  s[c] = s[c]! + s[d]!;
  s[b] = rotl(s[b]! ^ s[c]!, 12);
  s[a] = s[a]! + s[b]!;
  s[d] = rotl(s[d]! ^ s[a]!, 8);
  s[c] = s[c]! + s[d]!;
  s[b] = rotl(s[b]! ^ s[c]!, 7);
}

const rotl = (x: number, n: number): number => (x << n) | (x >>> (32 - n));

/** ChaCha20 (RFC 8439). `key` is 32 bytes, `nonce` 12 bytes. Returns [] on bad lengths. */
export function chacha20XorTs(
  key: Uint8Array,
  nonce: Uint8Array,
  counter: number,
  data: Uint8Array,
): Uint8Array {
  if (key.length !== 32 || nonce.length !== 12) return new Uint8Array(0);
  const kv = new DataView(key.buffer, key.byteOffset, key.byteLength);
  const nv = new DataView(nonce.buffer, nonce.byteOffset, nonce.byteLength);
  const init = new Uint32Array(16);
  init[0] = 0x61707865;
  init[1] = 0x3320646e;
  init[2] = 0x79622d32;
  init[3] = 0x6b206574;
  for (let i = 0; i < 8; i++) init[4 + i] = kv.getUint32(i * 4, true);
  for (let i = 0; i < 3; i++) init[13 + i] = nv.getUint32(i * 4, true);
  const out = new Uint8Array(data.length);
  const s = new Uint32Array(16);
  const ks = new Uint8Array(64);
  const ksv = new DataView(ks.buffer);
  let ctr = counter >>> 0;
  for (let pos = 0; pos < data.length; pos += 64) {
    init[12] = ctr;
    s.set(init);
    for (let r = 0; r < 10; r++) {
      quarter(s, 0, 4, 8, 12);
      quarter(s, 1, 5, 9, 13);
      quarter(s, 2, 6, 10, 14);
      quarter(s, 3, 7, 11, 15);
      quarter(s, 0, 5, 10, 15);
      quarter(s, 1, 6, 11, 12);
      quarter(s, 2, 7, 8, 13);
      quarter(s, 3, 4, 9, 14);
    }
    for (let i = 0; i < 16; i++) ksv.setUint32(i * 4, (s[i]! + init[i]!) >>> 0, true);
    const n = Math.min(64, data.length - pos);
    for (let i = 0; i < n; i++) out[pos + i] = data[pos + i]! ^ ks[i]!;
    ctr = (ctr + 1) >>> 0;
  }
  return out;
}

export async function hmacSha256Subtle(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('SubtleCrypto unavailable');
  const cryptoKey = await subtle.importKey(
    'raw',
    key as BufferSource,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(await subtle.sign('HMAC', cryptoKey, message as BufferSource));
}

export function toHex(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i]!.toString(16).padStart(2, '0');
  return s;
}

export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-f]/i.test(hex)) throw new Error('invalid hex');
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();
export const utf8 = (s: string): Uint8Array => encoder.encode(s);
export const fromUtf8 = (b: Uint8Array): string => decoder.decode(b);

/** Compares two strings without early exit on the first differing character. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Random bytes from the platform CSPRNG, with a Math.random fallback for ancient contexts. */
export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  if (globalThis.crypto?.getRandomValues) globalThis.crypto.getRandomValues(out);
  else for (let i = 0; i < n; i++) out[i] = Math.floor(Math.random() * 256);
  return out;
}
