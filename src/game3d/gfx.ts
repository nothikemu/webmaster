/**
 * The renderer: Three.js plus one stylising pass that turns a lit 3D scene into a printed comic poster.
 *
 *   scene  ->  HDR colour + depth  ->  stylise  ->  screen
 *
 * "Stylise" is where the look comes from (see docs/STYLE_GUIDE.md). A pixel belongs to one of two families, chosen by its hue:
 * neutral (paper, ink) or red. Light level is cut into hard cel bands, and each band is printed with a halftone screen: bare colour
 * in the light, round dots in the half-light, denser dots, then solid ink. Thick black outlines are drawn wherever the depth jumps
 * (silhouettes) or its slope changes (creases). Nothing blends or glows: no bloom, no film grain, no per-frame noise.
 *
 * Quality tiers trade resolution and shadows for speed, and the game steps down a tier when the measured frame time is too long.
 */
import {
  BackSide,
  BufferGeometry,
  Color,
  DepthTexture,
  DirectionalLight,
  FloatType,
  FogExp2,
  Float32BufferAttribute,
  HalfFloatType,
  HemisphereLight,
  LinearFilter,
  Mesh,
  NearestFilter,
  NoToneMapping,
  OrthographicCamera,
  PCFShadowMap,
  PerspectiveCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
} from 'three';

export type Quality = 'high' | 'medium' | 'low';

/** Where the low sun is: far off to the north-east, so shadows fall toward the player and the sun sits in the picture. */
export const SUN_DIR = new Vector3(0.42, 0.5, -0.8).normalize();

/** pr: the most device pixels per CSS pixel we will draw (the biggest single lever on a laptop's GPU). */
const TIERS: Record<Quality, { pr: number; shadows: boolean; shadowMap: number; shadowSize: number }> = {
  high: { pr: 1.5, shadows: true, shadowMap: 1024, shadowSize: 38 },
  medium: { pr: 1.25, shadows: true, shadowMap: 1024, shadowSize: 30 },
  low: { pr: 1, shadows: false, shadowMap: 512, shadowSize: 30 },
};

