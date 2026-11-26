# Compliance checklist: TSA Webmaster 2026-27

Each line maps an **official requirement** to the part of the product that meets it and to the evidence. "Verified" means checked by running the software, not by looking at the code. Items we could not verify are marked **OPEN** and are never marked done. Sources for the requirements are in `RESEARCH_2026-27.md`.

## A. Official challenge requirements

| # | Requirement (official source) | Where it is met | Evidence | Status |
| --- | --- | --- | --- | --- |
| A1 | Interactive AI learning portal for grades 9-12 that demystifies AI (tsaweb.org Themes and Problems) | The whole site | Content written for grades 9-12; `tests/content.test.ts` | Met |
| A2 | At least three distinct learning sections: fundamental concepts, practical tools and techniques, ethical use | Modules: Foundations, Synthesis, Ethics (`/modules/*`), five core lessons each plus optional lessons | `tests/content.test.ts`: three modules mapped to the three sections, five core lessons each in the agreed order, every earlier lesson kept | Met |
| A3 | **Interactive, gamified interface (e.g. digital badges, experience points, a progress dashboard) that visually tracks completion** (as recorded in `RESEARCH_2026-27.md`) | **Removed on purpose, at the owner's direction (redesign brief of 2026-11-25).** There are no points, levels, badges, streaks, timers, leaderboards, rewards or unlockable content. What remains: a neutral overview that marks each lesson not started, started or complete, and shows 'n of 5 core lessons complete' per module, saved only on this device. | `pnpm smoke` checks that no page links to the old game, missions, achievements or challenge pages and that no points, level or streak display exists. | **OPEN, RISK: the recorded requirement asks for a gamified interface. Confirm with your advisor that the event accepts a portal without gamification before you submit. If it does not, the earlier gamified version is in git history (commit 815acc2).** |
| A4 | Semifinalist interview | `docs/INTERVIEW_GUIDE.md` | Team must read and be able to explain it | Team action |
| A5 | One website URL, public, not password-protected (tsaweb.org preconference page; Texas Online Submission Guidelines) | `dist/` is a static site with no login, no accounts. It is deployed to GitHub Pages by `.github/workflows/pages.yml` (steps in the README) at https://nothikemu.github.io/webmaster/. `vercel.json` is kept for an optional Vercel copy. | The Pages build (`BASE=/webmaster/`) passes the full smoke suite locally under `SMOKE_BASE=/webmaster/`. The live Pages URL was not opened from the build environment, so it is **not** checked. | **OPEN until the workflow run is green and the URL is opened in a private window** |

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
- **Before submitting:** the advisor reads the Webmaster rules and General Rules and confirms what the event permits and what it requires the team to submit.

## C2. Rules reported for earlier years: **OPEN, confirm in the current guide**

On 2026-11-10 a web search surfaced public copies of **earlier** Webmaster rules (a chapter-run reference site, an older rules PDF and a New Jersey TSA reminder sheet). We could not open those pages from the build environment, so the wording below comes from search summaries, and none of it is confirmed for the 2027 and 2028 conferences. Treat each line as a question to check in the current Competitive Events Guide.

| Reported rule (earlier years) | Where this project stands | Status |
| --- | --- | --- |
| Website builders and "template engine" sites such as Wix, Weebly and Webs are not permitted. A state sheet adds Squarespace, Google Sites and hosting-company site builders. | Not built with any site builder. Hand-written TypeScript, React and CSS, built with Vite. Stated on the About page under "How the site is built". | **OPEN: confirm the current list, and whether the hosting service matters** |
| Frameworks are allowed, but pre-built templates and themes are not. | React is a framework. No template or theme is used: the layout, styles and artwork are original to this project. | **OPEN: confirm, and whether a framework statement is required** |
| Team documentation (reported as a Student Copyright Checklist and a Plan of Work log) must be available on a page of the website. | Not yet on the site. `docs/DEV_LOG.md` is a blank log for the team to fill in. If the current rules require these, add them as links on the About page. | **OPEN: team action** |

## D. Quality standards we set ourselves (not TSA requirements)

