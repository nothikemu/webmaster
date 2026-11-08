# Design research note

This note records the research behind the visual identity: what was read, what was actually looked at, what could not be checked, and which decisions followed. Nothing here is taken from memory without saying so. There have been four rounds; each replaced the one before.

## Round 4 (current): Operator client

The brief for this round, in the user's words across three messages: make clickable buttons look clickable; start from scratch; original artwork; a UI inspired by VALORANT's; it should take up the whole page, not sit in the middle; after the first build, "too toony and gamey... gamey but not so toony and childish", and "much much much much more detailed" artwork. The result is called **Operator client**: a dark, full-width screen styled like a game's front end, with detailed generated key art.

### What was researched, what was actually read, and how much

The request asked for an hour of research before building. It did not take an hour. What was done, in order:

- **Primary, read in full:** Riot's own article "Preview the future of VALORANT's interface" (downloaded from playvalorant.com and read as text), and **all 14 images in it were downloaded and looked at**, with the lobby, agent-select, victory and defeat screens and the season frames zoomed. This is the only primary source in the round.
- **Search summaries only (pages not opened):** the NN/g 2017 eye-tracking study on flat design; WCAG 1.4.11 and how it treats button boundaries; third-party descriptions of Duolingo's button style; practitioner articles on game-HUD buttons, button hierarchy and ghost buttons; general learning-site UX principles; full-bleed layout patterns; the TSA Webmaster rubric (not found again).
- **Could not be read:** the NN/g and W3C pages themselves, and GOV.UK's button source. The sandbox's network policy blocks those hosts (a subagent's fetches failed with DNS errors), so everything about them is as reported in search summaries. Riot's brand guidelines and the 2026-27 TSA rubric were not found.

### What the primary material showed (Riot's screens)

- Every screen is **art-first and fills the window**. The 2022 redesign text says so outright: Riot "removed the map so your banners could take up the screen", replaced the agent textures with 2D key art, and worked to "unify our game and marketing visual identities".
- The client **top bar spans the full width**: small tracked capitals for sections, and the current section is a large **light trapezoid tab** that reads as the one thing to press. The home call to action is large and red.
- The clearest button on any screen is the light **CONTINUE plate**: a filled rectangle with dark type on a dark ground. Nothing on the screens relies on an outline alone.
- Each screen is **graded to one hue that carries its state** (teal for Victory, red for Defeat, violet and pink in the season frames). A giant condensed word sits behind the figures. Frames are drawn at the window edge: chunky bracket shapes, notches, thin circuit lines with nodes, crosshair ticks.
- Panels are dark, hard-edged and thin-lined; names and numerals are condensed capitals.
- From search coverage (secondhand): Riot's 5.08 menu moved the top tabs to a vertical menu and added steps; players objected, and 5.10 put the tabs back along the top with one-click access. This round keeps all five sections in the top bar for that reason.

### What the secondary material supported

- NN/g's flat-UI study (as summarised): weak clickability cues cost attention and time (22% more time, or 25% more fixations, depending on the report) and NN/g's own position is that weak signifiers, not flatness, are the problem. Practitioner sources agree that outlined and ghost buttons are acceptable for tertiary actions but do not read as the primary action, and that a design system should make buttons look clickable with fill, shading and consistent styling. None of the sources measured outlined versus filled click-through, so this is convention, not evidence.
- WCAG 1.4.11 (summary): a boundary is required for contrast only where it is the sole cue to a control. This design never relies on a boundary alone: controls are filled and labelled.

### Decisions that followed

1. **One rule for every control: a filled shape with an edge under it.** Buttons, the section keys in the top bar, chips, segmented choices, answers, glossary letters and the stepper are all solid faces with a 3px edge that the face sinks onto when pressed and lifts off when reached. There are no bare-text or outline-only controls. Links in running text are always underlined. A card that is a link says so with a pressable button on it and rises when reached. Disabled controls are hatched and flat. The cursor is a pointer on all of them.
2. **Full width.** Nothing sits in a centred column: the header, the hero art, the module banners, the record band and the footer run edge to edge, with a fluid gutter. Only running text keeps a line length (about 64 characters).
3. **Art first.** The home hero is the three module screens side by side under the headline; each module page opens with its picture across the window; each module card on Home and on the catalog is a tall banner with its picture.
4. **One hue per module, as on Riot's result screens:** teal (Foundations), violet (Synthesis), red (Ethics). The hue grades the picture, the stripe, the focus of the page and the buttons that belong to the module. Red is also the one call-to-action colour.
5. **Mature, not toy-like (the second round of feedback).** Saturation was cut (teal `#3aa99f`, violet `#7e74d8`, surfaces `#0a121a` and darker), buttons lost the glossy highlight and their chunky edge (3px, not 5px), letterforms went from weight 800 to 700, and the pictures are lit renders (faceted glass, atmosphere, instrument detail) rather than flat shapes.
6. **Detailed key art, generated in code** (`ui/KeyArt.tsx`): a faceted surface lit from the upper right, light shafts, haze, a vignette, scanlines, a dotted graticule, rulers with numbered ticks, readout columns, corner brackets, and a subject built from the module's own data: a perspective lattice of the swarm (real layer sizes and positions, lit by progress), a four-channel console (faders at the applied presets' means), and an eye in a lens (a bracket per vulnerability). It is generated, not hand-drawn, and it was shaped by looking at renders.
7. **Reading stays on light plates** (lessons, reference pages, the next-step card on Progress), because long text reads better dark-on-light; the dark screen is for doing.

