# Parameter

A free, illustrated **field guide to how machines learn**, for grades 9 to 12, built for the **TSA Webmaster 2026-27** challenge: *design and develop an interactive Artificial Intelligence (AI) learning portal*.

- **Three modules**, each with five core lessons: **Foundations** (what AI is and is not, rules versus learning, neural networks, training and inference, data and features), **Synthesis** (how a model reads a prompt, roles, tasks and constraints, examples and few-shot prompting, reasoning step by step, evaluating outputs) and **Ethics** (bias and fairness, privacy and data leakage, adversarial inputs, transparency and explanation, accountability). Earlier lessons without a place in those fifteen are kept as optional "go further" lessons in the matching module.
- **Three instruments**, one per module: *Neural topology* (follow a signal through a small network and change a weight), *Prompt console* (a clearly labelled simulation of how prompt settings shift a model's output) and *Vulnerability matrix* (four ways a system fails, with a realistic mitigation and a before-and-after comparison).
- **Guided experiments, unscored checks and six decision cases.** Checks are untimed, explain every answer and can be tried again. Nothing is scored, timed, locked or rewarded.
- **A glossary** (46 terms, each linking to where it is taught), a **tool atlas** (dated, sourced) and a set of common misconceptions.
- **A calm overview** of which lessons you have opened or marked complete. It is saved only in this browser, with no accounts, no server and no tracking. You can download it, load it, or erase it.
- **Original artwork**, hand-inked in code: a plate for the home page and one for each module.

The design is documented in [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md), the research and compliance notes in [docs/COMPLIANCE_CHECKLIST.md](docs/COMPLIANCE_CHECKLIST.md) and [docs/RESEARCH_2026-27.md](docs/RESEARCH_2026-27.md).

> **Read before submitting:** the official challenge requirements recorded in `docs/RESEARCH_2026-27.md` (item A3) ask for a *gamified* interface with badges, experience points and a progress dashboard. This version removes all gamification on purpose, at the owner's direction. See `docs/COMPLIANCE_CHECKLIST.md` (A3) and confirm with your advisor before you submit.

## Run it

Needs Node 20.19 or newer and pnpm 10.

```bash
pnpm install
```

```bash
pnpm dev
```

## Build and check

```bash
pnpm build
```

```bash
pnpm test
```

```bash
pnpm lint
```

```bash
pnpm contrast
```

A browser check of the built site: every page, sideways scrolling at 320, 390, 768 and 1280 px, axe accessibility scans, the mobile menu, old addresses, earlier saves, the unscored checks and the three instruments. It needs a Chromium; set `CHROMIUM_PATH` if Playwright's own is not installed:

```bash
pnpm build && pnpm smoke
```

## Your data, and old addresses

The only thing the site stores is which lessons you opened and which you marked complete (`parameter/learning/v2` in `localStorage`). Earlier versions saved points, levels, badges and game progress under `parameter/v1` (and `tideweight/v1`). On first load, the finished lessons from such a save are carried over to the new key and **the earlier save is left untouched**; it is removed only when you choose "Erase everything stored here" on the overview. Exports from earlier versions can be loaded too (only lesson completion is read).

The pages that used to exist (the game, missions, certification, challenges, achievements, the three "paths") redirect to the nearest page that still exists, with a short note, including when JavaScript is off (`src/content/legacy.ts`, written as small HTML pages at build time).

## Deploy

`dist/` is a complete static site: every page is a real folder with its own `index.html`, plus a `404.html`. Nothing needs a server or a database, so any static host works. The project is set up for **Vercel**.

`vercel.json` holds everything Vercel needs: the Vite framework preset, `pnpm install --frozen-lockfile`, the build command `pnpm lint && pnpm test && pnpm contrast && pnpm build` (a failing check stops the deployment), the output directory `dist`, and the headers (a strict Content-Security-Policy and friends on every page, and long-lived caching for the fingerprinted files in `/assets/`).

To publish it (once, by the repository owner): sign in at <https://vercel.com> with GitHub, choose **Add New... > Project**, import `nothikemu/webmaster`, leave the detected settings as they are, name the production branch under **Settings > Git**, and press **Deploy**. Open the live URL in a private window and open a lesson address directly to check deep links. The build creates `sitemap.xml` from Vercel's `VERCEL_PROJECT_PRODUCTION_URL`; set `SITE_URL` for a custom domain.

**The TSA submission is one website URL that must be public and not password-protected.**

## How it is organized

| Path | What lives there |
| --- | --- |
| `src/content/` | All teaching content as plain data: the three modules, their lessons (`lessons/`), the glossary, misconceptions, tools, cases, routes and the old-address map (`legacy.ts`) |
| `src/learning/` | What is remembered about a learner: `state.ts` (pure), `persistence.ts` (saving, migration, export and import), `store.ts` |
| `src/explainers/` | The three instruments and their pure models |
| `src/widgets/` | The guided experiments and the unscored check. The maths lives in `widgets/logic/` with no React in it |
| `src/art/` | The ink engine (`ink.ts`), the drawing helpers and the plates (`field/`), the diagram renderer, icons |
| `src/pages/`, `src/ui/` | Pages, the shell and primitives |
| `src/styles/` | Tokens and CSS |
| `tests/`, `scripts/` | Unit tests, the contrast checker, the browser check (`smoke.mjs`) |
| `docs/` | Design system, research, compliance checklist, interview guide, progress log |

Dependencies are deliberately few: React, plus three self-hosted open-licensed font families. The build and test tools are development-only.

## Licenses and credits

Fonts: Newsreader, IBM Plex Mono and Atkinson Hyperlegible (SIL Open Font License 1.1). Code: MIT. Artwork is original and generated by code in this repository. See the site's Credits page for the full list.
