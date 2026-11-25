// A browser check of the BUILT site (run `pnpm build` first). It serves dist/ the way a static host would and drives it with Playwright.
// It covers what the redesign changed: every route loads cleanly, nothing overflows sideways at four widths, axe finds no serious problems,
// the menu works from the keyboard, old addresses and old saves are handled, checks and instruments behave, and no game layer remains.
import { createServer } from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, normalize, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json', '.txt': 'text/plain' };

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
    res.end('error');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;

/** Every real page in dist: a folder with an index.html that is not a redirect stub. */
async function routes() {
  const out = [];
  async function walk(dir) {
    for (const name of await readdir(dir)) {
      const full = join(dir, name);
      if ((await stat(full)).isDirectory()) {
        if (name === 'assets') continue;
        await walk(full);
      } else if (name === 'index.html') {
        const html = await readFile(full, 'utf8');
        if (html.includes('http-equiv="refresh"')) continue;
        const rel = '/' + relative(dist, dir).replace(/\\/g, '/');
        out.push(rel === '/.' ? '/' : rel);
      }
    }
  }
  await walk(dist);
  return out.map((r) => (r === '/' || r === '' ? '/' : r)).sort();
}

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] });
let failures = 0;
const ok = (name) => console.log(`  ok   ${name}`);
const fail = (name, detail) => {
  failures++;
  console.log(`  FAIL ${name}${detail ? `: ${detail}` : ''}`);
};
async function check(name, fn) {
  try {
    await fn();
    ok(name);
  } catch (e) {
    fail(name, String(e.message ?? e).split('\n')[0]);
  }
}
const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

async function fresh(width = 1280, height = 900, init) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  if (init) await ctx.addInitScript(init);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  return { ctx, page, errors };
}
const go = async (page, path) => {
  await page.goto(base + path, { waitUntil: 'networkidle' });
  await page.waitForSelector('main h1', { timeout: 8000 });
};

const all = await routes();
console.log(`Checking ${all.length} pages in ${base}`);

// ---------------------------------------------------------------------------------------------------------------- every route
console.log('\nEvery page');
await check(`all ${all.length} pages load with one h1, a title, landmarks and no console errors`, async () => {
  const { ctx, page, errors } = await fresh();
  const bad = [];
  for (const r of all) {
    if (r === '/404.html') continue;
    await go(page, r);
    const info = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, title: document.title, main: !!document.querySelector('main'), header: !!document.querySelector('header'), footer: !!document.querySelector('footer'), nav: document.querySelectorAll('nav').length }));
    if (info.h1 !== 1 || !info.title || !info.main || !info.header || !info.footer || info.nav < 1) bad.push(`${r} ${JSON.stringify(info)}`);
  }
  await ctx.close();
  assert(bad.length === 0, bad.slice(0, 3).join(' | '));
  assert(errors.length === 0, errors.slice(0, 2).join(' | '));
});
await check('a made-up address shows the helpful not-found page with a 404 status', async () => {
  const { ctx, page } = await fresh();
  const res = await page.goto(base + '/nope/nothing/', { waitUntil: 'networkidle' });
  await page.waitForSelector('main h1');
  assert(res.status() === 404, `status ${res.status()}`);
  assert((await page.textContent('main h1')).includes('not in the guide'), 'wrong heading');
  assert(await page.locator('main a[href="/modules/"]').count() > 0, 'no way back');
  await ctx.close();
});

console.log('\nLayout at four widths');
for (const w of [320, 390, 768, 1280]) {
  await check(`no sideways scrolling at ${w}px on any page`, async () => {
    const { ctx, page } = await fresh(w, 800);
    const bad = [];
    for (const r of all) {
      if (r === '/404.html') continue;
      await go(page, r);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      if (over > 0) bad.push(`${r} (+${over}px)`);
    }
    await ctx.close();
    assert(bad.length === 0, bad.slice(0, 4).join(', '));
  });
}
await check('text can be enlarged to 200% on a small window without anything spilling sideways', async () => {
  const { ctx, page } = await fresh(640, 800);
  for (const r of ['/', '/modules/foundations', '/modules/foundations/neural-networks', '/glossary', '/overview']) {
    await go(page, r);
    await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    assert(over <= 0, `${r} overflows by ${over}px with 200% text`);
  }
  await ctx.close();
});

