import type { Camera, Scene, WebGLRenderer } from 'three';
import type { WebGPURenderer } from 'three/webgpu';
import type { Caps, RendererPreference } from '../core/caps';
import type { PostLevel } from '../core/quality';

export type RendererKind = 'webgpu' | 'webgl2';

/**
 * The one module that decides which renderer a scene gets. Scenes ask for a handle and branch on
 * `kind`: GLSL ShaderMaterials for 'webgl2', TSL node materials for 'webgpu'.
 */
export interface RenderHandle {
  readonly kind: RendererKind;
  readonly canvas: HTMLCanvasElement;
  readonly webgl: WebGLRenderer | null;
  readonly webgpu: WebGPURenderer | null;
  setSize(width: number, height: number, dpr: number): void;
  /** Kept for the quality governor. The look is cel-shaded, so there is no post-processing and this does nothing. */
  setPost(level: PostLevel): void;
  render(scene: Scene, camera: Camera, dt: number): void;
  onLost(callback: (reason: string) => void): void;
  dispose(): void;
}

export class NoRendererError extends Error {
  constructor() {
    super('Neither WebGPU nor WebGL2 is available');
    this.name = 'NoRendererError';
  }
}

export async function createRenderHandle(
  canvas: HTMLCanvasElement,
  caps: Caps,
  preference: RendererPreference,
  _post?: PostLevel,
): Promise<RenderHandle> {
  if (preference === 'none') throw new NoRendererError();
  const wantGpu = preference === 'webgpu' || (preference === 'auto' && caps.webgpu);
  if (wantGpu) {
    try {
      return await createWebGpuHandle(canvas);
    } catch (err) {
      // A failed WebGPU attempt can leave the canvas bound to the wrong context type, so the
      // caller must retry with a fresh canvas and preference "webgl2".
      if (preference === 'webgpu') throw err;
      throw new WebGpuUnavailableError(err);
    }
  }
  if (!caps.webgl2) throw new NoRendererError();
  return createWebGl2Handle(canvas);
}

/** Thrown when auto-selection tried WebGPU and failed; the caller retries on a new canvas. */
export class WebGpuUnavailableError extends Error {
  constructor(cause: unknown) {
    super('WebGPU renderer failed to start', { cause });
    this.name = 'WebGpuUnavailableError';
  }
}

async function createWebGpuHandle(canvas: HTMLCanvasElement): Promise<RenderHandle> {
  const mod = await import('three/webgpu');
  const renderer = new mod.WebGPURenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  await renderer.init();
  const backend = renderer.backend as { isWebGPUBackend?: boolean; device?: GPUDevice };
  if (backend.isWebGPUBackend !== true) {
    renderer.dispose();
    throw new Error('WebGPURenderer fell back to a non-WebGPU backend');
  }
  renderer.setClearColor(0x0b131b, 1);
  let lostCb: ((reason: string) => void) | null = null;
  void backend.device?.lost.then((info) => lostCb?.(info.message || info.reason));
  return {
    kind: 'webgpu',
    canvas,
    webgl: null,
    webgpu: renderer,
    setSize(width, height, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
    },
    setPost() {
      /* Post-processing runs on the WebGL2 renderer only. */
    },
    render(scene, camera) {
      renderer.render(scene, camera);
    },
    onLost(cb) {
      lostCb = cb;
    },
    dispose() {
      renderer.dispose();
    },
  };
}

async function createWebGl2Handle(canvas: HTMLCanvasElement): Promise<RenderHandle> {
  const three = await import('three');
  // MSAA is on so the edges of the flat discs (alpha to coverage) and the paper rim of the globe are smooth.
  const renderer = new three.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
    stencil: false,
  });
  renderer.setClearColor(0x0b131b, 1);
  let lostCb: ((reason: string) => void) | null = null;

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lostCb?.('WebGL context lost');
  });

  return {
    kind: 'webgl2',
    canvas,
    webgl: renderer,
    webgpu: null,
    setSize(width, height, dpr) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
    },
    setPost() {
      // The look is cel-shaded: no bloom, no aberration, no grain.
    },
    render(scene, camera) {
      renderer.render(scene, camera);
    },
    onLost(cb) {
      lostCb = cb;
    },
    dispose() {
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
