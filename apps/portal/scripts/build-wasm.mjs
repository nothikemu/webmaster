// Builds crates/core twice with wasm-pack (--target web):
//   src/wasm/pkg       scalar integrator (always works)
//   src/wasm/pkg-simd  SIMD128 integrator (selected at runtime when WebAssembly.validate passes)
// then optimises both with binaryen's wasm-opt -O4 from npm, so the build does not depend on
// wasm-pack downloading wasm-opt from GitHub.
//
// If wasm-pack is not installed the script warns and exits 0: the portal falls back to its
// TypeScript kernels. Set REQUIRE_WASM=1 (release builds, CI) to turn that into a hard failure.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, statSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const portal = resolve(here, '..');
const root = resolve(portal, '..', '..');
const crate = join(root, 'crates', 'core');
const required = process.env.REQUIRE_WASM === '1';

function run(cmd, args, env = {}) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, ...env },
    shell: process.platform === 'win32',
  });
  return res.status === 0;
}

function skip(reason) {
  const msg = `[wasm] ${reason}`;
  if (required) {
    console.error(`${msg} (REQUIRE_WASM=1)`);
    process.exit(1);
  }
  console.warn(`${msg}. Continuing with the TypeScript kernels.`);
  process.exit(0);
}

const probe = spawnSync('wasm-pack', ['--version'], { encoding: 'utf8', shell: process.platform === 'win32' });
if (probe.status !== 0) skip('wasm-pack not found (install with: cargo install wasm-pack)');

// Standard, widely shipped features only. Do not use `-all`: it also enables experimental
// encodings (such as compact imports) that browsers reject.
const BASE_FEATURES = [
  '--enable-bulk-memory',
  '--enable-nontrapping-float-to-int',
  '--enable-sign-ext',
  '--enable-mutable-globals',
  '--enable-multivalue',
  '--enable-reference-types',
];

function wasmOpt(dir, simd) {
  const bin = join(portal, 'node_modules', '.bin', process.platform === 'win32' ? 'wasm-opt.cmd' : 'wasm-opt');
  if (!existsSync(bin)) {
    console.warn('[wasm] binaryen wasm-opt not found in node_modules; leaving binary unoptimised');
    return;
  }
  for (const f of readdirSync(dir).filter((n) => n.endsWith('.wasm'))) {
    const file = join(dir, f);
    const before = statSync(file).size;
    const features = simd ? [...BASE_FEATURES, '--enable-simd'] : BASE_FEATURES;
    if (run(bin, ['-O4', ...features, file, '-o', file])) {
      console.log(`[wasm] wasm-opt -O4 ${f}: ${before} -> ${statSync(file).size} bytes`);
    } else {
      console.warn(`[wasm] wasm-opt failed for ${f}; keeping unoptimised binary`);
    }
  }
}

function build(label, outDir, features, rustflags) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(dirname(outDir), { recursive: true });
  const args = [
    'build', crate, '--target', 'web', '--release', '--no-opt',
    '--out-dir', outDir, '--out-name', 'tsa_core',
  ];
  if (features) args.push('--', '--features', features);
  console.log(`[wasm] building ${label}`);
  const ok = run('wasm-pack', args, rustflags ? { RUSTFLAGS: rustflags } : { RUSTFLAGS: '' });
  if (!ok) skip(`wasm-pack build failed for ${label}`);
  wasmOpt(outDir, features === 'simd');
}

build('scalar', join(portal, 'src', 'wasm', 'pkg'), null, '');
build('simd128', join(portal, 'src', 'wasm', 'pkg-simd'), 'simd', '-C target-feature=+simd128');
console.log('[wasm] done');
