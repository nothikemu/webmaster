# Site structure, information architecture and UX flows

## Sitemap

```
/                                      Home
├── /modules                           Module hub
│   ├── /modules/foundations           Module 01 overview            (Neural Topology Swarm)
│   │   ├── /lessons/1 ... /lessons/5  five lessons
│   │   ├── /knowledge-check           five-question check
│   │   └── /challenge                 Rules, training or inference
│   ├── /modules/synthesis             Module 02 overview            (Anamorphic Prompt Console)
│   │   ├── /lessons/1 ... /lessons/5
│   │   ├── /knowledge-check
│   │   └── /challenge                 Tune to the brief
│   └── /modules/ethics                Module 03 overview           (Vulnerability Wireframe Matrix)
│       ├── /lessons/1 ... /lessons/5
│       ├── /knowledge-check
│       └── /challenge                 Name the failure
├── /progress                          Progress dashboard
├── /achievements                      Three badges
├── /glossary                          Glossary and further reading
├── /about                             About / team
├── /accessibility                     Accessibility statement
└── /credits                           Credits and licenses
```

32 routes, each emitted as its own HTML file at build time (`dist/<route>/index.html`) plus `404.html`. The same content is rendered by React once JavaScript runs and is readable without it.

## Page purposes

| Page | Purpose | Key content |
| --- | --- | --- |
| Home | Explain the product and route the visitor to the right next step | Headline and your record, the curriculum map built from saved progress, the method, three differently composed module panels, the points and badge ledger |
| Module hub | Compare the three modules and resume | Three paths in a stepped layout: objective, centerpiece, lesson sequence with state, completion |
| Module overview | Orient before starting | Objective, lesson sequence with state, badge requirements and the centerpiece, in an order and composition specific to each module |
| Lesson | Teach one idea | Position in the module, completion meter, text, key points, one-question check, a single next step; seen after 4 s, practiced and mastered through the check |
| Knowledge check | Assess the module | Five questions, scored together, per-answer feedback |
| Challenge | Apply it under mild pressure | Choice sequence or live slider tuning; untimed or timed |
| Progress dashboard | Show everything the system knows | Completion by module, the curriculum map, XP history, streak calendar, mastery heatmap, next step, export/import/reset |
| Achievements | Show badges and what they need | Three badge records with each requirement marked met, remaining or locked |
| Glossary | Reference | 26 terms with module tags, search, ten reading links |
| About / team | Context and theme mapping | How the theme maps to the site, data policy |
| Accessibility statement | Accountability | Built-in features, how they are checked, known limits |
| Credits | Attribution | Every library, font and asset; research cited |

## URL scheme and navigation model

- Real paths, no hash routing. `/modules/<id>/lessons/<n>`, `/modules/<id>/knowledge-check`, `/modules/<id>/challenge`.
- Module ids: `foundations`, `synthesis`, `ethics`. Lesson numbers are 1-based.
- Deployment under a sub-path: build with `BASE=/repo/ pnpm build`.
- Primary navigation in the header on every page; per-module tab strip (Overview, 1 to 5, Check, Challenge) with mastery state in each tab; a floating progress hub on every page.
- On every route change: scroll to top, move focus to the page's `h1`, announce the new page title in a polite live region.

## Information architecture

Three levels: **portal** (home, hub, dashboard) → **module** (overview, centerpiece) → **unit** (lesson, check, challenge). The centerpiece stays mounted while the visitor moves between units of a module, so the GPU scene is created once.

## UX flows

**Onboarding.** Home → "Start with Foundations" → lesson 1. No sign-up, no modal. The first meaningful action starts the streak and earns the first XP.

**First module entry.** Overview shows the objective, five lesson cards (all "unseen"), the badge checklist at zero and the centerpiece, interactive immediately. Moving the pointer through the field is itself progress (Try Deflect, Try Attract, Try Orbit).

**Quiz or challenge loop.** Lesson → check question (retry freely) → next lesson → … → knowledge check (five questions, submit once) → result with explanations → challenge (choose untimed or timed) → result → back to overview. Failing never blocks anything.

**Level-up.** XP is awarded → the hub's counter glides to the new value → if the level changed, a polite announcement reads "Level 3, Gradient". No modal.

**Badge unlock.** The last missing requirement is completed → the badge machine enters `unlocking` → particle burst from the badge's position (or the screen centre) → machine reaches `unlocked` when every particle has expired → the badge un-dims and begins tilting with the pointer. With reduced motion the burst is skipped and the badge simply un-dims.

**Returning user.** Saved state loads and is verified before first paint. Home's progress strip and the hub show level, streak and a "Next" link. The recommendation resumes the last module, then falls back to the least complete one, then to spaced review of anything not seen for three days.

**Reset.** Progress → "Reset progress" → an alert dialog states what is erased and focuses the confirm button → "Yes, erase my progress" or "Keep my progress" (Escape also cancels).

**Tampered or corrupt save.** Detected silently on load; the site starts fresh and shows no error.
