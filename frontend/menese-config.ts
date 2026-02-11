// menese-config.ts — Shared config for all MeneseSDK frontend examples
//
// Copy this file into your project alongside any example.
// Full Candid interface:
//   https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai

import { HttpAgent, Actor, ActorSubclass } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";

// ============================================================
// CONFIG — Change these for your app
// ============================================================

export const MENESE_CANISTER_ID = "urs2a-ziaaa-aaaad-aembq-cai";
export const IC_HOST = "https://icp0.io";

// Your developer key (get one by calling registerDeveloperCanister)
export const DEVELOPER_KEY = ""; // e.g. "msk_2e8829391e9e81f78ff604f1ea59c690"

// ============================================================
// CANDID INTERFACE (matches backend.did exactly)
// ============================================================

export const idlFactory = ({ IDL }: any) => {
  const Result = IDL.Variant({ ok: IDL.Text, err: IDL.Text });
  const ResultNat64 = IDL.Variant({ ok: IDL.Nat64, err: IDL.Text });
  const ResultNat = IDL.Variant({ ok: IDL.Nat, err: IDL.Text });

  // ─── Address types (exact field names from .did) ──────────

  const SolanaAddressInfo = IDL.Record({
    address: IDL.Text,
    publicKeyHex: IDL.Text,
    publicKeyBytes: IDL.Vec(IDL.Nat8),
  });

  const EvmAddressInfo = IDL.Record({
    evmAddress: IDL.Text,       // NOT "address" — it's "evmAddress"
    publicKeyHex: IDL.Text,
  });

  const AddressInfo = IDL.Record({   // Bitcoin, Litecoin, Thorchain
    bech32Address: IDL.Text,         // NOT plain Text — it's a record
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
    suiAddress: IDL.Text,       // NOT "address" — it's "suiAddress"
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
    bounceable: IDL.Text,       // NOT "address" — use bounceable or nonBounceable
    nonBounceable: IDL.Text,
    rawAddress: IDL.Text,
    publicKeyHex: IDL.Text,
    stateInitBocBase64: IDL.Text,
  });

  const TronAddressInfo = IDL.Record({
    base58Address: IDL.Text,    // NOT "base58" — it's "base58Address"
    hexAddress: IDL.Text,       // NOT "hex" — it's "hexAddress"
    publicKeyHex: IDL.Text,
  });

  const AptosAddressInfo = IDL.Record({
    address: IDL.Text,
    publicKeyHex: IDL.Text,
  });

  const PubKeyInfo = IDL.Record({  // Near
    implicitAccountId: IDL.Text,
    publicKeyBase58: IDL.Text,
    publicKeyHex: IDL.Text,
  });

  const CloakAddressInfo = IDL.Record({
    base58Address: IDL.Text,
    addressBytesHex: IDL.Text,
    hash160Hex: IDL.Text,
    pubKeyHex: IDL.Text,
  });

  // ─── Send result types ────────────────────────────────────

  const SendResult = IDL.Record({       // SOL, SUI, Aptos, Near, Thor
    txHash: IDL.Text,
    senderAddress: IDL.Text,
    note: IDL.Text,
  });

  const SendResultBtcLtc = IDL.Record({
    txid: IDL.Text,
    amount: IDL.Nat64,
    fee: IDL.Nat64,
    senderAddress: IDL.Text,
    recipientAddress: IDL.Text,
    note: IDL.Text,
  });

  const SendICPResult = IDL.Record({
    amount: IDL.Nat64,
    blockHeight: IDL.Nat64,
    fee: IDL.Nat64,
    from: IDL.Principal,
    to: IDL.Principal,
  });

  const SendICRC1Result = IDL.Record({
    amount: IDL.Nat,
    blockHeight: IDL.Nat,
    fee: IDL.Nat,
    to: IDL.Principal,
    token: IDL.Text,
  });

  const SendResultEvm = IDL.Record({
    expectedTxHash: IDL.Text,
    nonce: IDL.Nat,
    senderAddress: IDL.Text,
    note: IDL.Text,
  });

  const SendResultTon = IDL.Record({
    txHash: IDL.Text,
    bocBase64: IDL.Text,
    senderAddress: IDL.Text,
    success: IDL.Bool,
    error: IDL.Opt(IDL.Text),
  });

  const SendResultXrp = IDL.Record({
    txHash: IDL.Text,
    explorerUrl: IDL.Text,
    message: IDL.Text,
    success: IDL.Bool,
    sequence: IDL.Nat32,
    ledgerUsed: IDL.Nat32,
  });

  const SendResultCloak = IDL.Record({
    txHash: IDL.Text,
    txHex: IDL.Text,
    changeValue: IDL.Nat64,
  });

  const TransferAndSendResult = IDL.Record({
    txSignature: IDL.Text,
    serializedTxBase64: IDL.Text,
    blockhash: IDL.Text,
  });

  // ─── Raydium result type ─────────────────────────────────

  const RaydiumApiSwapResult = IDL.Record({
    inputAmount: IDL.Text,
    outputAmount: IDL.Text,
    priceImpactPct: IDL.Text,
    txSignature: IDL.Text,
  });

  // ─── Swap types ───────────────────────────────────────────

  const DexId = IDL.Variant({ ICPSwap: IDL.Null, KongSwap: IDL.Null });

  const SwapRequest = IDL.Record({
    tokenIn: IDL.Text,
    tokenOut: IDL.Text,
    amountIn: IDL.Nat,
    minAmountOut: IDL.Nat,
    slippagePct: IDL.Float64,
    preferredDex: IDL.Opt(DexId),
  });

  const SwapResultIcp = IDL.Record({
    amountIn: IDL.Nat,
    amountOut: IDL.Nat,
    dex: DexId,
    fee: IDL.Nat,
    message: IDL.Text,
    success: IDL.Bool,
    txId: IDL.Nat,
  });

  const SwapResultSui = IDL.Record({
    success: IDL.Bool,
    txDigest: IDL.Text,
    amountOut: IDL.Text,
    error: IDL.Opt(IDL.Text),
  });

  const SwapResultXrp = IDL.Record({
    success: IDL.Bool,
    txHash: IDL.Text,
    explorerUrl: IDL.Text,
    message: IDL.Text,
    sourceAmount: IDL.Text,
    destinationAmount: IDL.Text,
  });

  const TokenAmount = IDL.Record({
    currency: IDL.Text,
    issuer: IDL.Text,
    value: IDL.Text,
  });

  const SuiNetwork = IDL.Variant({ mainnet: IDL.Null, testnet: IDL.Null, devnet: IDL.Null });

  const SwapQuote = IDL.Record({
    amountIn: IDL.Text,
    amountOut: IDL.Text,
    estimatedGas: IDL.Nat64,
    priceImpact: IDL.Float64,
    routerData: IDL.Text,
  });

  // ─── ATA / Setup types ────────────────────────────────────

  const CreateAtaResult = IDL.Record({
    ata: IDL.Text,
    mint: IDL.Text,
    owner: IDL.Text,
    txSignature: IDL.Text,
    blockhash: IDL.Text,
  });

  const TrustSetResult = IDL.Record({
    success: IDL.Bool,
    txHash: IDL.Text,
    explorerUrl: IDL.Text,
    message: IDL.Text,
  });

  // ─── Billing types ────────────────────────────────────────

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
      Free: IDL.Null, Developer: IDL.Null, Pro: IDL.Null, Enterprise: IDL.Null,
    }),
    actionsRemaining: IDL.Nat,
    subscriptionExpiry: IDL.Opt(IDL.Int),
    actionsUsed: IDL.Nat,
    totalDepositedMicroUsd: IDL.Nat,
    createdAt: IDL.Int,
  });

  // ─── Balance info types ───────────────────────────────────

  const BalanceInfo = IDL.Record({
    address: IDL.Text,
    balance: IDL.Nat64,
    utxoCount: IDL.Nat,
  });

  // ============================================================
  // SERVICE DEFINITION
  // ============================================================

  return IDL.Service({

    // === ADDRESSES (FREE) ===
    getMySolanaAddress: IDL.Func([], [SolanaAddressInfo], []),
    getMyEvmAddress: IDL.Func([], [EvmAddressInfo], []),
    getMyBitcoinAddress: IDL.Func([], [AddressInfo], []),
    getMyLitecoinAddress: IDL.Func([], [AddressInfo], []),
    getMyCardanoAddress: IDL.Func([], [CardanoAddressInfo], []),
    getMySuiAddress: IDL.Func([], [SuiAddressInfo], []),
    getMyXrpAddress: IDL.Func([], [XrpAddressInfo], []),
    getMyTonAddress: IDL.Func([], [TonAddressInfo], []),
    getTronAddress: IDL.Func([], [TronAddressInfo], []),
    getMyAptosAddress: IDL.Func([], [AptosAddressInfo], []),
    getMyNearAddress: IDL.Func([], [PubKeyInfo], []),
    getMyCloakAddress: IDL.Func([], [CloakAddressInfo], []),
    getMyThorAddress: IDL.Func([], [AddressInfo], []),
    getMySolanaAta: IDL.Func([IDL.Text], [IDL.Text], []),

    // === BALANCES (FREE) ===
    getMySolanaBalance: IDL.Func([], [ResultNat64], []),
    getMyEvmBalance: IDL.Func([IDL.Text], [ResultNat], []),      // rpcEndpoint
    getICPBalance: IDL.Func([], [ResultNat64], []),
    getBitcoinBalance: IDL.Func([], [IDL.Nat64], []),
    getLitecoinBalance: IDL.Func([], [IDL.Nat64], []),
    getMyXrpBalance: IDL.Func([], [Result], []),                  // ok: Text (XRP amount string)
    getMySuiBalance: IDL.Func([], [IDL.Nat64], []),
    getMyTonBalance: IDL.Func([], [ResultNat64], []),
    getCardanoBalance: IDL.Func([], [ResultNat64], []),
    getAptosBalance: IDL.Func([], [ResultNat64], []),
    getMyNearBalance: IDL.Func([], [IDL.Nat], []),
    getThorBalance: IDL.Func([], [IDL.Vec(IDL.Record({ amount: IDL.Nat, denom: IDL.Text }))], []),
    getCloakBalance: IDL.Func([], [IDL.Variant({ ok: BalanceInfo, err: IDL.Text })], []),
    getTrxBalance: IDL.Func([IDL.Text], [ResultNat64], []),       // address
    getICRC1Balance: IDL.Func([IDL.Text], [ResultNat], []),       // ledgerCanisterId
    getMyTrc20Balance: IDL.Func([IDL.Text], [ResultNat], []),     // contractAddress

    // === SEND — ALL CHAINS ($0.05) ===

    // Solana
    sendSolTransaction: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    transferSplToken: IDL.Func(
      [IDL.Nat64, IDL.Text, IDL.Text],  // amount, sourceAta, destinationAta
      [TransferAndSendResult], []
    ),

    // EVM — 5 params: to, value(nat), rpcEndpoint, chainId(nat), quoteId(opt)
    sendEvmNativeTokenAutonomous: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Text, IDL.Nat, IDL.Opt(IDL.Text)],
      [IDL.Variant({ ok: SendResultEvm, err: IDL.Text })], []
    ),

    // ICP
    sendICP: IDL.Func(
      [IDL.Principal, IDL.Nat64],
      [IDL.Variant({ ok: SendICPResult, err: IDL.Text })], []
    ),
    sendICRC1: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Text],  // to, amount, ledgerCanisterId
      [IDL.Variant({ ok: SendICRC1Result, err: IDL.Text })], []
    ),
    approveICRC2: IDL.Func(
      [IDL.Principal, IDL.Nat, IDL.Opt(IDL.Nat64), IDL.Text],
      [IDL.Variant({ ok: IDL.Record({ amount: IDL.Nat, blockHeight: IDL.Nat, spender: IDL.Principal, token: IDL.Text }), err: IDL.Text })], []
    ),

    // Bitcoin
    sendBitcoin: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: SendResultBtcLtc, err: IDL.Text })], []),
    sendBitcoinDynamicFee: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: SendResultBtcLtc, err: IDL.Text })], []),
    sendBitcoinWithFee: IDL.Func([IDL.Text, IDL.Nat64, IDL.Nat64], [IDL.Variant({ ok: SendResultBtcLtc, err: IDL.Text })], []),

    // Litecoin — returns {txHash, senderAddress, note} (NOT same as Bitcoin)
    sendLitecoin: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: SendResult, err: IDL.Text })], []),
    sendLitecoinWithFee: IDL.Func([IDL.Text, IDL.Nat64, IDL.Nat64], [IDL.Variant({ ok: SendResult, err: IDL.Text })], []),

    // XRP
    sendXrpAutonomous: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Opt(IDL.Nat32)],
      [SendResultXrp], []
    ),
    sendXrpIOU: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Text, IDL.Opt(IDL.Nat32)],
      [SendResultXrp], []
    ),

    // SUI
    sendSui: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: SendResult, err: IDL.Text })], []),
    sendSuiMax: IDL.Func([IDL.Text], [IDL.Variant({ ok: SendResult, err: IDL.Text })], []),
    transferSuiCoin: IDL.Func([IDL.Text, IDL.Text, IDL.Nat64], [IDL.Variant({ ok: SendResult, err: IDL.Text })], []),

    // TON
    sendTonSimple: IDL.Func([IDL.Text, IDL.Nat64], [SendResultTon], []),
    sendTon: IDL.Func([IDL.Text, IDL.Nat64, IDL.Bool, IDL.Opt(IDL.Text), IDL.Nat32], [SendResultTon], []),
    sendTonWithComment: IDL.Func([IDL.Text, IDL.Nat64, IDL.Text], [SendResultTon], []),

    // Cardano
    sendCardanoTransaction: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),

    // Tron
    sendTrx: IDL.Func([IDL.Text, IDL.Nat64], [Result], []),
    sendTrc20: IDL.Func([IDL.Text, IDL.Text, IDL.Nat, IDL.Nat64], [Result], []),

    // Aptos
    sendAptos: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: SendResult, err: IDL.Text })], []),

    // Near
    sendNearTransferFromUser: IDL.Func([IDL.Text, IDL.Nat], [Result], []),

    // CloakCoin
    sendCloak: IDL.Func([IDL.Text, IDL.Nat64], [IDL.Variant({ ok: SendResultCloak, err: IDL.Text })], []),

    // Thorchain
    sendThor: IDL.Func([IDL.Text, IDL.Nat64, IDL.Text], [Result], []),

    // === SWAP — 6 DEXes ($0.075) ===

    // Raydium (Solana) — 8 params, returns flat record (NOT variant)
    swapRaydiumApiUser: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Nat64, IDL.Bool, IDL.Bool, IDL.Opt(IDL.Text), IDL.Opt(IDL.Text)],
      [RaydiumApiSwapResult], []
    ),

    // Uniswap V3 (EVM)
    swapTokens: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text, IDL.Nat, IDL.Nat, IDL.Bool, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({
        expectedTxHash: IDL.Text, approvalTxHash: IDL.Opt(IDL.Text),
        nonce: IDL.Nat, note: IDL.Text, path: IDL.Vec(IDL.Text),
        pathSymbols: IDL.Vec(IDL.Text), senderAddress: IDL.Text,
        isDirect: IDL.Bool, amountIn: IDL.Nat, minAmountOut: IDL.Nat,
      }), err: IDL.Text })], []
    ),
    swapETHForUSDC: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({
        expectedTxHash: IDL.Text, approvalTxHash: IDL.Opt(IDL.Text),
        nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text,
        ethIn: IDL.Nat, minUSDCOut: IDL.Nat,
      }), err: IDL.Text })], []
    ),
    swapUSDCForETH: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({
        expectedTxHash: IDL.Text, approvalTxHash: IDL.Opt(IDL.Text),
        nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text,
        usdcIn: IDL.Nat, minETHOut: IDL.Nat,
      }), err: IDL.Text })], []
    ),

    // ICPSwap + KongSwap (ICP)
    executeICPDexSwap: IDL.Func([SwapRequest], [IDL.Variant({ ok: SwapResultIcp, err: IDL.Text })], []),

    // Cetus (SUI)
    executeSuiSwap: IDL.Func(
      [SuiNetwork, IDL.Text, IDL.Text, IDL.Text, IDL.Text],
      [SwapResultSui], []
    ),

    // Minswap (Cardano)
    executeMinswapSwap: IDL.Func([IDL.Text, IDL.Text, IDL.Nat64, IDL.Float64], [Result], []),

    // XRP Ledger DEX
    xrpSwap: IDL.Func(
      [TokenAmount, TokenAmount, IDL.Text, IDL.Nat],
      [SwapResultXrp], []
    ),

    // === SWAP QUOTES (FREE) ===
    getRaydiumQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Nat64],
      [IDL.Record({ amountIn: IDL.Nat64, amountOut: IDL.Nat64, priceImpact: IDL.Float64, route: IDL.Text })], []
    ),
    getICPDexQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Float64],
      [IDL.Record({
        best: IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, dex: DexId, fee: IDL.Nat, minAmountOut: IDL.Nat, success: IDL.Bool, tokenIn: IDL.Text, tokenOut: IDL.Text, poolId: IDL.Opt(IDL.Text), priceImpactPct: IDL.Text, rawData: IDL.Text, route: IDL.Vec(IDL.Text) }),
        icpswapQuote: IDL.Opt(IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, dex: DexId, fee: IDL.Nat, minAmountOut: IDL.Nat, success: IDL.Bool, tokenIn: IDL.Text, tokenOut: IDL.Text, poolId: IDL.Opt(IDL.Text), priceImpactPct: IDL.Text, rawData: IDL.Text, route: IDL.Vec(IDL.Text) })),
        kongswapQuote: IDL.Opt(IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, dex: DexId, fee: IDL.Nat, minAmountOut: IDL.Nat, success: IDL.Bool, tokenIn: IDL.Text, tokenOut: IDL.Text, poolId: IDL.Opt(IDL.Text), priceImpactPct: IDL.Text, rawData: IDL.Text, route: IDL.Vec(IDL.Text) })),
      })], []
    ),
    getSuiSwapQuote: IDL.Func(
      [SuiNetwork, IDL.Text, IDL.Text, IDL.Text, IDL.Nat64],
      [IDL.Opt(SwapQuote)], []
    ),
    getMinswapQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Float64],
      [IDL.Variant({ ok: IDL.Record({ amount_in: IDL.Text, amount_out: IDL.Text, min_amount_out: IDL.Text, avg_price_impact: IDL.Text, success: IDL.Bool }), err: IDL.Text })], []
    ),
    getTokenQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, fromToken: IDL.Text, toToken: IDL.Text, path: IDL.Vec(IDL.Text) }), err: IDL.Text })], []
    ),

    // === BRIDGE ($0.10) ===

    // ETH→SOL (returns Result = {ok: text, err: text})
    quickUltrafastEthToSol: IDL.Func([IDL.Nat], [Result], []),
    quickUltrafastUsdcToSol: IDL.Func([IDL.Nat], [Result], []),
    quickUltrafastEthToToken: IDL.Func([IDL.Nat, IDL.Text, IDL.Nat], [Result], []),

    // CCTP & SOL→ETH (returns {ok: {jobId, userUsdcAta}, err: text})
    quickCctpBridge: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Text, IDL.Bool, IDL.Nat, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({ jobId: IDL.Text, userUsdcAta: IDL.Text }), err: IDL.Text })], []
    ),
    quickSolToEth: IDL.Func(
      [IDL.Nat64, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({ jobId: IDL.Text, userUsdcAta: IDL.Text }), err: IDL.Text })], []
    ),
    quickUsdcBridgeSolToEth: IDL.Func(
      [IDL.Nat64],
      [IDL.Variant({ ok: IDL.Record({ jobId: IDL.Text, userUsdcAta: IDL.Text }), err: IDL.Text })], []
    ),

    // === SOLANA ATA CREATION ===
    createMySolanaAtaForMint: IDL.Func([IDL.Text, IDL.Text], [CreateAtaResult], []),
    createMySolanaAtaForMintWithProgram: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [CreateAtaResult], []),

    // === XRP TRUSTLINES ===
    xrpSetTrustline: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [TrustSetResult], []),
    xrpGetAccountLines: IDL.Func([], [Result], []),

    // === DEVELOPER / BILLING ===
    registerDeveloperCanister: IDL.Func([IDL.Principal, IDL.Text], [Result], []),
    getMyDeveloperKey: IDL.Func([], [Result], []),
    regenerateDeveloperKey: IDL.Func([], [Result], []),
    validateDeveloperKey: IDL.Func([IDL.Text], [IDL.Bool], ["query"]),
    getMyGatewayAccount: IDL.Func([], [UserAccount], []),
    getMyDeveloperAccount: IDL.Func([], [IDL.Opt(DeveloperAccountV3)], []),
    depositGatewayCredits: IDL.Func(
      [IDL.Text, IDL.Nat],
      [IDL.Variant({ ok: IDL.Record({ id: IDL.Nat }), err: IDL.Text })], []
    ),

    // === UTILITY ===
    getBitcoinMaxSendAmount: IDL.Func(
      [IDL.Opt(IDL.Nat64)],
      [IDL.Variant({ ok: IDL.Record({ maxAmount: IDL.Nat64, fee: IDL.Nat64, utxoCount: IDL.Nat }), err: IDL.Text })], []
    ),
    getLitecoinMaxSendAmount: IDL.Func(
      [IDL.Opt(IDL.Nat64)],
      [IDL.Variant({ ok: IDL.Record({ maxAmount: IDL.Nat64, fee: IDL.Nat64, utxoCount: IDL.Nat }), err: IDL.Text })], []
    ),
    health: IDL.Func([], [IDL.Text], ["query"]),
    version: IDL.Func([], [IDL.Text], ["query"]),
  });
};

// ============================================================
// HELPER: Create authenticated Menese actor
// ============================================================

export async function createMeneseActor(): Promise<ActorSubclass<any>> {
  const authClient = await AuthClient.create();

  const isAuth = await authClient.isAuthenticated();
  if (!isAuth) {
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
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: MENESE_CANISTER_ID,
  });
}
