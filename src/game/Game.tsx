/**
 * The game page: title screen, then the harbor. Owns which room is open, which overlay is showing, and what each hotspot does.
 * The world itself (movement, camera, hotspots) lives in Room.tsx; the content in data.ts and rooms.ts.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { navigate } from '@/router';
import { Harbor, type HarborPlace } from '@/art/Harbor';
import { RankCrest } from '@/art/Ranks';
import { Icon } from '@/art/Icons';
import { LESSONS, PATHS } from '@/content/paths';
import { dispatch, resetAll, useProgress } from '@/engine/store';
import { gameProgress, isUnlocked, levelInfo, nextGoal, stationDone } from '@/engine/progress';
import { play } from '@/audio/sfx';
import { setAmbience, stopAmbience } from '@/audio/ambience';
import { setMusicMood } from '@/audio/music';
import { Btn, LinkBtn, Meter } from '@/ui/primitives';
import { LOCATIONS, STATION_IDS, locationById, relicById, type RoomId, type StationId } from './data';
import { ROOMS, type Hotspot } from './rooms';
import { Room, type RoomHandle } from './Room';
import { QuayFar, QuayNear } from './art/Quay';
import { ArchiveNear, HallNear, OfficeNear } from './art/Interiors2';
import { BeaconNear, FoundryNear, LoomNear } from './art/Interiors';
import { FAR } from './art/Far';
import { AudioSettings, EndingDialog, GameDialog, HelpDialog, JournalDialog, KERNEL_INTRO, MapDialog, PauseDialog, RelicCard, StationDialog, TalkDialog, kernelHint, type Talk } from './overlays';

const NEAR: Record<RoomId, ComponentType> = { quay: QuayNear, loom: LoomNear, foundry: FoundryNear, beacon: BeaconNear, archive: ArchiveNear, hall: HallNear, office: OfficeNear };
const FARS: Record<RoomId, ComponentType> = { quay: QuayFar, ...FAR };

type Overlay =
  | { k: 'pause' }
  | { k: 'map' }
  | { k: 'journal' }
  | { k: 'help' }
  | { k: 'station'; id: StationId }
  | { k: 'talk'; talk: Talk }
  | { k: 'relic'; id: string; fresh: boolean }
  | { k: 'ending' };

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function Title({ onBegin, onHelp, onSettings }: { onBegin: () => void; onHelp: () => void; onSettings: () => void }) {
  const state = useProgress((s) => s);
  const lv = levelInfo(state.xp);
  const prog = gameProgress(state);
  const started = state.game.started;
  const [sure, setSure] = useState(false);
  const litKey = LESSONS.map((l) => (state.lessons[l.id]?.done ? '1' : '0')).join('');
  const lit = useMemo(() => litKey.split('').map((c) => c === '1'), [litKey]);
  const places = useMemo<HarborPlace[]>(
    () => PATHS.map((p, i) => ({ id: p.id, to: `/learn/${p.id}`, title: p.title, place: p.place, done: litKey.slice(i * 5, i * 5 + p.lessons.length).split('1').length - 1, total: p.lessons.length })),
    [litKey],
  );
  return (
    <section className="title" aria-labelledby="title-h">
      <Harbor className="title__art" lit={lit} places={places} certified={false} />
      <div className="title__veil" aria-hidden="true" />
      <div className="wrap title__inner">
        <div className="title__panel" data-surface="ink">
          <p className="label">A game for grades 9 to 12</p>
          <h1 id="title-h">Tideweight</h1>
          <p className="title__sub">The lamplighter&apos;s harbor</p>
          <p className="title__lead">The lanterns have gone dark. Walk the harbor, work the stations, find what is hidden, and learn how AI works, how to use it well, and when not to trust it.</p>
          <div className="title__menu">
            <Btn variant="primary" go onClick={onBegin}>{started ? 'Continue' : 'Begin'}</Btn>
            <Btn variant="secondary" icon="info" onClick={onHelp}>How to play</Btn>
            <Btn variant="secondary" icon="sound-on" onClick={onSettings}>Sound and settings</Btn>
            <LinkBtn to="/" variant="quiet">Back to the portal</LinkBtn>
            {started ? (
              sure ? (
                <span className="title__confirm">
                  <Btn variant="primary" onClick={() => { resetAll(); setSure(false); }}>Erase everything</Btn>
                  <Btn variant="quiet" onClick={() => setSure(false)}>Cancel</Btn>
                </span>
              ) : (
                <Btn variant="quiet" icon="reset" onClick={() => setSure(true)}>New game</Btn>
              )
            ) : null}
          </div>
          {started ? (
            <p className="title__save small" aria-label="Your saved game">
              <RankCrest level={lv.level} className="title__crest" /> Level {lv.level}, {lv.name} &middot; {state.xp} XP &middot; {prog.rounds} of {prog.roundsTotal} station rounds &middot; {prog.relics} of {prog.relicsTotal} relics
            </p>
          ) : (
            <p className="title__save small">Six stations, seventeen relics, three learning areas. Progress saves in this browser and nowhere else.</p>
          )}
          <p className="small muted">Prefer to read? Every lesson, the Codex and the tools stay open from the menu above. The game never locks them.</p>
        </div>
      </div>
    </section>
  );
}

export default function Game() {
  const state = useProgress((s) => s);
  const g = state.game;
  const lv = levelInfo(state.xp);
  const prog = gameProgress(state);
  const sound = useProgress((s) => s.settings.sound);
  const [screen, setScreen] = useState<'title' | 'play'>('title');
  const [room, setRoom] = useState<RoomId>('quay');
  const [startX, setStartX] = useState(ROOMS.quay.spawn);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [fade, setFade] = useState(false);
  const [sweep, setSweep] = useState(0);
  const roomRef = useRef<RoomHandle>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const locked = useMemo(() => new Set(LOCATIONS.filter((l) => !isUnlocked(state, l.id)).map((l) => l.id as string)), [state]);
  const found = useMemo(() => new Set(Object.keys(g.relics)), [g.relics]);
  const done = useMemo(() => new Set(STATION_IDS.filter((id) => stationDone(state, id))), [state]);
  const frozen = screen !== 'play' || overlay !== null;
  const def = ROOMS[room];
  const loc = locationById(room)!;

  // Tell the tests and the page where we are.
  useEffect(() => {
    document.documentElement.dataset.gameRoom = screen === 'play' ? room : 'title';
    return () => {
      delete document.documentElement.dataset.gameRoom;
    };
  }, [room, screen]);

  // Switching between the title and the stage always starts at the top, so the stage is never left under the header on a phone.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [screen]);

  // The title screen has its own quieter version of the score.
  useEffect(() => {
    setMusicMood(screen === 'play' ? 'world' : 'title');
    return () => setMusicMood('world');
  }, [screen]);

  // Room ambience follows the room and the Sound switch.
  useEffect(() => {
    if (screen === 'play' && sound) setAmbience(room);
    else stopAmbience();
    return stopAmbience;
  }, [room, screen, sound]);

  const travel = useCallback((to: RoomId, x?: number) => {
    const apply = () => {
      setRoom(to);
      setStartX(x ?? ROOMS[to].spawn);
      dispatch({ type: 'visit', room: to });
      dispatch({ type: 'game', patch: { at: to } });
    };
    play('door');
    if (reducedMotion()) {
      apply();
      return;
    }
    setFade(true);
    window.setTimeout(() => {
      apply();
      setFade(false);
    }, 240);
  }, []);

  const begin = () => {
    const s = stateRef.current;
    const first = !s.game.started;
    const at = isUnlocked(s, s.game.at) ? s.game.at : 'quay';
    dispatch({ type: 'game', patch: { started: true } });
    setRoom(at);
    setStartX(ROOMS[at].spawn);
    dispatch({ type: 'visit', room: at });
    setScreen('play');
    play('start');
    if (first) setOverlay({ k: 'talk', talk: { who: 'Kernel', lines: KERNEL_INTRO } });
  };

  const onInteract = useCallback(
    (h: Hotspot) => {
      const s = stateRef.current;
      switch (h.kind) {
        case 'door': {
          const target = h.ref as RoomId;
          if (target === 'quay') {
            travel('quay', locationById(room)!.doorX);
          } else if (!isUnlocked(s, target)) {
            play('wrong');
            const l = locationById(target)!;
            setOverlay({ k: 'talk', talk: { who: l.name, lines: [`The door is locked. ${l.unlock?.hint ?? ''}`, 'Finish lessons and stations to earn XP. If you are reviewing the game, "Open every door" is in the pause menu.'] } });
          } else {
            travel(target);
          }
          break;
        }
        case 'station':
          play('start');
          setOverlay({ k: 'station', id: h.ref as StationId });
          break;
        case 'relic': {
          const r = relicById(h.ref ?? '');
          if (!r) break;
          const fresh = !s.game.relics[r.id];
          if (fresh) {
            dispatch({ type: 'relic', id: r.id });
            play('relic');
          } else play('select');
          setOverlay({ k: 'relic', id: r.id, fresh });
          break;
        }
        case 'npc':
        case 'look':
          play('select');
          setOverlay({ k: 'talk', talk: { who: h.kind === 'npc' ? h.label.split(',')[0]! : h.label, lines: h.lines ?? [], links: h.links } });
          break;
        case 'link':
          play('nav');
          navigate(h.ref ?? '/');
          break;
      }
    },
    [room, travel],
  );

  // Keyboard shortcuts for the whole game. They are ignored while a dialog is open or while typing.
  useEffect(() => {
    if (screen !== 'play') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (document.querySelector('dialog[open]')) return;
      const k = e.key.toLowerCase();
      // Opened one tick later: a dialog that appears during the Escape keydown is closed again by the browser's own Escape handling.
      if (k === 'escape') window.setTimeout(() => setOverlay((o) => o ?? { k: 'pause' }), 0);
      else if (k === 'k') setOverlay({ k: 'talk', talk: kernelHint(stateRef.current) });
      else if (k === 'm') setOverlay({ k: 'map' });
      else if (k === 'j') setOverlay({ k: 'journal' });
      else if (k === 'l') {
        play('sweep');
        setSweep(Date.now());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [screen]);

  // Give the stage back to the keyboard when a dialog closes.
  const prevOverlay = useRef<Overlay | null>(null);
  useEffect(() => {
    if (prevOverlay.current && !overlay) window.setTimeout(() => roomRef.current?.focus(), 0);
    prevOverlay.current = overlay;
  }, [overlay]);

  // The closing scene, once, when the last station is cleared and nothing else is in the way.
  const allCleared = prog.stations === prog.stationsTotal;
  useEffect(() => {
    if (screen !== 'play' || !allCleared || g.ended || overlay) return;
    const t = window.setTimeout(() => {
      dispatch({ type: 'game', patch: { ended: true } });
      play('win');
      setOverlay((o) => o ?? { k: 'ending' });
    }, 900);
    return () => window.clearTimeout(t);
  }, [screen, allCleared, g.ended, overlay]);

  const close = useCallback(() => setOverlay(null), []);
  const chain = (o: Overlay) => () => setOverlay(o);

  if (screen === 'title') {
    return (
      <>
        <Title onBegin={begin} onHelp={() => setOverlay({ k: 'help' })} onSettings={() => setOverlay({ k: 'pause' })} />
        {overlay?.k === 'help' ? <HelpDialog onClose={close} /> : null}
        {overlay?.k === 'pause' ? (
          <TitleSettings onClose={close} />
        ) : null}
      </>
    );
  }

  return (
    <div className="game">
      <div className="wrap game__bar" data-surface="ink">
        <div className="game__where">
          <p className="label">{loc.role}</p>
          <h1 className="game__title">{loc.name}</h1>
        </div>
        <div className="game__stats">
          <span className="game__lv"><RankCrest level={lv.level} className="game__crest" /> Lv {lv.level}</span>
          <span className="game__xp">
            <span className="small">{state.xp} XP{lv.next ? `, ${lv.remaining} to level ${lv.level + 1}` : ''}</span>
            <Meter value={lv.pct} label={`Progress to the next level, ${lv.pct} percent`} />
          </span>
          <span className="game__counts small" aria-label={`${prog.rounds} of ${prog.roundsTotal} station rounds, ${prog.relics} of ${prog.relicsTotal} relics`}>
            <Icon name="target" /> {prog.rounds}/{prog.roundsTotal} <Icon name="seal" /> {prog.relics}/{prog.relicsTotal}
          </span>
        </div>
        <div className="game__tools" role="toolbar" aria-label="Game controls">
          <Btn small variant="quiet" icon="eye" aria-label="Lift your lantern to show what is hidden (L)" onClick={() => { play('sweep'); setSweep(Date.now()); }} />
          <Btn small variant="quiet" icon="chat" aria-label="Ask Kernel (K)" onClick={() => setOverlay({ k: 'talk', talk: kernelHint(state) })} />
          <Btn small variant="quiet" icon="map" aria-label="Chart and travel (M)" onClick={() => setOverlay({ k: 'map' })} />
          <Btn small variant="quiet" icon="scroll" aria-label="Journal (J)" onClick={() => setOverlay({ k: 'journal' })} />
          <Btn small variant="quiet" icon="pause" aria-label="Pause (Escape)" onClick={() => setOverlay({ k: 'pause' })} />
        </div>
      </div>
      <div className="wrap game__stage">
        <Room
          key={room}
          ref={roomRef}
          def={def}
          Far={FARS[room]}
          Near={NEAR[room]}
          startX={startX}
          frozen={frozen}
          found={found}
          done={done}
          locked={locked}
          sweep={sweep}
          onInteract={onInteract}
        />
        <div className={`game__fade${fade ? ' is-on' : ''}`} aria-hidden="true" />
        <p className="game__goal small">
          <Icon name="flag" /> <strong>Next:</strong> {nextGoal(state).text}
        </p>
      </div>

      {overlay?.k === 'pause' ? (
        <PauseDialog
          onClose={close}
          onResume={close}
          onJournal={chain({ k: 'journal' })}
          onMap={chain({ k: 'map' })}
          onHelp={chain({ k: 'help' })}
          onTitle={() => {
            setOverlay(null);
            setScreen('title');
          }}
        />
      ) : null}
      {overlay?.k === 'map' ? (
        <MapDialog
          here={room}
          onClose={close}
          onGo={(to) => {
            setOverlay(null);
            if (to !== room) travel(to, to === 'quay' ? locationById(room)!.doorX : undefined);
          }}
        />
      ) : null}
      {overlay?.k === 'journal' ? <JournalDialog onClose={close} /> : null}
      {overlay?.k === 'help' ? <HelpDialog onClose={close} /> : null}
      {overlay?.k === 'station' ? <StationDialog id={overlay.id} onClose={close} /> : null}
      {overlay?.k === 'talk' ? <TalkDialog talk={overlay.talk} onClose={close} /> : null}
      {overlay?.k === 'ending' ? <EndingDialog onClose={close} /> : null}
      {overlay?.k === 'relic' ? <RelicCard relic={relicById(overlay.id)!} fresh={overlay.fresh} onClose={close} /> : null}
    </div>
  );
}

function TitleSettings({ onClose }: { onClose: () => void }) {
  return (
    <GameDialog title="Sound and settings" onClose={onClose} className="gdialog--pause">
      <AudioSettings />
      <div className="row">
        <Btn variant="primary" onClick={onClose}>Done</Btn>
      </div>
    </GameDialog>
  );
}