// ------------------------------------------------------------------------------------------------------------------- accessibility
console.log('\nAccessibility');
const axePages = ['/', '/modules', '/modules/foundations', '/modules/synthesis', '/modules/ethics', '/modules/foundations/what-ai-is', '/modules/foundations/neural-networks', '/modules/foundations/training-and-inference', '/modules/synthesis/roles-tasks-constraints', '/modules/synthesis/evaluating-outputs', '/modules/ethics/bias-and-fairness', '/modules/ethics/accountability', '/modules/ethics/cases', '/glossary', '/tools', '/overview', '/about', '/accessibility', '/credits', '/nope/nothing'];
await check(`axe finds no serious or critical problems on ${axePages.length} pages`, async () => {
  const { ctx, page } = await fresh();
  const bad = [];
  for (const r of axePages) {
    await go(page, r);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    for (const v of res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical')) bad.push(`${r}: ${v.id} (${v.nodes.length})`);
  }
  await ctx.close();
  assert(bad.length === 0, bad.slice(0, 4).join(' | '));
});
await check('axe is also clean with the menu open, an instrument in use and a check answered', async () => {
  const { ctx, page } = await fresh(390, 800);
  await go(page, '/modules/synthesis');
  await page.getByRole('button', { name: 'Menu' }).click();
  let res = await new AxeBuilder({ page }).analyze();
  assert(res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical').length === 0, 'menu open');
  await page.keyboard.press('Escape');
  await go(page, '/modules/synthesis/few-shot-prompting');
  await page.getByLabel(/lean toward/i).check();
  await page.getByRole('button', { name: 'Check my answer' }).click();
  res = await new AxeBuilder({ page }).analyze();
  const sev = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  await ctx.close();
  assert(sev.length === 0, sev.map((v) => v.id).join(','));
});
await check('every control on the menu and a lesson is at least 44px tall', async () => {
  const { ctx, page } = await fresh(390, 800);
  await go(page, '/modules/foundations/what-ai-is');
  const small = await page.evaluate(() => [...document.querySelectorAll('main button, main .btn, header button, .option, nav a')].filter((el) => el.offsetParent !== null).map((el) => ({ t: (el.textContent || '').trim().slice(0, 30), h: el.getBoundingClientRect().height })).filter((x) => x.h < 43.5));
  await ctx.close();
  assert(small.length === 0, small.map((s) => `${s.t} ${Math.round(s.h)}px`).slice(0, 4).join(', '));
});
await check('the skip link is the first thing Tab reaches and it moves focus to the page', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules');
  await page.keyboard.press('Tab');
  assert((await page.evaluate(() => document.activeElement?.textContent?.trim())) === 'Skip to main content', 'first tab stop is not the skip link');
  await page.keyboard.press('Enter');
  assert((await page.evaluate(() => document.activeElement?.id)) === 'main', 'focus did not move to main');
  await ctx.close();
});
await check('the compact menu opens, traps focus, closes with Escape and returns focus', async () => {
  const { ctx, page } = await fresh(390, 800);
  await go(page, '/');
  const toggle = page.getByRole('button', { name: 'Menu' });
  assert(await toggle.isVisible(), 'no Menu button on a phone');
  assert(!(await page.locator('.site-nav').isVisible()), 'the full navigation is still showing');
  await toggle.click();
  const dlg = page.getByRole('dialog', { name: 'Site menu' });
  assert(await dlg.isVisible(), 'menu did not open');
  assert((await toggle.getAttribute('aria-expanded')) === 'true', 'aria-expanded not set');
  for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
  assert(await page.evaluate(() => !!document.activeElement?.closest('dialog')), 'focus left the menu');
  await page.keyboard.press('Escape');
  assert(!(await dlg.isVisible()), 'Escape did not close it');
  assert(await page.evaluate(() => document.activeElement?.textContent?.includes('Menu')), 'focus did not return to the Menu button');
  await toggle.click();
  await dlg.getByRole('link', { name: 'Glossary' }).click();
  await page.waitForURL('**/glossary/');
  assert(!(await dlg.isVisible()), 'menu stayed open after choosing a page');
  await ctx.close();
});
await check('the current section is marked in the navigation', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/synthesis/few-shot-prompting');
  assert((await page.locator('.site-nav a[aria-current]').first().textContent()).includes('Synthesis'), 'Synthesis not marked as current');
  await go(page, '/glossary');
  assert((await page.locator('.site-nav a[aria-current="page"]').textContent()).includes('Glossary'), 'Glossary not marked as the current page');
  await ctx.close();
});
await check('reduced motion is honoured: page entrance and transitions do not animate', async () => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await go(page, '/');
  const d = await page.evaluate(() => getComputedStyle(document.querySelector('.page-enter')).animationDuration);
  await ctx.close();
  assert(parseFloat(d) < 0.01, `animation lasts ${d}`);
});

