// Claimable private payments, client half — Menese DeFi Team.
//
// A payment to an ICP principal that has never used the shielded ledger. The value is locked to a
// ONE-TIME key derived from the sender's own key; the one-time key and each note's opening travel
// to the recipient's principal in a vetKeys IBE ciphertext (the "envelope"), which the ledger binds
// to the proof and logs. The recipient's normal sign-in vetKey decrypts it. The sender can take an
// unclaimed payment back at any time; whoever spends the one-time notes first wins.
//
// The transfer statement spends exactly two notes, so a claimable payment is two transfers, each
// creating one note for the same one-time key, and is claimed (or cancelled) in one transfer.
import nacl from "tweetnacl";
import { IbeCiphertext } from "@dfinity/vetkeys";
import { Principal } from "@dfinity/principal";
import { hexToBytes, bytesToHex, anonymousLedger } from "./ic.js";
import { privateTransferEx, readNotes, ZERO_FIELD } from "./wallet.js";
import { CLAIM_PAYLOAD_LEN, concat, sealClaim, claimBinding } from "./envelope.js";

export { CLAIM_PAYLOAD_LEN, CLAIM_ENVELOPE_LEN, sealClaim, decoyEnvelope, claimBinding, decoyFor } from "./envelope.js";
const PAYLOAD_VERSION = 1;
const enc = new TextEncoder();

/// The one-time key for a claimable payment: deterministic in the sender's spend key and the first
/// input nullifier of the payment's FIRST transfer, so the sender can always recompute it.
/// SHA-512 output (64 B) is reduced into the scalar field by the prover's field_from_seed.
export function oneTimeKey(wasm, senderNkHex, firstNfHex) {
  const seed = nacl.hash(concat(enc.encode("picp-claim-otk/v1"), hexToBytes(senderNkHex), hexToBytes(firstNfHex)));
  const nk = wasm.field_from_seed(seed);
  return { nk, pk: wasm.shielded_address(nk) };
}

/// The commitment randomness of one claimable note, deterministic in the sender's key and that
/// transfer's first input nullifier.
export function claimRcm(wasm, senderNkHex, nfHex) {
  return wasm.field_from_seed(nacl.hash(concat(enc.encode("picp-claim-rcm/v1"), hexToBytes(senderNkHex), hexToBytes(nfHex))));
}

export function encodePayload({ part, parts, v, rcm, otkNk }) {
  const b = new Uint8Array(CLAIM_PAYLOAD_LEN);
  b[0] = PAYLOAD_VERSION; b[1] = part; b[2] = parts;
  new DataView(b.buffer).setBigUint64(8, BigInt(v), true);
  b.set(hexToBytes(rcm), 16);
  b.set(hexToBytes(otkNk), 48);
  return b;
}

export function decodePayload(b) {
  if (b.length !== CLAIM_PAYLOAD_LEN || b[0] !== PAYLOAD_VERSION) return null;
  if (b[2] < 1 || b[1] >= b[2]) return null;
  // the five reserved bytes are zero (the same rule as claim-scan-wasm plausible_payload)
  if (b.subarray(3, 8).some((x) => x !== 0)) return null;
  return {
    part: b[1],
    parts: b[2],
    v: new DataView(b.buffer, b.byteOffset).getBigUint64(8, true),
    rcm: bytesToHex(b.slice(16, 48)),
    otkNk: bytesToHex(b.slice(48, 80)),
  };
}

/// Open an envelope with the caller's vetKey; null if it is not addressed to them.
export function openClaim(vetKey, envelope) {
  try {
    return decodePayload(IbeCiphertext.deserialize(envelope).decrypt(vetKey));
  } catch {
    return null;
  }
}

// ---- payment references ----
// A claimable payment's reference is the claim-log index of its first envelope, the offsets of its
// other parts, and a Damm check digit (catches every single-digit error and every adjacent
// transposition): "48213-2-6". It is not a secret: it opens nothing without the recipient's vetKey,
// and it shows no amount. With it the recipient reads one page of envelopes instead of searching.

const DAMM = [
  [0, 3, 1, 7, 5, 9, 8, 6, 4, 2], [7, 0, 9, 2, 1, 5, 4, 8, 6, 3], [4, 2, 0, 6, 8, 7, 1, 3, 5, 9],
  [1, 7, 5, 0, 9, 8, 3, 4, 2, 6], [6, 1, 2, 3, 0, 4, 5, 9, 7, 8], [3, 6, 7, 4, 2, 0, 9, 5, 8, 1],
  [5, 8, 6, 9, 7, 2, 0, 1, 3, 4], [8, 9, 4, 5, 3, 6, 2, 0, 1, 7], [9, 4, 3, 8, 6, 1, 7, 2, 0, 5],
  [2, 5, 8, 1, 4, 3, 6, 7, 9, 0],
];
const damm = (digits) => [...digits].reduce((i, d) => DAMM[i][Number(d)], 0);
// Each number is length-prefixed so different splits of the same digits check differently.
const checkDigits = (numbers) => numbers.map((n) => `${String(n).length}${n}`).join("");

