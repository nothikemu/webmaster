// Plays the BUILT game in a real browser (run `pnpm build` first), the way a player would:
// new game, walk, enter buildings, find relics, win every station, unlock doors, reload, reset, keyboard, phone, accessibility.
// It uses fixed solutions for the puzzles (the puzzles are deterministic), so a failure means the game changed or broke.
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
console.log(`Playing ${base}/play/`);

const failures = [];
const consoleErrors = [];
const ok = (m) => console.log('  ok  ', m);
const fail = (m) => (failures.push(m), console.log('  FAIL', m));
async function check(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    fail(`${name}: ${String(e.message ?? e).split('\n').slice(0, 4).join(' / ')}`);
    if (process.env.PLAYTEST_SHOTS) await page.screenshot({ path: `${process.env.PLAYTEST_SHOTS}/fail-${failures.length}.png` }).catch(() => {});
  }
}
const expect = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
// this script plays the classic 2D game; playtest3d.mjs plays the 3D one
await ctx.addInitScript(() => localStorage.setItem('tideweight/gfx', JSON.stringify({ mode: '2d', quality: 'auto' })));
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()));
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR ' + e.message));

const room = () => page.evaluate(() => document.documentElement.dataset.gameRoom);
const xp = async () => parseInt(await page.locator('.game__xp .small').first().innerText(), 10);
const counts = () => page.locator('.game__counts').first().getAttribute('aria-label');
const playerX = () => page.evaluate(() => Number(/translate3d\(([-\d.]+)px/.exec(document.querySelector('.player').style.transform)?.[1] ?? 0));
async function dismissRewards() {
  for (let i = 0; i < 8; i++) {
    const b = page.locator('dialog.dialog[open] button:has-text("Keep going")');
    if (!(await b.count())) break;
    await b.first().click();
    await page.waitForTimeout(120);
  }
}
async function useFromList(label) {
  const d = page.locator('.room__guide');
  if (!(await d.evaluate((e) => e.open))) await d.locator('summary').click();
  await d.locator(`button:has-text("${label}")`).first().click();
}
async function goTo(label, expected) {
  await useFromList(label);
  await page.waitForFunction((r) => document.documentElement.dataset.gameRoom === r, expected, { timeout: 4000 });
  await page.waitForTimeout(400);
}
async function closeTop() {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(150);
}

// ---------------------------------------------------------------- 1. a new game
await page.goto(`${base}/play/`);
await check('title screen shows the game name, a Begin button and no sound before opt-in', async () => {
  await page.waitForSelector('.title');
  expect((await page.locator('h1').first().innerText()).toLowerCase().includes('tideweight'), 'no title');
  expect(await page.locator('button:has-text("Begin")').count() === 1, 'no Begin');
  expect(await page.evaluate(() => document.documentElement.dataset.audio) === undefined, 'audio context exists before opt-in');
});
await check('Begin opens Kernel\'s three-page introduction and closing it returns focus to the stage', async () => {
  await page.click('button:has-text("Begin")');
  await page.waitForSelector('dialog.gdialog[open]');
  expect((await page.locator('dialog.gdialog[open] h2').innerText()).toLowerCase() === 'kernel', 'not Kernel');
  await page.click('dialog.gdialog[open] button:has-text("Next")');
  await page.click('dialog.gdialog[open] button:has-text("Next")');
  await page.click('dialog.gdialog[open] button:has-text("Done")');
  await page.waitForTimeout(250);
  expect((await room()) === 'quay', 'not on the quay');
  expect(await page.evaluate(() => document.activeElement?.classList.contains('room__view')), 'focus not on the stage');
});
await check('walking with the arrow keys moves the player, and Shift hurries', async () => {
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(300);
  await page.keyboard.up('ArrowRight');
  await page.waitForTimeout(150);
  const a = await playerX();
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowRight');
  const b = await playerX();
  await page.waitForTimeout(150);
  await page.keyboard.down('Shift');
  await page.keyboard.down('ArrowRight');
  await page.waitForTimeout(700);
  await page.keyboard.up('ArrowRight');
  await page.keyboard.up('Shift');
  const c = await playerX();
  expect(b - a > 60, `walked only ${b - a}`);
  expect(c - b > (b - a) * 1.25, `shift did not speed up: walk ${Math.round(b - a)}, run ${Math.round(c - b)}`);
});
await check('the Archive is locked at level 1, with a reason', async () => {
  await page.keyboard.press('m');
  await page.waitForSelector('dialog.gdialog[open]');
  const btn = page.locator('dialog.gdialog[open] button:has-text("The Archive")');
  expect(await btn.isDisabled(), 'Archive not disabled');
  expect((await page.locator('dialog.gdialog[open]').innerText()).includes('Reach level 2'), 'no unlock hint');
  await closeTop();
});
await check('tapping a door walks there and goes in; first visit pays XP', async () => {
  const before = await xp();
  await page.locator('.hs--door[aria-label="The Loom House"]').click();
  await page.waitForFunction(() => document.documentElement.dataset.gameRoom === 'loom', null, { timeout: 8000 });
  await page.waitForTimeout(350);
  expect((await xp()) === before + 10, `xp ${before} -> ${await xp()}`);
});

// ---------------------------------------------------------------- 2. relics
await check('the lantern shows hidden things; a relic pays once and is kept', async () => {
  await page.keyboard.press('l');
  await page.waitForTimeout(150);
  expect(await page.locator('.room__view.is-sweeping').count() === 1, 'no sweep');
  const before = await xp();
  await useFromList('card of rules');
  await page.waitForSelector('dialog.gdialog[open]');
  expect((await page.locator('dialog.gdialog[open]').innerText()).includes('+12 XP'), 'no payout text');
  await closeTop();
  expect((await xp()) === before + 12, 'xp not paid');
  await useFromList('card of rules');
  await page.waitForSelector('dialog.gdialog[open]');
  expect((await page.locator('dialog.gdialog[open]').innerText()).toLowerCase().includes('already in your collection'), 'second visit not recognized');
  await closeTop();
  expect((await xp()) === before + 12, 'paid twice');
});

// ---------------------------------------------------------------- 3. stations
async function openStation(label) {
  await useFromList(label);
  await page.waitForSelector('dialog.gdialog[open] .gdialog__head');
}
async function pickRound(n) {
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: n === 0 ? 'Begin' : `Round ${n}`, exact: true }).click();
}
async function won(n, last) {
  await page.waitForSelector('dialog.gdialog[open] .takeaway', { timeout: 5000 });
  const t = (await page.locator('dialog.gdialog[open]').innerText()).toLowerCase();
  expect(t.includes(`round ${n} cleared`) || t.includes('cleared'), `round ${n} not shown as cleared`);
  await dismissRewards();
  if (last) await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Back to the room' }).click();
  else await page.locator('dialog.gdialog[open]').getByRole('button', { name: `Round ${n + 1}`, exact: true }).click();
}

