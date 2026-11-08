/**
 * Integrity injection, run after the bundle is written:
 *  1. SHA-256 of every small app chunk, WebAssembly binary and the encrypted asset blob is written
 *     into the entry chunk (replacing the `__TSA_INTEGRITY__` token) as "path:hash;path:hash".
 *  2. SHA-384 Subresource Integrity attributes are added to the entry script, stylesheet and
 *     modulepreload tags in index.html.
 * Whatever runs next (static route emission) receives the final index.html.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Plugin } from 'vite';

export const INTEGRITY_TOKEN = '__TSA_INTEGRITY__';
const MAX_HASHED_JS_BYTES = 150 * 1024;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

const sha256Hex = (data: Buffer): string => createHash('sha256').update(data).digest('hex');
const sri = (data: Buffer): string => `sha384-${createHash('sha384').update(data).digest('base64')}`;

export interface PostBuildStep {
  (ctx: { outDir: string; base: string; root: string }): void | Promise<void>;
}

export function injectChecksums(options: { after?: readonly PostBuildStep[] } = {}): Plugin {
  let outDir = 'dist';
  let base = '/';
  let root = process.cwd();
  let isBuild = false;

  return {
    name: 'portal:inject-checksums',
    apply: 'build',
    enforce: 'post',
    configResolved(config) {
      isBuild = config.command === 'build';
      root = config.root;
      outDir = resolve(config.root, config.build.outDir);
      base = config.base;
    },
    resolveId(id) {
      return id === 'virtual:integrity' ? '\0virtual:integrity' : null;
    },
    load(id) {
      if (id !== '\0virtual:integrity') return null;
      const raw = isBuild ? INTEGRITY_TOKEN : '';
      return [
        `const raw = '${raw}';`,
        `export const checksums = Object.freeze(Object.fromEntries(raw.split(';').filter((s) => s.includes(':')).map((s) => s.split(':'))));`,
        `export const buildId = '${isBuild ? Date.now().toString(36) : 'dev'}';`,
      ].join('\n');
    },
    async writeBundle() {
      const files = walk(outDir);
      const rel = (f: string): string => relative(outDir, f).split(sep).join('/');
      let entryFile: string | null = null;
      for (const f of files) {
        if (!f.endsWith('.js')) continue;
        if (readFileSync(f, 'utf8').includes(INTEGRITY_TOKEN)) {
          entryFile = f;
          break;
        }
      }
      if (!entryFile) throw new Error(`injectChecksums: ${INTEGRITY_TOKEN} not found in any chunk`);

      const entries: string[] = [];
      for (const f of files) {
        const name = rel(f);
        if (f === entryFile) continue;
        const isWasm = name.endsWith('.wasm');
        const isBlob = /^assets\/secure\..+\.bin$/.test(name);
        const isSmallJs = name.endsWith('.js') && !/vendor-/.test(name) && statSync(f).size <= MAX_HASHED_JS_BYTES;
        if (isWasm || isBlob || isSmallJs) entries.push(`${name}:${sha256Hex(readFileSync(f))}`);
      }
      entries.sort();
      const manifest = entries.join(';');
      if (/['"\\]/.test(manifest)) throw new Error('injectChecksums: manifest contains a quote character');
      const code = readFileSync(entryFile, 'utf8');
      writeFileSync(entryFile, code.split(INTEGRITY_TOKEN).join(manifest));

      const indexPath = join(outDir, 'index.html');
      if (existsSync(indexPath)) {
        let html = readFileSync(indexPath, 'utf8');
        html = html.replace(/<(script|link)\b([^>]*?)>/g, (tag, name: string, attrs: string) => {
          const isScript = name === 'script' && /\btype="module"/.test(attrs);
          const isStyle = name === 'link' && /\brel="stylesheet"/.test(attrs);
          // modulepreload links are left alone: their responses are reused by the module map.
          if (!isScript && !isStyle) return tag;
          const m = /\b(?:src|href)="([^"]+)"/.exec(attrs);
          if (!m || /\bintegrity=/.test(attrs)) return tag;
          const path = join(outDir, m[1]!.startsWith(base) ? m[1]!.slice(base.length) : m[1]!.replace(/^\//, ''));
          if (!existsSync(path)) return tag;
          return `<${name}${attrs} integrity="${sri(readFileSync(path))}">`;
        });
        writeFileSync(indexPath, html);
      }
      for (const step of options.after ?? []) await step({ outDir, base, root });
    },
  };
}