/// "48213-2-6" for a first envelope at index 48213 and a second part 2 envelopes later.
export function formatReference(indices) {
  const [first, ...rest] = indices;
  const numbers = [first, ...rest.map((i) => i - first)];
  if (numbers.some((n, k) => !Number.isSafeInteger(n) || n < 0 || (k > 0 && n === 0))) throw new Error("bad reference indices");
  return [...numbers, damm(checkDigits(numbers))].join("-");
}

/// The claim-log indices in a reference, or null when it is malformed or its check digit fails.
export function parseReference(text) {
  const fields = String(text).trim().replace(/^PAY\s*/i, "").split(/[-\s]+/).filter(Boolean);
  if (fields.length < 2 || !fields.every((f) => /^\d{1,15}$/.test(f))) return null;
  const numbers = fields.slice(0, -1).map(Number);
  if (numbers.slice(1).some((n) => n === 0) || damm(checkDigits(numbers)) !== Number(fields.at(-1))) return null;
  return [numbers[0], ...numbers.slice(1).map((d) => numbers[0] + d)];
}

const sameBytes = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

/// The sender's side: find its own envelopes in the claim log (read anonymously, from `fromIndex`)
/// by their bytes, and format the reference.
async function referenceFor(anon, envelopes, fromIndex) {
  const indices = new Array(envelopes.length).fill(null);
  const total = Number((await anon.claim_status()).total);
  for (let start = fromIndex; start < total && indices.includes(null); start += CLAIM_PAGE) {
    const page = await anon.claim_envelopes(BigInt(start), BigInt(CLAIM_PAGE));
    for (const r of page.records) {
      const k = envelopes.findIndex((e, j) => indices[j] === null && sameBytes(e, new Uint8Array(r.envelope)));
      if (k >= 0) indices[k] = Number(r.index);
    }
    if (page.records.length === 0) break;
  }
  return indices.includes(null) ? null : formatReference(indices);
}

const CLAIM_PAGE = 100;

/// Send `parts.length` transfers that together pay sum(parts) to `recipient` (a Principal) as a
/// claimable payment. `spends` is one pair of the sender's own notes per transfer. Each transfer's
/// first output is a one-time-key note with a real envelope; its second output is the sender's
/// change, sealed to the sender, carrying a memo (the one-time key + this part) so the sender's
/// wallet can show and cancel the pending payment from its own history. Returns the payment
/// reference to give the recipient once every part is accepted. A later part's pair may be given as
/// a function, called once the part before it is accepted: it can then spend that part's change.
export async function sendClaimable(actors, wasm, keys, account, { dpk, poolPrincipal, recipient, parts, spends, fee }) {
  if (parts.length !== spends.length || parts.length < 1 || parts.length > 255) throw new Error("one spend pair per part");
  const anon = await anonymousLedger();
  const fromIndex = Number((await anon.claim_status()).total);
  const firstNf = wasm.note_nullifier_hex(account.nk, spends[0][0].rho);
  const otk = oneTimeKey(wasm, account.nk, firstNf);
  const results = [];
  const senders = []; // the one-time identity each part was submitted from
  const envelopes = [];
  const priorValues = []; // the values of the parts already accepted, carried in later parts' memos
  for (let k = 0; k < parts.length; k++) {
    const [a, b] = typeof spends[k] === "function" ? await spends[k]() : spends[k];
    const nf1 = wasm.note_nullifier_hex(account.nk, a.rho);
    const rcm = claimRcm(wasm, account.nk, nf1);
    const v = BigInt(parts[k]);
    const change = a.v + b.v - v - BigInt(fee);
    if (change < 0n) throw new Error(`part ${k}: inputs ${a.v + b.v} do not cover ${v} + fee ${fee}`);
    const envelope = sealClaim(dpk, recipient, encodePayload({ part: k, parts: parts.length, v, rcm, otkNk: otk.nk }));
    envelopes.push(envelope);
    const memo = { kind: "claimable", to: recipient.toText(), otk_nk: otk.nk, part: k, parts: parts.length, v: v.toString(), rcm };
    // A later part may spend an earlier part's change note, and that change note carried the earlier
    // part's memo. So each later memo also names the earlier parts' values; with the sender's key
    // that is enough to find their claim notes again (pendingFromMemos). ~20 B, inside the note size.
    if (priorValues.length) memo.w = priorValues.slice();
    const { res, sender } = await privateTransferEx(actors, wasm, keys, {
      inputs: [{ note: a, nk: account.nk }, { note: b, nk: account.nk }],
      outputs: [
        { v, pk: otk.pk, rcm, sealTo: null },
        { v: change, pk: account.pk, rcm: wasm.random_field(), sealTo: account.encPk, memo },
      ],
      fee: BigInt(fee),
      envelope,
      bindingHex: await claimBinding(poolPrincipal, envelope),
    });
    results.push(res);
    senders.push(sender);
    if (res.outcome !== "ACCEPT") break;
    priorValues.push(v.toString());
  }
  const complete = results.length === parts.length && results.every((r) => r.outcome === "ACCEPT");
  return { otk, results, senders, reference: complete ? await referenceFor(anon, envelopes, fromIndex) : null };
}