await check("Curator's Cabinet: three rounds, including the coverage gap", async () => {
  const x0 = await xp();
  await openStation("Curator's Cabinet");
  const picks = { 1: [0, 3, 8, 15], 2: [0, 3, 5, 6, 14, 22] };
  await pickRound(1);
  for (const id of picks[1]) await page.click(`.spec[data-id="${id}"]`);
  await page.click('button:has-text("Test the model")');
  await won(1, false);
  for (const id of picks[2]) await page.click(`.spec[data-id="${id}"]`);
  await page.click('button:has-text("Test the model")');
  await won(2, false);
  for (const id of [1, 5, 16, 25]) await page.click(`.spec[data-id="${id}"]`);
  await page.click('button:has-text("Test the model")');
  await page.waitForSelector('dialog.gdialog[open] .callout--bad');
  expect((await page.locator('dialog.gdialog[open]').innerText()).includes('east'), 'no coverage explanation');
  await page.click('button:has-text("Send scouts east")');
  for (const id of [500, 506, 507, 511]) await page.click(`.spec[data-id="${id}"]`);
  await page.click('button:has-text("Test the model")');
  await won(3, true);
  expect((await xp()) >= x0 + 120, 'rounds did not pay');
  await dismissRewards();
});
await check('level 2 opens the Archive', async () => {
  await page.keyboard.press('m');
  await page.waitForSelector('dialog.gdialog[open]');
  expect(!(await page.locator('dialog.gdialog[open] button:has-text("The Archive")').isDisabled()), 'still locked');
  await closeTop();
});
await check('Weight Frame: dials, then learning', async () => {
  await openStation('Weight Frame');
  await pickRound(1);
  for (let r = 1; r <= 3; r++) {
    await page.locator('dialog.gdialog[open] input[type=range]').first().fill('1');
    for (let i = 0; i < 6 && !(await page.locator('dialog.gdialog[open] .callout--good').count()); i++) await page.click('button:has-text("Let it learn")');
    await won(r, r === 3);
  }
  await dismissRewards();
});
await goTo('The Quay', 'quay');
await goTo('The Foundry Docks', 'foundry');
await check('Anvil Orders: a leaked address fails with a reason, the safe piece passes', async () => {
  await openStation('Anvil Orders');
  const sets = { 1: ['o1-t1', 'o1-a1', 'o1-f1'], 2: ['o2-t1', 'o2-c1', 'o2-f1', 'o2-l1'] };
  await pickRound(1);
  for (const r of [1, 2]) {
    for (const id of sets[r]) await page.click(`.piece[data-id="${id}"]`);
    await page.click('button:has-text("Strike the forge")');
    await won(r, false);
  }
  for (const id of ['o3-t1', 'o3-c1', 'o3-a1', 'o3-f1', 'o3-l1']) await page.click(`.piece[data-id="${id}"]`);
  await page.click('button:has-text("Strike the forge")');
  await page.waitForSelector('dialog.gdialog[open] .forge');
  expect((await page.locator('dialog.gdialog[open] .forge').innerText()).includes('Privacy'), 'no privacy warning');
  await page.click('.piece[data-id="o3-c1"]');
  await page.click('.piece[data-id="o3-c2"]');
  await page.click('button:has-text("Strike the forge")');
  await won(3, true);
  await dismissRewards();
});
await check('Weld Test: three cases, tests spent on the suspicious claims', async () => {
  await openStation('Weld Test');
  const keeps = { 1: [0, 2, 3, 6], 2: [0, 2, 3, 6], 3: [0, 1, 4, 6] };
  const tests = { 1: [1, 4, 5], 2: [1, 4, 5], 3: [2, 3, 5] };
  await pickRound(1);
  for (const r of [1, 2, 3]) {
    const claims = page.locator('dialog.gdialog[open] .claim');
    for (const i of tests[r]) await claims.nth(i).getByRole('button', { name: /Test this/ }).click();
    expect(await page.locator('dialog.gdialog[open] .claim__ev').count() === 3, 'tests did not open evidence');
    expect(await claims.nth(0).getByRole('button', { name: /Test this/ }).isDisabled(), 'a fourth test was allowed');
    for (let i = 0; i < 7; i++) await claims.nth(i).getByRole('button', { name: keeps[r].includes(i) ? 'Keep' : 'Cut', exact: true }).click();
    await page.click('button:has-text("Submit the weld report")');
    await won(r, r === 3);
  }
  await dismissRewards();
});
await goTo('The Quay', 'quay');
await goTo('The Beacon', 'beacon');
await check('Fairness Audit: investigate, then remove the proxy', async () => {
  await openStation('Fairness Audit');
  const off = { 1: ['Has own laptop at home'], 2: ['Member of the debate club'], 3: ['Has own laptop at home', 'Attended the Saturday prep course'] };
  await pickRound(1);
  for (const r of [1, 2, 3]) {
    await page.locator('dialog.gdialog[open] label:has-text("Laptop at home"), dialog.gdialog[open] label:has-text("Debate club")').first().click().catch(() => {});
    expect(await page.locator('dialog.gdialog[open] .aud-table tbody tr').count() >= 2, 'no slice table');
    await page.click('button:has-text("Submit this screener")');
    expect(await page.locator('dialog.gdialog[open] .callout--bad').count() === 1, 'unchanged screener should fail');
    for (const f of off[r]) await page.locator('dialog.gdialog[open]').getByLabel(f).uncheck();
    await page.click('button:has-text("Submit this screener")');
    await won(r, r === 3);
  }
  await dismissRewards();
});
await check('two relics in the Beacon complete the Honest Lamp mission', async () => {
  await useFromList('lens');
  await page.waitForSelector('dialog.gdialog[open]');
  await closeTop();
  await useFromList('forged letter');
  // the mission ceremony opens above the relic card
  await page.waitForSelector('dialog.dialog[open]', { timeout: 4000 });
  expect((await page.locator('dialog.dialog[open]').innerText()).toLowerCase().includes('mission complete'), 'no mission ceremony');
  await dismissRewards();
  await closeTop();
  expect(await page.locator('dialog[open]').count() === 0, 'a dialog is still open');
});
await goTo('The Quay', 'quay');
await goTo('The Archive', 'archive');
await check('Timeline of Minds: reorder the cards with the buttons', async () => {
  await openStation('Timeline of Minds');
  await pickRound(0);
  const order = ['The imitation game', 'The summer workshop', 'A program that listens', 'Chess falls', 'Deep learning wins', 'Attention', 'Chat for everyone'];
  for (let i = 0; i < order.length; i++) {
    for (let guard = 0; guard < 10; guard++) {
      const titles = await page.locator('dialog.gdialog[open] .tcard__title').allInnerTexts();
      const idx = titles.findIndex((t) => t.endsWith(order[i]));
      if (idx <= i) break;
      await page.locator('dialog.gdialog[open]').getByRole('button', { name: `Move ${order[i]} earlier` }).click();
    }
  }
  await page.click('button:has-text("Check the order")');
  await won(1, true);
  await dismissRewards();
});
await check('clearing the last station shows the closing scene, once', async () => {
  await page.waitForSelector('dialog.gdialog[open] h2:has-text("The harbor is lit")', { timeout: 5000 });
  expect((await page.locator('dialog.gdialog[open]').innerText()).includes('final examination'), 'no pointer to the examination');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Keep exploring' }).click();
});
await check('the Trial Hall is open now (level 3), and its links leave the game cleanly', async () => {
  await goTo('The Quay', 'quay');
  await goTo('The Trial Hall', 'hall');
  await useFromList('case files');
  await page.waitForFunction(() => location.pathname.endsWith('/scenarios/'));
  await page.waitForSelector('h1');
  await page.waitForFunction(() => /scenarios/i.test(document.querySelector('main h1')?.textContent ?? ''));
  await page.goBack();
  await page.waitForSelector('.title');
});
await check('entering the last building completes Deep Time', async () => {
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('.room__view');
  await goTo('The Quay', 'quay');
  await goTo('Harbor Office', 'office');
  await page.waitForSelector('dialog.dialog[open]', { timeout: 4000 });
  expect((await page.locator('dialog.dialog[open]').innerText()).toLowerCase().includes('deep time'), 'no Deep Time ceremony');
  await dismissRewards();
});

