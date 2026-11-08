// Pass 2: position. Reads the previous position and the velocity written by pass 1.
precision highp float;

uniform sampler2D uPos;
uniform sampler2D uVel;
uniform float uDt;

varying vec2 vUv;

void main() {
  vec3 p = texture2D(uPos, vUv).xyz;
  vec3 v = texture2D(uVel, vUv).xyz;
  gl_FragColor = vec4(p + v * uDt, 1.0);
}
