import { checksums } from 'virtual:integrity';
import { createRoot, type Root } from 'react-dom/client';
import { createActor } from 'xstate';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/material.css';
import './styles/components.css';
import './styles/shell.css';
import './styles/home.css';
import './styles/catalog.css';
import './styles/module.css';
import './styles/pages.css';
import './styles/fx.css';
import { App } from './App';
import { bootAssets, prefetchAssets } from './core/assets';
import { chooseComputeTier, probeCaps, readOverrides } from './core/caps';
import { createSigner, signState, verifyChecksums, type GuardResult } from './core/integrity';
import { MasterLoop } from './core/loop';
import { createRootMachine } from './core/machines/root';
import { clearState, createStorage, loadState, newSalt, saveState } from './core/persistence';
import { startingTier } from './core/quality';
import { QualityService } from './core/qualityService';
import { provide, registry } from './core/registry';
import { createInitialState } from './core/schema';
import { ServicesContext, type Services } from './core/services';
import { createPortalStore } from './core/store';
import { loadKernels } from './core/wasm';
import { preloadRoute } from './preload';

/** Shows the pre-rendered static page instead of the interactive app. */
function staticView(reason: string): void {
  console.warn(`[boot] showing the static view (${reason})`);
  document.documentElement.dataset.boot = 'static';
}

/**
 * Replaces the running app with the pre-rendered static copy of the current page. Used when the
 * integrity guard finds a mismatch after the app has already started: no error is shown, the page
 * just becomes the non-interactive version.
 */
async function degradeToStatic(root: Root, container: HTMLElement): Promise<void> {
  let markup = '';
  try {
    const res = await fetch(location.href, { cache: 'force-cache' });
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    markup = doc.getElementById('root')?.innerHTML ?? '';
  } catch {
    /* offline: an empty static view is still better than running modified code */
  }
  root.unmount();
  container.innerHTML = markup;
  staticView('checksum mismatch');
}

async function boot(): Promise<void> {
  const baseUrl = new URL(import.meta.env.BASE_URL, location.href).toString();
  const overrides = readOverrides(location.search);
  // Start the downloads that boot depends on at once: the encrypted asset blob now, WebAssembly next.
  const blob = prefetchAssets(baseUrl);
  blob.catch(() => undefined);
  preloadRoute(location.pathname);
  const caps = probeCaps();
  const kernels = await loadKernels(caps.wasmSimd, overrides.compute !== 'ts');
  await bootAssets(kernels, blob);

  // The integrity guard runs beside the rest of boot and never delays first paint. Network failures
  // never count as tampering.
  const guard: Promise<GuardResult> = import.meta.env.PROD ? verifyChecksums(checksums, kernels, baseUrl) : Promise.resolve('skipped');

  const signer = createSigner(kernels, caps);
  const { storage, persistent } = createStorage();
  const store = createPortalStore(async (state) => {
    await saveState(storage, signer, state);
  });
  const loaded = await loadState(storage, signer, Date.now());
  store.getState().hydrate(loaded, persistent);

  const loop = new MasterLoop();
  const params = new URLSearchParams(location.search);
  const forced = Number(params.get('quality'));
  const tier = params.has('quality') && Number.isInteger(forced) && forced >= 0 && forced <= 3 ? forced : startingTier(caps);
  const quality = new QualityService(loop, tier);

  const actor = createActor(
    createRootMachine({
      apply: (event) => store.getState().apply(event),
      now: () => Date.now(),
      reset: async () => {
        const fresh = await signState(signer, createInitialState(Date.now(), newSalt()));
        clearState(storage);
        store.getState().replace(fresh);
      },
    }),
  ).start();
  const s = loaded.state.modules;
  actor.send({ type: 'BADGE_SYNC', unlocked: { foundations: s.foundations.badge, synthesis: s.synthesis.badge, ethics: s.ethics.badge } });

  const services: Services = { caps, overrides, kernels, loop, quality, store, actor, signer, storage, persistent, base: baseUrl };
  provide('caps', caps);
  provide('kernels', kernels);
  provide('loop', loop);
  provide('store', store);
  provide('actor', actor);
  provide('services', services);
  provide('computeTier', chooseComputeTier(caps, kernels.tier !== 'ts', overrides.compute));
  registry.seal();

  const container = document.getElementById('root');
  if (!container) throw new Error('missing #root');
  const root = createRoot(container);
  root.render(
    <ServicesContext.Provider value={services}>
      <App />
    </ServicesContext.Provider>,
  );

  void guard.then((result) => {
    if (result !== 'mismatch') return;
    store.getState().degrade();
    actor.send({ type: 'INTEGRITY_FAIL' });
    void degradeToStatic(root, container);
  });
}

boot().catch((err: unknown) => staticView(err instanceof Error ? err.message : 'boot failed'));
