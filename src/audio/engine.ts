/**
 * The shared Web Audio graph: one context, a master volume, and two buses (effects and music).
 * Everything is synthesized live. There are no audio files and nothing is fetched.
 *
 * Rules:
 *  - Silent by default. The context is only created once the player has switched sound or music on.
 *  - If the preference was saved from an earlier visit, the context starts suspended and wakes on the first
 *    tap, click or key press, because browsers do not allow sound before a deliberate action.
 *  - Nothing in the portal depends on sound, and every sound is paired with something visible.
 */
import { startMusic, stopMusic } from './music';

export interface AudioPrefs {
  /** Interface sounds on or off. */
  sound: boolean;
  /** Background music on or off. */
  music: boolean;
  /** Master volume, 0 to 1. */
  volume: number;
  sfxVolume: number;
  musicVolume: number;
}

export interface AudioHandles {
  ctx: AudioContext;
  sfx: GainNode;
  music: GainNode;
}

const clamp = (v: number) => Math.min(1, Math.max(0, Number.isFinite(v) ? v : 0));

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let analyser: AnalyserNode | null = null;
let peakTimer: number | null = null;
let woke = false;
let prefs: AudioPrefs = { sound: false, music: false, volume: 0.6, sfxVolume: 0.8, musicVolume: 0.5 };

const mark = (key: string, value: string) => {
  if (typeof document !== 'undefined') document.documentElement.dataset[key] = value;
};

function ensure(): AudioHandles | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    sfxBus = ctx.createGain();
    musicBus = ctx.createGain();
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    sfxBus.connect(master);
    musicBus.connect(master);
    master.connect(analyser);
    analyser.connect(ctx.destination);
    ctx.onstatechange = () => mark('audio', ctx?.state ?? 'none');
    mark('audio', ctx.state);
  }
  if (!woke) {
    woke = true;
    const wake = () => {
      if (ctx && ctx.state === 'suspended') void ctx.resume();
    };
    window.addEventListener('pointerdown', wake, { passive: true });
    window.addEventListener('keydown', wake, { passive: true });
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return { ctx, sfx: sfxBus!, music: musicBus! };
}

function applyGains(): void {
  if (!ctx || !master || !sfxBus || !musicBus) return;
  const t = ctx.currentTime;
  master.gain.setTargetAtTime(prefs.volume * 0.7, t, 0.06);
  sfxBus.gain.setTargetAtTime(prefs.sound ? prefs.sfxVolume : 0, t, 0.06);
  musicBus.gain.setTargetAtTime(prefs.music ? prefs.musicVolume * 0.8 : 0, t, 0.25);
}

/** Apply the player's audio settings. Safe to call on every change. */
export function configureAudio(next: AudioPrefs): void {
  prefs = { sound: next.sound, music: next.music, volume: clamp(next.volume), sfxVolume: clamp(next.sfxVolume), musicVolume: clamp(next.musicVolume) };
  if (!prefs.sound && !prefs.music) {
    applyGains();
    stopMusic();
    if (peakTimer !== null) {
      window.clearInterval(peakTimer);
      peakTimer = null;
    }
    return;
  }
  const h = ensure();
  if (!h) return;
  applyGains();
  if (prefs.music) {
    startMusic(h.ctx, h.music);
    if (peakTimer === null && analyser) {
      const buf = new Float32Array(analyser.fftSize);
      peakTimer = window.setInterval(() => {
        analyser!.getFloatTimeDomainData(buf);
        let p = 0;
        for (const v of buf) p = Math.max(p, Math.abs(v));
        mark('audioPeak', p.toFixed(3));
      }, 500);
    }
  } else {
    stopMusic();
  }
}

export const sfxEnabled = (): boolean => prefs.sound;

/** The nodes interface sounds connect to, or null while sound is off. */
export function sfxHandles(): AudioHandles | null {
  return prefs.sound ? ensure() : null;
}
