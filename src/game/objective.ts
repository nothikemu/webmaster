/**
 * The objective tracker's brain: one clear thing to do next, worked out from the player's progress and where they stand.
 * Pure (no React, no three.js) so the tests, the 3D stage and the 2D stage can all use it.
 *
 * The rule is "finish what is in front of you, then move on": an unfinished station in the current room comes first; otherwise the
 * next unfinished station in the first open room; when stations are done, hidden relics; when those are done, whatever is still
 * locked; and last the final examination.
 */
import { LOCATIONS, RELICS, STATIONS, locationById, type RoomId } from './data';
import { isUnlocked, levelInfo, stationDone, type PortalState } from '@/engine/progress';

export interface Objective {
  /** Stable key: changes when the objective changes, so the tracker can animate. */
  id: string;
  /** One short sentence: what to do. */
  title: string;
  /** One line: how to do it. */
  hint: string;
  /** Where to go, if it is a place: the room it is in and the id of the thing in the stage (a door, a station). */
  target: { room: RoomId; spot: string } | null;
}

const doorSpot = (room: RoomId): string => `door:${room}`;

/** Where the player must go to get toward `room` from `here`: the door to it from the Quay, or the way out of the current room. */
function route(here: RoomId, room: RoomId): { spot: string; room: RoomId; leg: 'there' | 'door' | 'out' } {
  if (here === room) return { spot: '', room, leg: 'there' };
  if (here === 'quay') return { spot: doorSpot(room), room: 'quay', leg: 'door' };
  return { spot: 'exit', room: here, leg: 'out' };
}

export function objective(s: PortalState, here: RoomId): Objective {
  const open = STATIONS.filter((st) => !stationDone(s, st.id) && isUnlocked(s, st.room));
  // finish the room you are standing in before leaving it
  const st = open.find((x) => x.room === here) ?? open[0];
  if (st) {
    const r = route(here, st.room);
    if (r.leg === 'there') {
      return { id: `station:${st.id}`, title: `Play ${st.title}`, hint: 'Walk onto the red pad and press E (or tap Use).', target: { room: here, spot: `station:${st.id}` } };
    }
    const name = locationById(st.room)!.name;
    if (r.leg === 'door') {
      return { id: `go:${st.room}`, title: `Enter ${name}`, hint: `${st.title} is inside. Follow the red path to the red door, then press E.`, target: { room: 'quay', spot: r.spot } };
    }
    return { id: `out:${st.room}`, title: `Head back out to the Quay`, hint: `${st.title} is in ${name}. The red door leads out.`, target: { room: here, spot: r.spot } };
  }

  const roomsWithRelics = LOCATIONS.filter((l) => isUnlocked(s, l.id) && RELICS.some((r) => r.room === l.id && !s.game.relics[r.id]));
  if (roomsWithRelics.length) {
    const left = RELICS.filter((r) => !s.game.relics[r.id] && isUnlocked(s, r.room)).length;
    const l = roomsWithRelics.find((x) => x.id === here) ?? roomsWithRelics[0]!;
    const r = route(here, l.id);
    const tail = `Press L to lift your lantern and show what is hidden. ${left} relic${left === 1 ? '' : 's'} still to find.`;
    if (r.leg === 'there') return { id: `relics:${l.id}`, title: `Search ${l.name} for hidden relics`, hint: tail, target: null };
    if (r.leg === 'door') return { id: `relics-go:${l.id}`, title: `Enter ${l.name}`, hint: `Something is still hidden there. Follow the red path to the red door.`, target: { room: 'quay', spot: r.spot } };
    return { id: `relics-out:${l.id}`, title: 'Head back out to the Quay', hint: `Something is still hidden in ${l.name}. The red door leads out.`, target: { room: here, spot: r.spot } };
  }

  const locked = LOCATIONS.find((l) => !isUnlocked(s, l.id));
  if (locked) {
    const need = locked.unlock!.level;
    const lv = levelInfo(s.xp);
    return { id: `level:${need}`, title: `Reach level ${need} to open ${locked.name}`, hint: `You are level ${lv.level}${lv.next ? `, ${lv.remaining} XP to go` : ''}. Lessons on the Learn page pay XP too.`, target: null };
  }

  const r = route(here, 'hall');
  if (r.leg === 'there') return { id: 'exam', title: 'Take the final examination', hint: 'Go to the sign for the final examination and press E.', target: { room: 'hall', spot: 'exam' } };
  if (r.leg === 'door') return { id: 'exam-go', title: 'Take the final examination in the Trial Hall', hint: 'Follow the red path to the Trial Hall door.', target: { room: 'quay', spot: r.spot } };
  return { id: 'exam-out', title: 'Head back out to the Quay', hint: 'The Trial Hall is next door. The red door leads out.', target: { room: here, spot: r.spot } };
}
