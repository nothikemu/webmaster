//! ChaCha20 stream cipher (RFC 8439). Used to decrypt the build-time shader and UI-string blob.
//! This is obfuscation of shipped assets, not secrecy: the key ships to the client.

#[inline(always)]
fn quarter(s: &mut [u32; 16], a: usize, b: usize, c: usize, d: usize) {
    s[a] = s[a].wrapping_add(s[b]);
    s[d] = (s[d] ^ s[a]).rotate_left(16);
    s[c] = s[c].wrapping_add(s[d]);
    s[b] = (s[b] ^ s[c]).rotate_left(12);
    s[a] = s[a].wrapping_add(s[b]);
    s[d] = (s[d] ^ s[a]).rotate_left(8);
    s[c] = s[c].wrapping_add(s[d]);
    s[b] = (s[b] ^ s[c]).rotate_left(7);
}

fn block(key: &[u32; 8], counter: u32, nonce: &[u32; 3]) -> [u8; 64] {
    let mut init = [0u32; 16];
    init[0] = 0x6170_7865;
    init[1] = 0x3320_646e;
    init[2] = 0x7962_2d32;
    init[3] = 0x6b20_6574;
    init[4..12].copy_from_slice(key);
    init[12] = counter;
    init[13..16].copy_from_slice(nonce);
    let mut s = init;
    for _ in 0..10 {
        quarter(&mut s, 0, 4, 8, 12);
        quarter(&mut s, 1, 5, 9, 13);
        quarter(&mut s, 2, 6, 10, 14);
        quarter(&mut s, 3, 7, 11, 15);
        quarter(&mut s, 0, 5, 10, 15);
        quarter(&mut s, 1, 6, 11, 12);
        quarter(&mut s, 2, 7, 8, 13);
        quarter(&mut s, 3, 4, 9, 14);
    }
    let mut out = [0u8; 64];
    for i in 0..16 {
        out[i * 4..i * 4 + 4].copy_from_slice(&s[i].wrapping_add(init[i]).to_le_bytes());
    }
    out
}

fn words_le<const N: usize>(bytes: &[u8]) -> [u32; N] {
    let mut out = [0u32; N];
    for i in 0..N {
        out[i] = u32::from_le_bytes([
            bytes[i * 4],
            bytes[i * 4 + 1],
            bytes[i * 4 + 2],
            bytes[i * 4 + 3],
        ]);
    }
    out
}

/// XORs `data` with the ChaCha20 keystream. `key` must be 32 bytes and `nonce` 12 bytes;
/// otherwise an empty vector is returned. Encryption and decryption are the same operation.
pub fn chacha20_xor(key: &[u8], nonce: &[u8], counter: u32, data: &[u8]) -> Vec<u8> {
    if key.len() != 32 || nonce.len() != 12 {
        return Vec::new();
    }
    let k: [u32; 8] = words_le(key);
    let n: [u32; 3] = words_le(nonce);
    let mut out = Vec::with_capacity(data.len());
    let mut ctr = counter;
    for chunk in data.chunks(64) {
        let ks = block(&k, ctr, &n);
        for (i, b) in chunk.iter().enumerate() {
            out.push(b ^ ks[i]);
        }
        ctr = ctr.wrapping_add(1);
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn hex(bytes: &[u8]) -> String {
        bytes.iter().map(|b| format!("{:02x}", b)).collect()
    }

    fn rfc_key() -> Vec<u8> {
        (0u8..32).collect()
    }

    #[test]
    fn rfc8439_section_2_4_2() {
        let nonce = [0, 0, 0, 0, 0, 0, 0, 0x4a, 0, 0, 0, 0];
        let plain = b"Ladies and Gentlemen of the class of '99: If I could offer you only one tip for the future, sunscreen would be it.";
        let ct = chacha20_xor(&rfc_key(), &nonce, 1, plain);
        assert_eq!(
            hex(&ct[..16]),
            "6e2e359a2568f98041ba0728dd0d6981"
        );
        // Tail cross-checked against OpenSSL's chacha20 (key 00..1f, counter 1, 114 bytes).
        assert_eq!(hex(&ct[ct.len() - 4..]), "5e42874d");
        assert_eq!(chacha20_xor(&rfc_key(), &nonce, 1, &ct), plain.to_vec());
    }

    #[test]
    fn rejects_bad_lengths() {
        assert!(chacha20_xor(&[0u8; 31], &[0u8; 12], 0, b"x").is_empty());
        assert!(chacha20_xor(&[0u8; 32], &[0u8; 11], 0, b"x").is_empty());
    }

    #[test]
    fn spans_multiple_blocks() {
        let data = vec![7u8; 200];
        let nonce = [9u8; 12];
        let enc = chacha20_xor(&rfc_key(), &nonce, 0, &data);
        assert_eq!(enc.len(), 200);
        assert_ne!(enc, data);
        assert_eq!(chacha20_xor(&rfc_key(), &nonce, 0, &enc), data);
    }
}