| Standard | How it is checked | Result |
| --- | --- | --- |
| WCAG 2.2 AA contrast | `pnpm contrast` checks 53 colour pairs read from the CSS tokens | All pass |
| WCAG 2.2 AA automated scan | `pnpm smoke` runs axe (wcag2a, 2aa, 21a, 21aa, 22aa) on 20 pages at 1280px, plus the menu open, an instrument in use and an answered check at 390px | 0 serious or critical findings (last run 2026-11-25) |
| No horizontal scroll | `pnpm smoke` checks every page (36) at 320, 390, 768 and 1280px, and text enlarged to 200% on a 640px window | Pass |
| Keyboard | Skip link is the first Tab stop; focus moves to the new page after navigation; every control is native | Pass in smoke test |
| Motion | Three short durations, no bounce, nothing that loops, no autoplay. `prefers-reduced-motion` removes all animation and transitions (`base.css`, `tokens.css`) | Checked in `pnpm smoke`; not tested with a screen recording |
| Sound | None. The earlier synthesized sound and music were removed with the game. | n/a |
| Privacy | No analytics, no third-party requests, `connect-src 'self'` in `vercel.json`. The only stored data is which lessons were opened or completed, in `localStorage`. | Verified: the smoke test finishes with zero console errors; no external requests are made by the pages |
| Content accuracy | `tests/content.test.ts` checks structure, answer keys and that every claim appears in its source text. **It cannot check facts.** The facts in the nine lessons restored from the first version of the portal (and in the vulnerability matrix) are quoted from that version, not re-verified. | Facts need human review, see below |

## D2. The redesign of 2026-11-25

- [x] **No gamification.** Removed: points, levels, ranks, badges, streaks, missions, timed modes, leaderboards, the certification and its certificate, the scored scenarios and lab, the game and its 3D engine, sound and music. Checks and experiments are untimed, unscored, explained and repeatable. Nothing is locked.
- [x] **Learner data is carried over, not erased.** Finished lessons from `parameter/v1` and `tideweight/v1` saves are copied to `parameter/learning/v2`; the earlier key is left untouched until the learner erases it (`tests/learning.test.ts`, `pnpm smoke`).
- [x] **Old addresses do not break.** `/play`, `/missions`, `/achievements`, `/challenge/*`, `/certification`, `/learn/*` and the like redirect to the nearest page that exists, with a note, including without JavaScript (`src/content/legacy.ts`; `tests/learning.test.ts`; `pnpm smoke`).
- [x] **Simulations are labelled.** The prompt console says on the page that no model is called and that the same settings always give the same numbers. The vulnerability matrix says its numbers are illustrative. The neural topology uses fixed example weights.
- [x] **Every instrument has a keyboard path and a text explanation** (sliders, a select, buttons, a table of the arithmetic, a live-region note saying what changed and why).
- [x] **All artwork is drawn in code**; no stock images; nothing copied from the reference sites. The design research and its limits are in `docs/DESIGN_SYSTEM.md`.
- [x] **Content merge decision.** The redesign brief lists fifteen lessons that match the first version of the portal, while the repository's current lessons were different. The fifteen listed lessons are the core of each module (six reuse current lessons, nine are restored from the first version in git history), and every current lesson without a place in them is kept as an optional go-further lesson (nine of them). Nothing was deleted.
- [ ] Not tested with a screen reader or on a physical phone.

## E. Known gaps, stated plainly

1. **Not verified:** the Webmaster rating form and criteria (member-only). We did not invent weights or page limits.
2. **Facts need a human re-check** before launch: every lesson statement, the five real-world cases, and the Tool Atlas entries marked "Reported, confirm".
3. **Screen readers** were not run. Automated and keyboard testing only.
3a. **Gamification (A3).** See the A3 row. This is the main compliance risk of the redesign.
3b. The Awwwards archive could not be opened, so the design research covers the specific sites listed in `docs/DESIGN_SYSTEM.md` and no more.
4. **Browsers:** tested in Chromium only (Firefox, Safari not run).
5. **Axe scans the loaded state**, not every state of every experiment.
6. The decision-map plots in two experiments, the neural topology drawing and the matrix grid are visual. Their results are repeated in text.
7. Image, writing and data AI tools are **not** in the Tool Atlas because their official pages were not read. Four of the eight listed tools are read on the vendor's page; the other four are marked "Reported, confirm".
8. The live URL was not opened from the build environment, which cannot reach it. Open it in a private window before you submit.
9. The artwork is drawn by code. It was checked in screenshots at 1440 and 390 pixels wide (and for overflow at 320 and 768), not on a range of real devices.
