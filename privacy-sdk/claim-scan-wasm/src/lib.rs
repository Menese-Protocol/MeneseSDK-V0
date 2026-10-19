//! Claim-envelope scanner — Menese DeFi Team.
//!
//! A recipient finds their claimable payments by trying their
//! vetKey on every envelope in the claim log. An envelope is a vetKeys IBE ciphertext
//! (ic-vetkeys 0.7.0 `IbeCiphertext`, @dfinity/vetkeys 0.4.0) of the fixed 80-byte claim payload:
//!
//!   header "IC IBE\0\x01" (8) ‖ C1 = t·G2 compressed (96) ‖ C2 = seed ⊕ mask(e(vetKey, C1)) (32)
//!   ‖ C3 = payload ⊕ SHAKE256(HKDF(seed)) (80)
//!
//! Full decryption (`open`) is exactly ic-vetkeys' `IbeCiphertext::decrypt`: C1 decompressed WITH
//! the subgroup check, the pairing, both unmaskings, then the Fujisaki–Okamoto check
//! C1 == hash_to_mask(header, seed, msg)·G2, a full G2 scalar multiplication.
//!
//! Almost every envelope a recipient tries is not theirs, so `scan` does less work per envelope,
//! in arkworks (which pairs about 1.6x faster than ic_bls12_381 in wasm32; its compressed points
//! are the same bytes, and `gt_bytes` writes its pairing value in ic_bls12_381's encoding):
//! C1 is decompressed without the subgroup check, the pairing and unmaskings run, and the payload
//! must have the claim payload's fixed structure (version 1, five zero reserved bytes,
//! 1 <= parts, part < parts): a wrong key yields uniformly random bytes, which pass with
//! probability below 2^-48. Only an envelope that passes is decrypted again with `open`, so every
//! envelope `scan` reports has passed the complete check. Skipping work on rejections cannot accept
//! anything the full check would refuse.

use ark_ec::pairing::Pairing;
use ark_ff::{BigInteger, PrimeField};
use ark_serialize::{CanonicalDeserialize, CanonicalSerialize, Compress, Validate};
use hkdf::Hkdf;
use ic_bls12_381::hash_to_curve::{ExpandMsgXmd, HashToField};
use ic_bls12_381::{pairing, G1Affine, G2Affine, G2Projective, Scalar};
use sha2::Sha256;
use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;
use wasm_bindgen::prelude::*;

pub const PAYLOAD_LEN: usize = 80;
pub const ENVELOPE_LEN: usize = HEADER.len() + G2_BYTES + SEED_BYTES + PAYLOAD_LEN; // 216
const HEADER: [u8; 8] = *b"IC IBE\x00\x01";
const G2_BYTES: usize = 96;
const SEED_BYTES: usize = 32;
const C1_AT: usize = HEADER.len();
const C2_AT: usize = C1_AT + G2_BYTES;
const C3_AT: usize = C2_AT + SEED_BYTES;
const PAYLOAD_VERSION: u8 = 1;

fn hkdf32(input: &[u8], domain_sep: &str) -> [u8; 32] {
    let mut okm = [0u8; 32];
    Hkdf::<Sha256>::new(None, input)
        .expand(domain_sep.as_bytes(), &mut okm)
        .expect("32 bytes is a valid HKDF-SHA256 output length");
    okm
}

/// seed = C2 ⊕ HKDF(e(vetKey, C1), "ic-vetkd-bls12-381-ibe-mask-seed"); `tsig` is the pairing
/// value in ic_bls12_381's `Gt::to_bytes` encoding.
fn unmask_seed(c2: &[u8], tsig: &[u8]) -> [u8; SEED_BYTES] {
    let mask = hkdf32(tsig, "ic-vetkd-bls12-381-ibe-mask-seed");
    let mut seed = [0u8; SEED_BYTES];
    for i in 0..SEED_BYTES {
        seed[i] = mask[i] ^ c2[i];
    }
    seed
}

/// msg = C3 ⊕ SHAKE256(HKDF(seed, "ic-vetkd-bls12-381-ibe-mask-msg-<len, 20 digits>"))
fn unmask_msg(c3: &[u8], seed: &[u8; SEED_BYTES]) -> Vec<u8> {
    let shake_seed = hkdf32(seed, &format!("ic-vetkd-bls12-381-ibe-mask-msg-{:020}", c3.len()));
    let mut shake = Shake256::default();
    shake.update(&shake_seed);
    let mut mask = vec![0u8; c3.len()];
    shake.finalize_xof().read(&mut mask);
    for i in 0..c3.len() {
        mask[i] ^= c3[i];
    }
    mask
}

/// t = hash_to_field(header ‖ seed ‖ msg) with XMD:SHA-256, "ic-vetkd-bls12-381-ibe-hash-to-mask"
fn hash_to_mask(seed: &[u8; SEED_BYTES], msg: &[u8]) -> Scalar {
    let mut input = Vec::with_capacity(HEADER.len() + SEED_BYTES + msg.len());
    input.extend_from_slice(&HEADER);
    input.extend_from_slice(seed);
    input.extend_from_slice(msg);
    let mut t = [Scalar::zero()];
    <Scalar as HashToField>::hash_to_field::<ExpandMsgXmd<Sha256>>(
        &input,
        b"ic-vetkd-bls12-381-ibe-hash-to-mask",
        &mut t,
    );
    t[0]
}

