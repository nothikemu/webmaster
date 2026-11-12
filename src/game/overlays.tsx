/** Everything that opens over the stage: dialogues, the relic card, the station wrapper, journal, map, pause and help. */
import { useCallback, useEffect, useId, useRef, useState, type ComponentType, type ReactNode } from 'react';
import { Icon } from '@/art/Icons';
import { play } from '@/audio/sfx';
import { setAudio } from '@/audio/control';
import { dispatch, resetAll, useProgress } from '@/engine/store';
import { gameProgress, isUnlocked, levelInfo, nextGoal, roundsCleared, stationDone, type PortalState } from '@/engine/progress';
import { Btn, Callout, LinkBtn, Meter } from '@/ui/primitives';
import { webglSupported, type GfxPref } from '@/game3d/support';
import { GAME_XP, LOCATIONS, RELICS, STATIONS, locationById, stationById, stationsIn, type Relic, type RoomId, type StationId } from './data';
import { Cabinet } from './stations/Cabinet';
import { Frame } from './stations/Frame';
import { Anvil } from './stations/Anvil';
import { Weld } from './stations/Weld';
import { Audit } from './stations/Audit';
import { Timeline } from './stations/Timeline';
import type { StationProps } from './stations/types';

/** A modal that uses the browser's own <dialog>: it traps focus, closes on Escape and makes the rest of the page inert. */
export function GameDialog({ title, onClose, children, wide, paper, className = '' }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean; paper?: boolean; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const d = ref.current!;
    const handler = () => closeRef.current();
    d.addEventListener('close', handler);
    if (!d.open) d.showModal();
    return () => {
      d.removeEventListener('close', handler);
      if (d.open) d.close();
    };
  }, []);
  return (
    <dialog ref={ref} className={`gdialog${wide ? ' gdialog--wide' : ''} ${className}`} aria-labelledby={id}>
      <div className={`gdialog__box${paper ? ' gdialog__box--paper' : ''}`} data-surface={paper ? undefined : 'ink'}>
        <header className="gdialog__head">
          <h2 id={id}>{title}</h2>
          <Btn variant="quiet" small icon="x" aria-label="Close" onClick={() => ref.current?.close()} />
        </header>
        <div className="gdialog__body">{children}</div>
      </div>
    </dialog>
  );
}

// ---------------------------------------------------------------------------------------------- dialogue
export interface Talk {
  who: string;
  lines: string[];
  links?: { label: string; to: string }[];
  action?: { label: string; run: () => void };
}