/// The note log by position, read in ONE bulk read, anonymously. Reading a single position would
/// tell whoever answers the query which note the wallet cares about; reading the whole log tells
/// them nothing (and the claim that follows reads it in full anyway, for its Merkle path).
async function notesByPosition(anon) {
  return new Map((await readNotes({ ledger: anon })).map((b) => [b.position, b]));
}

/// Rebuild opened envelopes into spendable notes, each checked against the public log.
async function rebuild(anon, wasm, opened, spent) {
  const found = [];
  if (opened.length === 0) return found;
  const blocks = await notesByPosition(anon);
  for (const { p, r } of opened) {
    const position = Number(r.note_position);
    const block = blocks.get(position);
    if (!block) continue;
    const rho = block.nullifiers[0]; // output_1's rho is the transfer's first nullifier
    const pk = wasm.shielded_address(p.otkNk);
    const cm = wasm.note_commitment_hex(p.v, pk, rho, p.rcm);
    if (cm !== block.commitment) continue; // an envelope that does not open the note it claims to: ignore
    const nf = wasm.note_nullifier_hex(p.otkNk, rho);
    found.push({ ...p, position, time: r.time, note: { v: p.v, rho, rcm: p.rcm, cm }, nk: p.otkNk, spent: spent.has(nf) });
  }
  return found;
}

/// Search envelopes [from, total), NEWEST FIRST (a payment the recipient was just told about is
/// found first), for those addressed to this vetKey. All reads are anonymous. `onProgress(done,
/// todo)` reports the search; `spent` is the locally-built nullifier set. `scanner` (claimScan.js
/// createScanPool, or anything with `scan(envelopes) -> Promise<indices>`) does the search at
/// native speed across the device's cores; without one it runs here in JavaScript. Either way
/// every match is decrypted in full by @dfinity/vetkeys before it is used.
export async function scanClaims(actors, wasm, vetKey, { from = 0, pageSize = 500, spent = new Set(), onProgress = null, scanner = null } = {}) {
  const anon = await anonymousLedger();
  const total = Number((await anon.claim_status()).total);
  const opened = [];
  let done = 0;
  for (let end = total; end > from; end -= pageSize) {
    const start = Math.max(from, end - pageSize);
    const page = await anon.claim_envelopes(BigInt(start), BigInt(end - start));
    const records = [...page.records].reverse();
    const tryAt = scanner
      ? await scanner.scan(records.map((r) => new Uint8Array(r.envelope)))
      : records.map((_, i) => i);
    for (const i of tryAt) {
      const r = records[i];
      const p = openClaim(vetKey, new Uint8Array(r.envelope));
      if (p) opened.push({ p, r });
    }
    done += page.records.length;
    if (onProgress) onProgress(done, total - from);
  }
  return { claims: await rebuild(anon, wasm, opened, spent), cursor: total };
}

/// Find a payment by its reference: read the page(s) of 100 envelopes holding the referenced
/// indices (whoever answers learns only the pages) and open just those envelopes. Returns the
/// claims, or { error } when the reference is malformed or nothing there opens with this vetKey.
export async function claimsByReference(actors, wasm, vetKey, reference, { spent = new Set() } = {}) {
  const indices = parseReference(reference);
  if (!indices) return { error: "reference-invalid" };
  const anon = await anonymousLedger();
  const pages = [...new Set(indices.map((i) => Math.floor(i / CLAIM_PAGE) * CLAIM_PAGE))];
  const records = new Map();
  for (const start of pages) {
    const page = await anon.claim_envelopes(BigInt(start), BigInt(CLAIM_PAGE));
    for (const r of page.records) records.set(Number(r.index), r);
  }
  const opened = [];
  for (const i of indices) {
    const r = records.get(i);
    const p = r ? openClaim(vetKey, new Uint8Array(r.envelope)) : null;
    if (p) opened.push({ p, r });
  }
  if (opened.length === 0) return { error: "reference-not-found" };
  return { claims: await rebuild(anon, wasm, opened, spent) };
}

