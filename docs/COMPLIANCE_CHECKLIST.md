# Compliance checklist: TSA Webmaster 2026-27

Each line maps an **official requirement** to the part of the product that meets it and to the evidence. "Verified" means checked by running the software, not by looking at the code. Items we could not verify are marked **OPEN** and are never marked done. Sources for the requirements are in `RESEARCH_2026-27.md`.

## A. Official challenge requirements

| # | Requirement (official source) | Where it is met | Evidence | Status |
| --- | --- | --- | --- | --- |
| A1 | Interactive AI learning portal for grades 9-12 that demystifies AI (tsaweb.org Themes and Problems) | The whole site | Content written for grades 9-12; `tests/content.test.ts` | Met |
| A2 | At least three distinct learning sections: fundamental concepts, practical tools and techniques, ethical use | Paths: Understand AI, Use AI, Use AI Responsibly (`/learn/*`) | `curriculum meets the TSA requirements` tests: 3 paths, 15 lessons, 5 each, mapped to the three sections | Met |
| A3 | Interactive, gamified interface (badges, XP, progress dashboard) that visually tracks completion | XP and ten ranks, nine badges, a day streak, the Logbook dashboard, path meters, the lesson route with step ticks, and four pictures that fill in with progress (harbor lanterns, the sea chart, the Codex cabinet, the Logbook medal rail) | `tests/engine.test.ts` (rules); `scripts/smoke.mjs` finishes a lesson in a real browser and checks 210 XP, persistence and reset | Met |
| A4 | Semifinalist interview | `docs/INTERVIEW_GUIDE.md` | Team must read and be able to explain it | Team action |
| A5 | One website URL, public, not password-protected (tsaweb.org preconference page; Texas Online Submission Guidelines) | `dist/` is a static site with no login, no accounts. It is configured for Vercel (`vercel.json`; steps in the README) and served from the root of its domain. The earlier GitHub Pages copy at https://nothikemu.github.io/webmaster/ stays at its last version until it is turned off. | The built site passes the full smoke suite locally. The Vercel project has not been created yet, so there is no live Vercel URL to check. | **OPEN until the Vercel project exists and its URL is opened in a private window** |

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
| WCAG 2.2 AA contrast | `pnpm contrast` checks 35 colour pairs read from the CSS tokens | All pass |
| WCAG 2.2 AA automated scan | `pnpm smoke` runs axe (wcag2a, 2aa, 21a, 21aa, 22aa) on all 30 routes at 1280px and 390px | 0 serious, critical or moderate findings in the loaded state (last run 2026-11-10) |
| No horizontal scroll | Smoke test checks every route at 1280px and 390px; manual check at 320px | Pass |
| Keyboard | Skip link is the first Tab stop; focus moves to the new page after navigation; every control is native | Pass in smoke test |
| Motion | Four durations, no bounce, nothing that loops, so no pause control is needed. `prefers-reduced-motion` stops all animation and transitions (`base.css`) | By design; not tested with a screen recording |
| Sound and music | Off by default, opt-in, original, no autoplay. No audio files. No audio context exists until the player switches sound on. Separate master, music and effects volumes, and a mute button, all saved. | Smoke test checks: no context before opt-in; the music button starts a running engine that schedules notes and puts signal on the output; the button stops it. **A person has not listened to it**, so judge the music by ear. |
| Privacy | No analytics, no third-party requests, `connect-src 'self'` in `_headers` | Verified: zero failed or external requests in the smoke test |
| Content accuracy | `tests/content.test.ts` checks structure, answer keys and that every claim appears in its source text. **It cannot check facts.** | Facts need human review, see below |

## D2. The game (added with `/play`)

- [x] The game is an addition, not a replacement: every required lesson, the Codex, the Tool Atlas, the scenarios and the certification stay ordinary pages reachable from the main menu (checked by the smoke test on all 31 routes).
- [x] The three required learning areas each have stations and relics, mapped in `docs/GAME_DESIGN.md`.
- [x] No secrets, no accounts, no network requests; progress is saved only in the browser, with an erase button in the pause menu.
- [x] All artwork is drawn in code and all sound is synthesized in the browser: no stock images, no audio files, nothing copied. (The generative-AI policy question in section C still applies to how the project was produced; it is unresolved.)
- [x] Simulations are labeled as simulations on the screen they appear on (the forge is not a live AI; the classifier is a one-nearest-neighbor model; the audit's people are invented).
- [x] Keyboard, touch and mouse play; a non-visual route to every action ("In this room"); sound off by default; reduced motion respected.
- [x] The 3D version uses Three.js (MIT license, credited on the Credits page); everything drawn or heard is generated in code. WebGL2 is required for 3D; without it the 2D version starts automatically.
- [x] The poster look (black, white and one red; cel bands, halftone, thick outlines, slanted menus) is a *design vocabulary* chosen after research, written up in `docs/STYLE_GUIDE.md`. It uses no asset, name, logo, character, font, music or iconography from any game; every shape, texture, shader and sound is generated in code. (Reviewers should still judge whether the resemblance is acceptable under the competition's originality rule; that decision is not ours to make.)
- [x] Red is never the only signal: the goal is also named in words with its distance in the Objective box and on its label; locked doors say "Locked" in words; contrast of the red pairs is checked by `pnpm contrast`.
- [ ] Not tested with a screen reader or on a physical phone.

## E. Known gaps, stated plainly

1. **Not verified:** the Webmaster rating form and criteria (member-only). We did not invent weights or page limits.
2. **Facts need a human re-check** before launch: every lesson statement, the five real-world cases, and the Tool Atlas entries marked "Reported, confirm".
3. **Screen readers** were not run. Automated and keyboard testing only.
4. **Browsers:** tested in Chromium only (Firefox, Safari not run).
5. **Axe scans the loaded state**, not every state of every experiment.
6. The decision-map plots in two experiments are visual. Their results are repeated in text.
7. Image, writing and data AI tools are **not** in the Tool Atlas because their official pages were not read. Four of the eight listed tools are read on the vendor's page; the other four are marked "Reported, confirm".
8. The deployment workflow reports success, but the live URL was not opened from the build environment, which cannot reach it. Open it in a private window before you submit.
9. The artwork is drawn by code. It was checked in screenshots at 1440 and 390 pixels wide, not on a range of real devices.
