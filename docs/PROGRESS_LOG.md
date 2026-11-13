# Progress log

A short record of what was done in each working session, so work can continue coherently.

## 2026-11-12: monochrome world, missions, music, artwork overhaul

Done
- Colour: tokens and palette rewritten as strict grayscale. Paths are charcoal, graphite and silver. Primary buttons are black, and invert on dark surfaces. Contrast checker passes.
- Art: stippled shading (automatic), hand-cut plate edges, halftone screen and edge darkening on every scene, five illustrated dividers, the hero's ink edge, hero parallax, drifting clouds, ink-reveal on pictures. New scenes: mission office, a plate for each tool (variants), technical drawing of Kernel.
- Systems: twelve missions with a one-time XP bonus, a missions page and reward moment, saved with the rest of the progress, credited at load for earlier saves.
- Audio: shared Web Audio engine, a generative soundtrack, extended effects, music and effects toggles in the header, separate volumes and a mute button in the Logbook. Off by default.
- Interface: page entrance transition, player name shown on the home page, header shortened for small phones.
- Checks: lint, types, 107 unit tests, contrast, and the browser and accessibility smoke test at the root and at `/webmaster/`.

Not done or not verified
- A person has not listened to the music. The test confirms that it runs and carries signal.
- Lesson illustrations were converted by value, not redrawn one by one; they gained stippling, screentone and darker edges but keep their compositions.
- Browsers: Chromium only. No screen reader.
- Content is not locked: a judge must be able to read everything, so "available" and "complete" are shown but nothing is gated.

Next
- Listen to the soundtrack and tune the mix.
- Redraw the lesson vignettes with more mechanical and scientific detail.

## 2026-11-12 (later): the playable game

Done
- A browser game on top of the existing world: the title screen, the Quay (a 3,600-unit walk with six buildings), and six explorable rooms (Loom House, Foundry Docks, Beacon, Archive, Trial Hall, Harbor Office). Each has its own back wall on a slower parallax layer, its own furniture and its own ambience.
- A player figure (the lamplighter) with a walk cycle and Kernel following. Movement by arrow keys or A/D (Shift hurries), tap or click the floor to walk, on-screen buttons on touch screens, E / Enter / Space to use, L for the lantern, K for Kernel, M for the chart, J for the journal, Esc for the pause menu.
- Six stations, each a small game with an objective, a way to clear it, feedback that says why, and XP: the Curator's Cabinet (label budget, nearest-neighbor model, a coverage-gap round), the Weight Frame (one neuron, three dials, gradient descent), the Anvil Orders (prompt parts and privacy; a rule-based forge, not a live AI), the Weld Test (triage under a test budget), the Fairness Audit (slice outcomes, find the proxy, fix without breaking), the Timeline of Minds (order seven milestones with Mastermind-style feedback).
- Seventeen relics hidden in the rooms, each a short explanation of an idea, collected in the journal.
- Progress: stations, relics and visited buildings are part of the saved state (`game`), sanitized on load, with older saves still loading. Archive and Trial Hall unlock at levels 2 and 3; a pause-menu switch opens every door. Six new missions (the Exploration category and Harbor Master).
- Audio: footsteps, doors, relics, station start and win; room ambience (sea, loom, forge, wind, hall tone); a quieter title version of the score. All synthesized, all off until switched on.
- A closing scene appears once, when the last station is cleared, and points to the final examination. It is remembered in the save.
- Pages: the home page leads with "Play the game"; About and Accessibility describe the game and map it to the three learning areas.
- Checks: 142 unit tests (35 for the game logic), lint, types, and `pnpm playtest`, a real-browser playthrough (see below).

What the playthrough found and fixed
- Two moths could sit on top of each other, so one could not be clicked: pool generation now keeps them apart.
- Pressing Escape never opened the pause menu on a real keyboard: React opened the dialog during the keydown and the browser's own Escape handling closed it again. It now opens one tick later.
- The game page was narrower than its stage on wide, short screens, leaving a bare strip: the picture now always fills the stage width.
- Header: eight navigation items did not fit at 1280 px, so the menu now collapses below 1360 px.

Not done or not verified
- Nobody has played it on a real phone or heard the audio. The playthrough drives Chromium with touch emulation and confirms the audio graph and ambience start, not what they sound like.
- The lesson vignettes still keep their earlier compositions.
- No screen reader testing. The stage is a `role="application"` widget with an "In this room" list as the non-visual route; that route is tested with the keyboard, not with a screen reader.


## 2026-11-12 (later still): the 3D game

Done
- The game is now a real 3D game. A Three.js renderer with an engraving post-process (hatching by light level, depth outlines, bloom, paper grain), a sky and sea written as shaders, a plaza with six buildings, six interiors, an animated lamplighter, Kernel and three mentors, collision, a camera that avoids walls, jumping, mouse, keyboard and touch controls.
- `/play` uses 3D when WebGL2 exists and falls back to the classic 2D game automatically; the pause and title menus choose between them and set the quality (automatic, high, medium, low).
- The same stations, relics, missions, dialogues and saves work in both versions. The fifteen lamps on the plaza light up as lessons are finished.
- New: `tests/game3d.test.ts` (layout data), `scripts/playtest3d.mjs` (movement, collision, camera, jump, travel, stations, relics, saving, quality, 2D switch, no-WebGL fallback, a phone, axe).

