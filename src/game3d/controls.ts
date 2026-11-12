/** Third-person movement, collision and the follow camera. Pure logic over three's vectors; no DOM. */
import { Vector3 } from 'three';
import type { Collider } from './world';

export interface Input {
  /** -1..1, relative to the camera. */
  moveX: number;
  moveZ: number;
  run: boolean;
  jump: boolean;
}

export interface Body {
  pos: Vector3;
  vel: Vector3;
  /** Which way the figure faces, in radians about y (0 faces +z). */
  face: number;
  grounded: boolean;
  speed: number;
}

export interface CamState {
  yaw: number;
  pitch: number;
  dist: number;
  /** Where the camera really is, after smoothing and wall avoidance. */
  pos: Vector3;
  distNow: number;
}

export const RADIUS = 0.45;
const WALK = 4.3;
const RUN = 7.6;

export function newBody(x: number, z: number, face: number): Body {
  return { pos: new Vector3(x, 0, z), vel: new Vector3(), face, grounded: true, speed: 0 };
}

/** Push a circle out of one collider. Returns true if it moved. */
function push(p: Vector3, c: Collider, r: number): boolean {
  if (c.circle) {
    const dx = p.x - c.x;
    const dz = p.z - c.z;
    const d = Math.hypot(dx, dz);
    const min = c.hx + r;
    if (d < min && d > 1e-6) {
      p.x = c.x + (dx / d) * min;
      p.z = c.z + (dz / d) * min;
      return true;
    }
    return false;
  }
  const cos = Math.cos(-c.rot);
  const sin = Math.sin(-c.rot);
  const dx = p.x - c.x;
  const dz = p.z - c.z;
  const lx = dx * cos - dz * sin;
  const lz = dx * sin + dz * cos;
  const ox = c.hx + r - Math.abs(lx);
  const oz = c.hz + r - Math.abs(lz);
  if (ox <= 0 || oz <= 0) return false;
  let nx = lx;
  let nz = lz;
  if (ox < oz) nx = Math.sign(lx || 1) * (c.hx + r);
  else nz = Math.sign(lz || 1) * (c.hz + r);
  const c2 = Math.cos(c.rot);
  const s2 = Math.sin(c.rot);
  p.x = c.x + nx * c2 - nz * s2;
  p.z = c.z + nx * s2 + nz * c2;
  return true;
}

export function step(b: Body, input: Input, camYaw: number, dt: number, colliders: readonly Collider[], inside: (x: number, z: number) => boolean): void {
  // desired direction on the ground, relative to the camera
  const f = new Vector3(-Math.sin(camYaw), 0, -Math.cos(camYaw));
  const r = new Vector3(Math.cos(camYaw), 0, -Math.sin(camYaw));
  const want = new Vector3().addScaledVector(f, input.moveZ).addScaledVector(r, input.moveX);
  const mag = Math.min(1, want.length());
  if (mag > 0) want.normalize();
  const target = (input.run ? RUN : WALK) * mag;
  const cur = Math.hypot(b.vel.x, b.vel.z);
  const nextSpeed = cur + (target - cur) * Math.min(1, dt * (target > cur ? 9 : 12));
  if (mag > 0) {
    b.vel.x = want.x * nextSpeed;
    b.vel.z = want.z * nextSpeed;
    const to = Math.atan2(want.x, want.z);
    let d = to - b.face;
    d = Math.atan2(Math.sin(d), Math.cos(d));
    b.face += d * Math.min(1, dt * 12);
  } else {
    b.vel.x *= Math.max(0, 1 - dt * 12);
    b.vel.z *= Math.max(0, 1 - dt * 12);
  }
  if (input.jump && b.grounded) {
    b.vel.y = 7.4;
    b.grounded = false;
  }
  b.vel.y -= 21 * dt;
  b.pos.y += b.vel.y * dt;
  if (b.pos.y <= 0) {
    b.pos.y = 0;
    b.vel.y = 0;
    b.grounded = true;
  }
  // move in small steps so a fast figure cannot pass through a thin wall
  const dist = Math.hypot(b.vel.x, b.vel.z) * dt;
  const n = Math.max(1, Math.ceil(dist / 0.25));
  for (let i = 0; i < n; i++) {
    b.pos.x += (b.vel.x * dt) / n;
    b.pos.z += (b.vel.z * dt) / n;
    for (let k = 0; k < 2; k++) for (const c of colliders) push(b.pos, c, RADIUS);
    if (!inside(b.pos.x, b.pos.z)) {
      b.pos.x -= (b.vel.x * dt) / n;
      b.pos.z -= (b.vel.z * dt) / n;
    }
  }
  b.speed = Math.hypot(b.vel.x, b.vel.z);
}

