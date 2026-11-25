# Interview guide

The semifinal interview asks you to show and explain the knowledge you gained building the site. This guide is the map. **Read the code behind every answer until you can explain it in your own words.** If you cannot explain something here, change it, simplify it, or cut it. Be honest about how the project was made (see "AI help" below).

## The 60-second pitch

Parameter is an illustrated field guide to how machines learn, for grades 9 to 12. It has three modules (Foundations, Synthesis, Ethics) of five core lessons each, a small instrument you can turn by hand in each module, a glossary and a tool atlas. A lesson is a short read, sometimes an experiment, and an unscored check that explains every answer. Nothing is timed, scored or locked, and the only thing saved is which lessons you finished, on your own device.

## Why there is no gamification (be ready for this one)

- **The decision.** The earlier version had points, ranks, badges, streaks, missions and a 3D game. The owner's redesign brief removed all of it, so that nothing competes with the ideas, and so that a check is a place to learn, not a place to be graded. The earlier version is in git history (commit 815acc2).
- **What replaced it.** A neutral overview that marks each lesson not started, started or complete and says "n of 5 core lessons complete". Marking a lesson complete is explicit and reversible, and unlocks nothing.
- **The risk to name yourself.** The official challenge requirements recorded in `docs/RESEARCH_2026-27.md` (A3) ask for an interactive, gamified interface with badges, experience points and a progress dashboard. A portal without gamification may not satisfy that. Say plainly that this was a deliberate design decision, that you flagged it, and that you confirmed (or still need to confirm) with the advisor. Do not claim the event "does not require it" unless the advisor read the current rules and said so.
- **Likely question: "Where is the progress tracking?"** Answer: on the overview page. It tracks completion neutrally and visually (status marks, counts per module) without points or rewards.

## Architecture in one picture

```
content (plain data) ──► learning/state.ts (pure rules) ──► store ──► React pages
 modules, lessons,         open / complete / uncomplete      one object,   read state,
 glossary, tools, cases    persistence.ts: save, migrate,    saved to      call dispatch()
                           export, import                    localStorage
widgets/logic and explainers/*Model.ts (pure maths) ──► widgets and instruments (React)
```

- **Why this shape:** the rules are tiny pure functions with no browser code, so they can be tested and explained. The instruments' models (`topologyModel.ts`, `consoleModel.ts`, `matrixModel.ts`) are pure too.
- **Stack:** React 18 and TypeScript, built by Vite into static files. No backend, no database, no accounts. Three self-hosted font families. Everything else is our own code.
- **Why not Next.js:** nothing here needs a server. A static site is the simplest thing that can be public and password-free, which the submission requires.
- **Routing:** a small router (`src/router.tsx`) using the History API. The build copies `index.html` into a folder per route, and writes small redirect pages for old addresses, so every page is a real URL on any host.

## Learner data and migration

- One key, `parameter/learning/v2`: `{ opened, completed, last }`. No points, no scores.
- Earlier saves (`parameter/v1`, `tideweight/v1`) are read once. Only finished lessons (and which were opened) are copied. The earlier key is **left untouched**, and removed only when the learner presses "Erase everything stored here" and confirms.
- An unreadable save is kept under another key, not destroyed. A hand-edited save is rebuilt by `sanitize`. If `localStorage` is blocked the site works from memory and says so.
- Tests: `tests/learning.test.ts`, and the migration checks in `pnpm smoke`.

## The three instruments (be ready to demo and explain each)

| Module | File | What is really happening |
| --- | --- | --- |
| Foundations: Neural topology | `explainers/topologyModel.ts` | A 3-4-3-1 feed-forward network with fixed weights. Each unit is a weighted sum passed through a sigmoid. You can step through the layers, see each sum, and change one weight. Negative weights are dashed so sign is never colour alone. |
| Synthesis: Prompt console | `explainers/consoleModel.ts` | **A deterministic simulation, not a model.** Four settings change the logits of eight possible first words, then temperature rescales them (softmax). It reports variety (normalised entropy), the on-task share and a drift risk, and ten draws using ten fixed random numbers so only the settings change the result. |
| Ethics: Vulnerability matrix | `explainers/matrixModel.ts` | Four failures with causes, signs and mitigations from the lessons, and a before-and-after grid on **illustrative** numbers (stated on the page). |

