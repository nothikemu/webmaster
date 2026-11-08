import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  LineSegments,
  PerspectiveCamera,
  Plane,
  Points,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  type Object3D,
  type Texture,
} from 'three';
import type { Frame } from '../../core/loop';
import { Spring } from '../../core/spring';
import type { RenderHandle } from '../../gpu/rendererFactory';
import type { SwarmTsl } from '../../gpu/tsl/swarmMaterials';
import type { SimBackend, SimMode, StepInput } from '../../gpu/sim/types';
import { particleSeeds, type LinkGeometry, type Topology } from './topology';

export interface SwarmInit {
  handle: RenderHandle;
  sim: SimBackend;
  topology: Topology;
  links: LinkGeometry;
  reduced: boolean;
  asset(name: string): string;
}

export const INFLUENCE_RADIUS = 0.85;
/** Pointer force per mode (deflect, attract, orbit), in the kernel's acceleration units. */
const MODE_STRENGTH: readonly [number, number, number] = [26, 30, 30];
const POINT_SIZE = 58;
const FOV = 40;
const HALF_W = 2.75;
const HALF_H = 1.75;
const MAX_STEP = 1 / 30;
const KEYBOARD_STEP = 0.22;
const FIELD_LIMIT_X = 2.9;
const FIELD_LIMIT_Y = 1.7;

/**
 * Module A scene: a particle field shaped like a layered neural network. The scene owns the
 * pointer logic (ray to the z = 0 plane, spring-smoothed position, eased presence) and feeds the
 * chosen simulation backend; rendering is GLSL on WebGL2 or TSL on WebGPU.
 */
