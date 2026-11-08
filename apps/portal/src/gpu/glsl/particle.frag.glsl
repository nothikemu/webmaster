varying vec3 vColor;
varying float vAlpha;

// A flat disc drawn on a point sprite, like a screentone dot: the base color, a hard shade crescent away from
// the light, and a dark ring that separates it from its neighbours. No highlight, no gradient.
void main() {
  vec2 p = vec2(gl_PointCoord.x - 0.5, 0.5 - gl_PointCoord.y) * 2.0;
  float d = length(p);
  float fw = fwidth(d);
  float a = 1.0 - smoothstep(1.0 - fw * 1.5, 1.0, d);
  if (a < 0.01 || vAlpha < 0.02) discard;
  vec3 n = vec3(p, sqrt(max(0.0, 1.0 - d * d)));
  float ndl = dot(n, normalize(vec3(-0.5, 0.6, 0.7)));
  vec3 shade = vColor * vec3(0.52, 0.57, 0.68);
  vec3 col = ndl > 0.1 ? vColor : shade;
  col = d > 0.8 ? vec3(0.04, 0.07, 0.1) : col;
  gl_FragColor = vec4(col, a);
}
