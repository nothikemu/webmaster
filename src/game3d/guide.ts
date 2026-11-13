/**
 * The way-finding layer of the 3D world. Red means "go here": a trail of chevrons on the ground that leads from the player to the
 * current goal, and a marker at the goal itself (a pulsing floor ring, a pillar of red and a spinning diamond). Everything is one or
 * two draw calls and none of it touches the colliders or the lighting.
 *
 * The trail follows the same colliders the player walks through (see route.ts), so it goes around the fountain instead of through it.
 */
import {
  type BufferGeometry,
  CylinderGeometry,
  Color,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  OctahedronGeometry,
  Quaternion,
  RingGeometry,
  Shape,
  ShapeGeometry,
  Vector3,
} from 'three';
import { planRoute, routeLength, sampleRoute, type Pt } from './route';
import type { Collider } from './world';

const MAX_CHEVRONS = 30;
const GAP = 2.6;
const LIMIT = 60;

export interface GuideGoal {
  x: number;
  z: number;
  /** Height of the diamond above the floor. */
  y: number;
  /** Height of the pillar. */
  height: number;
}

export interface Guide {
  group: Group;
  setWorld(cols: readonly Collider[], inside: (x: number, z: number) => boolean): void;
  setGoal(goal: GuideGoal | null): void;
  update(dt: number, t: number, player: Vector3): void;
  /** Metres still to walk along the route to the goal, or null when there is no goal or no route. */
  readonly distance: number | null;
  readonly goal: GuideGoal | null;
  dispose(): void;
}

/** A bold V, tip toward +z, lying on the ground. */
function chevron(scale: number): BufferGeometry {
  const s = new Shape();
  s.moveTo(0, -0.8);
  s.lineTo(0.85, 0.2);
  s.lineTo(0.85, 0.78);
  s.lineTo(0, 0.0);
  s.lineTo(-0.85, 0.78);
  s.lineTo(-0.85, 0.2);
  s.closePath();
  const g = new ShapeGeometry(s);
  g.rotateX(-Math.PI / 2);
  g.scale(scale, 1, scale);
  return g;
}

const RED = new Color(7, 0.3, 0.42);
const INK = new Color(0.02, 0.02, 0.025);

export function makeGuide(reduced: boolean): Guide {
  const group = new Group();
  group.name = 'guide';
  const redMat = new MeshBasicMaterial({ color: RED, toneMapped: false, fog: false });
  const inkMat = new MeshBasicMaterial({ color: INK, toneMapped: false, fog: false });

  const under = new InstancedMesh(chevron(1.3), inkMat, MAX_CHEVRONS);
  const over = new InstancedMesh(chevron(1), redMat, MAX_CHEVRONS);
  for (const m of [under, over]) {
    m.frustumCulled = false;
    m.count = 0;
    m.castShadow = false;
    m.receiveShadow = false;
    group.add(m);
  }
  under.position.y = 0.085;
  over.position.y = 0.1;

  // the marker
  const marker = new Group();
  marker.visible = false;
  const ringGeo = new RingGeometry(1.3, 1.8, 40);
  ringGeo.rotateX(-Math.PI / 2);
  const ring = new Mesh(ringGeo, redMat);
  ring.position.y = 0.11;
  const edgeGeo = new RingGeometry(1.05, 1.22, 40);
  edgeGeo.rotateX(-Math.PI / 2);
  const edge = new Mesh(edgeGeo, inkMat);
  edge.position.y = 0.105;
  const pillar = new Mesh(new CylinderGeometry(0.16, 0.16, 1, 8, 1, true), redMat);
  const diamond = new Mesh(new OctahedronGeometry(0.62), redMat);
  diamond.scale.set(0.75, 1.25, 0.75);
  marker.add(ring, edge, pillar, diamond);
  group.add(marker);

  let cols: readonly Collider[] = [];
  let inside: (x: number, z: number) => boolean = () => true;
  let goal: GuideGoal | null = null;
  let route: Pt[] = [];
  let dirty = true;
  let lastFrom: Pt = { x: 1e9, z: 1e9 };
  let lastPlan = -10;
  let distance: number | null = null;

  const m4 = new Matrix4();
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const p3 = new Vector3();
  const s3 = new Vector3();

  const api: Guide = {
    group,
    setWorld(c, i) {
      cols = c;
      inside = i;
      dirty = true;
    },
    setGoal(g) {
      goal = g;
      dirty = true;
      marker.visible = !!g;
      if (g) {
        marker.position.set(g.x, 0, g.z);
        pillar.scale.set(1, g.height, 1);
        pillar.position.y = g.height / 2;
      } else {
        under.count = 0;
        over.count = 0;
        distance = null;
        route = [];
      }
    },
    update(dt, t, player) {
      if (!goal) return;
      // plan again when the goal or the world changed, or the player has walked a few metres (and not more than a few times a second)
      const moved = Math.hypot(player.x - lastFrom.x, player.z - lastFrom.z);
      if (dirty || (moved > 2.5 && t - lastPlan > 0.4)) {
        dirty = false;
        lastPlan = t;
        lastFrom = { x: player.x, z: player.z };
        route = planRoute({ x: player.x, z: player.z }, { x: goal.x, z: goal.z }, cols, inside);
        if (!route.length) route = [{ x: player.x, z: player.z }, { x: goal.x, z: goal.z }];
      }
      // the part of the route still ahead of the player: drop the start, which is where they were when it was planned
      const here: Pt = { x: player.x, z: player.z };
      const ahead = route.length > 1 ? [here, ...route.slice(1)] : [here, { x: goal.x, z: goal.z }];
      const remain = routeLength(ahead);
      distance = remain;
      const stop = Math.max(0, remain - 2.3);
      const march = reduced ? 0 : (t * 2.4) % GAP;
      const pts = sampleRoute(ahead, GAP, march, MAX_CHEVRONS, Math.min(LIMIT, stop));
      let n = 0;
      for (const p of pts) {
        // small near the feet, full size a few metres out, and tapering away at the end
        const grow = Math.min(1, Math.max(0, (p.at - 1.2) / 2.4)) * Math.min(1, Math.max(0.25, (stop - p.at) / 4));
        if (grow <= 0.02) continue;
        q.setFromAxisAngle(up, p.ang);
        p3.set(p.x, 0, p.z);
        s3.set(grow, 1, grow);
        m4.compose(p3, q, s3);
        under.setMatrixAt(n, m4);
        over.setMatrixAt(n, m4);
        n++;
      }
      under.count = n;
      over.count = n;
      under.instanceMatrix.needsUpdate = true;
      over.instanceMatrix.needsUpdate = true;

      // the marker: the ring breathes, the diamond turns and floats
      const k = reduced ? 1 : 1 + Math.sin(t * 3.2) * 0.1;
      ring.scale.set(k, 1, k);
      diamond.position.y = goal.y + (reduced ? 0 : Math.sin(t * 2.4) * 0.18);
      diamond.rotation.y = reduced ? 0.6 : t * 1.6;
      void dt;
    },
    get distance() {
      return distance;
    },
    get goal() {
      return goal;
    },
    dispose() {
      for (const o of [under, over, ring, edge, pillar, diamond]) o.geometry.dispose();
      redMat.dispose();
      inkMat.dispose();
    },
  };
  return api;
}