// ---------------------------------------------------------------------------------------------------------- the game layer is gone
console.log('\nNo game layer');
await check('no page links to the old game, missions, certification, challenges or achievements, and none has a points, level or streak display', async () => {
  const { ctx, page } = await fresh();
  const bad = [];
  for (const r of all) {
    if (r === '/404.html') continue;
    await go(page, r);
    const found = await page.evaluate(() => {
      const hrefs = [...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => /\/(play|missions?|certification|achievements?|challenges?|challenge|practice|scenarios|logbook|codex|lab)\/?(\b|$)/.test(h));
      const chrome = [...document.querySelectorAll('header, footer, .page-head, .hero, .compare, .overview')].map((e) => e.innerText).join(' ');
      const words = (chrome.match(/\b(XP|badges?|streaks?|leaderboards?|level up|achievements?)\b/gi) ?? []);
      return { hrefs, words };
    });
    if (found.hrefs.length || found.words.length) bad.push(`${r}: ${[...found.hrefs, ...found.words].slice(0, 3).join(',')}`);
  }
  await ctx.close();
  assert(bad.length === 0, bad.slice(0, 3).join(' | '));
});
await check('lesson checks show no score, tally, timer or pass mark, and can be retried', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/foundations/what-ai-is');
  const q = page.locator('.check');
  await q.getByLabel('It can read any handwriting in any language.').check();
  await q.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByText('Not quite.').waitFor();
  assert((await q.textContent()).includes('Try this question again'), 'no retry offered');
  const chrome = await q.evaluate((el) => [...el.children].filter((c) => !c.querySelector('.callout')).map((c) => c.innerText).join(' ').replace(/question \d+ of \d+/i, ''));
  assert(!/\b(\d+\s*(of|\/)\s*\d+|points|xp|timer|seconds|streak)\b/i.test(chrome), 'a score-like string is showing: ' + chrome.slice(0, 80));
  assert((await q.locator('[role=meter], progress').count()) === 0, 'a meter is showing');
  await q.getByRole('button', { name: 'Try this question again' }).click();
  await q.getByLabel('It performs well on the narrow task it was built and tested for.').check();
  await q.getByRole('button', { name: 'Check my answer' }).click();
  await page.getByText('That holds up.').waitFor();
  await ctx.close();
});
await check('experiments keep no score either (a sorter explains every item and offers another go)', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/foundations/training-and-inference');
  const first = page.locator('.sort-item').first();
  await first.locator('label').nth(1).click();
  for (let i = 1; i < 8; i++) await page.locator('.sort-item').nth(i).locator('label').first().click();
  await page.getByRole('button', { name: 'Check my sorting' }).click();
  const text = await page.locator('#experiment').textContent();
  assert(/Clear and try again/.test(text), 'no retry');
  assert(!/\b\d+ of \d+ placed correctly\b/i.test(text), 'a tally is showing');
  await ctx.close();
});

