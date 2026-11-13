/** Moving things that are not people: water, motes, smoke and sparks, gulls, cloth. */
import type {
  Object3D,
  Vector3} from 'three';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  NormalBlending,
  type MeshLambertMaterial,
  PlaneGeometry,
  Points,
  ShaderMaterial
} from 'three';
import { ball, mesh } from './kit';
import type { Mats } from './mat';

// ---------------------------------------------------------------------------------------------- water
const WATER_VERT = /* glsl */ `
uniform float time;
varying vec3 vW;
varying vec3 vN;
vec3 wave(vec2 p, float t, out vec2 grad) {
  vec2 d1 = normalize(vec2(1.0, 0.35)), d2 = normalize(vec2(-0.4, 1.0)), d3 = normalize(vec2(0.7, -0.8)), d4 = normalize(vec2(-1.0, -0.3));
  float a1 = dot(p, d1) * 0.22 + t * 0.9, a2 = dot(p, d2) * 0.31 + t * 1.2, a3 = dot(p, d3) * 0.55 + t * 1.7, a4 = dot(p, d4) * 0.9 + t * 2.3;
  float h = 0.20 * sin(a1) + 0.12 * sin(a2) + 0.05 * sin(a3) + 0.025 * sin(a4);
  grad = d1 * 0.22 * 0.20 * cos(a1) + d2 * 0.31 * 0.12 * cos(a2) + d3 * 0.55 * 0.05 * cos(a3) + d4 * 0.9 * 0.025 * cos(a4);
  return vec3(0.0, h, 0.0);
}
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vec2 g;
  w.xyz += wave(w.xz, time, g);
  vW = w.xyz;
  vN = normalize(vec3(-g.x, 1.0, -g.y));
  gl_Position = projectionMatrix * viewMatrix * w;
}
`;
const WATER_FRAG = /* glsl */ `
uniform float time;
uniform vec3 sunDir;
uniform float fogDensity;
uniform float quayZ;
varying vec3 vW;
varying vec3 vN;
float hash(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
void main() {
  vec3 V = normalize(cameraPosition - vW);
  vec3 N = normalize(vN);
  float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  vec3 R = reflect(-V, N);
  float ss = max(dot(R, normalize(sunDir)), 0.0);
  float spec = smoothstep(0.985, 0.992, ss);
  // slanted wave strokes: paper-white lines on black water, drifting
  float band = sin((vW.x * 0.55 - vW.z * 1.0) * 1.15 + time * 0.8 + vnoise(vW.xz * 0.22) * 5.0);
  float stroke = smoothstep(0.80, 0.84, band);
  float band2 = sin((vW.x * 0.9 + vW.z * 0.6) * 0.8 - time * 0.55 + vnoise(vW.xz * 0.4 + 7.0) * 4.0);
  float stroke2 = smoothstep(0.90, 0.93, band2) * 0.8;
  // white water against the quay
  float edge = abs(vW.z - quayZ);
  float foam = smoothstep(2.2, 0.0, edge - 0.5 * sin(vW.x * 0.6 + time * 0.8)) * smoothstep(0.4, 0.62, vnoise(vW.xz * 1.4 + vec2(time * 0.5, 0.0)));
  float white = max(max(stroke, stroke2), foam);
  // the sky is red, so the sea picks it up toward the horizon
  float redness = smoothstep(0.1, 0.8, fres);
  vec3 col = mix(vec3(0.03), vec3(1.4), white);
  col = mix(col, vec3(2.4, 0.16, 0.2) * (0.5 + 0.5 * redness), redness * (1.0 - white));
  col = mix(col, vec3(7.0), spec);
  float dist = length(cameraPosition - vW);
  float f = 1.0 - exp(-pow(dist * fogDensity, 2.0));
  col = mix(col, vec3(1.25), f);
  gl_FragColor = vec4(col, 1.0);
}
`;
export function makeWater(sunDir: Vector3, fogDensity: number, quayZ: number) {
  const g = new PlaneGeometry(900, 900, 100, 100); // 20k triangles; the waves are long and shallow, so a coarse sea costs nothing you can see
  g.rotateX(-Math.PI / 2);
  const m = new ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, uniforms: { time: { value: 0 }, sunDir: { value: sunDir.clone() }, fogDensity: { value: fogDensity }, quayZ: { value: quayZ } } });
  const o = new Mesh(g, m);
  o.position.y = -1.05;
  o.frustumCulled = false;
  return {
    mesh: o,
    update(t: number, cx: number, cz: number) {
      m.uniforms.time!.value = t;
      o.position.x = Math.round(cx / 5) * 5;
      o.position.z = Math.round(cz / 5) * 5;
    },
  };
}

