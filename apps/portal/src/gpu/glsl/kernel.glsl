// Particle kernel shared by the two GPGPU passes. Must stay numerically in step with
//   crates/core/src/sim.rs, src/gpu/sim/tsSim.ts and src/gpu/wgsl/particles.compute.wgsl.
const float SPRING_K = 16.0;
const float DAMPING_C = 5.2;
const float DRIFT_AMP = 0.045;
const float POINTER_DRAG = 2.5;

uniform float uTime;
uniform float uRadius;
uniform float uStrength;
uniform vec3 uPointer;
uniform int uMode;

vec3 particleAccel(vec3 p, vec3 v, vec3 rest, float phase) {
  vec3 target = rest + DRIFT_AMP * vec3(
    sin(uTime * 0.45 + phase),
    sin(uTime * 0.37 + phase * 1.7 + 1.3),
    sin(uTime * 0.29 + phase * 0.9 + 2.1)
  );
  vec3 acc = vec3(0.0);
  vec3 d = p - uPointer;
  float d2 = dot(d, d);
  if (uStrength != 0.0 && d2 < uRadius * uRadius && d2 > 1e-8) {
    float dist = sqrt(d2);
    float w = 1.0 - dist / uRadius;
    w = w * w * (3.0 - 2.0 * w);
    vec3 n = d / dist;
    float s = uStrength * w;
    if (uMode == 0) {
      acc = n * s;
    } else if (uMode == 1) {
      acc = -n * (s * 0.9);
    } else {
      float tl = sqrt(n.x * n.x + n.y * n.y);
      vec2 tan2 = tl > 1e-6 ? vec2(-n.y / tl, n.x / tl) : vec2(0.0);
      acc = vec3(tan2 * (s * 1.1) - n.xy * (s * 0.55), -n.z * (s * 0.55));
    }
    if (uMode != 0) acc -= v * (w * POINTER_DRAG);
  }
  return SPRING_K * (target - p) - DAMPING_C * v + acc;
}