// ---------------------------------------------------------------- 4. saving
await check('progress survives a reload, and Continue returns to the saved room', async () => {
  await page.goto(`${base}/play/`);
  await page.waitForSelector('.title');
  const summary = await page.locator('.title__save').innerText();
  expect(/16 of 16 station rounds/.test(summary), `save summary: ${summary}`);
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('.room__view');
  expect((await room()) === 'office', `resumed in ${await room()}`);
  expect((await counts()).startsWith('16 of 16'), await counts());
  await page.waitForTimeout(1600);
  expect(await page.locator('dialog[open]').count() === 0, 'the closing scene was shown again');
});
await check('game missions are completed on the mission board', async () => {
  await page.goto(`${base}/missions/`);
  await page.waitForSelector('h1');
  const t = await page.locator('main').innerText();
  for (const m of ['The curator\'s eye', 'Struck and tested', 'The honest lamp']) expect(t.includes(m), `${m} missing`);
  expect(await page.locator('.mission--complete').count() >= 4, `only ${await page.locator('.mission--complete').count()} complete`);
});

// ---------------------------------------------------------------- 5. keyboard, pause, sound
await page.goto(`${base}/play/`);
await page.click('button:has-text("Continue")');
await page.waitForSelector('.room__view');
await page.waitForTimeout(500);
await check('K, J, M and Escape open Kernel, the journal, the chart and the pause menu', async () => {
  for (const [key, title] of [['k', 'Kernel'], ['j', 'Journal'], ['m', 'The harbor chart'], ['Escape', 'Paused']]) {
    await page.keyboard.press(key);
    await page.waitForSelector('dialog.gdialog[open]');
    expect((await page.locator('dialog.gdialog[open] h2').first().innerText()).toLowerCase() === title.toLowerCase(), `${key} opened the wrong dialog`);
    await closeTop();
    expect(await page.locator('dialog.gdialog[open]').count() === 0, `${key} dialog did not close`);
  }
});
await check('focus never lands on the page behind an open dialog while tabbing', async () => {
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog.gdialog[open]');
  let inside = 0;
  for (let i = 0; i < 24; i++) {
    await page.keyboard.press('Tab');
    const where = await page.evaluate(() => (document.activeElement?.closest('dialog.gdialog[open]') ? 'dialog' : document.activeElement === document.body || !document.activeElement ? 'browser' : `behind: ${document.activeElement.tagName}.${document.activeElement.className}`));
    expect(where === 'dialog' || where === 'browser', `focus reached ${where}`);
    if (where === 'dialog') inside++;
  }
  expect(inside >= 10, 'focus did not move through the dialog');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  if (await page.locator('dialog.gdialog[open]').count()) await page.evaluate(() => document.querySelector('dialog.gdialog[open] button[aria-label=Close]')?.click());
});
await check('sound is silent until switched on, then the audio graph exists and ambience can run', async () => {
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog.gdialog[open]');
  expect(await page.evaluate(() => document.documentElement.dataset.audio) === undefined, 'audio before opt-in');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: /Effects off/ }).click();
  await page.waitForTimeout(600);
  expect(['running', 'suspended'].includes(await page.evaluate(() => document.documentElement.dataset.audio)), 'no audio context after opt-in');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Mute everything' }).click();
  expect(await page.locator('dialog.gdialog[open]').getByRole('button', { name: /Effects off/ }).count() === 1, 'mute did not apply');
  await closeTop();
});

