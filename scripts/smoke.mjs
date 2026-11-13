// End-to-end smoke test of the BUILT site (run `pnpm build` first).
// It serves dist/ like a static host would, then drives a real browser through every page and a full lesson,
// and scans each page with axe for WCAG 2.2 AA problems. Exit code is non-zero if anything fails.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const dist = join(fileURLToPath(new URL('..', import.meta.url)), 'dist');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml' };

const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  let p = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, '');
  let file = join(dist, p);
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
  } catch {
    file = join(dist, '404.html');
    res.statusCode = 404;
  }
  try {
    const body = await readFile(file);
    res.setHeader('content-type', types[extname(file)] ?? 'application/octet-stream');
    res.end(body);
  } catch {
    res.statusCode = 500;
    res.end('error');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
console.log(`Testing ${base}/`);

const routes = ['/', '/learn/', '/learn/understand/', '/learn/use/', '/learn/responsible/', ...['u1', 'u2', 'u3', 'u4', 'u5'].map((l) => `/learn/understand/${l}/`), ...['t1', 't2', 't3', 't4', 't5'].map((l) => `/learn/use/${l}/`), ...['r1', 'r2', 'r3', 'r4', 'r5'].map((l) => `/learn/responsible/${l}/`), '/play/', '/lab/', '/tools/', '/scenarios/', '/codex/', '/logbook/', '/certification/', '/about/', '/accessibility/', '/credits/', '/no-such-page/'];

const failures = [];
const fail = (msg) => {
  failures.push(msg);
  console.log('  FAIL', msg);
};
const ok = (msg) => console.log('  ok  ', msg);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });

async function newPage(width, height = 900) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => errors.push(`request failed: ${r.url()}`));
  return { ctx, page, errors };
}

// ---- 1. every route renders, has one h1, no console errors, no horizontal scroll; axe scan ----
for (const width of [1280, 390]) {
  console.log(`\nRoutes at ${width}px`);
  const { ctx, page, errors } = await newPage(width);
  for (const r of routes) {
    errors.length = 0;
    await page.goto(base + r, { waitUntil: 'networkidle' });
    const h1 = await page.locator('h1').count();
    const notFound = r === '/no-such-page/';
    if (h1 !== 1) fail(`${r} has ${h1} h1 elements`);
    if (!notFound && (await page.title()).includes('not found')) fail(`${r} shows not-found`);
    const sw = await page.evaluate(() => document.documentElement.scrollWidth);
    if (sw > width) fail(`${r} scrolls horizontally (${sw} > ${width})`);
    const real = notFound ? errors.filter((e) => !e.includes('404')) : errors;
    if (real.length) fail(`${r} console errors: ${real.join(' | ')}`);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
    const bad = axe.violations.filter((v) => ['serious', 'critical', 'moderate'].includes(v.impact));
    for (const v of bad) fail(`${r} axe ${v.impact}: ${v.id} (${v.nodes.length} nodes) e.g. ${v.nodes[0].target.join(' ')}`);
  }
  if (!failures.length) ok(`${routes.length} routes: render, one h1, no overflow, no console errors, axe clean`);
  await ctx.close();
}

// ---- 2. full lesson flow: earn XP, persist, reset ----
console.log('\nLesson flow');
{
  const { ctx, page, errors } = await newPage(1280);
  await page.goto(base + '/learn/understand/u1/', { waitUntil: 'networkidle' });
  const xpText = async () => (await page.locator('.xp-chip').first().innerText()).replace(/\s+/g, ' ');

  if (!(await xpText()).includes('0 XP')) fail(`fresh player should start at 0 XP, saw "${await xpText()}"`);

  await page.getByRole('button', { name: /I have read this lesson/ }).click();
  if (!(await xpText()).includes('20 XP')) fail(`after reading expected 20 XP, saw "${await xpText()}"`);
  await page.getByRole('button', { name: /I have read this lesson/ }).count().then((n) => n === 0 || fail('read button should disappear once done'));

  // experiment: keep the default rules, predict "learned", run both
  await page.getByLabel('The learned filter').check();
  await page.getByRole('button', { name: 'Run both filters' }).click();
  await page.getByText(/Learned filter: \d of 8/).waitFor();
  if (!(await xpText()).includes('80 XP')) fail(`after experiment expected 80 XP, saw "${await xpText()}"`);

  // knowledge check: q1 option 2, q2 False, q3 options 1 and 3
  const next = async (label) => {
    await page.getByRole('button', { name: label }).click();
  };
  await page.getByLabel('Recognizing handwritten digits').check();
  await next('Check answer');
  await next('Next question');
  await page.getByLabel('False').check();
  await next('Check answer');
  await next('Next question');
  await page.getByLabel('It is predictable and easy to explain').check();
  await page.getByLabel('Its behavior does not change unless someone edits it').check();
  await next('Check answer');
  await next('Finish check');
  await page.getByText(/You answered 3 of 3/).waitFor();

  const done = await xpText();
  if (!done.includes('210 XP')) fail(`finished lesson expected 210 XP, saw "${done}"`);
  if ((await page.getByText('Lesson complete').count()) === 0) fail('seal section should say Lesson complete');
  if (!errors.length) ok(`lesson u1 completed by UI: 210 XP, Lv shown as "${done}"`);
  else fail(`console errors during flow: ${errors.join(' | ')}`);

  // persistence across reload
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await xpText()).includes('210 XP')) fail(`progress did not persist across reload: "${await xpText()}"`);
  else ok('progress persisted across reload');

  // logbook reflects it, then reset
  await page.goto(base + '/logbook/', { waitUntil: 'networkidle' });
  if ((await page.getByText('1 / 15').count()) === 0) fail('logbook should show 1 / 15 lessons finished');
  await page.getByRole('button', { name: /Reset all progress/ }).click();
  await page.getByRole('button', { name: 'Yes, delete everything' }).click();
  if (!(await xpText()).includes('0 XP')) fail('reset should return to 0 XP');
  else ok('reset returned to 0 XP');
  await page.reload({ waitUntil: 'networkidle' });
  if (!(await xpText()).includes('0 XP')) fail('reset did not persist across reload');
  await ctx.close();
}

