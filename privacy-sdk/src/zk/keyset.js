// Keyset loading and its binding to on-chain truth (Menese DeFi Team).
//
// Split out of prover.js so the binding can be exercised without instantiating the prover wasm.
//
// The integrity story has two independent halves, and only the second one is worth anything on
// its own:
//
//   1. self-consistency — every key file hashes to what SETUP-MANIFEST.json says. The manifest
//      is served from the SAME origin as the files it describes, so an attacker who controls the
//      served assets replaces all five coherently and this passes. It catches corruption, never
//      substitution.
//   2. on-chain binding — the local verifying keys must equal the ones the ledger will actually
//      verify against, read from the canister's certified vk anchor. This is what makes a
//      coherent five-file swap fail, because the attacker cannot change canister state.
//
// Half 2 is mandatory here: loadKeyset REFUSES to return a keyset without an anchor rather than
// degrading to half 1, so no caller can accidentally re-create the old behaviour.

import { defaultKeysetStore } from "./keysetCache.js";

export const VK_ANCHOR_DOMAIN = "zk-ledger/vk-anchor/v1";

export async function sha256Hex(bytes) {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

/// Recompute the canister's vk anchor digest from the key text alone, so the client never has to
/// trust the `digest` field of the reply it is checking. Must mirror Main.mo vkDigest().
export async function anchorDigestHex(transferVkHex, depositVkHex) {
  const bytes = new TextEncoder().encode(VK_ANCHOR_DOMAIN + transferVkHex + depositVkHex);
  return sha256Hex(bytes);
}

function normaliseVk(text) {
  return String(text).trim().toLowerCase();
}

/// Bytes -> hex string, for the anchor digest returned by the canister as a blob.
export function bytesToHex(bytes) {
  return [...new Uint8Array(bytes)].map((v) => v.toString(16).padStart(2, "0")).join("");
}

const FETCH_ATTEMPTS = 4;
const PART_CONCURRENCY = 4;

/// One asset, retried with backoff on a network failure or a 5xx / 408 / 429. Any other status is
/// the server's answer and is returned to the caller unchanged.
async function fetchRetrying(fetchImpl, path) {
  for (let attempt = 1; ; attempt++) {
    let response = null;
    let failure = null;
    try {
      response = await fetchImpl(path);
    } catch (e) {
      failure = e;
    }
    if (response) {
      const transient = response.status >= 500 || response.status === 408 || response.status === 429;
      if (response.ok || !transient) return response;
      failure = new Error(`keyset asset ${path} returned HTTP ${response.status}`);
    }
    if (attempt >= FETCH_ATTEMPTS) throw failure;
    await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** (attempt - 1)));
  }
}

async function checkedFetch(fetchImpl, path, kind = "arrayBuffer") {
  const response = await fetchRetrying(fetchImpl, path);
  if (!response.ok) throw new Error(`keyset asset ${path} returned HTTP ${response.status}`);
  return kind === "json" ? response.json() : response.arrayBuffer();
}

/// A large key file, fetched as the parts listed in `<path>.parts.json` (written by
/// tools/split-zk-keys.mjs). The IC HTTP gateway streams a multi-megabyte asset chunk by chunk,
/// and on a phone that long response can fail with a 503; parts of 1 MiB each come back in one
/// response, download in parallel, and are retried one by one. The joined bytes are checked against
/// the manifest hash by the caller exactly as a whole-file download is. A keyset served without an
/// index (the local test harness) is fetched whole.
async function fetchLarge(fetchImpl, base, name) {
  let index = null;
  try {
    const response = await fetchRetrying(fetchImpl, `${base}/${name}.parts.json`);
    if (response.ok) index = await response.json();
  } catch {
    index = null; // no index, or the host answered with something that is not one
  }
  if (!index || !Array.isArray(index.parts) || typeof index.size !== "number") {
    return checkedFetch(fetchImpl, `${base}/${name}`);
  }
  const parts = new Array(index.parts.length);
  let next = 0;
  const worker = async () => {
    while (next < index.parts.length) {
      const i = next++;
      parts[i] = new Uint8Array(await checkedFetch(fetchImpl, `${base}/${index.parts[i]}`));
    }
  };
  await Promise.all(Array.from({ length: Math.min(PART_CONCURRENCY, parts.length) }, worker));
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  if (total !== index.size) throw new Error(`keyset asset ${name}: parts add up to ${total} bytes, expected ${index.size}`);
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    joined.set(part, offset);
    offset += part.length;
  }
  return joined.buffer;
}

