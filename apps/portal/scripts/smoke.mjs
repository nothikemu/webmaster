// Smoke test for the built site (dist/). Run `pnpm build` first.
//   pnpm smoke
// Environment:
//   CHROMIUM_PATH     use this Chromium binary instead of Playwright's own
//   SMOKE_MIN_FPS     minimum master-loop frame rate on a module page (default 12; software GL is slow,
//                     use 45 or more on real hardware)
//   SMOKE_QUALITY     quality tier (0-3) for the frame-rate check (default 0, the governor's floor)
//   SMOKE_ONLY        run only checks whose name matches this regular expression
//   SMOKE_NO_WEBGPU=1 skip the WebGPU tier checks
//   SMOKE_BASE        serve and test under this sub-path, for builds made with BASE=/repo/ (default "/")
//   SMOKE_ISOLATION=0 serve WITHOUT the COOP/COEP headers, as GitHub Pages does (exercises the
//                     non-SharedArrayBuffer fallbacks)
//
// It serves dist/ itself with the cross-origin isolation headers, so no other server is needed.
import AxeBuilder from '@axe-core/playwright';
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(here, '..', 'dist');
const MIN_FPS = Number(process.env.SMOKE_MIN_FPS ?? 12);
const WEBGPU = process.env.SMOKE_NO_WEBGPU !== '1';
const BASE = (process.env.SMOKE_BASE ?? '/').replace(/\/?$/, '/');
const ISOLATION = process.env.SMOKE_ISOLATION !== '0';
const sub = BASE.replace(/\/$/, ''); // "" or "/repo"
const at = (origin, path) => origin + sub + path;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.wasm': 'application/wasm', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.bin': 'application/octet-stream',
  '.txt': 'text/plain', '.xml': 'application/xml',
};

function serve(root) {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', 'http://x');
    let rel = decodeURIComponent(url.pathname);
    if (sub && (rel === sub || rel.startsWith(sub + '/'))) rel = rel.slice(sub.length) || '/';
    else if (sub) { res.writeHead(404).end(); return; }
    let file = normalize(join(root, rel));
    if (!file.startsWith(root)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
    let status = 200;
    if (!existsSync(file)) { file = join(root, '404.html'); status = 404; }
    res.writeHead(status, {
      'Content-Type': MIME[extname(file)] ?? 'application/octet-stream',
      ...(ISOLATION ? {
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp',
        'Cross-Origin-Resource-Policy': 'same-origin',
      } : {}),
      'Cache-Control': 'no-cache',
    });
    res.end(readFileSync(file));
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok({ server, origin: `http://127.0.0.1:${server.address().port}` })));
}

const results = [];
const ONLY = process.env.SMOKE_ONLY ? new RegExp(process.env.SMOKE_ONLY, 'i') : null;
async function check(name, fn) {
  if (ONLY && !ONLY.test(name)) return;
  const t0 = Date.now();
  try {
    const detail = await fn();
    results.push({ name, ok: true });
    console.log(`PASS  ${name}${detail ? `  (${detail})` : ''}  ${Date.now() - t0}ms`);
  } catch (err) {
    results.push({ name, ok: false });
    console.log(`FAIL  ${name}\n      ${String(err?.message ?? err).split('\n').join('\n      ')}`);
  }
}
const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

const ARGS = [
  '--ignore-gpu-blocklist', '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  ...(WEBGPU ? ['--enable-unsafe-webgpu', '--enable-features=Vulkan', '--use-vulkan=swiftshader', '--use-webgpu-adapter=swiftshader'] : []),
];

if (!existsSync(join(DIST, 'index.html'))) { console.error('dist/ not found. Run `pnpm build` first.'); process.exit(2); }

const { server, origin } = await serve(DIST);
const browser = await chromium.launch({ args: ARGS, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });

async function open(path, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  const errors = [];
  const warnings = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); else if (m.type() === 'warning') warnings.push(m.text()); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  await page.goto(at(origin, path), { waitUntil: 'load' });
  return { ctx, page, errors, warnings };
}
const boot = (page) => page.waitForFunction(() => ['ready', 'static'].includes(document.documentElement.dataset.boot ?? ''), null, { timeout: 30000 });
const stageNote = async (page) => {
  await page.waitForSelector('.stage[data-status="ready"]', { timeout: 60000 });
  // The renderer and compute tier are exposed as data-note (never drawn). The note can arrive a moment after "ready".
  const stage = page.locator('.stage[data-status="ready"]').first();
  for (let i = 0; i < 50; i++) {
    const note = await stage.getAttribute('data-note');
    if (note) return note.toLowerCase();
    await page.waitForTimeout(100);
  }
  return '';
};
const xpOf = async (page) => {
  const toggle = page.locator('#hub-toggle');
  if ((await toggle.getAttribute('aria-expanded')) !== 'true') await toggle.click();
  // The counter glides to its value on a spring; wait until two reads agree.
  let last = -1;
  let same = 0;
  for (let i = 0; i < 60; i++) {
    const now = Number((await page.locator('.hub-xp').innerText()).replace(/[^0-9]/g, ''));
    same = now === last ? same + 1 : 0;
    last = now;
    if (same >= 3) break;
    await page.waitForTimeout(350);
  }
  await toggle.click();
  return last;
};

// ---- 1. boot, loop, budget ----------------------------------------------------------------------
await check('home boots with no console errors; one rAF loop at most, idle when static', async () => {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(() => {
    const native = window.requestAnimationFrame.bind(window);
    let calls = 0;
    Object.defineProperty(document, '__rafCalls', { get: () => calls });
    window.requestAnimationFrame = (cb) => { calls++; return native(cb); };
  });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(at(origin, '/'), { waitUntil: 'load' });
  await boot(page);
  assert((await page.evaluate(() => document.documentElement.dataset.boot)) === 'ready', 'did not reach boot=ready');
  await page.waitForTimeout(1500);
  const a = await page.evaluate(() => ({ raf: document.__rafCalls, frame: Number(document.documentElement.dataset.frame ?? 0) }));
  await page.waitForTimeout(2500);
  const b = await page.evaluate(() => ({ raf: document.__rafCalls, frame: Number(document.documentElement.dataset.frame ?? 0) }));
  const frames = b.frame - a.frame;
  // data-frame is a heartbeat written every 30th frame, so the frame count is quantised: the true count is
  // between `frames` and `frames + 29`. Dividing by the upper bound gives the lowest ratio the data allows.
  const ratio = (b.raf - a.raf) / Math.max(1, frames + 29);
  await ctx.close();
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  // The live background field is the only thing animating on this page. On the lowest quality tier it
  // holds still and the loop sits idle; on any other it must run exactly one requestAnimationFrame loop.
  if (frames <= 2) {
    const calls = b.raf - a.raf;
    assert(calls <= 4, `the still home page made ${calls} requestAnimationFrame calls in 2.5 s`);
    return `idle: ${calls} rAF calls in 2.5 s`;
  }
  assert(ratio <= 1.25, `requestAnimationFrame called ${ratio.toFixed(2)}x per master frame; expected one loop`);
  return `${(frames / 2.5).toFixed(0)} fps, ${ratio.toFixed(2)} rAF/frame`;
});

// The quality governor exists so the lowest tier always holds the budget, so that is what is measured.
// On real hardware use SMOKE_QUALITY=3 (the default tier) with SMOKE_MIN_FPS=45 or more.
const QUALITY = process.env.SMOKE_QUALITY ?? '0';
await check(`Module A initialises and holds at least ${MIN_FPS} fps (quality tier ${QUALITY})`, async () => {
  const { ctx, page, errors } = await open(`/modules/foundations?renderer=webgl2&quality=${QUALITY}`);
  await boot(page);
  const note = await stageNote(page);
  assert(await page.locator('canvas.stage-canvas').count() === 1, 'expected exactly one canvas');
  const f0 = Number(await page.evaluate(() => document.documentElement.dataset.frame ?? 0));
  await page.waitForTimeout(6000);
  const f1 = Number(await page.evaluate(() => document.documentElement.dataset.frame ?? 0));
  const fps = (f1 - f0) / 6;
  await ctx.close();
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  assert(fps >= MIN_FPS, `${fps.toFixed(1)} fps is below the ${MIN_FPS} fps budget (set SMOKE_MIN_FPS for your hardware)`);
  return `${note.split(' / ').slice(0, 2).join(' / ')}, ${fps.toFixed(0)} fps`;
});