// ---------------------------------------------------------------- 6. accessibility
for (const [name, setup] of [
  ['the stage', async () => {}],
  ['a station dialog', async () => { await useFromList("Curator's Cabinet").catch(() => {}); }],
]) {
  await check(`axe finds no serious problems on ${name}`, async () => {
    await page.goto(`${base}/play/`);
    await page.click('button:has-text("Continue")');
    await page.waitForSelector('.room__view');
    await goTo('The Quay', 'quay').catch(() => {});
    await goTo('The Loom House', 'loom');
    await setup();
    await page.waitForTimeout(300);
    const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = r.violations.filter((v) => ['serious', 'critical', 'moderate'].includes(v.impact));
    expect(!bad.length, bad.map((v) => `${v.id} (${v.nodes[0]?.target})`).join('; '));
  });
}

// ---------------------------------------------------------------- 7. reset
await check('Erase all progress returns to a fresh game', async () => {
  await page.goto(`${base}/play/`);
  await page.click('button:has-text("Continue")');
  await page.waitForSelector('.room__view');
  await page.keyboard.press('Escape');
  await page.waitForSelector('dialog.gdialog[open]');
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Erase all progress' }).click();
  await page.locator('dialog.gdialog[open]').getByRole('button', { name: 'Yes, erase everything' }).click();
  await page.waitForSelector('.title');
  expect(await page.locator('button:has-text("Begin")').count() === 1, 'not a fresh game');
  await page.reload();
  await page.waitForSelector('.title');
  expect(await page.locator('button:has-text("Begin")').count() === 1, 'reset did not survive reload');
});

