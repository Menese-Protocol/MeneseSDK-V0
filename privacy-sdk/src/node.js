// The engine in Node: a shop's server running its own payment inbox with its own identity — Menese Team.
//
//   import { createNodeEngine, verifyReceipt } from "./privacy/node.js";
//   const engine = createNodeEngine(network, identity, { cacheDir: "./private-cache", keysDir: "./zk-keys" });
//   await engine.open();
//   engine.onPayment((p) => markOrderPaid(p.orderId, p.reference, p.amountE8s));
//   await engine.sync();
//
// It is the same PrivateEngine as in the browser. What a browser gives the engine (Web Workers,
// wasm fetched next to its glue code, IndexedDB) is supplied here: worker threads running the same
// worker modules, wasm read from disk, and the encrypted note cache kept in files under `cacheDir`
// (what is stored is already sealed with a key derived from the account's vetKey, exactly as in
// IndexedDB). `keysDir` is the folder tools/split-zk-keys.mjs wrote (or the ceremony's own folder);
// it is needed only for actions that make proofs (claiming, paying, moving out).
// Run TypeScript with a loader that compiles it (for example `node --import tsx`).
import { Worker as ThreadWorker } from "node:worker_threads";
import { readFile, writeFile, mkdir, rm, rename } from "node:fs/promises";
import { join } from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { PrivateEngine } from "./engine/core";
import { checkReceipt as checkWith } from "./receipt";

const here = (path) => new URL(path, import.meta.url);

/// A Web-Worker-shaped object around a worker thread running `moduleUrl`.
class ThreadAsWorker {
  constructor(moduleUrl) {
    this.onmessage = null;
    this.onerror = null;
    this.thread = new ThreadWorker(here("./zk/node-worker.js"), { workerData: { module: moduleUrl.href } });
    this.thread.on("message", (data) => this.onmessage?.({ data }));
    this.thread.on("error", (error) => this.onerror?.({ error, message: error.message }));
  }
  postMessage(message, transfer) {
    this.thread.postMessage(message, transfer);
  }
  terminate() {
    void this.thread.terminate();
  }
}

export const nodeProverWorker = () => new ThreadAsWorker(here("./zk/prover-worker.js"));
export const nodeScanWorker = () => new ThreadAsWorker(here("./zk/claim-scan-worker.js"));

export const readProverWasm = () => readFile(here("./zk/prover-pkg/pool_prover_wasm_bg.wasm"));
export const readScanWasm = () => readFile(here("./zk/claim-scan-pkg/claim_scan_wasm_bg.wasm"));

/// A { get, set, delete } store of byte values in files under `dir` (one file per key).
export function fileStore(dir) {
  const path = (key) => join(dir, createHash("sha256").update(String(key)).digest("hex").slice(0, 32));
  return {
    async get(key) {
      try {
        return new Uint8Array(await readFile(path(key)));
      } catch {
        return undefined;
      }
    },
    async set(key, value) {
      await mkdir(dir, { recursive: true });
      // a name of its own for each write: two writes of the same key can overlap (two syncs at once)
      const tmp = `${path(key)}.${process.pid}.${randomBytes(8).toString("hex")}.tmp`;
      await writeFile(tmp, value);
      await rename(tmp, path(key)); // a crash mid-write leaves the previous cache, never half of one
    },
    async delete(key) {
      await rm(path(key), { force: true });
    },
  };
}

/// fetch() for the proving keys from a local folder: `<keysBase>/<name>` is read as `<dir>/<name>`.
export function folderFetch(dir) {
  return async (input) => {
    const name = String(input instanceof URL ? input.pathname : input).split("/").pop();
    try {
      return new Response(await readFile(join(dir, name)));
    } catch {
      return new Response("not found", { status: 404 });
    }
  };
}

/// A PrivateEngine for Node. `options.cacheDir`: where the encrypted note cache lives (omit to keep
/// nothing on disk: each start then scans the log from the account's birthday). `options.keysDir`:
/// the proving keys' folder (omit when keysBase is an http(s) URL the keys are served from).
export function createNodeEngine(network, identity, options = {}) {
  const engineOptions = {
    proverWasm: undefined,
    scanWasm: undefined,
    store: options.cacheDir ? fileStore(options.cacheDir) : null,
    keysetStore: null,
    fetchKeys: options.keysDir ? folderFetch(options.keysDir) : undefined,
    scanWorkers: options.scanWorkers,
  };
  const engine = new PrivateEngine(network, identity, nodeProverWorker, nodeScanWorker, engineOptions);
  // the wasm is read on open(), so constructing the engine stays synchronous
  const open = engine.open.bind(engine);
  let scanWasm = null;
  engine.open = async () => {
    engineOptions.proverWasm = await readProverWasm();
    scanWasm ??= await readScanWasm();
    engineOptions.scanWasm = scanWasm;
    return open();
  };
  return engine;
}

/// verifyReceipt / checkReceipt (src/receipt.ts) with the wasm read from disk.
export async function checkReceipt(receipt, network, options = {}) {
  return checkWith(receipt, network, { proverWasm: options.proverWasm ?? (await readProverWasm()) });
}
export async function verifyReceipt(receipt, network, options = {}) {
  return (await checkReceipt(receipt, network, options)).valid;
}
