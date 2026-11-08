/**
 * Secure asset table. Shader sources, SVG badge definitions and UI strings are encrypted at
 * build time into one binary blob (ChaCha20) and decrypted once at boot, inside WebAssembly when
 * it is available. This raises the cost of casual copying; it is not secrecy, because the key
 * ships with the page. In dev (`manifest.plain`) the sources are served as plain text.
 */
import { manifest } from 'virtual:secure-assets';
import { fromHex, fromUtf8 } from './crypto';
import type { Kernels } from './wasm';

let bytes: Uint8Array | null = null;
const cache = new Map<string, string>();
let strings: Readonly<Record<string, string>> | null = null;

function xorShares(a: string, b: string): Uint8Array {
  const x = fromHex(a);
  const y = fromHex(b);
  return x.map((v, i) => v ^ y[i]!);
}

/** Starts downloading the encrypted blob right away, so it overlaps with WebAssembly loading. */
export function prefetchAssets(base: string): Promise<Uint8Array | null> {
  if (manifest.plain) return Promise.resolve(null);
  return fetch(new URL(manifest.url, base).toString()).then(async (res) => {
    if (!res.ok) throw new Error(`secure assets: HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  });
}

/** Decrypts the (prefetched) blob. Throws if it is unreachable or malformed. */
export async function bootAssets(kernels: Kernels, prefetched: Promise<Uint8Array | null>): Promise<void> {
  if (manifest.plain) {
    strings = JSON.parse(manifest.sources['strings.json'] ?? '{}') as Record<string, string>;
    return;
  }
  const cipher = await prefetched;
  if (!cipher) throw new Error('secure assets: nothing to decrypt');
  const plain = kernels.chacha20Xor(xorShares(manifest.shareA, manifest.shareB), fromHex(manifest.nonce), 0, cipher);
  if (plain.length !== cipher.length) throw new Error('secure assets: decrypt failed');
  bytes = plain;
  strings = JSON.parse(getAsset('strings.json')) as Record<string, string>;
}

/** Returns a decrypted asset by its path relative to the asset roots, e.g. "glsl/particle.vert.glsl". */
export function getAsset(name: string): string {
  const hit = cache.get(name);
  if (hit !== undefined) return hit;
  let text: string;
  if (manifest.plain) {
    const src = manifest.sources[name];
    if (src === undefined) throw new Error(`asset missing: ${name}`);
    text = src;
  } else {
    const range = manifest.index[name];
    if (!bytes || !range) throw new Error(`asset missing: ${name}`);
    text = fromUtf8(bytes.subarray(range[0], range[0] + range[1]));
  }
  cache.set(name, text);
  return text;
}

/** UI string lookup with optional `{name}` interpolation. Unknown keys return the key itself. */
export function t(key: string, vars?: Readonly<Record<string, string | number>>): string {
  const raw = strings?.[key] ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name: string) => String(vars[name] ?? `{${name}}`));
}

export function hasStrings(): boolean {
  return strings !== null;
}
