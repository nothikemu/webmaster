> Historical. This note records the earlier Apple-inspired pass. The current visual identity is described in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) and [DESIGN_RESEARCH.md](DESIGN_RESEARCH.md); the accessibility and clarity rules below still apply.

# Apple design research and how it was applied

> **Superseded for visual direction.** The later redesign moved from a black, Apple-like surface to a midnight-ink scientific learning lab (see `DESIGN_SYSTEM.md`). The accessibility, target-size, focus and reduced-motion judgments recorded here still apply and are kept in the current design; the color, type and radius values below are historical.

The portal follows the *judgment* in Apple's Human Interface Guidelines (HIG): clarity, restraint, hierarchy from size and spacing rather than decoration, and controls that look like controls. It does not copy Apple's logos, icons, photography or page compositions. The HIG is written for native platforms, so every web value below is a translation, not an Apple rule.

## Sources read

Primary (Apple), read in full as Markdown:

- [Typography](https://developer.apple.com/design/human-interface-guidelines/typography), [Color](https://developer.apple.com/design/human-interface-guidelines/color), [Dark Mode](https://developer.apple.com/design/human-interface-guidelines/dark-mode)
- [Layout](https://developer.apple.com/design/human-interface-guidelines/layout), [Motion](https://developer.apple.com/design/human-interface-guidelines/motion), [Materials](https://developer.apple.com/design/human-interface-guidelines/materials)
- [Buttons](https://developer.apple.com/design/human-interface-guidelines/buttons), [Accessibility](https://developer.apple.com/design/human-interface-guidelines/accessibility)
- [UI Design Dos and Don'ts](https://developer.apple.com/design/tips/), [Toolbars](https://developer.apple.com/design/human-interface-guidelines/toolbars), [Segmented controls](https://developer.apple.com/design/human-interface-guidelines/segmented-controls), [Sliders](https://developer.apple.com/design/human-interface-guidelines/sliders), [Text fields](https://developer.apple.com/design/human-interface-guidelines/text-fields), [Writing](https://developer.apple.com/design/human-interface-guidelines/writing)

Secondary, **not verified against apple.com itself** (the sites that describe its CSS could not be fetched from the build environment, so these figures come from search-result summaries and are approximate): headline 56px at weight 600 with line-height about 1.07; body 17px with line-height about 1.47; display line-heights 1.07 to 1.19; negative tracking from about 17px up; a 44 to 48px translucent navigation bar; pill buttons; chevron text links.

## What the guidance says, and what we did

| Guidance | Applied |
| --- | --- |
| Body text 17 pt, regular weight for reading, semibold for headings; avoid light weights; few typefaces (Typography) | System font only. Body 17px, line-height 1.47. Headings weight 600, tracking about -0.015em. No light weights, no gradient text |
| Hierarchy from weight, size and color (Typography, Layout) | One type scale: 14, 17, 19 to 21, 24 to 28, 28 to 40, 32 to 56, 40 to 80px. Secondary text is a lighter gray, never a smaller size than 14px |
| Dark Mode: a dim base and brighter elevated levels; contrast at least 4.5:1, aim for 7:1 for small text (Dark Mode) | Black base `#000`, elevated fills `#1c1c1e` (Apple's dark systemGray6) and `#2c2c2e`. Text `#f5f5f7`, secondary `#d2d2d7`, tertiary `#a1a1a6` (8:1). Accent `#0091ff` is Apple's dark system blue (6.5:1) |
| Apply color sparingly; color the background of the primary action; never rely on color alone (Color) | One blue. Primary button is a blue fill with white text (`#0071e3`, 4.7:1). Selected tab, chip and segment turn light, not colored. Every state also has a word or a shape |
| One or two prominent buttons per view; style, not size, marks the preferred choice; destructive is never primary; always a press state (Buttons) | One filled blue button per view, the other action is an outlined or text link. Reset is an outlined orange button. `:active` scale on buttons and chips |
| 44 x 44 hit regions, about 12 pt around bezeled elements (Buttons, Accessibility) | Every target at least 44px; tabs, chips and links are spaced 12px apart |
| Group with negative space, order by importance, progressive disclosure (Layout) | Wide gutters, `--section` spacing up to 128px, content width 1080px, one column of reading text, secondary content behind a disclosure |
| Motion is purposeful, brief, optional; replace movement with fades when Reduce Motion is on (Motion, Accessibility) | One easing curve, 200 to 300ms for interface feedback, no motion on frequent interactions. The scroll-driven hero and reveals are off under `prefers-reduced-motion` |
| Materials separate foreground from background; thicker is more legible (Materials) | Translucency only on the navigation bar and the progress control, with saturated blur and an opaque enough tint to keep 4.5:1 |
| Text fields keep a visible label; sliders put the minimum on the leading side; segmented controls stay at five segments or fewer with equal weight (Text fields, Sliders, Segmented controls) | Visible labels on every field and slider; three-segment pointer-mode control; sliders unchanged |
| Writing: plain, concise, start button labels with a verb, avoid "your" and "we", name errors next to the problem (Writing) | Labels such as "Continue", "Erase progress", "Keep progress", "Export progress". No possessives in buttons. Sentence case throughout |
| At least 200% text enlargement, 3:1 for large text and bold (Accessibility) | Verified at 200% and 400% zoom equivalents with no sideways scrolling; axe finds no violations in the dark theme |

## Things deliberately removed

Film grain, the cursor halo, gradient headings, the wordmark box, glass borders, tracked capital labels, stat rows, and decorative readouts. Each added noise without adding meaning.

## Not applied

The HIG's rounded corner values, SF Symbols and Liquid Glass are native-platform assets and effects; the portal uses plain shapes and a single blur material instead.
