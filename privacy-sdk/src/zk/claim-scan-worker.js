// One scan worker (claimScan.js) — Menese DeFi Team.
// Holds the recipient's vetKey inside a claim-scan-wasm Scanner and answers scan requests with the
// indices of envelopes that open, each fully verified (../../claim-scan-wasm/src/lib.rs).
import { initSync, Scanner } from "./claim-scan-pkg/claim_scan_wasm.js";

let scanner = null;

self.onmessage = (event) => {
  const msg = event.data;
  try {
    if (msg.type === "init") {
      initSync({ module: msg.wasm });
      scanner = new Scanner(new Uint8Array(msg.vetKey));
      self.postMessage({ type: "ready" });
    } else if (msg.type === "scan") {
      const found = Array.from(scanner.scan(new Uint8Array(msg.envelopes)));
      self.postMessage({ type: "result", id: msg.id, found });
    }
  } catch (error) {
    self.postMessage({ type: "error", id: msg.id, error: String(error && error.message ? error.message : error) });
  }
};
