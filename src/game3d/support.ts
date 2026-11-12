/** Is 3D available, and which version does the player want? Kept free of three.js so the 2D game does not download it. */
import { useCallback, useState } from 'react';

export type GfxMode = '3d' | '2d';
export type QualityPref = 'auto' | 'high' | 'medium' | 'low';
export interface GfxPref {
  mode: GfxMode;
  quality: QualityPref;
}

const KEY = 'tideweight/gfx';

export function webglSupported(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

/** The saved choice, overridden by ?gfx=2d and ?q=low in the address (for testing), and by what the device can do. */
export function readGfx(): GfxPref {
  let saved: Partial<GfxPref> = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Partial<GfxPref>;
  } catch {
    saved = {};
  }
  const q = new URLSearchParams(window.location.search);
  const modeParam = q.get('gfx');
  const qualParam = q.get('q');
  let mode: GfxMode = saved.mode === '2d' ? '2d' : '3d';
  if (modeParam === '2d' || modeParam === '3d') mode = modeParam;
  if (mode === '3d' && !webglSupported()) mode = '2d';
  const quality: QualityPref = qualParam === 'high' || qualParam === 'medium' || qualParam === 'low' ? qualParam : saved.quality === 'high' || saved.quality === 'medium' || saved.quality === 'low' ? saved.quality : 'auto';
  return { mode, quality };
}

export function useGfx(): [GfxPref, (patch: Partial<GfxPref>) => void] {
  const [pref, setPref] = useState<GfxPref>(readGfx);
  const update = useCallback((patch: Partial<GfxPref>) => {
    setPref((p) => {
      const next = { ...p, ...patch };
      try {
        window.localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        // a browser that will not store it still plays
      }
      return next;
    });
  }, []);
  return [pref, update];
}
