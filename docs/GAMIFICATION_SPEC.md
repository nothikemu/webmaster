# Gamification system

All numbers below are constants in `apps/portal/src/core/gamification.ts` and are covered by `tests/gamification.test.ts` (27 tests). The engine is pure: it takes a state and an event and returns a new state and a list of effects. No clock, DOM or storage.

## XP

Each award is `base × streak multiplier`, then passed through the daily soft cap.

| Event | Base XP | Rule |
| --- | --- | --- |
| Lesson seen | 10 | First time only. Triggered after 4 seconds on the lesson |
| Lesson practiced | 15 | Answering its check correctly on a later try |
| Lesson mastered | 25 | Answering its check correctly on the first try, or a correct quiz answer on a lesson already practiced |
| Mastery jump | sum of skipped steps | Unseen to mastered in one go pays 10 + 15 + 25 = 50 |
| Centerpiece action | 15 | Each required action once (a pointer mode, a preset, a vulnerability, remediate) |
| Knowledge check | 20 per point of improvement | Only the improvement over your best score pays |
| Perfect check | 50 | The first 5 of 5 only |
| Challenge, first clear | 120 + up to 80 | Time bonus only in timed mode: `80 × clamp((par − elapsed) / par, 0, 1)` |
| Challenge repeat | 5 | Once per module per day |
| Spaced review | 5 | Only for a lesson due for review (more than 3 days), once per day |
| Badge | 100 | Once, when all requirements are met |

**Streak multiplier:** `1 + min(0.5, 0.05 × (streak − 1))`. A 4-day streak pays +15%; the cap is +50% at 11 days.

**Daily soft cap:** the first 400 XP of a day pay in full; anything above pays 25%.

## Levels

`xpForLevel(n) = round(120 × (n − 1)^1.5 / 5) × 5` for n ≥ 2, level 1 starts at 0.

| Level | Name | Total XP |
| --- | --- | --- |
| 1 | Signal | 0 |
| 2 | Vector | 120 |
| 3 | Gradient | 340 |
| 4 | Layer | 625 |
| 5 | Tensor | 960 |
| 6 | Kernel | 1,340 |
| 7 | Embedding | 1,765 |
| 8 | Attention | 2,220 |
| 9 | Transformer | 2,715 |
| 10 | Reasoner | 3,240 |
| 11 | Architect | 3,795 |
| 12 | Principal | 4,380 |

Finishing everything in all three modules pays 2,280 XP at base rates (745 + 760 + 775, before any streak bonus), which is level 8, Attention. Levels 9 to 12 need streak bonuses and spaced reviews.

## Streaks

- A **meaningful action** is anything that pays XP, plus any knowledge-check or challenge submission. Visiting a page is not one.
- First action of a new day: if yesterday was active the streak increases by one, otherwise it restarts at 1. `best` keeps the maximum.
- Days are local calendar days (`YYYY-MM-DD`). History is kept for 140 days to feed the calendar and the XP chart.

## Mastery states (per lesson)

`unseen → seen → practiced → mastered`. States only move forward. The dashboard heatmap shows a letter (U, S, P, M) as well as a shade, so it does not rely on colour.

## Module progress (0-100)

`lessons × 40 + centerpiece × 15 + knowledge check × 25 + challenge × 20`, where lessons is the average of state/3, centerpiece is the share of required actions done, knowledge check is best/5 and challenge is 0 or 1.

## Badges

A module's badge unlocks when all four hold: at least 4 of 5 lessons practiced or better; every required centerpiece action done; knowledge check best at least 4 of 5; challenge cleared. Locked badges are dimmed and desaturated; unlocking plays the particle burst and then enables pointer and arrow-key tilt.

| Badge | Module | Required centerpiece actions |
| --- | --- | --- |
| Neural Topology | Foundations | Deflect, Attract and Orbit, each with at least six pointer moves or a keyboard nudge |
| Prompt Architect | Synthesis | All four presets applied |
| Safeguard | Ethics | All four vulnerabilities inspected, then Remediate |

## Challenge modes

Every module's challenge can be run **untimed** (base reward, no clock) or **timed** (adds a clock, a 5-second penalty per miss, and a bonus for beating par). Pass marks: Foundations 7 of 8 (par 75 s), Synthesis 3 of 3 briefs (par 90 s), Ethics 7 of 8 (par 80 s).

## Anti-grind rules

1. XP is paid for **advancing**, never for repeating. A lesson state, an action or a badge pays once.
2. Knowledge checks pay only for **improvement over the best score**, and only for the first **3 attempts per module per day**. Attempts are still recorded.
3. A cleared challenge pays a small repeat reward **once per module per day**.
4. Spaced review pays only when a lesson is **actually due**, once per day.
5. The **daily soft cap** drops the rate to 25% after 400 XP.
6. **Double-submit guard:** a quiz or challenge submitted within 400 ms of the previous one is ignored.
7. Streaks count **meaningful actions**, not visits.
8. The saved state is **signed**; editing XP by hand resets the save (`PROGRESS_SPEC.md`).
9. Unknown lesson ids, actions and out-of-range scores are rejected or clamped by the reducer.