export function TalkDialog({ talk, onClose }: { talk: Talk; onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = i >= talk.lines.length - 1;
  return (
    <GameDialog title={talk.who} onClose={onClose} className="gdialog--talk">
      <p className="talk__line" aria-live="polite">{talk.lines[i]}</p>
      <div className="row">
        {!last ? (
          <Btn variant="primary" go onClick={() => { play('tick'); setI(i + 1); }}>Next ({i + 1} of {talk.lines.length})</Btn>
        ) : (
          <>
            {talk.action ? <Btn variant="primary" go onClick={() => { talk.action!.run(); }}>{talk.action.label}</Btn> : null}
            {talk.links?.map((l) => <LinkBtn key={l.to} to={l.to} variant="secondary" go>{l.label}</LinkBtn>)}
            <Btn variant={talk.action ? 'quiet' : 'primary'} onClick={onClose}>Done</Btn>
          </>
        )}
      </div>
    </GameDialog>
  );
}

// ---------------------------------------------------------------------------------------------- relic
export function RelicCard({ relic, fresh, onClose }: { relic: Relic; fresh: boolean; onClose: () => void }) {
  const loc = locationById(relic.room)!;
  return (
    <GameDialog title={relic.name} onClose={onClose} className="gdialog--relic">
      <p className="label">{fresh ? `Found: +${GAME_XP.relic} XP` : 'Already in your collection'} &middot; {loc.name} &middot; {relic.found}</p>
      <p className="talk__line">{relic.text}</p>
      <p className="muted small">Teaches: {relicArea(relic)}.</p>
      <div className="row">
        <Btn variant="primary" onClick={onClose}>Keep exploring</Btn>
        <LinkBtn to="/codex" variant="quiet">Open the Codex</LinkBtn>
      </div>
    </GameDialog>
  );
}
const relicArea = (r: Relic) => (r.area === 'understand' ? 'AI fundamentals' : r.area === 'use' ? 'practical AI tools and techniques' : 'ethical and responsible AI');

// ---------------------------------------------------------------------------------------------- stations
const SCREEN: Record<StationId, ComponentType<StationProps>> = { cabinet: Cabinet, frame: Frame, anvil: Anvil, weld: Weld, audit: Audit, timeline: Timeline };

export function StationDialog({ id, onClose }: { id: StationId; onClose: () => void }) {
  const def = stationById(id)!;
  const cleared = useProgress((s) => roundsCleared(s, id));
  const done = useProgress((s) => stationDone(s, id));
  const [stage, setStage] = useState<{ k: 'brief' } | { k: 'play'; round: number } | { k: 'won'; round: number }>({ k: 'brief' });
  const round = stage.k === 'brief' ? 1 : stage.round;
  const Screen = SCREEN[id];
  const onClear = useCallback(() => {
    dispatch({ type: 'round', station: id, round });
    play('win');
    window.setTimeout(() => setStage({ k: 'won', round }), 700);
  }, [id, round]);
  const takeaway = def.rounds === 1 ? def.takeaway : [def.takeaway[round - 1] ?? def.takeaway[0]!];
  const rounds = Array.from({ length: def.rounds }, (_, i) => i + 1);

  return (
    <GameDialog title={def.title} onClose={onClose} wide paper className="gdialog--station">
      {stage.k === 'brief' ? (
        <div className="brief">
          <p className="label">{locationById(def.room)!.name} &middot; {locationById(def.room)!.areaName}</p>
          <p className="talk__line">{def.intro}</p>
          <dl className="brief__facts">
            <div><dt>Objective</dt><dd>{def.objective}</dd></div>
            <div><dt>To clear a round</dt><dd>{def.criteria}</dd></div>
            <div><dt>The idea</dt><dd>{def.concept}</dd></div>
            <div><dt>Reward</dt><dd>{GAME_XP.round} XP for each round the first time it is cleared</dd></div>
          </dl>
          <div className="row" role="group" aria-label="Choose a round">
            {rounds.map((r) => (
              <Btn key={r} variant={r === Math.min(def.rounds, cleared + 1) ? 'primary' : 'secondary'} icon={cleared >= r ? 'check' : 'play'} onClick={() => { play('start'); setStage({ k: 'play', round: r }); }}>
                {def.rounds === 1 ? 'Begin' : `Round ${r}`}
              </Btn>
            ))}
            <LinkBtn to={`/learn/${def.area}/${def.lesson}`} variant="quiet" icon="book">Read the lesson first</LinkBtn>
          </div>
          {done ? <Callout icon="check" tone="good">Station cleared. You can replay any round.</Callout> : null}
        </div>
      ) : stage.k === 'play' ? (
        <Screen key={`${id}-${round}`} round={round} onClear={onClear} />
      ) : (
        <div className="brief">
          <p className="label">{def.rounds === 1 ? 'Cleared' : `Round ${round} cleared`}</p>
          <p className="talk__line">{GAME_XP.round} XP, paid the first time. Here is what that was about:</p>
          <ul className="takeaway">{takeaway.map((t) => <li key={t}><Icon name="check" /> {t}</li>)}</ul>
          <div className="row">
            {round < def.rounds ? <Btn variant="primary" go onClick={() => setStage({ k: 'play', round: round + 1 })}>Round {round + 1}</Btn> : null}
            <Btn variant="secondary" icon="reset" onClick={() => setStage({ k: 'play', round })}>Replay this round</Btn>
            <LinkBtn to={`/learn/${def.area}/${def.lesson}`} variant="quiet" icon="book">Read the lesson</LinkBtn>
            <Btn variant={round < def.rounds ? 'quiet' : 'primary'} onClick={onClose}>Back to the room</Btn>
          </div>
        </div>
      )}
    </GameDialog>
  );
}

// ---------------------------------------------------------------------------------------------- journal
export function JournalDialog({ onClose }: { onClose: () => void }) {
  const state = useProgress((s) => s);
  const prog = gameProgress(state);
  const goal = nextGoal(state);
  return (
    <GameDialog title="Journal" onClose={onClose} wide paper className="gdialog--journal">
      <Callout icon="flag"><strong>Next:</strong> {goal.text}.</Callout>
      <section aria-labelledby="j-st">
        <h3 id="j-st">Stations <span className="muted">({prog.stations} of {prog.stationsTotal} cleared)</span></h3>
        <ul className="jlist">
          {STATIONS.map((st) => {
            const n = roundsCleared(state, st.id);
            return (
              <li key={st.id}>
                <strong>{st.title}</strong> <span className="muted">{locationById(st.room)!.name}</span>
                <span className="jlist__r">{Math.min(n, st.rounds)} of {st.rounds} rounds</span>
                <p className="small">{st.concept}.</p>
              </li>
            );
          })}
        </ul>
      </section>
      <section aria-labelledby="j-rel">
        <h3 id="j-rel">Relics <span className="muted">({prog.relics} of {prog.relicsTotal} found)</span></h3>
        <Meter value={(prog.relics / prog.relicsTotal) * 100} label={`Relics found: ${prog.relics} of ${prog.relicsTotal}`} />
        <ul className="relics">
          {RELICS.map((r) => {
            const got = !!state.game.relics[r.id];
            return (
              <li key={r.id} className={got ? 'is-found' : ''}>
                {got ? (
                  <details>
                    <summary>{r.name}</summary>
                    <p>{r.text}</p>
                    <p className="small muted">{locationById(r.room)!.name}</p>
                  </details>
                ) : (
                  <span><span aria-hidden="true">?</span> Not found yet <span className="muted">&middot; somewhere in {locationById(r.room)!.name}</span></span>
                )}
              </li>
            );
          })}
        </ul>
      </section>
      <div className="row">
        <LinkBtn to="/missions" variant="secondary">Missions</LinkBtn>
        <LinkBtn to="/logbook" variant="secondary">Logbook</LinkBtn>
        <LinkBtn to="/codex" variant="secondary">Codex</LinkBtn>
      </div>
    </GameDialog>
  );
}

// ---------------------------------------------------------------------------------------------- map
export function MapDialog({ onGo, onClose, here }: { onGo: (room: RoomId) => void; onClose: () => void; here: RoomId }) {
  const state = useProgress((s) => s);
  return (
    <GameDialog title="The harbor chart" onClose={onClose} wide paper className="gdialog--map">
      <p className="muted">Travel to any open building. Locked doors only gate the game: every lesson, the Codex and the scenarios stay open from the menu.</p>
      <ul className="maplist">
        {LOCATIONS.map((l) => {
          const open = isUnlocked(state, l.id);
          const sts = stationsIn(l.id);
          const rel = RELICS.filter((r) => r.room === l.id);
          const foundN = rel.filter((r) => state.game.relics[r.id]).length;
          return (
            <li key={l.id} className={!open ? 'is-locked' : ''}>
              <Btn variant={l.id === here ? 'primary' : 'secondary'} disabled={!open} onClick={() => onGo(l.id)} aria-current={l.id === here ? 'location' : undefined}>
                {!open ? <Icon name="lock" /> : null}
                {l.name}
              </Btn>
              <span className="small muted">
                {l.role} &middot; {l.areaName}
                {sts.length ? ` · ${sts.filter((s) => stationDone(state, s.id)).length} of ${sts.length} stations` : ''}
                {rel.length ? ` · ${foundN} of ${rel.length} relics` : ''}
                {!open && l.unlock ? ` · ${l.unlock.hint}` : ''}
              </span>
            </li>
          );
        })}
      </ul>
    </GameDialog>
  );
}

// ---------------------------------------------------------------------------------------------- help
export function HelpDialog({ onClose, mode = '2d' }: { onClose: () => void; mode?: '2d' | '3d' }) {
  return (
    <GameDialog title="How to play" onClose={onClose} paper className="gdialog--help">
      <ul className="help">
        {mode === '3d' ? (
          <>
            <li><kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> (or the up and down arrows) walk. Hold <kbd>Shift</kbd> to run and press <kbd>Space</kbd> to jump.</li>
            <li>Drag with the mouse, or press the left and right arrow keys, to turn the camera. The wheel zooms. Click the ground, or a marker, to walk there.</li>
            <li>On a touch screen, steer with the stick at the bottom left and drag anywhere else to look.</li>
            <li><kbd>E</kbd> or <kbd>Enter</kbd> uses whatever is near. <kbd>L</kbd> lifts your lantern and shows what is hidden. <kbd>K</kbd> asks Kernel, <kbd>M</kbd> opens the chart, <kbd>J</kbd> the journal, <kbd>Esc</kbd> pauses.</li>
          </>
        ) : (
          <>
            <li><kbd>&larr;</kbd> <kbd>&rarr;</kbd> or <kbd>A</kbd> <kbd>D</kbd> walk. Hold <kbd>Shift</kbd> to hurry. Tap or click the floor to walk there.</li>
            <li><kbd>E</kbd>, <kbd>Enter</kbd> or <kbd>Space</kbd> use whatever is near. Tap an object to walk to it and use it.</li>
            <li><kbd>L</kbd> lifts your lantern and shows what can be used or found. <kbd>K</kbd> asks Kernel. <kbd>M</kbd> opens the chart. <kbd>J</kbd> opens the journal. <kbd>Esc</kbd> pauses.</li>
          </>
        )}
        <li>Stations are small games: each one teaches an idea and pays XP the first time you clear a round.</li>
        <li>Relics are hidden in every building. Each is a short explanation of an idea, saved in your journal.</li>
        <li>Under the picture, a list of <strong>places and objects</strong> offers every action as a plain button, for anyone who prefers not to walk.</li>
        <li>You never have to play to learn. Every lesson, the Codex and the tools stay open from the main menu.</li>
      </ul>
    </GameDialog>
  );
}

// ---------------------------------------------------------------------------------------------- pause and settings
export function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="dial">
      <span className="dial__label">{label}</span>
      <span className="dial__row">
        <input type="range" min={0} max={100} step={5} value={Math.round(value * 100)} onChange={(e) => onChange(Number(e.target.value) / 100)} aria-valuetext={`${Math.round(value * 100)} percent`} />
        <output>{Math.round(value * 100)}%</output>
      </span>
    </label>
  );
}