Not done or not verified
- Real-device frame rates. The test browser draws WebGL in software at a few frames a second.
- Nobody has played the 3D version on a phone or heard the audio.
- No screen reader testing.

## 2026-11-13: poster look, performance pass, guidance

Asked for (relayed from the project's coordinator chat): drop the engraved look for a bold red, black and white comic-poster look inspired by a well-known stylish action-RPG's visual language (original assets only), make the game much smoother with before/after numbers, and make it always clear where to go. This replaces the earlier "strictly monochrome" rule *for the game*; the site's pages stay monochrome.

Done
- Research by web search (art and UI breakdowns, three.js performance, wayfinding), summarised with sources in `docs/STYLE_GUIDE.md`, `docs/PERFORMANCE.md` and `docs/GAME_DESIGN.md`. The style guide fixes the palette (ink, paper, red, red fill, deep red), the cel/halftone/outline rules, the UI language (slanted slabs, offset red shadows, caps, snappy entrances) and an originality checklist. Nothing is copied from any game: no assets, names, fonts, music.
- Look: one stylising pass (`src/game3d/gfx.ts`): hue picks neutral or red, light is cut into hard bands printed as halftone dots, thick black depth outlines, red sky with slanted rays, black sea with white strokes, a slanted wipe between places. Red doors, roofs, banners, sails, stations' floor pads, a red-cloaked lamplighter and lit lamps that glow red. Dialogs, the title, tags, markers and prompts restyled in `src/styles/game.css`; red tokens added with contrast checks.
- Performance (numbers in `docs/PERFORMANCE.md`): static meshes baked into one mesh per material (`src/game3d/bake.ts`), instanced lamp bulbs, seven render passes cut to two, bloom and noise removed, Lambert materials, point lights removed (one left), a 64,800-triangle sea cut to 20,000, pixel-ratio caps, cheaper shadows, a 60 fps quality target, fewer per-frame allocations. `scripts/profile3d.mjs` measures it.
- Guidance: Objective tracker (`src/game/objective.ts`, pure, tested), a red chevron route on the ground that goes around obstacles (`src/game3d/route.ts`, A* over the player's own colliders), a goal marker (ring, pillar, diamond) with name and distance, an off-screen arrow, a four-step self-finishing tutorial with touch wording and Skip, an idle "Stuck?" hint, and updated Kernel intro and About/Accessibility text. The tracker also shows in the 2D game.
- Fixed: pressing Escape twice quickly could leave the pause menu closed, because a dialog's late `close` event closed the next dialog; a dialog now only closes itself.
- Tests: `tests/objective.test.ts`, `tests/bake.test.ts` (baking keeps geometry in place, leaves moving and kept things alone; route planning avoids obstacles); `playtest3d` now checks the tracker, the goal marker and distance, the in-room station goal and the whole tutorial.

Not done or not verified
- Frame rate on a real GPU, a real phone, and the audio: still not measured or heard. The profile was taken in software rendering.
- The classic 2D game keeps the old inked art (its panels, buttons and the Objective box use the new look).
- The title screen still shows the 2D harbor art behind the new panel.
- TSA rules were not re-read this session; the open items in COMPLIANCE_CHECKLIST sections C and C2 stand.

## 2026-11-13 (later): move from GitHub Pages to Vercel

Asked for (relayed from the project's coordinator chat): deploy on Vercel instead of GitHub Pages.

Done
- Removed `.github/workflows/pages.yml` and the Pages-only base-path settings: `vite.config.ts` always builds for the root (`base: '/'`, no `BASE` variable), and the `SMOKE_BASE` sub-folder mode is gone from the smoke, playtest and profile scripts.
- Added `vercel.json`: Vite preset, `pnpm install --frozen-lockfile`, build command `pnpm lint && pnpm test && pnpm contrast && pnpm build` (the same gates the Pages workflow ran), output `dist`, the security headers that were in `public/_headers` (now deleted), and `Cache-Control: public, max-age=31536000, immutable` on `/assets/*`. Deep links keep working because the build writes a real `index.html` for every route and a `404.html`, which Vercel serves with a 404 status; no rewrite is needed.
- The sitemap now takes its origin from `SITE_URL` or Vercel's `VERCEL_PROJECT_PRODUCTION_URL`.
- README: the Deploy section is now the Vercel import steps.

Not done
- The Vercel project could not be created or connected from this session (no Vercel access). The owner has to import the repository (steps in the README); until then there is no live Vercel URL, and nothing has been checked on Vercel.
- Not tested on Vercel's build machines: whether it picks pnpm 10 (the README names the `ENABLE_EXPERIMENTAL_COREPACK=1` fallback).
- With the workflow removed there is no GitHub CI; the checks now run inside the Vercel build.
- The old Pages copy stays online at its last version until Pages is switched off in the repository settings.
