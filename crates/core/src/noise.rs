//! Improved Perlin noise (Perlin 2002) and a fractal field generator.
//! The permutation table comes from a fixed LCG shuffle so the TypeScript fallback in
//! `apps/portal/src/core/noiseFallback.ts` reproduces the same field.

pub struct Perm {
    p: [u8; 512],
}

impl Perm {
    pub fn new(seed: u32) -> Self {
        let mut base = [0u8; 256];
        for (i, slot) in base.iter_mut().enumerate() {
            *slot = i as u8;
        }
        let mut state = seed;
        for i in (1..256usize).rev() {
            state = state.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
            let j = ((state >> 8) as usize) % (i + 1);
            base.swap(i, j);
        }
        let mut full = [0u8; 512];
        full[..256].copy_from_slice(&base);
        full[256..].copy_from_slice(&base);
        Perm { p: full }
    }
}

#[inline(always)]
fn fade(t: f32) -> f32 {
    t * t * t * (t * (t * 6.0 - 15.0) + 10.0)
}

#[inline(always)]
fn lerp(t: f32, a: f32, b: f32) -> f32 {
    a + t * (b - a)
}

#[inline(always)]
fn grad(hash: u8, x: f32, y: f32, z: f32) -> f32 {
    let h = hash & 15;
    let u = if h < 8 { x } else { y };
    let v = if h < 4 {
        y
    } else if h == 12 || h == 14 {
        x
    } else {
        z
    };
    (if h & 1 == 0 { u } else { -u }) + (if h & 2 == 0 { v } else { -v })
}

/// 3D gradient noise, roughly in [-1, 1].
pub fn perlin3(perm: &Perm, x: f32, y: f32, z: f32) -> f32 {
    let p = &perm.p;
    let fx = x.floor();
    let fy = y.floor();
    let fz = z.floor();
    let xi = (fx as i32 & 255) as usize;
    let yi = (fy as i32 & 255) as usize;
    let zi = (fz as i32 & 255) as usize;
    let x = x - fx;
    let y = y - fy;
    let z = z - fz;
    let u = fade(x);
    let v = fade(y);
    let w = fade(z);
    let a = p[xi] as usize + yi;
    let aa = p[a] as usize + zi;
    let ab = p[a + 1] as usize + zi;
    let b = p[xi + 1] as usize + yi;
    let ba = p[b] as usize + zi;
    let bb = p[b + 1] as usize + zi;
    lerp(
        w,
        lerp(
            v,
            lerp(u, grad(p[aa], x, y, z), grad(p[ba], x - 1.0, y, z)),
            lerp(u, grad(p[ab], x, y - 1.0, z), grad(p[bb], x - 1.0, y - 1.0, z)),
        ),
        lerp(
            v,
            lerp(
                u,
                grad(p[aa + 1], x, y, z - 1.0),
                grad(p[ba + 1], x - 1.0, y, z - 1.0),
            ),
            lerp(
                u,
                grad(p[ab + 1], x, y - 1.0, z - 1.0),
                grad(p[bb + 1], x - 1.0, y - 1.0, z - 1.0),
            ),
        ),
    )
}

/// Fills `out` (row-major, `w * h` values in [0, 1]) with fractal noise sampled at time `t`.
pub fn fbm_field(out: &mut [f32], w: usize, h: usize, t: f32, scale: f32, octaves: u32, seed: u32) {
    if w == 0 || h == 0 || out.len() < w * h {
        return;
    }
    let perm = Perm::new(seed);
    let oct = octaves.clamp(1, 8);
    let mut total = 0.0f32;
    let mut amp = 0.5f32;
    for _ in 0..oct {
        total += amp;
        amp *= 0.5;
    }
    for y in 0..h {
        for x in 0..w {
            let nx = x as f32 / w as f32 * scale;
            let ny = y as f32 / h as f32 * scale;
            let mut sum = 0.0f32;
            let mut a = 0.5f32;
            let mut f = 1.0f32;
            for o in 0..oct {
                sum += a * perlin3(&perm, nx * f, ny * f, t + o as f32 * 17.0);
                a *= 0.5;
                f *= 2.0;
            }
            out[y * w + x] = (0.5 + 0.5 * sum / total).clamp(0.0, 1.0);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn perlin_is_zero_on_lattice_points() {
        let perm = Perm::new(7);
        for i in 0..4 {
            assert!(perlin3(&perm, i as f32, 2.0, 3.0).abs() < 1e-6);
        }
    }

    #[test]
    fn field_is_deterministic_and_bounded() {
        let mut a = vec![0.0f32; 48 * 28];
        let mut b = vec![0.0f32; 48 * 28];
        fbm_field(&mut a, 48, 28, 1.25, 4.0, 4, 11);
        fbm_field(&mut b, 48, 28, 1.25, 4.0, 4, 11);
        assert_eq!(a, b);
        assert!(a.iter().all(|v| (0.0..=1.0).contains(v)));
        let spread = a.iter().cloned().fold(0.0f32, f32::max) - a.iter().cloned().fold(1.0f32, f32::min);
        assert!(spread > 0.2, "field should vary, spread = {spread}");
    }

    #[test]
    fn different_seeds_differ() {
        let mut a = vec![0.0f32; 16 * 16];
        let mut b = vec![0.0f32; 16 * 16];
        fbm_field(&mut a, 16, 16, 0.0, 3.0, 3, 1);
        fbm_field(&mut b, 16, 16, 0.0, 3.0, 3, 2);
        assert_ne!(a, b);
    }
}