export function GraphicsSettings({ gfx, onGfx }: { gfx: GfxPref; onGfx: (p: Partial<GfxPref>) => void }) {
  const can3d = webglSupported();
  return (
    <fieldset className="gsettings">
      <legend>Graphics</legend>
      <div className="row" role="group" aria-label="Which version of the game">
        <Btn variant={gfx.mode === '3d' ? 'primary' : 'secondary'} aria-pressed={gfx.mode === '3d'} disabled={!can3d} onClick={() => onGfx({ mode: '3d' })}>3D</Btn>
        <Btn variant={gfx.mode === '2d' ? 'primary' : 'secondary'} aria-pressed={gfx.mode === '2d'} onClick={() => onGfx({ mode: '2d' })}>Classic 2D</Btn>
      </div>
      {gfx.mode === '3d' ? (
        <label className="dial">
          <span className="dial__label">Quality</span>
          <select value={gfx.quality} onChange={(e) => onGfx({ quality: e.target.value as GfxPref['quality'] })}>
            <option value="auto">Automatic</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low (fastest)</option>
          </select>
        </label>
      ) : null}
      {!can3d ? <p className="small muted">This browser or device cannot draw 3D, so the classic 2D game is used.</p> : <p className="small muted">The 3D version needs a reasonably modern device. Automatic quality lowers the detail if it runs slowly.</p>}
    </fieldset>
  );
}