export class SwarmScene {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 60);
  mode: SimMode = 0;
  influenced = 0;

  readonly #h: RenderHandle;
  readonly #sim: SimBackend;
  readonly #n: number;
  readonly #edges: Uint32Array;
  readonly #reduced: boolean;
  readonly #pointerWorld = new Vector3();
  readonly #raycaster = new Raycaster();
  readonly #plane = new Plane(new Vector3(0, 0, 1), 0);
  readonly #hit = new Vector3();
  readonly #ndc = new Vector2();
  readonly #sx = new Spring(0, 16);
  readonly #sy = new Spring(0, 16);
  readonly #presence = new Spring(0, 8);
  readonly #step: StepInput;
  readonly #cpuPositions: Float32Array | null;
  readonly #linkPos: Float32Array;
  readonly #linkOther: Float32Array;
  readonly #disposables: Array<{ dispose(): void }> = [];
  readonly #tsl: SwarmTsl | null;
  #pointAttr: BufferAttribute | null = null;
  #linkPosAttr: BufferAttribute | null = null;
  #linkOtherAttr: BufferAttribute | null = null;
  #materials: ShaderMaterial[] = [];
  #inside = false;
  #keyboard = false;
  #targetX = 0;
  #targetY = 0;
  #frameNo = 0;

  private constructor(init: SwarmInit, tsl: SwarmTsl | null) {
    this.#h = init.handle;
    this.#sim = init.sim;
    this.#n = init.topology.count;
    this.#edges = init.links.edges;
    this.#reduced = init.reduced;
    this.#tsl = tsl;
    this.#step = { dt: 0, time: 0, pointer: { x: 0, y: 0, z: 0, radius: INFLUENCE_RADIUS, strength: 0, mode: 0 } };
    this.#cpuPositions = init.sim.positions ? new Float32Array(init.sim.positions) : null;
    this.#linkPos = new Float32Array(this.#edges.length * 3);
    this.#linkOther = new Float32Array(this.#edges.length * 3);
    this.camera.position.set(0, 0, 5);
    if (init.reduced) {
      this.#sx.omega = 40;
      this.#sy.omega = 40;
      this.#presence.omega = 30;
    }
  }

  static async create(init: SwarmInit): Promise<SwarmScene> {
    const { topology, links, sim, handle } = init;
    let tsl: SwarmTsl | null = null;
    if (handle.kind === 'webgpu') {
      const mod = await import('../../gpu/tsl/swarmMaterials');
      tsl = mod.createSwarmTsl(particleSeeds(topology.count), topology.rest, sim.positions ?? topology.rest, INFLUENCE_RADIUS, topology.linkRadius * 2.2);
    }
    const scene = new SwarmScene(init, tsl);
    await scene.#build(init, links);
    return scene;
  }

  async #build(init: SwarmInit, links: LinkGeometry): Promise<void> {
    const { topology, sim } = init;
    const n = topology.count;
    const e = links.edges.length / 2;
    const textureMode = sim.positionTexture !== null;

    const seed = particleSeeds(n);

    // Link attributes shared by every path.
    const base = new Float32Array(e * 2);
    const tt = new Float32Array(e * 2);
    for (let i = 0; i < e; i++) {
      base[i * 2] = base[i * 2 + 1] = links.base[i]!;
      tt[i * 2] = tt[i * 2 + 1] = links.t[i]!;
    }

    const pointGeo = new BufferGeometry();
    const lineGeo = new BufferGeometry();
    this.#disposables.push(pointGeo, lineGeo);

    if (textureMode) {
      const size = sim.textureSize;
      const ref = new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        ref[i * 2] = ((i % size) + 0.5) / size;
        ref[i * 2 + 1] = (Math.floor(i / size) + 0.5) / size;
      }
      const lref = new Float32Array(e * 4);
      for (let i = 0; i < e; i++) {
        const a = links.edges[i * 2]!;
        const b = links.edges[i * 2 + 1]!;
        lref.set([ref[a * 2]!, ref[a * 2 + 1]!, ref[b * 2]!, ref[b * 2 + 1]!], i * 4);
      }
      // Two vertices per edge: (a -> b) and (b -> a).
      const aRef = lref;
      const aRefOther = new Float32Array(e * 4);
      for (let i = 0; i < e; i++) {
        aRefOther.set([lref[i * 4 + 2]!, lref[i * 4 + 3]!, lref[i * 4]!, lref[i * 4 + 1]!], i * 4);
      }
      pointGeo.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3));
      pointGeo.setAttribute('aRef', new BufferAttribute(ref, 2));
      lineGeo.setAttribute('position', new BufferAttribute(new Float32Array(e * 2 * 3), 3));
      lineGeo.setAttribute('aRef', new BufferAttribute(aRef, 2));
      lineGeo.setAttribute('aRefOther', new BufferAttribute(aRefOther, 2));
    } else {
      const pos = new BufferAttribute(new Float32Array(topology.rest), 3);
      pos.setUsage(DynamicDrawUsage);
      this.#pointAttr = pos;
      pointGeo.setAttribute('position', pos);
      const lp = new BufferAttribute(this.#linkPos, 3);
      const lo = new BufferAttribute(this.#linkOther, 3);
      lp.setUsage(DynamicDrawUsage);
      lo.setUsage(DynamicDrawUsage);
      this.#linkPosAttr = lp;
      this.#linkOtherAttr = lo;
      lineGeo.setAttribute('position', lp);
      lineGeo.setAttribute('aOther', lo);
      this.#gather(topology.rest);
    }
    pointGeo.setAttribute('aRest', new BufferAttribute(topology.rest, 3));
    pointGeo.setAttribute('aSeed', new BufferAttribute(seed, 1));
    lineGeo.setAttribute('aBase', new BufferAttribute(base, 1));
    lineGeo.setAttribute('aT', new BufferAttribute(tt, 1));

    let points: Object3D;
    let lines: Object3D;
    if (this.#h.kind === 'webgpu' && this.#tsl) {
      const gpu = await import('three/webgpu');
      const sprite = new gpu.Sprite(this.#tsl.pointMaterial);
      (sprite as unknown as { count: number }).count = n;
      sprite.frustumCulled = false;
      points = sprite;
      lines = new LineSegments(lineGeo, this.#tsl.linkMaterial as never);
      this.#disposables.push(this.#tsl.pointMaterial, this.#tsl.linkMaterial);
    } else {
      const defines = textureMode ? { USE_POS_TEX: '' } : {};
      const posTex: Texture | null = sim.positionTexture;
      const pointMat = new ShaderMaterial({
        defines,
        uniforms: {
          uSize: { value: POINT_SIZE },
          uPixelRatio: { value: 1 },
          uPointer: { value: this.#pointerWorld },
          uRadius: { value: INFLUENCE_RADIUS },
          uPresence: { value: 0 },
          uPosTex: { value: posTex },
        },
        vertexShader: init.asset('glsl/particle.vert.glsl'),
        fragmentShader: init.asset('glsl/particle.frag.glsl'),
        transparent: false,
        depthWrite: true,
        depthTest: true,
        alphaToCoverage: true,
      });
      const lineMat = new ShaderMaterial({
        defines,
        uniforms: {
          uMaxLen: { value: topology.linkRadius * 2.2 },
          uOpacity: { value: 0.55 },
          uPointer: { value: this.#pointerWorld },
          uRadius: { value: INFLUENCE_RADIUS },
          uPresence: { value: 0 },
          uPosTex: { value: posTex },
        },
        vertexShader: init.asset('glsl/link.vert.glsl'),
        fragmentShader: init.asset('glsl/link.frag.glsl'),
        transparent: true,
        depthWrite: false,
        depthTest: false,
      });
      this.#materials = [pointMat, lineMat];
      this.#disposables.push(pointMat, lineMat);
      points = new Points(pointGeo, pointMat);
      lines = new LineSegments(lineGeo, lineMat);
    }
    points.frustumCulled = false;
    lines.frustumCulled = false;
    lines.renderOrder = 0;
    points.renderOrder = 1;
    this.scene.add(lines, points);
  }

  // ---- input ----------------------------------------------------------------------------------
  /** Pointer position in normalised device coordinates (-1..1, y up). */
  pointerMove(ndcX: number, ndcY: number): void {
    this.#ndc.set(ndcX, ndcY);
    this.#raycaster.setFromCamera(this.#ndc, this.camera);
    if (this.#raycaster.ray.intersectPlane(this.#plane, this.#hit)) {
      this.#targetX = Math.max(-FIELD_LIMIT_X, Math.min(FIELD_LIMIT_X, this.#hit.x));
      this.#targetY = Math.max(-FIELD_LIMIT_Y, Math.min(FIELD_LIMIT_Y, this.#hit.y));
    }
    this.#inside = true;
  }

  pointerLeave(): void {
    this.#inside = false;
  }

  /** Keyboard equivalent of pointer movement: shifts the virtual pointer by whole steps. */
  nudge(dx: number, dy: number): void {
    this.#targetX = Math.max(-FIELD_LIMIT_X, Math.min(FIELD_LIMIT_X, this.#targetX + dx * KEYBOARD_STEP));
    this.#targetY = Math.max(-FIELD_LIMIT_Y, Math.min(FIELD_LIMIT_Y, this.#targetY + dy * KEYBOARD_STEP));
    this.#keyboard = true;
  }

  setKeyboardActive(active: boolean): void {
    this.#keyboard = active;
  }

  setMode(mode: SimMode): void {
    this.mode = mode;
  }

  get pointerPosition(): { x: number; y: number } {
    return { x: this.#sx.value, y: this.#sy.value };
  }

  // ---- frame ----------------------------------------------------------------------------------
  resize(width: number, height: number, dpr: number): void {
    const aspect = width / Math.max(1, height);
    this.camera.aspect = aspect;
    const t = Math.tan((FOV * Math.PI) / 360);
    this.camera.position.z = Math.max(HALF_H / t, HALF_W / (t * aspect)) + 0.4;
    this.camera.updateProjectionMatrix();
    this.#h.setSize(width, height, dpr);
    for (const m of this.#materials) if (m.uniforms.uPixelRatio) m.uniforms.uPixelRatio.value = dpr;
  }

  update(frame: Frame): void {
    this.#frameNo++;
    const dt = Math.min(frame.dt, MAX_STEP);
    const wantPresence = this.#inside || this.#keyboard ? 1 : 0;
    this.#presence.target = wantPresence;
    this.#sx.target = this.#targetX;
    this.#sy.target = this.#targetY;
    this.#presence.step(dt);
    this.#sx.step(dt);
    this.#sy.step(dt);
    const presence = Math.max(0, this.#presence.value);
    this.#pointerWorld.set(this.#sx.value, this.#sy.value, 0);

    const p = this.#step.pointer;
    p.x = this.#sx.value;
    p.y = this.#sy.value;
    p.z = 0;
    p.radius = INFLUENCE_RADIUS;
    p.strength = presence < 0.002 ? 0 : MODE_STRENGTH[this.mode] * presence * (this.#reduced ? 0.6 : 1);
    p.mode = this.mode;
    this.#step.dt = dt;
    this.#step.time = this.#reduced ? 0 : frame.time;
    this.#sim.step(this.#step);

    const src = this.#sim.positions;
    if (src && this.#cpuPositions) {
      this.#cpuPositions.set(src);
      if (this.#tsl) {
        (this.#tsl.positions.array as Float32Array).set(this.#cpuPositions);
        this.#tsl.positions.needsUpdate = true;
      } else if (this.#pointAttr) {
        (this.#pointAttr.array as Float32Array).set(this.#cpuPositions);
        this.#pointAttr.needsUpdate = true;
      }
      if (this.#linkPosAttr && this.#linkOtherAttr) {
        this.#gather(this.#cpuPositions);
        this.#linkPosAttr.needsUpdate = true;
        this.#linkOtherAttr.needsUpdate = true;
      }
      if (this.#frameNo % 15 === 0) this.influenced = this.#countInfluenced(this.#cpuPositions, presence);
    }

    for (const m of this.#materials) m.uniforms.uPresence!.value = presence;
    if (this.#tsl) {
      this.#tsl.uniforms.pointer.copy(this.#pointerWorld);
      this.#tsl.uniforms.presence.value = presence;
    }

    if (!this.#reduced) {
      const t = frame.time;
      this.camera.position.x = Math.sin(t * 0.11) * 0.12 + this.#sx.value * 0.015;
      this.camera.position.y = Math.cos(t * 0.09) * 0.07 + this.#sy.value * 0.015;
    }
    this.camera.lookAt(0, 0, 0);
    this.#h.render(this.scene, this.camera, frame.dt);
  }

  /** Copies endpoint positions into the per-vertex link attributes (two vertices per edge). */
  #gather(pos: Float32Array): void {
    const edges = this.#edges;
    const lp = this.#linkPos;
    const lo = this.#linkOther;
    // Dev-only misuse guard for the bounds the loop relies on.
    if (pos.length < this.#n * 3) return;
    for (let e = 0, m = edges.length / 2; e < m; e++) {
      const i = edges[e * 2]! * 3;
      const j = edges[e * 2 + 1]! * 3;
      const o = e * 6;
      lp[o] = pos[i]!;
      lp[o + 1] = pos[i + 1]!;
      lp[o + 2] = pos[i + 2]!;
      lp[o + 3] = pos[j]!;
      lp[o + 4] = pos[j + 1]!;
      lp[o + 5] = pos[j + 2]!;
      lo[o] = pos[j]!;
      lo[o + 1] = pos[j + 1]!;
      lo[o + 2] = pos[j + 2]!;
      lo[o + 3] = pos[i]!;
      lo[o + 4] = pos[i + 1]!;
      lo[o + 5] = pos[i + 2]!;
    }
  }

  #countInfluenced(pos: Float32Array, presence: number): number {
    if (presence < 0.3) return 0;
    const r2 = INFLUENCE_RADIUS * INFLUENCE_RADIUS;
    const px = this.#sx.value;
    const py = this.#sy.value;
    let c = 0;
    for (let i = 0; i < this.#n; i++) {
      const dx = pos[i * 3]! - px;
      const dy = pos[i * 3 + 1]! - py;
      const dz = pos[i * 3 + 2]!;
      if (dx * dx + dy * dy + dz * dz < r2) c++;
    }
    return c;
  }

  dispose(): void {
    for (const d of this.#disposables) d.dispose();
    this.scene.clear();
  }
}
