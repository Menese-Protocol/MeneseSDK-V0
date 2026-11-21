// Payment receipts: one payment shown to a third party, and nothing else — Menese DeFi Team.
//
// A receipt is the opening of the note a payment created: its amount, the principal it was paid to,
// the order id, and the randomness that binds them to the note's commitment on the public log. A
// shop's support desk, an accountant or a dispute handler checks it with checkReceipt: anonymous
// reads of the public log and the directory, no keys. It shows that one payment and nothing more:
// no balance, no other payment, no key, and not who paid (the payer stays private). Only a party to
// the payment can make one (the payer or the person paid), and making one is always their choice.
// The idea is Zcash's payment disclosure (ZIP-311) and Monero's tx proof, on this ledger's notes.
//
// What a check proves, for a payment straight into a private balance ("direct"): the note at the
// reference's log position is output 1 of a private transfer, and its commitment opens to
// (amount, the recipient's shielded address from the directory, rho = the transfer's first
// nullifier, rcm), where rcm = paymentRcm(seed, order id). The commitment binds the amount and the
// address; rcm binds the order id. Changing any field, or pointing the reference elsewhere, breaks
// the commitment.
//
// For a claimable payment (the recipient had no private balance yet), the money first sits in
// notes owned by a one-time key and lands in the recipient's balance when they claim it. A receipt
// exists once it is claimed: it names the one-time key (spent, so worth nothing any more), opens
// each part's note at the claim log positions of the reference (rcm binding the order id), and
// opens the note the claim created for the recipient, whose transfer spent exactly those parts.
// Before the claim there is no receipt: proving where an unclaimed payment is would mean handing
// out the key that can still move it.
import { hexToBytes, bytesToHex } from "./ic.js";
import { BLOCKS_PER_PAGE } from "./config.js";
import { readNotes, paymentRcm, openEnvelope, boundOrderId, orderIdFrom } from "./wallet.js";
import { parsePaymentReference, formatNoteReference, claimNoteBox, sweepRcm } from "./claims.js";

export const RECEIPT_TYPE = "menese-payment-receipt";
export const RECEIPT_VERSION = 1;
const CLAIM_PAGE = 100;
const HEX32 = /^[0-9a-f]{64}$/;

const asOrder = (receipt) => {
  if (receipt.orderId != null && receipt.orderIdHex != null) return { error: "the receipt gives the order id twice" };
  if (receipt.orderId != null) {
    if (typeof receipt.orderId !== "string") return { error: "orderId is not text" };
    const bytes = new TextEncoder().encode(receipt.orderId);
    if (bytes.length === 0 || bytes.length > 32) return { error: "orderId length" };
    return { order: { bytes, t: 0 } };
  }
  if (receipt.orderIdHex != null) {
    if (typeof receipt.orderIdHex !== "string" || !/^([0-9a-f]{2}){1,32}$/.test(receipt.orderIdHex)) return { error: "orderIdHex is not hex of 1 to 32 bytes" };
    return { order: { bytes: hexToBytes(receipt.orderIdHex), t: 1 } };
  }
  return { order: null };
};

/// The order id fields of a receipt for sealed payment fields `pay` (or none).
export function orderFields(pay) {
  const id = orderIdFrom(pay);
  if (id === null) return { orderId: null, orderIdHex: null };
  return typeof id === "string" ? { orderId: id, orderIdHex: null } : { orderId: null, orderIdHex: bytesToHex(id) };
}

const isAmount = (text) => typeof text === "string" && /^(0|[1-9]\d{0,19})$/.test(text);

/// The rcm a receipt claims for one note: from the payment seed and the order id, or (payments made
/// by earlier client versions, which carry no order id) given as is.
function rcmOf(wasm, opening, order) {
  if (opening && typeof opening.seed === "string" && HEX32.test(opening.seed)) return paymentRcm(wasm, opening.seed, order);
  if (opening && typeof opening.rcm === "string" && HEX32.test(opening.rcm) && order === null) return opening.rcm;
  return null;
}

