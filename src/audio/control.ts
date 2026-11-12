import { dispatch, getState } from '@/engine/store';
import type { Settings } from '@/engine/progress';
import { configureAudio } from './engine';
import { play, type Sfx } from './sfx';

/** Change audio settings from a click: save them, apply them to the audio graph at once, and optionally play a cue. */
export function setAudio(patch: Partial<Settings>, cue?: Sfx): void {
  dispatch({ type: 'settings', patch });
  configureAudio(getState().settings);
  if (cue) play(cue);
}