// ---- 3. keyboard, skip link, sound default, SPA navigation, deep link ----
console.log('\nKeyboard and navigation');
{
  const { ctx, page } = await newPage(1280);
  await page.goto(base + '/', { waitUntil: 'networkidle' });
  await page.keyboard.press('Tab');
  const skipFocused = await page.evaluate(() => document.activeElement?.textContent?.includes('Skip to main content'));
  const skipVisible = await page.locator('.skip-link').evaluate((el) => el.getBoundingClientRect().top >= 0);
  if (!skipFocused || !skipVisible) fail('first Tab stop should be a visible skip link');
  else ok('first Tab stop is a visible skip link');

  const sound = await page.getByRole('button', { name: /Sound off/ }).getAttribute('aria-pressed');
  if (sound !== 'false') fail('sound must be off by default');
  else ok('sound is off by default');

  await page.getByRole('link', { name: 'Tool Atlas' }).first().click();
  await page.waitForURL('**/tools/');
  if (!(await page.title()).includes('Tool Atlas')) fail('SPA navigation should update the document title');
  else ok('SPA navigation updates URL and title');
  const focusInMain = await page.evaluate(() => document.activeElement?.id === 'main');
  if (!focusInMain) fail('focus should move to main after navigation');
  else ok('focus moves to main after navigation');

  await page.goto(base + '/learn/responsible/r2/', { waitUntil: 'networkidle' });
  if ((await page.locator('h1').innerText()).trim() !== 'When AI makes things up') fail('deep link to a lesson should render that lesson');
  else ok('deep link renders the right lesson');

  // tool atlas search and filter
  await page.goto(base + '/tools/', { waitUntil: 'networkidle' });
  await page.getByLabel('Search tools').fill('zzzz-nothing');
  if ((await page.getByText('No tool matches that').count()) === 0) fail('tool search empty state missing');
  await page.getByLabel('Search tools').fill('claude');
  if ((await page.locator('.dossier').count()) !== 1) fail('searching "claude" should show one tool');
  else ok('tool atlas search and empty state work');

  // codex search
  await page.goto(base + '/codex/', { waitUntil: 'networkidle' });
  await page.getByLabel('Search the codex').fill('token');
  const n = await page.locator('.codex__entry').count();
  if (n < 1 || n > 5) fail(`codex search "token" returned ${n} entries`);
  else ok('codex search works');
  await ctx.close();
}

