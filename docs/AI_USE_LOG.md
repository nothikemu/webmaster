# AI use log

**Why this exists.** Texas TSA's *Copyright, Original Work, and Generative AI Policy* (2026-27) says entries must be the original work of the team and that GenAI "may only be used when permitted by the specific Competitive Event." Where it is permitted, use must be disclosed accurately, and the team may need to submit the *Resources and AI Reflection Form*. Whether Webmaster permits GenAI is **UNVERIFIED** (the national Webmaster rules are member-only). See `RESEARCH_2026-27.md`, section C.

This log is a factual record only. It is **not** a ruling that the work is permitted. The team and advisor decide that.

Policy source: https://texastsa.org/wp-content/uploads/2026/10/Copyright-AI-and-Uniqueness-of-Student-Work.pdf

## Entries

| Date | Tool | What it did | Files |
| --- | --- | --- | --- |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Imported the existing "Parameter" portal from `nothikemu/tsa-webmaster@3c3e399` into this repository unchanged. **Who or what wrote that baseline is not recorded in that repository; the team must confirm and log it.** | all baseline files |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Research support: fetched and summarized official TSA, Texas TSA, AI4K12, CSTA, Common Sense, UNESCO and NIST pages; found the Texas AI policy; wrote the research report. | `docs/RESEARCH_2026-27.md` |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Audited the imported baseline and replaced it: removed the 3D/WASM/obfuscation stack and old docs; wrote the new app architecture. | `package.json`, `vite.config.ts`, `src/engine/*`, `docs/AUDIT_BASELINE.md` |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Wrote all lesson text, experiment code, codex, scenarios, certification questions and Tool Atlas entries. Tool facts came from the vendor pages and search summaries listed in the research report. **Facts have not been human-verified.** | `src/content/*`, `src/widgets/*` |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Wrote the illustration code (scenes, the character Kernel, badge emblems, icons), the design system CSS and the synthesized sound code. | `src/art/*`, `src/styles/*`, `src/audio/*` |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Art overhaul, on the user's request: wrote the ink-brush engine, rewrote the hero harbor, the three path scenes, Kernel and the badge emblems, and added three mentor characters, shared props and fifteen lesson illustrations. All artwork is generated as SVG code, not drawn by a person. Reference qualities (line weight, hatching, silhouettes) came from the named shows; nothing was traced or copied. | `src/art/*`, `src/pages/Lesson.tsx` |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Wrote the tests, the contrast checker and the browser smoke test, ran them, and fixed the problems they found. | `tests/*`, `scripts/*` |
| 2026-11-08 | Claude Code (Claude Sonnet 5.5) | Wrote the README and the docs. The team log (`DEV_LOG.md`) was left blank for the team. | `README.md`, `docs/*` |

## How to keep this log honest

- Add a row for every session in which an AI tool writes or edits code, copy, curriculum text, artwork or documentation.
- Record the tool, the model if known, and the role (brainstorming, research support, drafting, debugging, generating code, generating art).
- Record what the team members themselves wrote, decided and verified. The AI Reflection Form asks how the final work represents the team's own ideas and understanding.
- Cite any outside text, image, code or data in a recognized style (MLA, APA, Chicago or IEEE), even when it is labeled free to reuse.
