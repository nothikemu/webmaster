# Compliance checklist: TSA Webmaster 2026-27

Each line maps an **official requirement** to the part of the product that meets it and to the evidence. "Verified" means checked by running the software, not by looking at the code. Items we could not verify are marked **OPEN** and are never marked done. Sources for the requirements are in `RESEARCH_2026-27.md`.

## A. Official challenge requirements

| # | Requirement (official source) | Where it is met | Evidence | Status |
| --- | --- | --- | --- | --- |
| A1 | Interactive AI learning portal for grades 9-12 that demystifies AI (tsaweb.org Themes and Problems) | The whole site | Content written for grades 9-12; `tests/content.test.ts` | Met |
| A2 | At least three distinct learning sections: fundamental concepts, practical tools and techniques, ethical use | Paths: Understand AI, Use AI, Use AI Responsibly (`/learn/*`) | `curriculum meets the TSA requirements` tests: 3 paths, 15 lessons, 5 each, mapped to the three sections | Met |
| A3 | Interactive, gamified interface (badges, XP, progress dashboard) that visually tracks completion | XP and 10 levels, 9 badges, Logbook dashboard, path meters, lesson route with step ticks | `tests/engine.test.ts` (rules); `scripts/smoke.mjs` finishes a lesson in a real browser and checks 210 XP, persistence and reset | Met |
| A4 | Semifinalist interview | `docs/INTERVIEW_GUIDE.md` | Team must read and be able to explain it | Team action |
| A5 | One website URL, public, not password-protected (tsaweb.org preconference page; Texas Online Submission Guidelines) | `dist/` is a static site with no login, no accounts. Deployed by `.github/workflows/pages.yml` to https://nothikemu.github.io/webmaster/ | Sub-folder build passes the full smoke suite locally (`SMOKE_BASE=/webmaster/`). Live URL check: see the deployment note below. | **OPEN until the live URL is opened in a private window** |

## B. Texas TSA (2026-27 HS Event Guidelines and Rulebook)

| # | Requirement | Status |
| --- | --- | --- |
| B1 | Webmaster runs "as written" (no Texas modification). Pre-submit is the website URL. Semifinal is an interview. 3 per region, 1 per chapter. | Noted. No action in the product. |
| B2 | Entries started and completed in the current school year; one event only; English only | Team action. The site is in English. |
| B3 | Professional citations (MLA, APA, Chicago or IEEE) for all outside material; failure risks a 20% violation | About page lists framework sources in APA style. The real-world cases on that page (Gender Shades, Reuters 2018, Mata v. Avianca, the 2024 robocall, the Copyright Office position) need the team to **verify against primary sources and add full references**. **OPEN** |
| B4 | Originality: "All work must be created and completed by the individual competitor(s) or team" | See C |
| B5 | Deadlines for regional and state | **OPEN: not published in the documents read. Ask your advisor.** |

## C. Generative-AI policy: **OPEN, needs your advisor**

- Texas TSA policy: GenAI "may only be used when permitted by the specific Competitive Event", must support the student's own work, and must be disclosed (Resources and AI Reflection Form when required). Penalty: 20% violation or disqualification.
- The **national Webmaster rules and rating form** that say whether GenAI is permitted are in the Competitive Events Guide, available to affiliated chapters only. We could not read them.
- Large parts of this project (code, lesson text, illustration code, tests) were produced with an AI coding assistant. That is logged in `AI_USE_LOG.md` and disclosed on the site's Credits page.
- **Before submitting:** the advisor reads the Webmaster rules and General Rules, confirms what is permitted and what must be disclosed, and the team completes any required AI Reflection. If the rules do not permit this level of AI help, this repository must not be submitted as the team's own work.

## D. Quality standards we set ourselves (not TSA requirements)

| Standard | How it is checked | Result |
| --- | --- | --- |
| WCAG 2.2 AA contrast | `pnpm contrast` checks 35 colour pairs read from the CSS tokens | All pass |
| WCAG 2.2 AA automated scan | `pnpm smoke` runs axe (wcag2a, 2aa, 21a, 21aa, 22aa) on all 30 routes at 1280px and 390px | 0 serious, critical or moderate findings in the loaded state |
| No horizontal scroll | Smoke test checks every route at 1280px and 390px; manual check at 320px | Pass |
| Keyboard | Skip link is the first Tab stop; focus moves to the new page after navigation; every control is native | Pass in smoke test |
| Reduced motion | `prefers-reduced-motion` stops all animation and transitions (`base.css`) | By design; not tested with a screen recording |
| Sound | Off by default, opt-in, original, no autoplay | Verified off by default in smoke test |
| Privacy | No analytics, no third-party requests, `connect-src 'self'` in `_headers` | Verified: zero failed or external requests in the smoke test |
| Content accuracy | `tests/content.test.ts` checks structure, answer keys and that every claim appears in its source text. **It cannot check facts.** | Facts need human review, see below |

## E. Known gaps, stated plainly

1. **Not verified:** the Webmaster rating form and criteria (member-only). We did not invent weights or page limits.
2. **Facts need a human re-check** before launch: every lesson statement, the five real-world cases, and the Tool Atlas entries marked "Reported, confirm".
3. **Screen readers** were not run. Automated and keyboard testing only.
4. **Browsers:** tested in Chromium only (Firefox, Safari not run).
5. **Axe scans the loaded state**, not every state of every experiment.
6. The decision-map plots in two experiments are visual. Their results are repeated in text.
7. Image, writing and data AI tools are **not** in the Tool Atlas because their official pages were not read.
8. GitHub Pages can only be switched on by the repository owner (Settings, Pages, Source: GitHub Actions). Until then the workflow cannot publish.
