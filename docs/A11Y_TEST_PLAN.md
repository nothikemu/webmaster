# Accessibility test plan

Target: WCAG 2.2 level AA. Accessibility is a scored area, so this plan separates what is automated from what a person still has to do.

## Automated (runs in `pnpm smoke` and `pnpm lint`)

| Check | Tool | Result at last run |
| --- | --- | --- |
| axe-core, WCAG 2.0/2.1/2.2 A and AA tags, on `/`, a module overview, a lesson, the Ethics module, `/progress`, `/glossary`, `/accessibility` | `@axe-core/playwright` | 0 serious or critical violations on all seven pages |
| Static accessibility lint of every TSX file | `eslint-plugin-jsx-a11y` (recommended set), zero warnings allowed | clean |
| Pages readable without JavaScript | smoke test | pass |
| Reduced-motion scene load, halo disabled | smoke test | pass |
| Focus lands on the `h1` after navigation, title announced | router code; covered by the smoke flow | pass |

## Manual checklist (a person must do these; none have been done)

Keyboard only, no mouse:

- [ ] Tab from the address bar: the first stop is "Skip to content" and it works.
- [ ] Every control on every page is reachable in a logical order and shows a visible focus ring.
- [ ] Module A: focus the canvas, arrow keys move the pointer, 1/2/3 and M change modes, Escape releases.
- [ ] Module A: the segmented control moves with arrow keys, Home and End.
- [ ] Module B: sliders respond to arrows; the divider moves with arrows (Shift for larger steps); presets work; "Grid: arrows" moves the crosshair.
- [ ] Module C: markers and Remediate work with Enter and Space; the explanation is reachable.
- [ ] Progress: Export, Import, Reset (confirmation, Escape cancels).
- [ ] The progress hub opens with Enter, Escape closes it, and focus returns to its button.

Screen reader (NVDA with Firefox or Chrome, VoiceOver with Safari):

- [ ] Landmarks and one `h1` per page; headings in order.
- [ ] Each canvas has a name and its description is read; the text alternative has the same controls.
- [ ] XP gains, level-ups, badge unlocks and route changes are announced once, politely.
- [ ] Sliders announce value text; the divider announces its position; segmented control announces its state.
- [ ] Quiz fieldsets and radios are announced with their questions; feedback is read after checking.

Visual and motion:

- [ ] 200% and 400% zoom: no loss of content, no horizontal page scroll at 320 px wide.
- [ ] Windows High Contrast / forced colors: controls remain identifiable.
- [ ] `prefers-reduced-motion: reduce`: no ambient drift, camera sway, tilt, particle burst or spring overshoot.
- [ ] Colour is never the only signal (mastery heatmap uses letters, requirements use "OK" and "--").
- [ ] Touch targets are at least 40 px.

Record results and date in `DEV_LOG.md`.

## Known limits

The particle and wireframe scenes are visual by nature. The text alternatives describe them and, for Module A, report real measured behaviour from the same kernel, but they do not replace seeing the motion. See `/accessibility`.
