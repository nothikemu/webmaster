varying float vA;
varying vec3 vC;

void main() {
  if (vA < 0.004) discard;
  gl_FragColor = vec4(vC, min(1.0, vA));
}
