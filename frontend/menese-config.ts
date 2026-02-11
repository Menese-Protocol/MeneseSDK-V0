// menese-config.ts — Shared config for all examples
// Copy this file into your project alongside any example

import { HttpAgent, Actor, ActorSubclass } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";

// ============================================================
// CONFIG — Change these for your app
// ============================================================

export const MENESE_CANISTER_ID = "urs2a-ziaaa-aaaad-aembq-cai";
export const IC_HOST = "https://icp0.io";

// Your developer key (get one by calling registerDeveloperCanister)
// When set, all operations bill YOUR account instead of the end user
export const DEVELOPER_KEY = ""; // e.g. "msk_2e8829391e9e81f78ff604f1ea59c690"

// ============================================================
// CANDID INTERFACE (minimal — add more methods as needed)
// Full interface: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai
// ============================================================

export const idlFactory = ({ IDL }: any) => {
  const Result = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const ResultNat64 = IDL.Variant({ ok: IDL.Nat64, err: IDL.Text });
  const ResultNat = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });

  const SolanaAddressInfo = IDL.Record({
    address: IDL.Text,
    publicKeyHex: IDL.Text,
    publicKeyBytes: IDL.Vec(IDL.Nat8),
  });

  const EvmAddressInfo = IDL.Record({
    address: IDL.Text,
    publicKeyHex: IDL.Text,
  });

  const SendResult = IDL.Record({
    txHash: IDL.Text,
  });

  const SwapResult = IDL.Variant({
    ok: IDL.Record({ txHash: IDL.Text, amountOut: IDL.Text }),
    err: IDL.Text,
  });

  const DeveloperAccountV3 = IDL.Record({
    owner: IDL.Principal,
    canisters: IDL.Vec(IDL.Principal),
    appName: IDL.Text,
    developerKey: IDL.Text,
    createdAt: IDL.Int,
  });

  const UserAccount = IDL.Record({
    creditsMicroUsd: IDL.Nat,
    tier: IDL.Variant({
      Free: IDL.Null,
      Developer: IDL.Null,
      Pro: IDL.Null,
      Enterprise: IDL.Null,
    }),
    actionsRemaining: IDL.Nat,
    subscriptionExpiry: IDL.Opt(IDL.Int),
    actionsUsed: IDL.Nat,
    totalDepositedMicroUsd: IDL.Nat,
    createdAt: IDL.Int,
  });

  return IDL.Service({
    // === WALLET ADDRESSES (FREE) ===
    getMySolanaAddress: IDL.Func([], [SolanaAddressInfo], []),
    getMyEvmAddress: IDL.Func([], [EvmAddressInfo], []),
    getMyBitcoinAddress: IDL.Func([], [IDL.Text], []),
    getMyXrpAddress: IDL.Func([], [IDL.Record({ classicAddress: IDL.Text, xAddress: IDL.Text })], []),
    getMySuiAddress: IDL.Func([], [IDL.Record({ address: IDL.Text, publicKeyHex: IDL.Text })], []),
    getMyTonAddress: IDL.Func([], [IDL.Record({ address: IDL.Text, rawAddress: IDL.Text })], []),
    getMyCardanoAddress: IDL.Func([], [IDL.Record({ address: IDL.Text })], []),
    getMyNearAddress: IDL.Func([], [IDL.Record({ accountId: IDL.Text })], []),
    getTronAddress: IDL.Func([], [IDL.Record({ base58: IDL.Text, hex: IDL.Text })], []),
    getMyAptosAddress: IDL.Func([], [IDL.Record({ address: IDL.Text })], []),
    getMyLitecoinAddress: IDL.Func([], [IDL.Text], []),
    getMyCloakAddress: IDL.Func([], [IDL.Record({ base58Address: IDL.Text })], []),
    getMyThorAddress: IDL.Func([], [IDL.Record({ address: IDL.Text })], []),
    // getAllAddresses returns nested records per chain (not flat text).
    // For simplicity, use the individual getMyXAddress() functions above.
    // Full Candid: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai

    // === BALANCES (FREE) ===
    getMySolanaBalance: IDL.Func([], [ResultNat64], []),
    getMyEvmBalance: IDL.Func([IDL.Text], [ResultNat], []),
    getICPBalance: IDL.Func([], [ResultNat64], []),
    getMyXrpBalance: IDL.Func([], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),
    getMySuiBalance: IDL.Func([], [IDL.Nat64], []),

    // === SEND ($0.05 per operation) ===
    sendSolTransaction: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    transferSplToken: IDL.Func([IDL.Text, IDL.Text, IDL.Nat64], [Result], []),
    sendEvmNativeTokenAutonomous: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Text)],
      [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })],
      []
    ),
    sendICP: IDL.Func([IDL.Principal, IDL.Nat64], [Result], []),
    sendBitcoin: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendXrpAutonomous: IDL.Func([IDL.Text, IDL.Text, IDL.Opt(IDL.Nat32)], [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })], []),
    sendSui: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })], []),
    sendTonSimple: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendTon: IDL.Func([IDL.Text, IDL.Nat64, IDL.Bool, IDL.Opt(IDL.Text), IDL.Nat32], [Result], []),
    sendTonWithComment: IDL.Func([IDL.Text, IDL.Nat64, IDL.Text], [Result], []),
    sendCardanoTransaction: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendTrx: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendTrc20: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Nat], [Result], []),
    sendAptos: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })], []),
    sendLitecoin: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendLitecoinWithFee: IDL.Func([IDL.Text, IDL.Nat64, IDL.Nat64], [Result], []),
    sendBitcoinDynamicFee: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendBitcoinWithFee: IDL.Func([IDL.Text, IDL.Nat64, IDL.Nat64], [Result], []),
    sendNearTransferFromUser: IDL.Func([IDL.Text, IDL.Nat], [Result], []),
    sendCloak: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendThor: IDL.Func([IDL.Text, IDL.Nat64, IDL.Text], [Result], []),
    sendICRC1: IDL.Func([IDL.Principal, IDL.Nat, IDL.Text], [Result], []),
    sendXrpIOU: IDL.Func([IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Nat32)], [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })], []),
    sendSuiMax: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })], []),
    transferSuiCoin: IDL.Func([IDL.Text, IDL.Text, IDL.Nat64], [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })], []),

    // === CHAIN-SPECIFIC SETUP ===
    createMySolanaAtaForMint: IDL.Func([IDL.Text], [Result], []),
    getMySolanaAta: IDL.Func([IDL.Text], [Result], []),
    xrpSetTrustline: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [Result], []),
    xrpGetAccountLines: IDL.Func([], [IDL.Variant({ ok: IDL.Text, err: IDL.Text })], []),

    // === SWAP ($0.075 per operation) ===
    swapRaydiumApiUser: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Nat64],
      [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })],
      []
    ),
    swapTokens: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({ txHash: IDL.Text }), err: IDL.Text })],
      []
    ),
    executeICPDexSwap: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({ amountOut: IDL.Nat }), err: IDL.Text })],
      []
    ),

    // SUI DEX — Cetus aggregator ($0.075)
    executeSuiSwap: IDL.Func(
      [IDL.Variant({ mainnet: IDL.Null, testnet: IDL.Null, devnet: IDL.Null }),
       IDL.Text, IDL.Text, IDL.Text, IDL.Text],
      [IDL.Record({ success: IDL.Bool, txDigest: IDL.Text, amountOut: IDL.Text, error: IDL.Opt(IDL.Text) })],
      []
    ),
    getSuiSwapQuote: IDL.Func(
      [IDL.Variant({ mainnet: IDL.Null, testnet: IDL.Null, devnet: IDL.Null }),
       IDL.Text, IDL.Text, IDL.Text, IDL.Nat64],
      [IDL.Opt(IDL.Record({ amountIn: IDL.Text, amountOut: IDL.Text, estimatedGas: IDL.Nat64, priceImpact: IDL.Float64, routerData: IDL.Text }))],
      []
    ),

    // Cardano DEX — Minswap ($0.075)
    executeMinswapSwap: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Float64],
      [IDL.Variant({ ok: IDL.Text, err: IDL.Text })],
      []
    ),
    getMinswapQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Float64],
      [IDL.Variant({ ok: IDL.Record({ amount_in: IDL.Text, amount_out: IDL.Text, min_amount_out: IDL.Text, avg_price_impact: IDL.Text, success: IDL.Bool }), err: IDL.Text })],
      []
    ),

    // XRP Ledger DEX ($0.075)
    xrpSwap: IDL.Func(
      [IDL.Record({ currency: IDL.Text, issuer: IDL.Text, value: IDL.Text }),
       IDL.Record({ currency: IDL.Text, issuer: IDL.Text, value: IDL.Text }),
       IDL.Text, IDL.Nat],
      [IDL.Record({ success: IDL.Bool, txId: IDL.Nat })],
      []
    ),

    // === BRIDGE ($0.10 per operation) ===
    quickUltrafastEthToSol: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({ jobId: IDL.Text }), err: IDL.Text })],
      []
    ),
    quickUltrafastUsdcToSol: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({ jobId: IDL.Text }), err: IDL.Text })],
      []
    ),
    quickCctpBridge: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({ jobId: IDL.Text }), err: IDL.Text })],
      []
    ),

    // === DEVELOPER / BILLING ===
    registerDeveloperCanister: IDL.Func([IDL.Principal, IDL.Text], [Result], []),
    getMyDeveloperKey: IDL.Func([], [Result], []),
    regenerateDeveloperKey: IDL.Func([], [Result], []),
    validateDeveloperKey: IDL.Func([IDL.Text], [IDL.Bool], ["query"]),
    getMyGatewayAccount: IDL.Func([], [UserAccount], []),
    getMyDeveloperAccount: IDL.Func([], [IDL.Opt(DeveloperAccountV3)], []),
    depositGatewayCredits: IDL.Func([IDL.Text, IDL.Nat], [IDL.Variant({ ok: IDL.Record({ id: IDL.Nat }), err: IDL.Text })], []),
  });
};

// ============================================================
// HELPER: Create authenticated Menese actor
// ============================================================

export async function createMeneseActor(): Promise<ActorSubclass<any>> {
  const authClient = await AuthClient.create();

  // Check if user is already authenticated
  const isAuth = await authClient.isAuthenticated();
  if (!isAuth) {
    // Trigger Internet Identity login popup
    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: resolve,
        onError: reject,
      });
    });
  }

  const identity = authClient.getIdentity();
  const agent = new HttpAgent({ host: IC_HOST, identity });

  return Actor.createActor(idlFactory, {
    agent,
    canisterId: MENESE_CANISTER_ID,
  });
}

// ============================================================
// HELPER: Create anonymous actor (for queries only)
// ============================================================

export async function createAnonActor(): Promise<ActorSubclass<any>> {
  const agent = new HttpAgent({ host: IC_HOST });
  // Skip fetchRootKey in production (only needed for local replica)
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: MENESE_CANISTER_ID,
  });
}
