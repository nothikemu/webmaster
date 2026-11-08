import {
  ClampToEdgeWrapping,
  DataTexture,
  FloatType,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  PlaneGeometry,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderTarget,
  type Texture,
  type WebGLRenderer,
} from 'three';
import type { SimBackend, StepInput } from './types';

export interface GpgpuShaders {
  kernel: string;
  vert: string;
  vel: string;
  pos: string;
}

/**
 * WebGL2 float-texture GPGPU. Positions and velocities live in RGBA32F render targets that are
 * ping-ponged by two full-screen passes (velocity, then position). The particle and link vertex
 * shaders sample the position texture directly, so nothing is read back to the CPU.
 */
export class GpgpuSim implements SimBackend {
  readonly kind = 'webgl2' as const;
  readonly positions = null;
  readonly count: number;
  readonly textureSize: number;

  readonly #renderer: WebGLRenderer;
  readonly #restTex: DataTexture;
  readonly #zeroTex: DataTexture;
  readonly #posRT: [WebGLRenderTarget, WebGLRenderTarget];
  readonly #velRT: [WebGLRenderTarget, WebGLRenderTarget];
  readonly #velMat: ShaderMaterial;
  readonly #posMat: ShaderMaterial;
  readonly #quad: Mesh;
  readonly #scene = new Scene();
  readonly #camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  readonly #pointer = new Vector3();
  #cur = 0;

  constructor(renderer: WebGLRenderer, rest: Float32Array, phase: Float32Array, shaders: GpgpuShaders) {
    this.#renderer = renderer;
    this.count = Math.floor(rest.length / 3);
    const size = Math.max(2, Math.ceil(Math.sqrt(this.count)));
    this.textureSize = size;

    const restData = new Float32Array(size * size * 4);
    for (let i = 0; i < this.count; i++) {
      restData[i * 4] = rest[i * 3]!;
      restData[i * 4 + 1] = rest[i * 3 + 1]!;
      restData[i * 4 + 2] = rest[i * 3 + 2]!;
      restData[i * 4 + 3] = phase[i] ?? 0;
    }
    this.#restTex = this.#dataTexture(restData, size);
    this.#zeroTex = this.#dataTexture(new Float32Array(size * size * 4), size);

    const makeRT = (): WebGLRenderTarget =>
      new WebGLRenderTarget(size, size, {
        type: FloatType,
        format: RGBAFormat,
        minFilter: NearestFilter,
        magFilter: NearestFilter,
        wrapS: ClampToEdgeWrapping,
        wrapT: ClampToEdgeWrapping,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false,
      });
    this.#posRT = [makeRT(), makeRT()];
    this.#velRT = [makeRT(), makeRT()];

    const common = {
      uPos: { value: this.#restTex as Texture },
      uVel: { value: this.#zeroTex as Texture },
      uRest: { value: this.#restTex as Texture },
      uDt: { value: 0 },
      uTime: { value: 0 },
      uRadius: { value: 1 },
      uStrength: { value: 0 },
      uPointer: { value: this.#pointer },
      uMode: { value: 0 },
    };
    this.#velMat = new ShaderMaterial({
      uniforms: common,
      vertexShader: shaders.vert,
      fragmentShader: `${shaders.kernel}\n${shaders.vel}`,
      depthTest: false,
      depthWrite: false,
    });
    this.#posMat = new ShaderMaterial({
      uniforms: { uPos: common.uPos, uVel: common.uVel, uDt: common.uDt },
      vertexShader: shaders.vert,
      fragmentShader: shaders.pos,
      depthTest: false,
      depthWrite: false,
    });
    this.#quad = new Mesh(new PlaneGeometry(2, 2), this.#velMat);
    this.#quad.frustumCulled = false;
    this.#scene.add(this.#quad);
    this.reset();
  }

  get positionTexture(): Texture {
    return this.#posRT[this.#cur]!.texture;
  }

  #dataTexture(data: Float32Array, size: number): DataTexture {
    const tex = new DataTexture(data, size, size, RGBAFormat, FloatType);
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;
    return tex;
  }

  #pass(material: ShaderMaterial, target: WebGLRenderTarget): void {
    const r = this.#renderer;
    const prevTarget = r.getRenderTarget();
    const prevAuto = r.autoClear;
    this.#quad.material = material;
    r.autoClear = false;
    r.setRenderTarget(target);
    r.render(this.#scene, this.#camera);
    r.setRenderTarget(prevTarget);
    r.autoClear = prevAuto;
  }

  reset(): void {
    // Position pass with dt = 0 and zero velocity copies the rest layout; velocity starts at zero.
    this.#posMat.uniforms.uPos!.value = this.#restTex;
    this.#posMat.uniforms.uVel!.value = this.#zeroTex;
    this.#posMat.uniforms.uDt!.value = 0;
    this.#pass(this.#posMat, this.#posRT[0]);
    this.#posMat.uniforms.uPos!.value = this.#zeroTex;
    this.#pass(this.#posMat, this.#velRT[0]);
    this.#cur = 0;
  }

  step({ dt, time, pointer: p }: StepInput): void {
    const next = 1 - this.#cur;
    const v = this.#velMat.uniforms;
    this.#pointer.set(p.x, p.y, p.z);
    v.uDt!.value = dt;
    v.uTime!.value = time;
    v.uRadius!.value = p.radius;
    v.uStrength!.value = p.strength;
    v.uMode!.value = p.mode;
    v.uPos!.value = this.#posRT[this.#cur]!.texture;
    v.uVel!.value = this.#velRT[this.#cur]!.texture;
    this.#pass(this.#velMat, this.#velRT[next]!);
    const q = this.#posMat.uniforms;
    q.uDt!.value = dt;
    q.uPos!.value = this.#posRT[this.#cur]!.texture;
    q.uVel!.value = this.#velRT[next]!.texture;
    this.#pass(this.#posMat, this.#posRT[next]!);
    this.#cur = next;
  }

  dispose(): void {
    for (const rt of [...this.#posRT, ...this.#velRT]) rt.dispose();
    this.#restTex.dispose();
    this.#zeroTex.dispose();
    this.#velMat.dispose();
    this.#posMat.dispose();
    this.#quad.geometry.dispose();
  }
}
