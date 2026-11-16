# Parameter design system

This replaces the earlier ink-on-paper system. The site and the game now share one language: **ink, paper and one hot red**, drawn with small
diagonal cuts, big condensed capitals and a lot of empty space. The 3D game's look is specified in [STYLE_GUIDE.md](STYLE_GUIDE.md); this file
covers the website, the game's menus and windows, and how the two stay consistent.

## What we took from Apple's Human Interface Guidelines

Research was a web search for summaries of the guidelines (the pages found were third-party summaries, not Apple's own text, so the wording
below is ours and the exact figures should be checked against Apple's site before anyone quotes them):
[Netguru](https://www.netguru.com/blog/ios-human-interface-guidelines),
[Nadcab](https://www.nadcab.com/blog/apple-human-interface-guidelines-explained),
[Uxcel](https://uxcel.com/lessons/design-principles-of-apple-platforms-037),
[Axiom's HIG reference](https://charleswiltgen.github.io/Axiom/reference/hig-ref).

We copy *principles*, not Apple's look: no Apple fonts, icons or imagery are used.

| Principle (as summarised) | What it means here |
| --- | --- |
| **Clarity**: legibility first; type, space and colour show what matters and what can be pressed. | One accent colour (red) is the only thing that says "press me" or "you are here". Body text is 18 px on a 1.65 line, headings are large condensed capitals, and nothing small is red. |
| **Deference**: the interface supports the content and stays out of its way. | The header is light and thin; there is no ornament that only fills space (rope, chain and cog dividers are gone); art appears once per page, not three times. |
| **Depth**: layers and motion show hierarchy. | Cards are flat with a hairline edge; a window (dialog) sits over a blurred backdrop; entrances slide a few pixels and stop. |
| **Hierarchy and whitespace** | One idea per band. An 8-point grid sets spacing (`--s-*`); sections are 72-112 px apart; a card has 32 px of padding. |
| **Fewer elements per screen** | Home has four things (who it is for, where you are, the three paths, one door to Practice). The header has four places, not eight. A phone gets a tab bar at the bottom, where a thumb is. |
| **Touch targets of 44 pt or more** | Every control is at least 48 px. Text links in footers are 44 px tall. |
| **Contrast of 4.5:1 (3:1 for large text)** | Checked by `pnpm contrast` from the tokens, including the red pairs. |
| **Reduce Motion** | `prefers-reduced-motion` shortens all transitions and animations to nothing; nothing depends on motion to be understood. |

## The rule of six

A screen should not hold more than about six separate things competing for attention (headline, lead, two buttons, one picture, one card
row counts as one). When a page needed more, the extra went somewhere else: into a second tab, a disclosure, or a different page. That is why
there is now a **Practice** page, why Missions, Lessons, Practice and Progress are four tabs of one window in the game, and why the myth-or-fact card
moved off the home page.

## Tokens (`src/styles/tokens.css`)

| Group | Values |
| --- | --- |
| Ink and paper | `--ink #0d0d0d`, `--paper #f4f3ee` (the page), `--paper-hi #fdfcf9` (cards), `--paper-lo #e9e7e0` (quiet fills), `--paper-line #c9c6bd` (hairlines) |
| Accent | `--red #e3122a` (graphics, large text), `--seal #c4102a` (fills that carry normal text), `--seal-lo #8e0b1a` (red text on paper), `--seal-hi #ff4b5c` (red text on ink) |
| Text | `--text #0d0d0d`, `--text-2 #474644` (secondary), `--text-ink #fdfcf9` and `--text-ink-2` on ink |
| Type | Barlow Condensed 800 for headings (capitals for page titles), Atkinson Hyperlegible 18 px for text; scale `--t-sm` 15 px, `--t-0` 18, `--t-1` 22, `--t-2` 30, `--t-3` 36-52, `--t-4` 44-76 |
| Space | 4 px base, steps `--s-1` to `--s-9` (4 to 112 px); gutter 20-56 px; reading measure 66 characters |
| Shape | `--cut 12px` and `--cut-sm 8px`: one diagonal cut on two opposite corners. No radii, no hard shadows |
| Motion | `--dur-press 100ms`, `--dur-fast 140ms`, `--dur-mid 220ms`, `--dur-slow 320ms`, ease-out `cubic-bezier(0.22, 1, 0.36, 1)` |

The three learning paths are told apart by name and number, never by colour. Right and wrong answers always carry an icon and a word.

## Components (`src/styles/components.css`)

Button (primary red, secondary tinted, quiet plain), card (flat, hairline), chip, toggle key (an underline marks the current one), meter
(8 px, the number is always written beside it), form fields (1 px edge in a colour that is 3:1 against paper), answer options, callout,
toast, dialog, seal, table, disclosure. Each has rest, hover, pressed, focus, selected and disabled states.

## Layout

* `.wrap` is at most 1200 px wide with fluid side margins. Inner pages use a 76 rem column; reading text 46 rem.
* The shell (`shell.css`) is a sticky light header with the wordmark, four places (Play, Learn, Practice, Progress) and an XP chip; on a phone the
  places move to a fixed tab bar. The footer is one row.
* Pages are plain: a page head (title, one-sentence lead), then content. Decorative plates are drawn through the poster filter or hidden in
  the game's window.

## One picture language

Every illustration on the site (`src/art`) is still drawn with the ink-brush engine, and is **printed in the game's three colours** by an SVG
filter (`#poster` in `src/art/Defs.tsx`): the light value of each pixel picks ink (dark), red (middle) or paper (light). So the harbor on the
home page, the chart, the lesson scenes and the 3D game share a palette without redrawing a line. Halftone stipple survives the filter, which is
why the site now reads as the same poster as the game.

## In the game

The same tokens and components are used for the game's windows. The game window "Tasks" shows the site's own pages (Missions, Lessons,
Practice, Progress) in a dialog, so nothing that is a task needs a trip out of the game; links inside those pages stay in the window. See
[GAME_DESIGN.md](GAME_DESIGN.md).

## What was not rebuilt

The widgets (experiments, quizzes), the artwork code and the lesson text were kept; they were re-skinned by the tokens and the calm layer
(`calm.css`) rather than rewritten. That layer also neutralises the earlier hard offset shadows and heavy borders in `pages.css`, `places.css`
and `widgets.css`. A line-by-line rewrite of those three files is the obvious next clean-up.
