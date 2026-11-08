# Tech stack decision

## Recommendation

**Build with the advanced stack, ship static HTML/CSS/JavaScript, and keep the plain profile as a documented fallback.** The deliverable is a folder of static files; the toolchain only produces it. Because the TSA rules on frameworks and AI-assisted code could not be verified (`TSA_REQUIREMENTS.md`), the team must confirm them before relying on this choice. If the rules restrict any of it, follow `COMPLIANCE.md`.

## Decision table

| | **Advanced stack (built)** | **Plain HTML / CSS / vanilla JS** |
| --- | --- | --- |
| Output | Static `dist/` of HTML, CSS, JS, one WASM binary | Hand-written static files |
| Languages | TypeScript (strict), Rust, GLSL, WGSL, TSL, CSS | HTML, CSS, JavaScript |
| UI | React 18, hand-written router | Hand-written DOM code |
| State | Zustand + XState v5 | Hand-written modules |
| 3D | three r187 (WebGL2 and WebGPU) | three, or raw WebGL |
| Compute | WebGPU, WebGL2 float textures, WASM worker, WASM, TypeScript | WebGL or JavaScript |
| Rationale | Typed state machines and a 5-tier compute ladder keep the portal fast on weak devices; strong guarantees (types, tests) | Smallest surface to explain in an interview; zero toolchain |
| Risks | Largest explanation burden; build tooling; third-party code a judge may count against "originality" | Slower to reach the same polish; less type safety |
| Browser support | Chrome, Edge, Firefox, Safari with WebGL2; WebGPU where present; no-JS gets readable pages | Wider on paper, same in practice |
| Rule-compliance verdict | **Unverified.** Compliant if frameworks and build tools are allowed and AI assistance is disclosed or permitted | **Safe under every plausible reading** |

## Deviations from the written stack, and why

| Asked for | Built | Reason |
| --- | --- | --- |
| `@react-three/fiber`, `drei`, `@react-three/postprocessing` | Imperative three scenes in `SceneCanvas` | R3F 8 cannot await `WebGPURenderer.init()`; R3F 9 needs React 19 (the brief fixes React 18); the single master loop and one-module renderer factory are simpler without it |
| Vite (latest) | Vite 7.3.7 (8.3.5 exists) | Plugin set (`vite-plugin-wasm`, `vite-plugin-top-level-await`) not tested on Vite 8's Rolldown |
| TSL sources encrypted | TSL materials obfuscated, GLSL/WGSL/SVG/strings encrypted | TSL is executable JavaScript, not a string; it can only be obfuscated |
| `vite-plugin-top-level-await` | Used, with `@swc/core` pinned to 1.12.14 | 1.6.0 of the plugin crashes against `@swc/core` 1.16 ("missing field `type`") |
| Post-processing | None | The scenes are flat discs and wires on a dark stage, so there is no bloom, aberration or grain on either renderer; the `postprocessing` library was removed |

## Renderer and compute strategy

One module (`gpu/rendererFactory.ts`) picks the renderer: WebGPU (`three/webgpu`, TSL materials) when an adapter is acquired, otherwise WebGL2 (GLSL `ShaderMaterial`s). If WebGPU fails after the canvas is bound, the host retries on a fresh canvas with WebGL2. Module A's simulation is chosen separately, in order: WebGPU compute (WGSL, read back to the CPU) → WebGL2 float-texture GPGPU → WASM in a worker → WASM on the main thread → TypeScript. All five run the same kernel; the Rust integrator and the TypeScript reference agree to 1e-7 on deflect and orbit (attract passes particles through a singular point and agrees at the 95th percentile to 1e-3). URL overrides `?renderer=` and `?compute=` force a path for testing, and `?quality=0..3` forces a quality tier.

## Headers and capabilities

| Capability | Needs | Fallback |
| --- | --- | --- |
| `SharedArrayBuffer` (worker positions) | `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` (`_headers`, `vite.config.ts`) | Transferable ping-pong buffers |
| WebGPU | Secure context, adapter | WebGL2 |
| WebGL2 float render targets | `EXT_color_buffer_float` | WASM or TypeScript compute |
| WASM SIMD | `WebAssembly.validate` of a SIMD probe | Scalar WASM build |
| `SubtleCrypto` | Secure context | WASM HMAC, then pure TypeScript |
| `OffscreenCanvas` + Worker | both | Burst drawn on the main thread |

## Pinned versions

Exact versions are pinned in `package.json`, `apps/portal/package.json` and `crates/core/Cargo.toml` (`wasm-bindgen = "=0.2.130"`). Versions were read from the npm and crates registries on the build date.
