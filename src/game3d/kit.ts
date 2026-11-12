/** Small helpers for building the world from primitives. Everything casts and receives shadows unless told otherwise. */
import type {
  Object3D} from 'three';
import {
  BoxGeometry,
  CapsuleGeometry,
  DoubleSide,
  Float32BufferAttribute,
  BufferGeometry,
  type MeshStandardMaterial,
  ConeGeometry,
  CylinderGeometry,
  Group,
  Mesh,
  type Material,
  PlaneGeometry,
  SphereGeometry,
  TorusGeometry,
} from 'three';

export type V3 = [number, number, number];

export function put<T extends Object3D>(o: T, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]): T {
  o.position.set(pos[0], pos[1], pos[2]);
  o.rotation.set(rot[0], rot[1], rot[2]);
  return o;
}

export function mesh(g: BufferGeometry, m: Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], shadow = true): Mesh {
  const o = new Mesh(g, m);
  o.castShadow = shadow;
  o.receiveShadow = true;
  return put(o, pos, rot);
}

/** A box sitting on y (its bottom face is at pos[1]). */
export function box(w: number, h: number, d: number, m: Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]): Mesh {
  return mesh(new BoxGeometry(w, h, d), m, [pos[0], pos[1] + h / 2, pos[2]], rot);
}
/** A cylinder standing on y. */
export function cyl(rTop: number, rBot: number, h: number, m: Material, pos: V3 = [0, 0, 0], seg = 20, rot: V3 = [0, 0, 0]): Mesh {
  return mesh(new CylinderGeometry(rTop, rBot, h, seg), m, [pos[0], pos[1] + h / 2, pos[2]], rot);
}
export function cone(r: number, h: number, m: Material, pos: V3 = [0, 0, 0], seg = 16, rot: V3 = [0, 0, 0]): Mesh {
  return mesh(new ConeGeometry(r, h, seg), m, [pos[0], pos[1] + h / 2, pos[2]], rot);
}
export function ball(r: number, m: Material, pos: V3 = [0, 0, 0], seg = 16, shadow = true): Mesh {
  return mesh(new SphereGeometry(r, seg, Math.max(8, seg >> 1)), m, pos, [0, 0, 0], shadow);
}
export function ring(r: number, tube: number, m: Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], seg = 28): Mesh {
  return mesh(new TorusGeometry(r, tube, 8, seg), m, pos, rot);
}
export function plane(w: number, h: number, m: Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], shadow = false): Mesh {
  return mesh(new PlaneGeometry(w, h), m, pos, rot, shadow);
}
export function capsule(r: number, len: number, m: Material, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]): Mesh {
  return mesh(new CapsuleGeometry(r, len, 6, 12), m, pos, rot);
}

export function group(children: Object3D[] = [], pos: V3 = [0, 0, 0], rotY = 0): Group {
  const g = new Group();
  children.forEach((c) => g.add(c));
  g.position.set(...pos);
  g.rotation.y = rotY;
  return g;
}

/**
 * A pitched roof with a ridge along z: two sloped faces with proper texture coordinates. (x, z) is the centre of the footprint,
 * y the height of the eaves. Width is across the slopes; depth along the ridge.
 */
export function roof(w: number, d: number, rise: number, m: Material, pos: V3 = [0, 0, 0], over = 0.9, rep = 5): Mesh {
  const hw = w / 2 + over;
  const hd = d / 2 + over;
  const slope = Math.hypot(hw, rise);
  const P: number[] = [];
  const U: number[] = [];
  const side = (sx: number) => {
    // A (eave front), B (eave back), C (ridge back), D (ridge front)
    const A = [sx * hw, 0, hd];
    const B = [sx * hw, 0, -hd];
    const C = [0, rise, -hd];
    const D = [0, rise, hd];
    const uA = [0, 0];
    const uB = [(2 * hd) / 4 * (rep / 5) * 2, 0];
    const uC = [uB[0]!, (slope / 3) * (rep / 5) * 2];
    const uD = [0, uC[1]!];
    for (const [a, b, c, ua, ub, uc] of [
      [A, C, B, uA, uC, uB],
      [A, D, C, uA, uD, uC],
    ] as const) {
      P.push(...a!, ...b!, ...c!);
      U.push(...ua!, ...ub!, ...uc!);
    }
  };
  side(-1);
  side(1);
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(P, 3));
  g.setAttribute('uv', new Float32BufferAttribute(U, 2));
  g.computeVertexNormals();
  const dm = (m as MeshStandardMaterial).clone();
  dm.side = DoubleSide;
  return mesh(g, dm, pos);
}

/** The triangle of wall under a gable, facing +z (or -z with flip). */
export function gable(w: number, rise: number, m: Material, pos: V3 = [0, 0, 0], flip = false): Mesh {
  const g = new BufferGeometry();
  const hw = w / 2;
  g.setAttribute('position', new Float32BufferAttribute([-hw, 0, 0, hw, 0, 0, 0, rise, 0], 3));
  g.setAttribute('uv', new Float32BufferAttribute([0, 0, w / 3, 0, w / 6, rise / 3], 2));
  g.computeVertexNormals();
  const o = mesh(g, m, pos, [0, flip ? Math.PI : 0, 0]);
  return o;
}
