/** The outdoor world: the harbor plaza and everything around it. */
import {
  AdditiveBlending,
  CanvasTexture,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace,
  SphereGeometry,
  Vector3,
  type Camera,
} from 'three';
import { ball, box, cone, cyl, gable, group, mesh, plane, ring, roof } from './kit';
import { bakeWorld, live, stripLights } from './bake';
import { labelTexture, type Mats } from './mat';
import { makeEmitter, makeFlag, makeGull, makeMotes, makeWater, spinner, type Animator } from './fx';
import { BUILD_DEPTH, LAMP_COUNT, PLAZA_R, QUAY_Z, building, lampPos, onArc, type BuildingId } from './layout';

export interface Collider {
  x: number;
  z: number;
  hx: number;
  hz: number;
  rot: number;
  circle?: boolean;
}

export interface Lamp {
  x: number;
  z: number;
  lit: boolean;
  /** Index of its bulb in the instanced bulb mesh. */
  index: number;
}

export interface Harbor {
  group: Group;
  colliders: Collider[];
  lamps: Lamp[];
  setLit(lit: boolean[]): void;
  update(dt: number, t: number, player: Vector3, camera: Camera): void;
  water: ReturnType<typeof makeWater>;
}

const circle = (x: number, z: number, r: number): Collider => ({ x, z, hx: r, hz: r, rot: 0, circle: true });
const rect = (x: number, z: number, w: number, d: number, rot = 0): Collider => ({ x, z, hx: w / 2, hz: d / 2, rot });

/** A point in a building's own frame (door toward +z), in world coordinates. */
function toWorld(id: BuildingId, lx: number, ly: number, lz: number): Vector3 {
  const b = building(id);
  return new Vector3(lx, ly, lz).applyAxisAngle(new Vector3(0, 1, 0), b.ry).add(new Vector3(b.x, 0, b.z));
}