/// The blocks on the 512-aligned pages holding `positions` (whole pages: whoever answers learns only
/// the pages, the same camouflage as every other log read), by position.
async function blocksAt(ledger, positions) {
  const total = Number((await ledger.status()).log_length);
  const out = new Map();
  const starts = [...new Set(positions.map((p) => Math.floor(p / BLOCKS_PER_PAGE) * BLOCKS_PER_PAGE))];
  for (const start of starts) {
    if (start >= total) continue;
    for (const b of await readNotes({ ledger }, { from: start, to: Math.min(start + BLOCKS_PER_PAGE, total) })) out.set(b.position, b);
  }
  return out;
}

async function claimRecords(ledger, indices) {
  const out = new Map();
  for (const start of [...new Set(indices.map((i) => Math.floor(i / CLAIM_PAGE) * CLAIM_PAGE))]) {
    const page = await ledger.claim_envelopes(BigInt(start), BigInt(CLAIM_PAGE));
    for (const r of page.records) out.set(Number(r.index), r);
  }
  return out;
}

async function shieldedAddressOf(directory, principalText) {
  const { Principal } = await import("@dfinity/principal");
  let principal;
  try {
    principal = Principal.fromText(principalText);
  } catch {
    return null;
  }
  const entry = await directory.lookup_certified(principal);
  return entry.length ? entry[0].shielded_pk : null;
}

/// Check a receipt against the public log. `actors` = { ledger, directory }, anonymous
/// (ic.js anonymousActorsAt); `wasm` = the prover module (only its pure functions are used:
/// commitments, nullifiers, addresses). Returns { valid, reason, payment }: `reason` names the
/// first check that failed; `payment` is what the receipt proves, when valid.
export async function checkReceipt(receipt, { actors, wasm, ledgerId }) {
  const fail = (reason) => ({ valid: false, reason, payment: null });
  if (!receipt || typeof receipt !== "object") return fail("not a receipt");
  if (receipt.type !== RECEIPT_TYPE || receipt.version !== RECEIPT_VERSION) return fail("not a receipt of this version");
  if (receipt.ledger !== ledgerId) return fail("the receipt is for another ledger");
  if (!isAmount(receipt.amountE8s)) return fail("amount is not a whole number of e8s");
  const amount = BigInt(receipt.amountE8s);
  const { order, error } = asOrder(receipt);
  if (error) return fail(error);
  const ref = parsePaymentReference(receipt.reference);
  if (!ref) return fail("the reference is malformed or its check digit fails");
  const pk = typeof receipt.recipient === "string" ? await shieldedAddressOf(actors.directory, receipt.recipient) : null;
  if (!pk) return fail("the recipient has no private address in the directory");
  const proved = { reference: receipt.reference, recipient: receipt.recipient, amountE8s: amount, orderId: order ? (order.t === 1 ? order.bytes : receipt.orderId) : null };

  if (ref.kind === "direct") {
    if (receipt.kind !== "direct" || !receipt.direct) return fail("the reference is a direct payment's, the receipt is not");
    const rcm = rcmOf(wasm, receipt.direct, order);
    if (!rcm) return fail("the receipt has no valid opening");
    const block = (await blocksAt(actors.ledger, [ref.position])).get(ref.position);
    if (!block) return fail("nothing at that log position");
    if (block.origin !== "confidential_transfer" || block.nullifiers.length !== 2) return fail("the note at that position was not made by a private transfer");
    const rho = block.nullifiers[0]; // output 1's rho is its transfer's first nullifier
    if (wasm.note_commitment_hex(amount, pk, rho, rcm) !== block.commitment) return fail("the note at that position does not open to this amount, recipient and order id");
    return { valid: true, reason: null, payment: { ...proved, kind: "direct", receivedAt: block.time } };
  }

  if (receipt.kind !== "claimable" || !receipt.claimable) return fail("the reference is a claimable payment's, the receipt is not");
  const c = receipt.claimable;
  if (typeof c.otk !== "string" || !HEX32.test(c.otk) || !Array.isArray(c.parts) || c.parts.length !== ref.indices.length || c.parts.length !== 2) return fail("the receipt's claimable fields are malformed");
  if (!c.sweep || !Number.isSafeInteger(c.sweep.position) || typeof c.sweep.rcm !== "string" || !HEX32.test(c.sweep.rcm)) return fail("the receipt does not say where the payment landed");
  const records = await claimRecords(actors.ledger, ref.indices);
  const positions = ref.indices.map((i) => (records.has(i) ? Number(records.get(i).note_position) : null));
  if (positions.some((p) => p === null)) return fail("no claim envelope at the reference's index");
  const blocks = await blocksAt(actors.ledger, [...positions, c.sweep.position]);
  const otkPk = wasm.shielded_address(c.otk);
  const nfs = [];
  for (let k = 0; k < c.parts.length; k++) {
    const part = c.parts[k];
    if (!isAmount(part.v)) return fail(`part ${k}: amount is malformed`);
    const rcm = rcmOf(wasm, part, order);
    if (!rcm) return fail(`part ${k}: the receipt has no valid opening`);
    const block = blocks.get(positions[k]);
    if (!block || block.origin !== "confidential_transfer" || block.nullifiers.length !== 2) return fail(`part ${k}: no private transfer at its log position`);
    const rho = block.nullifiers[0];
    if (wasm.note_commitment_hex(BigInt(part.v), otkPk, rho, rcm) !== block.commitment) return fail(`part ${k}: the note does not open to this amount and order id`);
    nfs.push(wasm.note_nullifier_hex(c.otk, rho));
  }
  const sweep = blocks.get(c.sweep.position);
  if (!sweep || sweep.origin !== "confidential_transfer" || sweep.nullifiers.length !== 2) return fail("no private transfer where the payment is said to have landed");
  const spends = new Set(sweep.nullifiers);
  if (!nfs.every((nf) => spends.has(nf)) || spends.size !== nfs.length) return fail("the transfer there did not spend this payment");
  if (wasm.note_commitment_hex(amount, pk, sweep.nullifiers[0], c.sweep.rcm) !== sweep.commitment) return fail("the payment did not land with this recipient for this amount");
  return { valid: true, reason: null, payment: { ...proved, kind: "claimable", receivedAt: sweep.time } };
}

