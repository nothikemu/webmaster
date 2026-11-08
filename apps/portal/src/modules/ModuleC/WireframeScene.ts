import {
  BufferAttribute,
  BufferGeometry,
  Group,
  IcosahedronGeometry,
  LineSegments,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  type Material,
} from 'three';
import type { Frame } from '../../core/loop';
import { Spring } from '../../core/spring';
import type { RenderHandle } from '../../gpu/rendererFactory';
import type { WireTsl } from '../../gpu/tsl/wireframeMaterial';
import { WIREFRAME_LEVEL, buildIcosphere, type Icosphere } from './icosphere';

export interface WireframeInit {
  handle: RenderHandle;
  reduced: boolean;
  asset(name: string): string;
}

const FOV = 40;
const RADIUS = 1.35;
const REVEAL_THRESHOLD = 0.04;

/**
 * Module C scene: a 10,242-vertex wireframe whose vertex shader implements four failure modes.
 * Uniforms (`uDisplacement`, `uFragment`, `uTime`, `uMarkerIndex`, plus `uWarn` for the colour
 * shift) are driven by springs so every change eases in and out. Switching marker first eases the
 * current deformation to zero, swaps the marker index while the shape is still, then eases in.
 */
export class WireframeScene {
  readonly scene = new Scene();
  readonly camera = new PerspectiveCamera(FOV, 1, 0.1, 40);
  /** Eased intensity per vulnerability (0..1), read by the radar chart. */
  readonly severities = new Float32Array(4);
  readonly vertexCount: number;
  readonly edgeCount: number;

  readonly #h: RenderHandle;
  readonly #reduced: boolean;
  readonly #group = new Group();
  readonly #amp: Spring;
  readonly #warn: Spring;
  readonly #sev: Spring[];
  readonly #material: ShaderMaterial | null;
  readonly #tsl: WireTsl | null;
  readonly #geometry: BufferGeometry;
  readonly #globe: { geometry: IcosahedronGeometry; material: Material };
  #requested: number | null = null;
  #applied = 0;

  private constructor(init: WireframeInit, ico: Icosphere, tsl: WireTsl | null) {
    this.#h = init.handle;
    this.#reduced = init.reduced;
    this.vertexCount = ico.vertexCount;
    this.edgeCount = ico.edges.length / 2;
    this.#tsl = tsl;
    const fast = init.reduced;
    this.#amp = new Spring(0, fast ? 40 : 7);
    this.#warn = new Spring(0, fast ? 40 : 4);
    this.#sev = [0, 1, 2, 3].map(() => new Spring(0, fast ? 40 : 6));

    this.#geometry = new BufferGeometry();
    this.#geometry.setAttribute('position', new BufferAttribute(ico.positions, 3));
    this.#geometry.setIndex(new BufferAttribute(ico.edges, 1));

    if (tsl) {
      this.#material = null;
      this.#group.add(new LineSegments(this.#geometry, tsl.material as never));
    } else {
      this.#material = new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uDisplacement: { value: 0 },
          uFragment: { value: 0 },
          uMarkerIndex: { value: 0 },
          uWarn: { value: 0 },
        },
        vertexShader: init.asset('glsl/wire.vert.glsl'),
        fragmentShader: init.asset('glsl/wire.frag.glsl'),
        transparent: true,
        depthWrite: false,
      });
      this.#group.add(new LineSegments(this.#geometry, this.#material));
    }
    this.#group.children[0]!.frustumCulled = false;
    // Under the mesh sits a cel-shaded globe: three flat bands and an ink rim. It hides the far side of the mesh.
    const globeGeo = new IcosahedronGeometry(RADIUS * 0.965, 4);
    const globeMat: Material = tsl
      ? (tsl.globe as unknown as Material)
      : new ShaderMaterial({ vertexShader: init.asset('glsl/globe.vert.glsl'), fragmentShader: init.asset('glsl/globe.frag.glsl') });
    const globe = new Mesh(globeGeo, globeMat);
    globe.frustumCulled = false;
    this.#group.add(globe);
    this.#globe = { geometry: globeGeo, material: globeMat };
    this.#group.rotation.x = 0.32;
    this.scene.add(this.#group);
    this.camera.position.set(0, 0, 5.4);
  }

  static async create(init: WireframeInit): Promise<WireframeScene> {
    const ico = buildIcosphere(WIREFRAME_LEVEL);
    const tsl = init.handle.kind === 'webgpu' ? (await import('../../gpu/tsl/wireframeMaterial')).createWireTsl() : null;
    return new WireframeScene(init, ico, tsl);
  }

  /** Index of the marker currently shown, or null when stable. */
  get activeMarker(): number | null {
    return this.#requested;
  }

  /** Requests a vulnerability (0..3), or null to remediate back to the stable shape. */
  setMarker(index: number | null): void {
    this.#requested = index;
  }

  resize(width: number, height: number, dpr: number): void {
    this.camera.aspect = width / Math.max(1, height);
    // Keep the whole sphere in view on narrow screens.
    const aspect = this.camera.aspect;
    this.camera.position.z = aspect < 1 ? 5.4 / Math.max(0.62, aspect) : 5.4;
    this.camera.updateProjectionMatrix();
    this.#h.setSize(width, height, dpr);
  }

  update(frame: Frame): void {
    const dt = Math.min(frame.dt, 1 / 30);
    const want = this.#requested;
    if (want !== this.#applied || want === null) {
      this.#amp.target = 0;
      if (want !== null && this.#amp.value < REVEAL_THRESHOLD) {
        this.#applied = want;
        this.#amp.target = 1;
      }
    } else {
      this.#amp.target = 1;
    }
    this.#warn.target = want === null ? 0 : 1;
    this.#amp.step(dt);
    this.#warn.step(dt);
    const amp = Math.max(0, Math.min(1, this.#amp.value));
    const warn = Math.max(0, Math.min(1, this.#warn.value));
    for (let i = 0; i < 4; i++) {
      const s = this.#sev[i]!;
      s.target = want === i && this.#applied === i ? 1 : 0;
      s.step(dt);
      this.severities[i] = Math.max(0, Math.min(1, s.value));
    }

    const t = this.#reduced ? 0 : frame.time;
    if (this.#material) {
      const u = this.#material.uniforms;
      u.uTime!.value = t;
      u.uDisplacement!.value = amp;
      u.uFragment!.value = amp;
      u.uMarkerIndex!.value = this.#applied;
      u.uWarn!.value = warn;
    } else if (this.#tsl) {
      const u = this.#tsl.uniforms;
      u.time.value = t;
      u.displacement.value = amp;
      u.fragment.value = amp;
      u.marker.value = this.#applied;
      u.warn.value = warn;
    }
    if (!this.#reduced) this.#group.rotation.y += dt * 0.12;
    this.camera.lookAt(0, 0, 0);
    this.#h.render(this.scene, this.camera, frame.dt);
  }

  get radius(): number {
    return RADIUS;
  }

  dispose(): void {
    this.#geometry.dispose();
    this.#material?.dispose();
    this.#tsl?.material.dispose();
    this.#globe.geometry.dispose();
    this.#globe.material.dispose();
    this.scene.clear();
  }
}