### Limits of this round

The look has not been compared with the real game's client side by side beyond the 14 images. The research did not include the pages named above, the user has not reviewed the result, and no real screen reader or physical device has been used. The pixel-contrast probe still flags the two display lines of the home headline ("machines" and "learn."): it samples each text box, and at the tight leading of a display headline the box of one line overlaps the red slab of the next. The glyphs themselves are paper on the dark screen (14.5:1) and ink on red (5.3:1). Text inside the key art (tick numbers, readouts, layer labels) is decorative and sits inside a labelled picture, so it is exempt from the text-contrast rule and is excluded from the pixel-contrast probe; the information it points at (layer sizes, progress, vulnerabilities inspected) is in the picture's text label and elsewhere on the page.

## Round 3 (replaced): Black Ledger

The brief for this round: start from scratch, make original artwork, take inspiration from the VALORANT interface, One Piece and Death Note. The result is called **Black Ledger**: a manga page with a tactical HUD laid over it.

### What was researched, and how thin it was

Web searches only. The results were summaries, and the exact article addresses were not kept, so the sources below are named by site rather than linked; the pages were not opened and read in full, and no image or video from the three works was looked at in this round. Everything below is as reported in those summaries, marked as secondhand, plus what carries over from Round 1 (where the VALORANT article and some images were actually opened).

- **One Piece / Eiichiro Oda.** Search results included an article on comicbook.com, WIT Studio coverage on tribune.com.pk, an animehunch piece that names Dragon Ball as an influence on Oda's line, and soranews24 coverage. What they supported: dense, bold, slightly wobbling ink line, exaggerated shapes, wanted posters, sea charts and the Jolly Roger as the show's recurring graphic objects. (The wanted-poster and flag details are also common knowledge about the series; the sources in this round did not describe their design in detail.)
- **Death Note / Takeshi Obata.** Search results included a cover-art essay that discusses chiaroscuro, review pages describing the manga's black-and-white contrast ("blanc et noir"), and a fandom page for Bakuman (Obata's other series with the same writer). What they supported: heavy black and white contrast, cross-hatched shading, gothic ornament, and red as the single accent colour on covers. The notebook with rules, ledger lines and tally marks is this project's interpretation of the premise, not something the sources described as a design language.
- **VALORANT interface.** The Round 1 reading of Riot's own article still applies (simplify shape language, more contrast, remove decoration that serves no purpose). New in this round: a third-party design-tokens page (webdesignhot.com) listing a navy `#0f1923`, an off-white `#ece8e1` and a red `#ff4655`, zero-radius corners, skewed call-to-action buttons and hairline rules; and a fonts page (madegooddesigns.com) saying the in-game face is a Tungsten-like condensed sans with a DIN Next-style text face. **None of that was verified against Riot's own material**; it was treated as a lead for the colour palette and the angular, uppercase, condensed type, which also match what was seen in Round 1.