/// Group found claims by one-time key into payments; a payment is claimable once all its parts are
/// present and unspent.
export function groupPayments(claims) {
  const byKey = new Map();
  for (const c of claims) {
    const g = byKey.get(c.otkNk) ?? { otkNk: c.otkNk, parts: c.parts, notes: [] };
    g.notes.push(c);
    byKey.set(c.otkNk, g);
  }
  return [...byKey.values()].map((g) => ({
    ...g,
    total: g.notes.reduce((s, c) => s + c.v, 0n),
    complete: g.notes.length === g.parts && g.notes.every((c) => !c.spent),
  }));
}

/// Spend two one-time notes into `to` (the claimer's own account, or the sender's when
/// cancelling). The full value minus the fee lands in one note; the second output is zero.
/// With no envelope given, privateTransferEx attaches a decoy, as on every private transfer.
export async function sweepOneTime(actors, wasm, keys, to, notes, { fee, envelope = null, bindingHex = ZERO_FIELD }) {
  if (notes.length !== 2) throw new Error("a sweep spends exactly two one-time notes");
  const total = notes[0].note.v + notes[1].note.v;
  if (total < BigInt(fee)) throw new Error("payment smaller than the fee");
  return privateTransferEx(actors, wasm, keys, {
    inputs: notes.map((c) => ({ note: c.note, nk: c.nk })),
    outputs: [
      { v: total - BigInt(fee), pk: to.pk, rcm: wasm.random_field(), sealTo: to.encPk },
      { v: 0n, pk: to.pk, rcm: wasm.random_field(), sealTo: to.encPk },
    ],
    fee: BigInt(fee),
    envelope,
    bindingHex,
  });
}

/// The sender's side: rebuild pending claimable payments from the memos in the sender's own change
/// notes (`owned` = scanNotes output, which carries each note's position and decoded memo). The
/// claim note is output_1 of the same transfer, one position before the change note, and its rho
/// is that transfer's first nullifier.
/// `senderNk` (the sender's own nk) lets a later part's memo restore the earlier parts whose change
/// notes, and memos, have been spent since: an earlier part's claim note has rho = its transfer's
/// first nullifier and rcm = claimRcm(senderNk, that nullifier), so it is the block whose commitment
/// matches those values for the amount named in the memo.
export async function pendingFromMemos(actors, wasm, owned, spent = new Set(), senderNk = null) {
  const notes = [];
  const memos = owned.filter((change) => change.claim && change.claim.kind === "claimable");
  if (memos.length === 0) return [];
  const blocks = await notesByPosition(await anonymousLedger());
  const seen = new Set();
  const add = (n) => {
    const key = `${n.otkNk}:${n.part}`;
    if (seen.has(key)) return;
    seen.add(key);
    notes.push(n);
  };
  for (const change of memos) {
    const m = change.claim;
    if (senderNk && Array.isArray(m.w)) {
      const pk = wasm.shielded_address(m.otk_nk);
      m.w.forEach((value, part) => {
        if (seen.has(`${m.otk_nk}:${part}`)) return;
        const v = BigInt(value);
        for (let position = change.position - 2; position >= 0; position--) {
          const b = blocks.get(position);
          if (!b || !b.nullifiers.length) continue;
          const rho = b.nullifiers[0];
          const rcm = claimRcm(wasm, senderNk, rho);
          if (wasm.note_commitment_hex(v, pk, rho, rcm) !== b.commitment) continue;
          const nf = wasm.note_nullifier_hex(m.otk_nk, rho);
          add({ otkNk: m.otk_nk, part, parts: m.parts, v, rcm, to: m.to, position, note: { v, rho, rcm, cm: b.commitment }, nk: m.otk_nk, spent: spent.has(nf) });
          break;
        }
      });
    }
    const block = blocks.get(change.position - 1);
    if (!block) continue;
    const rho = block.nullifiers[0];
    const pk = wasm.shielded_address(m.otk_nk);
    const cm = wasm.note_commitment_hex(BigInt(m.v), pk, rho, m.rcm);
    if (cm !== block.commitment) continue;
    const nf = wasm.note_nullifier_hex(m.otk_nk, rho);
    add({
      otkNk: m.otk_nk, part: m.part, parts: m.parts, v: BigInt(m.v), rcm: m.rcm, to: m.to,
      position: change.position - 1, note: { v: BigInt(m.v), rho, rcm: m.rcm, cm }, nk: m.otk_nk, spent: spent.has(nf),
    });
  }
  return groupPayments(notes).map((g) => ({ ...g, to: g.notes[0].to }));
}

export const recipientPrincipal = (text) => Principal.fromText(text);
