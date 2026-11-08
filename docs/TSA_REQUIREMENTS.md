# TSA Webmaster 2026-2027: requirements record

This file records what was **verified**, from where, and what was **not**. Nothing here is invented. Where the official text could not be read, the item is listed under "Not verified" and carried into `ASSUMPTIONS.md`.

## How the research was done, and its limit

The build sandbox's network policy blocked `tsaweb.org`, `washingtontsa.org`, `njtsa.tcnj.edu` and `sites.google.com` (DNS lookups failed, `curl` returned no response). Web search worked, so everything below comes from **search-result excerpts of official and state-TSA pages**, not from reading the official PDFs end to end. Before submission the team must read the current National Competitive Events Guide and the Webmaster rubric themselves and correct this file.

## Verified (from search excerpts)

| Item | Finding | Source |
| --- | --- | --- |
| Theme | Design and develop an **interactive Artificial Intelligence (AI) learning portal** aimed at **high school students (grades 9-12)**. | TSA "Themes and Problems" page, https://tsaweb.org/competitions/themes-and-problems |
| Sections | **At least three distinct learning sections** covering fundamental AI concepts, practical AI tools and techniques, and ethical AI usage. | same |
| Gamification | A **gamified interface that tracks progress**. Badges, experience points or a progress dashboard are named as examples. | same |
| Team size | One team per chapter, maximum six individuals; individual entries permitted. | TSA events eligibility chart, https://tsaweb.org/docs/default-source/competitions/events-eligibility-charts.pdf |
| Scoring structure | Website plus a semifinalist **interview**. Criteria are rated in bands (minimal, adequate, exemplary), some with X1 or X2 multipliers. The 2023-24 high school guide totals 130 points for the website and 50 for the interview (180). Earlier guides: 130 + 68 (2019-20), 130 + 70 (older sheet). **Point splits are year-specific.** | National and state guides found by search, e.g. https://oregontsa.org/wp-content/uploads/2023/11/HS-Webmaster.pdf |
| Portfolio | No portfolio criterion found in any Webmaster rubric excerpt. | same |
| Website basics (state-level variant) | Minimum of three completed pages, on separate pages linked from the home page, not just a scroll-down option. Middle school guide also asks for one page listing all sources used. | Washington TSA, https://www.washingtontsa.org/high-school-events/webmaster ; middle school website design guide |
| Dates (Washington only) | Registration December 18, 2026; virtual competition January 21, 2027; qualifying lists February 7, 2027. **State-specific.** | Washington TSA page |

## Not verified

- The 2026-27 rubric's exact criteria, wording and point weights.
- Required deliverables beyond the website and interview (documentation, planning log, presentation).
- Rules on frameworks, libraries, build tools, compiled languages, templates and CMS use.
- Rules on AI-generated code or assets, and citation and copyright rules in the 2026-27 general rules.
- File size, hosting and browser requirements.
- National submission deadlines and format.
- The literal phrase "Interactive AI Learning Portal" on an official page: the official wording found is "interactive Artificial Intelligence (AI) learning portal".

## What the site does about the unknowns

- It ships as plain static HTML, CSS and JavaScript (`dist/`), so it runs on any host and degrades without JavaScript.
- Every route is a real page with its own URL and HTML file, which satisfies the "separate pages linked from the home page" rule.
- A Credits page lists every library, font and asset with license and source.
- `COMPLIANCE.md` describes the plain-HTML/CSS/JS fallback path to take if the rules turn out to restrict frameworks, WebAssembly or AI-assisted code.
