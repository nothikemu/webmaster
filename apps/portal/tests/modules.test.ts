import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createActor } from 'xstate';
import { MODULES } from '../src/content';
import { applyEvent, type Effect, type GameEvent } from '../src/core/gamification';
import { createRootMachine } from '../src/core/machines/root';
import { createInitialState, type PersistedState } from '../src/core/schema';
import { buildIcosphere } from '../src/modules/ModuleC/icosphere';
import { DEFAULT_PARAMS, PRESETS, buildPrompt, checkRanges, type Params } from '../src/modules/ModuleB/params';
import { TOKENS, simulateOutput } from '../src/modules/ModuleB/simulate';

const SRC = resolve(__dirname, '..', 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe('icosphere', () => {
  it('level 5 has 10,242 vertices and 30,720 unique edges, all on the unit sphere', () => {
    const ico = buildIcosphere(5);
    expect(ico.vertexCount).toBe(10242);
    expect(ico.edges.length / 2).toBe(30720);
    for (let i = 0; i < ico.vertexCount; i += 97) {
      expect(Math.hypot(ico.positions[i * 3]!, ico.positions[i * 3 + 1]!, ico.positions[i * 3 + 2]!)).toBeCloseTo(1, 5);
    }
  });
});

describe('Module B simulation', () => {
  it('is deterministic and the probabilities sum to one', () => {
    const a = simulateOutput(DEFAULT_PARAMS);
    const b = simulateOutput({ ...DEFAULT_PARAMS });
    expect(a).toEqual(b);
    expect(a.probs.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 6);
    expect(a.probs).toHaveLength(TOKENS.length);
  });

  it('higher temperature spreads probability; stricter, more specific prompts stay on task', () => {
    const base: Params = { temperature: 20, specificity: 50, context: 50, strictness: 50 };
    expect(simulateOutput({ ...base, temperature: 100 }).diversity).toBeGreaterThan(simulateOutput(base).diversity);
    expect(simulateOutput({ ...base, specificity: 95, strictness: 95 }).adherence).toBeGreaterThan(simulateOutput({ ...base, specificity: 5, strictness: 5 }).adherence);
    expect(simulateOutput({ ...base, context: 100 }).risk).toBeLessThan(simulateOutput({ ...base, context: 0 }).risk);
  });

  it('presets snap to curated values and shape the prompt template', () => {
    const fewshot = PRESETS.find((p) => p.id === 'fewshot')!;
    const parts = buildPrompt(fewshot.values, 'fewshot');
    expect(parts.find((p) => p.id === 'examples')!.active).toBe(true);
    const constraint = PRESETS.find((p) => p.id === 'constraint')!;
    expect(buildPrompt(constraint.values, 'constraint').find((p) => p.id === 'constraints')!.lines.length).toBeGreaterThanOrEqual(4);
    expect(buildPrompt(DEFAULT_PARAMS, null).find((p) => p.id === 'role')!.active).toBe(false);
  });

  it('every challenge scenario is solvable and its range check is exact at the edges', () => {
    const c = MODULES.find((m) => m.id === 'synthesis')!.challenge;
    expect(c.kind).toBe('tuning');
    if (c.kind !== 'tuning') return;
    for (const s of c.scenarios) {
      const mid: Params = {
        temperature: Math.round((s.ranges.temperature[0] + s.ranges.temperature[1]) / 2),
        specificity: Math.round((s.ranges.specificity[0] + s.ranges.specificity[1]) / 2),
        context: Math.round((s.ranges.context[0] + s.ranges.context[1]) / 2),
        strictness: Math.round((s.ranges.strictness[0] + s.ranges.strictness[1]) / 2),
      };
      expect(checkRanges(mid, s.ranges)).toHaveLength(0);
      // One step past an edge that the real slider can reach must be flagged.
      const reachable = s.ranges.temperature[1] < 100 ? s.ranges.temperature[1] + 1 : s.ranges.temperature[0] - 1;
      expect(checkRanges({ ...mid, temperature: reachable }, s.ranges)).toHaveLength(1);
    }
  });
});

describe('content integrity', () => {
  it('every module has 4 to 6 lessons, a 5-question check, and answers inside range', () => {
    for (const m of MODULES) {
      expect(m.lessons.length).toBeGreaterThanOrEqual(4);
      expect(m.lessons.length).toBeLessThanOrEqual(6);
      expect(m.quiz).toHaveLength(5);
      const ids = new Set(m.lessons.map((l) => l.id));
      for (const q of m.quiz) {
        expect(ids.has(q.lesson)).toBe(true);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(q.options.length);
      }
      for (const l of m.lessons) {
        expect(l.check.answer).toBeLessThan(l.check.options.length);
        expect(l.body.join(' ').length).toBeGreaterThan(300);
      }
      if (m.challenge.kind === 'choice') {
        for (const item of m.challenge.items) expect(item.answer).toBeLessThan(m.challenge.options.length);
        expect(m.challenge.passMark).toBeLessThanOrEqual(m.challenge.items.length);
      }
    }
  });

  it('avoids the banned marketing phrases', () => {
    const banned = ['unlock the power', 'supercharge', 'elevate your', 'seamlessly', 'cutting-edge', 'revolutionize', 'next-generation', 'dive in', 'journey', 'harness', 'leverage', "in today's world"];
    const files = walk(SRC).filter((f) => /\.(ts|tsx|json)$/.test(f) && !f.includes('/wasm/'));
    for (const f of files) {
      const text = readFileSync(f, 'utf8').toLowerCase();
      for (const phrase of banned) expect(text.includes(phrase), `${phrase} in ${f}`).toBe(false);
    }
  });
});

describe('UI string table', () => {
  const strings = JSON.parse(readFileSync(join(SRC, 'assets', 'strings.json'), 'utf8')) as Record<string, string>;
  const used = new Set<string>();
  for (const f of walk(SRC).filter((x) => /\.tsx?$/.test(x))) {
    const text = readFileSync(f, 'utf8');
    for (const m of text.matchAll(/\bt\('([a-zA-Z0-9_.]+)'/g)) used.add(m[1]!);
  }
  for (const s of ['unseen', 'seen', 'practiced', 'mastered']) used.add(`mastery.${s}`);

  it('has every key the components ask for', () => {
    const missing = [...used].filter((k) => !(k in strings));
    expect(missing).toEqual([]);
  });

  it('has no unused keys', () => {
    const extra = Object.keys(strings).filter((k) => !used.has(k));
    expect(extra).toEqual([]);
  });

  it('interpolation placeholders are all lowercase words', () => {
    for (const v of Object.values(strings)) for (const m of v.matchAll(/\{(\w+)\}/g)) expect(m[1]).toMatch(/^[a-z]+$/);
  });
});

describe('root machine', () => {
  function setup() {
    let state: PersistedState = createInitialState(Date.now(), '00000000000000000000000000000000');
    let resets = 0;
    const effectLog: Effect[][] = [];
    const actor = createActor(
      createRootMachine({
        apply: (e: GameEvent) => {
          const r = applyEvent(state, e, Date.now());
          state = r.state;
          effectLog.push(r.effects);
          return r.effects;
        },
        reset: async () => {
          resets++;
        },
        now: () => Date.now(),
      }),
    ).start();
    return { actor, effectLog, get resets() { return resets; }, get state() { return state; } };
  }

  it('routes game events through the reducer and announces effects on the hub', () => {
    const h = setup();
    h.actor.send({ type: 'GAME_EVENT', event: { type: 'LESSON_CHECKED', module: 'foundations', lesson: 'a1', correct: true, firstTry: true } });
    expect(h.state.xp).toBe(50);
    expect(h.actor.getSnapshot().context.hub.getSnapshot().context.announcement).toMatch(/50 XP/);
  });

  it('requires a second step to reset, and cancel leaves progress alone', () => {
    const h = setup();
    h.actor.send({ type: 'RESET_REQUEST' });
    h.actor.send({ type: 'RESET_CANCEL' });
    expect(h.resets).toBe(0);
    h.actor.send({ type: 'RESET_REQUEST' });
    h.actor.send({ type: 'RESET_CONFIRM' });
    expect(h.resets).toBe(1);
  });

  it('a badge effect starts the unlock burst and BURST_DONE finishes it', () => {
    const h = setup();
    const badge = h.actor.getSnapshot().context.badges.foundations;
    const bursts: string[] = [];
    badge.on('burst', (e) => bursts.push(e.module));
    const m = MODULES[0]!;
    const events: GameEvent[] = [
      ...m.lessons.map((l) => ({ type: 'LESSON_CHECKED', module: m.id, lesson: l.id, correct: true, firstTry: true }) as GameEvent),
      ...m.requiredActions.map((a) => ({ type: 'ACTION', module: m.id, action: a.id }) as GameEvent),
    ];
    for (const e of events) h.actor.send({ type: 'GAME_EVENT', event: e });
    h.actor.send({ type: 'GAME_EVENT', event: { type: 'QUIZ_SUBMITTED', module: m.id, score: 5, correctLessons: [] } });
    // The guard rejects a challenge submitted right after a quiz (double-click protection), so wait it out.
    return new Promise<void>((done) =>
      setTimeout(() => {
        h.actor.send({ type: 'GAME_EVENT', event: { type: 'CHALLENGE_FINISHED', module: m.id, score: m.challenge.passMark, elapsedMs: 9000, timed: true } });
        expect(badge.getSnapshot().value).toBe('unlocking');
        expect(bursts).toEqual(['foundations']);
        h.actor.send({ type: 'BADGE_DONE', module: 'foundations' });
        expect(badge.getSnapshot().value).toBe('unlocked');
        done();
      }, 450),
    );
  });

  it('the hub toggles and closes', () => {
    const h = setup();
    const hub = h.actor.getSnapshot().context.hub;
    expect(hub.getSnapshot().value).toBe('collapsed');
    h.actor.send({ type: 'HUB', event: { type: 'TOGGLE' } });
    expect(hub.getSnapshot().value).toBe('expanded');
    h.actor.send({ type: 'HUB', event: { type: 'CLOSE' } });
    expect(hub.getSnapshot().value).toBe('collapsed');
  });

  it('module lifecycle: mount, ready, interact, fail', () => {
    const h = setup();
    const mod = h.actor.getSnapshot().context.modules.synthesis;
    h.actor.send({ type: 'MODULE', module: 'synthesis', event: { type: 'MOUNT' } });
    expect(mod.getSnapshot().value).toBe('loading');
    h.actor.send({ type: 'MODULE', module: 'synthesis', event: { type: 'READY', tier: 'canvas2d' } });
    expect(mod.getSnapshot().value).toBe('ready');
    h.actor.send({ type: 'MODULE', module: 'synthesis', event: { type: 'INTERACT' } });
    expect(mod.getSnapshot().value).toBe('interacting');
    h.actor.send({ type: 'MODULE', module: 'synthesis', event: { type: 'FAIL', reason: 'x' } });
    expect(mod.getSnapshot().value).toBe('interacting');
  });
});
