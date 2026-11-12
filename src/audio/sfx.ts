/**
 * Original interface sounds, synthesized live with the Web Audio API. No audio files, nothing copied.
 *
 * Rules:
 *  - Off by default. They play only after the player has switched sound on (see engine.ts).
 *  - Short, soft and optional. Nothing in the portal depends on sound, and every sound is paired with a visible change.
 *  - The voice: a wooden, plucked, bell-like palette (pentatonic), to suit the harbor world. No chirps, no coins.
 */
import { sfxHandles } from './engine';

export type Sfx = 'tick' | 'press' | 'nav' | 'select' | 'right' | 'wrong' | 'xp' | 'lesson' | 'badge' | 'mission' | 'level';

/** A plucked, bell-ish note: sine body plus a quiet octave, fast attack, exponential decay. */
function note(h: { ctx: AudioContext; sfx: GainNode }, freq: number, start: number, dur: number, gain = 0.5, type: OscillatorType = 'sine') {
  const { ctx, sfx } = h;
  const t0 = ctx.currentTime + start;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(sfx);
  for (const [mult, amp] of [[1, 1], [2, 0.25]] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq * mult, t0);
    const og = ctx.createGain();
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t0);
    o.stop(t0 + dur + 0.05);
  }
}

// D major pentatonic: D5 E5 F#5 A5 B5 D6
const N = { d5: 587.33, e5: 659.25, fs5: 739.99, a5: 880, b5: 987.77, d6: 1174.66, d4: 293.66, a4: 440 };

export function play(name: Sfx): void {
  const h = sfxHandles();
  if (!h) return;
  const n = (f: number, start: number, dur: number, gain?: number, type?: OscillatorType) => note(h, f, start, dur, gain, type);
  switch (name) {
    case 'tick':
      n(N.a5, 0, 0.06, 0.12, 'triangle');
      break;
    case 'press':
      n(N.d5, 0, 0.09, 0.2, 'triangle');
      break;
    case 'nav':
      n(N.d4, 0, 0.12, 0.14, 'triangle');
      n(N.a4, 0.05, 0.14, 0.1, 'triangle');
      break;
    case 'select':
      n(N.a4, 0, 0.1, 0.2, 'triangle');
      n(N.d5, 0.06, 0.16, 0.18);
      break;
    case 'right':
      n(N.d5, 0, 0.22, 0.35);
      n(N.a5, 0.09, 0.3, 0.35);
      break;
    case 'wrong':
      n(N.d4, 0, 0.26, 0.3, 'triangle');
      n(N.d4 * 0.944, 0.1, 0.3, 0.25, 'triangle');
      break;
    case 'xp':
      n(N.fs5, 0, 0.14, 0.25);
      n(N.b5, 0.07, 0.2, 0.25);
      break;
    case 'lesson':
      [N.d5, N.fs5, N.a5, N.d6].forEach((f, i) => n(f, i * 0.1, 0.4, 0.38));
      break;
    case 'badge':
      [N.d5, N.a5, N.b5, N.d6].forEach((f, i) => n(f, i * 0.12, 0.6, 0.4));
      n(N.d4, 0, 0.9, 0.3);
      break;
    case 'mission':
      [N.d4, N.a4, N.d5, N.fs5].forEach((f, i) => n(f, i * 0.1, 0.8, 0.34));
      n(N.d4 / 2, 0, 1.1, 0.26, 'triangle');
      break;
    case 'level':
      [N.d5, N.e5, N.fs5, N.a5, N.b5, N.d6].forEach((f, i) => n(f, i * 0.085, 0.5, 0.36));
      break;
  }
}
