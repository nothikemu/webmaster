/**
 * Room ambience for the game: a quiet bed of synthesized noise per place, plus small occasional sounds.
 * It rides the effects bus, so it follows the Sound switch and the effects volume, and it is silent until sound is switched on.
 */
import { sfxHandles } from './engine';
import type { RoomId } from '@/game/data';

interface Bed {
  type: BiquadFilterType;
  freq: number;
  q: number;
  gain: number;
  /** Slow swell in the gain, in Hz, for sea and wind. */
  swell: number;
  /** Occasional short sounds: interval range in seconds, tone, loudness. */
  blip?: { every: [number, number]; freq: number; len: number; gain: number; type: OscillatorType };
}

const BEDS: Record<RoomId, Bed> = {
  quay: { type: 'lowpass', freq: 520, q: 0.5, gain: 0.16, swell: 0.13, blip: { every: [5, 11], freq: 1500, len: 0.5, gain: 0.025, type: 'sine' } },
  loom: { type: 'bandpass', freq: 900, q: 0.8, gain: 0.04, swell: 0.05, blip: { every: [0.5, 1.3], freq: 260, len: 0.05, gain: 0.05, type: 'square' } },
  foundry: { type: 'lowpass', freq: 220, q: 0.7, gain: 0.2, swell: 0.3, blip: { every: [0.4, 2.2], freq: 2400, len: 0.04, gain: 0.03, type: 'square' } },
  beacon: { type: 'bandpass', freq: 380, q: 0.6, gain: 0.14, swell: 0.09, blip: { every: [8, 16], freq: 330, len: 1.6, gain: 0.035, type: 'sine' } },
  archive: { type: 'lowpass', freq: 160, q: 0.4, gain: 0.07, swell: 0.04, blip: { every: [6, 14], freq: 1800, len: 0.08, gain: 0.02, type: 'triangle' } },
  hall: { type: 'lowpass', freq: 140, q: 0.4, gain: 0.1, swell: 0.06, blip: { every: [9, 18], freq: 196, len: 2.2, gain: 0.03, type: 'sine' } },
  office: { type: 'bandpass', freq: 600, q: 0.5, gain: 0.03, swell: 0.04, blip: { every: [1, 1], freq: 1000, len: 0.03, gain: 0.04, type: 'square' } },
};

let noise: AudioBuffer | null = null;
let live: { nodes: AudioNode[]; timer: number | null; src: AudioBufferSourceNode } | null = null;
let current: RoomId | null = null;

function noiseBuf(ctx: AudioContext): AudioBuffer {
  if (noise && noise.sampleRate === ctx.sampleRate) return noise;
  const b = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    last = (last + 0.04 * (Math.random() * 2 - 1)) / 1.04;
    d[i] = last * 4;
  }
  noise = b;
  return b;
}

export function stopAmbience(): void {
  if (!live) return;
  if (live.timer !== null) window.clearTimeout(live.timer);
  try {
    live.src.stop();
  } catch {
    // already stopped
  }
  live.nodes.forEach((n) => n.disconnect());
  live = null;
}

/** Start the bed for a place. Does nothing if sound is off; call again when it is switched on. */
export function setAmbience(room: RoomId | null): void {
  current = room;
  stopAmbience();
  if (!room) return;
  const h = sfxHandles();
  if (!h) return;
  const { ctx, sfx } = h;
  const bed = BEDS[room];
  const src = ctx.createBufferSource();
  src.buffer = noiseBuf(ctx);
  src.loop = true;
  const filter = ctx.createBiquadFilter();
  filter.type = bed.type;
  filter.frequency.value = bed.freq;
  filter.Q.value = bed.q;
  const g = ctx.createGain();
  g.gain.value = 0.0001;
  g.gain.setTargetAtTime(bed.gain, ctx.currentTime, 0.8);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = bed.swell;
  const lfoGain = ctx.createGain();
  lfoGain.gain.value = bed.gain * 0.5;
  lfo.connect(lfoGain).connect(g.gain);
  lfo.start();
  src.connect(filter).connect(g).connect(sfx);
  src.start();
  const nodes: AudioNode[] = [filter, g, lfo, lfoGain];
  live = { nodes, timer: null, src };

  const b = bed.blip;
  if (b) {
    const tick = () => {
      if (!live || current !== room) return;
      const t0 = ctx.currentTime;
      const o = ctx.createOscillator();
      o.type = b.type;
      o.frequency.value = b.freq * (0.9 + Math.random() * 0.2);
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.0001, t0);
      og.gain.exponentialRampToValueAtTime(b.gain, t0 + 0.01);
      og.gain.exponentialRampToValueAtTime(0.0001, t0 + b.len);
      o.connect(og).connect(sfx);
      o.start(t0);
      o.stop(t0 + b.len + 0.05);
      const wait = b.every[0] + Math.random() * (b.every[1] - b.every[0]);
      live.timer = window.setTimeout(tick, wait * 1000);
    };
    live.timer = window.setTimeout(tick, 800);
  }
}

export const ambienceRoom = (): RoomId | null => current;
