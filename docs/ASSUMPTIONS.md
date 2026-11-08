# Assumptions and unverified items

Each line is something the project assumes or could not check. None of it should be presented to judges as verified.

## About the competition

1. **The official 2026-27 rubric, weights and deliverables were not read.** `tsaweb.org` was blocked in the build sandbox. The theme text and three-section requirement come from a search excerpt of the TSA "Themes and Problems" page.
2. The rubric is assumed to follow past years: a website score plus a semifinalist interview, with bands (minimal, adequate, exemplary).
3. Rules on frameworks, build tools, WebAssembly and AI-assisted code are **unknown**. See `COMPLIANCE.md`.
4. "Separate pages linked from the home page" is a Washington state-level wording. It is treated as a national expectation because it costs nothing to satisfy.
5. No portfolio is assumed to be required, because none appears in any Webmaster rubric excerpt found.
6. Dates in `TSA_REQUIREMENTS.md` are Washington's. National and your own state's dates must be checked.
7. The team size, roster and chapter details are unknown, so the About page has no roster.

## About the content

8. Statistics and findings in the lessons are cited from memory of the published work and rounded where noted: Gender Shades (error rates up to 34.7% and 0.8%), GPT-2 training-data extraction (Carlini et al., 2021), the stop-sign sticker study (Eykholt et al., 2018), GPT-3 few-shot learning (2020), chain-of-thought prompting (Wei et al., 2022), model cards (Mitchell et al., 2019), the EU AI Act (Regulation 2024/1689, adopted 2024), ImageNet at about 1.2 million images, and a 175-billion-parameter model. **Re-check each against its source before submission.**
9. The ten "further reading" links were **not fetched** from the build environment. Open each one.
10. Lesson difficulty is pitched for grades 9-12 by judgement, not tested with students.

## About the build

11. Lighthouse and the frame-rate budget were measured in a **software-rendered headless Chromium** with throttling, not on real hardware. See `PERFORMANCE_BUDGET.md` for the numbers and their meaning.
12. WebGPU was exercised through headless Chromium's SwiftShader adapter, which proves the code path and not real-GPU behaviour.
13. Safari and Firefox were not run. Only Chromium was exercised.
14. Screen-reader behaviour (NVDA, VoiceOver, JAWS) was not tested; the automated axe scan and the manual checklist in `A11Y_TEST_PLAN.md` are what exist.
15. The sandbox could not download `wasm-opt` from GitHub, so WebAssembly is optimised with Binaryen from npm (`-O4`, standard feature flags only).
16. Per-build encryption keys are random, so two builds of the same source produce different `dist/` bytes. Builds are functionally reproducible but not byte-reproducible.
17. The site assumes a modern browser (ES2022, module workers, `IntersectionObserver`).
18. Version pins reflect the registries on the build date. Newer versions were not tried, except where stated in `TECH_STACK_DECISION.md`.
