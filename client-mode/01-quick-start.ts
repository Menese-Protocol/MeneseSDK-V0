/**
 * MeneseSDK Quick Start — Get wallet addresses on 19 chains
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
import { IDL } from "@dfinity/candid";

// ── Step 1: Your config ─────────────────────────────────────
const CANISTER_ID = "urs2a-ziaaa-aaaad-aembq-cai";
const IC_HOST = "https://icp0.io";

// ── Step 2: Minimal Candid interface (just what we need) ────
// Field names MUST match the .did exactly — e.g. "evmAddress" not "address"
const idlFactory = ({ IDL }: any) => {
  const SolanaAddressInfo = IDL.Record({
    address: IDL.Text,
    publicKeyHex: IDL.Text,
    publicKeyBytes: IDL.Vec(IDL.Nat8),
  });
  const EvmAddressInfo = IDL.Record({
    evmAddress: IDL.Text,           // NOT "address"
    publicKeyHex: IDL.Text,
  });
  const AddressInfo = IDL.Record({   // Bitcoin, Litecoin, Thorchain
    bech32Address: IDL.Text,
    hash160Hex: IDL.Text,
    pubKeyHex: IDL.Text,
  });
  const CardanoAddressInfo = IDL.Record({
    bech32Address: IDL.Text,
    addressBytesHex: IDL.Text,
    paymentPubKeyHex: IDL.Text,
    stakePubKeyHex: IDL.Text,
  });
  const SuiAddressInfo = IDL.Record({
    suiAddress: IDL.Text,            // NOT "address"
    publicKeyHex: IDL.Text,
    publicKeyBytes: IDL.Vec(IDL.Nat8),
  });
  const XrpAddressInfo = IDL.Record({
    classicAddress: IDL.Text,
    accountIdHex: IDL.Text,
    accountIdBytes: IDL.Vec(IDL.Nat8),
    publicKeyHex: IDL.Text,
  });
  const TonAddressInfo = IDL.Record({
    bounceable: IDL.Text,            // NOT "address"
    nonBounceable: IDL.Text,
    rawAddress: IDL.Text,
    publicKeyHex: IDL.Text,
    stateInitBocBase64: IDL.Text,
  });
  const AptosAddressInfo = IDL.Record({
    address: IDL.Text,
    publicKeyHex: IDL.Text,
  });
  const PubKeyInfo = IDL.Record({    // Near
    implicitAccountId: IDL.Text,
    publicKeyBase58: IDL.Text,
    publicKeyHex: IDL.Text,
  });
  const TronAddressInfo = IDL.Record({
    base58Address: IDL.Text,         // NOT "base58"
    hexAddress: IDL.Text,            // NOT "hex"
    publicKeyHex: IDL.Text,
  });
  const CloakAddressInfo = IDL.Record({
    base58Address: IDL.Text,
    addressBytesHex: IDL.Text,
    hash160Hex: IDL.Text,
    pubKeyHex: IDL.Text,
  });
  const ResultNat64 = IDL.Variant({ ok: IDL.Nat64, err: IDL.Text });

  return IDL.Service({
    // Addresses (FREE)
    getMySolanaAddress: IDL.Func([], [SolanaAddressInfo], []),
    getMyEvmAddress: IDL.Func([], [EvmAddressInfo], []),
    getMyBitcoinAddress: IDL.Func([], [AddressInfo], []),
    getMyLitecoinAddress: IDL.Func([], [AddressInfo], []),
    getMyThorAddress: IDL.Func([], [AddressInfo], []),
    getMySuiAddress: IDL.Func([], [SuiAddressInfo], []),
    getMyXrpAddress: IDL.Func([], [XrpAddressInfo], []),
    getMyTonAddress: IDL.Func([], [TonAddressInfo], []),
    getMyCardanoAddress: IDL.Func([], [CardanoAddressInfo], []),
    getMyAptosAddress: IDL.Func([], [AptosAddressInfo], []),
    getMyNearAddress: IDL.Func([], [PubKeyInfo], []),
    getTronAddress: IDL.Func([], [TronAddressInfo], []),
    getMyCloakAddress: IDL.Func([], [CloakAddressInfo], []),

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
  const [sol, evm, btc, ltc, thor, sui, xrp, ton, cardano, aptos, near, tron, cloak] =
    await Promise.all([
      menese.getMySolanaAddress(),
      menese.getMyEvmAddress(),
      menese.getMyBitcoinAddress(),
      menese.getMyLitecoinAddress(),
      menese.getMyThorAddress(),
      menese.getMySuiAddress(),
      menese.getMyXrpAddress(),
      menese.getMyTonAddress(),
      menese.getMyCardanoAddress(),
      menese.getMyAptosAddress(),
      menese.getMyNearAddress(),
      menese.getTronAddress(),
      menese.getMyCloakAddress(),
    ]);

  console.log("Your wallets across 19 chains:");
  console.log("  Solana:    ", (sol as any).address);
  console.log("  Ethereum:  ", (evm as any).evmAddress);   // Same address for ETH/ARB/BASE/POLY/BNB/OP
  console.log("  Bitcoin:   ", (btc as any).bech32Address);
  console.log("  Litecoin:  ", (ltc as any).bech32Address);
  console.log("  THORChain: ", (thor as any).bech32Address);
  console.log("  SUI:       ", (sui as any).suiAddress);
  console.log("  XRP:       ", (xrp as any).classicAddress);
  console.log("  TON:       ", (ton as any).nonBounceable);
  console.log("  Cardano:   ", (cardano as any).bech32Address);
  console.log("  Aptos:     ", (aptos as any).address);
  console.log("  NEAR:      ", (near as any).implicitAccountId);
  console.log("  TRON:      ", (tron as any).base58Address);
  console.log("  CloakCoin: ", (cloak as any).base58Address);
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
