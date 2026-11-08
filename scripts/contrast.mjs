// Checks every foreground/background pair the design uses against WCAG 2.2 AA.
// Reads the colours straight from src/styles/tokens.css so the check can never drift from the CSS.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/styles/tokens.css'), 'utf8');
const color = {};
for (const m of css.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)) color[m[1]] = m[2];

const lum = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(color[a]), lum(color[b])].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// [foreground, background, minimum, what it is]
const pairs = [
  ['text', 'paper', 4.5, 'body text on paper'],
  ['text', 'paper-hi', 4.5, 'body text on raised paper'],
  ['text', 'paper-lo', 4.5, 'body text on shaded paper'],
  ['text-2', 'paper', 4.5, 'secondary text on paper'],
  ['text-2', 'paper-lo', 4.5, 'secondary text on shaded paper'],
  ['text-ink', 'ink', 4.5, 'body text on ink'],
  ['text-ink', 'ink-2', 4.5, 'body text on raised ink'],
  ['text-ink', 'ink-3', 4.5, 'body text on key ink'],
  ['text-ink-2', 'ink', 4.5, 'secondary text on ink'],
  ['text-ink-2', 'ink-2', 4.5, 'secondary text on raised ink'],
  ['paper-hi', 'seal', 4.5, 'primary button label'],
  ['ink', 'paper-hi', 4.5, 'secondary button label'],
  ['seal-lo', 'paper', 4.5, 'red text on paper'],
  ['seal-lo', 'paper-hi', 4.5, 'red text on raised paper'],
  ['seal-hi', 'ink', 4.5, 'red text on ink'],
  ['seal-hi', 'ink-2', 4.5, 'red text on raised ink'],
  ['indigo-lo', 'paper', 4.5, 'path 1 text on paper'],
  ['indigo-hi', 'ink', 4.5, 'path 1 text on ink'],
  ['indigo-hi', 'ink-2', 4.5, 'path 1 text on raised ink'],
  ['paper-hi', 'indigo', 4.5, 'label on path 1 fill'],
  ['teal-lo', 'paper', 4.5, 'path 2 text on paper'],
  ['teal-hi', 'ink', 4.5, 'path 2 text on ink'],
  ['teal-hi', 'ink-2', 4.5, 'path 2 text on raised ink'],
  ['paper-hi', 'teal-lo', 4.5, 'light label on dark path 2 fill'],
  ['ochre-lo', 'paper', 4.5, 'path 3 text on paper'],
  ['ochre-hi', 'ink', 4.5, 'path 3 text on ink'],
  ['ochre-hi', 'ink-2', 4.5, 'path 3 text on raised ink'],
  ['ink', 'ochre', 4.5, 'ink label on path 3 fill'],
  ['good', 'paper', 4.5, 'success text on paper'],
  ['good-hi', 'ink', 4.5, 'success text on ink'],
  ['bad', 'paper', 4.5, 'error text on paper'],
  ['bad-hi', 'ink', 4.5, 'error text on ink'],
  // Non-text UI: borders and focus rings need 3:1 against what they sit on.
  ['ink', 'paper', 3, 'ink border/focus ring on paper'],
  ['paper-hi', 'ink', 3, 'paper focus ring on ink'],
  ['paper-line', 'paper', 1.8, 'decorative divider on paper (not required for meaning)'],
];

let failed = 0;
for (const [fg, bg, min, what] of pairs) {
  if (!color[fg] || !color[bg]) {
    console.log(`MISSING  ${fg} on ${bg}`);
    failed++;
    continue;
  }
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failed++;
  console.log(`${ok ? 'pass' : 'FAIL'}  ${r.toFixed(2).padStart(5)}:1  (need ${min})  ${what}  [${fg} ${color[fg]} on ${bg} ${color[bg]}]`);
}
console.log(failed ? `\n${failed} pair(s) failed` : '\nAll pairs pass WCAG 2.2 AA');
process.exit(failed ? 1 : 0);
