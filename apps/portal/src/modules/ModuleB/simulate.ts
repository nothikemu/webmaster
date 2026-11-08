import { temperatureValue, type Params } from './params';

/**
 * Deterministic model of how prompt settings change sampling. No model is called anywhere: the
 * same parameters always give the same numbers. The interface labels it as a simulation.
 */
export const TOKENS = ['The', 'Root', 'Impact', 'Timeline', 'Overall', 'So', 'Basically', 'Honestly'] as const;
const FORMAL = [true, true, true, true, true, false, false, false] as const;
const BASE_LOGITS = [1.9, 1.1, 1.2, 1.0, 1.3, 1.1, 0.9, 0.7] as const;
const CONTEXT_BOOST = [0, 1.0, 1.1, 0.9, 0.2, 0, 0, 0] as const;

export interface OutputSim {
  probs: number[];
  /** 0-1: how evenly probability is spread (normalised entropy). */
  diversity: number;
  /** 0-1: probability mass on the formal, on-task tokens. */
  adherence: number;
  /** 0-1: how likely the output is to wander from the source. */
  risk: number;
  /** Noise-field settings derived from the same parameters. */
  field: { scale: number; speed: number; octaves: number; contrast: number };
}

const clamp01 = (v: number): number => Math.max(0, Math.min(1, v));

export function simulateOutput(p: Params): OutputSim {
  const spec = p.specificity / 100;
  const ctx = p.context / 100;
  const strict = p.strictness / 100;
  const temp = Math.max(0.05, temperatureValue(p));

  const logits = BASE_LOGITS.map((base, i) => {
    const formal = FORMAL[i]! ? 1 : -1;
    return base + formal * (spec * 1.4 + strict * 1.6) + CONTEXT_BOOST[i]! * ctx * 1.3;
  });
  const scaled = logits.map((l) => l / temp);
  const max = Math.max(...scaled);
  const exps = scaled.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e) => e / sum);

  const entropy = -probs.reduce((a, q) => a + (q > 0 ? q * Math.log(q) : 0), 0);
  const diversity = clamp01(entropy / Math.log(probs.length));
  const adherence = clamp01(probs.reduce((a, q, i) => a + (FORMAL[i]! ? q : 0), 0));
  const risk = clamp01((temp / 1.5) * 0.6 + (1 - ctx) * 0.4);

  return {
    probs,
    diversity,
    adherence,
    risk,
    field: {
      scale: 2 + (1 - spec) * 6,
      speed: 0.15 + (temp / 1.5) * 0.85,
      octaves: 2 + Math.round((1 - strict) * 3),
      contrast: 0.55 + adherence * 0.45,
    },
  };
}
