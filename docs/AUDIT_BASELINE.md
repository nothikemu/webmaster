# Audit of the existing project

Done on 2026-11-08 before changing anything.

## What was actually in the repositories

- **`nothikemu/webmaster`** (this session's repository) was **completely empty**: no commits, no branches, no files. There was no Community Resource Hub site or any other site to audit.
- **`nothikemu/tsa-webmaster`** held the real existing project, "Parameter: Interactive AI Learning Portal" (commit `3c3e399`). It was imported unchanged as the baseline commit, then replaced.
- No city, county or chapter appeared anywhere. The Dallas Community Resource Hub direction discussed earlier in the session was dropped when the brief was corrected to the 2026-27 AI Learning Portal theme. Nothing from it was built, so there was nothing to remove.

## Baseline build and tests

- 75 of 75 unit tests passed. One test file failed to load because it needs an optional WebAssembly package that cannot be built without `wasm-pack`.
- The build succeeded (2.9 MB, including about 1.5 MB of three.js).

## What was kept (as ideas and tested logic)

| Kept | Where it went |
| --- | --- |
| The idea of one pure, tested rules function for XP and badges | `src/engine/progress.ts` (rewritten for the new curriculum, badges and rules) |
| Validated, versioned local saving with recovery from a corrupt save | `src/engine/persistence.ts` (rewritten) |
| 26 accurate glossary definitions | Reworked into 37 codex entries |
| Strict accessibility lint rules | `.eslintrc.cjs` |
| The three-module structure (Foundations, Synthesis, Ethics) | Became the three paths the brief names (Understand AI, Use AI, Use AI Responsibly) |
| Honest assumptions and compliance notes | Re-done in `COMPLIANCE_CHECKLIST.md` and `RESEARCH_2026-27.md` |

## What was replaced, and why

| Replaced | Reason |
| --- | --- |
| The visual identity | It used VALORANT's exact palette (`#0a121a`, `#ff4655`, `#ece8e1`), plus a violet module hue and generated HUD decoration (scanlines, graticules, corner brackets). The brief asks for an original identity and prohibits purple-blue palettes and HUD decoration. |
| The 3D, WebGPU, WebAssembly and worker stack | About 1.5 MB of three.js, a Rust kernel, a five-tier compute fallback ladder, signed saves, encrypted assets and obfuscated code. None of it served learning, and a student team must be able to explain every line. The new build ships about 83 KB of gzipped JavaScript for the main bundle. |
| Obfuscation and encrypted assets | They hide code from the people judging it and conflict with "the team can explain it". |
| The content model | One two-sentence check per lesson, three fixed badges, no tool catalog, simulator or certification. The brief needs objective, visuals, example, interactive element, check and completion state per lesson, plus several extra experiences. |
| Reveal-on-scroll behavior | Content stayed invisible until a scroll event fired, which was fragile. Nothing in the new build is hidden until it animates. |
| Monorepo and workspace layout | One flat app is simpler to explain. |

## Weak points found in the baseline

- Palette too close to a specific commercial game.
- Illustration was generated patterns rather than original artwork; no characters.
- Experiments were abstract 3D scenes that did not show a mechanism a student could follow.
- Documentation described the old stack and would have misled the team in an interview. It was removed.

## Removed because it belonged only to the old direction

The old stack and its docs. No Community Resource Hub functionality existed to remove.
