// The live shielded ledger on Internet Computer mainnet — Menese Team.
import type { ZkNetwork } from "./engine/core";

export const ICP_LEDGER = "ryjl3-tyaaa-aaaaa-aaaba-cai";
export const SHIELDED_LEDGER = "3pwrb-oiaaa-aaaao-bbqba-cai";
export const SHIELDED_DIRECTORY = "3gv25-yaaaa-aaaao-bbqaq-cai";

/// The mainnet network. `keysBase` is where your app serves the proving keys
/// (tools/split-zk-keys.mjs writes that directory).
export function mainnet(keysBase: string): ZkNetwork {
  return {
    host: "https://icp-api.io",
    zkLedger: SHIELDED_LEDGER,
    token: ICP_LEDGER,
    directory: SHIELDED_DIRECTORY,
    vetkdMasterKey: "key_1",
    keysBase,
    // never prove against a ledger whose verifying keys could still be swapped
    requireFrozenKeys: true,
  };
}
