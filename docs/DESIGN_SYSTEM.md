# Design system and art direction

## The idea

**Tideweight is a harbor town printed in four inks on aged paper.** You learn how AI works by walking its three places: the Loom House (how models are woven from data), the Foundry Docks (using AI tools well), and the Beacon (seeing risk and keeping judgment). A small round automaton, **Kernel**, in a woven travelling hat, guides you.

The interface borrows the *discipline* of a premium competitive-game menu: precise rectilinear panels, diagonal cut corners, hard offset shadows, buttons that visibly press, very few colours. The illustration borrows the mood of hand-inked print and Japanese graphic design: flat colour, heavy ink outlines, screentone dots, wave patterns. Neither is copied.

## What we deliberately avoided

The brief prohibits Y2K, Frutiger Aero, acid, vapor and synthwave looks, cyberpunk, liquid glass, glassmorphism, neon gradients, purple-and-blue AI palettes, glowing borders, gradient blobs, floating spheres, generic SaaS dashboards, stock-looking illustration and random HUD decoration. Concretely:

- **No gradients** used as decoration. The only gradient-like CSS is `repeating-linear-gradient` for hatching on disabled and wrong states.
- **No glow, blur, glass or transparency effects.** Depth is a hard 4px offset shadow.
- **No purple or violet.** Path 1 uses a muted indigo (a traditional dye colour) as one flat colour, never in a gradient and never glowing.
- **No HUD ornament** (scanlines, graticules, corner brackets). The earlier version of this project had these; they were removed.
- **No identical card grid.** Every page has its own composition (see below).
- The earlier version used VALORANT's exact palette (`#0a121a`, `#ff4655`, `#ece8e1`). That has been replaced entirely.

## Colour (`src/styles/tokens.css`)

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Ink | `--ink` | `#1b1612` | Text on paper, panels, outlines |
| Paper | `--paper`, `--paper-hi`, `--paper-lo` | `#eadfc6`, `#f6efdc`, `#d8caa6` | Page, raised surfaces, shaded surfaces |
| Seal | `--seal` | `#c9341f` | The one action colour: primary buttons, selected keys |
| Path 1 | `--indigo` | `#2f4a7c` | Understand AI |
| Path 2 | `--teal` | `#1f7c7a` | Use AI |
| Path 3 | `--ochre` | `#d98a1b` | Use AI Responsibly |

Each hue has text-safe steps (`-lo` for paper, `-hi` for ink). `pnpm contrast` reads the tokens and checks every text and key UI pair against WCAG 2.2 AA. Colour never carries meaning alone: right and wrong show words and icons, locked badges are hatched and dashed, status is written out.

## Type

| Role | Face | Why |
| --- | --- | --- |
| Display | Dela Gothic One | A heavy Japanese-poster-style display face with real personality. Used for headlines only. |
| Interface | Barlow Condensed 600/700 | Condensed, precise, game-menu feel for buttons, keys, labels |
| Body | Atkinson Hyperlegible 400/700 | Designed by the Braille Institute for legibility |

All three are SIL OFL, self-hosted, Latin subset. Body text is 18px with 1.6 line height and 62ch measure.

## Shape and components

- **One shape language:** a diagonal cut on two opposite corners (`--cut`), no border radii. Panels draw a real 2px ink border on the chamfered shape (`clip-path` plus an inset layer).
- **Buttons** (`.btn`): a face on a hard offset shadow. *Hover* lifts the face. *Pressed* sinks it onto the shadow. *Focus* is a 3px outline offset 3px. *Disabled* is hatched with `not-allowed`. Primary is seal red, secondary is paper, quiet is shaded. Forward buttons carry an arrow that slides. At least 48px tall.
- **Keys** (`.key`): toggles and tabs. The selected one is inverted with a red edge and uses `aria-pressed` or `aria-current`.
- **Options** (`.option`): answers are full-width keys. The checked state, the right state and the wrong state are separate and tested visually.
- **Meters**: segmented, with the number always printed beside them.
- **Disclosures**: a visible plus/minus key.

## Page compositions

| Page | Composition |
| --- | --- |
| Home | Full-bleed illustrated harbor with the headline on a chamfered paper panel. Staggered path cards (not a row). A dashed route for how a lesson works. An uneven toolkit grid with one tall card. A dark band with Kernel. |
| Chart (`/learn`) | Three alternating districts, each an illustration beside a route of lessons with stops and status. |
| Lesson | Dark hero with the path's scene, a sticky rail with the objective and step tracker, alternating text and diagram beats, an experiment bench, a check, a seal. |
| Prompt Lab | A workbench: a five-part form beside a side-by-side comparison. |
| Tool Atlas | A field guide of dossier cards with date stamps and expandable access facts. |
| Scenarios | Staggered case files, then a single play surface with three meters. |
| Logbook | Level block, next step, stats, path meters, a table, a badge shelf, a chart, settings. |

## Artwork

Everything is hand-authored SVG in `src/art/`, in one language: 3 to 3.5px round ink outlines, flat fills from a fixed palette, hard offset shadows, screentone dots (`#tone`) and wave patterns (`#waves`) defined once in `Defs.tsx`.

- `Harbor.tsx`: the hero scene with three landmarks and Kernel.
- `PathScenes.tsx`: three scenes, one per path (a loom whose threads form a network, a foundry with a PROMPT sign, a lighthouse).
- `Kernel.tsx`: the guide, in four moods from the same parts.
- `Medals.tsx`: nine badge emblems, each a different glyph for a real achievement. Locked medals are hatched and dashed.
- `Icons.tsx`: 32 icons on one pen weight.
- `Diagram.tsx`: one renderer for every lesson diagram.

Every illustration has a text description (`role="img"` with `aria-label`) or is hidden from assistive technology when decorative. **No raster images, no stock, no image generators were used.**

## Motion and sound

- Motion is small and purposeful: button press, panel lift, toast slide-in, a pop on badge reveal. Nothing moves on scroll and no content is hidden until it animates in.
- `prefers-reduced-motion` reduces all animation and transition durations to near zero.
- **Sound** is synthesized with the Web Audio API: a plucked, bell-like pentatonic palette. Off by default, one clear button in the header, volume in the Logbook, no autoplay (the audio context is only created after the click), and every sound is paired with a visible change.
