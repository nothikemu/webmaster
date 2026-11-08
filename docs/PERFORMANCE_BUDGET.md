# Performance budget and measurements

## Targets

| Metric | Target | Where measured |
| --- | --- | --- |
| Lighthouse Performance, Accessibility, Best Practices, SEO | all at or above 90 on the static build | `npx lighthouse http://localhost:4173/` against `pnpm preview` |
| Frame rate | 60 fps; the quality governor must hold at least 12 fps at its lowest tier on software GL and is meant to hold 45+ on real hardware | `pnpm smoke` (`SMOKE_MIN_FPS`, `SMOKE_QUALITY`) |
| Frame time budget | 16.7 ms; governor steps down above 22.5 ms mean over 90 frames | `core/quality.ts` |
| Layout shift | 0 | Lighthouse |
| Particles | between 3,000 (floor) and 6,000 | `QualityGovernor` tiers |
| No per-frame allocation in particle hot paths | typed arrays reused; vectors reused | code review of `SwarmScene.ts`, `tsSim.ts` |

## Measured (this build)

All numbers come from a **software-rendered headless Chromium in a container**, so absolute timings are not representative of real devices. They are reported because they are the only measurements that exist.

| Measure | Result |
| --- | --- |
| Lighthouse, **desktop** profile, home page | Performance **96**, Accessibility **100**, Best Practices **100**, SEO **100**. FCP 0.9 s, LCP 1.2 s, TBT 0 ms, CLS 0 |
| Lighthouse, **mobile** profile (Slow 4G, 4x CPU throttle), home page | Performance **64**, Accessibility **100**, Best Practices **100**, SEO **100**. FCP 4.3 s, LCP 6.2 s, TBT 200 ms, CLS 0 (single run each; expect a few points of run-to-run variation) |
| Frame rate, Module A, lowest quality tier, WebGL2 renderer | 55 fps (smoke test, 6-second window) |
| Master frame loop | one native `requestAnimationFrame` loop, 0.97 to 1.10 rAF calls per frame (smoke test) |
| Unit tests | 90 TypeScript tests, 20 Rust tests |
| Smoke test | 24 checks |

**The mobile Performance score is below the 90 target.** First paint waits for the boot chain (entry script, React, WebAssembly, decrypting the asset blob) because the staged-load design reveals the app when it is ready. Lighthouse's throttling model charges that whole chain to FCP. A progressive fallback reveals the pre-rendered page after 1.4 s on a slow device, but Lighthouse's simulation cannot observe it. Obfuscation costs about 3 points (68 unobfuscated, 65 obfuscated, measured before entry-chunk tuning).

Next steps, in order of expected gain: (1) load WebAssembly lazily and boot on the TypeScript kernels (decrypt and sign in TypeScript, upgrade when a module page needs the Rust kernels); (2) split the entry chunk so the home page does not carry the machines and gamification engine; (3) drop the staged reveal in favour of showing the pre-rendered page immediately.

## Payload (gzip)

| Asset | Raw | Gzip | When it loads |
| --- | --- | --- | --- |
| Entry script (`index`, string-encoded) | 312 KB | 95 KB | Always |
| `vendor-react` | 140 KB | 46 KB | Always |
| `vendor-state` (XState, Zustand, Comlink) | 44 KB | 15 KB | Always |
| CSS | 91 KB | 19 KB | Always |
| Typefaces (five Latin woff2 files: Barlow in four weights 90 KB, Big Shoulders Display variable 36 KB) | 126 KB | 126 KB | Each file when the page first uses it (`font-display: swap`) |
| WebAssembly (SIMD or scalar) | 51 KB | 24 KB | Always, one of the two |
| Encrypted asset blob | 28 KB | 28 KB | Always |
| Home page chunk | 21 KB | 7 KB | Home |
| `vendor-three` | 752 KB | 193 KB | Module pages (WebGL2 path) |
| `vendor-three-gpu` | 732 KB | 207 KB | Only when WebGPU is used |
| Module chunks | 10 to 26 KB | 4 to 9 KB | Their module |

## Budget rules

- No new always-loaded dependency without a measured reason.
- Heavy code stays in lazy chunks: three, post-processing and every page.
- Off-screen canvases are paused (IntersectionObserver) and the loop stops when the tab is hidden.
- There is no live background and no post-processing. The page is flat paper and the 3D scenes render straight to the canvas (MSAA on, no bloom, aberration or grain), so the `postprocessing` library and its 320 kB chunk are gone. There is no continuous animation outside the 3D scenes: motion elsewhere is one-shot (reveals, the page wipe, the verdict stamp) and stops under reduced motion. The key art is static SVG built from seeded data (a few thousand elements per picture; one small blur filter on lit elements only), and nothing in it animates.
- Motion that is not the background (reveals, the pointer spotlight, the magnetic pull) is batched into one requestAnimationFrame per event burst and writes custom properties only; none of it runs on touch devices except reveals and scroll values.
- Pointer, touch and scroll listeners are passive. Device pixel ratio is capped at 2 (and 1 to 1.5 on lower tiers).
- Geometries, materials and vectors are created once per scene and reused. Particle data lives in typed arrays.
- DOM writes in animation loops go straight to attributes and CSS variables, not through React state, except for readouts throttled to a few updates per second.