function plazaTexture(): CanvasTexture {
  const S = 1024;
  const c = document.createElement('canvas');
  c.width = c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = '#b9b8b3';
  g.fillRect(0, 0, S, S);
  const rnd = (() => {
    let a = 77;
    return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  })();
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * S;
    const y = rnd() * S;
    const r = 8 + rnd() * 9;
    g.fillStyle = `rgb(${165 + rnd() * 30},${165 + rnd() * 30},${160 + rnd() * 30})`;
    g.beginPath();
    g.ellipse(x, y, r, r * (0.75 + rnd() * 0.25), rnd() * 3, 0, 6.3);
    g.fill();
    g.strokeStyle = 'rgba(70,70,70,0.22)';
    g.lineWidth = 1.5;
    g.stroke();
  }
  // rings and a compass rose in dark and pale stone
  g.translate(S / 2, S / 2);
  const ringAt = (r: number, w: number, col: string) => {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.beginPath();
    g.arc(0, 0, r, 0, 6.3);
    g.stroke();
  };
  ringAt(500, 8, '#2a2a2a');
  ringAt(478, 4, '#e8e6e0');
  ringAt(330, 7, '#e3122a');
  ringAt(180, 5, '#e8e6e0');
  for (let i = 0; i < 16; i++) {
    g.save();
    g.rotate((i / 16) * Math.PI * 2);
    const long = i % 4 === 0;
    // the compass rose is drawn as outlined spikes (paper with an ink edge), so the plaza stays bright and the red path can lead
    g.fillStyle = '#f4f2ec';
    g.strokeStyle = '#171717';
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(0, -(long ? 330 : 240));
    g.lineTo(26, -60);
    g.lineTo(-26, -60);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  }
  for (let i = 0; i < 48; i++) {
    g.save();
    g.rotate((i / 48) * Math.PI * 2);
    g.fillStyle = '#e8e6e0';
    g.beginPath();
    g.moveTo(0, -488);
    g.lineTo(9, -470);
    g.lineTo(-9, -470);
    g.fill();
    g.restore();
  }
  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function buildHarbor(mats: Mats, sunDir: Vector3, fogDensity: number): Harbor {
  const root = new Group();
  /** One chunk for the lamp posts, benches, crates and the signal post, so they merge together. */
  const props = new Group();
  root.add(props);
  const colliders: Collider[] = [];
  const anims: Animator[] = [];
  const lamps: Lamp[] = [];

  // ------------------------------------------------------------------------------------------ ground
  const groundMat = mats.cobble(40, 40);
  const ground = mesh(new PlaneGeometry(320, 190), groundMat, [0, -0.02, -59], [-Math.PI / 2, 0, 0], false);
  const plazaMat = new MeshLambertMaterial({ map: plazaTexture() });
  const plaza = mesh(new CircleGeometry(PLAZA_R + 4, 96), plazaMat, [0, 0.015, 0], [-Math.PI / 2, 0, 0], false);
  root.add(ground, plaza);

  // the quay wall, and the sea
  const wallMat = mats.stone(30, 2);
  root.add(box(140, 2.6, 1.6, wallMat, [0, -2.2, QUAY_Z + 0.4]), box(140, 0.35, 2.2, mats.marble(30, 1), [0, 0.18, QUAY_Z - 0.1]));
  root.add(box(1.6, 3, 90, wallMat, [-70, -2.4, 0]), box(1.6, 3, 90, wallMat, [70, -2.4, 0]));
  for (let x = -54; x <= 54; x += 9) {
    root.add(cyl(0.35, 0.42, 0.9, mats.iron, [x, 0.3, QUAY_Z - 0.9], 10), ball(0.38, mats.iron, [x, 1.25, QUAY_Z - 0.9], 10));
  }
  const water = makeWater(sunDir, fogDensity, QUAY_Z);
  root.add(water.mesh);

  // ------------------------------------------------------------------------------------------ the monument
  const mon = new Group();
  mon.add(cyl(7.4, 7.8, 0.6, mats.stone(6, 1), [0, 0, 0], 48), cyl(6.2, 6.6, 0.9, mats.stone(5, 1), [0, 0.6, 0], 48));
  const basin = mesh(new CircleGeometry(5.6, 40), new MeshLambertMaterial({ color: new Color(0.03, 0.03, 0.035) }), [0, 1.42, 0], [-Math.PI / 2, 0, 0], false);
  mon.add(basin);
  mon.add(cyl(1.1, 1.5, 1.4, mats.marble(2, 2), [0, 1.4, 0], 20), cyl(0.7, 0.9, 4.6, mats.marble(1, 3), [0, 2.8, 0], 20), cyl(1.3, 0.8, 0.5, mats.marble(2, 1), [0, 7.2, 0], 20));
  const cageGlow = new MeshBasicMaterial({ color: new Color(6, 0.4, 0.5), toneMapped: false });
  const lanternHead = new Group();
  lanternHead.position.y = 7.7;
  lanternHead.add(mesh(new CylinderGeometry(1.2, 1.2, 2.4, 8), cageGlow, [0, 1.2, 0], [0, 0, 0], false));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    lanternHead.add(cyl(0.07, 0.07, 2.6, mats.iron, [Math.cos(a) * 1.25, 0, Math.sin(a) * 1.25], 6));
  }
  lanternHead.add(ring(1.25, 0.07, mats.iron, [0, 0.05, 0], [Math.PI / 2, 0, 0], 8), ring(1.25, 0.07, mats.iron, [0, 2.45, 0], [Math.PI / 2, 0, 0], 8), cone(1.7, 1.3, mats.iron, [0, 2.4, 0], 8), ball(0.2, mats.iron, [0, 3.85, 0], 8));
  const monLight = new PointLight(0xffffff, 40, 32, 1.4);
  monLight.position.set(0, 9, 0);
  lanternHead.add(monLight);
  mon.add(lanternHead);
  // every bulb in the harbor is one instance of one mesh: unlit ones are dark ink, lit ones glow red
  const BULB_OFF = new Color(0.22, 0.22, 0.22);
  const BULB_ON = new Color(6, 0.4, 0.5);
  const bulbMat = new MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const hangBulbs = new InstancedMesh(new SphereGeometry(0.2, 10, 8), bulbMat, LAMP_COUNT);
  const lampBulbs = new InstancedMesh(new SphereGeometry(0.28, 12, 10), bulbMat, LAMP_COUNT);
  const bm4 = new Matrix4();
  for (let i = 0; i < LAMP_COUNT; i++) {
    const a = (i / LAMP_COUNT) * Math.PI * 2;
    const arm = new Group();
    const ax = Math.cos(a) * 2.9;
    const ay = 6.4 - (i % 3) * 0.5;
    const az = Math.sin(a) * 2.9;
    arm.position.set(ax, ay, az);
    arm.add(cyl(0.015, 0.015, 1.2, mats.iron, [0, 0, 0]));
    mon.add(arm);
    hangBulbs.setMatrixAt(i, bm4.makeTranslation(ax, ay - 0.1, az));
    hangBulbs.setColorAt(i, BULB_OFF);
  }
  root.add(hangBulbs);
  mon.add(ring(2.9, 0.05, mats.iron, [0, 7.0, 0], [Math.PI / 2, 0, 0], 32));
  root.add(mon);
  colliders.push(circle(0, 0, 7.7));
  anims.push((dt) => {
    lanternHead.rotation.y += dt * 0.15;
  });
  const spray = makeEmitter({ count: 70, origin: new Vector3(0, 6.6, 0), spread: 0.6, rise: 0.2, drift: 1.6, life: 2.6, size: 0.35, grow: 0.8, color: 0xffffff, alpha: 0.4, additive: true });
  root.add(spray.points);

  // ------------------------------------------------------------------------------------------ the lamps
  for (let i = 0; i < LAMP_COUNT; i++) {
    const p = lampPos(i);
    const l = new Group();
    l.position.set(p.x, 0, p.z);
    l.add(cyl(0.22, 0.3, 0.5, mats.iron, [0, 0, 0], 10), cyl(0.07, 0.1, 3.6, mats.iron, [0, 0.4, 0], 8));
    lampBulbs.setMatrixAt(i, bm4.makeTranslation(p.x, 4.35, p.z));
    lampBulbs.setColorAt(i, BULB_OFF);
    l.add(cone(0.5, 0.45, mats.iron, [0, 4.55, 0], 8), ring(0.31, 0.03, mats.iron, [0, 4.15, 0], [Math.PI / 2, 0, 0], 10), cyl(0.3, 0.2, 0.2, mats.iron, [0, 3.85, 0], 8));
    props.add(l);
    lamps.push({ x: p.x, z: p.z, lit: false, index: i });
    colliders.push(circle(p.x, p.z, 0.35));
  }

  root.add(lampBulbs);

  // ------------------------------------------------------------------------------------------ buildings
  const buildingGroup = (id: BuildingId) => {
    const b = building(id);
    const g = new Group();
    g.position.set(b.x, 0, b.z);
    g.rotation.y = b.ry;
    root.add(g);
    return g;
  };
  const door = (g: Group, z: number, w = 2.8, h = 3.8, light = true) => {
    g.add(box(w + 0.7, h + 0.45, 0.5, mats.marble(1, 1), [0, 0, z - 0.1]), box(w, h, 0.4, mats.red, [0, 0, z + 0.05]), box(0.1, h, 0.1, mats.brass, [0, 0, z + 0.32]));
    g.add(mesh(new SphereGeometry(0.09, 8, 6), mats.brass, [w * 0.3, 1.7, z + 0.34], [0, 0, 0], false), mesh(new SphereGeometry(0.09, 8, 6), mats.brass, [-w * 0.3, 1.7, z + 0.34], [0, 0, 0], false));
    if (light) {
      for (const sx of [-1, 1]) {
        const lan = new Group();
        lan.position.set(sx * (w / 2 + 0.9), h * 0.7, z + 0.6);
        lan.add(cyl(0.03, 0.03, 0.8, mats.iron, [0, -0.4, -0.2], 6, [Math.PI / 2, 0, 0]), mesh(new SphereGeometry(0.2, 10, 8), mats.bulbLit, [0, 0, 0], [0, 0, 0], false), cone(0.28, 0.25, mats.iron, [0, 0.12, 0], 8));
        g.add(lan);
      }
    }
  };
  const windowAt = (g: Group, x: number, y: number, z: number, w = 1.5, h = 2.1, ry = 0) => {
    const wg = new Group();
    wg.position.set(x, y, z);
    wg.rotation.y = ry;
    wg.add(mesh(new PlaneGeometry(w, h), mats.glassWarm, [0, h / 2, 0.06], [0, 0, 0], false), box(w + 0.3, 0.14, 0.2, mats.darkWood, [0, -0.07, 0.1]), box(w + 0.3, 0.14, 0.2, mats.darkWood, [0, h - 0.07, 0.1]), box(0.14, h, 0.2, mats.darkWood, [-w / 2 - 0.08, 0, 0.1]), box(0.14, h, 0.2, mats.darkWood, [w / 2 + 0.08, 0, 0.1]), box(0.06, h, 0.1, mats.darkWood, [0, 0, 0.12]), box(w, 0.06, 0.1, mats.darkWood, [0, h / 2, 0.12]));
    g.add(wg);
  };
  const sign = (g: Group, text: string, x: number, y: number, z: number, w = 5, dark = false) => {
    const m = new MeshLambertMaterial({ map: labelTexture(text, 512, 128, dark) });
    g.add(mesh(new PlaneGeometry(w, w / 4), m, [x, y, z], [0, 0, 0], false), box(w + 0.3, 0.16, 0.16, mats.darkWood, [x, y + w / 8 + 0.12, z - 0.05]), box(w + 0.3, 0.16, 0.16, mats.darkWood, [x, y - w / 8 - 0.28, z - 0.05]));
  };
  const steps = (g: Group, w: number, z: number, n = 3, rise = 0.22, dep = 0.7, m = mats.stone(4, 1)) => {
    for (let i = 0; i < n; i++) g.add(box(w - i * 0.2, rise * (n - i), dep, m, [0, 0, z + dep * i]));
  };

  // Loom House: timber frame and plaster, a steep tiled roof, a slow loom wheel
  {
    const g = buildingGroup('loom');
    const W = 16;
    const D = BUILD_DEPTH;
    g.add(box(W, 6.4, D, mats.plaster(4, 3), [0, 0, 0]));
    for (const x of [-W / 2, -4, 0, 4, W / 2]) g.add(box(0.4, 6.4, 0.4, mats.darkWood, [x, 0, D / 2 + 0.02]));
    g.add(box(W, 0.4, 0.4, mats.darkWood, [0, 3.2, D / 2 + 0.02]), box(W, 0.4, 0.4, mats.darkWood, [0, 6.2, D / 2 + 0.02]));
    g.add(box(0.3, 4.6, 0.3, mats.darkWood, [-2, 0, D / 2 + 0.05], [0, 0, 0.6]), box(0.3, 4.6, 0.3, mats.darkWood, [2, 0, D / 2 + 0.05], [0, 0, -0.6]));
    g.add(roof(W, D, 4.4, mats.tilesRed(6, 3), [0, 6.4, 0], 1.1), gable(W + 0.2, 4.4, mats.plaster(3, 2), [0, 6.4, D / 2 + 0.02]), gable(W + 0.2, 4.4, mats.plaster(3, 2), [0, 6.4, -D / 2 - 0.02], true));
    g.add(box(1.2, 4, 1.2, mats.brick(1, 2), [4.8, 8, -3]));
    door(g, D / 2 + 0.2, 2.8, 3.6);
    steps(g, 5, D / 2 + 0.2, 2);
    windowAt(g, -5.2, 1.4, D / 2 + 0.15);
    windowAt(g, 5.2, 1.4, D / 2 + 0.15);
    windowAt(g, -5.2, 4.1, D / 2 + 0.15, 1.3, 1.4);
    windowAt(g, 5.2, 4.1, D / 2 + 0.15, 1.3, 1.4);
    const wheel = new Group();
    wheel.position.set(0, 9.3, D / 2 + 0.3);
    wheel.add(ring(1.5, 0.12, mats.darkWood, [0, 0, 0], [0, 0, 0], 28), ring(0.4, 0.1, mats.iron, [0, 0, 0], [0, 0, 0], 12));
    for (let i = 0; i < 8; i++) wheel.add(box(0.09, 1.5, 0.08, mats.darkWood, [0, 0, 0], [0, 0, (i / 8) * Math.PI * 2]));
    g.add(wheel);
    anims.push(spinner(wheel, 'z', 0.35));
    sign(g, 'LOOM HOUSE', 0, 4.9, D / 2 + 0.6, 4.2);
    colliders.push(rect(building('loom').x, building('loom').z, W, D, building('loom').ry));
    const sm = makeEmitter({ count: 22, origin: new Vector3(0, 0, 0), spread: 0.3, rise: 0.8, drift: 0.35, life: 5, size: 2.4, grow: 2, color: 0xbdbdbd, alpha: 0.28, additive: false });
    sm.points.position.copy(toWorld('loom', 4.8, 12, -3));
    root.add(sm.points);
    anims.push((dt) => sm.update(dt, 0.4));
  }

  // Foundry: heavy stone, a sawtooth roof, two chimneys, a mouth of fire
  {
    const g = buildingGroup('foundry');
    const W = 16;
    const D = BUILD_DEPTH;
    g.add(box(W, 6, D, mats.stone(6, 3), [0, 0, 0]));
    g.add(box(W + 0.8, 0.5, D + 0.8, mats.iron, [0, 6, 0]));
    for (let i = 0; i < 3; i++) {
      g.add(roof(W / 3 - 0.2, D, 1.6, mats.iron, [-W / 3 + i * (W / 3), 6.5, 0], 0.1, 3));
    }
    for (const sx of [-5.2, 5.2]) {
      g.add(cyl(1.0, 1.3, 9, mats.brick(1, 4), [sx, 6, -2], 12));
      const sm = makeEmitter({ count: 40, origin: new Vector3(0, 0, 0), spread: 0.8, rise: 1.6, drift: 0.5, life: 6, size: 3.2, grow: 2.4, color: 0x8a8a8a, alpha: 0.32, additive: false });
      sm.points.position.copy(toWorld('foundry', sx, 15.2, -2));
      root.add(sm.points);
      anims.push((dt) => sm.update(dt, 0.6));
    }
    door(g, D / 2 + 0.2, 4.2, 4.6, false);
    g.add(box(3.8, 4.4, 0.1, new MeshBasicMaterial({ color: new Color(7, 0.8, 0.5), toneMapped: false }), [0, 0, D / 2 + 0.3]));
    g.add(box(4.4, 4.8, 0.2, mats.darkWood, [0, 0, D / 2 + 0.25]));
    g.add(box(0.14, 4.8, 0.14, mats.iron, [0, 0, D / 2 + 0.45]));
    steps(g, 6, D / 2 + 0.4, 2);
    const fireLight = new PointLight(0xffffff, 30, 20, 1.7);
    fireLight.position.set(0, 2.6, D / 2 + 2);
    g.add(fireLight);
    anims.push((_dt, t) => {
      fireLight.intensity = 26 + Math.sin(t * 11) * 4 + Math.sin(t * 23) * 2;
    });
    const gear = new Group();
    gear.position.set(-5.4, 4.4, D / 2 + 0.35);
    gear.add(ring(0.9, 0.18, mats.iron, [0, 0, 0], [0, 0, 0], 20));
    for (let i = 0; i < 10; i++) gear.add(box(0.28, 0.45, 0.3, mats.iron, [Math.cos((i / 10) * 6.28) * 1.15, Math.sin((i / 10) * 6.28) * 1.15, 0], [0, 0, (i / 10) * 6.28 - Math.PI / 2]));
    for (let i = 0; i < 4; i++) gear.add(box(0.1, 1.8, 0.1, mats.iron, [0, 0, 0], [0, 0, (i / 4) * 3.14]));
    g.add(gear);
    anims.push(spinner(gear, 'z', -0.5));
    sign(g, 'FOUNDRY', 4.8, 4.8, D / 2 + 0.4, 3.6, true);
    for (let i = 0; i < 4; i++) g.add(cyl(0.45, 0.5, 1.0, mats.wood, [-8.8 + (i % 2) * 1.0, 0, D / 2 + 0.8 + Math.floor(i / 2) * 0.9], 12));
    colliders.push(rect(building('foundry').x, building('foundry').z, W, D, building('foundry').ry));
    const em = makeEmitter({ count: 30, origin: new Vector3(0, 0, 0), spread: 1.8, rise: 2.4, drift: 1.2, life: 2.2, size: 0.22, grow: 0, color: 0xffffff, alpha: 1, additive: true });
    em.points.position.copy(toWorld('foundry', 0, 1.2, D / 2 + 1));
    em.material.uniforms.color!.value = new Color(8, 1.2, 0.6);
    root.add(em.points);
    anims.push((dt) => em.update(dt));
  }

  // Archive: marble, six columns, a pediment, a dome behind
  {
    const g = buildingGroup('archive');
    const W = 18;
    const D = BUILD_DEPTH;
    g.add(box(W - 2, 7.2, D, mats.marble(4, 2), [0, 0.6, 0]));
    for (let i = 0; i < 4; i++) g.add(box(W + 2 - i * 0.6, 0.3, D + 1.2 - i * 0.6, mats.marble(4, 1), [0, i * 0.3, 0]));
    for (let i = 0; i < 6; i++) {
      const x = -6.25 + i * 2.5;
      g.add(cyl(0.62, 0.7, 7, mats.marble(1, 3), [x, 1.2, D / 2 + 0.9], 16), box(1.7, 0.3, 1.7, mats.marble(1, 1), [x, 8.2, D / 2 + 0.9]), box(1.6, 0.3, 1.6, mats.marble(1, 1), [x, 1.2, D / 2 + 0.9]));
    }
    g.add(box(W + 1, 1, D / 2 + 1.6, mats.marble(4, 1), [0, 8.5, 3.2]));
    g.add(gable(W + 1, 3.2, mats.marble(3, 1), [0, 9.5, D / 2 + 1.7]));
    g.add(mesh(new CylinderGeometry(0.9, 0.9, 0.2, 24), mats.iron, [0, 10.6, D / 2 + 1.8], [Math.PI / 2, 0, 0]));
    g.add(mesh(new SphereGeometry(5.4, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mats.marble(3, 2), [0, 8.4, -2]));
    door(g, D / 2 + 0.3, 2.8, 4.4);
    sign(g, 'THE ARCHIVE', 0, 6.6, D / 2 + 0.6, 4.6);
    colliders.push(rect(building('archive').x, building('archive').z, W + 2, D + 1.2, building('archive').ry));
  }

  // Trial Hall: brick, a clock tower that tells the real time, banners
  let clockHands: { h: Mesh; m: Mesh } | null = null;
  {
    const g = buildingGroup('hall');
    const W = 20;
    const D = BUILD_DEPTH;
    g.add(box(W, 7, D, mats.brick(6, 3), [0, 0, 0]));
    g.add(box(W + 1, 0.6, D + 1, mats.stone(6, 1), [0, 7, 0]), roof(W, D, 2.2, mats.tiles(6, 2), [0, 7.6, 0], 0.8));
    g.add(box(5.4, 14, 5.4, mats.brick(2, 5), [0, 0, 1]), box(6.2, 0.6, 6.2, mats.stone(2, 1), [0, 14, 1]), cone(4.6, 5.5, mats.tiles(3, 3), [0, 14.6, 1], 4, [0, Math.PI / 4, 0]));
    g.add(cyl(1.9, 1.9, 0.3, mats.paper, [0, 10.4, 3.78], 32, [Math.PI / 2, 0, 0]), mesh(new CylinderGeometry(2, 2, 0.2, 32), mats.iron, [0, 12.2, 3.8], [Math.PI / 2, 0, 0]));
    const h = live(box(0.16, 1.1, 0.1, mats.black, [0, 0, 0]));
    const m = live(box(0.1, 1.6, 0.1, mats.black, [0, 0, 0]));
    const hands = live(new Group());
    hands.position.set(0, 12.2, 3.95);
    h.geometry.translate(0, 0.45, 0);
    m.geometry.translate(0, 0.7, 0);
    h.position.y = 0;
    m.position.y = 0;
    hands.add(h, m);
    g.add(hands);
    clockHands = { h, m };
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.add(box(0.1, i % 3 === 0 ? 0.4 : 0.22, 0.05, mats.black, [Math.sin(a) * 1.65, 12.2 + Math.cos(a) * 1.65 - 0.2, 3.9], [0, 0, -a]));
    }
    door(g, D / 2 + 0.2, 4, 4.4);
    steps(g, 9, D / 2 + 0.4, 4);
    windowAt(g, -6.5, 1.8, D / 2 + 0.15, 1.6, 2.6);
    windowAt(g, 6.5, 1.8, D / 2 + 0.15, 1.6, 2.6);
    windowAt(g, -3.4, 1.8, D / 2 + 0.15, 1.6, 2.6);
    windowAt(g, 3.4, 1.8, D / 2 + 0.15, 1.6, 2.6);
    for (const sx of [-8, 8]) {
      const ban = mesh(new PlaneGeometry(1.3, 3.6), mats.cloth(1, 3), [sx, 3.2, D / 2 + 0.22], [0, 0, 0], false);
      (ban.material as MeshLambertMaterial).color = new Color(1.6, 0.1, 0.16);
      (ban.material as MeshLambertMaterial).side = DoubleSide;
      g.add(ban);
    }
    sign(g, 'TRIAL HALL', 0, 5.9, D / 2 + 0.5, 4.4, true);
    colliders.push(rect(building('hall').x, building('hall').z, W, D, building('hall').ry), rect(building('hall').x, building('hall').z, 4, 4, building('hall').ry));
  }

  // Harbor Office: a timber cabin with a porch and a flag
  let flagUpdate: ((t: number) => void) | null = null;
  {
    const g = buildingGroup('office');
    const W = 11;
    const D = 8;
    const zShift = 0.5;
    g.add(box(W, 4.6, D, mats.planks(3, 2), [0, 0, -zShift]), roof(W, D, 2.6, mats.tilesRed(4, 2), [0, 4.6, -zShift], 0.9), gable(W + 0.2, 2.6, mats.planks(3, 1), [0, 4.6, D / 2 - zShift + 0.02]));
    g.add(box(W + 1, 0.4, 3.6, mats.wood, [0, 0, D / 2 - zShift + 1.6]));
    for (const x of [-4.4, 0, 4.4]) g.add(box(0.28, 3.4, 0.28, mats.darkWood, [x, 0.4, D / 2 - zShift + 3.2]));
    g.add(box(W + 1, 0.3, 3.8, mats.darkWood, [0, 3.8, D / 2 - zShift + 1.6], [0.12, 0, 0]));
    door(g, D / 2 - zShift + 0.2, 2.4, 3.2, false);
    windowAt(g, -3.6, 1.2, D / 2 - zShift + 0.15, 1.6, 1.8);
    windowAt(g, 3.6, 1.2, D / 2 - zShift + 0.15, 1.6, 1.8);
    g.add(box(1, 2.6, 1, mats.brick(1, 2), [3.4, 5, -2]));
    const pole = cyl(0.07, 0.09, 4.5, mats.darkWood, [-3.6, 6, -1], 8);
    g.add(pole);
    const flag = makeFlag(2.4, 1.3, mats.cloth(1, 1));
    (flag.mesh.material as MeshLambertMaterial).color = new Color(1.6, 0.1, 0.16);
    live(flag.mesh);
    flag.mesh.position.set(-2.4, 9.6, -1);
    g.add(flag.mesh);
    flagUpdate = flag.update;
    sign(g, 'HARBOR OFFICE', 0, 4.9, D / 2 - zShift + 3.1, 3.8);
  }

  // The Beacon: a banded lighthouse, a keeper's cottage, a beam that sweeps the harbor
  {
    const g = buildingGroup('beacon');
    const cz = -1.5;
    for (let i = 0; i < 8; i++) {
      const r0 = 4.3 - i * 0.22;
      g.add(cyl(r0 - 0.22, r0, 3.4, i % 2 ? mats.black : mats.white, [0, i * 3.4, cz], 28));
    }
    g.add(cyl(3.6, 3.0, 0.5, mats.iron, [0, 27.2, cz], 28), cyl(2.2, 2.4, 3.2, mats.iron, [0, 28.6, cz], 28));
    const lens = new MeshBasicMaterial({ color: new Color(8, 1.0, 0.7), toneMapped: false });
    g.add(mesh(new CylinderGeometry(1.9, 1.9, 2.6, 20), lens, [0, 29.7, cz], [0, 0, 0], false));
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      g.add(cyl(0.08, 0.08, 2.8, mats.iron, [Math.cos(a) * 2, 28.3, cz + Math.sin(a) * 2], 6));
    }
    g.add(cone(2.8, 2.2, mats.iron, [0, 31.4, cz], 20), ball(0.3, mats.iron, [0, 33.8, cz], 8));
    const beam = new Group();
    beam.position.set(0, 29.7, cz);
    const bm = new MeshBasicMaterial({ color: new Color(1.7, 1.7, 1.6), transparent: true, opacity: 0.2, blending: AdditiveBlending, depthWrite: false, side: DoubleSide, toneMapped: false });
    for (const s of [1, -1]) {
      const c = new Mesh(new ConeGeometry(4.5, 90, 20, 1, true), bm);
      c.rotation.z = (Math.PI / 2) * s;
      c.position.x = s * 45;
      beam.add(c);
    }
    g.add(beam);
    anims.push(spinner(beam, 'y', 0.45));
    const bl = new PointLight(0xffffff, 60, 40, 1.4);
    bl.position.set(0, 29.7, cz);
    g.add(bl);
    // the cottage in front
    g.add(box(8, 3.8, 6, mats.plaster(3, 2), [0, 0, 3]), roof(8, 6, 2.4, mats.tilesRed(3, 2), [0, 3.8, 3], 0.8), gable(8.2, 2.4, mats.plaster(2, 1), [0, 3.8, 6.02]));
    door(g, 6.2, 2.2, 3, true);
    windowAt(g, -2.6, 1.2, 6.15, 1.3, 1.4);
    windowAt(g, 2.6, 1.2, 6.15, 1.3, 1.4);
    sign(g, 'THE BEACON', 0, 4.6, 6.5, 3.2);
    // rocks at the foot
    for (let i = 0; i < 6; i++) g.add(mesh(new SphereGeometry(1.2 + (i % 3) * 0.5, 7, 5), mats.rock, [-6 + i * 2.4, 0.2, -6 - (i % 2)], [0, i, 0]));
    const pos = building('beacon');
    const tw = new Vector3(0, 0, cz).applyAxisAngle(new Vector3(0, 1, 0), pos.ry);
    colliders.push(circle(pos.x + tw.x, pos.z + tw.z, 4.6));
    const cot = new Vector3(0, 0, 3).applyAxisAngle(new Vector3(0, 1, 0), pos.ry);
    colliders.push(rect(pos.x + cot.x, pos.z + cot.z, 8, 6, pos.ry));
  }
  // the office cabin collider is the cabin body only
  {
    const pos = building('office');
    const shift = new Vector3(0, 0, -0.5).applyAxisAngle(new Vector3(0, 1, 0), pos.ry);
    colliders.push(rect(pos.x + shift.x, pos.z + shift.z, 11, 8, pos.ry));
  }

  // ------------------------------------------------------------------------------------------ the rim: walls, rocks, trees, hills
  const rim = new Group();
  for (let a = -179; a <= 179; a += 6) {
    const aa = Math.abs(a);
    if (aa < 80) continue;
    const p = onArc(a, 52.5);
    if (p.z > QUAY_Z - 0.5) continue;
    const seg = box(5.6, 1.1, 0.9, mats.stone(2, 1), [p.x, 0, p.z], [0, -(a * Math.PI) / 180, 0]);
    rim.add(seg);
    colliders.push(rect(p.x, p.z, 5.6, 0.9, -(a * Math.PI) / 180));
  }
  root.add(rim);
  // hills and mountains, far enough off that the fog softens them
  const hillMat = mats.rock;
  const rnd = (() => {
    let s = 5;
    return () => ((s = (s * 16807) % 2147483647) / 2147483647);
  })();
  for (let i = 0; i < 26; i++) {
    const a = -170 + (340 / 25) * i + (rnd() - 0.5) * 8;
    const r = 105 + rnd() * 95;
    const p = onArc(a, r);
    if (p.z > 60) continue;
    const h = 22 + rnd() * 48;
    const hill = mesh(new ConeGeometry(18 + rnd() * 22, h, 7 + (i % 3)), hillMat, [p.x, h / 2 - 3, p.z], [0, rnd() * 3, 0], false);
    root.add(hill);
  }
  // pines, instanced
  const treeCount = 150;
  const trunk = new InstancedMesh(new CylinderGeometry(0.2, 0.3, 2.2, 6), mats.darkWood, treeCount);
  const crown = new InstancedMesh(new ConeGeometry(1.7, 6.5, 8), mats.black, treeCount);
  const mtx = new Matrix4();
  for (let i = 0; i < treeCount; i++) {
    const a = -178 + rnd() * 356;
    const r = 57 + rnd() * 46;
    const p = onArc(a, r);
    if (p.z > QUAY_Z - 4) {
      mtx.makeScale(0.001, 0.001, 0.001);
    } else {
      const s = 0.8 + rnd() * 1.0;
      mtx.makeScale(s, s, s).setPosition(p.x, 1.1 * s, p.z);
    }
    trunk.setMatrixAt(i, mtx);
    if (p.z > QUAY_Z - 4) mtx.makeScale(0.001, 0.001, 0.001);
    else {
      const s = 0.8 + rnd() * 1.0;
      mtx.makeScale(s, s, s).setPosition(p.x, 5 * s, p.z);
    }
    crown.setMatrixAt(i, mtx);
  }
  trunk.castShadow = crown.castShadow = true;
  root.add(trunk, crown);

  // ------------------------------------------------------------------------------------------ small things on the quay
  const crates = new Group();
  crates.position.set(-17.5, 0, 30.5);
  crates.add(box(1.8, 1.4, 1.5, mats.wood, [-1, 0, 0], [0, 0.2, 0]), box(1.5, 1.2, 1.5, mats.wood, [0.9, 0, 0.3], [0, -0.3, 0]), box(1.4, 1.2, 1.4, mats.wood, [-0.2, 1.4, 0], [0, 0.5, 0]), cyl(0.6, 0.6, 1.2, mats.darkWood, [2.4, 0, -0.6], 14));
  const torn = plane(0.5, 0.35, mats.paper, [0.9, 1.22, 0.6], [-Math.PI / 2, 0, 0.5], false);
  crates.add(torn);
  props.add(crates);
  colliders.push(circle(-17.5, 30.5, 2.2));
  const post = new Group();
  post.position.set(21, 0, 25);
  post.add(cyl(0.2, 0.26, 5.2, mats.darkWood, [0, 0, 0], 8), box(2.2, 0.2, 0.2, mats.darkWood, [0, 4.3, 0]), mesh(new SphereGeometry(0.22, 10, 8), mats.bulbDark, [-1, 3.95, 0], [0, 0, 0], false), mesh(new SphereGeometry(0.22, 10, 8), mats.bulbDark, [1, 3.95, 0], [0, 0, 0], false), cyl(0.12, 0.16, 0.38, mats.glassDark, [0.7, 0, 0.4], 10));
  props.add(post);
  colliders.push(circle(21, 25, 0.5));
  for (const [x, z] of [[-26, 10], [26, 12], [-20, 18], [14, 30]]) {
    const b = group([box(2.2, 0.15, 0.7, mats.wood, [0, 0.5, 0]), box(0.15, 0.5, 0.6, mats.iron, [-0.9, 0, 0]), box(0.15, 0.5, 0.6, mats.iron, [0.9, 0, 0])], [x!, 0, z!], Math.atan2(-x!, z!) * 0 + (x! < 0 ? 0.4 : -0.4));
    props.add(b);
    colliders.push(circle(x!, z!, 1.2));
  }
  // boats beyond the wall
  const boats: Group[] = [];
  for (let i = 0; i < 4; i++) {
    const b = new Group();
    const hull = mesh(new SphereGeometry(2.4, 14, 8), mats.darkWood, [0, 0.2, 0], [0, 0, 0], false);
    hull.scale.set(0.55, 0.45, 1.5);
    b.add(hull, cyl(0.07, 0.1, 6.4, mats.darkWood, [0, 0.5, 0.4], 8), plane(0.05, 0.05, mats.black));
    const sail = mesh(new PlaneGeometry(2.8, 4.8), mats.clothRed(1, 2), [0.05, 3.3, 0.35], [0, Math.PI / 2, 0], false);
    (sail.material as MeshLambertMaterial).side = DoubleSide;
    b.add(sail);
    const x = -34 + i * 24 + (i % 2) * 4;
    b.position.set(x, -0.9, 44 + (i % 3) * 7);
    b.rotation.y = 0.4 + i;
    root.add(b);
    boats.push(b);
  }
  anims.push((_dt, t) => boats.forEach((b, i) => {
    b.position.y = -0.85 + Math.sin(t * 0.9 + i * 1.7) * 0.18;
    b.rotation.z = Math.sin(t * 0.8 + i) * 0.05;
    b.rotation.x = Math.sin(t * 0.6 + i * 2) * 0.04;
  }));

  // gulls
  const gulls = Array.from({ length: 6 }, (_, i) => ({ g: makeGull(mats), r: 14 + (i % 4) * 9, h: 16 + (i % 3) * 7, sp: 0.18 + (i % 5) * 0.03, ph: i * 1.1 }));
  gulls.forEach((o) => root.add(o.g.group));
  anims.push((_dt, t) => gulls.forEach((o) => {
    const a = t * o.sp + o.ph;
    o.g.group.position.set(Math.cos(a) * o.r - 4, o.h + Math.sin(t * 0.7 + o.ph) * 1.6, 28 + Math.sin(a) * o.r * 0.9);
    o.g.group.rotation.y = -a + Math.PI;
    o.g.group.rotation.z = Math.sin(t * 0.5 + o.ph) * 0.2;
    o.g.flap(t, o.ph);
  }));

  const motes = makeMotes(260);
  root.add(motes.points);

  // ------------------------------------------------------------------------------------------ the lit lamps follow the lessons
  function setLit(lit: boolean[]) {
    let n = 0;
    lamps.forEach((l, i) => {
      l.lit = !!lit[i];
      lampBulbs.setColorAt(l.index, l.lit ? BULB_ON : BULB_OFF);
      hangBulbs.setColorAt(l.index, l.lit ? BULB_ON : BULB_OFF);
      if (l.lit) n++;
    });
    if (lampBulbs.instanceColor) lampBulbs.instanceColor.needsUpdate = true;
    if (hangBulbs.instanceColor) hangBulbs.instanceColor.needsUpdate = true;
    monLight.intensity = 30 + n * 5;
    cageGlow.color.set(2.6 + n * 0.35, 0.18, 0.22);
  }

  const lampLights: PointLight[] = Array.from({ length: 4 }, () => {
    const l = new PointLight(0xffffff, 0, 16, 1.6);
    root.add(l);
    return l;
  });
  const tmp = new Vector3();

  // the places are lit by the sun, the sky and emissive shapes, never by point lights; then merge everything that stands still
  stripLights(root);
  bakeWorld(root, (dt, t) => {
    anims.forEach((a) => a(dt, t));
    flagUpdate?.(t);
  });

  return {
    group: root,
    colliders,
    lamps,
    setLit,
    water,
    update(dt, t, player, camera) {
      anims.forEach((a) => a(dt, t));
      water.update(t, camera.position.x, camera.position.z);
      motes.update(t, player);
      spray.update(dt);
      flagUpdate?.(t);
      if (clockHands) {
        const d = new Date();
        clockHands.h.parent!.children[0]!.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) * (Math.PI / 6);
        clockHands.h.parent!.children[1]!.rotation.z = -(d.getMinutes() + d.getSeconds() / 60) * (Math.PI / 30);
      }
      // give the four nearest lit lamps a real light
      const near = lamps
        .filter((l) => l.lit)
        .map((l) => ({ l, d: tmp.set(l.x, 0, l.z).distanceToSquared(player) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, lampLights.length);
      lampLights.forEach((li, i) => {
        const n = near[i];
        if (n) {
          li.position.set(n.l.x, 4.2, n.l.z);
          li.intensity += (22 - li.intensity) * Math.min(1, dt * 6);
        } else li.intensity *= 0.9;
      });
      void camera;
    },
  };
}

