// Network and canister configuration for the shielded-ledger client — Menese DeFi Team.
//
// Set once by the app (configureZk) before any call. Exported as live bindings, so every module
// that imports HOST / CANISTERS / VETKD_MASTER_KEY sees the configured values. The token is the
// ICRC-1/2 ledger the pool holds (ICP on mainnet); the directory is the shielded directory canister.
export let HOST = "https://icp-api.io";
export const CANISTERS = {
  zk_ledger: "",
  token: "",
  directory: "",
};
// The IC vetKD master key the directory derives from: "key_1" (mainnet production), "test_key_1",
// or the hex of a local replica's master public key. Clients derive the directory's public key
// from it themselves (envelope.js directoryKey) instead of trusting the canister's answer.
export let VETKD_MASTER_KEY = "key_1";

export function configureZk({ host, zkLedger, token, directory, vetkdMasterKey }) {
  if (!zkLedger || !token || !directory) throw new Error("shielded ledger: canister ids are not configured");
  HOST = host;
  CANISTERS.zk_ledger = zkLedger;
  CANISTERS.token = token;
  CANISTERS.directory = directory;
  VETKD_MASTER_KEY = vetkdMasterKey;
}

export const isConfigured = () => CANISTERS.zk_ledger !== "";
export const DECIMALS = 8;
export const BASE = 100_000_000n;

// ---- read-path scaling ----
// The SINGLE switch for new-format (view-tag) envelope WRITING. Unset (false) ⇒ sealNote emits
// byte-identical legacy envelopes; the READ path auto-detects old+new unconditionally regardless
// of this flag. Flip to true only when the official frontend cuts over (record the log_length at
// that deploy as VIEW_TAG_CUTOVER so wallets may trust tag-detection at/above it).
export const VIEW_TAG_ENABLED = false;
// Log position at/above which every note is guaranteed new-format (the recorded flip position +
// a straggler margin). null ⇒ no cutover known ⇒ wallets full-open every note (never-miss default).
export const VIEW_TAG_CUTOVER = null;
// ICRC-3 response cap (mirrors the ledger's MAX_BLOCKS_PER_CALL) — the pagination page size.
export const BLOCKS_PER_PAGE = 512;

// ---- device-portable wallet birthday ----
// The SINGLE switch for birthday recovery + publish (and the product cache store that rides on
// it). Unset (false) ⇒ exactly today's behavior: zero calls to the directory's birthday
// endpoints, no cache store in the app, birthday-less full-history scan on a fresh device.
export const BIRTHDAY_RECOVERY_ENABLED = true;
