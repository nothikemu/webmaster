# Performance

Goal: a steady 60 frames per second on a mid-range laptop. This file records what was measured, what was changed, and what is still not
known. **No real GPU was available while this was done**, so frame rates on real hardware are *not* measured here (see "Honest limits").

## How it was measured

`node scripts/profile3d.mjs` (after `pnpm build`) plays the built game in headless Chromium, walks through the harbor and each open
building, and reports for each place, from three.js's own `renderer.info` and the render loop: **draw calls** (including the shadow
pass), **triangles**, **render passes**, geometry and texture counts, shader programs, the **CPU time spent submitting a frame**, and the
frames per second the page managed. The test browser draws WebGL in software (SwiftShader), so:

* draw calls, triangles and passes are exact and are what a real GPU's cost is built from;
* CPU submit time is real JavaScript time, but on a faster machine it will be smaller;
* frames per second are only good for comparing one build against another here, not as a promise about a real laptop.

The profile was taken **before any change** (commit `787ef48`, with the counters added) and again on the finished work. Window 1000 x 640,
quality "high" (the default on a laptop) and "low".

## Results (quality: high)

| Place | Draw calls before | after | Triangles before | after | Passes before | after | CPU ms to submit a frame before | after | Meshes/geometries before | after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Harbor (the plaza and quay) | 835 | **132** (84% fewer) | 123,846 | 87,355 | 7 | 2 | 6.9 | 2.94 | 569 | 89 |
| Loom House inside | 213 | **100** (53% fewer) | 16,974 | 17,893 | 7 | 2 | 2.45 | 0.88 | 748 | 157 |
| Foundry inside | 143 | **73** (49% fewer) | 11,480 | 12,973 | 7 | 2 | 1.48 | 0.93 | 869 | 214 |
| Beacon inside | 152 | **67** (56% fewer) | 16,842 | 16,985 | 7 | 2 | 1.3 | 0.56 | 984 | 252 |
| Harbor Office inside | 124 | **60** (52% fewer) | 10,496 | 10,259 | 7 | 2 | 1.4 | 0.78 | 1070 | 282 |

Notes: CPU submit time is noisy in this environment (the harbor measured between 1.3 and 2.9 ms across four runs after the change, against 6.9 ms before). The geometry count is cumulative, because each interior stays built after the first visit, so it rises as rooms are entered. Interiors have no shadow pass (the sun is off indoors).

Same pages, rendered in software, only to compare builds:

| Place | Software-rendered fps before | after |
| --- | ---: | ---: |
| Harbor (the plaza and quay) | 2 | 12 |
| Loom House inside | 4 | 18 |
| Foundry inside | 7 | 20 |
| Beacon inside | 8 | 19 |
| Harbor Office inside | 5 | 18 |

## Results (quality: low)

| Place | Draw calls before | after | Triangles before | after | Passes before | after | CPU ms to submit a frame before | after | Meshes/geometries before | after |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Harbor (the plaza and quay) | 449 | **87** (81% fewer) | 95,890 | 58,962 | 2 | 2 | 4.8 | 1.29 | 449 | 85 |
| Loom House inside | 208 | **100** (52% fewer) | 16,969 | 17,901 | 2 | 2 | 1.6 | 1.48 | 623 | 153 |
| Foundry inside | 138 | **73** (47% fewer) | 11,475 | 12,973 | 2 | 2 | 1.26 | 1.1 | 820 | 213 |
| Beacon inside | 147 | **67** (54% fewer) | 16,837 | 16,977 | 2 | 2 | 1.34 | 0.76 | 946 | 252 |
| Harbor Office inside | 119 | **60** (50% fewer) | 10,491 | 10,259 | 2 | 2 | 1.77 | 0.66 | 1054 | 282 |

## What was slow, and what was done about it

Research first (see "Sources"): the cheap wins in three.js are fewer draw calls (merge static meshes, instance repeats), fewer and
cheaper post-processing passes, a capped pixel ratio, fewer lights, and nothing that rebuilds or compiles on the hot path.