## The five older experiments (still in the lessons)

| Lesson | File | What is really happening |
| --- | --- | --- |
| Rules versus learning | `widgets/logic/spam.ts` | A keyword rule filter versus a **naive Bayes** classifier. Training counts how often each word appears in spam and in normal messages; classification adds up each word's log-odds. |
| Learning from examples | `widgets/logic/knn.ts` | **k-nearest neighbors**. A new point takes the majority label of its 3 closest examples. Narrow examples give a narrow model, so it fails on the hidden test set. |
| Neural networks | `widgets/logic/nn.ts` | A real network: 2 inputs, tanh hidden units, a sigmoid output, trained by **full-batch gradient descent with backpropagation**. One hidden unit cannot solve the ring. Five can. |
| The next-word machine | `widgets/logic/lm.ts` | A **trigram language model** over a short story. Counts become probabilities. Temperature raises the counts to the power 1/T, then renormalizes. |
| Tokens and context | `widgets/logic/tokens.ts` | A simple tokenizer and a window that keeps the **last 48 tokens**. A simplification, labeled as one. |
| Bias and fairness | `widgets/logic/bias.ts` | Deleting the neighborhood feature is not enough because the rowing club is a **proxy**. |

All have unit tests in `tests/widgets-logic.test.ts`. None keeps a score any more: each says what happened and why.

## The art (say how it is made)

Every illustration is code. `src/art/ink.ts` draws tapered, wobbling brush strokes, hatching and stippling from seeded points, so a drawing is the same on every load. `src/art/field/` composes the plates. Annotations are real HTML laid over the drawings (or a numbered list on a phone), not text baked into an image.

## Research process (say this honestly)

1. Read the official 2026-27 TSA theme and submission pages and the Texas TSA rulebook, event guidelines and generative-AI policy. We could **not** read the national Webmaster rules or rating form (member-only).
2. Read the AI4K12, CSTA, Common Sense, UNESCO and NIST pages and built the content around them. Lessons name the idea they serve where they come from that guidance.
3. Checked tool age and account rules on vendor help pages and stamped each with a date. Where we could not read the vendor page we say "Reported, confirm".
4. For the redesign: inspected specific award-winning sites in a browser (see `docs/DESIGN_SYSTEM.md` for exactly which, what rendered and what did not). The Awwwards archive itself could not be opened.
5. Everything is in `docs/RESEARCH_2026-27.md` and `docs/DESIGN_SYSTEM.md`, including what was and was not verified.

## Accessibility decisions

- Native controls only, so keyboard and screen readers work without extra code. A skip link is the first Tab stop. Focus moves to the page after navigation. The mobile menu is a native dialog.
- Contrast is checked by a script that reads the CSS tokens (`pnpm contrast`, 53 pairs).
- Meaning never depends on colour alone: words and shapes for correct and incorrect, for lesson status, for negative weights and for the matrix cells.
- Targets of 44 px or more, reduced-motion support, no sound, Atkinson Hyperlegible for interface text.
- axe runs on 20 page states, and the page is checked for sideways scrolling at four widths, in `pnpm smoke`.
- Honest limits: not tested with real screen readers; Chromium only.

## Testing and iteration

- `pnpm test`: unit tests over every lesson's structure and answer key, the experiments' maths, the learner state and migration, the old-address map, and the three instruments' models.
- `pnpm smoke`: a real browser loads every page, checks sideways scrolling, runs axe, exercises the menu with the keyboard, follows old addresses, migrates an earlier save, answers a check wrongly and retries, and drives each instrument.
- Real problems found by that testing: the hero annotations overflowed on phones; a large ochre numeral failed contrast; the "page moved" note was lost when the redirect used a static page (it now carries the old address in the link); a long reference URL overflowed at 320 px.

## Questions to practice

1. Why did you remove the gamification, and what does the event's requirement say about it?
2. Walk me through what happens when a student answers a check wrongly.
3. What exactly is stored on a learner's device, and what happens to an earlier save?
4. Is the prompt console a real model? How do you know the numbers mean something?
5. How do the hero drawing's annotations stay accessible?
6. What happens if localStorage is blocked or the save is corrupted?
7. What could be wrong with the facts in your lessons, and how would you find out?
8. What did you cut, and why? What did you keep that the brief did not list?
9. Which tools did you use to build this, and what did each one do?