// ---- 2. every renderer and compute tier ----------------------------------------------------------
// A build made without `pnpm wasm` (no Rust toolchain) has no WebAssembly; those tiers cannot exist then.
const HAS_WASM = readdirSync(join(DIST, 'assets')).some((f) => f.endsWith('.wasm'));
if (!HAS_WASM) console.log('NOTE  dist/ has no .wasm files: skipping the WebAssembly tiers (build with `pnpm wasm` first to test them)');
const TIERS = [
  ['webgl2', 'webgl2'], ['webgl2', 'wasm-worker'], ['webgl2', 'wasm-main'], ['webgl2', 'ts'],
  ...(WEBGPU ? [['webgpu', 'webgpu'], ['webgpu', 'wasm-worker']] : []),
].filter(([, compute]) => HAS_WASM || !compute.startsWith('wasm'));
for (const [renderer, compute] of TIERS) {
  await check(`Module A tier ${renderer} + ${compute}`, async () => {
    const { ctx, page, errors } = await open(`/modules/foundations?renderer=${renderer}&compute=${compute}&quality=0`);
    await boot(page);
    const note = await stageNote(page);
    await page.locator('canvas.stage-canvas').hover({ position: { x: 300, y: 220 } });
    await page.mouse.move(340, 260, { steps: 6 });
    await page.waitForTimeout(600);
    await ctx.close();
    assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
    assert(note.startsWith(`${renderer} / ${compute}`), `expected "${renderer} / ${compute}", got "${note}"`);
    assert(/3,000/.test(note), `quality=0 should give 3,000 particles, got "${note}"`);
    return note;
  });
}

// ---- 3. modules B and C --------------------------------------------------------------------------
await check('Module B: presets move the sliders; output readouts respond', async () => {
  const { ctx, page, errors } = await open('/modules/synthesis');
  await boot(page);
  await page.waitForSelector('.splitpane');
  assert((await page.locator('input[type=range]').count()) === 4, 'expected four sliders');
  const before = await page.locator('.readouts dd').first().innerText();
  await page.getByRole('button', { name: 'Constraint Stacking' }).click();
  await page.waitForFunction(() => Number(document.querySelector('#slider-strictness')?.value) >= 88, null, { timeout: 8000 });
  const after = await page.locator('.readouts dd').first().innerText();
  const sep = page.getByRole('separator');
  await sep.focus();
  const v0 = Number(await sep.getAttribute('aria-valuenow'));
  await page.keyboard.press('ArrowRight');
  const v1 = Number(await sep.getAttribute('aria-valuenow'));
  await ctx.close();
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  assert(before !== after, 'on-task readout did not change after applying a preset');
  assert(v1 > v0, 'divider did not move with the arrow key');
  return `on-task ${before} -> ${after}`;
});

await check('Module C: 10,242 vertices; markers open mitigations; remediate works', async () => {
  const { ctx, page, errors } = await open('/modules/ethics');
  await boot(page);
  const note = await stageNote(page);
  await page.getByRole('button', { name: 'Data Leakage' }).click();
  const text = await page.locator('.explain').innerText();
  const pressed = await page.getByRole('button', { name: 'Data Leakage' }).getAttribute('aria-pressed');
  await page.getByRole('button', { name: 'Remediate' }).click();
  const stable = await page.locator('.explain').innerText();
  await ctx.close();
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  assert(/10,242 vertices/.test(note), `expected the 10,242-vertex wireframe, got "${note}"`);
  assert(/GPT-2|differential privacy/i.test(text), 'mitigation text missing');
  assert(pressed === 'true', 'marker not pressed');
  assert(stable.trim() === '', 'remediate did not clear the explanation');
  return note;
});

