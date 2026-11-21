// Checking a payment receipt: anonymous reads, no keys, no open engine — Menese Team.
//
//   import { verifyReceipt } from "./privacy/receipt";
//   const ok = await verifyReceipt(receipt);            // the live ledger (mainnet)
//   const ok = await verifyReceipt(receipt, network);   // another network
//
// `receipt` is what engine.receipt(reference) returned (the object, or its JSON text). The check
// reads the payment's note from the ledger's public log and the recipient's private address from
// the directory, both anonymously, and recomputes the note's commitment from the receipt: it is
// true only if the amount, the recipient, the order id and the log position are all exactly what
// was paid. In Node, import verifyReceipt from "./privacy/node.js" instead (it loads the wasm
// from disk).
import initProver, * as prover from "./zk/prover-pkg/pool_prover_wasm.js";
import * as R from "./zk/receipt.js";
import { anonymousActorsAt } from "./zk/ic.js";
import { mainnet } from "./mainnet";
import type { ZkNetwork } from "./engine/core";
import type { Receipt } from "./types";

export interface ReceiptCheck {
  valid: boolean;
  /// the first check that failed, in plain words; null when valid
  reason: string | null;
  /// what the receipt proves, when valid
  payment: {
    reference: string;
    recipient: string;
    amountE8s: bigint;
    orderId: string | Uint8Array | null;
    kind: "direct" | "claimable";
    /// the ledger's time of the payment (direct) or of the claim (claimable), ms since epoch
    receivedAt: number | null;
  } | null;
}

export interface ReceiptCheckOptions {
  /// The prover's wasm bytes (only its pure functions are used); default: fetched next to its glue code.
  proverWasm?: BufferSource | WebAssembly.Module;
}

/// Check a receipt and say why when it fails. Throws only when the network cannot be reached.
export async function checkReceipt(receipt: Receipt | string, network: ZkNetwork = mainnet(""), options: ReceiptCheckOptions = {}): Promise<ReceiptCheck> {
  let parsed: unknown = receipt;
  if (typeof receipt === "string") {
    try {
      parsed = JSON.parse(receipt);
    } catch {
      return { valid: false, reason: "not a receipt (not JSON)", payment: null };
    }
  }
  await initProver(options.proverWasm ? { module_or_path: options.proverWasm } : undefined);
  const actors = await anonymousActorsAt(network);
  return R.checkReceipt(parsed, { actors, wasm: prover, ledgerId: network.zkLedger });
}

/// true when the receipt is exactly one real payment on this network's ledger.
export async function verifyReceipt(receipt: Receipt | string, network: ZkNetwork = mainnet(""), options: ReceiptCheckOptions = {}): Promise<boolean> {
  return (await checkReceipt(receipt, network, options)).valid;
}
