/** The inside of each building: a shell (floor, walls, ceiling, a door to the quay) and its set pieces. */
import type {
  Object3D} from 'three';
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  PointLight,
  SphereGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three';
import { ball, box, cone, cyl, mesh, ring } from './kit';
import { labelTexture, type Mats } from './mat';
import { makeEmitter, spinner, type Animator } from './fx';
import { INTERIOR, SPOTS, type BuildingId } from './layout';
import type { Collider } from './world';
import { makeNpc, type Npc } from './chars';

export interface Interior {
  group: Group;
  colliders: Collider[];
  /** What the camera must not pass through: everything except the entrance wall, so it can pull back outside the room. */
  camBlockers: Collider[];
  npcs: { id: string; npc: Npc; x: number; z: number; ry: number }[];
  update: Animator;
  /** Relics already found stop glinting. */
  setFound(found: ReadonlySet<string>): void;
  setPlayer(p: Vector3): void;
  /** 0..1: how brightly the unfound relics glint (raised when the player lifts the lantern). */
  setSweep(k: number): void;
}

const rnd = (() => {
  let s = 91;
  return () => ((s = (s * 16807) % 2147483647) / 2147483647);
})();

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const mothTex = () =>
  canvasTex(96, 64, (g) => {
    g.clearRect(0, 0, 96, 64);
    g.fillStyle = '#ece9e1';
    g.strokeStyle = '#111';
    g.lineWidth = 3;
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.ellipse(48 + sx * 20, 32, 22, 14, sx * 0.3, 0, 6.3);
      g.fill();
      g.stroke();
    }
    g.fillStyle = '#111';
    g.fillRect(45, 12, 6, 40);
    for (let i = 0; i < 6; i++) g.fillRect(20 + i * 10 + (i > 2 ? 12 : 0), 24 + (i % 2) * 10, 4, 4);
  });
const gradTex = () =>
  canvasTex(32, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, 'rgba(255,255,255,0.9)');
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr;
    g.fillRect(0, 0, 32, 256);
  });
const mapTex = () =>
  canvasTex(512, 384, (g) => {
    g.fillStyle = '#e6e3da';
    g.fillRect(0, 0, 512, 384);
    g.strokeStyle = '#2a2a2a';
    g.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      g.beginPath();
      const cx = 60 + rnd() * 390;
      const cy = 50 + rnd() * 280;
      for (let a = 0; a < 6.3; a += 0.5) g.lineTo(cx + Math.cos(a) * (28 + rnd() * 40), cy + Math.sin(a) * (20 + rnd() * 30));
      g.closePath();
      g.fillStyle = 'rgba(120,120,120,0.45)';
      g.fill();
      g.stroke();
    }
    g.setLineDash([8, 8]);
    g.beginPath();
    g.moveTo(40, 330);
    g.bezierCurveTo(150, 200, 300, 330, 470, 90);
    g.stroke();
    g.setLineDash([]);
    g.fillStyle = '#111';
    g.beginPath();
    g.arc(470, 90, 7, 0, 6.3);
    g.fill();
  });
const noteTex = (seed: number) =>
  canvasTex(128, 160, (g) => {
    g.fillStyle = '#ece9df';
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = '#222';
    for (let i = 0; i < 9; i++) g.fillRect(14, 18 + i * 15, 60 + ((i * 37 + seed * 11) % 44), 4);
  });

