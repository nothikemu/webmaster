varying vec3 vN;

// The globe under the Ethics mesh: three flat navy bands (lit, shade, deep) and a paper-white rim where the
// surface turns away from the camera, like the outline of a panel.
void main() {
  vec3 n = normalize(vN);
  float ndl = dot(n, normalize(vec3(-0.5, 0.6, 0.7)));
  vec3 col = ndl > 0.2 ? vec3(0.2, 0.09, 0.12) : (ndl > -0.3 ? vec3(0.13, 0.05, 0.08) : vec3(0.07, 0.03, 0.05));
  col = (1.0 - abs(n.z)) > 0.93 ? vec3(1.0, 0.69, 0.72) : col;
  gl_FragColor = vec4(col, 1.0);
}
