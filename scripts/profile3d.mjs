// Profiles the BUILT 3D game in a real browser (run `pnpm build` first): draw calls, triangles, passes, geometry/texture counts,
// the CPU time spent submitting a frame, and frames per second, in the harbor and in each of the six interiors.
// Chromium here draws WebGL in software, so frames per second are only good for comparing one build with another, never as a
// promise about a real GPU; draw calls, triangles and passes are exact and are what a real GPU's cost is built from.
//   QUALITY=high|medium|low (default high)  OUT=path.json (optional)
import { createServer } from 'node:http';
import { readFile, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };
const quality = process.env.QUALITY ?? 'high';
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(dist, '404.html');
    res.statusCode = 404;
  }
  try {
    res.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
    res.end(await readFile(file));
  } catch {
    res.statusCode = 500;
    res.end('err');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: GL });
const ctx = await browser.newContext({ viewport: { width: 1000, height: 640 } });
await ctx.addInitScript((q) => {
  localStorage.setItem('tideweight/gfx', JSON.stringify({ mode: '3d', quality: q }));
  localStorage.setItem('tideweight/tutorial', '1');
}, quality);
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message.slice(0, 160)));

const read = () =>
  page.evaluate(() => {
    const el = document.querySelector('.stage3d');
    const g = (n) => Number(el?.getAttribute(n) ?? 0);
    return { calls: g('data-calls'), scene: g('data-scene-calls'), tris: g('data-tris'), passes: g('data-passes'), geoms: g('data-geoms'), textures: g('data-textures'), programs: g('data-programs'), cpu: g('data-cpu'), fps: g('data-fps') };
  });

async function sample(label) {
  await page.waitForTimeout(2500);
  const runs = [];
  for (let i = 0; i < 8; i++) {
    runs.push(await read());
    await page.waitForTimeout(350);
  }
  const avg = (k) => runs.reduce((a, r) => a + r[k], 0) / runs.length;
  const last = runs[runs.length - 1];
  const row = { area: label, calls: last.calls, sceneCalls: last.scene, tris: last.tris, passes: last.passes, geometries: last.geoms, textures: last.textures, programs: last.programs, cpuMs: +avg('cpu').toFixed(2), fps: Math.round(avg('fps')) };
  console.log(JSON.stringify(row));
  return row;
}

await page.goto(`${base}/play/`);
await page.waitForSelector('.title');
await page.click('button:has-text("Begin")');
await page.waitForSelector('.stage3d', { timeout: 60000 });
// close Kernel's introduction if it is up
for (let i = 0; i < 6; i++) {
  const d = page.locator('dialog[open]');
  if (!(await d.count())) break;
  await page.keyboard.press('Escape');
  await page.waitForTimeout(250);
}
const rows = [];
rows.push(await sample('Harbor (quay)'));

const places = [
  ['Loom', 'loom'],
  ['Foundry', 'foundry'],
  ['Weld', 'office'],
  ['Hall', 'hall'],
  ['Beacon', 'beacon'],
];
void places;
// walk through whichever doors the list offers, using the same "Places and objects" list a keyboard player uses
const labels = await page.evaluate(() => [...document.querySelectorAll('.room__guide button')].map((b) => b.textContent ?? ''));
const doors = labels.filter((t) => /^Enter /.test(t));
for (const t of doors) {
  const door = t.replace(/\s*\(.*\)\s*$/, '');
  const d = page.locator('.room__guide');
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').click();
  await d.locator(`button:has-text("${door}")`).first().click();
  const ok = await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-room') !== 'quay', null, { timeout: 15000 }).then(() => true).catch(() => false);
  if (!ok) {
    console.log(JSON.stringify({ area: door, skipped: 'locked or did not open' }));
    for (let i = 0; i < 3; i++) {
      if (!(await page.locator('dialog[open]').count())) break;
      await page.keyboard.press('Escape');
      await page.waitForTimeout(200);
    }
    continue;
  }
  const where = await page.getAttribute('.stage3d', 'data-room');
  rows.push(await sample(`Interior: ${where}`));
  // leave through the door
  const leave = page.locator('.room__guide button', { hasText: /Quay|Leave|Go out|Harbor/ });
  if (await leave.count()) {
    await leave.first().click();
    await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-room') === 'quay', null, { timeout: 15000 }).catch(() => {});
  }
}
console.log(errors.length ? `page errors: ${errors.join(' | ')}` : 'no page errors');
if (process.env.OUT) await writeFile(process.env.OUT, JSON.stringify({ quality, rows }, null, 2));
await browser.close();
server.close();
