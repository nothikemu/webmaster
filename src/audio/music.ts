/**
 * The soundtrack: a slow, generative score in D minor, synthesized live, so it never repeats exactly.
 * Layers: a low drone, a pad that changes chord every eight beats, a sparse plucked motif with an echo,
 * a soft sea-noise swell, and a very quiet pulse. It is meant to sit under reading, not to be listened to.
 * Original: every note is chosen here, and nothing is sampled.
 */
const BPM = 54;
const BEAT = 60 / BPM;
const STEP = BEAT / 2; // one scheduling step = an eighth note
const LOOKAHEAD = 1.6;

// D minor pentatonic for the plucked voice
const P = { d4: 293.66, f4: 349.23, g4: 392, a4: 440, c5: 523.25, d5: 587.33, a3: 220 };
// Four chords, one per phrase (sixteen steps)
const CHORDS: number[][] = [
  [146.83, 174.61, 220, 261.63, 329.63], // Dm9
  [116.54, 146.83, 174.61, 220], // Bb major 7
  [98, 116.54, 146.83, 174.61, 220], // Gm9
  [110, 164.81, 196, 293.66], // A with a suspended fourth
];
const MOTIF: [number, number][] = [
  [0, P.d4],
  [3, P.f4],
  [6, P.a4],
  [9, P.g4],
];

let ctxRef: AudioContext | null = null;
let timer: number | null = null;
let fade: GainNode | null = null;
let echoIn: GainNode | null = null;
let live: AudioScheduledSourceNode[] = [];
let step = 0;
let nextT = 0;
let notes = 0;

function noiseBuffer(ctx: AudioContext): AudioBuffer {
  const b = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; // brown noise: soft, low, like distant water
    d[i] = last * 3.5;
  }
  return b;
}

function build(ctx: AudioContext, out: AudioNode): void {
  fade = ctx.createGain();
  fade.gain.setValueAtTime(0.0001, ctx.currentTime);
  fade.gain.exponentialRampToValueAtTime(1, ctx.currentTime + 3);
  fade.connect(out);

  // echo: a quiet, dark delay that the plucked notes feed
  echoIn = ctx.createGain();
  const delay = ctx.createDelay(1.5);
  delay.delayTime.value = BEAT * 1.5;
  const fb = ctx.createGain();
  fb.gain.value = 0.36;
  const tone = ctx.createBiquadFilter();
  tone.type = 'lowpass';
  tone.frequency.value = 1700;
  echoIn.connect(delay);
  delay.connect(tone).connect(fb).connect(delay);
  tone.connect(fade);

  // drone: two detuned saws through a slowly breathing low-pass
  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.05;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 240;
  lp.Q.value = 0.7;
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.025;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = 90;
  lfo.connect(lfoGain).connect(lp.frequency);
  for (const [f, det] of [[73.42, -5], [73.42, 6], [110, 2]] as const) {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f;
    o.detune.value = det;
    o.connect(lp);
    o.start();
    live.push(o);
  }
  lp.connect(droneGain).connect(fade);
  lfo.start();
  live.push(lfo);

  // sea: brown noise through a band-pass whose level swells and ebbs
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer(ctx);
  src.loop = true;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 520;
  bp.Q.value = 0.4;
  const sea = ctx.createGain();
  sea.gain.value = 0.045;
  const swell = ctx.createOscillator();
  swell.frequency.value = 0.07;
  const swellGain = ctx.createGain();
  swellGain.gain.value = 0.04;
  swell.connect(swellGain).connect(sea.gain);
  src.connect(bp).connect(sea).connect(fade);
  src.start();
  swell.start();
  live.push(src, swell);
}

function pad(ctx: AudioContext, t: number, chord: number[]): void {
  if (!fade) return;
  for (const f of chord) {
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = f;
    o.detune.value = (Math.random() - 0.5) * 8;
    const g = ctx.createGain();
    const len = BEAT * 8;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.045, t + 2.4);
    g.gain.setValueAtTime(0.045, t + len - 0.8);
    g.gain.exponentialRampToValueAtTime(0.0001, t + len + 3);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    o.connect(lp).connect(g).connect(fade);
    o.start(t);
    o.stop(t + len + 3.1);
    notes++;
  }
}

function pluck(ctx: AudioContext, t: number, f: number, gain: number): void {
  if (!fade || !echoIn) return;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
  const pan = ctx.createStereoPanner();
  pan.pan.value = (Math.random() - 0.5) * 0.6;
  g.connect(pan);
  pan.connect(fade);
  pan.connect(echoIn);
  for (const [mult, amp, type] of [[1, 1, 'sine'], [2, 0.18, 'triangle']] as const) {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = f * mult;
    const og = ctx.createGain();
    og.gain.value = amp;
    o.connect(og).connect(g);
    o.start(t);
    o.stop(t + 1.9);
  }
  notes++;
}

function thump(ctx: AudioContext, t: number): void {
  if (!fade) return;
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(92, t);
  o.frequency.exponentialRampToValueAtTime(44, t + 0.16);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.34);
  o.connect(g).connect(fade);
  o.start(t);
  o.stop(t + 0.4);
}

function tick(ctx: AudioContext, t: number): void {
  if (!fade) return;
  const len = Math.floor(ctx.sampleRate * 0.05);
  const b = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = ctx.createBufferSource();
  s.buffer = b;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 5200;
  const g = ctx.createGain();
  g.gain.value = 0.045;
  s.connect(hp).connect(g).connect(fade);
  s.start(t);
}

function schedule(ctx: AudioContext, t: number, n: number): void {
  const phrase = Math.floor(n / 16);
  const at = n % 16;
  if (at === 0) pad(ctx, t, CHORDS[phrase % CHORDS.length]!);
  // the motif returns every phrase, an octave lower on every fourth, so it is recognisable but not a loop
  for (const [s, f] of MOTIF) if (at === s && Math.random() < 0.82) pluck(ctx, t, phrase % 4 === 3 ? f / 2 : f, 0.075);
  // an occasional stray note from the scale
  if (at % 2 === 1 && Math.random() < 0.07) pluck(ctx, t, [P.d5, P.c5, P.a4, P.g4, P.a3][Math.floor(Math.random() * 5)]!, 0.045);
  if (n % 8 === 0 || n % 8 === 4) thump(ctx, t);
  if ((n % 8 === 3 || n % 8 === 7) && Math.random() < 0.5) tick(ctx, t);
}

export function startMusic(ctx: AudioContext, out: AudioNode): void {
  if (timer !== null) return;
  ctxRef = ctx;
  live = [];
  step = 0;
  build(ctx, out);
  nextT = ctx.currentTime + 0.4;
  const pump = () => {
    if (!ctxRef) return;
    while (nextT < ctxRef.currentTime + LOOKAHEAD) {
      schedule(ctxRef, nextT, step);
      nextT += STEP;
      step += 1;
    }
    document.documentElement.dataset.musicNotes = String(notes);
  };
  pump();
  timer = window.setInterval(pump, 220);
}

export function stopMusic(): void {
  if (timer === null || !ctxRef) return;
  window.clearInterval(timer);
  timer = null;
  const ctx = ctxRef;
  const f = fade;
  const nodes = live;
  if (f) {
    f.gain.cancelScheduledValues(ctx.currentTime);
    f.gain.setTargetAtTime(0.0001, ctx.currentTime, 0.35);
  }
  window.setTimeout(() => {
    for (const n of nodes) {
      try {
        n.stop();
      } catch {
        // already stopped
      }
    }
    f?.disconnect();
  }, 1800);
  fade = null;
  echoIn = null;
  live = [];
  ctxRef = null;
}
