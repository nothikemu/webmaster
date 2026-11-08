// Module C wireframe. One vertex shader, four deformations selected by uMarkerIndex:
//   0 Bias Drift          lopsided noise displacement
//   1 Data Leakage        vertices thrown outward along their normals
//   2 Adversarial Input   twist plus high-frequency jitter
//   3 Opaque Decisioning  sinusoidal tearing in horizontal bands
// Simplex noise: Ashima Arts and Stefan Gustavson, MIT license.
uniform float uTime;
uniform float uDisplacement;
uniform float uFragment;
uniform float uMarkerIndex;
uniform float uWarn;

varying vec3 vColor;
varying float vAlpha;

vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

void main() {
  vec3 p = position;
  vec3 n = normalize(position);
  vec3 offset = vec3(0.0);
  float stress = 0.0;

  if (uMarkerIndex < 0.5) {
    float bias = smoothstep(-0.3, 0.9, p.x);
    float d = snoise(p * 1.7 + vec3(uTime * 0.18));
    offset = n * (d * 0.5 + 0.1) * uDisplacement * (0.25 + 0.75 * bias) * 0.7;
    stress = abs(d) * bias * uDisplacement;
  } else if (uMarkerIndex < 1.5) {
    float h = fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453);
    float burst = pow(h, 2.2);
    offset = n * burst * uFragment * 1.25;
    stress = burst * uFragment;
  } else if (uMarkerIndex < 2.5) {
    float ang = uDisplacement * 1.7 * p.y;
    float c = cos(ang);
    float s = sin(ang);
    p.xz = mat2(c, -s, s, c) * p.xz;
    float j = snoise(p * 9.0 + vec3(uTime * 1.3));
    offset = n * j * 0.07 * uDisplacement;
    stress = abs(j) * uDisplacement;
  } else {
    float band = floor((p.y + 1.0) * 5.0);
    float shift = sin(band * 1.9 + uTime * 1.1);
    float torn = step(0.0, shift);
    offset = vec3(shift * 0.42 * uDisplacement * torn, 0.0, sin(p.y * 16.0 + uTime * 2.0) * 0.08 * uDisplacement);
    stress = abs(shift) * uDisplacement * torn;
  }

  vec3 world = (p + offset) * 1.35;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(world, 1.0);

  vec3 cool = mix(vec3(1.0, 0.69, 0.72), vec3(0.78, 0.26, 0.32), p.y * 0.5 + 0.5);
  vec3 warn = vec3(1.0, 0.9, 0.55);
  float w = clamp(uWarn * (0.3 + stress * 1.6), 0.0, 1.0);
  vColor = mix(cool, warn, w);
  vAlpha = 0.34 + 0.5 * clamp(stress * 1.5, 0.0, 1.0) + 0.1 * uWarn;
}
