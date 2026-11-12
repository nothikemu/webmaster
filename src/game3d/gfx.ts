/**
 * The renderer: Three.js plus a post-processing pipeline that turns a lit 3D scene into an engraving.
 *
 *   scene  ->  HDR colour + depth  ->  bloom (bright parts only)  ->  stylise  ->  screen
 *
 * "Stylise" is where the look comes from. Light level decides how much ink goes on the paper: bare paper in the light,
 * single hatching in the half-light, cross-hatching, then dense lines, then solid ink. Outlines are drawn wherever the depth
 * jumps (silhouettes) or its slope changes (creases). Everything is black ink on warm paper; there is no colour anywhere.
 *
 * Quality tiers trade resolution, shadows and bloom for speed, and the game picks one from the measured frame time.
 */
import {
  BackSide,
  Color,
  DepthTexture,
  DirectionalLight,
  FloatType,
  FogExp2,
  HalfFloatType,
  HemisphereLight,
  LinearFilter,
  Mesh,
  NoToneMapping,
  OrthographicCamera,
  PCFSoftShadowMap,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  BufferGeometry,
  Float32BufferAttribute,
  NearestFilter,
} from 'three';

export type Quality = 'high' | 'medium' | 'low';

/** Where the low sun is: far off to the north-east, so shadows fall toward the player and the sun sits in the picture. */
export const SUN_DIR = new Vector3(0.42, 0.27, -0.86).normalize();

const TIERS: Record<Quality, { pr: number; shadows: boolean; shadowMap: number; bloom: boolean; bloomScale: number }> = {
  high: { pr: 1.75, shadows: true, shadowMap: 2048, bloom: true, bloomScale: 0.5 },
  medium: { pr: 1.25, shadows: true, shadowMap: 1024, bloom: true, bloomScale: 0.35 },
  low: { pr: 1, shadows: false, shadowMap: 512, bloom: false, bloomScale: 0.25 },
};

/** A fullscreen triangle: cheaper than a quad and has no diagonal seam. */
function triangle(): BufferGeometry {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
  g.setAttribute('uv', new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));
  return g;
}

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const BRIGHT_FRAG = /* glsl */ `
uniform sampler2D tColor;
varying vec2 vUv;
void main() {
  vec3 c = texture2D(tColor, vUv).rgb;
  float m = max(c.r, max(c.g, c.b));
  gl_FragColor = vec4(c * smoothstep(1.15, 2.4, m), 1.0);
}
`;

