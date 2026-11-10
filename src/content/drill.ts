import type { GlossaryEntry, Question } from './types';
import { rng } from '@/widgets/logic/random';

/** Hide a term inside its own definition, so the definition cannot give its answer away. */
export function maskTerm(entry: GlossaryEntry): string {
  const bare = entry.term.replace(/\s*\(.*\)\s*$/, '');
  const escaped = bare.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return entry.definition.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), 'this');
}

function shuffled<T>(items: readonly T[], next: () => number): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/**
 * Build a codex drill: each question shows a definition and asks for the term.
 * The three wrong options come from the same path when possible, so the choice is between ideas that are easy to confuse.
 * Seeded, so a given seed always builds the same drill (which makes it testable).
 */
export function buildDrill(glossary: readonly GlossaryEntry[], seed: number, count = 10): Question[] {
  const next = rng(seed);
  const picked = shuffled(glossary, next).slice(0, Math.min(count, glossary.length));
  return picked.map((entry) => {
    const samePath = shuffled(glossary.filter((g) => g.id !== entry.id && g.path === entry.path), next);
    const others = shuffled(glossary.filter((g) => g.id !== entry.id && g.path !== entry.path), next);
    const wrong = [...samePath, ...others].slice(0, 3);
    const options = shuffled([entry, ...wrong], next);
    return {
      kind: 'single',
      prompt: `Which term fits this definition? "${maskTerm(entry)}"`,
      options: options.map((o) => o.term),
      answer: options.findIndex((o) => o.id === entry.id),
      explain: `${entry.term}: ${entry.definition}`,
    } satisfies Question;
  });
}
