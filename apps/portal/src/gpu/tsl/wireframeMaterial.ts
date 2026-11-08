/* eslint-disable @typescript-eslint/no-explicit-any -- TSL builds shader graphs with a chained,
   dynamically typed node API; the graph is created once at startup, never per frame. */
import { LineBasicNodeMaterial, MeshBasicNodeMaterial } from 'three/webgpu';
import { abs, clamp, cos, dot, float, floor, fract, mix, mx_noise_float, normalView, normalize, positionLocal, pow, select, sin, smoothstep, step, uniform, vec3 } from 'three/tsl';

/** TSL twin of wire.vert.glsl for the WebGPU renderer. Same uniforms, same four deformations. */
export interface WireTsl {
  material: LineBasicNodeMaterial;
  /** The cel-shaded globe under the mesh. */
  globe: MeshBasicNodeMaterial;
  uniforms: {
    time: { value: number };
    displacement: { value: number };
    fragment: { value: number };
    marker: { value: number };
    warn: { value: number };
  };
}

export function createWireTsl(): WireTsl {
  const uTime = uniform(0);
  const uDisplacement = uniform(0);
  const uFragment = uniform(0);
  const uMarker = uniform(0);
  const uWarn = uniform(0);

  const p: any = positionLocal;
  const n: any = normalize(p);

  // Weights that pick exactly one deformation from the marker index.
  const w0: any = step(uMarker, 0.5);
  const w1: any = step(0.5, uMarker).mul(step(uMarker, 1.5));
  const w2: any = step(1.5, uMarker).mul(step(uMarker, 2.5));
  const w3: any = step(2.5, uMarker);

  // 0: Bias Drift
  const bias: any = smoothstep(-0.3, 0.9, p.x);
  const d0: any = mx_noise_float(p.mul(1.7).add(uTime.mul(0.18)));
  const off0: any = n.mul(d0.mul(0.5).add(0.1)).mul(uDisplacement).mul(float(0.25).add(bias.mul(0.75))).mul(0.7);
  const st0: any = abs(d0).mul(bias).mul(uDisplacement);

  // 1: Data Leakage
  const h: any = fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))).mul(43758.5453));
  const burst: any = pow(h, 2.2);
  const off1: any = n.mul(burst).mul(uFragment).mul(1.25);
  const st1: any = burst.mul(uFragment);

  // 2: Adversarial Input (twist, then jitter)
  const ang: any = uDisplacement.mul(1.7).mul(p.y);
  const c: any = cos(ang);
  const s: any = sin(ang);
  const twisted: any = vec3(p.x.mul(c).sub(p.z.mul(s)), p.y, p.x.mul(s).add(p.z.mul(c)));
  const j: any = mx_noise_float(twisted.mul(9.0).add(uTime.mul(1.3)));
  const off2: any = n.mul(j).mul(0.07).mul(uDisplacement);
  const st2: any = abs(j).mul(uDisplacement);

  // 3: Opaque Decisioning (tearing)
  const band: any = floor(p.y.add(1.0).mul(5.0));
  const shift: any = sin(band.mul(1.9).add(uTime.mul(1.1)));
  const torn: any = step(0.0, shift);
  const off3: any = vec3(shift.mul(0.42).mul(uDisplacement).mul(torn), 0.0, sin(p.y.mul(16.0).add(uTime.mul(2.0))).mul(0.08).mul(uDisplacement));
  const st3: any = abs(shift).mul(uDisplacement).mul(torn);

  const base: any = p.mul(w0.add(w1).add(w3)).add(twisted.mul(w2));
  const offset: any = off0.mul(w0).add(off1.mul(w1)).add(off2.mul(w2)).add(off3.mul(w3));
  const stress: any = st0.mul(w0).add(st1.mul(w1)).add(st2.mul(w2)).add(st3.mul(w3));

  const material = new LineBasicNodeMaterial();
  material.positionNode = base.add(offset).mul(1.35);
  const cool: any = mix(vec3(1.0, 0.69, 0.72), vec3(0.78, 0.26, 0.32), p.y.mul(0.5).add(0.5));
  const warn = vec3(1.0, 0.9, 0.55);
  const wmix: any = clamp(uWarn.mul(float(0.3).add(stress.mul(1.6))), 0, 1);
  material.colorNode = mix(cool, warn, wmix);
  material.opacityNode = float(0.34).add(clamp(stress.mul(1.5), 0, 1).mul(0.5)).add(uWarn.mul(0.1));
  material.transparent = true;
  material.depthWrite = false;

  // The globe: three flat navy bands and a paper rim, the twin of globe.frag.glsl.
  const nv: any = normalize(normalView);
  const ndl: any = dot(nv, normalize(vec3(-0.5, 0.6, 0.7)));
  const bands: any = select(ndl.greaterThan(0.2), vec3(0.2, 0.09, 0.12), select(ndl.greaterThan(-0.3), vec3(0.13, 0.05, 0.08), vec3(0.07, 0.03, 0.05)));
  const globe = new MeshBasicNodeMaterial();
  globe.colorNode = select(float(1).sub(abs(nv.z)).greaterThan(0.93), vec3(1.0, 0.69, 0.72), bands);

  return {
    material,
    globe,
    uniforms: { time: uTime as any, displacement: uDisplacement as any, fragment: uFragment as any, marker: uMarker as any, warn: uWarn as any },
  };
}