// --------------------------------------------------------------------------------------------------------------- old addresses
console.log('\nOld addresses and old saves');
for (const [from, to, why] of [
  ['/achievements/', '/overview/', 'the achievements page'],
  ['/challenge/foundations/', '/modules/', 'a standalone challenge page'],
  ['/challenges/', '/modules/', 'the challenges list'],
  ['/play/', '/modules/', 'the game'],
  ['/missions/', '/modules/', 'missions'],
  ['/certification/', '/modules/', 'the certification'],
  ['/logbook/', '/overview/', 'the logbook'],
  ['/codex/', '/glossary/', 'the codex'],
  ['/scenarios/', '/modules/ethics/cases/', 'the scenarios'],
  ['/learn/use/t2/', '/modules/synthesis/roles-tasks-constraints/', 'an old lesson address'],
  ['/modules/ethics/c3/', '/modules/ethics/adversarial-inputs/', 'a first-version lesson address'],
]) {
  await check(`${from} (${why}) lands on ${to}`, async () => {
    const { ctx, page } = await fresh();
    await page.goto(base + from, { waitUntil: 'networkidle' });
    await page.waitForSelector('main h1', { timeout: 8000 });
    assert(new URL(page.url()).pathname === to, `ended at ${new URL(page.url()).pathname}`);
    assert((await page.locator('h1').count()) === 1, 'not a real page');
    await ctx.close();
  });
}
await check('a redirected address explains why, once, and the note can be dismissed', async () => {
  const { ctx, page } = await fresh();
  await page.goto(base + '/achievements/', { waitUntil: 'networkidle' });
  await page.waitForURL('**/overview/');
  await page.waitForSelector('.notice');
  assert(!new URL(page.url()).search, 'the address kept its ?moved= tail');
  const note = page.locator('.notice');
  assert((await note.textContent()).includes('no longer has points'), 'no explanation');
  await note.getByRole('button', { name: 'Dismiss' }).click();
  assert((await note.count()) === 0, 'note stayed');
  await ctx.close();
});
const OLD_SAVE = JSON.stringify({ v: 1, createdAt: 1, xp: 940, badges: { first: 1 }, missions: { m1: 1 }, lessons: { u1: { learned: true, tryScore: 80, checkBest: 3, done: true, doneAt: 1700000000000 }, u3: { learned: true, tryScore: 0, checkBest: 0, done: false }, t2: { learned: true, tryScore: 90, checkBest: 3, done: true, doneAt: 1700000100000 } }, game: { relics: { a: 1 } }, lastLesson: 'u3' });
await check('an earlier save is carried over (finished lessons only), left untouched, and points and badges are not shown anywhere', async () => {
  const { ctx, page } = await fresh(1280, 900, `if (!localStorage.getItem('parameter/v1') && !sessionStorage.getItem('seeded')) { localStorage.setItem('parameter/v1', ${JSON.stringify(OLD_SAVE)}); sessionStorage.setItem('seeded', '1'); }`);
  await go(page, '/overview');
  const text = await page.locator('main').innerText();
  assert(/carries over 2 finished lessons/.test(text), 'migration notice missing');
  assert(/1 of 5\s*core lessons complete/i.test(text.replace(/\n/g, ' ')), 'Foundations should show 1 of 5');
  assert(!/940|\bXP\b|streak|relic/i.test(text), 'old game data is showing');
  const stored = await page.evaluate(() => ({ old: localStorage.getItem('parameter/v1'), neu: localStorage.getItem('parameter/learning/v2') }));
  assert(stored.old && JSON.parse(stored.old).xp === 940, 'the earlier save was changed');
  assert(stored.neu && Object.keys(JSON.parse(stored.neu).completed).sort().join() === 't2,u1', 'new save wrong');
  assert(!/xp|badge|relic/i.test(stored.neu), 'game data copied into the new save');
  await ctx.close();
});
await check('export, load and erase work, and erasing removes the earlier save too (after confirming)', async () => {
  const { ctx, page } = await fresh(1280, 900, `if (!sessionStorage.getItem('seeded')) { localStorage.setItem('parameter/v1', ${JSON.stringify(OLD_SAVE)}); sessionStorage.setItem('seeded', '1'); }`);
  await go(page, '/overview');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my data' }).click()]);
  const data = JSON.parse(await readFile(await download.path(), 'utf8'));
  assert(data.format === 'parameter-learning' && Object.keys(data.state.completed).length === 2, 'bad export');
  assert(!/\bxp\b|badge|relic|streak/i.test(JSON.stringify(data)), 'game data in the export');
  await page.getByRole('button', { name: 'Erase everything stored here' }).click();
  assert((await page.getByRole('alertdialog').textContent()).includes('cannot be undone'), 'no confirmation');
  await page.getByRole('button', { name: 'Keep it' }).click();
  assert((await page.evaluate(() => localStorage.getItem('parameter/v1'))) !== null, 'kept data was removed');
  await page.getByRole('button', { name: 'Erase everything stored here' }).click();
  await page.getByRole('button', { name: 'Yes, erase it' }).click();
  const after = await page.evaluate(() => [localStorage.getItem('parameter/v1'), localStorage.getItem('parameter/learning/v2')]);
  assert(after[0] === null, 'the earlier save survived the erase');
  assert(JSON.parse(after[1] ?? '{"completed":{}}').completed && Object.keys(JSON.parse(after[1] ?? '{"completed":{}}').completed).length === 0, 'completed lessons survived');
  await page.locator('input[type=file]').setInputFiles({ name: 'back.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(data)) });
  await page.getByText(/2 completed lessons were restored/).waitFor();
  await page.locator('.erase').waitFor();
  await ctx.close();
});
await check('marking a lesson complete is explicit, reversible, saved on the device, and shown neutrally on the module page', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/foundations/what-ai-is');
  await page.getByRole('button', { name: 'Mark this lesson complete' }).click();
  await page.getByRole('button', { name: 'Mark as not complete' }).waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Mark as not complete' }).waitFor();
  await go(page, '/modules/foundations');
  assert(/1 of 5 marked complete/.test(await page.locator('.module__lessons .note').textContent()), 'module page does not show 1 of 5');
  assert((await page.locator('.lesson-row').first().textContent()).includes('Complete'), 'row not marked');
  // every lesson stays open: nothing is locked
  await go(page, '/modules/ethics/accountability');
  assert((await page.locator('main h1').textContent()) === 'Accountability', 'a later lesson would not open');
  await ctx.close();
});

// ------------------------------------------------------------------------------------------------------------------ instruments
console.log('\nThe three instruments');
await check('prompt console: labelled a simulation; a slider change explains what moved and why; presets and briefs work', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/synthesis');
  const c = page.locator('.console');
  assert((await c.textContent()).includes('This is a simulation. No AI model is called.'), 'simulation not stated');
  const temp = c.getByRole('slider', { name: 'Temperature' });
  const bars = async () => c.locator('.odds__pct').allTextContents();
  const before = await bars();
  await temp.fill('5');
  const note = await c.locator('.change').textContent();
  assert(/temperature from 55 to 5/i.test(note) && /Why:/.test(note), 'no explanation: ' + note.slice(0, 80));
  assert(JSON.stringify(before) !== JSON.stringify(await bars()), 'the odds did not change');
  await c.getByRole('button', { name: /Constraint stacking/ }).click();
  assert((await c.getByRole('button', { name: /Constraint stacking/ }).getAttribute('aria-pressed')) === 'true', 'preset not pressed');
  assert((await c.locator('.prompt-parts').textContent()).includes('Do not speculate about causes'), 'preset did not change the prompt');
  await c.getByLabel(/Extract invoice totals/).check();
  assert((await c.locator('.brief').textContent()).includes('Inside the range'), 'brief feedback missing');
  assert(!/score|you passed|you failed/i.test(await c.locator('.brief').textContent()), 'brief is scored');
  await ctx.close();
});
await check('neural topology: step the signal, edit a weight with the keyboard, and the output and the explanation both change', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/foundations');
  const t = page.locator('.topology');
  const out = async () => (await t.locator('.topology__out .metrics dd').first().textContent()).trim();
  const start = await out();
  await t.getByRole('button', { name: 'Back a layer' }).click();
  await t.getByRole('button', { name: 'Back a layer' }).click();
  assert((await t.getByText(/as far as first hidden layer/i).count()) > 0, 'stepping did not report the layer');
  await t.getByRole('button', { name: 'Show every layer' }).click();
  await t.getByLabel('Connection').selectOption({ index: 26 });
  const w = t.getByRole('slider', { name: 'Weight' });
  await w.focus();
  await page.keyboard.press('Home');
  assert((await out()) !== start, 'the output did not move');
  assert(/changed the weight/i.test(await t.locator('.change').textContent()), 'no explanation of the weight change');
  await t.getByRole('button', { name: 'Put every weight back' }).click();
  assert((await out()) === start, 'resetting did not restore the output');
  await t.locator('summary').click();
  assert((await t.locator('table').count()) === 1, 'the arithmetic table is missing');
  await ctx.close();
});
await check('vulnerability matrix: each failure shows a before and after, in words and shapes, with a mitigation, and the incident exercise is unscored', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/ethics');
  const m = page.locator('.matrix');
  const pick = m.locator('.matrix__pick');
  for (const name of ['Bias drift', 'Data leakage', 'Adversarial input', 'Opaque decisioning']) {
    await pick.getByLabel(name, { exact: true }).check();
    await m.getByRole('button', { name: 'With the mitigation' }).click();
    const text = await m.locator('.change').textContent();
    assert(/fewer harmed cases/.test(text) && /Illustrative numbers/.test(text), `${name}: no comparison in words`);
    assert((await m.locator('.matrix__svg').getAttribute('aria-label')).includes('Illustrative'), `${name}: the drawing has no text alternative`);
  }
  await pick.getByLabel('Bias drift', { exact: true }).check();
  assert((await m.locator('.matrix__text').textContent()).includes('34.7%'), 'real-world fact missing from the bias mitigation');
  await ctx.close();
});

