# Parameter design system

Parameter is a **hand-inked field guide to how machines learn**. It borrows the authority of an illustrated natural-history book (numbered plates, figure captions, margin notes) and the precision of a laboratory instrument (labelled controls, live readouts, numbers you can check). This file explains the choices, how they were reached, and the rules that keep every page consistent.

## Design research (what was actually inspected)

Done on 2026-11-25 in a headless Chromium at desktop (1440 px) and phone (390 px) widths, with software WebGL. The Awwwards archive and directory pages could **not** be opened (the site resets connections, even from a real browser), so awards were read from Awwwards listing text that appeared in search results, not from Awwwards itself.

| Site | What was seen | What it taught |
| --- | --- | --- |
| landonorris.com (OFF+BRAND) | Past its "Load Norris" gate: the message section on desktop and the staggered gallery on a phone. Computed type and colours. | One project-specific motif carries the identity (contour lines, a signature, place-and-year captions). Phones are recomposed, not shrunk. |
| OFF+BRAND case study | Read as text only (images not viewed). | The agency treated performance and motion as part of the design. |
| polpharmabiologics.com | The hero on desktop and phone. Below-the-fold sections did not paint in headless (scroll-triggered reveals), so only the copy was read. | A tightly set serif headline over one abstract object, with one warm accent for the one action. |
| 2025.oceanx.org | Hero and closing section, desktop and phone. | Giant type overlapping one image, monospace kickers, one warm accent, audio off by default. |
| igloo.inc | Partly rendered (a WebGL igloo mid-animation). | The whole world is one object, and a thin overlay shows how it is built. |
| lusion.co | Desktop hero after about a minute of loading. Phone stayed on the loader. | An identity built on one "node" object in cobalt, black and grey. Also what heavy WebGL costs: a minute in software rendering. |
| unseen.co (Seascape Survey case study) | The entry gate and the case-study text. | A small drawn mark, a display serif beside a plain sans, an "enter without audio" option, and a stated aim to educate a broad public. |
| mouthfulofdust.slv.vic.gov.au | The entry screen only. The body never loaded in headless. | Content before effect: a slow, text-first opening. |

Nothing was copied: no composition, wording, asset, code or interaction. The principles were turned into Parameter's own idea.

## The idea

A parameter is the one number you can turn. That is the mark: a hand-drawn **tuned line** with a small ring on it (the handle). It is the logo, the section divider, and the thumb of the instruments' sliders. Every concept in the guide is a **plate**: a numbered figure, an annotated drawing, a caption, and a passage written to be read.

## Colour (`src/styles/tokens.css`)

Every pair that carries text is checked by `pnpm contrast`, which reads the hex values from the tokens (53 pairs, all pass).

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Paper | `--bone` / `--bone-hi` / `--bone-lo` | `#f1ece0` / `#f9f6ee` / `#e6dfcf` | Page, raised surfaces (plates, cards), quiet fills |
| Ink | `--graphite` / `--graphite-2` / `--graphite-3` | `#17181d` / `#44454d` / `#5f6068` | Text (15:1 on bone), secondary text (8:1), tertiary (5.3:1) |
| Structure | `--cobalt`, `--cobalt-lo`, `--cobalt-hi` | `#2038c4`, `#1a2d9e`, `#9aabff` | **Foundations**: networks, weights, links |
| Language | `--vermilion`, `--vermilion-lo`, `--vermilion-hi` | `#d8421d`, `#a52f0e`, `#ff8f6d` | **Synthesis**: prompts, tokens, odds |
| Caution | `--ochre`, `--ochre-lo`, `--ochre-hi` | `#c78a0f`, `#7a5300`, `#f2bb3d` | **Ethics**: risk, failure |
| Dark plate | `--night`, `--night-2` | `#14151a`, `#1e2027` | The Ethics hero and the footer only |

Rules: the saturated accent is used for graphics and large numerals; text in an accent colour uses the `-lo` value on light surfaces and the `-hi` value on the dark plate. Status is never colour alone: an open circle, a half circle and a filled circle (with the words), dashes for negative weights, hatching for the "casual" opener.

## Type

| Style | Face | Use |
| --- | --- | --- |
| Display and reading | **Newsreader** (variable, optical sizes), upright and italic | Headlines at large optical size, body at 19 px (18 on phones), lines of about 62 characters |
| Technical | **IBM Plex Mono** 400 and 500 | Kickers, figure numbers, units, numerals (tabular, slashed zero) |
| Interface | **Atkinson Hyperlegible** 400 and 700 | Buttons, navigation, form text, captions |

