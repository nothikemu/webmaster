# The game: Tideweight, the lamplighter's harbor

The game is the hands-on half of the AI Learning Portal. It is not a replacement for the portal: every lesson, the Codex, the Tool Atlas and the final certification remain ordinary pages, reachable from the menu, and nothing in them is locked by the game.

## Two versions of one game

The game is a **3D** third-person game (Three.js, WebGL2) and has a **classic 2D** side-scrolling version of the same content. 3D is the default when the browser can draw it; the 2D version is the automatic fallback and a pause-menu choice. Both share the same world data, stations, relics, progress and dialogues; only the stage differs (`src/game3d` and `src/game/Room.tsx`).

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


## The 3D version

- **Look.** A real-time 3D scene is rendered to an HDR target with depth, then one stylising pass turns it into a printed comic poster (docs/STYLE_GUIDE.md): every pixel is either neutral (paper and ink) or red, chosen by its hue; light level is cut into hard cel bands, and each band is printed with a halftone screen (bare colour in the light, round dots in the half-light, denser dots, solid ink in the core shadow); outlines are thick black wherever depth jumps or its slope changes; a vignette folds into the shading. The sky is a red field fading to black with slanted rays around a pale sun; the sea is black with white wave strokes. There is no bloom, grain or animated noise. Place changes are a slanted black wipe with a red edge.
- **World.** A cobbled plaza with a compass-rose floor, a fountain monument crowned with a lantern cage, fifteen lamp posts that light as lessons are finished, six distinct buildings (a timber Loom House with a slow wheel, a stone Foundry with smoking chimneys and a mouth of fire, a marble Archive with columns and a dome, a brick Trial Hall with a clock tower that tells the real time, a timber Harbor Office with a rippling flag, a banded lighthouse whose beam sweeps the harbor), a quay wall, boats that bob, gulls, hills, pines, a shader-animated sea, a sky with drifting cloud banks and a low sun, motes in the air, smoke and sparks.
- **Interiors.** Six rooms, each its own set: a warp loom with hanging weights, a forge, a brass balance, marble stacks with a long timeline table, a courtroom, a map office. The entrance wall is one-sided, so the camera can step back outside the room to frame it.
- **People.** The lamplighter (a walk cycle, a swinging lantern that really lights the ground), Kernel (a floating lantern-bot that follows and watches), and the three mentors, who turn to face you.
- **Controls.** WASD or up/down to walk, Shift to run, Space to jump, mouse drag or left/right arrows to turn the camera, wheel to zoom, E to use, click the ground or a marker to walk there, a stick and drag on touch screens. The camera is pulled in by walls and buildings and eases behind the player.
- **Performance.** One draw per object, instanced trees and books, four real lamp lights at a time, shadows only on the high and medium tiers, bloom on high and medium, and a quality tier chosen automatically from the measured frame time (and settable in the pause menu). The 3D engine is a separate chunk (580 kB, 156 kB gzipped) that downloads only when the 3D game starts.
- **Accessibility.** The same "Places and objects" list as the 2D version (every action as a plain button); the stage is a described `role="application"` widget; labels over the picture are real buttons; camera easing and the speed field-of-view kick stop under reduced motion; nothing flashes.
- **Honest limits.** It needs WebGL2. It was tested in Chromium with software rendering, which is far slower than a real graphics chip, so frame rates on real devices are unmeasured. Nobody has played it on a phone.


## Guidance: the player always knows where to go

Research (see the sources in docs/PERFORMANCE.md and docs/STYLE_GUIDE.md): good guidance is *layered and tapering* (explicit at first, quieter as the player learns), prefers cues in the world over HUD where it can, keeps a marker readable when the player turns away, recomputes the objective from the current state, and never gives so much that exploring is pointless.

- **Objective tracker** (`src/game/objective.ts`, `src/game/Objective.tsx`): top left, always one sentence ("Enter the Loom House", "Play The Curator's Cabinet", "Head back out to the Quay") and one line of how, with the distance in metres in 3D. It is a pure function of progress and the room you are in: finish what is in front of you, then the next unfinished station in the first open room, then hidden relics, then what is locked, then the final examination. It is shown in the 2D game too.
- **A route on the ground** (`src/game3d/route.ts`, `guide.ts`): red chevrons with a black edge lead from the player to the goal and march toward it. The route is a grid A* over the same colliders the player collides with, straightened, so it goes around the fountain and the furniture, and it is recomputed as the player moves (at most a few times a second). It tapers near the feet and at the end.
- **A marker at the goal**: a pulsing floor ring, a red pillar and a spinning diamond, plus the slanted red label with its name and distance. When the goal is off screen or behind the player, a red arrow with the distance sits on the screen edge and points to it.
- **Red means "go here"**: stations have a red floor pad, doors are red, and the only things in the world that are red *and* moving are the path and the marker.
- **A tutorial** in four steps that finish by themselves when the player does the thing (walk, look around, run or jump, follow the red path), with touch wording on touch devices, a Skip button, and a flag in `localStorage` so it shows once. Kernel's introduction also names the Objective box and the red path.
- **Hints**: a prompt at the bottom says what E does at the thing you are near; after sixteen seconds of standing still a "Stuck?" card repeats the objective. Reduced motion stops the marching and pulsing but keeps the path and the marker.
- The "Places and objects" list under the picture still lists everything and travels there, so no part of the game depends on walking or seeing.
