# Parameter: Interactive AI Learning Portal

TSA Webmaster 2026-2027 entry. Three modules (Foundations, Synthesis, Ethics), gamified progress tracking, static HTML/CSS/JS output. Planning documents are in `docs/`.

## Prerequisites

- Node.js 20.19 or newer
- pnpm 10 (`corepack enable && corepack prepare pnpm@10.28.0 --activate`)
- For the WebAssembly kernels (optional; without them the site uses its TypeScript kernels):
  - Rust stable: `curl https://sh.rustup.rs -sSf | sh`
  - `rustup target add wasm32-unknown-unknown`
  - `cargo install wasm-pack --locked`
- For the smoke test: a Chromium build (`pnpm --filter portal exec playwright install chromium`)

## Install

```bash
pnpm install
```

## Run (development)

```bash
pnpm dev
```

## Build

```bash
pnpm build
```

Require the WebAssembly build to succeed (fail instead of falling back):

```bash
REQUIRE_WASM=1 pnpm build
```

Build for a sub-path or with a canonical URL (adds `sitemap.xml`):

```bash
BASE=/my-site/ SITE_URL=https://example.org pnpm build
```

Skip obfuscation (useful when debugging):

```bash
NO_OBFUSCATE=1 pnpm build
```

## Preview the built site

```bash
pnpm preview
```

## Test

```bash
pnpm test
```

```bash
pnpm lint
```

```bash
pnpm typecheck
```

Browser smoke test (serves `dist/` itself; build first):

```bash
pnpm smoke
```

Useful smoke options: `SMOKE_MIN_FPS=45`, `SMOKE_QUALITY=3`, `SMOKE_ONLY="axe"`, `SMOKE_NO_WEBGPU=1`, `CHROMIUM_PATH=/path/to/chrome`.

## Deploy

`apps/portal/dist/` is a complete static site. Upload that folder to any static host.

For `SharedArrayBuffer` (an optional speed-up) the host should send the headers in `_headers` (Netlify and Cloudflare Pages read that file as is). Without them the site works and uses its fallback.

```bash
pnpm build && npx wrangler pages deploy apps/portal/dist
```

```bash
pnpm build && npx netlify deploy --prod --dir apps/portal/dist
```

### GitHub Pages

Build for the repository sub-path, then publish `apps/portal/dist` to a `gh-pages` branch:

```bash
REQUIRE_WASM=1 BASE=/tsa-webmaster/ SITE_URL=https://nothikemu.github.io pnpm build
```

```bash
git worktree add --detach /tmp/pages-wt HEAD && cd /tmp/pages-wt && git checkout --orphan gh-pages && git rm -rf -q . && cp -a /path/to/repo/apps/portal/dist/. . && git add -A && git commit -m "Deploy" && git push -f origin gh-pages
```

Then, once: repository **Settings, Pages, Source: Deploy from a branch, branch `gh-pages`, folder `/ (root)`**. Pages cannot send the `_headers` isolation headers, so the site uses its transferable-buffer fallback there.

Test a sub-path build locally: `SMOKE_BASE=/tsa-webmaster/ SMOKE_ISOLATION=0 pnpm smoke`

## URL switches (for testing)

`?renderer=webgl2|webgpu`, `?compute=webgpu|webgl2|wasm-worker|wasm-main|ts`, `?quality=0..3`
