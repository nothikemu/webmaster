# Rubric matrix

Every requirement that can be sourced, mapped to the feature or document that satisfies it. **The official 2026-27 rubric lines and weights could not be read** (see `TSA_REQUIREMENTS.md`), so the first block is the sourced theme and website requirements, and the second block is the generic criteria Webmaster rubrics have used in past years. When the team has the real rubric, replace the "Rubric line" column with its exact wording and weights, and keep the "Where" column.

Status key: **Done** = implemented and covered by the smoke test or unit tests. **Doc** = delivered as a document the team must complete or defend.

## A. Sourced requirements

| # | Requirement | Source | Where it lives | Status |
| --- | --- | --- | --- | --- |
| A1 | Interactive AI learning portal, grades 9-12 | Theme text | Whole site; lesson register in `src/content/*` | Done |
| A2 | Section on fundamental AI concepts | Theme text | Module 01 Foundations: `content/moduleA.ts`, `modules/ModuleA/*` | Done |
| A3 | Section on practical AI tools and techniques | Theme text | Module 02 Synthesis (prompt engineering): `content/moduleB.ts`, `modules/ModuleB/*` | Done |
| A4 | Section on ethical AI usage | Theme text | Module 03 Ethics: `content/moduleC.ts`, `modules/ModuleC/*` | Done |
| A5 | Gamified interface | Theme text | XP, levels, streaks, mastery states, badges: `core/gamification.ts`, `ui/Badges.tsx`, `ui/TelemetryHub.tsx` | Done |
| A6 | Progress tracking | Theme text | Dashboard `pages/ProgressDashboard.tsx`; persistence `core/persistence.ts` | Done |
| A7 | At least three separate pages linked from home | State guide | 30 emitted HTML files, one per route: `plugins/staticRoutes.ts`; smoke test "deep links render real pages" | Done |
| A8 | Page listing sources | Middle school guide | `/credits` and `/glossary` (further reading) | Done |
| A9 | Interview on design and originality | Scoring structure | `DEV_LOG.md`, `ORIGINALITY_AND_CREDITS.md`, `TECH_STACK_DECISION.md` | Doc |

## B. Generic criteria (confirm against the real rubric)

| Typical criterion | Evidence in the project |
| --- | --- |
| Meets the design brief and theme | Section A above; `SITEMAP.md` |
| Content: accurate, complete, age-appropriate | 15 lessons, 15 check questions, 3 challenges, 26-term glossary; named sources in `/credits`; content tests in `tests/modules.test.ts` |
| Navigation and structure | Persistent header, module tabs, breadcrumb-style eyebrow labels, skip link; `SITEMAP.md` |
| Visual design and consistency | Token set in `styles/tokens.css`; one easing curve; `WIREFRAME_HOME.md` |
| Interactivity and functionality | Three interactive centerpieces, quizzes, challenges; Playwright smoke test (23 checks) |
| Accessibility | WCAG 2.2 AA target; `/accessibility` page; jsx-a11y lint; axe scan on 7 pages with zero serious or critical violations; `A11Y_TEST_PLAN.md` |
| Browser compatibility and fallbacks | Five compute tiers, WebGL2/WebGPU renderers, no-JS static pages, reduced motion; `TECH_STACK_DECISION.md` |
| Performance | Budget and measurements in `PERFORMANCE_BUDGET.md` |
| Originality and attribution | `ORIGINALITY_AND_CREDITS.md`, `/credits` page; all imagery, icons and geometry authored in the repo |
| Documentation and planning | `docs/` (this folder); `DEV_LOG.md` template for the team's own record |
| Code quality | TypeScript strict, ESLint clean, 90 unit tests, Rust crate with 20 tests |
