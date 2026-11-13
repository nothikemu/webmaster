// Takes screenshots of the BUILT 3D game (run `pnpm build` first). Debug aid, not part of the test suite.
//   OUT=dir  QUALITY=high  SHOTS=quay,loom,foundry,beacon,office  W=1100 H=650
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
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
const out = process.env.OUT ?? '/tmp/shots';
await mkdir(out, { recursive: true });
const shots = (process.env.SHOTS ?? 'quay,loom').split(',');
const W = Number(process.env.W ?? 1100);
const H = Number(process.env.H ?? 900);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await ctx.addInitScript((q) => {
  if (location.search.includes('tut=1')) window.__noTut = true;
  localStorage.setItem('tideweight/gfx', JSON.stringify({ mode: '3d', quality: q }));
  if (!localStorage.getItem('tideweight/tutorial') && !window.__noTut) localStorage.setItem('tideweight/tutorial', '1');
}, process.env.QUALITY ?? 'high');
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push((e.stack ?? e.message).split('\n').slice(0, 6).join(' | ')));
page.on('console', (m) => m.type() === 'error' && !/GPU stall|GL Driver/.test(m.text()) && errors.push(m.text().slice(0, 140)));
await page.goto(`${base}/play/${process.env.QS ?? ''}`);
await page.waitForSelector('.title');
await page.click('button:has-text("Begin")');
await page.waitForSelector('.stage3d', { timeout: 60000 });
const close = async () => {
  for (let i = 0; i < 8; i++) {
    if (!(await page.locator('dialog[open]').count())) break;
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
  }
};
await close();
const settle = async (ms = 3500) => {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(ms);
};
for (const s of shots) {
  if (s === 'quay') {
    await settle();
    await page.screenshot({ path: join(out, 'quay.png') });
  } else if (s === 'plaza') {
    await page.keyboard.down('w');
    await page.waitForTimeout(2500);
    await page.keyboard.up('w');
    await settle(2500);
    await page.screenshot({ path: join(out, 'plaza.png') });
  } else if (s === 'orbit') {
    await page.keyboard.down('ArrowLeft');
    await page.waitForTimeout(1600);
    await page.keyboard.up('ArrowLeft');
    await settle(2500);
    await page.screenshot({ path: join(out, 'orbit.png') });
  } else {
    const d = page.locator('.room__guide');
    if (!(await d.evaluate((e) => e.open))) await d.locator('summary').click();
    const names = { loom: 'Loom', foundry: 'Foundry', beacon: 'Beacon', office: 'Office', hall: 'Trial Hall', archive: 'Archive' };
    await d.locator(`button:has-text("${names[s]}")`).first().click();
    await page.waitForFunction((r) => document.querySelector('.stage3d')?.getAttribute('data-room') === r, s, { timeout: 20000 }).catch(() => {});
    await close();
    await settle();
    await page.screenshot({ path: join(out, `${s}.png`) });
    const back = page.locator('.room__guide button', { hasText: /the Quay/i });
    if (await back.count()) await back.first().click();
    await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-room') === 'quay', null, { timeout: 15000 }).catch(() => {});
    await close();
  }
}
console.log(errors.length ? 'errors: ' + errors.join(' | ') : 'no errors');
await browser.close();
server.close();
