// What an action will take, worked out before anything is sent, so the fee shown is the fee paid.
//
// The shielded ledger's transfer always spends exactly two notes and creates two, and both inputs
// must be real notes in the tree. So a private balance held in one note cannot move, and a payment
// larger than the two biggest notes needs them combined first. This planner simulates the note set
// and returns the steps:
//   topUp  — make 1 e8s private to give the balance a second note (ICP network fee only)
//   merge  — combine the two largest notes into one (costs the send fee; the second output is 0)
//   main   — the action itself
// A claimable payment is two transfers (a claim always spends exactly two one-time notes): part 1
// carries the amount plus the recipient's claim fee, part 2 carries zero and spends part 1's change.

export type Kind = "send" | "claimable" | "moveOut";

export interface PlanInput {
  kind: Kind;
  amountE8s: bigint;
  notes: bigint[]; // values of the unspent notes
  publicE8s: bigint; // ICP balance, for top-ups
  sendFeeE8s: bigint; // protocol fee per private transfer
  ledgerFeeE8s: bigint; // token ledger fee
  moveOutFee: (amount: bigint) => bigint; // ledger.required_transfer_fee(amount)
}

export type Step =
  | { kind: "topUp"; valueE8s: bigint }
  | { kind: "merge" }
  | { kind: "main" }
  | { kind: "part2" };

export interface Plan {
  possible: boolean;
  reason: string | null;
  steps: Step[];
  /// Fees paid out of the private balance (protocol fees, the move-out fee).
  privateFeesE8s: bigint;
  /// ICP network fees paid from the ICP balance (top-ups).
  publicFeesE8s: bigint;
  /// What the recipient gets (send: amount; claimable: amount after they claim; moveOut: amount).
  deliveredE8s: bigint;
}

export const TOP_UP_E8S = 1n;

const desc = (a: bigint, b: bigint) => (a > b ? -1 : a < b ? 1 : 0);

function fail(reason: string): Plan {
  return { possible: false, reason, steps: [], privateFeesE8s: 0n, publicFeesE8s: 0n, deliveredE8s: 0n };
}

/// Make sure the two largest notes of `notes` (sorted, mutated) cover `need`, adding top-ups and
/// merges to `steps`. Returns null on success or the reason it cannot be done.
function ensurePair(
  notes: bigint[],
  need: bigint,
  minCount: number,
  ctx: { publicLeft: bigint; steps: Step[]; privateFees: bigint; publicFees: bigint },
  i: PlanInput,
): string | null {
  const topUpCost = TOP_UP_E8S + 2n * i.ledgerFeeE8s; // approve + transfer_from
  while (notes.length < minCount) {
    if (notes.length === 0 && minCount > 0) return "Your private balance is empty.";
    if (ctx.publicLeft < topUpCost) {
      return "Keep at least 0.0003 ICP in your ICP balance. The app needs it to prepare your private balance for this.";
    }
    ctx.publicLeft -= topUpCost;
    ctx.publicFees += 2n * i.ledgerFeeE8s;
    ctx.steps.push({ kind: "topUp", valueE8s: TOP_UP_E8S });
    notes.push(TOP_UP_E8S);
    notes.sort(desc);
  }
  for (let guard = 0; notes[0] + notes[1] < need; guard++) {
    // combining two notes costs the send fee and only helps when a third note is left to pair with
    if (notes.length < 3 || guard > 64) return "Not enough in your private balance for this, including fees.";
    const merged = notes[0] + notes[1] - i.sendFeeE8s;
    if (merged <= 0n) return "Not enough in your private balance for this, including fees.";
    notes.splice(0, 2, merged, 0n);
    notes.sort(desc);
    ctx.privateFees += i.sendFeeE8s;
    ctx.steps.push({ kind: "merge" });
  }
  return null;
}

export function planAction(i: PlanInput): Plan {
  if (i.amountE8s <= 0n) return fail("Enter an amount.");
  if (i.notes.length === 0) return fail("Your private balance is empty.");
  const notes = [...i.notes].sort(desc);
  const total = notes.reduce((t, v) => t + v, 0n);
  const ctx = { publicLeft: i.publicE8s, steps: [] as Step[], privateFees: 0n, publicFees: 0n };

  if (i.kind === "send") {
    const need = i.amountE8s + i.sendFeeE8s;
    if (total < need) return fail("Not enough in your private balance for this, including the fee.");
    const err = ensurePair(notes, need, 2, ctx, i);
    if (err) return fail(err);
    ctx.steps.push({ kind: "main" });
    ctx.privateFees += i.sendFeeE8s;
    return { possible: true, reason: null, steps: ctx.steps, privateFeesE8s: ctx.privateFees, publicFeesE8s: ctx.publicFees, deliveredE8s: i.amountE8s };
  }

  if (i.kind === "moveOut") {
    const fee = i.moveOutFee(i.amountE8s);
    const need = i.amountE8s + fee;
    if (total < need) return fail("Not enough in your private balance for this, including the fee.");
    const err = ensurePair(notes, need, 2, ctx, i);
    if (err) return fail(err);
    ctx.steps.push({ kind: "main" });
    ctx.privateFees += fee;
    return { possible: true, reason: null, steps: ctx.steps, privateFeesE8s: ctx.privateFees, publicFeesE8s: ctx.publicFees, deliveredE8s: i.amountE8s };
  }

  // claimable: part 1 pays amount + the recipient's claim fee and must leave change >= one send fee,
  // so part 2 (value 0) can spend that change with any other note.
  const f = i.sendFeeE8s;
  const need1 = i.amountE8s + f + f + f;
  if (total < need1) return fail("Not enough in your private balance for this, including the fees.");
  const err = ensurePair(notes, need1, 3, ctx, i);
  if (err) return fail(err);
  ctx.steps.push({ kind: "main" }, { kind: "part2" });
  ctx.privateFees += f + f + f; // two transfers + the claim fee the recipient would otherwise pay
  return { possible: true, reason: null, steps: ctx.steps, privateFeesE8s: ctx.privateFees, publicFeesE8s: ctx.publicFees, deliveredE8s: i.amountE8s };
}
