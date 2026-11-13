// Plays the BUILT 3D game in a real browser (run `pnpm build` first).
// Chromium here draws WebGL in software, which is slow, so the test uses the lowest quality tier and a small window, and it waits
// on game state (position, room, dialogs) rather than on frame counts. It checks behaviour, not looks: movement, collision, the
// camera, travel, stations, relics, saving, quality and 2D switching, the fallback when WebGL is missing, keyboard, a phone, axe.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json' };
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
console.log(`Playing ${base}/play/ in 3D`);

const failures = [];
const errors = [];
const ok = (m) => console.log('  ok  ', m);
const fail = (m) => (failures.push(m), console.log('  FAIL', m));
let page;
async function check(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    fail(`${name}: ${String(e.message ?? e).split('\n').slice(0, 3).join(' / ')}`);
    if (process.env.PLAYTEST_SHOTS && page) await page.screenshot({ path: `${process.env.PLAYTEST_SHOTS}/fail3d-${failures.length}.png` }).catch(() => {});
  }
}
const expect = (c, m) => {
  if (!c) throw new Error(m);
};

const GL = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: GL });
const ctx = await browser.newContext({ viewport: { width: 900, height: 700 } });
await ctx.addInitScript(() => {
  if (!sessionStorage.getItem('gfxset')) {
    localStorage.setItem('tideweight/gfx', JSON.stringify({ mode: '3d', quality: 'low' }));
    if (!location.search.includes('tut=1')) localStorage.setItem('tideweight/tutorial', '1');
    sessionStorage.setItem('gfxset', '1');
  }
});
page = await ctx.newPage();
const watch = (p, tag) => {
  p.on('console', (m) => {
    const t = m.text();
    if (m.type() === 'error' && !/GPU stall|GL Driver|favicon|android\.clients/.test(t)) errors.push(`${tag}: ${t.slice(0, 160)}`);
  });
  p.on('pageerror', (e) => errors.push(`${tag} PAGEERROR ${e.message.slice(0, 160)}`));
};
watch(page, '3d');

