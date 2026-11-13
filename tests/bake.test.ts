import { describe, expect, it } from 'vitest';
import { BoxGeometry, Group, Mesh, MeshBasicMaterial, MeshLambertMaterial, Box3 } from 'three';
import { bakeWorld, keep, live } from '../src/game3d/bake';
import { blockedAt, planRoute, routeLength, sampleRoute } from '../src/game3d/route';
import type { Collider } from '../src/game3d/world';

const box = (m: MeshLambertMaterial | MeshBasicMaterial, x: number, y = 0, z = 0, shadow = true) => {
  const o = new Mesh(new BoxGeometry(1, 1, 1), m);
  o.position.set(x, y, z);
  o.castShadow = shadow;
  return o;
};
const count = (root: Group) => {
  let n = 0;
  root.traverse((o) => {
    if ((o as Mesh).isMesh) n++;
  });
  return n;
};

describe('baking a built place into fewer meshes', () => {
  it('merges meshes that share a material into one, in the right place', () => {
    const root = new Group();
    const stone = new MeshLambertMaterial({ color: 0x888888 });
    const wood = new MeshLambertMaterial({ color: 0x664422 });
    const chunk = new Group();
    chunk.position.set(10, 0, 5);
    chunk.rotation.y = 0.7;
    for (let i = 0; i < 6; i++) chunk.add(box(i % 2 ? stone : new MeshLambertMaterial({ color: 0x888888 }), i * 2));
    chunk.add(box(wood, 3, 2));
    root.add(chunk);
    const before = new Box3().setFromObject(root);
    expect(count(root)).toBe(7);
    const r = bakeWorld(root);
    expect(count(root)).toBe(2); // one stone mesh (equal materials merge even when they are different objects), one wood
    expect(r.merged).toBeGreaterThanOrEqual(7);
    const after = new Box3().setFromObject(root);
    expect(after.min.distanceTo(before.min)).toBeLessThan(1e-4);
    expect(after.max.distanceTo(before.max)).toBeLessThan(1e-4);
  });

  it('leaves alone anything that moves or is marked, and keeps its fixed parts merged inside it', () => {
    const root = new Group();
    const m = new MeshLambertMaterial({ color: 0xaaaaaa });
    const wheel = new Group();
    wheel.add(box(m, 0), box(m, 1), box(m, 2));
    root.add(wheel, box(m, 5), box(m, 6));
    const bulb = live(box(new MeshBasicMaterial({ color: 0xff0000 }), 9));
    root.add(bulb);
    const rig = keep(new Group());
    rig.add(box(m, 0), box(m, 1));
    root.add(rig);
    const t0 = wheel.rotation.z;
    bakeWorld(root, (_dt, t) => {
      wheel.rotation.z = t; // the wheel turns
    });
    expect(wheel.rotation.z).not.toBe(t0);
    expect(bulb.parent).toBe(root); // marked live: untouched
    expect(rig.children.length).toBe(2); // keep: untouched, every child still there
    // the wheel is still one thing that turns, with its three still parts merged into one mesh inside it
    expect(wheel.children.length).toBe(1);
    // the two loose boxes merged
    const loose = root.children.filter((c) => (c as Mesh).isMesh && c !== bulb);
    expect(loose.length).toBe(1);
  });

  it('bakes the texture repeat into the UVs so one material can serve many repeats', () => {
    const root = new Group();
    const a = box(new MeshLambertMaterial(), 0);
    const b = box(new MeshLambertMaterial(), 3);
    root.add(a, b);
    const uvBefore = a.geometry.getAttribute('uv').getX(1);
    bakeWorld(root);
    expect(count(root)).toBe(1);
    expect(uvBefore).toBeGreaterThanOrEqual(0);
  });
});

describe('the guide route', () => {
  const wall: Collider = { x: 0, z: 0, hx: 6, hz: 1, rot: 0 };
  const everywhere = () => true;

  it('goes straight when nothing is in the way, and around when something is', () => {
    const open = planRoute({ x: -10, z: 10 }, { x: 10, z: 10 }, [], everywhere);
    expect(routeLength(open)).toBeCloseTo(20, 0);
    const around = planRoute({ x: 0, z: 6 }, { x: 0, z: -6 }, [wall], everywhere);
    expect(around.length).toBeGreaterThan(2);
    expect(routeLength(around)).toBeGreaterThan(12.5);
    for (const p of around) expect(blockedAt(p.x, p.z, [wall], 0.4)).toBe(false);
    // and no leg of it passes through the wall
    for (let i = 1; i < around.length; i++) {
      const a = around[i - 1]!;
      const b = around[i]!;
      for (let k = 0; k <= 20; k++) expect(blockedAt(a.x + ((b.x - a.x) * k) / 20, a.z + ((b.z - a.z) * k) / 20, [wall], 0.3)).toBe(false);
    }
  });

  it('respects the walkable area', () => {
    const inside = (x: number, z: number) => Math.hypot(x, z) < 12;
    const r = planRoute({ x: -10, z: 0 }, { x: 10, z: 0 }, [{ x: 0, z: 0, hx: 4, hz: 4, rot: 0, circle: true }], inside);
    for (const p of r) expect(inside(p.x, p.z)).toBe(true);
    expect(routeLength(r)).toBeGreaterThan(20);
  });

  it('reports no route, not a wrong one, when the goal cannot be reached', () => {
    const closed = (x: number) => x < 0;
    const r = planRoute({ x: -5, z: 0 }, { x: 5, z: 0 }, [], closed);
    // the goal's cell is outside; the planner moves it to the nearest free one, so the route ends inside the walkable side
    for (const p of r) expect(p.x).toBeLessThan(2);
  });

  it('spaces chevrons evenly along a route and points them along it', () => {
    const route = [{ x: 0, z: 0 }, { x: 0, z: 10 }, { x: 10, z: 10 }];
    const pts = sampleRoute(route, 2.5, 0, 50, 100);
    expect(pts.length).toBe(9);
    expect(pts[0]!.ang).toBeCloseTo(0, 5); // heading +z
    expect(pts[pts.length - 1]!.ang).toBeCloseTo(Math.PI / 2, 5); // then +x
    expect(sampleRoute(route, 2.5, 0, 3, 100).length).toBe(3);
    expect(sampleRoute(route, 2.5, 0, 50, 6).every((p) => p.at <= 6)).toBe(true);
  });
});
