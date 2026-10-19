// Claim envelopes, shared by every private transfer — Menese DeFi Team.
//
// A claimable payment carries a real envelope: its claim payload IBE-encrypted to the recipient's
// principal. Every other private transfer carries a decoy of the same length and structure. The
// wallet attaches one to EVERY private transfer (wallet.js privateTransferEx), so a claimable
// payment never depends on a caller remembering to add the decoy.
import { IbeCiphertext, IbeIdentity, IbeSeed, DerivedPublicKey, MasterPublicKey, MasterPublicKeyId } from "@dfinity/vetkeys";
import { Actor } from "@dfinity/agent";
import { bytesToHex, hexToBytes } from "./ic.js";
import { VETKD_MASTER_KEY } from "./config.js";

export const CLAIM_PAYLOAD_LEN = 80; // version 1, part 1, parts 1, reserved 5, v 8 LE, rcm 32, otk_nk 32
export const CLAIM_ENVELOPE_LEN = 216; // IBE ciphertext of the 80-byte payload (@dfinity/vetkeys 0.4.0)
const enc = new TextEncoder();

export function concat(...parts) {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

async function sha256(bytes) {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
}

/// IBE-encrypt a payload to `recipient` (a Principal) under the directory's derived public key.
export function sealClaim(dpk, recipient, payload) {
  const ct = IbeCiphertext.encrypt(dpk, IbeIdentity.fromBytes(recipient.toUint8Array()), payload, IbeSeed.random()).serialize();
  if (ct.length !== CLAIM_ENVELOPE_LEN) throw new Error(`envelope is ${ct.length} B, expected ${CLAIM_ENVELOPE_LEN}`);
  return ct;
}

/// A decoy: random bytes IBE-encrypted to a random identity. The same length and structure as a
/// real envelope, so it cannot be told apart without the (non-existent) recipient's key.
export function decoyEnvelope(dpk) {
  const identity = crypto.getRandomValues(new Uint8Array(29));
  const ct = IbeCiphertext.encrypt(dpk, IbeIdentity.fromBytes(identity), crypto.getRandomValues(new Uint8Array(CLAIM_PAYLOAD_LEN)), IbeSeed.random()).serialize();
  if (ct.length !== CLAIM_ENVELOPE_LEN) throw new Error(`decoy is ${ct.length} B, expected ${CLAIM_ENVELOPE_LEN}`);
  return ct;
}

/// The recipient_binding the proof must carry for `envelope` (the ledger's claimBinding):
/// SHA-256("picp-claim-envelope/v1" ‖ pool principal ‖ envelope), top byte cleared.
export async function claimBinding(poolPrincipal, envelope) {
  const h = await sha256(concat(enc.encode("picp-claim-envelope/v1"), poolPrincipal.toUint8Array(), envelope));
  h[31] = 0;
  return bytesToHex(h);
}

/// A decoy envelope + its binding.
export async function decoyFor(dpk, poolPrincipal) {
  const envelope = decoyEnvelope(dpk);
  return { envelope, bindingHex: await claimBinding(poolPrincipal, envelope) };
}

/// The vetKD context of every shielded-account key (the directory's key_context).
export const SHIELDED_KEY_CONTEXT = enc.encode("picp-shielded-account/v1");

function masterKey() {
  if (VETKD_MASTER_KEY === "key_1") return MasterPublicKey.productionKey(MasterPublicKeyId.KEY_1);
  if (VETKD_MASTER_KEY === "test_key_1") return MasterPublicKey.productionKey(MasterPublicKeyId.TEST_KEY_1);
  return MasterPublicKey.deserialize(hexToBytes(VETKD_MASTER_KEY));
}

/// The directory's public key for shielded accounts, DERIVED HERE from the IC's vetKD master key
/// and the directory's canister id, then compared with what the directory reports. Envelopes are
/// sealed and vetKeys verified against this key, so a directory that reported a different one
/// could redirect claims or plant keys: the app refuses it instead.
export async function directoryKey(directory) {
  const expected = masterKey().deriveCanisterKey(Actor.canisterIdOf(directory).toUint8Array()).deriveSubKey(SHIELDED_KEY_CONTEXT);
  const reported = new Uint8Array(await directory.vetkey_public_key());
  if (bytesToHex(reported) !== bytesToHex(expected.publicKeyBytes())) {
    throw new Error("directory-key-mismatch: the directory reports a key the IC master key does not derive");
  }
  return expected;
}

// The directory's derived public key never changes for a deployment: compute it once per actor set.
const contexts = new WeakMap();

/// { dpk, pool } for building envelopes with these actors.
export function envelopeContext(actors) {
  let ctx = contexts.get(actors);
  if (!ctx) {
    ctx = (async () => ({
      dpk: await directoryKey(actors.directory),
      pool: Actor.canisterIdOf(actors.ledger),
    }))();
    ctx.catch(() => contexts.delete(actors));
    contexts.set(actors, ctx);
  }
  return ctx;
}
