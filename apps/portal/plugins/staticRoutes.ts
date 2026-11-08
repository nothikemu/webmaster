/**
 * Emits one real HTML file per route (dist/modules/foundations/lessons/1/index.html and so on).
 * Each file is the built index.html with a route-specific title, description and a fully
 * readable static version of the page inside #root. This gives search engines, no-JavaScript
 * visitors and the integrity-failure fallback the same content the React app renders, and it
 * makes every deep link work on any static host without rewrite rules.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import {
  MODULES,
  STATIC_ROUTES,
  challengeHref,
  getModule,
  glossary,
  isModuleId,
  lessonHref,
  moduleHref,
  quizHref,
  resources,
  type ModuleContent,
} from '../src/content';
import {
  ABOUT,
  ACCESSIBILITY,
  CREDITS,
  CREDIT_LIBRARIES,
  FOOTER_LINKS,
  HOME,
  NAV,
  SITE,
  type DocPageContent,
} from '../src/content/site';
import type { PostBuildStep } from './injectChecksums';

const esc = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

interface Page {
  title: string;
  description: string;
  body: string;
}

const ul = (items: readonly string[]): string => `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;

function doc(page: DocPageContent): string {
  const sections = page.sections
    .map(
      (s) =>
        `<section><h2>${esc(s.heading)}</h2>${(s.paragraphs ?? []).map((p) => `<p>${esc(p)}</p>`).join('')}${s.items ? ul(s.items) : ''}</section>`,
    )
    .join('');
  return `<h1>${esc(page.title)}</h1><p class="lead">${esc(page.lead)}</p>${sections}`;
}

function moduleCard(m: ModuleContent, href: string): string {
  return `<article><h3><a href="${href}">${esc(m.title)}</a></h3><p>${esc(m.tagline)}</p><p>${esc(m.objective)}</p></article>`;
}

function homeBody(): string {
  return [
    `<h1>${HOME.headline.map(esc).join(' ')}</h1>`,
    `<p class="lead">${esc(HOME.lead)}</p>`,
    `<p><a href="${moduleHref('foundations')}">Start with Foundations</a> · <a href="/modules">See all modules</a></p>`,
    `<section><h2>${esc(HOME.bento.heading)}</h2>${MODULES.map((m) => moduleCard(m, moduleHref(m.id))).join('')}</section>`,
    `<section><h2>${esc(HOME.gamification.heading)}</h2>${HOME.gamification.body.map((p) => `<p>${esc(p)}</p>`).join('')}</section>`,
  ].join('');
}

function moduleBody(m: ModuleContent): string {
  return [
    `<h1>${esc(m.title)}</h1>`,
    `<p class="lead">${esc(m.tagline)}</p>`,
    `<section><h2>Learning objective</h2><p>${esc(m.objective)}</p></section>`,
    `<section><h2>${esc(m.centerpiece.name)}</h2><p>${esc(m.centerpiece.description)}</p><p>The interactive scene needs JavaScript.</p></section>`,
    `<section><h2>Lessons</h2><ol>${m.lessons.map((l, i) => `<li><a href="${lessonHref(m.id, i + 1)}">${esc(l.title)}</a> (${l.minutes} min)</li>`).join('')}</ol></section>`,
    `<p><a href="${quizHref(m.id)}">Knowledge check</a> · <a href="${challengeHref(m.id)}">${esc(m.challenge.title)}</a></p>`,
  ].join('');
}

const details = (summary: string, inner: string): string => `<details><summary>${esc(summary)}</summary>${inner}</details>`;

function lessonBody(m: ModuleContent, n: number): string {
  const l = m.lessons[n - 1]!;
  const c = l.check;
  return [
    `<h1>${esc(l.title)}</h1>`,
    l.body.map((p) => `<p>${esc(p)}</p>`).join(''),
    `<section><h2>Key points</h2>${ul(l.keyPoints)}</section>`,
    `<section><h2>Check yourself</h2><p>${esc(c.prompt)}</p>${ul(c.options)}${details('Show the answer', `<p>${esc(c.options[c.answer]!)}</p><p>${esc(c.explain)}</p>`)}</section>`,
    `<p>${n > 1 ? `<a href="${lessonHref(m.id, n - 1)}">Previous lesson</a> · ` : ''}${n < m.lessons.length ? `<a href="${lessonHref(m.id, n + 1)}">Next lesson</a>` : `<a href="${quizHref(m.id)}">Knowledge check</a>`}</p>`,
  ].join('');
}

function quizBody(m: ModuleContent): string {
  return [
    `<h1>${esc(m.title)} knowledge check</h1>`,
    `<p class="lead">Five questions. Score 4 to count toward the badge. The scored version needs JavaScript.</p>`,
    `<ol>${m.quiz.map((q) => `<li><p>${esc(q.prompt)}</p>${ul(q.options)}${details('Show the answer', `<p>${esc(q.options[q.answer]!)}</p><p>${esc(q.explain)}</p>`)}</li>`).join('')}</ol>`,
  ].join('');
}

function challengeBody(m: ModuleContent): string {
  const c = m.challenge;
  const items =
    c.kind === 'choice'
      ? `<ol>${c.items.map((i) => `<li><p>${esc(i.prompt)}</p>${details('Show the answer', `<p>${esc(c.options[i.answer]!)}</p><p>${esc(i.explain)}</p>`)}</li>`).join('')}</ol><p>Options: ${esc(c.options.join(', '))}.</p>`
      : `<ol>${c.scenarios.map((s) => `<li><p>${esc(s.goal)}</p><p>${esc(s.hint)}</p></li>`).join('')}</ol>`;
  return [
    `<h1>${esc(c.title)}</h1>`,
    `<p class="lead">${esc(c.intro)}</p>`,
    items,
    `<p>Pass mark: ${c.passMark}. Par time: ${c.parSeconds} seconds. The timed version needs JavaScript.</p>`,
  ].join('');
}

function pageFor(route: string): Page {
  const parts = route.split('/').filter(Boolean);
  const suffix = ` · ${SITE.name}`;
  if (route === '/') return { title: SITE.title, description: SITE.description, body: homeBody() };
  if (route === '/modules') {
    return {
      title: `Modules${suffix}`,
      description: 'Three modules: Foundations, Synthesis and Ethics.',
      body: `<h1>Modules</h1><p class="lead">${esc(HOME.bento.heading)}</p>${MODULES.map((m) => moduleCard(m, moduleHref(m.id))).join('')}`,
    };
  }
  if (parts[0] === 'modules' && parts[1] && isModuleId(parts[1])) {
    const m = getModule(parts[1]);
    if (parts.length === 2) return { title: `${m.title}${suffix}`, description: m.objective, body: moduleBody(m) };
    if (parts[2] === 'lessons' && parts[3]) {
      const n = Number(parts[3]);
      const l = m.lessons[n - 1]!;
      return { title: `${l.title} · ${m.title}${suffix}`, description: l.body[0]!.slice(0, 180), body: lessonBody(m, n) };
    }
    if (parts[2] === 'knowledge-check') return { title: `${m.title} knowledge check${suffix}`, description: `Five questions on ${m.title.toLowerCase()}.`, body: quizBody(m) };
    if (parts[2] === 'challenge') return { title: `${m.challenge.title} · ${m.title}${suffix}`, description: m.challenge.intro, body: challengeBody(m) };
  }
  switch (route) {
    case '/progress':
      return { title: `Progress${suffix}`, description: 'Your completion, XP, streak and mastery.', body: `<h1>Progress</h1><p class="lead">Completion by module, XP history, a streak calendar and a mastery heatmap. This page is interactive and needs JavaScript. Progress is stored only in your browser.</p>` };
    case '/achievements':
      return {
        title: `Achievements${suffix}`,
        description: 'Three badges, one per module.',
        body: `<h1>Achievements</h1><p class="lead">One badge per module.</p>${MODULES.map((m) => `<article><h2>${esc(m.badge.name)}</h2><p>${esc(m.badge.criteria)}</p></article>`).join('')}`,
      };
    case '/glossary':
      return {
        title: `Glossary and resources${suffix}`,
        description: 'Terms used in the lessons, and where to read further.',
        body: `<h1>Glossary and resources</h1><dl>${glossary.map((g) => `<div><dt>${esc(g.term)}</dt><dd>${esc(g.definition)}</dd></div>`).join('')}</dl><h2>Further reading</h2><ul>${resources.map((r) => `<li><a href="${esc(r.href)}">${esc(r.title)}</a>: ${esc(r.note)}</li>`).join('')}</ul>`,
      };
    case '/about':
      return { title: `About${suffix}`, description: ABOUT.lead, body: doc(ABOUT) };
    case '/accessibility':
      return { title: `Accessibility statement${suffix}`, description: ACCESSIBILITY.lead, body: doc(ACCESSIBILITY) };
    case '/credits':
      return {
        title: `Credits${suffix}`,
        description: CREDITS.lead,
        body: `${doc(CREDITS)}<section><h2>Libraries</h2><ul>${CREDIT_LIBRARIES.map((c) => `<li>${esc(c.name)} ${esc(c.version)}, ${esc(c.license)}: ${esc(c.use)}</li>`).join('')}</ul></section>`,
      };
    default:
      return { title: SITE.title, description: SITE.description, body: homeBody() };
  }
}

function shell(page: Page): string {
  const nav = NAV.map((n) => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join('');
  const foot = FOOTER_LINKS.map((n) => `<li><a href="${n.href}">${esc(n.label)}</a></li>`).join('');
  return `<div class="static-page"><a class="skip-link" href="#main">Skip to content</a><header class="static-header"><a class="wordmark" href="/">${esc(SITE.name.toLowerCase())}</a><nav aria-label="Primary"><ul>${nav}</ul></nav></header><main id="main" tabindex="-1">${page.body}</main><footer><p>Built for ${esc(SITE.event)}. All progress stays on your device.</p><ul>${foot}</ul></footer></div>`;
}

/**
 * The shell's links are written as site-root paths ("/modules"). Under a sub-path deployment such as
 * GitHub Pages ("/repo/") those would leave the project and land on the host's own 404 page, so every
 * root-absolute href in the shell is rewritten to start at the deployment base.
 */
