/**
 * Encrypts shader sources, SVG badge definitions and UI strings into one binary blob at build
 * time (ChaCha20, key split into two XOR shares, fresh key per build) and exposes the index
 * through `virtual:secure-assets`. In dev the sources are served as plain text so editing
 * shaders still hot-reloads.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';
import { chacha20XorTs, randomBytes, sha256Ts, toHex } from '../src/core/crypto';

const VIRTUAL_ID = 'virtual:secure-assets';
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

interface Root {
  dir: string;
  prefix: string;
  ext: readonly string[];
}

const ROOTS: readonly Root[] = [
  { dir: 'src/gpu/glsl', prefix: 'glsl/', ext: ['.glsl'] },
  { dir: 'src/gpu/wgsl', prefix: 'wgsl/', ext: ['.wgsl'] },
  { dir: 'src/assets/badges', prefix: 'badges/', ext: ['.svg'] },
  { dir: 'src/assets', prefix: '', ext: ['.json'] },
];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

export interface CollectedAsset {
  name: string;
  file: string;
  bytes: Buffer;
}

/** Collects every asset under the configured roots, sorted so builds are deterministic. */
export function collectAssets(projectRoot: string): CollectedAsset[] {
  const found = new Map<string, CollectedAsset>();
  for (const root of ROOTS) {
    const abs = resolve(projectRoot, root.dir);
    let files: string[];
    try {
      files = root.prefix === '' ? readdirSync(abs).map((n) => join(abs, n)).filter((f) => statSync(f).isFile()) : walk(abs);
    } catch {
      continue;
    }
    for (const file of files) {
      if (!root.ext.some((e) => file.endsWith(e))) continue;
      const name = root.prefix + relative(abs, file).split(sep).join('/');
      found.set(name, { name, file, bytes: readFileSync(file) });
    }
  }
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function encryptAssets(): Plugin {
  let root = process.cwd();
  let isBuild = false;
  let assets: CollectedAsset[] = [];
  let fileName = '';
  let cipher: Uint8Array = new Uint8Array(0);
  let manifestSource = '';

  return {
    name: 'portal:encrypt-assets',
    configResolved(config) {
      root = config.root;
      isBuild = config.command === 'build';
    },
    buildStart() {
      assets = collectAssets(root);
      for (const a of assets) this.addWatchFile(a.file);
      if (!isBuild) {
        const sources: Record<string, string> = {};
        for (const a of assets) sources[a.name] = a.bytes.toString('utf8');
        manifestSource = `export const manifest = Object.freeze(${JSON.stringify({
          plain: true, url: '', nonce: '', shareA: '', shareB: '', index: {}, sources,
        })});`;
        return;
      }
      const index: Record<string, [number, number]> = {};
      let offset = 0;
      for (const a of assets) {
        index[a.name] = [offset, a.bytes.length];
        offset += a.bytes.length;
      }
      const plain = new Uint8Array(Buffer.concat(assets.map((a) => a.bytes)));
      const key = randomBytes(32);
      const nonce = randomBytes(12);
      const shareA = randomBytes(32);
      const shareB = key.map((b, i) => b ^ shareA[i]!);
      cipher = chacha20XorTs(key, nonce, 0, plain);
      fileName = `assets/secure.${toHex(sha256Ts(cipher)).slice(0, 10)}.bin`;
      manifestSource = `export const manifest = Object.freeze(${JSON.stringify({
        plain: false, url: fileName, nonce: toHex(nonce), shareA: toHex(shareA), shareB: toHex(shareB), index, sources: {},
      })});`;
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      return id === RESOLVED_ID ? manifestSource : null;
    },
    generateBundle() {
      if (isBuild) this.emitFile({ type: 'asset', fileName, source: cipher });
    },
    handleHotUpdate({ file, server }) {
      if (assets.some((a) => a.file === file)) {
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: 'full-reload' });
        return [];
      }
      return undefined;
    },
  };
}