// ---------------------------------------------------------------------------------------------- emitters
const EM_VERT = /* glsl */ `
attribute float age;
attribute float seed;
uniform float size;
uniform float grow;
uniform float scale;
varying float vAge;
varying float vSeed;
void main() {
  vAge = age; vSeed = seed;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  gl_PointSize = size * (1.0 + grow * age) * scale / -mv.z;
  gl_Position = projectionMatrix * mv;
}
`;
const EM_FRAG = /* glsl */ `
uniform vec3 color;
uniform float alpha;
varying float vAge;
varying float vSeed;
void main() {
  if (vAge >= 1.0) discard;
  vec2 q = gl_PointCoord - 0.5;
  float r = length(q) * 2.0;
  float a = (1.0 - smoothstep(0.35, 1.0, r)) * (1.0 - vAge) * alpha;
  gl_FragColor = vec4(color, a);
}
`;

export interface EmitterOpts {
  count: number;
  origin: Vector3;
  /** Spread of the start position. */
  spread: number;
  rise: number;
  drift: number;
  life: number;
  size: number;
  grow: number;
  color: number;
  alpha: number;
  additive: boolean;
}

/** A pool of soft sprites that are born at a point, rise, spread and fade. Used for smoke, embers, sparks and spray. */
export function makeEmitter(o: EmitterOpts) {
  const n = o.count;
  const pos = new Float32Array(n * 3);
  const age = new Float32Array(n);
  const seed = new Float32Array(n);
  const vel = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    age[i] = i / n;
    seed[i] = Math.random();
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('age', new BufferAttribute(age, 1));
  g.setAttribute('seed', new BufferAttribute(seed, 1));
  const m = new ShaderMaterial({
    vertexShader: EM_VERT,
    fragmentShader: EM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: o.additive ? AdditiveBlending : NormalBlending,
    uniforms: { size: { value: o.size }, grow: { value: o.grow }, scale: { value: 700 }, color: { value: new Color(o.color) }, alpha: { value: o.alpha } },
  });
  const pts = new Points(g, m);
  pts.frustumCulled = false;
  const reset = (i: number) => {
    pos[i * 3] = o.origin.x + (Math.random() - 0.5) * o.spread;
    pos[i * 3 + 1] = o.origin.y;
    pos[i * 3 + 2] = o.origin.z + (Math.random() - 0.5) * o.spread;
    vel[i * 3] = (Math.random() - 0.5) * o.drift;
    vel[i * 3 + 1] = o.rise * (0.6 + Math.random() * 0.8);
    vel[i * 3 + 2] = (Math.random() - 0.5) * o.drift;
    age[i] = 0;
  };
  for (let i = 0; i < n; i++) {
    reset(i);
    age[i] = i / n;
    pos[i * 3 + 1] = pos[i * 3 + 1]! + vel[i * 3 + 1]! * age[i]! * o.life;
  }
  return {
    points: pts,
    material: m,
    update(dt: number, wind = 0) {
      for (let i = 0; i < n; i++) {
        age[i] = age[i]! + dt / o.life;
        if (age[i]! >= 1) reset(i);
        pos[i * 3] = pos[i * 3]! + (vel[i * 3]! + wind) * dt;
        pos[i * 3 + 1] = pos[i * 3 + 1]! + vel[i * 3 + 1]! * dt;
        pos[i * 3 + 2] = pos[i * 3 + 2]! + vel[i * 3 + 2]! * dt;
      }
      g.attributes.position!.needsUpdate = true;
      g.attributes.age!.needsUpdate = true;
    },
    setScale(h: number) {
      m.uniforms.scale!.value = h;
    },
  };
}