// ---------------------------------------------------------------- 8. a phone
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
await phone.addInitScript(() => localStorage.setItem('tideweight/gfx', JSON.stringify({ mode: '2d', quality: 'auto' })));
const m = await phone.newPage();
m.on('console', (x) => x.type() === 'error' && consoleErrors.push('phone: ' + x.text()));
m.on('pageerror', (e) => consoleErrors.push('phone PAGEERROR ' + e.message));
await check('on a phone: no sideways scroll, on-screen controls, tap to walk, station fits the screen', async () => {
  await m.goto(`${base}/play/`);
  await m.waitForSelector('.title');
  expect(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'title overflows');
  await m.tap('button:has-text("Begin")');
  await m.waitForSelector('dialog.gdialog[open]');
  await m.tap('dialog.gdialog[open] button[aria-label="Close"]');
  await m.waitForSelector('.room__view');
  await m.waitForTimeout(300);
  expect(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'stage overflows');
  expect(await m.locator('.room__pad').isVisible(), 'no touch pad');
  const x0 = await m.evaluate(() => Number(/translate3d\(([-\d.]+)px/.exec(document.querySelector('.player').style.transform)?.[1] ?? 0));
  const box = await m.locator('.room__view').boundingBox();
  expect(box.y >= 0 && box.y + 120 < 844, `the stage starts off screen (top ${Math.round(box.y)})`);
  await m.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.4);
  await m.waitForTimeout(900);
  const x1 = await m.evaluate(() => Number(/translate3d\(([-\d.]+)px/.exec(document.querySelector('.player').style.transform)?.[1] ?? 0));
  expect(x1 > x0 + 40, 'tapping the floor did not walk');
  await m.locator('.room__pad .padbtn').first().dispatchEvent('pointerdown');
  await m.waitForTimeout(200);
  await m.locator('.room__pad .padbtn').first().dispatchEvent('pointerup');
  await m.tap('.game__tools button[aria-label^="Journal"]');
  await m.waitForSelector('dialog.gdialog[open]');
  expect(await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'journal overflows');
  await m.waitForTimeout(450); // the dialog slides in; measure it where it comes to rest
  const r = await m.locator('dialog.gdialog[open] .gdialog__box').boundingBox();
  expect(r.x >= 0 && r.x + r.width <= 391, 'dialog wider than the screen');
});
await phone.close();

await browser.close();
server.close();
const real = consoleErrors.filter((e) => !/favicon|android\.clients/.test(e));
if (real.length) fail(`console errors: ${real.slice(0, 3).join(' | ')}`);
else ok('no console errors anywhere');
console.log(failures.length ? `\n${failures.length} failure(s)` : '\nAll game checks passed');
process.exit(failures.length ? 1 : 0);