/// The claim payload's fixed structure (src/claims.js encodePayload): version, part < parts,
/// five zero reserved bytes.
pub fn plausible_payload(msg: &[u8]) -> bool {
    msg.len() == PAYLOAD_LEN
        && msg[0] == PAYLOAD_VERSION
        && msg[2] >= 1
        && msg[1] < msg[2]
        && msg[3..8].iter().all(|&b| b == 0)
}

fn c1_bytes(envelope: &[u8]) -> &[u8; G2_BYTES] {
    envelope[C1_AT..C2_AT].try_into().expect("slice is G2_BYTES long")
}

/// Full decryption, step for step ic-vetkeys 0.7.0 `IbeCiphertext::decrypt` (with its
/// `deserialize`): the plaintext, or None.
pub fn open(vetkey: &G1Affine, envelope: &[u8]) -> Option<Vec<u8>> {
    if envelope.len() < C3_AT || envelope[..C1_AT] != HEADER {
        return None;
    }
    let c1 = Option::<G2Affine>::from(G2Affine::from_compressed(c1_bytes(envelope)))?;
    let seed = unmask_seed(&envelope[C2_AT..C3_AT], &pairing(vetkey, &c1).to_bytes());
    let msg = unmask_msg(&envelope[C3_AT..], &seed);
    let t = hash_to_mask(&seed, &msg);
    if G2Affine::from(G2Projective::generator() * t) == c1 {
        Some(msg)
    } else {
        None
    }
}

/// An arkworks pairing value in ic_bls12_381's `Gt::to_bytes` encoding: Fp12 (c1, c0), each Fp6
/// (c2, c1, c0), each Fp2 (c1, c0), each Fp 48 bytes big-endian. Both libraries build the same
/// tower (Fp2 = Fp[u]/(u²+1), Fp6 = Fp2[v]/(v³-(u+1)), Fp12 = Fp6[w]/(w²-v)).
pub fn gt_bytes(f: &ark_bls12_381::Fq12) -> [u8; 576] {
    let mut out = [0u8; 576];
    let mut at = 0;
    for f6 in [&f.c1, &f.c0] {
        for f2 in [&f6.c2, &f6.c1, &f6.c0] {
            for fp in [&f2.c1, &f2.c0] {
                out[at..at + 48].copy_from_slice(&fp.into_bigint().to_bytes_be());
                at += 48;
            }
        }
    }
    out
}

/// The vetKey for the fast path (arkworks), converted once from the checked ic_bls12_381 point.
pub fn fast_key(vetkey: &G1Affine) -> ark_bls12_381::G1Affine {
    ark_bls12_381::G1Affine::deserialize_compressed(&vetkey.to_compressed()[..])
        .expect("a valid G1 point has the same compressed encoding in arkworks")
}

/// The per-envelope fast path: true when the envelope is worth the full check. Never a substitute
/// for `open`.
pub fn candidate(fast: &ark_bls12_381::G1Affine, envelope: &[u8]) -> bool {
    if envelope.len() != ENVELOPE_LEN || envelope[..C1_AT] != HEADER {
        return false;
    }
    // on the curve (the y coordinate is recovered from x), no subgroup check
    let c1 = match ark_bls12_381::G2Affine::deserialize_with_mode(&envelope[C1_AT..C2_AT], Compress::Yes, Validate::No) {
        Ok(p) => p,
        Err(_) => return false,
    };
    let tsig = ark_bls12_381::Bls12_381::pairing(*fast, c1).0;
    let seed = unmask_seed(&envelope[C2_AT..C3_AT], &gt_bytes(&tsig));
    plausible_payload(&unmask_msg(&envelope[C3_AT..], &seed))
}

/// Indices of the envelopes (fixed length, back to back) that open with `vetkey`, each fully
/// verified.
pub fn scan(vetkey: &G1Affine, fast: &ark_bls12_381::G1Affine, envelopes: &[u8]) -> Vec<u32> {
    envelopes
        .chunks_exact(ENVELOPE_LEN)
        .enumerate()
        .filter(|(_, e)| candidate(fast, e) && open(vetkey, e).is_some())
        .map(|(i, _)| i as u32)
        .collect()
}

/// A recipient's scanner: the vetKey, checked once.
#[wasm_bindgen]
pub struct Scanner {
    vetkey: G1Affine,
    fast: ark_bls12_381::G1Affine,
}

#[wasm_bindgen]
impl Scanner {
    /// `vetkey`: the 48-byte compressed G1 point (@dfinity/vetkeys `VetKey.serialize()`).
    #[wasm_bindgen(constructor)]
    pub fn new(vetkey: &[u8]) -> Result<Scanner, JsError> {
        let bytes: &[u8; 48] = vetkey.try_into().map_err(|_| JsError::new("vetKey must be 48 bytes"))?;
        let vetkey = Option::<G1Affine>::from(G1Affine::from_compressed(bytes))
            .ok_or_else(|| JsError::new("vetKey is not a valid G1 point"))?;
        Ok(Scanner { vetkey, fast: fast_key(&vetkey) })
    }

    /// Indices of the envelopes that open, each fully verified. `envelopes` is a whole number of
    /// 216-byte envelopes back to back.
    pub fn scan(&self, envelopes: &[u8]) -> Result<Vec<u32>, JsError> {
        if envelopes.len() % ENVELOPE_LEN != 0 {
            return Err(JsError::new("envelopes must be a whole number of 216-byte envelopes"));
        }
        Ok(scan(&self.vetkey, &self.fast, envelopes))
    }

    /// Full decryption of one envelope: the payload, or undefined.
    pub fn open(&self, envelope: &[u8]) -> Option<Vec<u8>> {
        open(&self.vetkey, envelope)
    }
}