export function buildInterior(id: BuildingId, mats: Mats): Interior {
  const { w, d, h } = INTERIOR[id];
  const g = new Group();
  const colliders: Collider[] = [];
  const anims: Animator[] = [];
  const glints: { id: string; m: Mesh }[] = [];
  const lights: PointLight[] = [];
  const add = (...o: Object3D[]) => o.forEach((x) => g.add(x));
  const col = (x: number, z: number, cw: number, cd: number, rot = 0) => colliders.push({ x, z, hx: cw / 2, hz: cd / 2, rot });
  const ccol = (x: number, z: number, r: number) => colliders.push({ x, z, hx: r, hz: r, rot: 0, circle: true });
  const light = (x: number, y: number, z: number, i = 46, dist = 26) => {
    const l = new PointLight(0xffffff, i, dist, 1.5);
    l.position.set(x, y, z);
    g.add(l);
    lights.push(l);
    return l;
  };

  // shared geometry
  const bookMat = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
  const books = new InstancedMesh(new BoxGeometry(1, 1, 1), bookMat, 700);
  books.castShadow = true;
  books.receiveShadow = true;
  let nb = 0;
  const mtx = new Matrix4();
  const addBook = (x: number, y: number, z: number, bw: number, bh: number, bd: number, ry: number, v: number) => {
    if (nb >= 700) return;
    mtx.makeRotationY(ry).scale(new Vector3(bw, bh, bd)).setPosition(x, y + bh / 2, z);
    books.setMatrixAt(nb, mtx);
    books.setColorAt(nb, new Color(v, v, v));
    nb++;
  };
  const bookcase = (x: number, z: number, bw: number, bh: number, ry: number, rows = 5) => {
    const c = new Group();
    c.position.set(x, 0, z);
    c.rotation.y = ry;
    c.add(box(bw, bh, 0.5, mats.darkWood, [0, 0, -0.5]));
    c.add(box(0.12, bh, 1, mats.darkWood, [-bw / 2, 0, 0]), box(0.12, bh, 1, mats.darkWood, [bw / 2, 0, 0]));
    for (let r = 0; r <= rows; r++) c.add(box(bw, 0.1, 1, mats.darkWood, [0, (r * (bh - 0.1)) / rows, 0]));
    g.add(c);
    // books are added in world coordinates
    const cos = Math.cos(ry);
    const sin = Math.sin(ry);
    for (let r = 0; r < rows; r++) {
      let lx = -bw / 2 + 0.2;
      while (lx < bw / 2 - 0.25) {
        const t = 0.09 + rnd() * 0.12;
        const bhh = ((bh - 0.2) / rows) * (0.55 + rnd() * 0.4);
        const lz = 0.05;
        addBook(x + lx * cos + lz * sin, (r * (bh - 0.1)) / rows + 0.1, z - lx * sin + lz * cos, t, bhh, 0.7, ry, 0.12 + rnd() * 0.7);
        lx += t + 0.01;
      }
    }
    col(x, z, ry ? 1 : bw, ry ? bw : 1, 0);
  };
  const lanternHang = (x: number, y: number, z: number, withLight = true, i = 48) => {
    add(cyl(0.02, 0.02, h - y - 0.3, mats.iron, [x, y + 0.5, z], 6), mesh(new SphereGeometry(0.3, 12, 10), mats.bulbLit, [x, y, z], [0, 0, 0], false), cone(0.42, 0.34, mats.iron, [x, y + 0.26, z], 10), cyl(0.3, 0.2, 0.15, mats.iron, [x, y - 0.4, z], 10));
    if (withLight) light(x, y - 0.2, z, i);
  };
  const shaft = (x: number, y: number, z: number, sw: number, len: number, ry: number, tilt: number) => {
    const m = new MeshBasicMaterial({ map: gradTex(), color: new Color(1.5, 1.5, 1.4), transparent: true, opacity: 0.13, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false });
    const o = new Mesh(new PlaneGeometry(sw, len), m);
    o.position.set(x, y, z);
    o.rotation.set(tilt, ry, 0);
    g.add(o);
  };
  const windowPane = (x: number, y: number, z: number, ww: number, wh: number, ry: number) => {
    const wg = new Group();
    wg.position.set(x, y, z);
    wg.rotation.y = ry;
    wg.add(mesh(new PlaneGeometry(ww, wh), mats.glassWarm, [0, wh / 2, 0.02], [0, 0, 0], false), box(ww + 0.4, 0.2, 0.3, mats.darkWood, [0, -0.1, 0]), box(ww + 0.4, 0.2, 0.3, mats.darkWood, [0, wh - 0.1, 0]), box(0.2, wh, 0.3, mats.darkWood, [-ww / 2 - 0.1, 0, 0]), box(0.2, wh, 0.3, mats.darkWood, [ww / 2 + 0.1, 0, 0]), box(0.1, wh, 0.2, mats.darkWood, [0, 0, 0.05]), box(ww, 0.1, 0.2, mats.darkWood, [0, wh / 2, 0.05]));
    g.add(wg);
  };
  const glint = (rid: string, x: number, y: number, z: number) => {
    const m = new Mesh(new SphereGeometry(0.34, 10, 8), new MeshBasicMaterial({ color: new Color(2.4, 2.4, 2.2), transparent: true, opacity: 0.16, blending: AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.set(x, y, z);
    g.add(m);
    glints.push({ id: rid, m });
  };
  const paperAt = (x: number, y: number, z: number, pw: number, ph: number, ry = 0, rx = 0, seed = 1) => {
    const m = new MeshStandardMaterial({ map: noteTex(seed), roughness: 1, side: DoubleSide });
    const p = mesh(new PlaneGeometry(pw, ph), m, [x, y, z], [rx, ry, 0], false);
    p.receiveShadow = false;
    add(p);
    return p;
  };
  const table = (x: number, z: number, tw: number, td: number, th = 1.05, m = mats.wood) => {
    add(box(tw, 0.12, td, m, [x, th, z]));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(box(0.14, th, 0.14, mats.darkWood, [x + sx * (tw / 2 - 0.2), 0, z + sz * (td / 2 - 0.2)]));
    col(x, z, tw, td);
  };
  const barrel = (x: number, z: number, r = 0.55) => {
    add(cyl(r * 0.85, r, r * 2.1, mats.wood, [x, 0, z], 14), ring(r * 0.92, 0.04, mats.iron, [x, r * 0.5, z], [Math.PI / 2, 0, 0], 14), ring(r * 0.92, 0.04, mats.iron, [x, r * 1.5, z], [Math.PI / 2, 0, 0], 14));
    ccol(x, z, r);
  };

  // ------------------------------------------------------------------------------------------ the shell
  const floorMat = id === 'archive' || id === 'hall' ? mats.marble(w / 5, d / 5) : id === 'foundry' || id === 'beacon' ? mats.stone(w / 5, d / 5) : mats.planks(w / 4, d / 4);
  const wallMat = id === 'foundry' || id === 'beacon' ? mats.stone(w / 4, 2) : id === 'hall' ? mats.planks(w / 4, 3) : id === 'archive' ? mats.marble(w / 5, 2) : mats.plaster(w / 4, 2);
  add(box(w, 0.3, d, floorMat, [0, -0.3, 0]));
  add(box(w, h, 0.5, wallMat, [0, 0, -d / 2]), box(0.5, h, d, wallMat, [-w / 2, 0, 0]), box(0.5, h, d, wallMat, [w / 2, 0, 0]));
  // the entrance wall is one-sided: seen from inside, invisible from outside, so the camera can stand back beyond it
  add(mesh(new PlaneGeometry(w, h), wallMat, [0, h / 2, d / 2], [0, Math.PI, 0], false));
  add(box(w, 0.4, d, mats.darkWood, [0, h, 0]));
  for (let x = -w / 2 + 3; x < w / 2; x += 5) add(box(0.5, 0.6, d, mats.darkWood, [x, h - 0.6, 0]));
  for (let z = -d / 2 + 4; z < d / 2; z += 6) add(box(w, 0.4, 0.4, mats.darkWood, [0, h - 0.4, z]));
  add(box(w, 1.1, 0.12, mats.darkWood, [0, 0, -d / 2 + 0.28]), box(0.12, 1.1, d, mats.darkWood, [-w / 2 + 0.28, 0, 0]), box(0.12, 1.1, d, mats.darkWood, [w / 2 - 0.28, 0, 0]));
  colliders.push({ x: 0, z: -d / 2, hx: w / 2, hz: 0.3, rot: 0 }, { x: -w / 2, z: 0, hx: 0.3, hz: d / 2, rot: 0 }, { x: w / 2, z: 0, hx: 0.3, hz: d / 2, rot: 0 });
  const entrance: Collider = { x: 0, z: d / 2, hx: w / 2, hz: 0.3, rot: 0 };
  // the door back to the quay: a bright opening in the south wall
  add(mesh(new PlaneGeometry(3.8, 4.8), mats.darkWood, [0, 2.4, d / 2 - 0.04], [0, Math.PI, 0], false), mesh(new PlaneGeometry(3.2, 4.2), mats.glassWarm, [0, 2.1, d / 2 - 0.08], [0, Math.PI, 0], false));
  colliders.push(entrance);
  light(0, 2.4, d / 2 - 2.5, 18, 12);

  // ------------------------------------------------------------------------------------------ the rooms
  if (id === 'loom') {
    for (const x of [-7, 7]) windowPane(x, 2.2, -d / 2 + 0.3, 2.4, 3.2, 0);
    shaft(-7, 3.2, -6.5, 2.4, 7, 0, 0.35);
    shaft(7, 3.2, -6.5, 2.4, 7, 0, 0.35);
    lanternHang(-6, 5.4, 0);
    lanternHang(6, 5.4, 2);
    // the warp loom
    const lg = new Group();
    lg.position.set(-5.5, 0, -7.4);
    lg.add(box(0.4, 6, 0.4, mats.darkWood, [-3, 0, 0]), box(0.4, 6, 0.4, mats.darkWood, [3, 0, 0]), box(6.8, 0.4, 0.5, mats.wood, [0, 5.4, 0]), box(6.8, 0.4, 0.5, mats.wood, [0, 0.6, 0]), box(6.8, 0.2, 0.3, mats.darkWood, [0, 2.8, 0.2]));
    const threads = new InstancedMesh(new CylinderGeometry(0.012, 0.012, 4.8, 4), mats.paper, 64);
    for (let i = 0; i < 64; i++) {
      mtx.makeTranslation(-3 + (i / 63) * 6, 3.0, 0);
      threads.setMatrixAt(i, mtx);
    }
    lg.add(threads, box(5.8, 1.6, 0.06, mats.cloth(3, 1), [0, 0.9, 0.05]));
    add(lg);
    col(-5.5, -7.4, 7, 1.2);
    paperAt(-6, 4.3, -7.0, 0.8, 1, 0, 0, 3);
    glint('rule-card', -6, 4.3, -6.9);
    // the curator's cabinet
    const cab = new Group();
    cab.position.set(-11.6, 0, -1);
    cab.rotation.y = Math.PI / 2;
    cab.add(box(4.4, 2.6, 1.8, mats.darkWood, [0, 0, 0]), box(4.6, 0.2, 2, mats.wood, [0, 2.6, 0]), mesh(new PlaneGeometry(4, 1.5), new MeshStandardMaterial({ color: 0x121212, roughness: 0.2 }), [0, 2.75, 0], [-Math.PI / 2, 0, 0], false), mesh(new PlaneGeometry(4, 1.5), new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, roughness: 0.05 }), [0, 2.98, 0], [-Math.PI / 2, 0, 0], false));
    for (let i = 0; i < 12; i++) cab.add(mesh(new PlaneGeometry(0.42, 0.3), new MeshStandardMaterial({ map: mothTex(), transparent: true, roughness: 1, alphaTest: 0.3 }), [-1.7 + (i % 6) * 0.68, 2.78, -0.4 + Math.floor(i / 6) * 0.8], [-Math.PI / 2, 0, rnd() * 6], false));
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) cab.add(box(1.3, 0.7, 0.05, mats.wood, [-1.4 + c * 1.4, 0.1 + r * 0.8, 0.92]), ball(0.06, mats.brass, [-1.4 + c * 1.4, 0.45 + r * 0.8, 0.96], 8));
    add(cab);
    col(-11.2, -1, 2, 4.6);
    // Wren and her frame
    const frame = new Group();
    frame.position.set(10.8, 0, -1);
    frame.rotation.y = -Math.PI / 2;
    frame.add(box(0.3, 4.2, 0.3, mats.darkWood, [-2.4, 0, 0]), box(0.3, 4.2, 0.3, mats.darkWood, [2.4, 0, 0]), box(5.2, 0.3, 0.3, mats.wood, [0, 4, 0]), box(4.4, 1.5, 0.12, mats.black, [0, 1.6, 0.1]));
    const needles: Mesh[] = [];
    for (let i = 0; i < 3; i++) {
      frame.add(cyl(0.55, 0.55, 0.08, mats.paper, [-1.4 + i * 1.4, 2.6, 0.2], 24, [Math.PI / 2, 0, 0]));
      const nd = box(0.06, 0.5, 0.04, mats.black, [-1.4 + i * 1.4, 2.3, 0.28]);
      nd.geometry.translate(0, 0.25, 0);
      frame.add(nd);
      needles.push(nd);
    }
    anims.push((_dt, t) => needles.forEach((n, i) => (n.rotation.z = Math.sin(t * 0.6 + i * 2) * 1.0)));
    for (let i = 0; i < 18; i++) frame.add(cyl(0.01, 0.01, 1.4 + (i % 4) * 0.3, mats.paper, [-2.1 + i * 0.25, 3.3, 0.15], 4), ball(0.05, i % 2 ? mats.white : mats.black, [-2.1 + i * 0.25, 2.6 - (i % 4) * 0.3, 0.15], 6));
    add(frame);
    col(10.8, -1, 1, 5.4);
    // weights from the rafters
    const weights: Group[] = [];
    for (let i = 0; i < 6; i++) {
      const wg = new Group();
      const len = 2.2 + (i % 3) * 0.8;
      wg.position.set(4 + i * 0.5, h - 0.4, -4.5 + (i % 2) * 0.5);
      wg.add(cyl(0.012, 0.012, len, mats.paper, [0, -len, 0], 4), ball(0.22, mats.rock, [0, -len - 0.1, 0], 10));
      for (const f of [0.3, 0.55, 0.8]) wg.add(ball(0.05, mats.black, [0, -len * f, 0], 6));
      add(wg);
      weights.push(wg);
    }
    anims.push((_dt, t) => weights.forEach((wg, i) => (wg.rotation.z = Math.sin(t * 0.8 + i) * 0.07)));
    glint('thread-weights', 5.8, 3.6, -4.4);
    // bench and the test cloth
    add(box(3.2, 0.14, 1, mats.wood, [9.2, 0.7, 5]), box(0.14, 0.7, 0.9, mats.darkWood, [7.8, 0, 5]), box(0.14, 0.7, 0.9, mats.darkWood, [10.6, 0, 5]));
    for (let i = 0; i < 3; i++) add(box(1.1 - i * 0.1, 0.12, 0.8, mats.cloth(1, 1), [9.2, 0.14 + i * 0.13, 5.1]));
    col(9.2, 5, 3.4, 1.2);
    glint('test-cloth', 9.2, 1.1, 5);
    // spools on the left wall
    for (let i = 0; i < 12; i++) add(cyl(0.2, 0.2, 0.5, i % 2 ? mats.white : mats.black, [-11.6 + (i % 2) * 0.01, 2 + Math.floor(i / 6) * 0.7, 4 + (i % 6) * 0.9], 10, [0, 0, Math.PI / 2]));
    add(box(0.5, 0.1, 6, mats.wood, [-11.5, 1.7, 6.2]), box(0.5, 0.1, 6, mats.wood, [-11.5, 2.4, 6.2]));
  }

  if (id === 'foundry') {
    windowPane(-8, 3.2, -d / 2 + 0.3, 1.6, 1.6, 0);
    shaft(-8, 4.2, -6.5, 1.8, 6, 0, 0.35);
    lanternHang(-4, 5.6, 1, true, 44);
    lanternHang(5, 5.6, 4, true, 44);
    // anvil on a stump
    add(cyl(0.7, 0.85, 1.0, mats.darkWood, [-9, 0, -3], 14), box(1.9, 0.5, 0.8, mats.iron, [-9, 1.0, -3]), box(1.2, 0.3, 0.6, mats.iron, [-9, 1.5, -3]), cone(0.28, 0.9, mats.iron, [-10.1, 1.45, -3], 10, [0, 0, Math.PI / 2]));
    ccol(-9, -3, 1);
    const sp = makeEmitter({ count: 26, origin: new Vector3(-9, 1.8, -3), spread: 0.5, rise: 3, drift: 2.4, life: 0.9, size: 0.1, grow: 0, color: 0xffffff, alpha: 1, additive: true });
    sp.material.uniforms.color!.value = new Color(5, 4, 3);
    add(sp.points);
    anims.push((dt) => sp.update(dt));
    // order board
    add(box(5, 3.2, 0.2, mats.darkWood, [-9, 1.4, -d / 2 + 0.45]), box(4.6, 2.8, 0.1, mats.wood, [-9, 1.6, -d / 2 + 0.58]));
    for (let i = 0; i < 9; i++) paperAt(-10.8 + (i % 5) * 0.9, 2.3 + Math.floor(i / 5) * 1.2, -d / 2 + 0.7, 0.7, 0.9, 0, 0, i);
    // the forge
    add(box(5.6, 3, 2.6, mats.brick(3, 2), [6, 0, -7.6]), cone(3.4, 2.4, mats.iron, [6, 3, -7.6], 4, [0, Math.PI / 4, 0]), box(1.2, 5, 1.2, mats.brick(1, 3), [6, 3.4, -8.3]));
    add(mesh(new PlaneGeometry(2.6, 1.7), mats.fire, [6, 1.2, -6.28], [0, 0, 0], false));
    const fl = light(6, 1.6, -5.5, 34, 20);
    anims.push((_dt, t) => (fl.intensity = 30 + Math.sin(t * 12) * 4 + Math.sin(t * 27) * 2));
    col(6, -7.6, 5.6, 2.6);
    const em = makeEmitter({ count: 26, origin: new Vector3(6, 2, -6.2), spread: 1.6, rise: 1.8, drift: 0.8, life: 2.2, size: 0.16, grow: 0, color: 0xffffff, alpha: 1, additive: true });
    em.material.uniforms.color!.value = new Color(4, 3, 2);
    add(em.points);
    anims.push((dt) => em.update(dt));
    add(cyl(0.01, 0.01, 1.2, mats.iron, [3.5, h - 2.4, -5.5], 4), cyl(0.01, 0.01, 1.2, mats.iron, [8.5, h - 2.4, -5.5], 4), box(5.2, 0.1, 0.1, mats.iron, [6, h - 2.4, -5.5]));
    for (let i = 0; i < 5; i++) add(cone(0.3, 0.7, mats.wood, [4.2 + i * 0.9, h - 3.3, -5.5], 6));
    glint('five-parts', 6, 4.8, -5.8);
    // the weld bench with its gauge
    table(10, 0.5, 4, 1.6, 1.05, mats.iron);
    add(box(2, 0.1, 0.5, mats.iron, [10, 1.2, 0.5]), mesh(new PlaneGeometry(1.8, 0.07), mats.fire, [10, 1.27, 0.5], [-Math.PI / 2, 0, 0], false));
    const ws = makeEmitter({ count: 22, origin: new Vector3(10, 1.4, 0.5), spread: 0.6, rise: 2.4, drift: 1.8, life: 0.8, size: 0.09, grow: 0, color: 0xffffff, alpha: 1, additive: true });
    ws.material.uniforms.color!.value = new Color(5, 4.4, 3.4);
    add(ws.points);
    anims.push((dt) => ws.update(dt));
    add(cyl(0.06, 0.06, 2.2, mats.iron, [12.4, 0, 0.5], 8), cyl(0.5, 0.5, 0.1, mats.paper, [12.4, 2.3, 0.5], 24, [Math.PI / 2, 0, 0]));
    const gn = box(0.05, 0.45, 0.04, mats.black, [12.4, 2.3, 0.57]);
    gn.geometry.translate(0, 0.22, 0);
    add(gn);
    anims.push((_dt, t) => (gn.rotation.z = Math.sin(t * 0.9) * 1.1));
    // toolbox and the barrels with a cracked weld
    add(box(1.8, 0.8, 0.9, mats.iron, [-9.5, 0, 4.5]), box(1.9, 0.08, 1, mats.iron, [-9.5, 0.84, 4.1], [0.9, 0, 0]));
    paperAt(-9.5, 0.95, 4.6, 0.5, 0.35, 0, -Math.PI / 2, 5);
    col(-9.5, 4.5, 1.9, 1);
    glint('toolbox-note', -9.5, 1.1, 4.5);
    barrel(10.6, 5.2);
    barrel(11.5, 6.4, 0.5);
    add(box(1.8, 2.2, 0.15, mats.iron, [10.3, 0, 7.2], [0.3, 0.2, 0]), mesh(new PlaneGeometry(1.6, 0.05), mats.black, [10.3, 1, 7.28], [0, 0.2, 0.7], false));
    glint('cracked-weld', 10.5, 1.4, 6.2);
    for (let i = 0; i < 4; i++) add(box(0.14, 1.2, 0.04, mats.iron, [-4 + i * 0.5, 2.6, -d / 2 + 0.4], [0, 0, i * 0.4 - 0.5]));
    const gear = new Group();
    gear.position.set(-1, 4.6, -d / 2 + 0.55);
    gear.add(ring(1.2, 0.22, mats.iron, [0, 0, 0], [0, 0, 0], 20));
    for (let i = 0; i < 12; i++) gear.add(box(0.36, 0.5, 0.3, mats.iron, [Math.cos((i / 12) * 6.28) * 1.55, Math.sin((i / 12) * 6.28) * 1.55, 0], [0, 0, (i / 12) * 6.28 - Math.PI / 2]));
    add(gear);
    anims.push(spinner(gear, 'z', 0.3));
    for (let x = -11; x <= 11; x += 22) for (let i = 0; i < 5; i++) add(cyl(0.02, 0.02, 2 + i * 0.4, mats.iron, [x * 0.5 + i * 0.4, h - 1.2, -2 + i], 4));
  }

  if (id === 'beacon') {
    for (const x of [-7, 7]) windowPane(x, 2.6, -d / 2 + 0.3, 2.6, 4.4, 0);
    shaft(-7, 4, -7.5, 2.6, 8, 0, 0.32);
    shaft(7, 4, -7.5, 2.6, 8, 0, 0.32);
    lanternHang(-5, 6, 0, true, 44);
    lanternHang(6, 6, 2, true, 44);
    // the great lamp: a drum of rings that will light
    const lampBase = new Group();
    lampBase.position.set(0, 0, -9);
    lampBase.add(cyl(1.6, 1.8, 1.2, mats.stone(1, 1), [0, 0, 0], 20));
    const glass = new MeshBasicMaterial({ color: new Color(0.6, 0.6, 0.58), toneMapped: false });
    lampBase.add(mesh(new CylinderGeometry(1.4, 1.4, 3.2, 24), glass, [0, 2.8, 0], [0, 0, 0], false));
    for (let i = 0; i < 9; i++) lampBase.add(ring(1.42, 0.05, mats.brass, [0, 1.4 + i * 0.36, 0], [Math.PI / 2, 0, 0], 24));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * 6.28;
      lampBase.add(cyl(0.05, 0.05, 3.4, mats.brass, [Math.cos(a) * 1.5, 1.2, Math.sin(a) * 1.5], 6));
    }
    lampBase.add(cone(1.8, 1, mats.brass, [0, 4.4, 0], 20));
    add(lampBase);
    ccol(0, -9, 2);
    // the brass balance
    const scaleG = new Group();
    scaleG.position.set(-6, 0, -3.5);
    scaleG.add(cyl(1.4, 1.7, 0.4, mats.stone(1, 1), [0, 0, 0], 16), cyl(0.15, 0.2, 3.6, mats.brass, [0, 0.4, 0], 12), ball(0.28, mats.brass, [0, 4.1, 0], 12));
    const beam = new Group();
    beam.position.y = 4.1;
    beam.add(box(5, 0.16, 0.2, mats.brass, [0, -0.08, 0]));
    for (const s of [-1, 1]) {
      beam.add(cyl(0.01, 0.01, 1.9, mats.brass, [s * 2.4, -1.0, 0], 4), cyl(0.5, 0.35, 0.12, mats.brass, [s * 2.4, -2.0, 0], 20));
      const n = s < 0 ? 3 : 8;
      for (let i = 0; i < n; i++) beam.add(ball(0.12, s < 0 ? mats.black : mats.white, [s * 2.4 + ((i % 3) - 1) * 0.2, -1.8 + Math.floor(i / 3) * 0.2, ((i * 7) % 3) * 0.1 - 0.1], 8));
    }
    scaleG.add(beam);
    add(scaleG);
    anims.push((_dt, t) => (beam.rotation.z = Math.sin(t * 0.5) * 0.08 + 0.1));
    ccol(-6, -3.5, 1.7);
    // desk and the forged letter
    table(7, -3.5, 3.4, 1.5);
    paperAt(6.6, 1.13, -3.5, 0.9, 0.6, 0, -Math.PI / 2, 8);
    add(ball(0.12, mats.black, [7, 1.18, -3.4], 8), cyl(0.12, 0.12, 0.25, mats.black, [7.7, 1.1, -3.4], 10), box(0.04, 0.5, 0.04, mats.paper, [7.95, 1.4, -3.4], [0, 0, 0.7]));
    glint('forged-letter', 6.8, 1.5, -3.5);
    // the log chest
    add(box(2.2, 0.9, 1.1, mats.darkWood, [9.5, 0, 3.5]), cyl(0.55, 0.55, 2.2, mats.wood, [9.5, 0.9, 3.5], 12, [0, 0, Math.PI / 2]), box(0.3, 0.4, 0.1, mats.brass, [9.5, 0.55, 4.05]));
    col(9.5, 3.5, 2.4, 1.2);
    glint('sealed-log', 9.5, 1.9, 3.5);
    // the keeper's lens on a stool, wrapped in cloth
    add(cyl(0.45, 0.55, 0.9, mats.darkWood, [-9.5, 0, 3], 12));
    const cl = ball(0.5, mats.cloth(1, 1), [-9.5, 1.4, 3], 14);
    cl.scale.set(1, 0.95, 1);
    add(cl);
    ccol(-9.5, 3, 0.8);
    glint('lens', -9.5, 1.6, 3);
    // a telescope at the window
    add(cyl(0.05, 0.05, 2, mats.darkWood, [-9, 0, -8], 6, [0.3, 0, 0.3]), cyl(0.05, 0.05, 2, mats.darkWood, [-9, 0, -8], 6, [-0.3, 0, 0.3]), cyl(0.18, 0.12, 2.2, mats.brass, [-9, 1.9, -8], 14, [Math.PI / 2 + 0.5, 0, 0.2]));
    ccol(-9, -8, 0.7);
    for (let i = 0; i < 14; i++) add(box(1.8, 0.12, 0.9, mats.stone(1, 1), [-11 + Math.cos(i * 0.5) * 0.5, i * 0.28, 7 - i * 0.55 * 0], [0, i * 0.45, 0]));
  }

  if (id === 'archive') {
    for (const x of [-9, 0, 9]) windowPane(x, 3.6, -d / 2 + 0.3, 2.2, 5.6, 0);
    shaft(-9, 5, -7.5, 2.2, 9, 0, 0.4);
    shaft(9, 5, -7.5, 2.2, 9, 0, 0.4);
    for (const [x, z] of [[-6, 4], [6, 4], [-6, -6], [6, -6], [0, 5]] as [number, number][]) lanternHang(x, 7.2, z, Math.abs(x) + Math.abs(z) > 8, 30);
    for (const sx of [-1, 1]) for (let z = -8; z <= 8; z += 4) {
      add(cyl(0.45, 0.5, h - 0.4, mats.marble(1, 3), [sx * 12.8, 0, z], 16), box(1.3, 0.3, 1.3, mats.marble(1, 1), [sx * 12.8, h - 0.7, z]));
      ccol(sx * 12.8, z, 0.6);
    }
    for (let z = -8; z <= 8; z += 4) bookcase(-13.1, z + 2, 3.6, 5.6, Math.PI / 2, 6);
    // the long table and the seven cards
    table(0, -2.5, 9, 2.4, 1.05, mats.wood);
    for (let i = 0; i < 7; i++) {
      const m = new MeshStandardMaterial({ map: labelTexture(['1', '2', '3', '4', '5', '6', '7'][i]!, 128, 160, i % 2 === 0), roughness: 1, side: DoubleSide });
      add(mesh(new PlaneGeometry(0.75, 0.95), m, [-3.6 + i * 1.2, 1.55, -2.5], [-0.25, 0, 0], false));
      add(box(0.6, 0.08, 0.5, mats.darkWood, [-3.6 + i * 1.2, 1.1, -2.2]));
    }
    // the cabinet marked 1997
    add(box(2.2, 2.6, 1.1, mats.iron, [-11, 0, -4], [0, Math.PI / 2, 0]));
    for (let i = 0; i < 4; i++) add(box(0.05, 0.5, 1.9, mats.darkWood, [-10.4, 0.2 + i * 0.6, -4]), ball(0.05, mats.brass, [-10.38, 0.45 + i * 0.6, -4], 6));
    paperAt(-10.4, 2.7, -4, 0.6, 0.4, Math.PI / 2, -Math.PI / 2, 4);
    ccol(-11, -4, 1.4);
    glint('first-chess', -10.8, 3.1, -4);
    // ledger shelves and a ladder, with a strip of typed paper
    bookcase(-4, -8.9, 6, 6.2, 0, 6);
    paperAt(-4.4, 3.1, -8.3, 0.2, 1.2, 0, 0, 9);
    add(box(0.12, 6.2, 0.05, mats.wood, [-2.4, 0, -8], [0, 0, 0.18]), box(0.12, 6.2, 0.05, mats.wood, [-1.9, 0, -8], [0, 0, 0.18]));
    glint('eliza-slip', -4.4, 3.4, -8.3);
    // the display case with the chip
    add(box(2.2, 1.1, 1.6, mats.darkWood, [9.5, 0, -5]), box(2.2, 1.7, 1.6, new MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.14, roughness: 0.05 }), [9.5, 1.1, -5]), box(0.9, 0.08, 0.9, mats.black, [9.5, 1.15, -5]));
    for (let i = 0; i < 6; i++) add(box(0.9, 0.02, 0.02, mats.brass, [9.5, 1.25, -5.4 + i * 0.16]), box(0.02, 0.02, 0.9, mats.brass, [9.1 + i * 0.16, 1.25, -5]));
    light(9.5, 3.2, -5, 14, 8);
    col(9.5, -5, 2.4, 1.8);
    glint('gpu-plate', 9.5, 2.1, -5);
    bookcase(12.7, 4, 5.2, 6.6, -Math.PI / 2, 7);
  }

  if (id === 'hall') {
    for (const x of [-9, 9]) windowPane(x, 3.6, -d / 2 + 0.3, 2.2, 5.4, 0);
    shaft(-9, 5, -7.5, 2.2, 9, 0, 0.4);
    shaft(9, 5, -7.5, 2.2, 9, 0, 0.4);
    for (const [x, z] of [[-6, 0], [6, 0], [0, -6]] as [number, number][]) {
      add(cyl(0.02, 0.02, 2.6, mats.iron, [x, h - 2.4, z], 4), ring(1.0, 0.06, mats.iron, [x, h - 2.5, z], [Math.PI / 2, 0, 0], 20));
      for (let i = 0; i < 8; i++) add(mesh(new SphereGeometry(0.09, 6, 6), mats.bulbLit, [x + Math.cos((i / 8) * 6.28), h - 2.4, z + Math.sin((i / 8) * 6.28)], [0, 0, 0], false));
      light(x, h - 3, z, 34, 24);
    }
    for (const sx of [-1, 1]) for (let z = -7; z <= 7; z += 3.5) {
      add(cyl(0.4, 0.45, h - 0.4, mats.marble(1, 3), [sx * 13, 0, z], 16));
      ccol(sx * 13, z, 0.5);
    }
    // the judge's bench on a dais
    add(box(8, 0.5, 4, mats.stone(2, 1), [0, 0, -6.8]), box(7, 1.3, 1.8, mats.darkWood, [0, 0.5, -7.4]), box(7.4, 0.14, 2, mats.wood, [0, 1.8, -7.3]), box(0.9, 1.4, 0.6, mats.darkWood, [0, 0.5, -8.6]));
    paperAt(0, 1.95, -7.1, 0.8, 0.55, 0, -Math.PI / 2, 2);
    add(box(0.4, 0.2, 0.2, mats.wood, [1.6, 1.95, -7.1]), cyl(0.04, 0.04, 0.4, mats.darkWood, [1.6, 2.05, -7.1], 6, [0, 0, 0.9]));
    col(0, -7.2, 7.4, 2);
    glint('verdict-form', 0, 2.3, -6.9);
    // the witness stand
    add(box(2.2, 1.3, 1.6, mats.darkWood, [6, 0, -1]), box(0.1, 0.9, 1.6, mats.wood, [4.95, 1.3, -1]), box(0.1, 0.9, 1.6, mats.wood, [7.05, 1.3, -1]), box(2.2, 0.1, 0.1, mats.wood, [6, 2.1, -0.2]));
    paperAt(6.4, 0.03, 0.2, 0.5, 0.35, 0, -Math.PI / 2, 6);
    col(6, -1, 2.4, 1.8);
    glint('consent-slip', 6.4, 0.5, 0.2);
    // the case-file wall: six frames
    add(box(5.6, 3.4, 0.2, mats.darkWood, [-9, 1.4, -d / 2 + 0.45]));
    for (let i = 0; i < 6; i++) paperAt(-10.6 + (i % 3) * 1.6, 2.7 - Math.floor(i / 3) * 1.4 + 0.2, -d / 2 + 0.6, 1.2, 1.1, 0, 0, 20 + i);
    add(box(4, 0.12, 1.4, mats.wood, [-9, 0.9, -8.2]));
    // the examination door
    add(box(5.2, 6.2, 0.4, mats.darkWood, [10, 0, -d / 2 + 0.45]), box(4.6, 5.6, 0.3, mats.black, [10, 0, -d / 2 + 0.6]), mesh(new PlaneGeometry(0.08, 5.4), mats.fire, [10, 0.1, -d / 2 + 0.78], [0, 0, 0], false), ball(0.6, mats.brass, [10, 5.6, -d / 2 + 0.8], 14));
    for (const sx of [-1, 1]) add(cyl(0.04, 0.04, 1.4, mats.iron, [10 + sx * 3.2, 2.5, -d / 2 + 0.8], 6), mesh(new SphereGeometry(0.22, 8, 6), mats.bulbLit, [10 + sx * 3.2, 3.9, -d / 2 + 0.8], [0, 0, 0], false));
    // benches for the gallery
    for (const z of [3, 6]) for (const sx of [-1, 1]) {
      add(box(5, 0.14, 0.9, mats.wood, [sx * 5, 0.6, z]), box(5, 1.1, 0.12, mats.darkWood, [sx * 5, 0.2, z + 0.5]));
      col(sx * 5, z, 5, 1);
    }
  }

  if (id === 'office') {
    windowPane(-6, 2.2, -d / 2 + 0.3, 2.6, 2.8, 0);
    windowPane(6.5, 2.2, -d / 2 + 0.3, 2.6, 2.8, 0);
    shaft(-6, 3.4, -5.5, 2.6, 5, 0, 0.35);
    lanternHang(-3, 4.8, 1, true, 44);
    lanternHang(4, 4.8, -2, true, 44);
    // mission board
    add(box(5, 3, 0.2, mats.darkWood, [-6, 1.4, -d / 2 + 0.45]), box(4.6, 2.6, 0.1, mats.cloth(2, 1), [-6, 1.6, -d / 2 + 0.58]));
    for (let i = 0; i < 10; i++) paperAt(-7.9 + (i % 5) * 0.95, 2.5 - Math.floor(i / 5) * 1.2 + 0.2, -d / 2 + 0.7, 0.7, 0.85, 0, 0, 40 + i);
    paperAt(-2.4, 2.5, -d / 2 + 0.7, 0.6, 0.8, 0, 0, 50);
    glint('kernel-log', -2.4, 2.9, -d / 2 + 0.8);
    // the logbook on a lectern
    add(cyl(0.12, 0.2, 1.5, mats.darkWood, [1.5, 0, -3], 8), box(1.4, 0.1, 1, mats.wood, [1.5, 1.5, -3], [0.4, 0, 0]));
    add(box(0.6, 0.04, 0.8, mats.paper, [1.25, 1.62, -3], [0.4, 0, 0.05]), box(0.6, 0.04, 0.8, mats.paper, [1.78, 1.62, -3], [0.4, 0, -0.05]));
    ccol(1.5, -3, 0.9);
    // the codex cabinet
    bookcase(6, -d / 2 + 1, 4.2, 3.8, 0, 4);
    for (let i = 0; i < 6; i++) add(cyl(0.12, 0.12, 0.7, mats.paper, [4.9 + (i % 3) * 1.1, 0.9 + Math.floor(i / 3) * 1.2, -d / 2 + 1.1], 8, [0, 0, Math.PI / 2]));
    // the chart table with a harbor chart
    table(6, 2, 4, 2.4, 1.05, mats.wood);
    add(mesh(new PlaneGeometry(3.6, 2.1), new MeshStandardMaterial({ map: mapTex(), roughness: 1 }), [6, 1.13, 2], [-Math.PI / 2, 0, 0], false));
    // a stove, a rug and a cushion for Kernel
    add(cyl(0.7, 0.8, 1.6, mats.iron, [-8.2, 0, 4.8], 14), cyl(0.12, 0.12, 4, mats.iron, [-8.2, 1.6, 4.8], 8), mesh(new PlaneGeometry(0.6, 0.4), mats.fire, [-7.5, 0.8, 4.8], [0, Math.PI / 2, 0], false));
    const sl = light(-7.2, 0.9, 4.8, 18, 9);
    anims.push((_dt, t) => (sl.intensity = 16 + Math.sin(t * 9) * 2));
    ccol(-8.2, 4.8, 1);
    add(mesh(new PlaneGeometry(6, 4), mats.cloth(3, 2), [-1, 0.01, 3], [-Math.PI / 2, 0, 0], false));
  }

  // ------------------------------------------------------------------------------------------ people and finishing
  const npcs: Interior['npcs'] = [];
  for (const s of SPOTS[id]) {
    if (s.kind === 'npc') {
      const npc = makeNpc(s.id as 'wren' | 'brannock' | 'sedge', mats);
      npc.group.position.set(s.x, 0, s.z);
      g.add(npc.group);
      npcs.push({ id: s.id, npc, x: s.x, z: s.z, ry: 0 });
      ccol(s.x, s.z, 0.7);
    }
  }
  books.count = nb;
  books.instanceMatrix.needsUpdate = true;
  if (books.instanceColor) books.instanceColor.needsUpdate = true;
  g.add(books);

  let sweep = 0;
  let foundSet: ReadonlySet<string> = new Set();
  return {
    group: g,
    colliders,
    camBlockers: colliders.filter((c) => c !== entrance),
    npcs,
    update(dt, t) {
      anims.forEach((a) => a(dt, t));
      for (const gl of glints) {
        const on = !foundSet.has(gl.id);
        gl.m.visible = on;
        if (on) {
          const k = 0.7 + Math.sin(t * 2.4 + gl.m.position.x) * 0.3;
          gl.m.scale.setScalar(k * (1 + sweep * 2.2));
          (gl.m.material as MeshBasicMaterial).opacity = 0.14 + sweep * 0.5;
        }
      }
    },
    setFound(f) {
      foundSet = f;
    },
    setPlayer() {},
    setSweep(k) {
      sweep = k;
    },
  };
}