### What was not checked

- No page from the three works was seen. Nothing in this repository is copied or traced from any of them.
- The VALORANT colours above are a third party's report and are used here only as a palette direction; they are not claimed to be Riot's.
- There was no side-by-side comparison, and no test with real users.

### Decisions that followed

1. **Paper and ink, one accent.** The ground is an off-white manga page with fine grain (`#ece8e1`), everything is drawn in a navy-black ink (`#0f1923`), and red (`#ff4655`) is used only for emphasis: the active tab, a brush stroke behind one headline word, the stamp, the influenced swarm. Gold and sea-blue are used only to tell the three modules apart, and parchment (`#e6d5a8`) is used only for posters and charts. This borrows the black, white and red of Death Note's covers and VALORANT's palette.
2. **Two kinds of surface.** Light paper cards carry reading; dark navy HUD panels carry instruments, the record, the notebook and the footer. The HUD panels have red corner brackets. This is the VALORANT part: flat, angular, no gradient, no blur, no rounded corners, one cut corner, slanted buttons, uppercase condensed labels.
3. **Hatching instead of shadows.** Every card has a block of 135-degree hatch lines behind it instead of a blur; pictures are shaded with cross-hatching. This is the Death Note and manga part, and it is the cheapest way to make the page look inked instead of rendered.
4. **Blackletter for big titles only.** Pirata One is used for headings at large sizes, where a gothic face reads as a title, and never for sentences: lesson objectives and body copy are in a plain square sans (Barlow). Labels, buttons and numerals are in a tall condensed face (Big Shoulders Display) in capitals, for the VALORANT feel; captions are in a typewriter face (Special Elite) like entries in a ledger.
5. **Original hand-inked artwork, generated by an ink engine.** `src/ui/Ink.tsx` draws strokes as variable-width, tapered, wobbling polygons from a seeded random generator, plus hatching and a rough-edge filter. The artwork built with it: a skull-and-crossbones flag for Home (the One Piece part), a sea chart of the neural network, a pen on a ruled page, an eye with a red iris (the Death Note part), and torn parchment wanted-poster badges. **This is not hand-drawn.** It is code that imitates the marks of a pen, and its output is repeatable; it was shaped by looking at renders and adjusting, not by a person drawing.
6. **Art that reads the learner's saved state.** The flag's tally marks count lessons opened and mastered; the sea chart's islands are the swarm's real layer sizes and the X marks follow module progress; the pen page's lines come from the mean of the presets applied; the eye has one ring per vulnerability inspected. Each has a text alternative, so the art is never the only carrier of the information.
7. **Verdicts are stamps and tally marks**, not mascots: a rubber stamp saying CLEARED in red or NOT YET in ink, with a tally of the score.
8. **3D scenes follow the same rule:** flat discs with a hard shade crescent and a dark ring on a navy stage, paper-coloured links, red where the learner touched the swarm, and a navy globe with three flat bands and a paper rim.

### Limits of this round

Secondhand summaries only; the look has not been reviewed by the people who asked for it; the artwork is generated, not hand-drawn; it has not been tested with real screen readers or on physical devices.

## Round 2 (replaced): Ink and Cel

The first identity ("Signal Print", described under Round 1 below) was built and shipped to the branch. It was reviewed as "insanely corny" and the request was for something more graphic and cel-shaded, started from scratch. Looking at what it did: it used the references' surface devices (giant outlined words, rotated stamps, a ticker tape, hard offset shadows on every control, grid and grain) as decoration in every section. Those are gimmicks. A cel-shaded look is a way of rendering objects, not a set of stickers. This round therefore asked how toon rendering is actually built, and applied that as the rule for every object on the page.

### What was researched

