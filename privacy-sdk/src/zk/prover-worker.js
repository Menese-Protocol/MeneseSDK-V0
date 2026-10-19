// The prover, off the main thread — Menese DeFi Team.
//
// A Groth16 proof takes seconds of solid CPU; on a phone, run on the main thread it freezes the
// screen and the browser may kill the page. This worker owns its own copy of the prover wasm and
// the proving keys (sent once, already verified by keyset.js against the ledger's certified
// anchor), and answers prove requests. Witnesses (note secrets) cross only this in-browser channel.
import init, * as prover from "./prover-pkg/pool_prover_wasm.js";

let keys = null;
const ready = init();

self.onmessage = async (event) => {
  const msg = event.data;
  try {
    await ready;
    if (msg.type === "keys") {
      keys = { transfer: new Uint8Array(msg.transfer), deposit: new Uint8Array(msg.deposit) };
      self.postMessage({ type: "keys-ready" });
      return;
    }
    if (!keys) throw new Error("proving keys not loaded");
    let out;
    if (msg.type === "prove_deposit") {
      const [value, pk, rho, rcm] = msg.args;
      out = prover.prove_deposit(keys.deposit, BigInt(value), pk, rho, rcm);
    } else if (msg.type === "prove_transfer") {
      out = prover.prove_transfer(keys.transfer, msg.args[0]);
    } else {
      throw new Error(`unknown request ${msg.type}`);
    }
    self.postMessage({ type: "result", id: msg.id, out });
  } catch (error) {
    self.postMessage({ type: "error", id: msg.id, error: String(error && error.message ? error.message : error) });
  }
};