// ---- making receipts (engine side) ----

const receiptOf = (ledgerId, reference, recipient, amount, pay, body) => ({
  type: RECEIPT_TYPE,
  version: RECEIPT_VERSION,
  ledger: ledgerId,
  reference,
  recipient,
  amountE8s: amount.toString(),
  ...orderFields(pay),
  ...body,
});

/// The person paid: a direct payment found in its own scan (wallet.js receivedIn record).
export function receiptForReceived(ledgerId, recipient, rec) {
  const opening = rec.pay ? { seed: rec.pay.s } : { rcm: rec.rcm };
  return receiptOf(ledgerId, formatNoteReference(rec.position), recipient, rec.v, rec.pay ?? null, { kind: "direct", direct: opening });
}

/// The payer: a direct payment it made, from the record in its change note (output 2 of the same
/// transfer, opened from the public log with its own key, spent or not).
export async function receiptForPaid(ledgerId, actors, wasm, account, position) {
  const blocks = await blocksAt(actors.ledger, [position, position + 1]);
  const change = blocks.get(position + 1);
  const note = change ? openEnvelope(account.encSk, hexToBytes(change.ciphertext)) : null;
  if (!note || wasm.note_commitment_hex(note.v, account.pk, note.rho, note.rcm) !== change.commitment || !note.paid) {
    throw new Error("This account did not make that payment, or made it before receipts existed.");
  }
  const m = note.paid;
  return receiptOf(ledgerId, formatNoteReference(position), m.to, BigInt(m.v), m, { kind: "direct", direct: { seed: m.s } });
}

