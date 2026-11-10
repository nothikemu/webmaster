# Research report: TSA Webmaster 2026-27 (AI Learning Portal)

Research date: **2026-11-08**. Everything marked **VERIFIED** was read on that date from the page or PDF named beside it. Everything marked **UNVERIFIED** could not be read, and nothing here fills those gaps with guesses. Part A and Part B are *mandatory requirements*. Parts E and F are *our own design recommendations*.

This replaces any 2025-26 material. The 2025-26 Webmaster theme (Community Resource Hub) is not used anywhere in this project.

## 0. What could and could not be read

| Source | Status |
| --- | --- |
| tsaweb.org Themes and Problems, Competitive Events, Competition Updates, Preconference Submission, Competition Requirements pages | Read in full |
| National HS Competitive Events Guide, HS General Rules, **Webmaster rating form** | **Not public.** Released to affiliated chapters only (tsaweb.org: "Materials are available to chapters once affiliation is complete"). Not read. |
| Texas TSA 2026-27 Rulebook (PDF, 171 pp., release 9/15/26) and its policy PDFs | Read (policy PDFs in full; the rulebook for Webmaster, AI and accessibility terms) |
| Texas TSA HS Event Guidelines (Google Data Studio report, data updated 11/8/2026) | Read, rendered in headless Chromium |
| AI4K12, CSTA, Common Sense, UNESCO, NIST pages | Read (landing pages; not the full downstream PDFs) |
| OpenAI help center | Direct fetch returned HTTP 403. Age rule below is from a search-engine excerpt of the official page. |
| Design references | VALORANT home and Agents pages viewed as screenshots. Wikipedia text for Samurai Champloo. One Piece, Fireball and Japanese editorial design were **not** studied from primary visuals in this environment. |

## A. Verified national requirements (mandatory)

| # | Requirement | Source |
| --- | --- | --- |
| A1 | HS Webmaster 2026-27 theme: **"Artificial Intelligence (AI) learning portal"**, an interactive portal for **grades 9-12** that demystifies AI by giving a foundational understanding, showcasing practical tools, and teaching techniques to use AI **effectively and ethically in an academic setting**. | https://tsaweb.org/Competitions/Themes-and-Problems?hspage=4 |
| A2 | Required: **at least three distinct learning sections** covering (1) fundamental AI concepts, (2) practical AI tools/techniques, (3) ethical AI usage. | same |
| A3 | Required: an **interactive, gamified interface** (e.g. digital badges, experience points, a progress dashboard) that engages students and **visually tracks completion** of the modules. | same |
| A4 | Event summary: "design, build, and launch a website that addresses the annual challenge. Semifinalists participate in an **interview**." | https://tsaweb.org/competitions/competitive-events?hspage=7 |
| A5 | The HS guide in force covers the **2027 and 2028 National TSA Conferences**. | https://tsaweb.org/competitions/competitive-events |
| A6 | Preconference submission for HS Webmaster is **one website URL**. No PDF is listed for this event. | https://tsaweb.org/competitions/competitive-event-preconference-submission-requirements |
| A7 | URLs **must not be private or password-protected**. Links that cannot be accessed are not judged (including Google Drive). | same |
| A8 | National 2027 dates: chapter registration closes **Wed May 12, 11:59pm ET**; upload window **May 17 9:00am ET to May 19 11:59pm ET**; nothing accepted by email or after the deadline. | https://tsaweb.org/competitions/competition-requirements |
| A9 | No Webmaster-specific update appears on the Competition Updates page. "HS General Rules (Updated 9/28/2026)" exists but is not public. | https://tsaweb.org/competitions/competition-updates |

## B. Verified Texas requirements (mandatory)