/** Distance along a segment (0..1) at which it first enters a collider grown by margin, or 1. */
function hit(ax: number, az: number, bx: number, bz: number, c: Collider, margin: number): number {
  const dx = bx - ax;
  const dz = bz - az;
  if (c.circle) {
    const fx = ax - c.x;
    const fz = az - c.z;
    const R = c.hx + margin;
    const A = dx * dx + dz * dz;
    const B = 2 * (fx * dx + fz * dz);
    const C = fx * fx + fz * fz - R * R;
    if (C < 0) return 1;
    const disc = B * B - 4 * A * C;
    if (disc < 0 || A < 1e-9) return 1;
    const t = (-B - Math.sqrt(disc)) / (2 * A);
    return t >= 0 && t <= 1 ? t : 1;
  }
  const cos = Math.cos(-c.rot);
  const sin = Math.sin(-c.rot);
  const lax = (ax - c.x) * cos - (az - c.z) * sin;
  const laz = (ax - c.x) * sin + (az - c.z) * cos;
  const ldx = dx * cos - dz * sin;
  const ldz = dx * sin + dz * cos;
  const hx = c.hx + margin;
  const hz = c.hz + margin;
  if (Math.abs(lax) < hx && Math.abs(laz) < hz) return 1; // starting inside: ignore
  let t0 = 0;
  let t1 = 1;
  for (const [a, d, h] of [[lax, ldx, hx], [laz, ldz, hz]] as const) {
    if (Math.abs(d) < 1e-9) {
      if (Math.abs(a) > h) return 1;
    } else {
      let ta = (-h - a) / d;
      let tb = (h - a) / d;
      if (ta > tb) [ta, tb] = [tb, ta];
      t0 = Math.max(t0, ta);
      t1 = Math.min(t1, tb);
      if (t0 > t1) return 1;
    }
  }
  return t0;
}

/** Place the camera behind the player, pulled in when a wall or a building is in the way. */
export function followCamera(cam: CamState, target: Vector3, dt: number, colliders: readonly Collider[], reduced: boolean): void {
  const cp = Math.cos(cam.pitch);
  const want = new Vector3(Math.sin(cam.yaw) * cp, Math.sin(cam.pitch), Math.cos(cam.yaw) * cp);
  const head = new Vector3(target.x, target.y + 1.55, target.z);
  let t = 1;
  const far = new Vector3().copy(head).addScaledVector(want, cam.dist);
  for (const c of colliders) {
    if (c.circle && c.hx < 0.8) continue;
    const h = hit(head.x, head.z, far.x, far.z, c, 0.28);
    if (h < t) t = h;
  }
  const dNow = Math.max(1.4, cam.dist * t);
  cam.distNow += (dNow - cam.distNow) * Math.min(1, dt * (dNow < cam.distNow ? 14 : 4));
  const goal = new Vector3().copy(head).addScaledVector(want, cam.distNow);
  goal.y = Math.max(goal.y, 0.5);
  if (reduced) cam.pos.copy(goal);
  else cam.pos.lerp(goal, Math.min(1, dt * 16));
}
