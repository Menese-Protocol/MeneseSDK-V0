// Persistent store for the proving keyset (Menese DeFi Team).
//
// The keyset is 8,903,520 bytes (transfer_pk 8,454,480 + deposit_pk 449,040) and is re-fetched
// from the asset canister on every cold start. This figure tracks the QAP domain and has moved
// with it twice — 13,305,362 at 2^15, 23,882,592 at 2^16, and 8,903,520 now that the 4-ary tree
// brought the transfer statement down to 2^14.
// This caches the BYTES across sessions, keyed by the on-chain verifying-key anchor digest, so a
// key rotation invalidates the entry automatically: the digest covers both verifying keys, so a
// rotated key simply produces a different key and the old entry is never looked up again.
//
// WHAT IS CACHED, AND WHAT IS NOT. The bytes are cached; the verdict is not. Every cache hit still
// recomputes the SHA-256 of the proving keys and compares them against the manifest hashes stored
// alongside them, exactly as a cold load does. Skipping that would make a writable IndexedDB entry
// as authoritative as a certified anchor, which is the opposite of what the binding exists for.
// What the cache actually saves is the 8.5 MiB network round-trip, not the verification.
//
// The store is injectable so the load path can be measured and tested without a browser.

const DB_NAME = "zk-ledger-keyset";
const DB_VERSION = 1;
const STORE = "keysets";

/// An in-memory store with the same three methods, for tests and measurement harnesses.
export function memoryKeysetStore() {
  const entries = new Map();
  return {
    async get(key) { return entries.get(key) ?? null; },
    async put(key, value) { entries.set(key, value); },
    async clear() { entries.clear(); },
  };
}

function openDatabase(indexedDB) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transact(db, mode, run) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = run(tx.objectStore(STORE));
    tx.onabort = () => reject(tx.error);
    if (request) {
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    } else {
      tx.oncomplete = () => resolve(null);
    }
  });
}

/// The browser store. Returns null when IndexedDB is unavailable — a private-mode window or a
/// hardened profile must still be able to load the keyset, just without the cache.
export function indexedDbKeysetStore(indexedDB = globalThis.indexedDB) {
  if (!indexedDB) return null;
  let handle = null;
  const db = async () => (handle ??= await openDatabase(indexedDB));
  return {
    async get(key) {
      try { return await transact(await db(), "readonly", (store) => store.get(key)); }
      catch { return null; }          // a cache that cannot be read is a cache miss, never an error
    },
    async put(key, value) {
      try { await transact(await db(), "readwrite", (store) => store.put(value, key)); }
      catch { /* quota, private mode, a locked database: the load already succeeded without it */ }
    },
    async clear() {
      try { await transact(await db(), "readwrite", (store) => store.clear()); }
      catch { /* nothing to do */ }
    },
  };
}

/// The store a browser gets by default, or null outside one.
export function defaultKeysetStore() {
  try { return indexedDbKeysetStore(); } catch { return null; }
}