/** Pale motes that drift through the air near the player, like dust in a lamp's light. */
export function makeMotes(count: number) {
  const pos = new Float32Array(count * 3);
  const base = new Float32Array(count * 3);
  const ph = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    base[i * 3] = (Math.random() - 0.5) * 60;
    base[i * 3 + 1] = Math.random() * 9 + 0.2;
    base[i * 3 + 2] = (Math.random() - 0.5) * 60;
    ph[i] = Math.random() * 6.28;
  }
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(pos, 3));
  g.setAttribute('age', new BufferAttribute(new Float32Array(count).fill(0.0), 1));
  g.setAttribute('seed', new BufferAttribute(new Float32Array(count).fill(0.5), 1));
  const m = new ShaderMaterial({
    vertexShader: EM_VERT,
    fragmentShader: EM_FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: { size: { value: 0.1 }, grow: { value: 0 }, scale: { value: 700 }, color: { value: new Color(3, 3, 2.8) }, alpha: { value: 0.85 } },
  });
  const pts = new Points(g, m);
  pts.frustumCulled = false;
  return {
    points: pts,
    material: m,
    update(t: number, around: Vector3) {
      for (let i = 0; i < count; i++) {
        let x = base[i * 3]! + Math.sin(t * 0.3 + ph[i]!) * 1.2;
        let z = base[i * 3 + 2]! + Math.cos(t * 0.25 + ph[i]!) * 1.2;
        // keep the cloud centred on the player by wrapping each mote into a 60 m box around them
        x = ((((x - around.x + 30) % 60) + 60) % 60) - 30 + around.x;
        z = ((((z - around.z + 30) % 60) + 60) % 60) - 30 + around.z;
        pos[i * 3] = x;
        pos[i * 3 + 1] = base[i * 3 + 1]! + Math.sin(t * 0.5 + ph[i]!) * 0.4;
        pos[i * 3 + 2] = z;
      }
      g.attributes.position!.needsUpdate = true;
    },
    setScale(h: number) {
      m.uniforms.scale!.value = h;
    },
  };
}

// ---------------------------------------------------------------------------------------------- gulls and cloth
export function makeGull(mats: Mats): { group: Group; flap(t: number, k: number): void } {
  const g = new Group();
  const body = ball(0.16, mats.white, [0, 0, 0], 8, false);
  body.scale.set(0.8, 0.6, 1.8);
  const wl = new Group();
  const wr = new Group();
  wl.add(mesh(new PlaneGeometry(1.1, 0.34), mats.white, [-0.55, 0, 0], [-Math.PI / 2, 0, 0], false));
  wr.add(mesh(new PlaneGeometry(1.1, 0.34), mats.white, [0.55, 0, 0], [-Math.PI / 2, 0, 0], false));
  g.add(body, wl, wr);
  g.traverse((o) => {
    const m = (o as Mesh).material as { side?: number } | undefined;
    if (m) m.side = DoubleSide;
  });
  return {
    group: g,
    flap(t, k) {
      const a = Math.sin(t * 5 + k) * 0.55;
      wl.rotation.z = a;
      wr.rotation.z = -a;
    },
  };
}

/** A flag: a plane whose back edge ripples. */
export function makeFlag(w: number, h: number, mat: MeshLambertMaterial) {
  const g = new PlaneGeometry(w, h, 14, 6);
  const base = Float32Array.from(g.attributes.position!.array as Float32Array);
  const m = new Mesh(g, mat);
  m.castShadow = true;
  mat.side = DoubleSide;
  return {
    mesh: m,
    update(t: number) {
      const p = g.attributes.position!;
      for (let i = 0; i < p.count; i++) {
        const x = base[i * 3]!;
        const u = (x + w / 2) / w;
        p.setZ(i, Math.sin(u * 7 - t * 4.2) * 0.22 * u + Math.sin(u * 3 - t * 2.1) * 0.08 * u);
        p.setY(i, base[i * 3 + 1]! - Math.sin(u * 5 - t * 3) * 0.05 * u);
      }
      p.needsUpdate = true;
      g.computeVertexNormals();
    },
  };
}

export type Animator = (dt: number, t: number) => void;

export const spinner = (o: Object3D, axis: 'x' | 'y' | 'z', speed: number): Animator => (dt) => {
  o.rotation[axis] += dt * speed;
};

export const bob = (o: Object3D, amp: number, speed: number, phase = 0): Animator => {
  const y0 = o.position.y;
  return (_dt, t) => {
    o.position.y = y0 + Math.sin(t * speed + phase) * amp;
  };
};