export function AudioSettings() {
  const s = useProgress((st) => st.settings);
  return (
    <fieldset className="gsettings">
      <legend>Sound</legend>
      <div className="row">
        <Btn variant={s.sound ? 'primary' : 'secondary'} icon={s.sound ? 'sound-on' : 'sound-off'} aria-pressed={s.sound} onClick={() => setAudio({ sound: !s.sound }, !s.sound ? 'xp' : undefined)}>Effects {s.sound ? 'on' : 'off'}</Btn>
        <Btn variant={s.music ? 'primary' : 'secondary'} icon="music" aria-pressed={s.music} onClick={() => setAudio({ music: !s.music }, s.sound ? 'select' : undefined)}>Music {s.music ? 'on' : 'off'}</Btn>
        <Btn variant="quiet" onClick={() => setAudio({ sound: false, music: false })} disabled={!s.sound && !s.music}>Mute everything</Btn>
      </div>
      <Slider label="Master volume" value={s.volume} onChange={(v) => setAudio({ volume: v })} />
      <Slider label="Music volume" value={s.musicVolume} onChange={(v) => setAudio({ musicVolume: v })} />
      <Slider label="Effects volume" value={s.sfxVolume} onChange={(v) => setAudio({ sfxVolume: v })} />
      <p className="small muted">Sound starts off and never plays until you switch it on. Nothing in the game needs it.</p>
    </fieldset>
  );
}

