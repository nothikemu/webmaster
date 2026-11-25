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
  // body and secondary text
  ['graphite', 'bone', 4.5, 'body text on bone'],
  ['graphite', 'bone-hi', 4.5, 'body text on raised bone'],
  ['graphite', 'bone-lo', 4.5, 'body text on quiet bone'],
  ['graphite-2', 'bone', 4.5, 'secondary text on bone'],
  ['graphite-2', 'bone-hi', 4.5, 'secondary text on raised bone'],
  ['graphite-2', 'bone-lo', 4.5, 'secondary text on quiet bone'],
  ['graphite-3', 'bone', 4.5, 'tertiary text on bone'],
  ['graphite-3', 'bone-hi', 4.5, 'tertiary text on raised bone'],
  // the dark plate
  ['on-night', 'night', 4.5, 'text on the dark plate'],
  ['on-night', 'night-2', 4.5, 'text on the raised dark plate'],
  ['on-night-2', 'night', 4.5, 'secondary text on the dark plate'],
  ['on-night-2', 'night-2', 4.5, 'secondary text on the raised dark plate'],
  // buttons and fills that carry text
  ['bone-hi', 'graphite', 4.5, 'primary button label'],
  ['night', 'on-night', 4.5, 'button label on the dark plate'],
  ['night', 'ochre-hi', 4.5, 'primary button hover on the dark plate'],
  ['bone-hi', 'cobalt-lo', 4.5, 'primary button hover label'],
  ['bone-hi', 'cobalt', 4.5, 'selection text'],
  ['graphite', 'ochre', 4.5, 'ink label on ochre'],
  // accent text: each module's own colour, on every surface it appears on
  ['cobalt-lo', 'bone', 4.5, 'Foundations text on bone'],
  ['cobalt-lo', 'bone-hi', 4.5, 'Foundations text on raised bone'],
  ['cobalt-lo', 'bone-lo', 4.5, 'Foundations text on quiet bone'],
  ['cobalt-lo', 'cobalt-wash', 4.5, 'Foundations text on its wash'],
  ['cobalt-hi', 'night', 4.5, 'Foundations text on the dark plate'],
  ['vermilion-lo', 'bone', 4.5, 'Synthesis text on bone'],
  ['vermilion-lo', 'bone-hi', 4.5, 'Synthesis text on raised bone'],
  ['vermilion-lo', 'vermilion-wash', 4.5, 'Synthesis text on its wash'],
  ['vermilion-hi', 'night', 4.5, 'Synthesis text on the dark plate'],
  ['ochre-lo', 'bone', 4.5, 'Ethics text on bone'],
  ['ochre-lo', 'bone-hi', 4.5, 'Ethics text on raised bone'],
  ['ochre-lo', 'ochre-wash', 4.5, 'Ethics text on its wash'],
  ['ochre-hi', 'night', 4.5, 'Ethics text on the dark plate'],
  ['ochre-hi', 'night-2', 4.5, 'Ethics text on the raised dark plate'],
  // text on washes
  ['graphite', 'cobalt-wash', 4.5, 'body text on the cobalt wash'],
  ['graphite', 'vermilion-wash', 4.5, 'body text on the vermilion wash'],
  ['graphite', 'ochre-wash', 4.5, 'body text on the ochre wash'],
  ['graphite-2', 'vermilion-wash', 4.5, 'secondary text on the vermilion wash'],
  // non-text: borders, focus rings, graphics need 3:1 against what they sit on
  ['graphite', 'bone', 3, 'ink border on bone'],
  ['bone-rule', 'bone', 3, 'form-control border on bone'],
  ['bone-rule', 'bone-hi', 3, 'form-control border on raised bone'],
  ['cobalt', 'bone', 3, 'focus ring on bone'],
  ['cobalt', 'bone-hi', 3, 'focus ring on raised bone'],
  ['cobalt', 'bone-lo', 3, 'focus ring on quiet bone'],
  ['on-night', 'night', 3, 'focus ring on the dark plate'],
  ['vermilion', 'bone', 3, 'vermilion graphic on bone'],
  ['vermilion', 'bone-hi', 3, 'vermilion graphic on raised bone'],
  ['cobalt', 'bone-hi', 3, 'cobalt graphic on raised bone'],
  ['ochre-lo', 'bone-hi', 3, 'ochre graphic on raised bone'],
  ['ochre', 'night', 3, 'ochre graphic on the dark plate'],
  ['vermilion-hi', 'night', 3, 'vermilion graphic on the dark plate'],
  ['cobalt-hi', 'night', 3, 'cobalt graphic on the dark plate'],
  ['graphite', 'bone-hi', 3, 'ink line on the plate'],
  // decorative only (not needed to understand anything)
  ['bone-line', 'bone', 1.4, 'hairline divider on bone'],
  ['night-line', 'night', 1.4, 'hairline divider on the dark plate'],
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