const BLUR_FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform vec2 dir;
varying vec2 vUv;
void main() {
  vec3 s = texture2D(tColor, vUv).rgb * 0.227027;
  s += texture2D(tColor, vUv + dir * 1.3846).rgb * 0.316216 + texture2D(tColor, vUv - dir * 1.3846).rgb * 0.316216;
  s += texture2D(tColor, vUv + dir * 3.2308).rgb * 0.070270 + texture2D(tColor, vUv - dir * 3.2308).rgb * 0.070270;
  gl_FragColor = vec4(s, 1.0);
}
`;

const STYLE_FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform sampler2D tBloom;
uniform vec2 res;
uniform float near;
uniform float far;
uniform float time;
uniform float pr;
uniform float bloomAmt;
uniform float exposure;
uniform float fade;
uniform float debug;
uniform vec3 paper;
uniform vec3 ink;
varying vec2 vUv;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}
float invZ(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  if (d > 0.99999) return 0.0;
  return (far - d * (far - near)) / (near * far);
}
// one family of parallel ink strokes: 1 on a stroke, 0 between. thick is the share of each period that is ink.
float strokes(vec2 p, float ang, float spacing, float thick) {
  vec2 dir = vec2(cos(ang), sin(ang));
  float f = abs(fract(dot(p, dir) / spacing) - 0.5) * 2.0;
  float w = 1.0 - thick;
  float aa = 1.2 / spacing;
  return smoothstep(w - aa, w + aa, f);
}

void main() {
  vec2 px = 1.0 / res;
  vec3 hdr = texture2D(tColor, vUv).rgb;
  hdr += texture2D(tBloom, vUv).rgb * bloomAmt;
  float L = dot(hdr, vec3(0.2126, 0.7152, 0.0722));
  if (debug > 0.5 && debug < 1.5) { gl_FragColor = vec4(vec3(1.0 - exp(-L * exposure)), 1.0); return; }
  L = 1.0 - exp(-L * exposure);

  // ---- outlines: where depth jumps, and where its slope changes
  float w = pr * 1.1;
  float c = invZ(vUv);
  float l = invZ(vUv + vec2(-px.x, 0.0) * w), r = invZ(vUv + vec2(px.x, 0.0) * w);
  float u = invZ(vUv + vec2(0.0, px.y) * w), d = invZ(vUv + vec2(0.0, -px.y) * w);
  float edge = 0.0;
  if (c > 0.0 || l > 0.0 || r > 0.0 || u > 0.0 || d > 0.0) {
    float jump = max(max(abs(c - l), abs(c - r)), max(abs(c - u), abs(c - d))) / max(c, max(max(l, r), max(u, d))) ;
    float crease = abs(l + r + u + d - 4.0 * c) / max(c, 0.002);
    float nearFade = smoothstep(0.004, 0.03, c);
    edge = max(smoothstep(0.045, 0.10, jump), smoothstep(0.07, 0.16, crease) * nearFade);
  }
  // soft tonal edges (a lit face against a shaded one)
  vec3 hl = texture2D(tColor, vUv + vec2(-px.x, 0.0) * w).rgb, hr = texture2D(tColor, vUv + vec2(px.x, 0.0) * w).rgb;
  vec3 hu = texture2D(tColor, vUv + vec2(0.0, px.y) * w).rgb, hd = texture2D(tColor, vUv + vec2(0.0, -px.y) * w).rgb;
  float tone = length((hr - hl) * 0.5) + length((hu - hd) * 0.5);
  edge = max(edge, smoothstep(0.55, 1.1, tone) * 0.55);

  if (debug > 1.5 && debug < 2.5) { gl_FragColor = vec4(vec3(1.0 - edge), 1.0); return; }
  // ---- hatching: more ink where there is less light
  vec2 p = gl_FragCoord.xy / pr;
  p += (vec2(vnoise(p * 0.045), vnoise(p * 0.045 + 31.7)) - 0.5) * 3.2; // a hand that is not quite steady
  float sp = 4.6;
  float a = strokes(p, 0.785, sp, clamp((0.88 - L) * 1.35, 0.0, 0.62));
  float b = strokes(p, -0.785, sp, clamp((0.58 - L) * 1.7, 0.0, 0.62));
  float h = strokes(p, 0.02, sp * 0.9, clamp((0.36 - L) * 2.3, 0.0, 0.7));
  float solid = smoothstep(0.17, 0.05, L);
  float inkAmt = max(max(a, b), max(h, solid));
  if (debug > 2.5) edge = 0.0;
  inkAmt = max(inkAmt, edge);

  // paper, with a little fibre and a little grain
  float fibre = vnoise(gl_FragCoord.xy * 0.35 / pr) * 0.05 + vnoise(gl_FragCoord.xy * 0.03 / pr) * 0.05;
  vec3 pap = paper * (1.0 - fibre);
  vec3 col = mix(pap, ink, clamp(inkAmt, 0.0, 1.0));
  // the brightest light burns the paper white and the ink away
  float glow = smoothstep(0.93, 1.0, L);
  col = mix(col, vec3(0.985, 0.98, 0.955), glow);

  float vig = smoothstep(1.25, 0.35, length((vUv - 0.5) * vec2(1.0, 0.82)) * 1.45);
  col *= mix(0.55, 1.0, vig);
  col += (hash(gl_FragCoord.xy + floor(time * 24.0)) - 0.5) * 0.035;
  col = mix(vec3(0.05), col, fade);
  gl_FragColor = vec4(col, 1.0);
}
`;

