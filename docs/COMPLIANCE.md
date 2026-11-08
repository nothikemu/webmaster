# Compliance profile

**Rules beat style.** The 2026-27 TSA rules on frameworks, build tools, compiled languages and AI-generated code or assets **could not be read** from the build environment (`TSA_REQUIREMENTS.md`). So this file states what is known, what the build does regardless, and exactly how to produce a compliant variant if the rules turn out to restrict anything.

## What the build guarantees regardless of the rules

- The shipped artifact is a **static folder** of HTML, CSS and JavaScript (plus one WebAssembly binary and one encrypted data file). It runs from any static host, with no server and no database.
- Every page is a **real HTML file with readable content**, so it works with JavaScript off and is indexable.
- All imagery, icons, badges, shaders and 3D geometry are **authored in this repository**. No stock media.
- Every library, font and third-party snippet is listed with license and source (`ORIGINALITY_AND_CREDITS.md`, `/credits`). The two typefaces (Big Shoulders Display and Barlow, both SIL OFL 1.1) are open-licensed and bundled, so they work offline and send no request to a font host.
- `DEV_LOG.md` is a structured template for the **team's own** planning and process record. It contains no invented history.

## Decision points the team must resolve before submission

| Question to check in the official guide | If "restricted" | Action |
| --- | --- | --- |
| Are frameworks and libraries (React, three.js) allowed? | Not allowed | Use the **plain profile** below |
| Are build tools (Vite, TypeScript, Rust) allowed, or must the site be hand-written? | Hand-written only | Plain profile; the compiled `dist/` can still be submitted if only the output is judged, but the team must be able to explain every line |
| Is WebAssembly or compiled code allowed? | Not allowed | Delete `src/wasm`, run `pnpm build` without `pnpm wasm`: every kernel falls back to its TypeScript twin automatically (`REQUIRE_WASM` is off by default) |
| Is AI-generated code or text allowed, and how must it be disclosed? | Not allowed, or disclosure required | See "AI assistance" below |
| Is a minimum or maximum file size or page count imposed? | Yes | Check `dist/` sizes in `PERFORMANCE_BUDGET.md` |
| Does hosting have to be on a specific platform? | Yes | `BASE=/path/ pnpm build` supports sub-path hosting; `_headers` is optional (see `README.md`) |

## Plain-profile variant (hand-written HTML, CSS, vanilla JS)

The design, content and modules transfer one-to-one. To build it:

1. Keep `src/content/*` (plain data) and `src/assets/*` (shaders, SVG, strings) unchanged; they are not framework code.
2. Replace React components with plain ES modules that render the same markup. The static HTML produced by `plugins/staticRoutes.ts` is already the reference markup for every page.
3. Keep `core/gamification.ts`, `core/schema.ts`, `core/persistence.ts`, `core/spring.ts`, `core/crypto.ts` and `core/burst.ts`: they are framework-free TypeScript and already have tests.
4. Use `three` directly (already imperative in `SwarmScene.ts` and `WireframeScene.ts`) or raw WebGL with the GLSL files.
5. Drop XState and Zustand; the reducer is a plain function and the store can be a small subscribe/notify object.
6. Drop the obfuscation, encryption and checksum plugins if "must be readable by judges" is a rule. They are build options in `vite.config.ts`, not features the site depends on (`NO_OBFUSCATE=1` disables the obfuscator).

## AI assistance

Large parts of this project were drafted with an AI coding assistant and then built, run and tested. If the rules prohibit AI-generated code, this repository must not be submitted as the team's work. If they require disclosure, state it in the interview and keep `DEV_LOG.md` honest about which parts the team wrote, reviewed, changed or rejected. The Credits page already says AI assistance was used.

## Deviations from the written default stack

Listed with reasons in `TECH_STACK_DECISION.md`: no React Three Fiber, Vite 7 instead of 8, TSL obfuscated rather than encrypted, post-processing on WebGL2 only, `@swc/core` pinned for the top-level-await plugin.

## Hardening, stated plainly

Client code cannot be made impossible to reverse engineer. The encrypted asset table, obfuscated cold-path chunks, build checksums and signed save data **raise the cost of casual copying and tampering**. They are not a security boundary, they use no debugger traps or infinite loops, and they never block keyboard, screen-reader or reduced-motion use. Source maps are disabled in production.
