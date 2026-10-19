// Fast claim discovery — Menese DeFi Team.
//
// Finding claimable payments without a reference means trying the recipient's vetKey on every
// envelope. This runs that search in claim-scan-wasm (../../claim-scan-wasm/src/lib.rs: native-speed
// curve arithmetic, and an early reject that skips the expensive checks on envelopes that are not
// the recipient's, with the full check on every match) across one Web Worker per core.
//
//   const pool = await createScanPool({ vetKey, wasm, makeWorker });
//   const indices = await pool.scan(envelopes);   // envelopes: Uint8Array[] of 216 bytes each
//   pool.close();
//
// `wasm`: the claim_scan_wasm_bg.wasm bytes (or a compiled WebAssembly.Module); `makeWorker`:
// () => Worker running src/zk/claim-scan-worker.js (bundler-specific, e.g. with Vite
// () => new Worker(new URL("./claim-scan-worker.js", import.meta.url), { type: "module" })).
// The vetKey goes to the workers as bytes and never leaves the browser.

export const ENVELOPE_LEN = 216;
// Envelopes per message: about four messages per worker (so the cores stay balanced), between 8 and
// 128 (a message costs well under one envelope's work).
const chunkFor = (n, workers) => Math.max(8, Math.min(128, Math.ceil(n / (workers * 4))));

export async function createScanPool({ vetKey, wasm, makeWorker, workers = null }) {
  const count = Math.max(1, Math.min(workers ?? (globalThis.navigator?.hardwareConcurrency || 4), 16));
  const key = vetKey.serialize ? vetKey.serialize() : vetKey;
  const pending = new Map();
  let nextId = 0;
  const pool = [];
  await Promise.all(Array.from({ length: count }, () => new Promise((resolve, reject) => {
    const worker = makeWorker();
    worker.onmessage = (event) => {
      const m = event.data;
      if (m.type === "ready") { pool.push(worker); resolve(); return; }
      const job = pending.get(m.id);
      if (!job) { if (m.type === "error") reject(new Error(m.error)); return; }
      pending.delete(m.id);
      if (m.type === "error") job.reject(new Error(m.error));
      else job.resolve(m.found);
    };
    worker.onerror = (e) => reject(e.error ?? new Error(e.message));
    worker.postMessage({ type: "init", wasm, vetKey: key });
  })));

  const idle = [...pool];
  const waiting = [];
  const acquire = () => (idle.length ? Promise.resolve(idle.pop()) : new Promise((r) => waiting.push(r)));
  const release = (w) => (waiting.length ? waiting.shift()(w) : idle.push(w));

  async function scanChunk(envelopes, base) {
    const buf = new Uint8Array(envelopes.length * ENVELOPE_LEN);
    envelopes.forEach((e, i) => {
      if (e.length !== ENVELOPE_LEN) throw new Error(`envelope ${base + i} is ${e.length} bytes`);
      buf.set(e, i * ENVELOPE_LEN);
    });
    const worker = await acquire();
    try {
      const id = nextId++;
      const found = await new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ type: "scan", id, envelopes: buf.buffer }, [buf.buffer]);
      });
      return found.map((i) => base + i);
    } finally {
      release(worker);
    }
  }

  return {
    workers: count,
    /// Indices (into `envelopes`) of those that open with the vetKey, each fully verified, in
    /// ascending order. `onChunk(found, done)` fires as chunks finish, in completion order.
    async scan(envelopes, { onChunk = null } = {}) {
      let done = 0;
      const jobs = [];
      const chunk = chunkFor(envelopes.length, count);
      for (let s = 0; s < envelopes.length; s += chunk) {
        const part = envelopes.slice(s, s + chunk);
        jobs.push(scanChunk(part, s).then((found) => {
          done += part.length;
          if (onChunk) onChunk(found, done);
          return found;
        }));
      }
      return (await Promise.all(jobs)).flat().sort((a, b) => a - b);
    },
    close() {
      for (const w of pool) w.terminate();
    },
  };
}
