# Interview guide

The semifinal interview asks you to show and explain the knowledge you gained building the site. This guide is the map. **Read the code behind every answer until you can explain it in your own words.** If you cannot explain something here, change it, simplify it, or cut it. Be honest about how the project was made (see "AI help" below).

## The 60-second pitch

Tideweight teaches grades 9-12 how AI works, how to use it well, and how to use it responsibly. Each of 15 lessons has a short explanation with a diagram, a real-world example, an experiment you run yourself, and a three-question check. XP, levels, nine badges and a dashboard track real work. Progress is saved only in the browser.

## Architecture in one picture

```
content (plain data) ──► engine (pure rules) ──► store ──► React pages
 lessons, glossary,        progress.ts: XP,        keeps one     show state,
 tools, scenarios,         levels, badges,         object and    call dispatch()
 certification             recommendations         saves it
                           persistence.ts: validate + save
widgets/logic (pure maths) ──► widgets (React) report a 0-100 score ──► engine
```

- **Why this shape:** the rules (what earns XP, when a badge unlocks) are one pure function, `applyEvent`, with no browser code. That is why they can be tested, and why you can explain them.
- **Stack:** React 18 and TypeScript, built by Vite into static files. No backend, no database, no accounts. Three self-hosted fonts. Everything else is our own code.
- **Why not a framework like Next.js:** nothing here needs a server. A static site is the simplest thing that can be public and password-free, which the submission requires.
- **Routing:** a 60-line router (`src/router.tsx`) using the History API. The build copies `index.html` into a folder per route so every page is a real URL on any host.

## The gamification, and why it is fair

Rules live in `src/engine/progress.ts` and the Logbook explains them to players.

- XP is paid **once per step**: read (20), experiment (up to 60, in proportion to score), check (20 per correct answer plus 30 for perfect), seal a lesson (40), finish a path (150), a badge (100), the certification (300).
- **Improving a score pays only the difference.** Repeating a finished step pays nothing. So there is no way to grind. The tests `cannot be ground` and `pays ... only the improvement` prove it.
- **Badges are computed from completed work**, never from visits. The test `no badge from visiting, reading, or clicking` proves it.
- A lesson is *done* only when all three of learn, experiment solved and check passed (2 of 3) are true.
- 10 levels with thresholds 0, 120, 320, 620, 1000, 1500, 2100, 2800, 3600, 4500. The total XP available is about 5,000 (15 lessons at 210, three paths at 150, nine badges at 100, the certification at 300, six scenarios at 25, one Lab clear at 60), so a thorough player can reach the top.

Question to expect: *"Why not give XP for every click?"* Answer: it would reward doing nothing useful, and the brief and the research (CSTA, Common Sense) both stress that points should follow learning.

## The five real experiments (be ready to demo and explain each)

| Lesson | File | What is really happening |
| --- | --- | --- |
| u1 Rules or examples? | `widgets/logic/spam.ts` | A keyword rule filter versus a **naive Bayes** classifier. Training counts how often each word appears in spam and in normal messages; classification adds up each word's log-odds. |
| u2 Learning from examples | `widgets/logic/knn.ts` | **k-nearest neighbors**. A new point takes the majority label of its 3 closest examples. Narrow examples give a narrow model, so it fails on the hidden test set. |
| u3 Neural networks | `widgets/logic/nn.ts` | A real network: 2 inputs, tanh hidden units, a sigmoid output, trained by **full-batch gradient descent with backpropagation**. About 60 lines. One hidden unit cannot solve the ring. Five can. |
| u4 Next-word machine | `widgets/logic/lm.ts` | A **trigram language model** over a short story. Counts become probabilities. Temperature raises the counts to the power 1/T, then renormalizes. |
| u5 Tokens and context | `widgets/logic/tokens.ts` | A simple tokenizer and a window that keeps the **last 48 tokens**. A simplification, labeled as one. |

`R1 Bias` (`bias.ts`) shows that deleting the neighborhood feature is not enough because the rowing club is a **proxy**.

All of these have unit tests in `tests/widgets-logic.test.ts`.

## Research process (say this honestly)

1. Read the official 2026-27 TSA theme and submission pages and the Texas TSA rulebook, event guidelines and generative-AI policy. We could **not** read the national Webmaster rules or rating form (member-only).
2. Read the AI4K12, CSTA, Common Sense, UNESCO and NIST pages and built the three paths around them. Each lesson names the idea it serves.
3. Checked tool age and account rules on vendor help pages and stamped each with a date. Where we could not read the vendor page we say "Reported, confirm".
4. Everything is in `docs/RESEARCH_2026-27.md`, including what was and was not verified.

## Accessibility decisions

- Native controls only, so keyboard and screen readers work without extra code. A visible skip link is the first Tab stop. Focus moves to the new page after navigation.
- Contrast is checked by a script that reads the CSS tokens (`pnpm contrast`).
- Meaning never depends on colour alone: words and icons for right/wrong, hatching for locked, status written out.
- 48px minimum targets, reduced-motion support, sound off by default, Atkinson Hyperlegible body text.
- axe (WCAG 2.2 AA tags) runs on every page at desktop and phone width in `pnpm smoke`.
- Honest limits: not tested with real screen readers; Chromium only.

## Design decisions

See `docs/DESIGN_SYSTEM.md`. Short version: one ink-and-paper palette, one seal-red action colour, one flat hue per path, chamfered panels with hard shadows, original SVG art in a single ink-brush style, and a deliberate list of looks we avoided. Be ready to explain how the art is generated by code: `src/art/ink.ts` draws tapered, wobbling brush strokes and hatching from seeded points.

## Testing and iteration

- `pnpm test`: 81 unit tests over the XP rules, saving and corrupt-save recovery, every lesson's structure and answer key, the experiments' maths, scoring.
- `pnpm smoke`: a real browser finishes a lesson (210 XP), reloads (progress persists), resets, checks keyboard behavior, and scans every page for accessibility problems.
- Real bugs found and fixed by testing: the header overflowed on phones; the selected-answer style hid the right/wrong colours; six lessons were missing diagrams; the XP chip's accessible name did not match its visible text; stats lists broke their semantics.

## Technical challenges worth telling

- Making the neural network converge reliably in the browser, and proving it with a test.
- Chamfered borders in CSS: a clipped outer layer in the border colour plus an inset clipped layer for the fill.
- Keeping one source of truth: the codex count, the path progress numbers and the route list are all computed from the content data, so they cannot drift from it.

## Questions to practice

1. Walk me through what happens when a student finishes a check.
2. Why is the neural network experiment real and not an animation?
3. How do you know the badges cannot be earned by clicking around?
4. What happens if localStorage is blocked or the save is corrupted?
5. What could be wrong with the facts in your lessons, and how would you find out?
6. What did you cut, and why?
7. How did you decide which AI tools to include, and which to leave out?
8. Show me one thing you changed after testing it.
9. Which tools did you use to build this, and what did each one do?
