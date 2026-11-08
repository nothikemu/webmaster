/**
 * Build configuration for the Parameter portal.
 *
 * Read this first: client-side code cannot be made impossible to reverse engineer. Everything
 * the browser runs can be read by the person running it. The layers configured here (encrypted
 * shader and string assets, obfuscated cold-path chunks, build-time checksums, signed local
 * state) raise the cost of casual copying and tampering. They are not a security boundary, and
 * nothing in them is allowed to hurt performance or accessibility.
 */
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type PluginOption } from 'vite';
import topLevelAwait from 'vite-plugin-top-level-await';
import wasm from 'vite-plugin-wasm';
import { encryptAssets } from './plugins/encryptAssets';
import { injectChecksums } from './plugins/injectChecksums';
import { obfuscate } from './plugins/obfuscate';
import { emitStaticRoutes } from './plugins/staticRoutes';

/** Cross-origin isolation: required for SharedArrayBuffer. Every shared-memory path has a fallback. */
const ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

function manualChunks(id: string): string | undefined {
  if (id.includes('node_modules')) {
    if (/node_modules\/three\/build\/three\.(webgpu|tsl)/.test(id)) return 'vendor-three-gpu';
    if (/node_modules\/three\//.test(id)) return 'vendor-three';
    if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'vendor-react';
    if (/node_modules\/(xstate|zustand|comlink)\//.test(id)) return 'vendor-state';
    return undefined;
  }
  // The render hot path: GPU layer and every *Scene.ts file. Never obfuscated.
  if (/\/src\/gpu\/|Scene\.ts$|\/src\/workers\//.test(id)) return 'scene';
  return undefined;
}

export default defineConfig(({ command }) => {
  const plugins: PluginOption[] = [
    tailwindcss(),
    react(),
    wasm(),
    topLevelAwait(),
    encryptAssets(),
    injectChecksums({ after: [emitStaticRoutes] }),
    obfuscate(),
  ];

  return {
    base: process.env.BASE ?? '/',
    plugins,
    resolve: { alias: { '@': new URL('./src', import.meta.url).pathname } },
    server: { headers: ISOLATION_HEADERS, port: 5173, strictPort: false },
    preview: { headers: ISOLATION_HEADERS, port: 4173, strictPort: true },
    worker: { format: 'es', plugins: () => [wasm(), topLevelAwait()] },
    build: {
      target: 'es2022',
      sourcemap: false,
      minify: 'terser',
      cssMinify: true,
      chunkSizeWarningLimit: 900,
      terserOptions: {
        compress: { passes: 2, drop_debugger: true },
        // Mangle top-level names, and any property that opts in with the `_$` prefix.
        mangle: { toplevel: true, properties: { regex: /^_\$/ } },
        format: { comments: false },
      },
      rollupOptions: {
        output: {
          manualChunks,
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
    },
    esbuild: command === 'build' ? { legalComments: 'none' } : {},
  };
});
