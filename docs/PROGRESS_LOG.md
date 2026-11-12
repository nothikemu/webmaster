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
