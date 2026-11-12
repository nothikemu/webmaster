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
