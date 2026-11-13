import { defineConfig, type Plugin, type ResolvedConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ROUTES } from './src/content/routes';

/**
 * The site is a single-page app, but every page also needs a real URL that works when someone
 * opens it directly or refreshes. After the build we copy index.html into a folder for each route
 * (dist/learn/understand/index.html and so on) and write a 404.html that does the same job for
 * unknown URLs (Vercel serves 404.html with a 404 status). Any static host can serve the result. No server code is involved.
 */
function staticRoutes(): Plugin {
  let config: ResolvedConfig;
  return {
    name: 'tideweight-static-routes',
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
  // The 3D engine is its own chunk, fetched only when the 3D game starts, so it is allowed to be large.
  build: { target: 'es2022', sourcemap: false, cssCodeSplit: true, chunkSizeWarningLimit: 700 },
});