const attr = (n) => page.getAttribute('.stage3d', n);
const num = async (n) => Number(await attr(n));
const room = () => page.evaluate(() => document.querySelector('.stage3d')?.getAttribute('data-room') ?? document.documentElement.dataset.gameRoom);
const xp = async () => parseInt(await page.locator('.game__xp .small').first().innerText(), 10);
async function dismissRewards() {
  for (let i = 0; i < 6; i++) {
    const b = page.locator('dialog.dialog[open] button:has-text("Keep going")');
    if (!(await b.count())) break;
    await b.first().click();
    await page.waitForTimeout(120);
  }
}
async function fromList(label) {
  const d = page.locator('.room__guide');
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').click();
  await d.locator(`button:has-text("${label}")`).first().click();
}
async function toRoom(label, expected) {
  await fromList(label);
  await page.waitForFunction((r) => document.querySelector('.stage3d')?.getAttribute('data-room') === r, expected, { timeout: 20000 });
  await page.waitForTimeout(500);
}
const closeTop = async () => {
  await page.keyboard.press('Escape');
  // wait for the dialog to be gone, not for a fixed time: a slow frame must not make the next key arrive while it is still closing
  await page.waitForFunction(() => !document.querySelector('dialog[open]'), null, { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(120);
};

// ---------------------------------------------------------------- 1. start
await page.goto(`${base}/play/`);
await check('a new game opens in 3D with the three.js engine loaded only now', async () => {
  await page.waitForSelector('.title');
  const before = await page.evaluate(() => performance.getEntriesByType('resource').some((r) => /Stage3D/.test(r.name)));
  expect(!before, 'the 3D engine was downloaded on the title screen');
  await page.click('button:has-text("Begin")');
  await page.waitForSelector('dialog.gdialog[open]');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Next' }).click();
  expect((await page.locator('dialog.gdialog[open]').innerText()).includes('W, A, S and D'), 'the introduction does not teach the 3D controls');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Next' }).click();
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Done' }).click();
  await page.waitForSelector('.stage3d canvas', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-px') !== null, null, { timeout: 30000 });
  expect((await room()) === 'quay', 'not on the quay');
  await page.waitForFunction(() => document.activeElement?.classList.contains('stage3d'), null, { timeout: 6000 }).catch(() => {});
  expect(await page.evaluate(() => document.activeElement?.classList.contains('stage3d')), 'focus is not on the stage');
});
await check('the objective tracker names the first goal, and the guide marks it with a distance and a marker', async () => {
  const t = page.locator('.objective');
  await t.waitFor({ timeout: 10000 });
  const text = (await t.innerText()).toLowerCase();
  expect(text.includes('objective') && text.includes('loom house'), `the tracker says: ${text}`);
  await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-goal') === 'door:loom', null, { timeout: 10000 });
  await page.waitForFunction(() => Number(document.querySelector('.stage3d')?.getAttribute('data-goal-dist')) > 0, null, { timeout: 10000 });
  const d = await num('data-goal-dist');
  expect(d > 20 && d < 90, `the route to the Loom door is ${d} m`);
  expect((await page.locator('.hs3.is-goal').count()) === 1, 'the goal has no marked label');
  expect((await page.locator('.hs3.is-goal').getAttribute('aria-label'))?.includes('Loom'), 'the goal label is not the Loom House');
});
await check('the picture is drawn and changes as the player moves', async () => {
  const a = await page.locator('.stage3d').screenshot();
  expect(a.length > 15000, `the picture looks blank (${a.length} bytes)`);
  await page.keyboard.down('w');
  await page.waitForTimeout(2500);
  await page.keyboard.up('w');
  const b = await page.locator('.stage3d').screenshot();
  expect(Buffer.compare(a, b) !== 0, 'the picture did not change');
});
await check('W moves the player north, S moves back', async () => {
  const z0 = await num('data-pz');
  await page.keyboard.down('w');
  await page.waitForTimeout(2200);
  await page.keyboard.up('w');
  const z1 = await num('data-pz');
  expect(z0 - z1 > 0.8, `moved ${(z0 - z1).toFixed(2)} m`);
  await page.keyboard.down('s');
  await page.waitForTimeout(2200);
  await page.keyboard.up('s');
  expect((await num('data-pz')) > z1 + 0.5, 'S did not move back');
});
await check('the arrow keys and a mouse drag turn the camera', async () => {
  const y0 = await num('data-yaw');
  await page.keyboard.down('ArrowLeft');
  await page.waitForTimeout(900);
  await page.keyboard.up('ArrowLeft');
  const y1 = await num('data-yaw');
  expect(Math.abs(y1 - y0) > 0.3, 'arrow keys did not turn the camera');
  const box = await page.locator('.stage3d').boundingBox();
  await page.mouse.move(box.x + 300, box.y + 250);
  await page.mouse.down();
  await page.mouse.move(box.x + 420, box.y + 250, { steps: 6 });
  await page.mouse.up();
  expect(Math.abs((await num('data-yaw')) - y1) > 0.2, 'dragging did not turn the camera');
});
await check('Space jumps and the player comes back down', async () => {
  let peak = 0;
  await page.keyboard.press(' ');
  for (let i = 0; i < 12; i++) {
    peak = Math.max(peak, await num('data-py'));
    await page.waitForTimeout(80);
  }
  expect(peak > 0.25, `jump peaked at ${peak}`);
  await page.waitForTimeout(2500);
  expect((await num('data-py')) < 0.05, 'did not land');
});
await check('the monument is solid: running straight at it stops the player outside it', async () => {
  // walk to the middle of the south side of the plaza, then run north at the monument
  await page.keyboard.down('Shift');
  await page.keyboard.down('w');
  await page.waitForTimeout(9000);
  await page.keyboard.up('w');
  await page.keyboard.up('Shift');
  const r = Math.hypot(await num('data-px'), await num('data-pz'));
  expect(r > 7.2, `walked through the monument (${r.toFixed(1)} m from the centre)`);
});

// ---------------------------------------------------------------- 2. places, people, things
await check('the lantern lifts and shows what is hidden', async () => {
  await page.keyboard.press('l');
  await page.waitForSelector('.stage3d.is-sweeping', { timeout: 4000 });
});
await check('the Archive is locked at level 1; the Loom House opens and pays for the first visit', async () => {
  await page.keyboard.press('m');
  await page.waitForSelector('dialog.gdialog[open]');
  expect(await page.locator('dialog.gdialog[open] button:has-text("The Archive")').isDisabled(), 'Archive is not locked');
  await closeTop();
  const before = await xp();
  await toRoom('The Loom House', 'loom');
  expect((await xp()) === before + 10, `xp ${before} -> ${await xp()}`);
});
await check('a relic is found once and paid once', async () => {
  const before = await xp();
  await fromList('card of rules');
  await page.waitForSelector('dialog.gdialog[open]');
  expect((await page.locator('dialog.gdialog[open]').innerText()).toLowerCase().includes('+12 xp'), 'no payout');
  await closeTop();
  expect((await xp()) === before + 12, 'not paid');
});
await check('talking to Wren shows her words and a link to the lessons', async () => {
  await fromList('Wren');
  await page.waitForSelector('dialog.gdialog[open]');
  expect((await page.locator('dialog.gdialog[open]').innerText()).includes('pattern'), 'no dialogue');
  await closeTop();
});
await check('a station opens in the 3D room and a round can be cleared (the Weight Frame)', async () => {
  await fromList('Weight Frame');
  await page.waitForSelector('dialog.gdialog[open] .gdialog__head');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Round 1', exact: true }).click();
  await page.locator('dialog.gdialog[open] input[type=range]').first().fill('1');
  for (let i = 0; i < 6 && !(await page.locator('dialog.gdialog[open] .callout--good').count()); i++) await page.click('button:has-text("Let it learn")');
  await page.waitForSelector('dialog.gdialog[open] .takeaway', { timeout: 6000 });
  await dismissRewards();
  await closeTop();
});
await check('every room can be entered and has its own set of things', async () => {
  const expectCount = { foundry: 7, beacon: 7, office: 6 };
  for (const [label, id] of [['The Quay', 'quay'], ['The Foundry Docks', 'foundry'], ['The Quay', 'quay'], ['The Beacon', 'beacon'], ['The Quay', 'quay'], ['The Harbor Office', 'office']]) {
    await toRoom(label, id);
    await dismissRewards();
    if (expectCount[id]) expect(await page.locator('.room__guide li').count() === expectCount[id], `${id} has ${await page.locator('.room__guide li').count()} things`);
  }
});

// ---------------------------------------------------------------- 3. saving and settings
await check('inside a room the tracker points at a station, and the way out is marked once the work is done', async () => {
  if ((await room()) !== 'quay') {
    await fromList('Quay');
    await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-room') === 'quay', null, { timeout: 20000 });
    await page.waitForTimeout(400);
  }
  await toRoom('Loom', 'loom');
  await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-goal')?.startsWith('station:'), null, { timeout: 10000 });
  const text = (await page.locator('.objective').innerText()).toLowerCase();
  expect(text.includes('play'), `the tracker says: ${text}`);
  expect((await page.locator('.hs3.is-goal').count()) === 1, 'the station has no marked label');
});
await check('progress and position survive a reload', async () => {
  await page.goto(`${base}/play/`);
  await page.waitForSelector('.title');
  expect(/station rounds/.test(await page.locator('.title__save').innerText()), 'no save summary');
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('.stage3d canvas', { timeout: 30000 });
  await page.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-room') === 'loom', null, { timeout: 20000 });
});
await check('K, J, M and Escape open Kernel, the journal, the chart and the pause menu in 3D', async () => {
  await page.waitForTimeout(500);
  for (const [key, title] of [['k', 'Kernel'], ['j', 'Journal'], ['m', 'The harbor chart'], ['Escape', 'Paused']]) {
    await page.keyboard.press(key);
    await page.waitForSelector('dialog.gdialog[open]', { timeout: 15000 }).catch(() => {
      throw new Error(`pressing ${key} opened nothing`);
    });
    expect((await page.locator('dialog.gdialog[open] h2').first().innerText()).toLowerCase() === title.toLowerCase(), `${key} opened the wrong dialog`);
    await closeTop();
  }
});
await check('the quality setting applies, and the classic 2D game is one button away', async () => {
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog.gdialog[open]');
  await page.locator('dialog.gdialog[open] select').selectOption('medium');
  await page.waitForFunction(() => document.querySelector('[data-quality]')?.getAttribute('data-quality') === 'medium', null, { timeout: 15000 });
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Classic 2D' }).click();
  await closeTop();
  await page.waitForSelector('.room__view', { timeout: 10000 });
  expect(await page.locator('.stage3d').count() === 0, '3D stage still mounted');
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog.gdialog[open]');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: '3D', exact: true }).click();
  await closeTop();
  await page.waitForSelector('.stage3d canvas', { timeout: 20000 });
  await page.locator('.stage3d').evaluate((e) => e.focus());
});
await check('axe finds no serious problems on the 3D stage', async () => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
  const bad = r.violations.filter((v) => ['serious', 'critical', 'moderate'].includes(v.impact));
  expect(!bad.length, bad.map((v) => `${v.id} (${v.nodes[0]?.target})`).join('; '));
});

// ---------------------------------------------------------------- 4. no WebGL, and a phone
const noGl = await browser.newContext({ viewport: { width: 900, height: 700 } });
const nopage = await noGl.newPage();
watch(nopage, 'nogl');
await nopage.addInitScript(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    return /webgl/.test(type) ? null : orig.call(this, type, ...rest);
  };
});
await nopage.goto(`${base}/play/`);
await check('without WebGL the classic 2D game starts by itself, with a note in the settings', async () => {
  await nopage.waitForSelector('.title');
  await nopage.click('button:has-text("Begin")');
  await nopage.waitForSelector('dialog.gdialog[open]');
  await nopage.keyboard.press('Escape');
  await nopage.waitForSelector('.room__view', { timeout: 10000 });
  await nopage.waitForTimeout(600);
  expect(await nopage.locator('.stage3d').count() === 0, 'a 3D stage was created without WebGL');
  await nopage.keyboard.press('Escape');
  await nopage.waitForSelector('dialog.gdialog[open]');
  expect((await nopage.locator('dialog.gdialog[open]').innerText()).includes('cannot draw 3D'), 'no explanation');
});
await noGl.close();

