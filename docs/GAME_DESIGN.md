# The game: Tideweight, the lamplighter's harbor

The game is the hands-on half of the AI Learning Portal. It is not a replacement for the portal: every lesson, the Codex, the Tool Atlas and the final certification remain ordinary pages, reachable from the menu, and nothing in them is locked by the game.

## Concept

The lanterns along the harbor have gone dark. The player is the new lamplighter and walks the harbor with Kernel, a small lantern-bot. Each building is a place where one idea about AI is worked on by hand. The world was already the portal's world (the three mentors, the lantern-lighting story), so the game extends it instead of replacing it.

Loop: explore, find, learn, experiment, solve, earn, unlock, continue.

## World

| Place | Role | Learning area | What is here |
|---|---|---|---|
| The Quay | Hub | | Six doors, two relics, Kernel's introduction |
| The Loom House | Laboratory | AI fundamentals | Curator's Cabinet, Weight Frame, Wren, 3 relics |
| The Foundry Docks | Workshop | Practical AI tools and techniques | Anvil Orders, Weld Test, Brannock, 3 relics |
| The Beacon | Ethics Division | Ethical and responsible AI | Fairness Audit, Sedge, 3 relics, the great lamp |
| The Archive | Archive | AI fundamentals and history | Timeline of Minds, the Codex shelves, 3 relics (opens at level 2) |
| The Trial Hall | Simulation Chamber | Ethics and the whole course | Six scenarios (the case files), the final examination, 2 relics (opens at level 3) |
| The Harbor Office | Control Room | Records | Missions, logbook, Codex, the chart, 1 relic |

Locked doors gate only the game. The pause menu has an *Open every door* switch for reviewers and teachers. XP is unchanged by it.

## Stations (the gameplay)

Each station has an introduction, an objective, a criterion for clearing a round, feedback that says why, and a reward (40 XP per round, the first time). Each is tied to a lesson.

| Station | Mechanic | Teaches | Lesson |
|---|---|---|---|
| Curator's Cabinet (3 rounds) | Spend a small budget of labels on moths, a 1-nearest-neighbor model sorts the rest, a hidden test set scores it. Round 3 hides a coverage gap: the model has only seen the west, and the east behaves differently. | Supervised learning, which examples matter, coverage and distribution shift | u2 |
| Weight Frame (3 rounds) | One neuron, three dials (two weights and a bias), turned by hand or by gradient descent. Round 3 cannot be solved without the bias. | Weights, bias, learning as automatic adjustment, the limit of one neuron | u3 |
| Anvil Orders (3 rounds) | Build a prompt from up to six pieces for a client's order. A fixed-rule forge shows what each part did. Round 3 contains private details that must stay out. | Task, context, audience, format, limits; privacy | t2 |
| Weld Test (3 rounds) | An assistant's answer is a list of claims, the source packet is sealed, three tests are available. Test what matters, then keep or cut every claim. | Verification, triage, invented sources, red flags | t4 |
| Fairness Audit (3 rounds) | Slice invented applicants by trait to find the proxy for district, then change the screener until the gap is small and accuracy holds. | Bias, proxy variables, trade-offs, auditing outcomes | r1 |
| Timeline of Minds (1 round) | Order seven milestones, with feedback on how many are in the right place. | History of AI and what each step taught | u1 |

Honesty about what is simulated: the forge follows fixed rules and is not a live AI; the classifier is a one-nearest-neighbor model; the audit's people are invented; the Weld Test judges claims against a packet written for the game. Each screen says so.

## Relics

Seventeen small objects, each a short explanation (an idea, not a trophy), hidden around the rooms. Pressing L lifts the lantern and shows what is still unfound. They pay 12 XP once and are kept in the journal.

## Progression

XP is paid for doing the thing, once. Rounds pay 40, relics 12, a first visit to a building 10. It all feeds the same level ladder as the lessons. Six new missions read from finished work: The curator's eye, Struck and tested, The honest lamp, Deep time, Relic hunter, Harbor master. Everything is saved in the browser (`tideweight/v1`, key `game`), sanitized on load, and erased from the pause menu.

## Mapping to the required content

| Required area | Lessons | Stations | Relics | Also |
|---|---|---|---|---|
| Fundamental AI concepts | u1 to u5 | Cabinet, Frame, Timeline | rule-card, thread-weights, test-cloth, first-chess, eliza-slip, gpu-plate, chart-corner | Codex, drill, Lab experiments |
| Practical AI tools and techniques | t1 to t5 | Anvil, Weld | toolbox-note, five-parts, cracked-weld, kernel-log | Tool Atlas, Prompt Lab |
| Ethical and responsible AI use | r1 to r5 | Audit | lens, forged-letter, sealed-log, verdict-form, consent-slip, lamp-oil | Scenarios, certification |

## Accessibility

- Keyboard: arrow keys or A/D, Shift, E/Enter/Space, L, K, M, J, Esc. Tab moves through dialogs and never reaches the page behind one.
- Non-visual route: the "In this room" list offers every hotspot as a button, so the game does not depend on walking or on the picture. The stage is a `role="application"` widget with a described purpose.
- Touch: on-screen walk and Use buttons (on coarse pointers), tap the floor to walk, tap an object to walk to it and use it.
- Motion: walk cycle, camera easing, fades, parallax and pulsing are off under `prefers-reduced-motion`.
- Sound: off until switched on, never autoplays, master/music/effects volumes and a mute button, nothing depends on it.
- Meaning is never carried by value alone: markers have glyphs, answers have icons and words, wrong items are hatched and ringed.

## Engineering

- Rooms are wide SVGs drawn by the project's brush engine, in two layers (back wall at half speed, furniture at full speed). Motion is applied straight to the DOM from one animation loop, so walking never re-renders React.
- Game logic (`src/game/logic`) is pure and unit-tested. Content is data (`src/game/data.ts`, `rooms.ts`).
- The game page is a separate chunk (127 kB, 41 kB gzipped) loaded only on `/play`.
- `pnpm playtest` plays the built game in a real browser (see `scripts/playtest.mjs`): new game, walking, doors, relics, all six stations, unlocks, reload, reset, keyboard, sound opt-in, axe, and a phone.

## Known limits

- Nobody has heard the audio or played on a real phone. See the progress log.
- The Trial Hall hands off to the existing Scenarios page and certification page instead of re-implementing them inside the stage.
