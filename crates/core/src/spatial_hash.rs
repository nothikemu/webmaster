//! Uniform-grid spatial hash for k-nearest-neighbour edge building.
//! Candidate order is (squared distance, index) so the result is deterministic and the
//! TypeScript fallback (`neighborFallback.ts`) matches it edge for edge.

use std::collections::HashMap;

type Cell = (i32, i32, i32);

#[inline(always)]
fn cell_of(x: f32, y: f32, z: f32, size: f32) -> Cell {
    (
        (x / size).floor() as i32,
        (y / size).floor() as i32,
        (z / size).floor() as i32,
    )
}

/// Builds undirected edges between each point and its `k` nearest neighbours within `radius`.
/// `positions` holds xyz triples. Returns a flat list `[a0, b0, a1, b1, ...]` with `a < b`,
/// sorted ascending and without duplicates.
pub fn build_neighbor_graph(positions: &[f32], k: usize, radius: f32) -> Vec<u32> {
    let n = positions.len() / 3;
    if n < 2 || k == 0 || radius <= 0.0 {
        return Vec::new();
    }
    let mut grid: HashMap<Cell, Vec<u32>> = HashMap::with_capacity(n);
    for i in 0..n {
        let c = cell_of(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2], radius);
        grid.entry(c).or_default().push(i as u32);
    }
    let r2 = radius * radius;
    let mut edges: Vec<u64> = Vec::with_capacity(n * k);
    let mut cand: Vec<(f32, u32)> = Vec::with_capacity(64);
    for i in 0..n {
        let px = positions[i * 3];
        let py = positions[i * 3 + 1];
        let pz = positions[i * 3 + 2];
        let (cx, cy, cz) = cell_of(px, py, pz, radius);
        cand.clear();
        for dx in -1..=1 {
            for dy in -1..=1 {
                for dz in -1..=1 {
                    if let Some(list) = grid.get(&(cx + dx, cy + dy, cz + dz)) {
                        for &j in list {
                            if j as usize == i {
                                continue;
                            }
                            let ddx = px - positions[j as usize * 3];
                            let ddy = py - positions[j as usize * 3 + 1];
                            let ddz = pz - positions[j as usize * 3 + 2];
                            let d2 = ddx * ddx + ddy * ddy + ddz * ddz;
                            if d2 <= r2 {
                                cand.push((d2, j));
                            }
                        }
                    }
                }
            }
        }
        cand.sort_by(|a, b| a.0.total_cmp(&b.0).then(a.1.cmp(&b.1)));
        for &(_, j) in cand.iter().take(k) {
            let (a, b) = if (i as u32) < j { (i as u32, j) } else { (j, i as u32) };
            edges.push(((a as u64) << 32) | b as u64);
        }
    }
    edges.sort_unstable();
    edges.dedup();
    let mut out = Vec::with_capacity(edges.len() * 2);
    for e in edges {
        out.push((e >> 32) as u32);
        out.push((e & 0xffff_ffff) as u32);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn lcg(seed: &mut u32) -> f32 {
        *seed = seed.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
        (*seed >> 8) as f32 / (1u32 << 24) as f32
    }

    fn brute(positions: &[f32], k: usize, radius: f32) -> Vec<u32> {
        let n = positions.len() / 3;
        let r2 = radius * radius;
        let mut edges: Vec<(u32, u32)> = Vec::new();
        for i in 0..n {
            let mut cand: Vec<(f32, u32)> = Vec::new();
            for j in 0..n {
                if i == j {
                    continue;
                }
                let dx = positions[i * 3] - positions[j * 3];
                let dy = positions[i * 3 + 1] - positions[j * 3 + 1];
                let dz = positions[i * 3 + 2] - positions[j * 3 + 2];
                let d2 = dx * dx + dy * dy + dz * dz;
                if d2 <= r2 {
                    cand.push((d2, j as u32));
                }
            }
            cand.sort_by(|a, b| a.0.total_cmp(&b.0).then(a.1.cmp(&b.1)));
            for &(_, j) in cand.iter().take(k) {
                let i = i as u32;
                edges.push(if i < j { (i, j) } else { (j, i) });
            }
        }
        edges.sort_unstable();
        edges.dedup();
        edges.into_iter().flat_map(|(a, b)| [a, b]).collect()
    }

    #[test]
    fn matches_brute_force() {
        let mut seed = 42u32;
        let pts: Vec<f32> = (0..600).map(|_| lcg(&mut seed) * 4.0 - 2.0).collect();
        assert_eq!(build_neighbor_graph(&pts, 3, 0.7), brute(&pts, 3, 0.7));
    }

    #[test]
    fn handles_degenerate_input() {
        assert!(build_neighbor_graph(&[], 3, 1.0).is_empty());
        assert!(build_neighbor_graph(&[0.0, 0.0, 0.0], 3, 1.0).is_empty());
        assert!(build_neighbor_graph(&[0.0; 6], 0, 1.0).is_empty());
    }

    #[test]
    fn edges_are_ordered_and_unique() {
        let mut seed = 5u32;
        let pts: Vec<f32> = (0..300).map(|_| lcg(&mut seed) * 2.0).collect();
        let g = build_neighbor_graph(&pts, 4, 0.5);
        let pairs: Vec<(u32, u32)> = g.chunks(2).map(|c| (c[0], c[1])).collect();
        assert!(pairs.iter().all(|(a, b)| a < b));
        assert!(pairs.windows(2).all(|w| w[0] < w[1]));
    }
}