| # | Requirement | Source |
| --- | --- | --- |
| B1 | The old rulebook site (texastsarulebook.org) has **moved**. The current HS Rulebook and Event Guidelines are Google Data Studio reports linked from the Texas page; a downloadable PDF is at the URL below. | https://texastsarulebook.org/ , https://texastsa.org/texas-tsa-rule-book/ |
| B2 | Webmaster is a national qualifying event in Texas. **Pre-submit: URL of Website. Onsite prelim: none. Semifinal: Interview. Texas modifications: none ("will run as written"). Advancement: 3 per region, 1 per chapter.** | Texas HS Event Guidelines, "NQE pg 5": https://datastudio.google.com/reporting/a8e94bde-130e-4630-b905-82319d07a645 |
| B3 | URL must not be password-protected; inaccessible links are not judged; changes after the deadline are not judged. | same, "Online Submission Guidelines" |
| B4 | General: entries must be started and completed in the current school year; one entry, one event, one year; English only. | https://texastsa.org/wp-content/uploads/2026/10/General-Rules-and-Regulations.pdf |
| B5 | Rulebook release date 9/15/26. Check the Change Log before regionals and state. | https://texastsa.org/wp-content/uploads/2026/10/Rulebook-Updates.pdf |
| B6 | No Texas-specific web accessibility rule for Webmaster was found in the documents read. WCAG 2.2 AA is our own target, not a stated requirement. | searched full rulebook text |

## C. Originality and generative AI: what the Texas policy says

Source: https://texastsa.org/wp-content/uploads/2026/10/Copyright-AI-and-Uniqueness-of-Student-Work.pdf