/// Load the served keyset and bind it to the canister's certified verifying-key anchor.
///
/// `anchor` is the reply of the ledger's `verifying_key_anchor` query:
///   { transfer_vk_hex, deposit_vk_hex, digest, epoch, certified }
/// Throws — never returns a partially-checked keyset — on any mismatch, and names what
/// mismatched so the UI can say what was actually checked rather than showing a generic error.
export async function loadKeyset(anchor, options = {}) {
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!anchor || typeof anchor.transfer_vk_hex !== "string" || typeof anchor.deposit_vk_hex !== "string") {
    throw new Error(
      "refusing to load proving keys: no on-chain verifying-key anchor was supplied, so the " +
      "served keyset could only be checked against a manifest from the same origin",
    );
  }
  if (anchor.transfer_vk_hex.length === 0 || anchor.deposit_vk_hex.length === 0) {
    throw new Error("refusing to load proving keys: the ledger reports no configured verifying keys");
  }

  // The cache key is the anchor digest recomputed from the anchor's own verifying keys, so a key
  // rotation produces a different key and the previous entry is simply never looked up again. No
  // eviction logic, no version field to forget to bump.
  const cacheKey = await anchorDigestHex(anchor.transfer_vk_hex, anchor.deposit_vk_hex);
  const store = options.store === undefined ? defaultKeysetStore() : options.store;

  let manifest;
  let transfer;
  let deposit;
  let transferVkBytes;
  let depositVkBytes;
  let fromCache = false;

  const cached = store ? await store.get(cacheKey) : null;
  if (cached && cached.manifest && cached.transfer && cached.deposit
      && cached.transferVkBytes && cached.depositVkBytes) {
    ({ manifest, transfer, deposit, transferVkBytes, depositVkBytes } = cached);
    fromCache = true;
  } else {
    const base = options.base ?? "/keys";
    [manifest, transfer, deposit, transferVkBytes, depositVkBytes] = await Promise.all([
      checkedFetch(fetchImpl, `${base}/SETUP-MANIFEST.json`, "json"),
      fetchLarge(fetchImpl, base, "transfer_pk.bin"),
      fetchLarge(fetchImpl, base, "deposit_pk.bin"),
      checkedFetch(fetchImpl, `${base}/transfer_vk.hex`),
      checkedFetch(fetchImpl, `${base}/deposit_vk.hex`),
    ]);
  }

  if (manifest.format !== 1 || manifest.proof_system !== "Groth16" || manifest.curve !== "BLS12-381") {
    throw new Error("unsupported or malformed proving-key manifest");
  }
  if (manifest.publicly_reproducible_toxic_waste) {
    throw new Error("refusing proving keys made with the public deterministic test setup");
  }
  // Run on EVERY load, cached or not. A cache hit skips the network, never the verification —
  // IndexedDB is writable by anything running on this origin, and treating a stored blob as
  // pre-verified would make it as authoritative as the certified anchor.
  const expected = {
    transfer_pk_sha256: transfer,
    deposit_pk_sha256: deposit,
    transfer_vk_sha256: transferVkBytes,
    deposit_vk_sha256: depositVkBytes,
  };
  for (const [field, bytes] of Object.entries(expected)) {
    const actual = await sha256Hex(bytes);
    if (actual !== manifest[field]) {
      // A corrupt cache entry must not be a dead end: drop it so the next load re-fetches.
      if (fromCache && store) await store.clear();
      throw new Error(`keyset integrity mismatch: ${field}`);
    }
  }

  const decoder = new TextDecoder();
  const transferVk = decoder.decode(transferVkBytes).trim();
  const depositVk = decoder.decode(depositVkBytes).trim();

  // --- the binding the manifest cannot provide ---
  if (normaliseVk(transferVk) !== normaliseVk(anchor.transfer_vk_hex)) {
    throw new Error(
      `verifying-key mismatch: the served transfer_vk.hex is not the transfer verifying key this ` +
      `ledger verifies against (on-chain keyset epoch ${anchor.epoch}). Proofs built with these ` +
      `proving keys would be rejected on-chain.`,
    );
  }
  if (normaliseVk(depositVk) !== normaliseVk(anchor.deposit_vk_hex)) {
    throw new Error(
      `verifying-key mismatch: the served deposit_vk.hex is not the deposit verifying key this ` +
      `ledger verifies against (on-chain keyset epoch ${anchor.epoch}).`,
    );
  }
  // Defence in depth: recompute the anchor digest from the key text, so a reply whose digest
  // field disagrees with its own vk fields is refused rather than silently trusted.
  if (anchor.digest !== undefined && anchor.digest !== null) {
    const recomputed = await anchorDigestHex(anchor.transfer_vk_hex, anchor.deposit_vk_hex);
    const reported = typeof anchor.digest === "string" ? anchor.digest.toLowerCase() : bytesToHex(anchor.digest);
    if (recomputed !== reported) {
      throw new Error(
        "verifying-key anchor is internally inconsistent: its digest does not cover the verifying " +
        "keys it reports, so it cannot be used to bind the local keyset",
      );
    }
  }

  // Stored only after every check above has passed, so a poisoned response is never persisted.
  if (store && !fromCache) {
    await store.put(cacheKey, { manifest, transfer, deposit, transferVkBytes, depositVkBytes });
  }

  return {
    transfer: new Uint8Array(transfer),
    deposit: new Uint8Array(deposit),
    fromCache,
    // The ON-CHAIN text is returned, not the served file. They are byte-equal by the checks
    // above, and returning the on-chain one means every downstream consumer — including the
    // proving-key lineage check — is fed ledger truth by construction.
    transferVk: anchor.transfer_vk_hex,
    depositVk: anchor.deposit_vk_hex,
    keysetEpoch: anchor.epoch,
    anchorCertified: anchor.certified === true,
    manifest,
  };
}
