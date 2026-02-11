/**
 * MeneseSDK Quick Start — Get wallet addresses on 15 chains
 *
 * What this does:
 *   1. Connects to MeneseSDK canister via Internet Identity
 *   2. Gets your derived wallet address on every supported chain
 *   3. Fetches SOL and ICP balances
 *
 * Every user who logs in with Internet Identity gets a UNIQUE
 * wallet address on each chain. No seed phrase needed — keys
 * are derived from your ICP identity inside the canister.
 *
 * Cost: FREE (address derivation and balance checks are free)
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { HttpAgent, Actor } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";

// ── Step 1: Your config ─────────────────────────────────────
const CANISTER_ID = "urs2a-ziaaa-aaaad-aembq-cai";
const IC_HOST = "https://icp0.io";

// ── Step 2: Minimal Candid interface (just what we need) ────
const idlFactory = ({ IDL }: any) => {
  const SolanaAddr = IDL.Record({ address: IDL.Text, publicKeyHex: IDL.Text, publicKeyBytes: IDL.Vec(IDL.Nat8) });
  const EvmAddr = IDL.Record({ address: IDL.Text, publicKeyHex: IDL.Text });
  const ResultNat64 = IDL.Variant({ ok: IDL.Nat64, err: IDL.Text });

  return IDL.Service({
    // Addresses (FREE)
    getMySolanaAddress: IDL.Func([], [SolanaAddr], []),
    getMyEvmAddress: IDL.Func([], [EvmAddr], []),
    getMyBitcoinAddress: IDL.Func([], [IDL.Text], []),
    getMySuiAddress: IDL.Func([], [IDL.Record({ address: IDL.Text, publicKeyHex: IDL.Text })], []),
    getMyXrpAddress: IDL.Func([], [IDL.Record({ classicAddress: IDL.Text, xAddress: IDL.Text })], []),
    getMyTonAddress: IDL.Func([], [IDL.Record({ address: IDL.Text, rawAddress: IDL.Text })], []),
    getMyCardanoAddress: IDL.Func([], [IDL.Record({ address: IDL.Text })], []),
    getMyAptosAddress: IDL.Func([], [IDL.Record({ address: IDL.Text })], []),
    getMyNearAddress: IDL.Func([], [IDL.Record({ accountId: IDL.Text })], []),
    getTronAddress: IDL.Func([], [IDL.Record({ base58: IDL.Text, hex: IDL.Text })], []),
    getMyLitecoinAddress: IDL.Func([], [IDL.Text], []),
    getMyCloakAddress: IDL.Func([], [IDL.Record({ base58Address: IDL.Text })], []),
    getMyThorAddress: IDL.Func([], [IDL.Record({ address: IDL.Text })], []),

    // Balances (FREE)
    getMySolanaBalance: IDL.Func([], [ResultNat64], []),
    getICPBalance: IDL.Func([], [ResultNat64], []),
  });
};

// ── Step 3: Connect and get addresses ───────────────────────
async function main() {
  // Login with Internet Identity
  const authClient = await AuthClient.create();
  await new Promise<void>((resolve, reject) => {
    authClient.login({
      identityProvider: "https://identity.ic0.app",
      onSuccess: resolve,
      onError: reject,
    });
  });

  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ host: IC_HOST, identity });
  const menese = Actor.createActor(idlFactory, { agent, canisterId: CANISTER_ID });

  console.log("Connected as:", identity.getPrincipal().toText());

  // Get addresses on every chain (all FREE, no billing)
  const [sol, evm, btc, sui, xrp, ton, cardano, aptos, near, tron, ltc, cloak, thor] =
    await Promise.all([
      menese.getMySolanaAddress(),
      menese.getMyEvmAddress(),
      menese.getMyBitcoinAddress(),
      menese.getMySuiAddress(),
      menese.getMyXrpAddress(),
      menese.getMyTonAddress(),
      menese.getMyCardanoAddress(),
      menese.getMyAptosAddress(),
      menese.getMyNearAddress(),
      menese.getTronAddress(),
      menese.getMyLitecoinAddress(),
      menese.getMyCloakAddress(),
      menese.getMyThorAddress(),
    ]);

  console.log("Your wallets:");
  console.log("  Solana:    ", (sol as any).address);
  console.log("  Ethereum:  ", (evm as any).address);   // Same address for ETH/ARB/BASE/POLY/BNB/OP
  console.log("  Bitcoin:   ", btc);
  console.log("  SUI:       ", (sui as any).address);
  console.log("  XRP:       ", (xrp as any).classicAddress);
  console.log("  TON:       ", (ton as any).address);
  console.log("  Cardano:   ", (cardano as any).address);
  console.log("  Aptos:     ", (aptos as any).address);
  console.log("  NEAR:      ", (near as any).accountId);
  console.log("  TRON:      ", (tron as any).base58);
  console.log("  Litecoin:  ", ltc);
  console.log("  CloakCoin: ", (cloak as any).base58Address);
  console.log("  THORChain: ", (thor as any).address);
  console.log("  ICP:       ", identity.getPrincipal().toText());

  // Check balances (also FREE)
  const [solBal, icpBal] = await Promise.all([
    menese.getMySolanaBalance(),
    menese.getICPBalance(),
  ]);

  if ("ok" in (solBal as any)) {
    console.log("\nSOL balance:", Number((solBal as any).ok) / 1e9, "SOL");
  }
  if ("ok" in (icpBal as any)) {
    console.log("ICP balance:", Number((icpBal as any).ok) / 1e8, "ICP");
  }
}

main().catch(console.error);
