//! tsa-core: compute kernels for the Interactive AI Learning Portal, exposed through wasm-bindgen.
//! Every export has a TypeScript twin under apps/portal/src/core/*Fallback.ts that produces the
//! same output, so the site works when WebAssembly is unavailable.

mod cipher;
mod hash;
mod noise;
mod sim;
mod spatial_hash;

use wasm_bindgen::prelude::*;

/// Crate version, used by the portal's capability report.
#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// True when this binary was compiled with the SIMD128 integrator.
#[wasm_bindgen]
pub fn simd_enabled() -> bool {
    cfg!(all(feature = "simd", target_arch = "wasm32", target_feature = "simd128"))
}

#[wasm_bindgen]
pub fn sha256(data: &[u8]) -> Vec<u8> {
    hash::sha256(data).to_vec()
}

#[wasm_bindgen]
pub fn hmac_sha256(key: &[u8], message: &[u8]) -> Vec<u8> {
    hash::hmac_sha256(key, message).to_vec()
}

/// ChaCha20 keystream XOR. Returns an empty array when key (32 bytes) or nonce (12 bytes)
/// has the wrong length.
#[wasm_bindgen]
pub fn chacha20_xor(key: &[u8], nonce: &[u8], counter: u32, data: &[u8]) -> Vec<u8> {
    cipher::chacha20_xor(key, nonce, counter, data)
}

/// Flat `[a0, b0, a1, b1, ...]` edge list. `positions` is xyz triples.
#[wasm_bindgen]
pub fn build_neighbor_graph(positions: &[f32], k: u32, radius: f32) -> Vec<u32> {
    spatial_hash::build_neighbor_graph(positions, k as usize, radius)
}

/// Fills `out` (w * h floats in [0, 1]) with fractal noise. `out` is copied in and back out.
#[wasm_bindgen]
pub fn fbm_field(out: &mut [f32], w: u32, h: u32, t: f32, scale: f32, octaves: u32, seed: u32) {
    noise::fbm_field(out, w as usize, h as usize, t, scale, octaves, seed);
}

#[wasm_bindgen]
pub struct ParticleSim {
    core: sim::SimCore,
}

#[wasm_bindgen]
impl ParticleSim {
    /// `rest` is xyz triples; `phase` is one drift phase per particle.
    #[wasm_bindgen(constructor)]
    pub fn new(rest: &[f32], phase: &[f32]) -> ParticleSim {
        ParticleSim { core: sim::SimCore::new(rest, phase) }
    }

    pub fn count(&self) -> u32 {
        self.core.len() as u32
    }

    #[allow(clippy::too_many_arguments)]
    pub fn step(
        &mut self,
        dt: f32,
        time: f32,
        px: f32,
        py: f32,
        pz: f32,
        radius: f32,
        strength: f32,
        mode: u32,
    ) {
        self.core.step(sim::StepParams {
            dt,
            time,
            pointer: [px, py, pz],
            radius,
            strength,
            mode,
        });
    }

    pub fn reset(&mut self) {
        self.core.reset();
    }

    /// Pointer to the stride-3 output positions inside WebAssembly memory.
    pub fn out_ptr(&self) -> *const f32 {
        self.core.out_ptr()
    }

    /// Length of the output in floats (count * 3).
    pub fn out_len(&self) -> u32 {
        self.core.out().len() as u32
    }
}
