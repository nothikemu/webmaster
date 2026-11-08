/* eslint-disable @typescript-eslint/no-explicit-any -- TSL builds shader graphs with a chained,
   dynamically typed node API; the graph is created once at startup, never per frame. */
import { InstancedBufferAttribute, LineBasicNodeMaterial, SpriteNodeMaterial, Vector3, type BufferAttribute } from 'three/webgpu';
import { attribute, distance, dot, float, instancedBufferAttribute, length, max, mix, normalize, positionLocal, select, smoothstep, sqrt, uniform, uv, vec3 } from 'three/tsl';

/**
 * TSL (node) twins of particle.*.glsl and link.*.glsl, used when the renderer is WebGPU.
 * Positions come from a CPU array, because the WebGPU compute backend reads back to the CPU.
 */
export interface SwarmTsl {
  pointMaterial: SpriteNodeMaterial;
  linkMaterial: LineBasicNodeMaterial;
  positions: InstancedBufferAttribute;
  uniforms: { pointer: Vector3; radius: { value: number }; presence: { value: number }; size: { value: number }; maxLen: { value: number }; opacity: { value: number } };
}

export function createSwarmTsl(seed: Float32Array, rest: Float32Array, initial: Float32Array, radius: number, maxLen: number): SwarmTsl {
  const positions = new InstancedBufferAttribute(initial.slice(), 3);
  positions.setUsage(35048); // DynamicDrawUsage
  const restAttr = new InstancedBufferAttribute(rest, 3);
  const seedAttr = new InstancedBufferAttribute(seed, 1);

  const uPointer = uniform(new Vector3());
  const uRadius = uniform(radius);
  const uPresence = uniform(0);
  const uSize = uniform(0.034);
  const uMaxLen = uniform(maxLen);
  const uOpacity = uniform(0.55);

  const left = vec3(0.23, 0.66, 0.62);
  const right = vec3(0.78, 0.95, 0.92);
  const hot = vec3(1.0, 0.27, 0.33);
  const linkLeft = vec3(0.16, 0.5, 0.48);
  const linkRight = vec3(0.55, 0.8, 0.77);

  // Points ------------------------------------------------------------------------------------
  const pos: any = instancedBufferAttribute(positions as unknown as BufferAttribute);
  const rst: any = instancedBufferAttribute(restAttr as unknown as BufferAttribute);
  const sd: any = instancedBufferAttribute(seedAttr as unknown as BufferAttribute);
  const disp: any = length(pos.sub(rst));
  const infl: any = uPresence.mul(float(1).sub(smoothstep(0, uRadius, length(pos.sub(uPointer)))));
  const t: any = rst.x.add(2.4).div(4.8).clamp(0, 1);
  const tint: any = mix(mix(left, right, t), hot, infl.add(disp.mul(1.4)).clamp(0, 1));
  const sprite = new SpriteNodeMaterial();
  sprite.positionNode = pos;
  sprite.scaleNode = uSize.mul(float(0.7).add(sd.mul(0.6)).add(infl.mul(1.1)).add(disp.mul(1.6)));
  // A flat disc: the base, a hard shade crescent away from the light, a dark ring. No highlight.
  const q: any = uv().sub(0.5).mul(2);
  const dd: any = length(q);
  const nrm: any = vec3(q.x, q.y, sqrt(max(float(0), float(1).sub(dd.mul(dd)))));
  const ndl: any = dot(nrm, normalize(vec3(-0.5, 0.6, 0.7)));
  const shaded: any = tint.mul(vec3(0.52, 0.57, 0.68));
  const lit: any = select(ndl.greaterThan(0.1), tint, shaded);
  sprite.colorNode = select(dd.greaterThan(0.8), vec3(0.04, 0.07, 0.1), lit);
  sprite.opacityNode = select(dd.greaterThan(1.0), float(0), float(1));
  sprite.alphaTest = 0.5;
  sprite.transparent = false;
  sprite.depthWrite = true;

  // Links -------------------------------------------------------------------------------------
  const other: any = attribute('aOther', 'vec3');
  const base: any = attribute('aBase', 'float');
  const at: any = attribute('aT', 'float');
  const own: any = positionLocal;
  const len: any = distance(own, other);
  const fall: any = float(1).sub(smoothstep(uMaxLen.mul(0.4), uMaxLen, len));
  const linkInfl: any = uPresence.mul(float(1).sub(smoothstep(0, uRadius, length(own.sub(uPointer)))));
  const line = new LineBasicNodeMaterial();
  line.colorNode = mix(mix(linkLeft, linkRight, at), hot, linkInfl.clamp(0, 1));
  line.opacityNode = base.mul(fall).mul(uOpacity).mul(0.7).mul(float(1).add(linkInfl.mul(1.2))).clamp(0, 1);
  line.transparent = true;
  line.depthWrite = false;

  return {
    pointMaterial: sprite,
    linkMaterial: line,
    positions,
    uniforms: { pointer: uPointer.value as Vector3, radius: uRadius as any, presence: uPresence as any, size: uSize as any, maxLen: uMaxLen as any, opacity: uOpacity as any },
  };
}