// -------------------------------------------------------------------------------------------------------------- other interactions
await check('if an instrument fails to download, a clear fallback replaces it (no endless loading message) and the rest of the page works', async () => {
  const { ctx, page } = await fresh();
  await page.route(/NeuralTopology-.*\.js/, (r) => r.abort());
  await page.goto(base + '/modules/foundations/', { waitUntil: 'networkidle' });
  await page.waitForSelector('main h1');
  await page.getByText('The instrument could not load').waitFor({ timeout: 8000 });
  assert((await page.getByText('Loading the instrument').count()) === 0, 'still showing a loading message');
  assert((await page.getByRole('button', { name: 'Try loading it again' }).count()) === 1, 'no way to retry');
  assert((await page.locator('.lesson-row').count()) >= 5, 'the rest of the page is gone');
  await ctx.close();
});
await check('without JavaScript the page still says what the site is and what it holds', async () => {
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(base + '/modules/ethics/', { waitUntil: 'load' });
  const text = await page.locator('noscript').first().textContent().catch(() => '');
  const html = await page.content();
  assert(/needs JavaScript|need\s+JavaScript/i.test(html) || /JavaScript/.test(text), 'no explanation without JavaScript');
  assert(/Foundations/.test(html) && /Synthesis/.test(html) && /Ethics/.test(html), 'the three modules are not named');
  await ctx.close();
});

