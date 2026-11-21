// Runs one of the engine's Web Worker modules (prover-worker.js, claim-scan-worker.js) in a Node
// worker thread, unchanged — Menese Team. Used by ../node.js only; a browser never loads it.
// The worker modules expect `self.onmessage` / `self.postMessage` and load their wasm with fetch()
// next to their glue code; here `self` is bridged to the thread's port and fetch() reads file: URLs
// from disk. Messages that arrive while the module is still loading are delivered once it is ready.
import { parentPort, workerData } from "node:worker_threads";
import { readFile } from "node:fs/promises";

const networkFetch = globalThis.fetch;
globalThis.fetch = async (input, init) => {
  const url = input instanceof URL ? input : typeof input === "string" && input.startsWith("file:") ? new URL(input) : null;
  if (url && url.protocol === "file:") {
    return new Response(await readFile(url), { headers: { "content-type": url.pathname.endsWith(".wasm") ? "application/wasm" : "application/octet-stream" } });
  }
  return networkFetch(input, init);
};

const queue = [];
let loaded = false;
globalThis.self = globalThis;
globalThis.postMessage = (message, transfer) => parentPort.postMessage(message, transfer);
parentPort.on("message", (data) => {
  if (loaded) globalThis.onmessage?.({ data });
  else queue.push(data);
});
await import(workerData.module);
loaded = true;
for (const data of queue.splice(0)) globalThis.onmessage?.({ data });