const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
await phone.addInitScript(() => localStorage.setItem('tideweight/gfx', JSON.stringify({ mode: '3d', quality: 'low' })));
const m = await phone.newPage();
watch(m, 'phone');
await check('on a phone: a stick and a Use button, no sideways scroll, and the stick walks the player', async () => {
  await m.goto(`${base}/play/`);
  await m.waitForSelector('.title');
  expect(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'title overflows');
  await m.tap('button:has-text("Begin")');
  await m.waitForSelector('dialog.gdialog[open]');
  await m.tap('dialog.gdialog[open] button[aria-label="Close"]');
  await m.waitForSelector('.stage3d canvas', { timeout: 30000 });
  await m.waitForFunction(() => document.querySelector('.stage3d')?.getAttribute('data-px') !== null, null, { timeout: 30000 });
  expect(await m.locator('.joy').isVisible(), 'no stick');
  expect(await m.locator('.stage3d__pad .padbtn--use').isVisible(), 'no Use button');
  expect(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'stage overflows');
  const z0 = Number(await m.getAttribute('.stage3d', 'data-pz'));
  await m.evaluate(() => {
    const j = document.querySelector('.joy');
    const r = j.getBoundingClientRect();
    const opts = (y) => ({ pointerId: 7, bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2 + y, pointerType: 'touch' });
    j.dispatchEvent(new PointerEvent('pointerdown', opts(0)));
    j.dispatchEvent(new PointerEvent('pointermove', opts(-50)));
  });
  await m.waitForTimeout(3000);
  await m.evaluate(() => document.querySelector('.joy').dispatchEvent(new PointerEvent('pointerup', { pointerId: 7, bubbles: true })));
  const z1 = Number(await m.getAttribute('.stage3d', 'data-pz'));
  expect(z0 - z1 > 0.5, `the stick moved the player ${(z0 - z1).toFixed(2)} m`);
});
await phone.close();

