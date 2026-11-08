// Neighbour links. Each segment end carries its own position and the other end's position, so
// opacity can fall off with the *current* length (stretched links fade out).
uniform float uMaxLen;
uniform float uOpacity;
uniform vec3 uPointer;
uniform float uRadius;
uniform float uPresence;
#ifdef USE_POS_TEX
uniform sampler2D uPosTex;
attribute vec2 aRef;
attribute vec2 aRefOther;
#else
attribute vec3 aOther;
#endif
attribute float aBase;
attribute float aT;

varying float vA;
varying vec3 vC;

void main() {
#ifdef USE_POS_TEX
  vec3 p = texture2D(uPosTex, aRef).xyz;
  vec3 q = texture2D(uPosTex, aRefOther).xyz;
#else
  vec3 p = position;
  vec3 q = aOther;
#endif
  float len = distance(p, q);
  float fall = 1.0 - smoothstep(uMaxLen * 0.4, uMaxLen, len);
  float infl = uPresence * (1.0 - smoothstep(0.0, uRadius, length(p - uPointer)));
  vA = aBase * fall * uOpacity * 0.7 * (1.0 + infl * 1.2);
  vec3 left = vec3(0.16, 0.5, 0.48);
  vec3 right = vec3(0.55, 0.8, 0.77);
  vec3 hot = vec3(1.00, 0.27, 0.33);
  vC = mix(mix(left, right, aT), hot, clamp(infl, 0.0, 1.0));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