- "All work must be **created and completed by the individual competitor(s) or team**."
- Ideas, text, images, graphics, music, video, data and **code** from another source must be cited. "Free" or "for reuse" material must still be cited.
- "GenAI **may only be used when permitted by the specific Competitive Event**." Where permitted it is a **support tool** (explore topics, locate sources, clarify understanding, brainstorm/organize, review the student's own work for grammar, clarity, tone). It "must not replace the student's own learning, analysis, decision-making, **creativity**, or synthesis."
- Students must verify AI output for accuracy, plagiarism, copyright and fabrication, and disclose AI use as the event requires, including the **Resources and AI Reflection Form** when required.
- Penalty: a **20% rules violation**, disqualification of the entry or all state entries for the student(s), and possible chapter consequences.
- Citation style (MLA, APA, Chicago, IEEE) is required; failing to cite risks a 20% violation.

**UNVERIFIED (needs the advisor):** whether the national Webmaster event permits GenAI, in what role, and whether an AI Reflection Form is required. The national Webmaster rules sit in the member-only guide. One signal, not proof: the national submission table lists a "Resources and AI Reflection Form" for **Software Development** but lists only "Website" for **Webmaster**.

## D. Educational frameworks (they shape the curriculum)

| Source | What we verified | How it shapes the portal |
| --- | --- | --- |
| AI4K12 Five Big Ideas: Perception; Representation & Reasoning; Learning; Natural Interaction; Societal Impact. https://ai4k12.org/ | Names and structure from the AI4K12 site. | The three paths cover Learning, Representation & Reasoning, Natural Interaction (generative AI) and Societal Impact. Perception is covered by the neural-network lesson. |
| CSTA / AI4K12 "Identifying AI Priorities for All K-12 Students": five categories: Humans and AI; Representation and Reasoning; Machine Learning; Ethical AI System Design and Programming; Societal Impacts of AI. It notes generative AI forces updates to Big Ideas 4 and 5. https://csteachers.org/ai-learning-priorities-for-all-k-12-students-about/ | Read. | "Humans and AI" justifies the human-judgment thread in every path. GenAI sits under Natural Interaction and Societal Impact. |
| Common Sense Education, Digital Literacy & Well-Being, grades 9-12, 25+ lessons incl. AI literacy ("How do I check whether information is true when AI can make anything look credible?"). https://www.commonsense.org/education/digital-literacy/grades-9-12/ai-literacy | Landing page only. | Verification, misinformation and creative-work trade-offs become scenario lessons. |
| UNESCO, Guidance for generative AI in education and research. Human-centred; calls for data-privacy protection and an age limit for independent GenAI conversations. https://www.unesco.org/en/articles/guidance-generative-ai-education-and-research | Read. | Privacy and age-appropriate use are explicit lessons. |
| NIST AI Risk Management Framework 1.0 (Jan 26, 2023) and Generative AI Profile NIST-AI-600-1 (Jul 26, 2024). Page notes the AI RMF 1.0 is being revised. https://www.nist.gov/itl/ai-risk-management-framework | Read. | Risk, reliability and trustworthiness framing for the Responsible path. Pitched at student level, not organizational compliance. |

Lesson-level facts (for example specific statistics) must be re-checked against their primary sources before launch. See `docs/ASSUMPTIONS.md`.

## E. AI tools: verified facts (dated 2026-11-08; these change often)

| Tool | Verified fact | Source |
| --- | --- | --- |
| Claude (consumer) | Users must be **18+** to create and use an account. | https://support.claude.com/en/articles/13117299-minimum-age-requirement-access-restriction |
| Gemini Apps | **13+** (or the applicable age in the country) with a personal or school Google Account; **18+** for a work account. School accounts need administrator enablement. Family Link-managed accounts cannot use the web app. | https://support.google.com/gemini/answer/13278668 |
| ChatGPT | **13+** with parental consent for ages 13-18 (**search excerpt only; direct fetch blocked**). | https://help.openai.com/en/articles/8313401-is-chatgpt-safe-for-all-ages |
| GitHub Copilot | Verified GitHub Education students get "Copilot Student" at no cost after verification. | https://docs.github.com/en/copilot/how-tos/copilot-on-github/set-up-copilot/enable-copilot/set-up-for-students |

**Not yet verified, so not listed as fact in the portal:** Perplexity, NotebookLM, Microsoft Copilot, Canva AI, Khanmigo, Grammarly, image tools, data tools. Each needs its official help page read before it appears in the Tool Atlas. The catalog shows a "last checked" date on every entry and teaches students to check the vendor's current terms.

## F. Visual references and decisions (our recommendations)

Observed on playvalorant.com (screenshots, 2026-11-08):
- **Three-color discipline**: deep blue-black, warm bone, one hot coral-red. Nothing else.
- **Rectilinear UI**: no rounded corners; thin accent ticks; small square marks as punctuation.
- **Character cut-outs break their frames** and sit on dark panels with a bone label strip beneath.
- **Primary button**: a flat coral block with an offset outline frame. Instantly clickable.
- Dark and bone sections alternate to reset the eye.

Samurai Champloo (Manglobe, 26 episodes, 2004-05, per Wikipedia) is the cited influence for a worn, inked, hip-hop-meets-Edo mood. We take **mood and ink discipline**, not characters or scenes.

Decisions:
1. Borrow VALORANT's *discipline* (few colors, sharp geometry, offset-frame buttons, cut-out art breaking frames), not its palette or its shooter themes.
2. The brief forbids purple-and-blue AI palettes, glow, glass, neon gradients, synthwave and cyberpunk. The palette therefore avoids violet, cyan and glow entirely. See `docs/DESIGN_SYSTEM.md`.
3. All artwork is original SVG, drawn in code with one consistent ink language. No stock images, no raster images, no copied characters.

## G. Originality and attribution considerations

- No copyrighted characters, logos or sound effects. Sounds are synthesized in the browser (Web Audio), muted by default.
- Fonts and libraries are listed with licenses on the Credits page.

## H. Open items for the team and advisor

1. Read the national Webmaster rules, HS General Rules and rating form (advisor access) and confirm the **GenAI permission and disclosure rule**.
2. Confirm whether an AI Reflection Form is required for Webmaster at your level.
3. Confirm Texas regional and state deadlines (not verified; the state conference materials reference Fort Worth).
4. Confirm the deployed URL is public and password-free before upload (A7, B3).
5. Re-check every dated tool fact and every lesson statistic before launch.