await check('a first-time player is taught in four steps that finish by themselves, and can skip; it is remembered', async () => {
  const c2 = await browser.newContext({ viewport: { width: 900, height: 700 } });
  await c2.addInitScript(() => localStorage.setItem('tideweight/gfx', JSON.stringify({ mode: '3d', quality: 'low' })));
  const p2 = await c2.newPage();
  watch(p2, 'tutorial');
  await p2.goto(`${base}/play/`);
  await p2.waitForSelector('.title');
  await p2.click('button:has-text("Begin")');
  await p2.waitForSelector('dialog.gdialog[open]');
  for (const name of ['Next', 'Next', 'Done']) await p2.locator('dialog.gdialog[open]').getByRole('button', { name }).click();
  await p2.waitForSelector('.stage3d canvas', { timeout: 30000 });
  const step = async () => (await p2.locator('.coach__count').innerText()).trim().toLowerCase();
  const waitStep = (n) => p2.waitForFunction((k) => document.querySelector('.coach__count')?.textContent?.toLowerCase().includes(`${k}/4`), n, { timeout: 25000 });
  await waitStep(1);
  expect((await p2.locator('.coach__text').innerText()).includes('Walk'), 'step 1 does not teach walking');
  await p2.waitForFunction(() => document.activeElement?.classList.contains('stage3d'), null, { timeout: 8000 }).catch(() => {});
  await p2.keyboard.down('w');
  await waitStep(2);
  await p2.keyboard.up('w');
  expect((await p2.locator('.coach__text').innerText()).toLowerCase().includes('look'), 'step 2 does not teach looking');
  await p2.keyboard.down('ArrowLeft');
  await waitStep(3);
  await p2.keyboard.up('ArrowLeft');
  expect((await p2.locator('.coach__text').innerText()).toLowerCase().includes('shift'), 'step 3 does not teach running and jumping');
  await p2.keyboard.press('Space');
  await waitStep(4);
  expect((await p2.locator('.coach__text').innerText()).toLowerCase().includes('red path'), 'step 4 does not point at the red path');
  expect((await step()).includes('4/4'), 'not on the last step');
  await p2.locator('.coach__skip').click();
  await p2.waitForFunction(() => !document.querySelector('.coach'), null, { timeout: 5000 });
  expect((await p2.evaluate(() => localStorage.getItem('tideweight/tutorial'))) === '1', 'skipping was not remembered');
  await p2.reload();
  await p2.waitForSelector('.title');
  await p2.click('button:has-text("Continue")').catch(() => p2.click('button:has-text("Begin")'));
  await p2.waitForSelector('.stage3d canvas', { timeout: 30000 }).catch(() => {});
  await p2.waitForTimeout(1200);
  expect((await p2.locator('.coach').count()) === 0, 'the tutorial came back after a reload');
  await c2.close();
});

await browser.close();
server.close();
if (errors.length) fail(`console errors: ${errors.slice(0, 3).join(' | ')}`);
else ok('no console errors anywhere');
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll 3D game checks passed');
process.exit(failures.length ? 1 : 0);