/// A claimed claimable payment. `parts` are its claim notes in part order ({ v, note: { rho, rcm },
/// pay }), `otk` its one-time key; `sweep` = { position, rcm } of the note the claim made.
export function receiptForClaimed(ledgerId, reference, recipient, otk, parts, sweep, amount) {
  const pay = parts.find((p) => p.pay)?.pay ?? null;
  return receiptOf(ledgerId, reference, recipient, amount, pay, {
    kind: "claimable",
    claimable: {
      otk,
      parts: parts.map((p) => ({ v: p.v.toString(), ...(p.pay ? { seed: p.pay.s } : { rcm: p.note.rcm }) })),
      sweep,
    },
  });
}

/// Where a claimable payment's parts were spent and by whom it was claimed: `spentAt` maps a
/// nullifier to the log position of the transfer's output 1 that spent it. Returns the sweep block's
/// position, or null when the payment has not been spent.
export function sweepPosition(parts, spentAt) {
  const at = parts.map((p) => spentAt.get(p.nf));
  if (at.some((p) => p === undefined)) return null;
  return at.every((p) => p === at[0]) ? at[0] : null;
}

/// The rcm of the claim note for `amount` at `position` owned by this account's key, read from the
/// log; null if it is not this account's.
export async function ownNoteRcm(actors, wasm, account, position) {
  const block = (await blocksAt(actors.ledger, [position])).get(position);
  const note = block ? openEnvelope(account.encSk, hexToBytes(block.ciphertext)) : null;
  if (!note || wasm.note_commitment_hex(note.v, account.pk, note.rho, note.rcm) !== block.commitment) return null;
  return { rcm: note.rcm, v: note.v };
}

/// The payer of a claimable payment: rebuild its parts from the payer's own change notes (each part
/// transfer's output 2 holds the claim memo) and the claim notes' sealed fields.
export async function payerClaimableParts(actors, wasm, account, indices) {
  const records = await claimRecords(actors.ledger, indices);
  const positions = indices.map((i) => (records.has(i) ? Number(records.get(i).note_position) : null));
  if (positions.some((p) => p === null)) throw new Error("No payment at that reference.");
  const blocks = await blocksAt(actors.ledger, positions.flatMap((p) => [p, p + 1]));
  const parts = [];
  let memo = null;
  for (let k = 0; k < positions.length; k++) {
    const change = blocks.get(positions[k] + 1);
    const own = change ? openEnvelope(account.encSk, hexToBytes(change.ciphertext)) : null;
    if (!own || wasm.note_commitment_hex(own.v, account.pk, own.rho, own.rcm) !== change.commitment || !own.claim || own.claim.kind !== "claimable") {
      throw new Error("This account did not send that payment.");
    }
    memo = own.claim;
    const block = blocks.get(positions[k]);
    const rho = block.nullifiers[0];
    const sealed = openEnvelope(claimNoteBox(memo.otk_nk).secretKey, hexToBytes(block.ciphertext));
    const pay = sealed && boundOrderId(wasm, sealed).bound ? sealed.pay : null;
    // each part's change note records that part (claims.js sendClaimable memo)
    if (own.claim.part !== k || own.claim.otk_nk !== memo.otk_nk) throw new Error("This account did not send that payment.");
    const v = sealed && sealed.v === BigInt(own.claim.v) ? sealed.v : BigInt(own.claim.v);
    const rcm = sealed && sealed.v === v ? sealed.rcm : own.claim.rcm;
    parts.push({ v, note: { rho, rcm }, nf: wasm.note_nullifier_hex(memo.otk_nk, rho), ...(pay ? { pay } : {}) });
  }
  return { otk: memo.otk_nk, to: memo.to, parts };
}

/// The deterministic rcm of the note a claim made with this client version (claims.js sweepRcm).
export const claimedNoteRcm = (wasm, otk) => sweepRcm(wasm, otk);