/** The five colours of the whole picture. */
export const PALETTE = {
  ink: new Color(0.043, 0.043, 0.051),
  paper: new Color(0.96, 0.945, 0.915),
  red: new Color(0.89, 0.07, 0.165),
  redDeep: new Color(0.56, 0.043, 0.1),
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

const STYLE_FRAG = /* glsl */ `
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 res;
uniform float near;
uniform float far;
uniform float pr;
uniform float exposure;
uniform float fade;
uniform float wipeDir;
uniform float debug;
uniform vec3 paper;
uniform vec3 ink;
uniform vec3 red;
uniform vec3 redDeep;
varying vec2 vUv;

float invZ(vec2 uv) {
  float d = texture2D(tDepth, uv).x;
  if (d > 0.99999) return 0.0;
  return (far - d * (far - near)) / (near * far);
}

// A halftone screen at 45 degrees. a is how much ink (0 none, 1 solid); returns 1 on a dot. p is in CSS pixels.
float dots(vec2 p, float a, float cell) {
  if (a <= 0.002) return 0.0;
  if (a >= 0.998) return 1.0;
  vec2 q = vec2(p.x + p.y, p.x - p.y) * 0.70710678 / cell;
  float d = length(fract(q) - 0.5);
  float r = sqrt(a) * 0.74;
  float aa = 0.8 / (cell * pr);
  return 1.0 - smoothstep(r - aa, r + aa, d);
}

void main() {
  vec2 px = 1.0 / res;
  vec3 c = texture2D(tColor, vUv).rgb;
  float lum = dot(c, vec3(0.2126, 0.7152, 0.0722));
  float L = 1.0 - exp(-lum * exposure);
  if (debug > 0.5 && debug < 1.5) { gl_FragColor = vec4(vec3(L), 1.0); return; }

  // which family: red things stay red, everything else is paper and ink
  float rd = clamp((c.r - max(c.g, c.b)) / max(c.r, 0.0001), 0.0, 1.0);
  float isRed = smoothstep(0.5, 0.56, rd) * step(0.02, lum);

  // ---- outlines: thick black where the depth jumps, and where its slope changes
  float w = pr * 1.35;
  float z0 = invZ(vUv);
  float l = invZ(vUv + vec2(-px.x, 0.0) * w), r = invZ(vUv + vec2(px.x, 0.0) * w);
  float u = invZ(vUv + vec2(0.0, px.y) * w), d = invZ(vUv + vec2(0.0, -px.y) * w);
  float edge = 0.0;
  if (z0 > 0.0 || l > 0.0 || r > 0.0 || u > 0.0 || d > 0.0) {
    float jump = max(max(abs(z0 - l), abs(z0 - r)), max(abs(z0 - u), abs(z0 - d))) / max(z0, max(max(l, r), max(u, d)));
    float crease = abs(l + r + u + d - 4.0 * z0) / max(z0, 0.002);
    float nearFade = smoothstep(0.004, 0.03, z0);
    edge = max(smoothstep(0.04, 0.085, jump), smoothstep(0.07, 0.15, crease) * nearFade);
  }
  if (debug > 1.5 && debug < 2.5) { gl_FragColor = vec4(vec3(1.0 - edge), 1.0); return; }

  // ---- cel bands, printed as halftone
  vec2 p = gl_FragCoord.xy / pr;
  vec2 q = vUv - 0.5;
  float vig = smoothstep(0.95, 0.25, length(q * vec2(1.0, 0.85)));
  float Lv = L * mix(0.55, 1.0, vig);
  float b0 = smoothstep(0.075, 0.095, Lv);   // above core shadow
  float b1 = smoothstep(0.255, 0.285, Lv);   // above the dense half-tone
  float b2 = smoothstep(0.52, 0.55, Lv);     // above the light half-tone

  // ink coverage for neutral things, and for red things
  float covN = mix(1.0, 0.64, b0);
  covN = mix(covN, 0.30, b1);
  covN = mix(covN, 0.0, b2);
  float covR = mix(1.0, 0.7, b0);
  covR = mix(covR, 0.34, b1);
  covR = mix(covR, 0.0, b2);
  float cov = mix(covN, covR, isRed);
  float cell = 5.2;
  float dn = dots(p, cov, cell);

  vec3 base = mix(paper, red, isRed);
  vec3 col = mix(base, mix(ink, redDeep, isRed * (1.0 - step(0.9, cov))), dn);

  col = mix(col, ink, edge);

  // ---- place changes: a slanted wipe, black with a red leading edge
  if (fade < 0.999) {
    float s = (wipeDir > 0.0 ? vUv.x : 1.0 - vUv.x) * 0.72 + vUv.y * 0.28;
    float front = fade * 1.3 - 0.15;
    float shown = step(s, front - 0.06);
    float bar = step(s, front) * (1.0 - shown);
    col = mix(ink, col, shown);
    col = mix(col, red, bar);
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

/** The sky: a red field fading to black overhead, slanted rays turning around a pale sun. Written as HDR so the bands land where we want them. */
const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main() { vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * p; gl_Position.z = gl_Position.w; }
`;
const SKY_FRAG = /* glsl */ `
uniform float time;
uniform vec3 sunDir;
varying vec3 vDir;
void main() {
  vec3 d = normalize(vDir);
  vec3 S = normalize(sunDir);
  float h = clamp(d.y, 0.0, 1.0);
  float base = mix(1.05, 0.17, pow(h, 0.5));
  // rays around the sun, turning very slowly
  vec3 u = normalize(cross(S, vec3(0.0, 1.0, 0.0)));
  vec3 v = cross(S, u);
  float ang = atan(dot(d, v), dot(d, u));
  float sd = max(dot(d, S), 0.0);
  float tri = abs(fract(ang * 11.0 / 6.2831853 + time * 0.006) - 0.5) * 2.0;
  float ray = smoothstep(0.47, 0.53, tri);
  base *= mix(0.6, 1.0, ray) ;
  // a ring of paler sky close to the sun
  base += pow(sd, 5.0) * 0.5;
  vec3 col = vec3(base * 4.0, base * 0.26, base * 0.3);
  // below the horizon the sea takes over, but keep a pale band so the horizon line reads
  col = mix(col, vec3(1.3), smoothstep(0.0, -0.18, d.y));
  float disc = smoothstep(0.9968, 0.9978, sd);
  col = mix(col, vec3(7.0), disc);
  gl_FragColor = vec4(col, 1.0);
}
`;

export interface GfxStats {
  calls: number;
  tris: number;
  sceneCalls: number;
  sceneTris: number;
  passes: number;
  geometries: number;
  textures: number;
  programs: number;
  cpuMs: number;
}

export interface Gfx {
  renderer: WebGLRenderer;
  scene: Scene;
  camera: PerspectiveCamera;
  sun: DirectionalLight;
  hemi: HemisphereLight;
  fill: DirectionalLight;
  quality: Quality;
  time: number;
  /** 0 = black, 1 = the picture. Used for the wipe between places. */
  fade: number;
  /** +1 wipes in from the left, -1 from the right. */
  wipeDir: number;
  setQuality(q: Quality): void;
  /** Show the lit scene without the ink, for tuning. */
  setDebug(on: boolean): void;
  resize(w: number, h: number): void;
  render(dt: number): void;
  /** Move the shadow camera so it covers the area around a point. */
  followShadow(p: Vector3): void;
  /** Average milliseconds per frame over the last second, or 0 before enough frames. */
  frameMs(): number;
  /** What the last frame cost: draw calls, triangles, passes, and the CPU time spent submitting it. */
  stats: GfxStats;
  dispose(): void;
}

export function createGfx(canvas: HTMLCanvasElement, initial: Quality): Gfx {
  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'high-performance', stencil: false });
  renderer.toneMapping = NoToneMapping;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.setClearColor(new Color(0x000000), 1);
  renderer.info.autoReset = false; // the picture is more than one pass; count them all
  const stats: GfxStats = { calls: 0, tris: 0, sceneCalls: 0, sceneTris: 0, passes: 0, geometries: 0, textures: 0, programs: 0, cpuMs: 0 };

  const scene = new Scene();
  scene.fog = new FogExp2(new Color(1.25, 1.25, 1.22), 0.0125);
  const camera = new PerspectiveCamera(52, 16 / 9, 0.3, 520);
  const sunDir = SUN_DIR.clone();

  const sun = new DirectionalLight(0xffffff, 3.4);
  sun.position.copy(sunDir).multiplyScalar(80);
  sun.castShadow = true;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.05;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 160;
  scene.add(sun, sun.target);
  const hemi = new HemisphereLight(0xdcdcdc, 0x2b2b2b, 0.9);
  scene.add(hemi);
  const fill = new DirectionalLight(0xffffff, 7);
  fill.position.set(-30, 36, 60);
  scene.add(fill, fill.target);

  // sky dome, always centred on the camera
  const skyMat = new ShaderMaterial({ vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, side: BackSide, depthWrite: false, depthTest: false, fog: false, uniforms: { time: { value: 0 }, sunDir: { value: sunDir.clone() } } });
  const sky = new Mesh(new SphereGeometry(400, 24, 12), skyMat);
  sky.renderOrder = -1000;
  sky.frustumCulled = false;
  scene.add(sky);

  const tri = triangle();
  const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const style = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: STYLE_FRAG,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tColor: { value: null },
      tDepth: { value: null },
      res: { value: new Vector2(1, 1) },
      near: { value: camera.near },
      far: { value: camera.far },
      pr: { value: 1 },
      exposure: { value: 1.25 },
      fade: { value: 1 },
      wipeDir: { value: 1 },
      debug: { value: 0 },
      paper: { value: PALETTE.paper },
      ink: { value: PALETTE.ink },
      red: { value: PALETTE.red },
      redDeep: { value: PALETTE.redDeep },
    },
  });
  const quad = new Mesh(tri, style);
  quad.frustumCulled = false;
  const post = new Scene();
  post.add(quad);

  let rtScene: WebGLRenderTarget | null = null;
  let W = 1;
  let H = 1;
  let quality: Quality = initial;
  const frames: number[] = [];

  function build() {
    rtScene?.dispose();
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
    style.uniforms.res!.value.set(w, h);
    style.uniforms.pr!.value = pr;
    renderer.shadowMap.enabled = t.shadows;
    sun.castShadow = t.shadows;
    sun.shadow.mapSize.set(t.shadowMap, t.shadowMap);
    const s = t.shadowSize;
    sun.shadow.camera.left = -s;
    sun.shadow.camera.right = s;
    sun.shadow.camera.top = s;
    sun.shadow.camera.bottom = -s;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.map?.dispose();
    sun.shadow.map = null;
    // materials must be rebuilt when shadows are switched on or off
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
    wipeDir: 1,
    setQuality(q) {
      if (q === quality) return;
      quality = q;
      build();
    },
    setDebug(on) {
      style.uniforms.debug!.value = on ? Number(new URLSearchParams(location.search).get('debug') ?? 1) : 0;
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
    stats,
    frameMs() {
      if (frames.length < 30) return 0;
      return frames.reduce((a, b) => a + b, 0) / frames.length;
    },
    render(dt) {
      const t0 = performance.now();
      gfx.time += dt;
      skyMat.uniforms.time!.value = gfx.time;
      sky.position.copy(camera.position);
      renderer.info.reset();
      renderer.setRenderTarget(rtScene);
      renderer.clear();
      renderer.render(scene, camera);
      stats.sceneCalls = renderer.info.render.calls;
      stats.sceneTris = renderer.info.render.triangles;
      const u = style.uniforms;
      u.tColor!.value = rtScene!.texture;
      u.tDepth!.value = rtScene!.depthTexture;
      u.near!.value = camera.near;
      u.far!.value = camera.far;
      u.fade!.value = gfx.fade;
      u.wipeDir!.value = gfx.wipeDir;
      renderer.setRenderTarget(null);
      renderer.render(post, ortho);
      stats.passes = 2;
      stats.calls = renderer.info.render.calls;
      stats.tris = renderer.info.render.triangles;
      stats.geometries = renderer.info.memory.geometries;
      stats.textures = renderer.info.memory.textures;
      stats.programs = renderer.info.programs?.length ?? 0;
      stats.cpuMs = performance.now() - t0;
      frames.push(stats.cpuMs);
      if (frames.length > 90) frames.shift();
    },
    dispose() {
      rtScene?.dispose();
      style.dispose();
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
