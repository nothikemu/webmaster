// WebGPU compute twin of crates/core/src/sim.rs. One thread per particle, in-place update.
struct Params {
  dt: f32,
  time: f32,
  px: f32,
  py: f32,
  pz: f32,
  radius: f32,
  strength: f32,
  mode: u32,
  count: u32,
  pad0: u32,
  pad1: u32,
  pad2: u32,
}

const SPRING_K: f32 = 16.0;
const DAMPING_C: f32 = 5.2;
const DRIFT_AMP: f32 = 0.045;
const POINTER_DRAG: f32 = 2.5;

@group(0) @binding(0) var<uniform> P: Params;
@group(0) @binding(1) var<storage, read> rest: array<vec4<f32>>;
@group(0) @binding(2) var<storage, read_write> pos: array<vec4<f32>>;
@group(0) @binding(3) var<storage, read_write> vel: array<vec4<f32>>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3<u32>) {
  let i = gid.x;
  if (i >= P.count) {
    return;
  }
  let r = rest[i];          // xyz = rest position, w = drift phase
  let phase = r.w;
  var p = pos[i].xyz;
  var v = vel[i].xyz;

  let target_pos = r.xyz + DRIFT_AMP * vec3<f32>(
    sin(P.time * 0.45 + phase),
    sin(P.time * 0.37 + phase * 1.7 + 1.3),
    sin(P.time * 0.29 + phase * 0.9 + 2.1)
  );

  var acc = vec3<f32>(0.0);
  let pointer = vec3<f32>(P.px, P.py, P.pz);
  let d = p - pointer;
  let d2 = dot(d, d);
  if (P.strength != 0.0 && d2 < P.radius * P.radius && d2 > 1e-8) {
    let dist = sqrt(d2);
    var w = 1.0 - dist / P.radius;
    w = w * w * (3.0 - 2.0 * w);
    let n = d / dist;
    let s = P.strength * w;
    if (P.mode == 0u) {
      acc = n * s;
    } else if (P.mode == 1u) {
      acc = -n * (s * 0.9);
    } else {
      let tl = sqrt(n.x * n.x + n.y * n.y);
      var tan2 = vec2<f32>(0.0);
      if (tl > 1e-6) {
        tan2 = vec2<f32>(-n.y / tl, n.x / tl);
      }
      acc = vec3<f32>(tan2 * (s * 1.1) - n.xy * (s * 0.55), -n.z * (s * 0.55));
    }
    if (P.mode != 0u) {
      acc = acc - v * (w * POINTER_DRAG);
    }
  }

  let a = SPRING_K * (target_pos - p) - DAMPING_C * v + acc;
  v = v + a * P.dt;
  p = p + v * P.dt;
  vel[i] = vec4<f32>(v, 0.0);
  pos[i] = vec4<f32>(p, 1.0);
}
