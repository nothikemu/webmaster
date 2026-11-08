import type { SimBackend, StepInput } from './types';

interface Readback {
  buffer: GPUBuffer;
  busy: boolean;
}

const PARAM_BYTES = 48;

/**
 * WebGPU compute backend. A WGSL kernel integrates every particle in storage buffers; positions
 * are copied into two mappable buffers and read back asynchronously (one to two frames of
 * latency). The renderer then draws from the CPU copy, so this backend works with either
 * renderer. `onLost` fires if the device is lost so the caller can drop to the next tier.
 */
export class WebGpuSim implements SimBackend {
  readonly kind = 'webgpu' as const;
  readonly positionTexture = null;
  readonly textureSize = 0;
  readonly count: number;
  readonly positions: Float32Array<ArrayBuffer>;
  onLost: ((reason: string) => void) | null = null;

  readonly #device: GPUDevice;
  readonly #rest4: Float32Array<ArrayBuffer>;
  readonly #posBuf: GPUBuffer;
  readonly #velBuf: GPUBuffer;
  readonly #paramBuf: GPUBuffer;
  readonly #pipeline: GPUComputePipeline;
  readonly #bind: GPUBindGroup;
  readonly #readbacks: Readback[];
  readonly #paramBytes = new ArrayBuffer(PARAM_BYTES);
  readonly #paramF = new Float32Array(this.#paramBytes);
  readonly #paramU = new Uint32Array(this.#paramBytes);
  #disposed = false;

  private constructor(device: GPUDevice, rest: Float32Array, phase: Float32Array, wgsl: string) {
    this.#device = device;
    this.count = Math.floor(rest.length / 3);
    this.positions = new Float32Array(rest);
    const n = this.count;
    const bytes = n * 16;

    this.#rest4 = new Float32Array(n * 4);
    const pos4 = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) {
      this.#rest4.set([rest[i * 3]!, rest[i * 3 + 1]!, rest[i * 3 + 2]!, phase[i] ?? 0], i * 4);
      pos4.set([rest[i * 3]!, rest[i * 3 + 1]!, rest[i * 3 + 2]!, 1], i * 4);
    }
    const restBuf = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    this.#posBuf = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC });
    this.#velBuf = device.createBuffer({ size: bytes, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
    this.#paramBuf = device.createBuffer({ size: PARAM_BYTES, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
    device.queue.writeBuffer(restBuf, 0, this.#rest4);
    device.queue.writeBuffer(this.#posBuf, 0, pos4);
    device.queue.writeBuffer(this.#velBuf, 0, new Float32Array(n * 4));

    const module = device.createShaderModule({ code: wgsl });
    this.#pipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });
    this.#bind = device.createBindGroup({
      layout: this.#pipeline.getBindGroupLayout(0),
      entries: [
        { binding: 0, resource: { buffer: this.#paramBuf } },
        { binding: 1, resource: { buffer: restBuf } },
        { binding: 2, resource: { buffer: this.#posBuf } },
        { binding: 3, resource: { buffer: this.#velBuf } },
      ],
    });
    this.#readbacks = [0, 1].map(() => ({
      buffer: device.createBuffer({ size: bytes, usage: GPUBufferUsage.MAP_READ | GPUBufferUsage.COPY_DST }),
      busy: false,
    }));
    void device.lost.then((info) => {
      if (!this.#disposed) this.onLost?.(info.message || info.reason);
    });
  }

  /** Requests a device and compiles the kernel. Rejects when WebGPU or the shader is unusable. */
  static async create(rest: Float32Array, phase: Float32Array, wgsl: string): Promise<WebGpuSim> {
    const gpu = navigator.gpu;
    if (!gpu) throw new Error('WebGPU unavailable');
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error('No WebGPU adapter');
    const device = await adapter.requestDevice();
    device.pushErrorScope('validation');
    const sim = new WebGpuSim(device, rest, phase, wgsl);
    const error = await device.popErrorScope();
    if (error) {
      sim.dispose();
      throw new Error(`WGSL validation failed: ${error.message}`);
    }
    return sim;
  }

  step({ dt, time, pointer: p }: StepInput): void {
    if (this.#disposed) return;
    const f = this.#paramF;
    f[0] = dt;
    f[1] = time;
    f[2] = p.x;
    f[3] = p.y;
    f[4] = p.z;
    f[5] = p.radius;
    f[6] = p.strength;
    this.#paramU[7] = p.mode;
    this.#paramU[8] = this.count;
    this.#device.queue.writeBuffer(this.#paramBuf, 0, this.#paramBytes);

    const encoder = this.#device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(this.#pipeline);
    pass.setBindGroup(0, this.#bind);
    pass.dispatchWorkgroups(Math.ceil(this.count / 64));
    pass.end();
    const slot = this.#readbacks.find((r) => !r.busy);
    if (slot) {
      slot.busy = true;
      encoder.copyBufferToBuffer(this.#posBuf, 0, slot.buffer, 0, this.count * 16);
    }
    this.#device.queue.submit([encoder.finish()]);
    if (slot) {
      slot.buffer.mapAsync(GPUMapMode.READ).then(
        () => {
          const src = new Float32Array(slot.buffer.getMappedRange());
          const out = this.positions;
          for (let i = 0; i < this.count; i++) {
            out[i * 3] = src[i * 4]!;
            out[i * 3 + 1] = src[i * 4 + 1]!;
            out[i * 3 + 2] = src[i * 4 + 2]!;
          }
          slot.buffer.unmap();
          slot.busy = false;
        },
        () => {
          slot.busy = false;
        },
      );
    }
  }

  reset(): void {
    const n = this.count;
    const pos4 = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) pos4.set([this.#rest4[i * 4]!, this.#rest4[i * 4 + 1]!, this.#rest4[i * 4 + 2]!, 1], i * 4);
    this.#device.queue.writeBuffer(this.#posBuf, 0, pos4);
    this.#device.queue.writeBuffer(this.#velBuf, 0, new Float32Array(n * 4));
  }

  dispose(): void {
    if (this.#disposed) return;
    this.#disposed = true;
    for (const r of this.#readbacks) r.buffer.destroy();
    this.#posBuf.destroy();
    this.#velBuf.destroy();
    this.#paramBuf.destroy();
    this.#device.destroy();
  }
}