console.log('\nOther pages');
await check('glossary search and module filter narrow the list, announce the count, and have a not-found state', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/glossary');
  const n0 = await page.locator('.term').count();
  assert(n0 >= 40, `only ${n0} terms`);
  await page.getByLabel('Search the glossary').fill('token');
  assert((await page.locator('.term').count()) < n0, 'search did not narrow');
  await page.getByLabel('Search the glossary').fill('zzzz');
  assert((await page.getByText('No term matches that').count()) === 1, 'no empty state');
  await page.getByRole('button', { name: 'Clear the search' }).click();
  await page.getByRole('button', { name: 'Ethics', exact: true }).click();
  const mods = await page.locator('.term .tag').allTextContents();
  assert(mods.length > 0 && mods.every((t) => t === 'Ethics'), 'module filter wrong');
  await ctx.close();
});
await check('cases: choose, see what follows and what the others would have led to, with no score', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/ethics/cases');
  await page.locator('.case-card').first().click();
  await page.locator('.option').first().click();
  await page.getByRole('button', { name: 'See what follows' }).click();
  const text = await page.locator('.case').textContent();
  assert(/Holds up|Does not hold up/.test(text), 'no judgement shown');
  assert(/What the other choices would lead to/.test(text), 'branches hidden');
  assert(!/score|points|\d+ of \d+ correct/i.test(text), 'a score is showing');
  await ctx.close();
});
await check('tool atlas search and kind filter work and keep every entry dated', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/tools');
  const n = await page.locator('.dossier').count();
  assert(n >= 3, 'too few tools');
  assert((await page.locator('.dossier').allTextContents()).every((t) => /Checked \d{4}-\d{2}-\d{2}/.test(t)), 'an entry has no check date');
  await page.getByRole('button', { name: 'Coding' }).click();
  assert((await page.locator('.dossier').count()) <= n, 'filter did nothing');
  await ctx.close();
});
await check('lessons offer the next lesson in the same module and a way back to the module', async () => {
  const { ctx, page } = await fresh();
  await go(page, '/modules/synthesis/roles-tasks-constraints');
  assert((await page.locator('.pager--next .pager__title').textContent()).trim() === 'Examples and few-shot prompting', 'wrong next lesson');
  assert((await page.locator('.crumbs a').nth(1).textContent()) === 'Synthesis', 'no way back to the module');
  assert((await page.locator('.lesson__rail [aria-current="page"]').textContent()).includes('Roles, tasks and constraints'), 'module position not shown');
  await ctx.close();
});

await browser.close();
server.close();
console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
