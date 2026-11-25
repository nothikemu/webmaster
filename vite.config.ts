import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROUTES } from './src/content/routes';
import { legacyPages } from './src/content/legacy';

/**
 * The site is a single-page app, but every page also needs a real URL that works when someone
 * opens it directly or refreshes. After the build we copy index.html into a folder for each route
 * (dist/modules/foundations/index.html and so on) and write a 404.html that does the same job for
 * unknown URLs (Vercel serves 404.html with a 404 status). Any static host can serve the result. No server code is involved.
 */
function staticRoutes(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'parameter-static-routes',
    apply: 'build',
    configResolved(c) {
      config = c;
    },
    closeBundle() {
      const out = resolve(config.root, config.build.outDir);
      const shell = join(out, 'index.html');
      if (!existsSync(shell)) return;
      for (const route of ROUTES) {
        if (route === '/') continue;
        const dir = join(out, route);
        mkdirSync(dir, { recursive: true });
        copyFileSync(shell, join(dir, 'index.html'));
      }
      copyFileSync(shell, join(out, '404.html'));
      // Old addresses (the game, missions, the three paths) get a small page that redirects to the nearest page that still exists.
      // It is plain HTML with a meta refresh, so it works without JavaScript and on any static host.
      for (const { from, redirect } of legacyPages()) {
        const dir = join(out, from);
        mkdirSync(dir, { recursive: true });
        const [path, hash] = redirect.to.split('#');
        const target = `${path === '/' ? '/' : path + '/'}?moved=${encodeURIComponent(from)}${hash ? '#' + hash : ''}`;
        writeFileSync(
          join(dir, 'index.html'),
          `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>This page has moved · Parameter</title>` +
            `<meta http-equiv="refresh" content="0; url=${target}"><meta name="robots" content="noindex"><link rel="canonical" href="${target}"></head>` +
            `<body style="font:19px/1.6 Georgia,serif;max-width:40rem;margin:3rem auto;padding:0 1.25rem;color:#17181d;background:#f1ece0">` +
            `<p>${redirect.note}</p><p><a href="${target}" style="color:#1a2d9e">Continue to the right page</a></p></body></html>\n`,
        );
      }
      // The public origin, for the sitemap: SITE_URL if set, otherwise the production domain Vercel exposes at build time.
      const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
      const site = (process.env.SITE_URL ?? (vercel ? `https://${vercel}` : '')).replace(/\/$/, '');
      if (site) {
        const urls = ROUTES.map((r) => `  <url><loc>${site}${r === '/' ? '/' : r + '/'}</loc></url>`).join('\n');
        writeFileSync(
          join(out, 'sitemap.xml'),
          `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        );
      }
    },
  };
}

export default defineConfig({
  // Served from the root of its own domain (Vercel), so assets and pages live at / and no base path is needed.
  base: '/',
  plugins: [react(), staticRoutes()],
  resolve: { alias: { '@': resolve(__dirname, 'src') } },
  build: { target: 'es2022', sourcemap: false, cssCodeSplit: true },
});