export function PauseDialog({ gfx, onGfx, onClose, onResume, onJournal, onMap, onHelp, onTitle }: { gfx: GfxPref; onGfx: (p: Partial<GfxPref>) => void; onClose: () => void; onResume: () => void; onJournal: () => void; onMap: () => void; onHelp: () => void; onTitle: () => void }) {
  const free = useProgress((s) => s.game.freeRoam);
  const [sure, setSure] = useState(false);
  return (
    <GameDialog title="Paused" onClose={onClose} className="gdialog--pause">
      <div className="pause">
        <div className="pause__menu">
          <Btn variant="primary" go onClick={onResume}>Resume</Btn>
          <Btn variant="secondary" icon="scroll" onClick={onJournal}>Journal</Btn>
          <Btn variant="secondary" icon="map" onClick={onMap}>Chart and travel</Btn>
          <Btn variant="secondary" icon="info" onClick={onHelp}>How to play</Btn>
          <Btn variant="secondary" onClick={onTitle}>Title screen</Btn>
          <LinkBtn to="/" variant="quiet">Back to the portal</LinkBtn>
        </div>
        <div>
          <AudioSettings />
          <GraphicsSettings gfx={gfx} onGfx={onGfx} />
          <label className="check">
            <input type="checkbox" checked={free} onChange={(e) => dispatch({ type: 'game', patch: { freeRoam: e.target.checked } })} /> Open every door (for reviewers and teachers; XP is unchanged)
          </label>
          <div className="gsettings">
            {sure ? (
              <Callout icon="warning" tone="bad">
                This erases all progress in the game and the lessons on this device.
                <span className="row">
                  <Btn variant="primary" onClick={() => { resetAll(); onTitle(); }}>Yes, erase everything</Btn>
                  <Btn variant="quiet" onClick={() => setSure(false)}>Keep my progress</Btn>
                </span>
              </Callout>
            ) : (
              <Btn variant="quiet" icon="reset" onClick={() => setSure(true)}>Erase all progress</Btn>
            )}
          </div>
        </div>
      </div>
    </GameDialog>
  );
}

export function EndingDialog({ onClose }: { onClose: () => void }) {
  const state = useProgress((s) => s);
  const p = gameProgress(state);
  const lv = levelInfo(state.xp);
  return (
    <GameDialog title="The harbor is lit" onClose={onClose} className="gdialog--ending">
      <p className="label">Every station cleared</p>
      <p className="talk__line">
        Every lantern along the Quay answers at once. You cleared all {p.stationsTotal} stations ({p.rounds} rounds), found {p.relics} of {p.relicsTotal} relics, and reached level {lv.level}, {lv.name}.
      </p>
      <p className="talk__line">
        Two things are left. The final examination in the Trial Hall tests all three learning areas together, and the relics you have not found are still hiding. Nothing here needs to be finished to keep what you have learned.
      </p>
      <div className="row">
        <LinkBtn to="/certification" variant="primary" go>Take the final examination</LinkBtn>
        <Btn variant="secondary" onClick={onClose}>Keep exploring</Btn>
        <LinkBtn to="/logbook" variant="quiet">Open the logbook</LinkBtn>
      </div>
    </GameDialog>
  );
}

export const kernelIntro = (mode: '2d' | '3d'): string[] => [
  'Welcome to Tideweight. The lanterns around the harbor have gone dark, and you are the new lamplighter. I am Kernel. I will keep you company.',
  mode === '3d'
    ? 'Walk with W, A, S and D, drag to turn the camera, and hold Shift to run. Press E at anything that has a marker. Press L to lift your lantern and see what is hidden. Press Esc to pause. On a touch screen, steer with the stick and drag to look.'
    : 'Walk with the arrow keys or A and D, and hold Shift to hurry. Press E at anything that has a marker. Press L to lift your lantern and see what is hidden. Press Esc to pause. On a touch screen, use the buttons under the picture or tap where you want to go.',
  'Six buildings stand around the plaza. The first three are open. The Archive and the Trial Hall open as you gain levels. Everything you earn here counts toward the same progress as the lessons.',
];

export function kernelHint(state: PortalState): Talk {
  const goal = nextGoal(state);
  const lv = levelInfo(state.xp);
  return {
    who: 'Kernel',
    lines: [
      `You are level ${lv.level}, ${lv.name}${lv.next ? `, with ${lv.remaining} XP to go for the next rank` : ''}. ${gameLine(state)}`,
      `Next: ${goal.text}. Press M to open the chart and travel there.`,
      'Keys: arrows or A and D to walk, E to use, L for the lantern, M chart, J journal, Esc pause.',
    ],
  };
}
const gameLine = (s: PortalState) => {
  const p = gameProgress(s);
  return `You have cleared ${p.rounds} of ${p.roundsTotal} station rounds and found ${p.relics} of ${p.relicsTotal} relics.`;
};