Scale: `--t-mono` 13 px, `--t-ui` 16, `--t-sm` 15, `--t-0` 19, `--t-1` 23, then three fluid steps up to a 96 px headline. Headlines are light (weight 350) with one italic word set in the module colour. The fonts are bundled with Fontsource and served from the site (no external requests): about 200 kB of woff2 for the serif (upright and italic), 15 kB each for Plex Mono, 17 kB each for Atkinson.

## Layout

A 12-column grid in a 82 rem container with fluid gutters (20 to 56 px). Pages use the grid differently on purpose:

- **Home**: headline left, plate right; a labelled "Contents" band; then each module in its own composition (plate left and text right; text above a wide specimen on a tinted band; a dark panel with four columns).
- **Modules**: three comparison columns.
- **A module**: three hero compositions (art right, art as a banner, dark panel with art left) over one information architecture: objective, five lessons, the instrument, optional lessons, the next module.
- **A lesson**: a left rail (position in the module), a 38 rem reading column, and a right margin of key ideas and terms. On a phone the rail goes away and the margin notes follow the text.
- **Reference pages**: a sticky contents list beside the text.

## Components

Buttons (graphite fill or outline, 48 px, arrow that slides on hover), answer options (a boxed native radio or checkbox), callouts, tags, tables, plates, disclosures, status marks. Every control has rest, hover, pressed, focus, selected and disabled states, a visible 3 px cobalt focus ring (paper-coloured on the dark plate), and at least 44 px of height.

## Illustration

Everything is drawn in code. `src/art/ink.ts` turns a few points into tapered, wobbling brush strokes, hatching and stippling (deterministic, so a drawing never changes between renders); `src/art/field/` wraps it in small helpers (`Pen`, `Loop`, `Round`, `Shade`, `Dots`, `Wash`) and composes the plates:

- **Plate I** (home): a handwritten 7 as a grid of inked pixels climbs through three layers of units to ten bars of confidence, the strongest route in vermilion. The five annotations are real HTML laid over the drawing on wide screens and a numbered list under it on narrow ones.
- **Foundations**: the anatomy of one unit, with consistent numbers (0.8 × 0.8 + 0.2 × 0.1 + 0.6 × 0.4 = 0.90, and the squash curve gives 0.71).
- **Synthesis**: a prompt annotated as role, task and constraints, with the next-word odds fanning out below and a temperature dial. A second, narrower composition is swapped in on phones.
- **Ethics**: four small studies of how a system fails: bias, leakage, attack, opacity.

Text inside a drawing is live SVG text and only decorative. The meaning is always in HTML beside it or in the figure's description.

## Instruments

Three, one per module, each with a visible purpose, usable controls, feedback and a written explanation. They are small, dependency-free, and deterministic: **Neural topology** (follow one signal through a network and change a weight), **Prompt console** (a clearly labelled simulation of how prompt settings shift the odds of an answer's first word), **Vulnerability matrix** (four failures, each with warning signs, a realistic mitigation and a before-and-after comparison on illustrative numbers). The model logic lives in `src/explainers/*Model.ts` as pure functions with tests.

## Motion

Short (120 to 420 ms), ease-out, and only to explain a change: a page settles in, a bar eases to its new width, an arrow slides. No scroll hijacking, no parallax, nothing loops or plays on its own, no autoplay audio. `prefers-reduced-motion` removes all of it (checked in `pnpm smoke`).

## Responsive and accessible

WCAG 2.2 AA is the target. Checked at 320, 390, 768 and 1280 px for sideways scrolling on every page, with axe on 20 page states, a keyboard menu (native dialog: focus trap, Escape, focus return), text enlarged to 200%, and a skip link. See the Accessibility page for what is claimed and the known limits.

## Performance

No WebGL, no animation libraries, no images (all vector). The first page loads about 84 kB of JavaScript (gzip) plus about 11 kB of CSS, and each route adds a chunk of 2 to 13 kB (the lesson chunk is 13 kB, an instrument 4 to 5 kB). The earlier version shipped a 580 kB 3D engine for its game, which is gone.

## What we avoided on purpose

Neon on black, glass cards, gradients as decoration, rainbow buttons, icon-pack grids, stock "AI brain" art, cartoon empty states, hover-only controls, points, levels, badges, streaks, timers, confetti.