/** The sky: a gradient, a low sun, and cloud banks that drift. Written as HDR so the sun blooms. */
const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() { vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }
`;
const SKY_FRAG = /* glsl */ `
uniform float time;
uniform vec3 sunDir;
uniform float dusk;
varying vec3 vDir;
float hash(vec2 p) { p = fract(p * vec2(127.1, 311.7)); p += dot(p, p + 19.19); return fract(p.x * p.y); }
float vnoise(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = p * 2.03 + 7.1; a *= 0.5; } return s; }
void main() {
  vec3 d = normalize(vDir);
  float h = clamp(d.y, -0.2, 1.0);
  float sky = mix(1.55, 0.05, pow(clamp(h, 0.0, 1.0), 0.5));          // pale mist at the horizon, near black overhead
  sky = mix(sky, 1.3, smoothstep(0.0, -0.2, d.y));
  // cloud banks on a plane above us
  vec2 uv = d.xz / (d.y + 0.35) * 1.6 + vec2(time * 0.012, time * 0.004);
  float n = fbm(uv * 1.3);
  float cover = smoothstep(0.42, 0.78, n) * smoothstep(-0.02, 0.28, d.y);
  float lit = 0.5 + 0.5 * dot(normalize(vec2(d.x, d.z) + 0.001), normalize(sunDir.xz + 0.001));
  float cloud = mix(0.3, 1.9, lit * (0.4 + 0.6 * fbm(uv * 3.1 + 4.0)));
  float v = mix(sky, cloud, cover * 0.85);
  // the sun, low and enormous
  float s = max(dot(d, normalize(sunDir)), 0.0);
  float disc = smoothstep(0.9965, 0.9985, s);
  float halo = pow(s, 28.0) * 0.8 + pow(s, 6.0) * 0.25;
  v += halo * (1.0 - cover * 0.6);
  vec3 col = vec3(v) + vec3(disc * 6.0);
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface Gfx {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  sun: DirectionalLight;
  hemi: HemisphereLight;
  fill: DirectionalLight;
  quality: Quality;
  time: number;
  /** 0 = black, 1 = the picture. Used for the fade between places. */
  fade: number;
  setQuality(q: Quality): void;
  /** Show the lit scene without the ink, for tuning. */
  setDebug(on: boolean): void;
  resize(w: number, h: number): void;
  render(dt: number): void;
  /** Move the shadow camera so it covers the area around a point. */
  followShadow(p: Vector3): void;
  /** Average milliseconds per frame over the last second, or 0 before enough frames. */
  frameMs(): number;
  dispose(): void;
}

export function createGfx(canvas: HTMLCanvasElement, initial: Quality): Gfx {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.type = PCFSoftShadowMap;
  renderer.setClearColor(new Color(0x000000), 1);

  const scene = new Scene();
  scene.fog = new FogExp2(new Color(1.25, 1.25, 1.22), 0.0125);
  const camera = new PerspectiveCamera(52, 16 / 9, 0.3, 700);
  const sunDir = SUN_DIR.clone();

  const sun = new DirectionalLight(0xffffff, 3.4);
  sun.position.copy(sunDir).multiplyScalar(80);
  sun.castShadow = true;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  sun.shadow.camera.left = -46;
  sun.shadow.camera.right = 46;
  sun.shadow.camera.top = 46;
  sun.shadow.camera.bottom = -46;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 200;
  scene.add(sun, sun.target);
  const hemi = new HemisphereLight(0xdcdcdc, 0x2b2b2b, 0.9);
  scene.add(hemi);
  const fill = new DirectionalLight(0xffffff, 7);
  fill.position.set(-30, 36, 60);
  scene.add(fill, fill.target);

  // sky dome, always centred on the camera
  const skyMat = new ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: { time: { value: 0 }, sunDir: { value: sunDir.clone() }, dusk: { value: 1 } } });
  const sky = new Mesh(new SphereGeometry(500, 32, 16), skyMat);
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
  scene.add(sky);

  const tri = triangle();
  const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const mats = {
    bright: new ShaderMaterial({ vertexShader: VERT, fragmentShader: BRIGHT_FRAG, uniforms: { tColor: { value: null } }, depthTest: false, depthWrite: false }),
    blur: new ShaderMaterial({ vertexShader: VERT, fragmentShader: BLUR_FRAG, uniforms: { tColor: { value: null }, dir: { value: new Vector2() } }, depthTest: false, depthWrite: false }),
    style: new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: STYLE_FRAG,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        tColor: { value: null },
        tDepth: { value: null },
        tBloom: { value: null },
        res: { value: new Vector2(1, 1) },
        near: { value: camera.near },
        far: { value: camera.far },
        time: { value: 0 },
        pr: { value: 1 },
        bloomAmt: { value: 0.9 },
        exposure: { value: 1.25 },
        fade: { value: 1 },
        debug: { value: 0 },
        paper: { value: new Color(0.93, 0.915, 0.87) },
        ink: { value: new Color(0.055, 0.055, 0.06) },
      },
    }),
  };

  const quad = new Mesh(tri, mats.style);
  quad.frustumCulled = false;
  const post = new Scene();
  post.add(quad);

  let rtScene: WebGLRenderTarget | null = null;
  let rtBright: WebGLRenderTarget | null = null;
  let rtA: WebGLRenderTarget | null = null;
  let rtB: WebGLRenderTarget | null = null;
  let W = 1;
  let H = 1;
  let quality: Quality = initial;
  const frames: number[] = [];

  function build() {
    rtScene?.dispose();
    rtBright?.dispose();
    rtA?.dispose();
    rtB?.dispose();
    const t = TIERS[quality];
    const pr = Math.min(window.devicePixelRatio || 1, t.pr);
    const w = Math.max(2, Math.floor(W * pr));
    const h = Math.max(2, Math.floor(H * pr));
    renderer.setPixelRatio(1);
    renderer.setSize(W * pr, H * pr, false);
    const depth = new DepthTexture(w, h);
    depth.type = FloatType;
    depth.minFilter = NearestFilter;
    depth.magFilter = NearestFilter;
    rtScene = new WebGLRenderTarget(w, h, { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthTexture: depth, depthBuffer: true });
    const bw = Math.max(2, Math.floor(w * t.bloomScale));
    const bh = Math.max(2, Math.floor(h * t.bloomScale));
    const opts = { type: HalfFloatType, format: RGBAFormat, minFilter: LinearFilter, magFilter: LinearFilter, depthBuffer: false };
    rtBright = new WebGLRenderTarget(bw, bh, opts);
    rtA = new WebGLRenderTarget(bw, bh, opts);
    rtB = new WebGLRenderTarget(bw, bh, opts);
    mats.style.uniforms.res!.value.set(w, h);
    mats.style.uniforms.pr!.value = pr;
    renderer.shadowMap.enabled = t.shadows;
    sun.castShadow = t.shadows;
    sun.shadow.mapSize.set(t.shadowMap, t.shadowMap);
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    scene.traverse((o) => {
      const m = (o as Mesh).material as { needsUpdate?: boolean } | undefined;
      if (m && !Array.isArray(m)) m.needsUpdate = true;
    });
  }

  const gfx: Gfx = {
    renderer,
    scene,
    camera,
    sun,
    hemi,
    fill,
    get quality() {
      return quality;
    },
    time: 0,
    fade: 1,
    setQuality(q) {
      if (q === quality) return;
      quality = q;
      build();
    },
    setDebug(on) {
      mats.style.uniforms.debug!.value = on ? Number(new URLSearchParams(location.search).get('debug') ?? 1) : 0;
    },
    resize(w, h) {
      W = Math.max(2, w);
      H = Math.max(2, h);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      build();
    },
    followShadow(p) {
      const snap = 2;
      const x = Math.round(p.x / snap) * snap;
      const z = Math.round(p.z / snap) * snap;
      sun.target.position.set(x, 0, z);
      sun.position.set(x + sunDir.x * 80, sunDir.y * 80, z + sunDir.z * 80);
      sun.target.updateMatrixWorld();
    },
    frameMs() {
      if (frames.length < 30) return 0;
      return frames.reduce((a, b) => a + b, 0) / frames.length;
    },
    render(dt) {
      const t0 = performance.now();
      gfx.time += dt;
      skyMat.uniforms.time!.value = gfx.time;
      sky.position.copy(camera.position);
      const tier = TIERS[quality];
      renderer.setRenderTarget(rtScene);
      renderer.clear();
      renderer.render(scene, camera);

      let bloomTex = rtScene!.texture;
      if (tier.bloom && rtBright && rtA && rtB) {
        quad.material = mats.bright;
        mats.bright.uniforms.tColor!.value = rtScene!.texture;
        renderer.setRenderTarget(rtBright);
        renderer.render(post, ortho);
        quad.material = mats.blur;
        let src = rtBright;
        for (let i = 0; i < 2; i++) {
          mats.blur.uniforms.tColor!.value = src.texture;
          mats.blur.uniforms.dir!.value.set(1 / rtA.width, 0);
          renderer.setRenderTarget(rtA);
          renderer.render(post, ortho);
          mats.blur.uniforms.tColor!.value = rtA.texture;
          mats.blur.uniforms.dir!.value.set(0, 1 / rtB.height);
          renderer.setRenderTarget(rtB);
          renderer.render(post, ortho);
          src = rtB;
        }
        bloomTex = rtB.texture;
      }
      const u = mats.style.uniforms;
      u.tColor!.value = rtScene!.texture;
      u.tDepth!.value = rtScene!.depthTexture;
      u.tBloom!.value = bloomTex;
      u.bloomAmt!.value = tier.bloom ? 0.9 : 0;
      u.time!.value = gfx.time;
      u.near!.value = camera.near;
      u.far!.value = camera.far;
      u.fade!.value = gfx.fade;
      quad.material = mats.style;
      renderer.setRenderTarget(null);
      renderer.render(post, ortho);
      frames.push(performance.now() - t0 + dt * 0);
      if (frames.length > 90) frames.shift();
    },
    dispose() {
      rtScene?.dispose();
      rtBright?.dispose();
      rtA?.dispose();
      rtB?.dispose();
      Object.values(mats).forEach((m) => m.dispose());
      // free everything the scene made, and give the graphics context back (browsers allow only a handful at once)
      scene.traverse((o) => {
        const m = o as Mesh;
        m.geometry?.dispose();
        const mat = m.material as { dispose?: () => void; map?: { dispose(): void } | null } | { dispose?: () => void }[] | undefined;
        for (const x of Array.isArray(mat) ? mat : [mat]) {
          (x as { map?: { dispose(): void } | null } | undefined)?.map?.dispose();
          x?.dispose?.();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
  return gfx;
}
