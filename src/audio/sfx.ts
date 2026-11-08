/**
 * Original interface sounds, synthesized live with the Web Audio API. No audio files, nothing copied.
 *
 * Rules:
 *  - Off by default. The player turns it on with the sound button, which also satisfies browser autoplay rules,
 *    because the AudioContext is only created after that click.
 *  - Short, soft and optional. Nothing in the portal depends on sound, and every sound is paired with a visible change.
 *  - The voice: a wooden, plucked, bell-like palette (pentatonic), to suit the harbor world.
 */
export type Sfx = 'tick' | 'press' | 'right' | 'wrong' | 'xp' | 'lesson' | 'badge' | 'level';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = false;
let volume = 0.6;

export function configureSound(on: boolean, vol: number): void {
  enabled = on;
  volume = Math.min(1, Math.max(0, vol));
  if (on) ensure();
  if (master) master.gain.value = volume * 0.5;
}

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = volume * 0.5;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** A plucked, bell-ish note: sine body plus a quiet octave, fast attack, exponential decay. */
function note(freq: number, start: number, dur: number, gain = 0.5, type: OscillatorType = 'sine') {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime + start;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  g.connect(master);
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
  if (!enabled) return;
  if (!ensure()) return;
  switch (name) {
    case 'tick':
      note(N.a5, 0, 0.06, 0.12, 'triangle');
      break;
    case 'press':
      note(N.d5, 0, 0.09, 0.2, 'triangle');
      break;
    case 'right':
      note(N.d5, 0, 0.22, 0.35);
      note(N.a5, 0.09, 0.3, 0.35);
      break;
    case 'wrong':
      note(N.d4, 0, 0.26, 0.3, 'triangle');
      note(N.d4 * 0.944, 0.1, 0.3, 0.25, 'triangle');
      break;
    case 'xp':
      note(N.fs5, 0, 0.14, 0.25);
      note(N.b5, 0.07, 0.2, 0.25);
      break;
    case 'lesson':
      [N.d5, N.fs5, N.a5, N.d6].forEach((f, i) => note(f, i * 0.1, 0.4, 0.38));
      break;
    case 'badge':
      [N.d5, N.a5, N.b5, N.d6].forEach((f, i) => note(f, i * 0.12, 0.6, 0.4));
      note(N.d4, 0, 0.9, 0.3);
      break;
    case 'level':
      [N.d5, N.e5, N.fs5, N.a5, N.b5, N.d6].forEach((f, i) => note(f, i * 0.085, 0.5, 0.36));
      break;
  }
}
