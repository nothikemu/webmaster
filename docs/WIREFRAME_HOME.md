# Home page wireframe

> **Superseded.** This wireframe records the earlier black-and-white home page. The current layout (curriculum map, three differently composed module panels, a plain points ledger) is described in `DESIGN_SYSTEM.md`. GSAP, ScrollTrigger and Lenis, mentioned below, are no longer part of the build.

> **Update:** the later "minimal and zen" pass removed the eyebrow label, the stats row, the scroll hint, the progress strip, the progress tile and the "how it is built" facts from the home page, so the sections below that describe them are historical. The home page is now the hero, three module cards and one short section on points and badges. Across the site, slash-joined labels, native tooltips and decorative readouts are gone, and small labels are plain sentence-case text.


Black ground (`#000`), elevated sections `#050507`, one mid-grey `#86868b`, white for primary text. The accent family (blue → violet → cyan) appears only on 3D elements, progress rings and focus states.

## Desktop (1440 wide)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ▣ parameter                                   Modules  Progress  Achievements  Glossary  About │ ← sticky header, 64px, hairline (static on phones)
├────────────────────────────────────────────────────────────────────────────────────────┤
│ PARAMETER / INTERACTIVE AI LEARNING PORTAL / 2026-27        ·  ·  ·  ·  ·  ·  ·          │
│                                                           ·  ╲╱  ╲╱  ╲╱  ╲╱  ·           │
│ Learn how                                              ·──╳──╳──╳──╳──╳──·    →  network  │
│      machines learn.                                    ·  ╱╲  ╱╲  ╱╲  ╱╲  ·    bleeds off │
│                                                           ·  ·  ·  ·  ·  ·       the right  │
│ Push around a 6,000-particle neural network. Tune …                                      │
│ [ Start with Foundations ]  See all modules →                                           │
│ 3 MODULES   15 LESSONS   15 CHECK QUESTIONS   0 ACCOUNTS                       SCROLL    │ ← HERO: 170vh, content pinned
├────────────────────────────────────────────────────────────────────────────────────────┤
│ YOUR PROGRESS                                                                           │
│ LEVEL 3 Gradient   XP 340   DAY STREAK 4   OVERALL 38%        NEXT  Lesson 3: Neural …  │ ← PROGRESS STRIP
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Three modules. Three different ways                                                     │
│ to touch an idea.                                                                       │
│ ┌──────────────────────────────────────────┐ ┌───────────────────┐                      │
│ │ MOD 01 / FOUNDATIONS          ·  ·  ·    │ │ MOD 02 / SYNTHESIS│                      │ ← BENTO (6 cols)
│ │                          ·──·──·──·      │ │ Synthesis         │                      │   A: cols 1-4, 2 rows, r=40
│ │ Foundations              ·──·──·──·      │ └───────────────────┘                      │   B: cols 5-6, r=28
│ │ Rules write the program…                 │ ┌───────────────────┐                      │   C: cols 5-6, r=34/28
│ └──────────────────────────────────────────┘ │ MOD 03 / ETHICS   │                      │
│        ┌─────────────────────────────────────┴───────────────────┘                      │
│        │ YOUR PROGRESS  (◯ 38%)  Lesson 3 …  Continue →               │                  │   P: cols 2-6 (off-grid start)
│        └──────────────────────────────────────────────────────────────┘                  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Points for finishing,                       ┌──────────────────────────────┐            │
│ not for refreshing.                         │ THREE BADGES                 │            │ ← GAMIFICATION PREVIEW
│ XP is paid once per step …                  │  ⬡ Neural   ⬢ Prompt  ⛉ Safe │            │   copy left, badges right (locked
│ ─ Lesson seen            10                 │  Topology   Architect guard  │            │   dim; live state)
│ ─ Lesson practiced       15                 └──────────────────────────────┘            │
│ ─ …                                                                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ Built like a product, shipped as static files.                                          │
│ 1 WEBASSEMBLY MODULE │ 5 COMPUTE PATHS │ 60 FPS TARGET                                  │ ← FACTS (hairline columns)
├────────────────────────────────────────────────────────────────────────────────────────┤
│ parameter   Built for TSA Webmaster 2026-2027.   Accessibility · Credits · Glossary · About │ ← FOOTER
└────────────────────────────────────────────────────────────────────────────────────────┘
                                                                              ┌──────────┐
                                                                              │◯ LVL 3 38%│ ← floating telemetry hub
                                                                              └──────────┘
