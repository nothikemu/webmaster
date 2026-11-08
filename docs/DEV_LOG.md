# Development and planning log

Judges for this event usually value documented process. This file is a **template for the team's own record**. It deliberately contains no invented history: every entry must describe something your team actually decided, did, tested or changed. Delete the guidance text as you fill it in.

## Team and roles

| Name | Role | Responsibilities |
| --- | --- | --- |
| (name) | (e.g. Lead developer) | (what they own) |

## Competition checklist

- [ ] Read the current National Competitive Events Guide and the Webmaster rubric (`TSA_REQUIREMENTS.md` could not).
- [ ] Confirm rules on frameworks, build tools, WebAssembly and AI-assisted code (`COMPLIANCE.md`).
- [ ] Confirm deadlines, submission format and hosting.
- [ ] Replace "Rubric line" text in `RUBRIC_MATRIX.md` with the official wording and weights.
- [ ] Add the real team roster to the About page content (`src/content/site.ts`).
- [ ] Re-check every statistic and citation in the lessons (`ASSUMPTIONS.md`, item 8).
- [ ] Open all ten further-reading links.
- [ ] Complete the manual accessibility checklist (`A11Y_TEST_PLAN.md`).
- [ ] Run `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm smoke` on your own machine and record the results.

## Decisions

Use one row per decision. Record the alternatives you considered and why you chose one.

| Date | Decision | Alternatives considered | Reason | Decided by |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Work log

| Date | Who | What was done | Time | Evidence (commit, screenshot, test) |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## AI assistance record

Be specific. If an AI tool produced a draft, say what you asked, what it produced, and what you changed or rejected.

| Date | Tool | Prompt or task | What you kept | What you changed or rejected |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Testing record

| Date | Who | What was tested (device, browser, assistive technology) | Result | Issues found | Fixed? |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

## Interview preparation

Be ready to explain, in your own words:

1. How the three modules map to the theme's three sections.
2. How XP, levels, streaks and badges work, and why the anti-grind rules exist (`GAMIFICATION_SPEC.md`).
3. How progress is saved, signed and restored, and what that does and does not protect (`PROGRESS_SPEC.md`).
4. What happens when WebGPU, WebGL2, workers or WebAssembly are missing (`TECH_STACK_DECISION.md`).
5. Which parts you wrote, which you adapted, and which libraries you used (`ORIGINALITY_AND_CREDITS.md`).
6. What you would improve next (`PERFORMANCE_BUDGET.md`, "Next steps").
