# Style guide: the "poster heist" look

This is the art direction for the 3D game at `/play/` (and, where it applies, the 2D fallback). It replaces the earlier black-ink-on-paper
engraving look. The inspiration is the *kind* of graphic design associated with stylish Japanese action-RPG menus and key art: a hard
three-colour palette, flat cel-shaded forms, thick ink outlines, halftone and comic-print textures, slanted angular shapes, and menus that snap.
Everything in the game is drawn or written from scratch for this project. **Nothing is taken from any existing game**: no screenshots, models,
textures, logos, characters, fonts, sounds or music, and no names, catch-phrases or iconography that belong to one. The reference is a
design vocabulary (like "film noir" or "woodcut"), not a set of assets.

## What the research said (and what we took from it)

| Finding | Source | What we do |
| --- | --- | --- |
| The identity rests on one hot colour. The studio's own conference talk (as reported) says they avoided other "sub-colours" except in small meters, to keep the red distinctive. | [Siliconera on the CEDEC 2017 talk](https://www.siliconera.com/?p=668266) | Red is the only chromatic colour. Black and white do the structure; red is for what matters (goal, danger, energy). No blue, green or yellow anywhere. |
| The menus are described as collage-like: cut-up ransom-note lettering, hard black and white against saturated red. | [Inverse](https://www.inverse.com/gaming/persona-5-tactica-user-interface), [Mechanics of Magic](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/) | Panels are hard-edged polygons with a white and a black layer offset behind them; headings are set in a heavy condensed face, uppercase, tilted a few degrees, sometimes on a black or red tab. |
| Legibility is the cost of that style. The series director said early menus were hard to read and were "tweaked and adjusted so it became legible"; angular elements caused legibility problems. | [PC Gamer](https://www.pcgamer.com/games/rpg/persona-series-director-says-atluss-flashy-menus-are-actually-really-annoying-to-design) | Tilt headings, never body text. Body copy stays horizontal, large, black on white or white on black (WCAG AA or better, checked by `pnpm contrast`). The style is never allowed to beat the reading. |
| Information is kept on the same side as the mainly-white area, so the eye always knows where to look. | [PlayStation LifeStyle on the CEDEC talk](https://www.playstationlifestyle.net/?p=615973) | Fixed HUD homes: the objective tracker is always top-left on a white slab; the contextual prompt is always bottom-centre; meters bottom-right. |
| A single off-palette highlight stands out sharply because the main palette is so restricted. | [Mechanics of Magic](https://mechanicsofmagic.com/2022/04/23/visual-design-of-games-persona-5/) | We keep the highlight inside the palette: the *selected* thing flips to inverse (white on black, or black on red) and slides a few pixels. |
| Menu screens read as designed "posters", with a separate layout per screen. | [Gfinity](https://www.gfinityesports.com/article/rebellion-by-design-the-genius-of-persona-5-royals-visual-storytelling) | Each overlay (talk, journal, map, pause, ending) has its own slanted composition and entrance, rather than one generic dialog. |

Research on the other two goals (performance and guidance) is summarised in `docs/PERFORMANCE.md` and `docs/GAME_DESIGN.md`.

## Palette (only these)

| Token | Value | Use |
| --- | --- | --- |
| `--ink` | `#0d0d0d` | outlines, shadows, panels, body text on white |
| `--paper-hi` | `#f3f2ee` | lit surfaces, panels, body text on black |
| `--red` | `#e3122a` | the accent in the picture and in graphics: goal markers, active states, sky, roofs, doors; large bold text only |
| `--red-fill` | `#c4102a` | fills that carry normal-size paper text (tags, buttons, the objective label) |
| `--red-deep` | `#8e0b1a` | red text on paper |

(In the 3D picture the same five colours are used as linear values in `PALETTE` in `src/game3d/gfx.ts`.) `pnpm contrast` checks the pairs
from `tokens.css`. Measured ratios: ink on paper 17.4:1; paper on `--red-fill` 5.43:1 (normal text); deep red on paper 8.47:1;
paper on `--red` 4.27:1 and ink on `--red` 4.06:1 (large bold text and graphics only, minimum 3:1); `--red` on ink 4.06:1 (graphics only).
Small red text on paper is never used without the deep variant.

## 3D rendering

* **Cel bands, not gradients.** Lighting is collapsed to three bands per hue: lit, shade, core shadow. Band edges are hard.
* **Two hue families.** A pixel is either *neutral* (paper / halftone / ink) or *red* (red / deep red / ink). Materials in the world are authored
  as neutral or red; the post-process keeps that family and only quantises its brightness.
* **Halftone.** Mid-tones are a screen of round dots (45° grid, ~5 px pitch at 1x); dot size follows darkness. Core shadow is solid ink.
  Dots live in screen space so they stay crisp at any distance (a deliberate comic-print effect).
* **Thick ink outlines.** Silhouettes (depth jumps) and creases are drawn about 2 px thick at 1x, always black, slightly heavier on the hero (lamplighter).
* **Sky.** A flat red field with a black sunburst of slanted rays and a halftone vignette, and a white sun disc. No clouds simulation.
* **Water.** Black with white slanted wave strokes and red glints.
* **Motion.** Snappy: ease-out in 120–180 ms; things *pop* on arrival (scale 0.85 → 1.05 → 1). Reduced motion removes slides and pops; the picture itself never flashes.
* **Image budget.** One scene pass + one stylise pass. No bloom. No per-pixel noise animation (it made the frame shimmer and cost bandwidth).

## UI

* **Shapes:** parallelograms and skewed rectangles (`skewX(-8deg)`), clipped corners (`clip-path: polygon(...)`), torn-edge strips; never rounded pills.
* **Type:** headings in a heavy condensed sans (Barlow Condensed ExtraBold 800/900, already bundled), uppercase, tight tracking, rotated -2° to -4° where it helps;
  body in the existing readable sans. No font from any game is used or imitated by name.
* **Layers:** every panel is white (or black) on top of an offset black (or red) copy, so it looks like cut paper stuck on a poster.
* **Menus:** items stack at a slant; the selected one is red or inverse and shifts 8 px; sound is a short synthesised tick.
* **Transitions:** wipes with a slanted edge (150 ms in, 150 ms out) when opening overlays; the room change is a diagonal black-and-red wipe, not a fade.
* **Textures:** halftone dot fields at 6–12 % opacity behind panels; diagonal "speed line" strips; no gradients except the screen vignette.

## Guidance language (shared by the HUD, the world and the tutorial)

* **Red is "go here".** The next goal is the only thing in the world that is red *and* animated: a pulsing ground ring, a rising beam and a floating diamond marker with its name and distance.
* **A route line** of chevrons on the ground leads to it; an arrow on the screen edge points toward it when it is behind you.
* **The tracker** (top-left) states the current objective in one sentence and one optional hint line.
* **Prompts** tell you the key: "E: Enter the Loom Hall".

## Originality checklist (kept for review)

* [x] No asset imported from any game or from stock sites; all geometry is code, all textures are drawn on a canvas at start-up.
* [x] No name, logo, character, catch-phrase, or font from any game.
* [x] Music and sound are the project's own synthesis (no samples).
* [x] The look is a combination of generic print techniques (cel shading, halftone, speed lines, tilted type), which are not owned by anyone.