// ---- 4. the pictures that carry progress, and the things added around them ----
console.log('\nProgress pictures, rank moment, drill and warm-up');
{
  const { ctx, page } = await newPage(1280);
  // One lesson finished and 115 XP: five short of level 2.
  const seeded = {
    v: 1, createdAt: 1, xp: 115,
    lessons: { u1: { learned: true, tryScore: 100, checkBest: 3, done: true, doneAt: 2 } },
    challenges: {}, badges: {}, pathsDone: {}, codex: ['ai', 'algorithm'], activity: [], xpByDay: {}, lastLesson: null,
    settings: { sound: false, volume: 0.6, name: '' },
  };
  await ctx.addInitScript((v) => { if (!localStorage.getItem('tideweight/v1')) localStorage.setItem('tideweight/v1', v); }, JSON.stringify(seeded));

  await page.goto(base + '/', { waitUntil: 'networkidle' });
  const lanterns = await page.locator('.festoon__lantern').count();
  const litText = (await page.locator('.strip__facts').innerText()).replace(/\s+/g, ' ');
  if (lanterns !== 15 || !/1 of 15/.test(litText)) fail(`harbor should hang 15 lanterns and report 1 lit (found ${lanterns}, "${litText}")`);
  else ok('harbor hangs 15 lanterns and reports 1 lit');
  if ((await page.locator('.hero-pin').count()) !== 3) fail('harbor should link to the three places');
  else ok('harbor links to the three places');

  // audio: nothing exists until the player asks; the music button starts a real, audible engine and the same button stops it
  const before = await page.evaluate(() => document.documentElement.dataset.audio ?? 'none');
  if (before !== 'none') fail(`no audio context should exist before the player switches sound on (found "${before}")`);
  else ok('no audio context exists before the player asks');
  await page.getByRole('button', { name: /Music off/ }).click();
  await page.waitForTimeout(3200);
  const au = await page.evaluate(() => ({ state: document.documentElement.dataset.audio, notes: Number(document.documentElement.dataset.musicNotes ?? 0), peak: Number(document.documentElement.dataset.audioPeak ?? 0) }));
  if (au.state !== 'running' || au.notes < 3) fail(`music should be running and scheduling notes (${JSON.stringify(au)})`);
  else ok(`music runs after the button is pressed (${au.notes} voices scheduled)`);
  if (!(au.peak > 0)) fail(`music should produce signal (peak ${au.peak})`);
  else ok(`the master output carries signal (peak ${au.peak})`);
  const pressed = await page.getByRole('button', { name: /Music on/ }).getAttribute('aria-pressed');
  if (pressed !== 'true') fail('music button should report it is on');
  await page.getByRole('button', { name: /Music on/ }).click();
  if ((await page.getByRole('button', { name: /Music off/ }).count()) !== 1) fail('music button should switch off again');
  else ok('music button switches off again');

  // missions
  await page.goto(base + '/missions/', { waitUntil: 'networkidle' });
  const missions = await page.locator('.mission').count();
  if (missions !== 18) fail(`mission board should list 18 missions (found ${missions})`);
  else ok('mission board lists 18 missions in five groups');
  await page.goto(base + '/', { waitUntil: 'networkidle' });

  // myth or fact: answer it, get a reason and a lesson link
  await page.getByRole('button', { name: 'It is a myth' }).click();
  if ((await page.locator('.myth__answer a.btn').count()) !== 1) fail('myth card should give a reason and a lesson link');
  else ok('myth card answers with a reason and a lesson link');

  // the chart: sixteen links, one finished stop, and a stop takes you to its lesson
  await page.goto(base + '/learn/', { waitUntil: 'networkidle' });
  const stops = await page.locator('.chart-stop').count();
  if (stops !== 16) fail(`chart should have 15 stops and the seal (found ${stops})`);
  const firstName = (await page.locator('.chart-stop').first().textContent()) ?? '';
  if (!/Finished/.test(firstName)) fail(`first chart stop should read as finished ("${firstName}")`);
  await page.locator('.chart-stop').nth(1).click();
  await page.waitForURL('**/learn/understand/u2/');
  ok('chart has 16 links, shows the finished stop and navigates');

  // crossing a level opens the rank moment
  await page.getByRole('button', { name: /I have read this lesson/ }).click();
  await page.waitForSelector('dialog[open]', { timeout: 3000 }).catch(() => {});
  const rank = await page.locator('dialog[open] h2').innerText().catch(() => '');
  if (!/Level 2/.test(rank)) fail(`reaching 120 XP should open the rank moment (got "${rank}")`);
  else ok('reaching level 2 opens the rank moment');
  await page.getByRole('button', { name: 'Keep going' }).click();
  if ((await page.locator('dialog[open]').count()) !== 0) fail('rank moment should close');

  // codex: the cabinet reports the collected terms, and the drill runs to a score
  await page.goto(base + '/codex/', { waitUntil: 'networkidle' });
  if (!/2 of 37/.test(await page.locator('.split-head .fact').innerText())) fail('codex should report 2 of 37 collected');
  await page.getByRole('button', { name: /Drill ten terms/ }).click();
  for (let i = 0; i < 10; i++) {
    await page.locator('.drill .option').first().click();
    await page.getByRole('button', { name: 'Check answer' }).click();
    await page.locator('.drill .btn--primary').last().click();
  }
  const drill = await page.getByText(/Drill score: \d+ percent/).count();
  if (drill !== 1) fail('codex drill should finish with a score');
  else ok('codex drill runs ten questions and reports a score');
  await ctx.close();
}

await browser.close();
server.close();
console.log(failures.length ? `\n${failures.length} FAILURE(S)` : '\nAll smoke checks passed');
process.exit(failures.length ? 1 : 0);