| Finding from the profile | Change |
| --- | --- |
| The harbor drew **835** meshes per frame (a window was eight boxes; a lamp post six parts; every building dozens), and the shadow pass drew them again. | `src/game3d/bake.ts`: after a place is built, everything that never moves is merged into **one mesh per material**. What moves is found by running the place's own update twice and seeing which objects changed; things the update cannot show are marked (`live`, `keep`). Texture repeat is baked into the UVs so equal materials share a draw call. The 30 lamp bulbs became two instanced meshes whose colour changes when a lamp is lit. |
| Seven render passes: scene, bright-pass, two blurs each way, stylise. | Bloom removed (the poster look does not glow): **two passes**, scene and stylise. Per-frame film-grain noise, paper fibre and the tonal Sobel (four extra texture reads) removed; the stylise pass now reads the colour once and the depth five times. |
| Physically based materials and **eight** lights (point lights at the fountain, forge, lighthouse, four lamps, each mentor, each room). Every pixel paid for every light. | All materials are Lambert (the picture is cut into flat bands, so specular is wasted). Every point light was removed from the places; light comes from the sun, the sky, one fill light and emissive shapes, with **one** point light left: the player's own lantern. |
| The sea was a 180 x 180 mesh: **64,800 triangles** and a five-wave vertex shader on all of them. | 100 x 100 (20,000 triangles). The waves are long and shallow, so nothing visible changed; in software rendering the harbor went from about 3 to about 16 frames per second on this change alone. |
| Pixel ratio up to 1.75, soft shadows from a 2048 map over a 92 m square. | Pixel ratio capped at 1.5 (high), 1.25 (medium), 1 (low); hard-edged PCF shadows from a 1024 map over a 76 m square (high), none on low and none indoors. Shadows are a good fit for cel shading, so they stay on high and medium. |
| Gulls, boats and the player cast shadows no one could see; nine gulls. | Far things do not cast shadows; six gulls. |
| Quality was lowered only when frames took over 36 ms (about 28 fps). | The target is now 60: quality steps down when the average frame time stays above 21 ms. A stalled or hidden tab no longer counts as slow. |
| Per-frame allocations in the render loop (new vectors for Kernel every frame; arrays for the path). | The vectors are reused. (The path allocates a handful of small arrays a few times a second.) |
| Shader compilation could hitch the first frame in a place. | The first frame in a place is drawn while the slanted wipe is still black, so any compile hitch is not seen. |
| The 3D engine (a 600 kB chunk) | Still loaded only when the 3D game starts; each interior is built the first time you enter it, not at start-up. |

Not done, deliberately: a second render pass for outlines (the depth already gives them), dynamic resolution scaling (research says it
can oscillate and look unstable, so the game steps *down* a quality tier once instead), and an LOD system (the scene is small).

## Honest limits

* **Not measured: frame rate on a real GPU.** The claim "60 fps on a mid-range laptop" is a target the numbers above are consistent with
  (an order of magnitude fewer draw calls, two passes, one point light), not a measurement. Please try it on a real laptop and phone; the URL
  `?q=low` forces the lowest tier and `?debug=1` exposes the render statistics on the page (`window.__tw.stats`).
* The page also sets `data-calls`, `data-tris`, `data-passes` and `data-cpu` on the stage element every few frames, which is what the
  profile script reads.
* The sources below were read as search summaries, not in full; the advice that two of them disagree on (the best pixel-ratio cap) was
  settled by choosing conservative caps and an automatic step-down.

## Sources

* [100 Three.js Tips That Actually Improve Performance (Utsubo)](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
* [Three.js Journey: performance tips](https://www.threejs-journey.com/lessons/performance-tips)
* [Instancing with three.js, part 1](https://medium.com/@pailhead011/instancing-with-three-js-36b4b62bc127)
* [Limit device pixel ratio on mobile](https://salivity.github.io/three.js/article/three-js-mobile-performance-limit-device-pixel-ratio)
* [Changing pixelRatio based on fps: good or bad idea? (three.js forum)](https://discourse.threejs.org/t/changing-pixelratio-based-on-fps-good-or-bad-idea/34563)
* Way-finding and tutorials: [Game Accessibility Guidelines](https://gameaccessibilityguidelines.com/?p=2321), [Quest marker and objective tracker (Bugnet)](https://bugnet.io/blog/how-to-implement-a-quest-marker-and-objective-tracker), [Level design basics: guiding players without telling them (Unity)](https://unity.com/blog/level-design-basics), [Efficient objective markers and waypoints (UEFN Central)](https://uefncentral.com/pl/blog/efficient-objective-markers-waypoints-uefn)
* Art direction: see [STYLE_GUIDE.md](STYLE_GUIDE.md)
