# Progress tracking

No accounts and no server. Everything lives in the visitor's browser and the site says so (`/about`, footer, Progress page).

## Storage model

- One `localStorage` key: **`tsa-ai-portal/v1`**, holding one JSON document.
- Writes are debounced by 250 ms and forced on `visibilitychange` (hidden) and `pagehide`, so the last action is not lost.
- If `localStorage` throws (private window, blocked storage, quota), the app keeps working with an **in-memory** store for that visit.
- State changes happen only through the pure reducer; nothing polls.

## Schema (version 1)

`apps/portal/src/core/schema.ts`.

```ts
interface PersistedState {
  v: 1;                         // schema version
  salt: string;                 // 32 hex chars, per device
  createdAt: number;            // epoch ms
  updatedAt: number;
  xp: number;
  xpByDay: Record<string, number>;      // 'YYYY-MM-DD' -> XP, last 140 days
  activeDays: Record<string, number>;   // day -> meaningful actions
  streak: { current: number; best: number; lastDay: string | null };
  today: {                              // anti-grind ledger, persisted so a reload cannot reset it
    day: string; xp: number;
    quizXpAttempts: Record<ModuleId, number>;
    challengeRepeatPaid: Record<ModuleId, boolean>;
  };
  last: { module: ModuleId; at: number } | null;   // for "resume"
  modules: Record<ModuleId, {
    progress: number;                               // 0-100, cached
    lessons: Record<string, 'unseen'|'seen'|'practiced'|'mastered'>;
    reviewedAt: Record<string, number>;
    quiz: { best: number; attempts: number; lastAt: number | null };
    challenge: { done: boolean; attempts: number; bestMs: number | null; bestScore: number };
    actions: Record<string, true>;                  // centerpiece interactions
    badge: boolean;
  }>;
  counters: { lessonsSeen; quizzesTaken; challengesCleared; perfectQuizzes; actions };
  unlocks: { onboarded: boolean };
  sig: string;                  // HMAC-SHA-256, 64 hex chars
}
```

## Validation

`validateState` is hand-written. It checks every field's type and range (for example `xp` an integer from 0 to 100,000,000, `quiz.best` 0 to 5, days matching `YYYY-MM-DD`), **drops unknown lesson and action ids**, and rebuilds a clean object from whitelisted fields only. Unknown extra properties never survive a load.

## Versioning and migration

`migrate(raw)` upgrades older payloads before validation. Version 0 was the unsigned beta format (`{ xp, streak: number, modules: { id: { progress, lessons: string[] } } }`); it is converted to version 1 with lessons marked "seen", given a fresh salt, signed and re-saved. Unrecognisable input returns `null` and is treated like a missing save. Adding a version means adding a branch to `migrate` and a test.

## Integrity signing

- The signature is **HMAC-SHA-256** over the canonical JSON of the state without `sig` (keys sorted, no whitespace), keyed by `"tsa-ai-portal/state-v1:" + salt`.
- Implementations, in order of preference: **Rust/WebAssembly**, **SubtleCrypto** (secure contexts), **pure TypeScript**. All three produce identical output (`tests/crypto.test.ts`, `tests/kernels.test.ts`).
- Verified on load with a constant-time comparison. A save that fails to parse, validate or verify is **replaced by a fresh state silently**: no alert, no console error shown to the visitor.
- This is **tamper-evidence, not security**. The key is derived from values that ship with the page, so a determined person can re-sign edited data. Its job is to stop casual edits, accidental corruption and copy-paste of someone else's file from silently inflating a score.

## Export and import

- **Export** writes `{ format: "tsa-ai-portal-progress", version: 1, exportedAt, state }` with a freshly computed signature as `parameter-progress-YYYY-MM-DD.json`. The download uses a Blob URL that is revoked after use.
- **Import** accepts the envelope or a bare state, rejects files over 512 KB, runs the same migrate-validate-verify chain, and states the reason on failure ("The signature does not match. The file was edited or is damaged."). A valid import is **re-salted and re-signed** so it becomes this device's own save.
- **Reset** needs a second, explicit confirmation (alert dialog, focus on the confirm button, Escape cancels). It clears the key, creates a new salt and returns every badge to locked.

## Derived data

The dashboard computes everything from the saved state: completion per module, XP history (14 days), streak calendar (12 weeks), mastery heatmap, level and the next-recommended step. The recommendation resumes the last module if unfinished, else the least complete one (next lesson, then centerpiece actions, then the check, then the challenge), else any lesson due for spaced review.