```

## Mobile (390 wide)

```
┌──────────────────────────┐
│ ▣ parameter              │
│ Modules Progress Achiev… │ ← nav wraps; no hamburger, no JS needed
├──────────────────────────┤
│ PARAMETER / INTERACTIVE… │
│ Learn how                │ 3.4rem, -0.045em
│   machines learn.        │
│ (network at 55% opacity, │
│  scaled 140vw, off-right)│
│ Push around a 6,000-…    │
│ [ Start with Foundations]│
│ See all modules →        │
│ 3 MODULES · 15 LESSONS … │
├──────────────────────────┤
│ YOUR PROGRESS (stacked)  │
├──────────────────────────┤
│ ┌──────────────────────┐ │ bento: single column, min-height 280
│ │ MOD 01 …             │ │
│ └──────────────────────┘ │
│ … B, C, progress tile …  │
├──────────────────────────┤
│ gamification (stacked),  │
│ badges stacked 1 column  │
├──────────────────────────┤
│ facts (stacked, rules    │
│ become horizontal)       │
├──────────────────────────┤
│ footer                   │
└──────────────────────────┘
                      [ LVL 1  38%  ⌃ ]  ← progress bar, full width at the bottom edge on phones; a 52px ring at the bottom right on desktop
```

## Type and spacing

The values live in `apps/portal/src/styles/tokens.css`; the reasoning is in `APPLE_DESIGN_NOTES.md`. Text uses the reader's system font; nothing is downloaded.

| Token | Value | Used for |
| --- | --- | --- |
| `--t-hero` | `clamp(2.5rem, 7.4vw, 5rem)`, 600, line-height 1.05 | Hero headline, centered |
| `--t-display` | `clamp(2rem, 3.4vw + 1rem, 3.5rem)`, 600 | Page titles |
| `--t-h2` / `--t-h3` | up to 2.5rem / up to 1.75rem, 600 | Section and card headings |
| `--t-lead` | 19 to 21px, `--text-2` | Lead paragraphs |
| Body | 17px, line-height 1.47, regular | Everything that is read |
| Small and labels | 14px (`--fs-small`, `.mono`), `--text-3` | Secondary text, never smaller |
| Depth | `--bg` #000, `--fill` #1c1c1e, `--fill-2` #2c2c2e, `--bg-elev` #161617 | Base, cards, hover, footer band |
| Text | `--text` #f5f5f7, `--text-2` #d2d2d7, `--text-3` #a1a1a6 | Primary, secondary, tertiary |
| Accent | `--accent` #0091ff (links, focus, chart marks), `--accent-solid` #0071e3 (button fill) | Actions and progress only |
| Selected | `--selected` #f5f5f7 with `--selected-text` #1d1d1f | Current tab, pressed chip, chosen segment |
| Space | `--s-1` to `--s-9`: 4 to 96px; `--section` clamp(64px, 9vw, 128px) | Gaps and padding |
| Radii | 12, 18, 28, 999px | Inputs, rows, panels, controls |
| Width | `--max` 1080px, `--measure` 64ch | Page wrapper and reading column |
| Controls | `--tap` 44px; focus ring 3px solid accent, offset 3px | Every target |

## Scroll choreography

| Section | Driver | Behaviour |
| --- | --- | --- |
| Hero | GSAP ScrollTrigger scrub → `--hero-p` (0 to 1) | Only on screens at least 821px wide and 700px tall: content pins for 50svh of scroll. Network scales up to 1.32×, layers light in sequence, headline drifts up 6svh and fades, stats and "SCROLL" fade out first. On phones and short windows the hero is an ordinary section |
| Strip, bento, gamification, facts | ScrollTrigger `once` at "top 90%" → class `in` | CSS reveal: 28px rise and fade over 1100 ms on `cubic-bezier(.16,1,.3,1)`, only while the motion layer runs |
| Smooth scroll | Lenis, driven by the master frame loop | Home only; off under reduced motion |
| Tiles | CSS hover | Line art drifts 6px and tints toward blue; machined edge angle rotates |
