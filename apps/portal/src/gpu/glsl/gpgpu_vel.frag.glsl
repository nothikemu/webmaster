// Pass 1: velocity. Reads the previous position and velocity, writes the new velocity.
precision highp float;

uniform sampler2D uPos;
uniform sampler2D uVel;
uniform sampler2D uRest;
uniform float uDt;

varying vec2 vUv;

void main() {
  vec3 p = texture2D(uPos, vUv).xyz;
  vec3 v = texture2D(uVel, vUv).xyz;
  vec4 r = texture2D(uRest, vUv);
  vec3 a = particleAccel(p, v, r.xyz, r.w);
  gl_FragColor = vec4(v + a * uDt, 0.0);
}
