# Design system and art direction

## The idea

**Tideweight is a harbor town printed in four inks on aged paper.** You learn how AI works by walking its three places: the Loom House (how models are woven from data), the Foundry Docks (using AI tools well), and the Beacon (seeing risk and keeping judgment). A small round automaton, **Kernel**, in a woven travelling hat, guides you.

The interface borrows the *discipline* of a premium competitive-game menu: precise rectilinear panels, diagonal cut corners, hard offset shadows, buttons that visibly press, very few colours. The illustration borrows the mood of inked print and Japanese graphic design: flat colour, heavy ink outlines, screentone dots, wave patterns. Neither is copied.

## What we deliberately avoided

The brief prohibits Y2K, Frutiger Aero, acid, vapor and synthwave looks, cyberpunk, liquid glass, glassmorphism, neon gradients, purple-and-blue AI palettes, glowing borders, gradient blobs, floating spheres, generic SaaS dashboards, stock-looking illustration and random HUD decoration. Concretely:

- **No gradients** used as decoration. The only gradient-like CSS is `repeating-linear-gradient` for hatching on disabled and wrong states.
- **No glow, blur, glass or transparency effects.** Depth is a hard 4px offset shadow.
- **No purple or violet.** Path 1 uses a muted indigo (a traditional dye colour) as one flat colour, never in a gradient and never glowing.
- **No HUD ornament** (scanlines, graticules, corner brackets). The earlier version of this project had these; they were removed.
- **No identical card grid and no shared page template.** Every page has its own composition (see below).
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

Each hue has text-safe steps (`-lo` for paper, `-hi` for ink). `pnpm contrast` reads the tokens and checks every text and key UI pair against WCAG 2.2 AA. Colour never carries meaning alone: right and wrong show words and icons, locked badges are hatched and padlocked, status is written out.

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

No two pages open the same way. They share the plate (a framed illustration on a hard shadow), the chamfered panel and the fact line, not a layout.

| Page | Composition |
| --- | --- |
| Home | The harbor, full-bleed, with the headline on a paper panel. A progress strip with the rank crest. Staggered path cards. A daily myth-or-fact card beside Kernel. The four steps of a lesson as a route. Two wide and three tall toolkit cards, each with its own spot illustration. A dark band with Kernel. |
| The chart (`/learn`) | A sea chart of the three places with fifteen stops and the seal at the lighthouse. Stops are links whose look follows progress. Below it, each path stop by stop. |
| Path | A dark band split on a diagonal: title on ink, the path's scene on the right, sized so the scene is not cropped. |
| Lesson | Dark hero with the lesson's own illustration, a sticky rail with the objective and step tracker, the mentor's line, alternating text and diagram beats, an experiment bench, a check, a seal. |
| Prompt Lab | A workshop frieze across the page with the title hung from it on a panel. Five tiles light up as the five parts of the prompt are filled in. |
| Tool Atlas | Title and stamp legend beside a framed plate of the chart room. Then dossier cards with date stamps. |
| Scenarios | A tall poster of the crossroads that stays put, beside six numbered case files, each offset from the one above. |
| Codex | Title and drill button beside a plate of the scroll cabinet, which gains a scroll for every collected term. |
| Logbook | An ink band with the rank crest, level and the cabin picture (medals hang on its wall as badges are earned). Then a ladder of ten ranks, paths, the lesson table, badges, the XP chart and settings. |
| Certification | Centred. A triptych of the three mentors, the middle one dropped a step, then the briefing panel. The certificate has brushed corners, three signatures and a wax seal. |
| About, Accessibility, Credits | Editorial: text in one column, a plate and an on-page index in a sticky margin. |
| Not found | The whole scene of Kernel adrift, with the way back on a panel. |

**Fact lines, not eyebrow labels.** Pages do not carry a small decorative label above the title. Where a line sits under a title it states something true and useful: how many cases are played, where data is stored, that the Prompt Lab is a demonstration.

## Artwork

All artwork is original and written as code in `src/art/`. No raster images, no stock, no image generators, no traced or copied characters. It is built to read as ink and paint on paper rather than as vector clip art, and it is one visual language across the hero, the chart, the scenes, the badges and the rank crests.

**How the ink look is made.** Nothing is a clean primitive. `ink.ts` is a small brush engine that turns a few control points into a drawn mark:

- `spline`, `densify`, `wobble`: Catmull-Rom curves with a seeded, low-frequency wobble, so no line is perfectly straight.
- `strokeD`: a variable-width brush polygon. Pressure swells in the middle and tapers at the ends.
- `ringD`: closed shapes are two overlapping strokes that do not quite meet, the way a contour is closed by hand.
- `edgesD`: architecture is drawn one edge at a time with small overshoots at the corners.
- `hatchD`: scanline-clipped, jittered hatching for shadow.
- `dryD`: a dry-brush stroke made of separate bristle lines that start and stop on their own. Used for sky streaks, sheen on water, worn paths and fog.
- `spatterD`: flecks of ink thrown off a loaded brush.
- `cumulus`, `crest`, `star`, `gear`, `arc`: shapes that recur.
- Everything is **seeded**, so the art is identical on every load. Components are `memo`-ised so the geometry is computed once.
- **Print misregistration**: fills sit a pixel or two off their outlines.
- Three SVG filters in `Defs.tsx`: `#rough` (roughens edges), `#paint` (broad, soft blotches that stop flat colour from looking like a vector fill) and `#grain` (paper tooth). `Scene` in `Draw.tsx` is the frame that applies them, so every picture is finished the same way.

**Files**

- `ink.ts`, `Draw.tsx`: the brush engine and the drawing components built on it (`Shape`, `Wash`, `Stroke`, `Hatch`, `Flecks`, `Dry`, `Spatter`, `Tone`, `At`, `Scene`).
- `palette.ts`: the one colour list, with shading steps so form is carried by tone and hatching, not gradients.
- `kit.tsx`: the furniture of the harbor: walls, shelves, windows, tables, scrolls, books, ink pots, signposts, banners, instruments, tools, boats, the townsfolk, and **Bobbin**, the black harbor cat, who is somewhere in most pictures.
- `props.tsx`: outdoor props (clouds, gulls, pines, houses, boats, planks, rope).
- `Kernel.tsx`: the guide. One set of parts, eight poses (`idle`, `think`, `cheer`, `alert`, `wave`, `point`, `read`, `look`) and six things to carry.
- `Cast.tsx`: the three mentors, built from shared limb and hand helpers, with a head-and-shoulders crop for where they speak. **Wren** the weaver is short and round under a hat as wide as she is tall. **Brannock** the foundry-master is wide and heavy, mid-swing. **Sedge** the beacon-keeper is tall and narrow in a windblown coat.
- `Harbor.tsx`: the hero, in two stacked layers. The base is drawn once. The live layer holds a lantern for each finished lesson, a pennant on each finished place, the lighthouse beam after certification, and the three places as links. Lighting a lantern never repaints the base.
- `ChartMap.tsx`: the sea chart on the Learn page. The paper is drawn once; the stops are links drawn on top.
- `PageScenes.tsx`: one scene for each place outside the lessons (workshop frieze, chart room, crossroads, scroll cabinet, log cabin, three mentor portraits, notice board, gangway, print table, adrift).
- `PathScenes.tsx`, `LessonArt.tsx`: one scene per path and one illustration per lesson.
- `Medals.tsx`, `Ranks.tsx`: nine badge emblems and ten rank crests.
- `Spots.tsx`, `Certificate.tsx`: small spot illustrations for the home page, and the corner flourish, signatures and seal of the certificate.
- `Icons.tsx`, `Diagram.tsx`: 32 icons on one pen weight, and one renderer for every lesson diagram.

**Pictures that carry progress.** Four pictures change with what the learner has done: the lanterns over the harbor, the stops and legs on the chart, the scrolls in the Codex cabinet and the medals in the Logbook cabin. Each one repeats its numbers in text beside it, so nothing depends on seeing the picture.

**Influences, not copies.** The reference points are qualities of Samurai Champloo and One Piece illustration: varied line weight, hatching for shadow, exaggerated and distinctive silhouettes, busy lived-in environments, and a restrained warm palette. The interface takes its discipline from competitive-game menus. No character, costume, ship, logo or composition from any other work is reproduced. Every character, place and prop here is original to this project.

Every illustration has a text description (`role="img"` with `aria-label`) or is hidden from assistive technology when decorative. Links inside pictures take their names from visible text plus a hidden status.

## Motion and sound

- Four durations only: 100, 150, 200 and 300 milliseconds (`--dur-press`, `--dur-fast`, `--dur-mid`, `--dur-slow`), with one ease-out curve. Nothing in the interface bounces.
- Only `transform` and `opacity` are animated.
- Motion answers an action: a button presses, a panel lifts, a toast slides in, a medal or rank crest lands like a stamp.
- **One entrance, nothing that loops.** When the home page loads, the festoon lanterns swing and settle and the gulls drift in, once, in under two seconds. No animation on the site repeats, so nothing needs a pause control.
- `prefers-reduced-motion` reduces every animation and transition to nothing.
- **Sound** is synthesized with the Web Audio API: a plucked, bell-like pentatonic palette. Off by default, one clear button in the header, volume in the Logbook, no autoplay (the audio context is only created after the click), and every sound is paired with a visible change.
