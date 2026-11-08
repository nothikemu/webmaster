//! CPU particle integrator for Module A. The same kernel exists in four other places and
//! must stay numerically in step with them:
//!   apps/portal/src/gpu/sim/tsSim.ts          (TypeScript reference)
//!   apps/portal/src/gpu/wgsl/particles.compute.wgsl
//!   apps/portal/src/gpu/glsl/gpgpu_vel.frag.glsl + gpgpu_pos.frag.glsl
//! Layout: positions, velocities and rest positions use stride 4 (xyz + zero pad) so the
//! SIMD path can load one particle per v128. `out` is the stride-3 copy handed to JavaScript.

pub const SPRING_K: f32 = 16.0;
pub const DAMPING_C: f32 = 5.2;
pub const DRIFT_AMP: f32 = 0.045;
pub const POINTER_DRAG: f32 = 2.5;

#[derive(Clone, Copy, Debug)]
pub struct StepParams {
    pub dt: f32,
    pub time: f32,
    pub pointer: [f32; 3],
    pub radius: f32,
    pub strength: f32,
    /// 0 = deflect, 1 = attract, 2 = orbit
    pub mode: u32,
}

pub struct SimCore {
    n: usize,
    pos: Vec<f32>,
    vel: Vec<f32>,
    rest: Vec<f32>,
    phase: Vec<f32>,
    target: Vec<f32>,
    acc: Vec<f32>,
    out: Vec<f32>,
}

impl SimCore {
    /// `rest3` is xyz triples; `phase` holds one drift phase per particle.
    pub fn new(rest3: &[f32], phase: &[f32]) -> Self {
        let n = rest3.len() / 3;
        let mut rest = vec![0.0f32; n * 4];
        for i in 0..n {
            rest[i * 4] = rest3[i * 3];
            rest[i * 4 + 1] = rest3[i * 3 + 1];
            rest[i * 4 + 2] = rest3[i * 3 + 2];
        }
        let mut ph = vec![0.0f32; n];
        for (i, slot) in ph.iter_mut().enumerate() {
            *slot = phase.get(i).copied().unwrap_or(0.0);
        }
        let mut core = SimCore {
            n,
            pos: rest.clone(),
            vel: vec![0.0; n * 4],
            rest,
            phase: ph,
            target: vec![0.0; n * 4],
            acc: vec![0.0; n * 4],
            out: vec![0.0; n * 3],
        };
        core.write_out();
        core
    }

    pub fn len(&self) -> usize {
        self.n
    }

    pub fn reset(&mut self) {
        self.pos.copy_from_slice(&self.rest);
        self.vel.iter_mut().for_each(|v| *v = 0.0);
        self.write_out();
    }

    pub fn out(&self) -> &[f32] {
        &self.out
    }

    pub fn out_ptr(&self) -> *const f32 {
        self.out.as_ptr()
    }

    pub fn step(&mut self, p: StepParams) {
        self.forces(p);
        self.integrate(p.dt);
        self.write_out();
    }

    fn forces(&mut self, p: StepParams) {
        let t = p.time;
        let r2 = p.radius * p.radius;
        for i in 0..self.n {
            let b = i * 4;
            let ph = self.phase[i];
            self.target[b] = self.rest[b] + DRIFT_AMP * (t * 0.45 + ph).sin();
            self.target[b + 1] = self.rest[b + 1] + DRIFT_AMP * (t * 0.37 + ph * 1.7 + 1.3).sin();
            self.target[b + 2] = self.rest[b + 2] + DRIFT_AMP * (t * 0.29 + ph * 0.9 + 2.1).sin();
            self.target[b + 3] = 0.0;

            let mut ax = 0.0f32;
            let mut ay = 0.0f32;
            let mut az = 0.0f32;
            let dx = self.pos[b] - p.pointer[0];
            let dy = self.pos[b + 1] - p.pointer[1];
            let dz = self.pos[b + 2] - p.pointer[2];
            let d2 = dx * dx + dy * dy + dz * dz;
            if p.strength != 0.0 && d2 < r2 && d2 > 1e-8 {
                let dist = d2.sqrt();
                let mut w = 1.0 - dist / p.radius;
                w = w * w * (3.0 - 2.0 * w);
                let nx = dx / dist;
                let ny = dy / dist;
                let nz = dz / dist;
                let s = p.strength * w;
                match p.mode {
                    0 => {
                        ax = nx * s;
                        ay = ny * s;
                        az = nz * s;
                    }
                    1 => {
                        let s9 = s * 0.9;
                        ax = -nx * s9;
                        ay = -ny * s9;
                        az = -nz * s9;
                    }
                    _ => {
                        let tl = (nx * nx + ny * ny).sqrt();
                        let (tx, ty) = if tl > 1e-6 { (-ny / tl, nx / tl) } else { (0.0, 0.0) };
                        ax = tx * (s * 1.1) - nx * (s * 0.55);
                        ay = ty * (s * 1.1) - ny * (s * 0.55);
                        az = -nz * (s * 0.55);
                    }
                }
                if p.mode != 0 {
                    let dk = w * POINTER_DRAG;
                    ax -= self.vel[b] * dk;
                    ay -= self.vel[b + 1] * dk;
                    az -= self.vel[b + 2] * dk;
                }
            }
            self.acc[b] = ax;
            self.acc[b + 1] = ay;
            self.acc[b + 2] = az;
            self.acc[b + 3] = 0.0;
        }
    }