Two web searches (summaries of the results; the pages themselves were not opened, so everything below is as reported in those summaries and is marked as such):

- Cel shading principles. Sources returned: [garagefarm.net guide](https://garagefarm.net/blog/cel-shading-a-comprehensive-guide), [wayline.io guide](https://wayline.io/blog/cel-shading-a-comprehensive-expert-guide), [Sam Hedges on the history and techniques](https://sam-hedges.github.io/2023/01/31/cel-shading.html), [strayspark.studio anime toon look](https://www.strayspark.studio/blog/how-to-get-anime-toon-look-blender), [morphic.com glossary](https://morphic.com/3d-glossary/cel-shading), [Blender Eevee methods on Medium](https://medium.com/@josephclaytonhansen/four-different-methods-for-making-cel-shaders-in-blender-eevee-2-8-2-9-6d976ce2555d).
- Hi-Fi Rush's toon style. Sources returned: [Vice](https://vice.com/en/article/88qyw5/how-a-designer-known-for-horror-made-the-musical-gaming-triumph-hi-fi-rush), [CGMagazine on comic aesthetics in games](https://www.cgmagonline.com/articles/comic-book-aesthetics-gaming/), [GDC session "3D Toon Rendering in Hi-Fi Rush"](https://schedule.gdconf.com/session/3d-toon-rendering-in-hi-fi-rush/899802), [Unwinnable](https://unwinnable.com/2023/07/21/in-hi-fi-rush-style-is-substance-165/).

### What the summaries said, in the terms this project used

- Cel shading is the ordinary diffuse lighting term with the smooth ramp thrown away. The shadow edge becomes a hard line, which is what reads as drawn rather than rendered. Two stops make the classic two-tone anime look; three add a mid-tone.
- Shadow colors should be hue-shifted toward purple or blue, not just darkened, or they look muddy.
- The ink outline is a separate step from the shading (in real time, the model pushed out along its normals and drawn behind). Line weight can vary to give weight and interest.
- Hi-Fi Rush, as described: flat 2D-style animation inside 3D, bold uneven black outlines, halftone for lighting effects such as bloom, and a design built around readability first. A halftone UI style guide and the Unwinnable piece were not opened and add nothing here.
- Not found: any detailed analysis of Hi-Fi Rush's HUD or menu typography.

### Decisions that followed

1. **One drawing rule for every object**: a flat base, one hard-edged shade shape on the side away from the light (top-left light), a small highlight, an ink line. In CSS the shade is an inset shadow with no blur; in SVG it is the base shape moved toward the light and clipped to the object; in the 3D scenes it is a stepped ramp in the shader.
2. **Hue-shifted shade ramps**: each color has a base, a shade and a highlight, and the shade turns toward blue or violet (blue to indigo, yellow to orange, pink to magenta, white to lavender). No color is ever darkened with black.
3. **An ink outline everywhere, in two weights**: 3px on objects and 4px on large pictures. The 3D orbs get an ink ring and the globe an ink rim.
4. **Halftone only for shade areas** of illustrations, as the comic and Hi-Fi Rush summaries describe, and nowhere else.
5. **Readability over decoration** (the Hi-Fi Rush summary, and Riot's statement in Round 1 that purposeless decoration had been removed): no giant outlined words, stamps, tickers, offset shadows or textures. Cards are plain; the art carries the personality.
6. **A character**: the robot, Param, is the one illustrated subject on Home. Anime key art leans on characters, and it makes the saved progress legible at a glance: eyes open wider as progress grows, one forehead light turns on per badge, one orb per module grows with the module. It also appears, small, on result screens: happy arcs when cleared, steady eyes when not yet.
7. **Light ground, ink-indigo lines**: the outline works only against a light ground, so the page is warm paper with an ink-indigo line, not black, and ink is also the text color. Dark is used once, for the footer.
8. **Squash and stretch for motion**: elements pop in with a small overshoot and settle; the loading mark is a bouncing orb on its shadow.

### Limits of this round

Search summaries only; none of the pages above was opened or read in full. No video or game footage was seen. The resulting look has not been compared side by side with Hi-Fi Rush or any other title.

### Why Ink and Cel was replaced

It was reviewed as looking "way too AI generated". The diagnosis: rounded, pastel, symmetrical vector shapes, a friendly mascot robot and uniform 3px outlines are exactly what image generators and template kits produce by default, and nothing on the page looked as though a person had drawn it. Round 3 answers that with artwork that has visible hand marks (uneven line weight, wobble, hatching, paper grain, stains), a narrower palette, and specific subjects instead of a mascot.

## Round 1 (replaced): Signal Print

Kept for the record. Its decisions were: flat saturated color that carries a state, notched plates, giant cropped condensed type, banner cards with pointed feet, and a print-shop mix of paper grain, hard offset shadows and out-of-register color; it abandoned glass, glow, gradients, brass and ornament. The Riot statement about removing decoration that "didn't really serve a purpose" is the finding that survives into Round 2. The rest of the surface vocabulary was dropped for the reasons given above.

### How Round 1 was done, and its limits

- **Tools:** web search for leads; direct page and image downloads for the primary material (the sandbox's network policy had to be widened to reach the sites, with approval); image files were opened and looked at. Video could not be watched.
- **Looked at (images opened):** the VALORANT interface and season-key-art images on Riot's own article (15 images, described below), the Samurai Champloo key art, the One Piece volume 61 cover, the Fireball DVD cover.
- **Read (page text):** Riot's "Preview the future of VALORANT's interface"; Wikipedia articles for Samurai Champloo, One Piece, Eiichiro Oda, Fireball, Persona 5, Hades, Tadanori Yokoo; Production I.G's Kazuto Nakazawa profile.
- **Search snippets only (not opened):** Persona 5 UI coverage (Siliconera, PC Gamer, DT Next, Inverse), Hades UI-illustrator job post, Awwwards winners, Japanese poster-design overviews, Brilliant and Elements of AI. They are used as leads and marked as such.
- **Not verified:** the Fireball series' "geometric" or "retro-futuristic" character (no source says so; the cover shows something more specific, below). One Piece wanted-poster and Log Pose design details (Fandom and ANN returned 403). VALORANT's in-game typefaces (third-party pages only). Anything about Teachable Machine's design.

### What the material showed

#### VALORANT (Riot Games)
Source: https://playvalorant.com/en-us/news/game-updates/preview-the-future-of-valorant-s-interface/ (text); images on https://cmsassets.rgpub.io/sanity/images/dsfx7636/news_live/ (the 2022 UI redesign board, Victory, Defeat, Competitive lobby, Jett agent screen, Ascent face-off, V26 season frames, brand mark).

- Riot's own stated goals: "reevaluating our UX/UI standards, assessing art fidelity, and introducing motion design to boost game flow and expression"; "unify our game and marketing visual identities".
- The most useful sentence for this project, from visual design manager Oliver Zumstein: "We had a lot of decoration elements that were pretty but didn't really serve a purpose... we increased the screen's contrast, pushed color values, and simplified our shape language."
- Seen in the screens: the whole screen is graded to one hue that carries the state (teal for Victory, red for Defeat). A giant condensed word ("VICTORY", "DEFEAT") is the architecture of the screen, cropped behind the figures. Player cards are tall vertical banners with pointed bottoms; empty slots are dashed notched frames with a plus. The face-off screen is mirrored with a diamond "VS". The active top tab is a trapezoid. Panels are flat, dark, hard-edged; thin hairlines with crosshair and tick marks connect them like a blueprint. Season frames use notched borders with a rotated vertical wordmark down each side. Characters are 2D key-art illustrations, cropped by the layout. The agent screen sets huge ghosted Hangul behind the character as texture. Small labels are light caps sans; names and numerals are condensed bold caps.

#### Samurai Champloo (Manglobe, dir. Shinichiro Watanabe)
Sources: https://en.wikipedia.org/wiki/Samurai_Champloo ; https://production-ig.com/contents/works_sp/57_/ ; key art image (File:Samurai_Champloo_key_art.jpg).

- Stated (Wikipedia): a fictionalized Edo Japan "blending traditional elements with anachronistic cultural references, including hip hop"; graffiti was added to "enhance the hip hop aesthetic", with references to Warhol and Basquiat suggested; each episode had unique eyecatch art, with woodblock prints of the characters designed by Tsubaki Anna.
- Seen in the key art: a flat saturated orange ground; three figures stacked on a diagonal, overlapping and cropped by the frame; a huge katakana title cut off by the edge, with a small stamped English title laid over it and partly covered by hair; flat cel colors (maroon, navy, pink) against the orange.
- Production I.G's page (about a different Nakazawa project) says brush outlines were traced by hand for an "expressive brush touch".

#### One Piece (Eiichiro Oda)
Sources: https://en.wikipedia.org/wiki/One_Piece ; https://en.wikipedia.org/wiki/Eiichiro_Oda ; cover image (File:One_Piece,_Volume_61_Cover_(Japanese).jpg).

- Stated: Oda's biggest influence was Akira Toriyama; the Jolly Roger flag became a protest symbol in 2025 (Anime News Network, cited by Wikipedia).
- Seen: flat saturated primaries (cyan sky, red frame, yellow); a hand-lettered logotype with the skull-and-crossbones set as the "O"; a dense pile of characters on a diagonal with extreme, elastic poses; almost no negative space; a red band at the top and bottom as a frame.

#### Fireball (Jinni's Animation Studios / Disney, 2008)
Sources: https://en.wikipedia.org/wiki/Fireball_(TV_series) ; cover image (File:Fireball_DVD_vol_1.jpg).

- Stated: CGI shorts "animated entirely in 3D with no cel-shading"; designer Hitoshi Fukuchi; a gynoid duchess and a "massive cyclopean arachnoid" servant in a giant manor, in the 49th millennium; nonsensical comedy.
- Seen: a glossy white toy-like robot in a dynamic pose in front of a much larger ochre-and-black machine; the ground is pale grey covered in black arabesque and butterfly ornament; one accent (cyan eyes); the strongest idea is the scale contrast and the ornament used as a background texture behind a single focal figure. The "geometric" quality in the brief is not stated by any source.

#### Extra references (leads, not all opened)
- Persona 5 UI: Wikipedia says the UI was designed to attract a more mainstream audience and to show "how a shift in perspective could alter a dull life into an exciting one". Search coverage reports Sex Pistols ransom-note covers as a type influence (DT Next), early menus "impossible to read" (PC Gamer), a single red identity with lines guiding the eye (Siliconera), and a later move to a more readable Constructivist-influenced UI in Tactica (Inverse).
- Hades: the art director is Jen Zee; Supergiant hired a "UI illustrator" for menus, HUD and icons, so its interface is drawn, not assembled (job post on supergiantgames.com).
- Japanese poster design and Tadanori Yokoo: Wikipedia describes a style of "psychedelia and pastiche" and photomontage; search coverage (AIGA Eye on Design, People's Graphic Design Archive) describes flat color, layered imagery, characters that are both word and picture, off-center focal points and active empty space.
- Awwwards annual winners suggest studios worth examining next (Immersive Garden, Locomotive, Aristide Benoist, Igloo). They were not opened here.

### About this product

Parameter teaches AI to grades 9 to 12 through three modules (the neural-network swarm, the prompt console, the vulnerability wireframe), with 15 lessons, checks, challenges, XP, streaks and three badges, all stored in the browser. Comparable learning products described in search results (Brilliant: "learn by doing"; Elements of AI: text with interactive exercises; Khan Academy: a warm brand) are built around reading and exercises. None of the reference material says how they look side by side, so no comparison is claimed beyond that.

What deserves emphasis: the three interactive centerpieces, the learner's own progress, and the moments of success and failure (checks and challenges). What needs to be immediately reachable: the next step, the three modules, progress. What to reconsider: the two earlier looks in this repository (glass and gradients, then brass and filigree) were pure surface treatment; both rely on glow, bevel and ornament that Riot's designers explicitly removed from their own interface.