function withBase(html: string, base: string): string {
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return html.replace(/href="\/(?!\/)/g, `href="${prefix}`);
}

function applyTemplate(template: string, page: Page, url: string | null, base: string): string {
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
    .replace(/(<meta name="description" content=")[^"]*(")/, `$1${esc(page.description)}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${esc(page.title)}$2`)
    .replace(/(<meta property="og:description" content=")[^"]*(")/, `$1${esc(page.description)}$2`);
  if (url) html = html.replace('</head>', `<link rel="canonical" href="${esc(url)}" />\n  <meta property="og:url" content="${esc(url)}" />\n  </head>`);
  return html.replace(/<div id="root">[\s\S]*?<\/div>\s*(?=<noscript|<script|<\/body>)/, `<div id="root">${withBase(shell(page), base)}</div>\n    `);
}

export const emitStaticRoutes: PostBuildStep = ({ outDir, base, root }) => {
  const indexPath = join(outDir, 'index.html');
  const template = readFileSync(indexPath, 'utf8');
  const siteUrl = (process.env.SITE_URL ?? '').replace(/\/$/, '');
  const urlFor = (route: string): string | null => (siteUrl ? `${siteUrl}${base.replace(/\/$/, '')}${route === '/' ? '/' : route + '/'}` : null);

  for (const route of STATIC_ROUTES) {
    const html = applyTemplate(template, pageFor(route), urlFor(route), base);
    const target = route === '/' ? indexPath : join(outDir, route.slice(1), 'index.html');
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, html);
  }
  // Unknown paths get the app shell; the client router shows its not-found page.
  writeFileSync(join(outDir, '404.html'), applyTemplate(template, { title: `Page not found · ${SITE.name}`, description: SITE.description, body: `<h1>Page not found</h1><p><a href="/">Back to the home page</a></p>` }, null, base));

  const repoRoot = resolve(root, '..', '..');
  for (const name of ['_headers', 'robots.txt']) {
    const src = join(repoRoot, name);
    if (existsSync(src)) copyFileSync(src, join(outDir, name));
  }
  if (siteUrl) {
    const urls = STATIC_ROUTES.map((r) => `  <url><loc>${esc(urlFor(r)!)}</loc></url>`).join('\n');
    writeFileSync(join(outDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
    const robots = readFileSync(join(outDir, 'robots.txt'), 'utf8').replace(/^Sitemap:.*$/m, `Sitemap: ${siteUrl}${base.replace(/\/$/, '')}/sitemap.xml`);
    writeFileSync(join(outDir, 'robots.txt'), robots);
  } else if (existsSync(join(outDir, 'robots.txt'))) {
    const robots = readFileSync(join(outDir, 'robots.txt'), 'utf8').replace(/^Sitemap:.*\n?/m, '');
    writeFileSync(join(outDir, 'robots.txt'), robots);
  }
};