// ---- 4. gamification, persistence, tamper recovery -----------------------------------------------
await check('lesson answer earns XP, persists across reload, and a tampered save resets silently', async () => {
  const { ctx, page, errors } = await open('/modules/foundations/lessons/1?renderer=webgl2&quality=0');
  await boot(page);
  await page.getByLabel('It performs well on the narrow task it was built and tested for.').check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.waitForSelector('.feedback[data-result="right"]');
  const xp = await xpOf(page);
  assert(xp >= 50, `expected at least 50 XP for a first-try mastery, got ${xp}`);
  await page.waitForTimeout(600); // persistence is debounced
  await page.reload({ waitUntil: 'load' });
  await boot(page);
  const again = await xpOf(page);
  assert(again === xp, `XP did not persist (${xp} -> ${again})`);
  await page.evaluate(() => {
    const key = 'tsa-ai-portal/v1';
    const state = JSON.parse(localStorage.getItem(key));
    state.xp += 9999;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload({ waitUntil: 'load' });
  await boot(page);
  const reset = await xpOf(page);
  const alerts = await page.locator('[role="alert"]').count();
  await ctx.close();
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  assert(reset === 0, `tampered state was not reset (xp ${reset})`);
  assert(alerts === 0, 'a visible error was shown after tampering');
  return `${xp} XP persisted; tamper reset`;
});

await check('progress export, import and confirmed reset', async () => {
  const { ctx, page, errors } = await open('/modules/foundations/lessons/1?renderer=webgl2&quality=0');
  await boot(page);
  await page.getByLabel('It performs well on the narrow task it was built and tested for.').check();
  await page.getByRole('button', { name: 'Check answer' }).click();
  await page.waitForSelector('.feedback[data-result="right"]');
  await page.getByRole('link', { name: 'Progress', exact: true }).first().click();
  await page.waitForSelector('h1:has-text("Progress")');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export progress' }).click()]);
  const path = await download.path();
  const exported = JSON.parse(readFileSync(path, 'utf8'));
  assert(exported.format === 'tsa-ai-portal-progress' && exported.state.sig.length === 64, 'export envelope or signature missing');
  await page.getByRole('button', { name: 'Reset progress' }).click();
  await page.getByRole('alertdialog').waitFor();
  await page.getByRole('button', { name: 'Erase progress' }).click();
  await page.waitForTimeout(300);
  assert((await xpOf(page)) === 0, 'reset did not clear XP');
  await page.locator('input[type=file]').setInputFiles(path);
  await page.waitForTimeout(500);
  const restored = await xpOf(page);
  const tampered = join(tmpdir(), `bad-${Date.now()}.json`);
  const bad = JSON.parse(JSON.stringify(exported));
  bad.state.xp += 5000;
  writeFileSync(tampered, JSON.stringify(bad));
  await page.locator('input[type=file]').setInputFiles(tampered);
  await page.waitForTimeout(400);
  const message = await page.locator('.data-controls [role=status]').innerText();
  rmSync(tampered, { force: true });
  await ctx.close();
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  assert(restored >= 50, `import did not restore progress (xp ${restored})`);
  assert(/signature/i.test(message), `an edited export should be rejected, got "${message}"`);
});

// ---- 5. hardening --------------------------------------------------------------------------------
await check('integrity guard degrades to the static view when the asset blob is altered', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'parameter-dist-'));
  cpSync(DIST, tmp, { recursive: true });
  const blob = readdirSync(join(tmp, 'assets')).find((f) => /^secure\..+\.bin$/.test(f));
  assert(blob, 'secure asset blob not found in dist');
  const bytes = readFileSync(join(tmp, 'assets', blob));
  bytes[bytes.length >> 1] ^= 0xff;
  writeFileSync(join(tmp, 'assets', blob), bytes);
  const alt = await serve(tmp);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(at(alt.origin, '/modules/foundations/lessons/1'), { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.boot === 'static', null, { timeout: 30000 });
  const heading = await page.locator('h1').first().innerText();
  const interactive = await page.locator('canvas').count();
  await ctx.close();
  alt.server.close();
  rmSync(tmp, { recursive: true, force: true });
  assert(errors.length === 0, `uncaught errors: ${errors.join(' | ')}`);
  assert(interactive === 0, 'interactive canvas still mounted');
  assert(heading.length > 3, 'static view has no heading');
  return `static view: "${heading}"`;
});