    #[cfg(not(all(feature = "simd", target_arch = "wasm32", target_feature = "simd128")))]
    fn integrate(&mut self, dt: f32) {
        for i in 0..self.n * 4 {
            let a = SPRING_K * (self.target[i] - self.pos[i]) - DAMPING_C * self.vel[i] + self.acc[i];
            self.vel[i] += a * dt;
            self.pos[i] += self.vel[i] * dt;
        }
    }

    #[cfg(all(feature = "simd", target_arch = "wasm32", target_feature = "simd128"))]
    #[allow(unused_unsafe)]
    fn integrate(&mut self, dt: f32) {
        use core::arch::wasm32::*;
        unsafe {
            let k = f32x4_splat(SPRING_K);
            let c = f32x4_splat(DAMPING_C);
            let h = f32x4_splat(dt);
            for i in 0..self.n {
                let o = i * 4;
                let p = v128_load(self.pos.as_ptr().add(o) as *const v128);
                let v = v128_load(self.vel.as_ptr().add(o) as *const v128);
                let t = v128_load(self.target.as_ptr().add(o) as *const v128);
                let a = v128_load(self.acc.as_ptr().add(o) as *const v128);
                let spring = f32x4_mul(k, f32x4_sub(t, p));
                let damp = f32x4_mul(c, v);
                let acc = f32x4_add(f32x4_sub(spring, damp), a);
                let v2 = f32x4_add(v, f32x4_mul(acc, h));
                let p2 = f32x4_add(p, f32x4_mul(v2, h));
                v128_store(self.vel.as_mut_ptr().add(o) as *mut v128, v2);
                v128_store(self.pos.as_mut_ptr().add(o) as *mut v128, p2);
            }
        }
    }

    fn write_out(&mut self) {
        for i in 0..self.n {
            self.out[i * 3] = self.pos[i * 4];
            self.out[i * 3 + 1] = self.pos[i * 4 + 1];
            self.out[i * 3 + 2] = self.pos[i * 4 + 2];
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn grid(n: usize) -> (Vec<f32>, Vec<f32>) {
        let mut rest = Vec::new();
        let mut phase = Vec::new();
        for i in 0..n {
            rest.extend_from_slice(&[(i as f32) * 0.05 - 1.0, ((i * 7) % 11) as f32 * 0.1, 0.0]);
            phase.push(i as f32 * 0.37);
        }
        (rest, phase)
    }

    fn params(t: f32, strength: f32, mode: u32) -> StepParams {
        StepParams { dt: 1.0 / 60.0, time: t, pointer: [0.0, 0.0, 0.0], radius: 1.0, strength, mode }
    }

    #[test]
    fn rests_near_topology_without_pointer() {
        let (rest, phase) = grid(64);
        let mut sim = SimCore::new(&rest, &phase);
        for s in 0..600 {
            sim.step(params(s as f32 / 60.0, 0.0, 0));
        }
        for i in 0..64 {
            for c in 0..3 {
                assert!((sim.out()[i * 3 + c] - rest[i * 3 + c]).abs() < 0.12);
            }
        }
    }

    #[test]
    fn deflect_pushes_outward_and_springs_back() {
        let (rest, phase) = grid(64);
        let mut sim = SimCore::new(&rest, &phase);
        let before: f32 = (0..64).map(|i| sim.out()[i * 3].hypot(sim.out()[i * 3 + 1])).sum();
        for s in 0..90 {
            sim.step(params(s as f32 / 60.0, 40.0, 0));
        }
        let pushed: f32 = (0..64).map(|i| sim.out()[i * 3].hypot(sim.out()[i * 3 + 1])).sum();
        assert!(pushed > before, "deflect should increase mean radius");
        for s in 90..700 {
            sim.step(params(s as f32 / 60.0, 0.0, 0));
        }
        for i in 0..64 {
            assert!((sim.out()[i * 3] - rest[i * 3]).abs() < 0.12, "particle {i} did not return");
        }
    }

    #[test]
    fn attract_pulls_inward() {
        let (rest, phase) = grid(64);
        let mut sim = SimCore::new(&rest, &phase);
        let before: f32 = (0..64).map(|i| sim.out()[i * 3].hypot(sim.out()[i * 3 + 1])).sum();
        for s in 0..60 {
            sim.step(params(s as f32 / 60.0, 30.0, 1));
        }
        let after: f32 = (0..64).map(|i| sim.out()[i * 3].hypot(sim.out()[i * 3 + 1])).sum();
        assert!(after < before);
    }

    #[test]
    fn orbit_adds_tangential_motion_and_stays_finite() {
        let rest = vec![0.4, 0.0, 0.0];
        let mut sim = SimCore::new(&rest, &[0.0]);
        for s in 0..120 {
            sim.step(params(s as f32 / 60.0, 30.0, 2));
        }
        assert!(sim.out().iter().all(|v| v.is_finite()));
        assert!(sim.out()[1].abs() > 0.01, "orbit should move the particle off the x axis");
    }

    #[test]
    fn reset_restores_rest() {
        let (rest, phase) = grid(8);
        let mut sim = SimCore::new(&rest, &phase);
        sim.step(params(0.0, 40.0, 0));
        sim.reset();
        assert_eq!(sim.out(), rest.as_slice());
    }
}