await check('integrity guard also catches an altered lazy chunk after the app has started', async () => {
  const tmp = mkdtempSync(join(tmpdir(), 'parameter-dist-'));
  cpSync(DIST, tmp, { recursive: true });
  const chunk = readdirSync(join(tmp, 'assets')).find((f) => /^Glossary-.+\.js$/.test(f));
  assert(chunk, 'Glossary chunk not found in dist');
  const bytes = readFileSync(join(tmp, 'assets', chunk));
  bytes[bytes.length >> 1] ^= 0x01;
  writeFileSync(join(tmp, 'assets', chunk), bytes);
  const alt = await serve(tmp);
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(at(alt.origin, '/about'), { waitUntil: 'load' });
  await page.waitForFunction(() => document.documentElement.dataset.boot === 'static', null, { timeout: 30000 });
  const heading = await page.locator('h1').first().innerText();
  const hub = await page.locator('#hub-toggle').count();
  await ctx.close();
  alt.server.close();
  rmSync(tmp, { recursive: true, force: true });
  assert(errors.length === 0, `uncaught errors: ${errors.join(' | ')}`);
  assert(hub === 0, 'interactive app still mounted after a mismatch');
  assert(/About/i.test(heading), `static heading missing, got "${heading}"`);
});

await check('pages are readable without JavaScript', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(at(origin, '/modules/synthesis/lessons/2'), { waitUntil: 'load' });
  const h1 = await page.locator('h1').innerText();
  const body = await page.locator('main').innerText();
  const visible = await page.locator('.static-page').isVisible();
  await ctx.close();
  assert(/Roles, tasks and constraints/.test(h1), `unexpected h1 "${h1}"`);
  assert(/role tells the model/i.test(body), 'lesson text missing');
  assert(visible, 'static page hidden without JavaScript');
});

await check('reduced motion: scenes still load', async () => {
  const { ctx, page, errors } = await open('/modules/foundations?renderer=webgl2', { reducedMotion: 'reduce' });
  await boot(page);
  await stageNote(page);
  const reduced = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  await ctx.close();
  assert(errors.length === 0, `console errors: ${errors.join(' | ')}`);
  assert(reduced, 'the reduced-motion preference was not applied');
});

await check('deep links render real pages (every route has its own HTML)', async () => {
  for (const path of ['/modules', '/modules/ethics/knowledge-check', '/modules/synthesis/challenge', '/achievements', '/glossary', '/credits']) {
    const res = await fetch(at(origin, path + '/'));
    assert(res.status === 200, `${path} returned ${res.status}`);
    const html = await res.text();
    assert(/<h1[ >]/.test(html), `${path} has no static h1`);
    // Links in the pre-rendered page must stay inside the deployment base; "/about" on GitHub Pages is the host's 404.
    const strays = [...html.matchAll(/<a [^>]*href="(\/[^"]*)"/g)].map((m) => m[1]).filter((h) => !h.startsWith(sub + '/') && h !== sub);
    assert(strays.length === 0, `${path} links outside the base path: ${strays.slice(0, 3).join(', ')}`);
  }
});

// ---- 6. accessibility ----------------------------------------------------------------------------
for (const path of ['/', '/modules/foundations', '/modules/foundations/lessons/1', '/modules/ethics', '/progress', '/glossary', '/accessibility']) {
  await check(`axe: no serious or critical WCAG 2.2 AA violations on ${path}`, async () => {
    const { ctx, page } = await open(path + '?renderer=webgl2&quality=0');
    await boot(page);
    await page.waitForTimeout(1200);
    const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    await ctx.close();
    const bad = result.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    assert(bad.length === 0, bad.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(', ')}`).join('\n'));
    return `${result.violations.length} minor, ${result.passes.length} rules passed`;
  });
}

await browser.close();
server.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
