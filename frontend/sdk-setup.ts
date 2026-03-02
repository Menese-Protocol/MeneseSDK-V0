// sdk-setup.ts — Shared config for all MeneseSDK frontend examples
//
// Copy this file into your project alongside any example.
// Full Candid interface:
//   https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai
//
// Two integration patterns:
//   - Full Execution: Frontend calls canister → canister handles RPC + signing + broadcast
//   - Sign-Only: Frontend fetches chain data → canister signs → frontend broadcasts (cheaper in cycles)

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
      Free: IDL.Null, Basic: IDL.Null, Developer: IDL.Null, Pro: IDL.Null, Enterprise: IDL.Null,
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
    getICPBalanceFor: IDL.Func([IDL.Principal], [ResultNat64], []),
    getICRC1BalanceFor: IDL.Func([IDL.Principal, IDL.Text], [ResultNat], []),
    getICRC1TokenInfo: IDL.Func([IDL.Text], [IDL.Variant({ ok: IDL.Record({ canisterId: IDL.Text, decimals: IDL.Nat8, fee: IDL.Nat, name: IDL.Text, symbol: IDL.Text }), err: IDL.Text })], []),
    getSupportedICPTokens: IDL.Func([], [IDL.Vec(IDL.Record({ name: IDL.Text, symbol: IDL.Text, canisterId: IDL.Text, type_: IDL.Text, category: IDL.Text }))], ["query"]),
    getMyTrc20Balance: IDL.Func([IDL.Text], [ResultNat], []),     // contractAddress

    // === SEND — ALL CHAINS (1 action) ===

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
    getICRC2Allowance: IDL.Func(
      [IDL.Principal, IDL.Principal, IDL.Text],  // owner, spender, ledgerCanisterId
      [IDL.Variant({ ok: IDL.Record({ allowance: IDL.Nat, expires_at: IDL.Opt(IDL.Nat64) }), err: IDL.Text })], []
    ),
    transferFromICRC2: IDL.Func(
      [IDL.Principal, IDL.Principal, IDL.Nat, IDL.Text],  // from, to, amount, ledgerCanisterId
      [IDL.Variant({ ok: IDL.Record({ amount: IDL.Nat, blockHeight: IDL.Nat, from: IDL.Principal, to: IDL.Principal, token: IDL.Text }), err: IDL.Text })], []
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

    // === SWAP — 6 DEXes (1 action) ===

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
        senderAddress: IDL.Text, amountIn: IDL.Nat, minAmountOut: IDL.Nat,
      }), err: IDL.Text })], []
    ),
    swapETHForUSDC: IDL.Func(
      [IDL.Nat, IDL.Nat, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({
        expectedTxHash: IDL.Text,
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

    // ICP DEX LP Management
    getICPLPPositions: IDL.Func([], [IDL.Vec(IDL.Record({
      poolId: IDL.Text, dex: DexId, token0: IDL.Text, token1: IDL.Text,
      token0Symbol: IDL.Text, token1Symbol: IDL.Text, liquidity: IDL.Nat,
      token0Amount: IDL.Nat, token1Amount: IDL.Nat,
      unclaimedFees: IDL.Opt(IDL.Tuple(IDL.Nat, IDL.Nat)),
      valueUsd: IDL.Opt(IDL.Nat),
    }))], []),
    addICPLiquidity: IDL.Func(
      [IDL.Record({ poolId: IDL.Text, dex: DexId, token0: IDL.Text, token1: IDL.Text, token0Amount: IDL.Nat, token1Amount: IDL.Nat, slippagePct: IDL.Float64 })],
      [IDL.Variant({ ok: IDL.Record({ success: IDL.Bool, lpTokens: IDL.Nat, token0Used: IDL.Nat, token1Used: IDL.Nat, poolId: IDL.Text, message: IDL.Text }), err: IDL.Text })], []
    ),
    removeICPLiquidity: IDL.Func(
      [IDL.Record({ poolId: IDL.Text, dex: DexId, lpTokens: IDL.Nat, slippagePct: IDL.Float64 })],
      [IDL.Variant({ ok: IDL.Record({ success: IDL.Bool, token0Received: IDL.Nat, token1Received: IDL.Nat, message: IDL.Text }), err: IDL.Text })], []
    ),
    getICPDexPools: IDL.Func([], [IDL.Vec(IDL.Record({
      poolId: IDL.Text, dex: DexId, token0: IDL.Text, token1: IDL.Text,
      token0Symbol: IDL.Text, token1Symbol: IDL.Text, reserve0: IDL.Nat,
      reserve1: IDL.Nat, fee: IDL.Nat, tvl: IDL.Opt(IDL.Nat),
      apr: IDL.Opt(IDL.Float64), volume24h: IDL.Opt(IDL.Nat),
    }))], []),
    getICPDexTokens: IDL.Func([], [IDL.Vec(IDL.Record({
      canisterId: IDL.Text, symbol: IDL.Text, name: IDL.Text,
      decimals: IDL.Nat8, fee: IDL.Nat,
      standard: IDL.Variant({ ICRC1: IDL.Null, ICRC2: IDL.Null, DIP20: IDL.Null }),
      logo: IDL.Opt(IDL.Text), category: IDL.Opt(IDL.Text),
      availableOn: IDL.Vec(DexId),
    }))], []),
    getICPRebalanceRecommendations: IDL.Func(
      [
        IDL.Record({ targetCategories: IDL.Vec(IDL.Text), riskTolerance: IDL.Text, minApy: IDL.Opt(IDL.Float64), maxImpermanentLoss: IDL.Opt(IDL.Float64), autoCompound: IDL.Bool }),
        IDL.Vec(IDL.Tuple(IDL.Text, IDL.Nat)),  // tokenBalances
        IDL.Opt(IDL.Vec(IDL.Record({ poolId: IDL.Text, dex: DexId, token0: IDL.Text, token1: IDL.Text, token0Symbol: IDL.Text, token1Symbol: IDL.Text, reserve0: IDL.Nat, reserve1: IDL.Nat, fee: IDL.Nat, tvl: IDL.Opt(IDL.Nat), apr: IDL.Opt(IDL.Float64), volume24h: IDL.Opt(IDL.Nat) }))),
      ],
      [IDL.Vec(IDL.Record({
        id: IDL.Text, action: IDL.Variant({ Swap: IDL.Null, AddLiquidity: IDL.Null, RemoveLiquidity: IDL.Null, Compound: IDL.Null }),
        fromToken: IDL.Text, toToken: IDL.Text, fromSymbol: IDL.Text, toSymbol: IDL.Text,
        amount: IDL.Nat, reason: IDL.Text, estimatedApy: IDL.Opt(IDL.Float64),
        currentApy: IDL.Opt(IDL.Float64),
        impermanentLossRisk: IDL.Variant({ Low: IDL.Null, Medium: IDL.Null, High: IDL.Null }),
        confidence: IDL.Float64, estimatedGasUsd: IDL.Opt(IDL.Float64),
      }))], []
    ),

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
      [IDL.Record({ inputAmount: IDL.Text, minOutputAmount: IDL.Text, outputAmount: IDL.Text, priceImpactPct: IDL.Text, routeInfo: IDL.Text, success: IDL.Bool })], []
    ),
    getICPDexQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Float64],
      [IDL.Record({
        best: IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, dex: DexId, fee: IDL.Nat, minAmountOut: IDL.Nat, success: IDL.Bool, tokenIn: IDL.Text, tokenOut: IDL.Text, poolId: IDL.Opt(IDL.Text), priceImpactPct: IDL.Text, rawData: IDL.Text, route: IDL.Vec(IDL.Text) }),
        icpswapQuote: IDL.Opt(IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, dex: DexId, fee: IDL.Nat, minAmountOut: IDL.Nat, success: IDL.Bool, tokenIn: IDL.Text, tokenOut: IDL.Text, poolId: IDL.Opt(IDL.Text), priceImpactPct: IDL.Text, rawData: IDL.Text, route: IDL.Vec(IDL.Text) })),
        kongswapQuote: IDL.Opt(IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, dex: DexId, fee: IDL.Nat, minAmountOut: IDL.Nat, success: IDL.Bool, tokenIn: IDL.Text, tokenOut: IDL.Text, poolId: IDL.Opt(IDL.Text), priceImpactPct: IDL.Text, rawData: IDL.Text, route: IDL.Vec(IDL.Text) })),
        timestamp: IDL.Int,
      })], []
    ),
    getSuiSwapQuote: IDL.Func(
      [SuiNetwork, IDL.Text, IDL.Text, IDL.Text, IDL.Nat64],
      [IDL.Opt(SwapQuote)], []
    ),
    getMinswapQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat64, IDL.Float64],
      [IDL.Variant({ ok: IDL.Record({ aggregator_fee: IDL.Text, amount_in: IDL.Text, amount_out: IDL.Text, avg_price_impact: IDL.Text, min_amount_out: IDL.Text, paths_json: IDL.Text, rawJson: IDL.Text, success: IDL.Bool, token_in: IDL.Text, token_out: IDL.Text, total_dex_fee: IDL.Text, total_lp_fee: IDL.Text }), err: IDL.Text })], []
    ),
    getTokenQuote: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({ amountIn: IDL.Nat, amountOut: IDL.Nat, fromToken: IDL.Text, toToken: IDL.Text, path: IDL.Vec(IDL.Text) }), err: IDL.Text })], []
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
      [IDL.Variant({ ok: IDL.Record({
        amount: IDL.Nat, currency: IDL.Text, id: IDL.Nat, ledgerCanisterId: IDL.Text,
        timestamp: IDL.Int, usdValueMicroUsd: IDL.Nat, user: IDL.Principal,
      }), err: IDL.Text })], []
    ),
    purchaseGatewayPackage: IDL.Func(
      [IDL.Variant({ Free: IDL.Null, Basic: IDL.Null, Developer: IDL.Null, Pro: IDL.Null, Enterprise: IDL.Null }), IDL.Text],
      [IDL.Variant({ ok: IDL.Record({
        actionsRemaining: IDL.Nat, actionsUsed: IDL.Nat, createdAt: IDL.Int,
        creditsMicroUsd: IDL.Nat, subscriptionExpiry: IDL.Opt(IDL.Int),
        tier: IDL.Variant({ Free: IDL.Null, Basic: IDL.Null, Developer: IDL.Null, Pro: IDL.Null, Enterprise: IDL.Null }),
        totalDepositedMicroUsd: IDL.Nat,
      }), err: IDL.Text })], []
    ),

    // === BATCH ENDPOINTS (FREE) ===
    getAllAddresses: IDL.Func([], [IDL.Record({
      aptos: AptosAddressInfo, bitcoin: AddressInfo, cardano: CardanoAddressInfo,
      evm: EvmAddressInfo, litecoin: AddressInfo, near: PubKeyInfo,
      solana: SolanaAddressInfo, sui: SuiAddressInfo, thorchain: AddressInfo,
      ton: TonAddressInfo, tron: TronAddressInfo, xrp: XrpAddressInfo,
    })], []),
    getAllBalances: IDL.Func([], [IDL.Record({
      aptos: IDL.Variant({ ok: IDL.Nat64, err: IDL.Text }),
      bitcoin: IDL.Nat64,
      cardano: IDL.Variant({ ok: IDL.Nat64, err: IDL.Text }),
      icp: IDL.Variant({ ok: IDL.Nat64, err: IDL.Text }),
      litecoin: IDL.Nat64,
      near: IDL.Nat,
      solana: IDL.Variant({ ok: IDL.Nat64, err: IDL.Text }),
      thorchain: IDL.Vec(IDL.Record({ amount: IDL.Nat, denom: IDL.Text })),
      ton: IDL.Variant({ ok: IDL.Nat64, err: IDL.Text }),
      xrp: Result,
    })], []),

    // === DEFI — AAVE V3 (1 action) ===
    aaveSupplyEth: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],  // ethAmountWei, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({ ethSupplied: IDL.Nat, nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text, txHash: IDL.Text }), err: IDL.Text })], []
    ),
    aaveWithdrawEth: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],  // amountWei, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({ approvalTxHash: IDL.Opt(IDL.Text), ethWithdrawn: IDL.Nat, nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text, txHash: IDL.Text }), err: IDL.Text })], []
    ),
    aaveSupplyToken: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],  // tokenAddress, amount, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({ amountSupplied: IDL.Nat, approvalTxHash: IDL.Opt(IDL.Text), nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text, tokenAddress: IDL.Text, txHash: IDL.Text }), err: IDL.Text })], []
    ),
    aaveWithdrawToken: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],  // tokenAddress, amount, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({ amountWithdrawn: IDL.Nat, nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text, tokenAddress: IDL.Text, txHash: IDL.Text }), err: IDL.Text })], []
    ),
    getAWethBalance: IDL.Func([IDL.Text, IDL.Text], [ResultNat], []),  // user, rpcEndpoint
    getATokenBalance: IDL.Func([IDL.Text, IDL.Text, IDL.Text], [ResultNat], []),  // aTokenAddress, user, rpcEndpoint

    // === DEFI — LIDO STAKING (1 action) ===
    stakeEthForStEth: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],  // ethAmountWei, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({ ethStaked: IDL.Nat, nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text, txHash: IDL.Text }), err: IDL.Text })], []
    ),
    wrapStEth: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],  // amountStEth, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({ approvalTxHash: IDL.Opt(IDL.Text), nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text, stEthWrapped: IDL.Nat, txHash: IDL.Text }), err: IDL.Text })], []
    ),
    unwrapWstEth: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],  // amountWstEth, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({ nonce: IDL.Nat, note: IDL.Text, senderAddress: IDL.Text, txHash: IDL.Text, wstEthUnwrapped: IDL.Nat }), err: IDL.Text })], []
    ),
    getStEthBalance: IDL.Func([IDL.Text, IDL.Text], [ResultNat], []),  // user, rpcEndpoint
    getWstEthBalance: IDL.Func([IDL.Text, IDL.Text], [ResultNat], []),  // user, rpcEndpoint

    // === DEFI — UNISWAP V3 LIQUIDITY (1 action) ===
    addLiquidityETH: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
      // tokenSymbol, amountTokenDesired, amountETHDesired, slippageBps, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({
        txHash: IDL.Text, senderAddress: IDL.Text, nonce: IDL.Nat,
        tokenAddress: IDL.Text, amountTokenDesired: IDL.Nat, amountETHDesired: IDL.Nat,
        amountTokenMin: IDL.Nat, amountETHMin: IDL.Nat,
        approvalTxHash: IDL.Opt(IDL.Text), note: IDL.Text,
      }), err: IDL.Text })], []
    ),
    addLiquidity: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
      // tokenASymbol, tokenBSymbol, amountADesired, amountBDesired, slippageBps, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({
        txHash: IDL.Text, senderAddress: IDL.Text, nonce: IDL.Nat,
        tokenA: IDL.Text, tokenB: IDL.Text,
        amountADesired: IDL.Nat, amountBDesired: IDL.Nat,
        amountAMin: IDL.Nat, amountBMin: IDL.Nat,
        approvalTxHashA: IDL.Opt(IDL.Text), approvalTxHashB: IDL.Opt(IDL.Text), note: IDL.Text,
      }), err: IDL.Text })], []
    ),
    removeLiquidityETH: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Nat, IDL.Bool, IDL.Text, IDL.Opt(IDL.Text)],
      // tokenSymbol, lpTokenAmount, slippageBps, useFeeOnTransfer, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({
        txHash: IDL.Text, senderAddress: IDL.Text, nonce: IDL.Nat,
        tokenAddress: IDL.Text, lpTokensBurned: IDL.Nat,
        minTokenOut: IDL.Nat, minETHOut: IDL.Nat,
        approvalTxHash: IDL.Opt(IDL.Text), note: IDL.Text,
      }), err: IDL.Text })], []
    ),
    removeLiquidity: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat, IDL.Text, IDL.Opt(IDL.Text)],
      // tokenASymbol, tokenBSymbol, lpTokenAmount, slippageBps, rpcEndpoint, quoteId
      [IDL.Variant({ ok: IDL.Record({
        txHash: IDL.Text, senderAddress: IDL.Text, nonce: IDL.Nat,
        tokenA: IDL.Text, tokenB: IDL.Text, lpTokensBurned: IDL.Nat,
        minAmountAOut: IDL.Nat, minAmountBOut: IDL.Nat,
        approvalTxHash: IDL.Opt(IDL.Text), note: IDL.Text,
      }), err: IDL.Text })], []
    ),
    getPairAddress: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],  // tokenA, tokenB, rpcEndpoint
      [IDL.Variant({ ok: IDL.Record({ tokenA: IDL.Text, tokenB: IDL.Text, pairAddress: IDL.Text }), err: IDL.Text })], []
    ),
    getPoolReserves: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Text],  // tokenA, tokenB, rpcEndpoint
      [IDL.Variant({ ok: IDL.Record({ pairAddress: IDL.Text, reserve0: IDL.Nat, reserve1: IDL.Nat, token0: IDL.Text, token1: IDL.Text, blockTimestampLast: IDL.Nat }), err: IDL.Text })], []
    ),

    // === CUSTOM EVM CONTRACTS (1 action write / FREE read) ===
    callEvmContractRead: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Text],  // contract, functionSelector, argsHexes, rpcEndpoint
      [Result], []
    ),
    callEvmContractWrite: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Vec(IDL.Text), IDL.Text, IDL.Nat, IDL.Nat, IDL.Opt(IDL.Text)],
      // contract, functionSelector, argsHexes, rpcEndpoint, chainId, value, quoteId
      [IDL.Variant({ ok: SendResultEvm, err: IDL.Text })], []
    ),

    // === MULTI-HOP SWAP (1 action) ===
    swapTokensMultiHop: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Nat, IDL.Bool, IDL.Nat, IDL.Text],
      // fromSymbol, toSymbol, amountIn, slippageBps, useFeeOnTransfer, chainId, rpcEndpoint
      [IDL.Variant({ ok: IDL.Record({
        amountIn: IDL.Nat, approvalTxHash: IDL.Opt(IDL.Text), expectedTxHash: IDL.Text,
        isDirect: IDL.Bool, minAmountOut: IDL.Nat, nonce: IDL.Nat, note: IDL.Text,
        path: IDL.Vec(IDL.Text), pathSymbols: IDL.Vec(IDL.Text), senderAddress: IDL.Text,
      }), err: IDL.Text })], []
    ),

    // === ADDITIONAL QUOTES (FREE) ===
    getTokenQuoteMultiHop: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat, IDL.Text],  // fromSymbol, toSymbol, amountIn, rpcEndpoint
      [IDL.Variant({ ok: IDL.Record({
        amountIn: IDL.Nat, amountOut: IDL.Nat, fromToken: IDL.Text, toToken: IDL.Text,
        isDirect: IDL.Bool, path: IDL.Vec(IDL.Text), pathSymbols: IDL.Vec(IDL.Text), routeNote: IDL.Text,
      }), err: IDL.Text })], []
    ),
    xrpFindPaths: IDL.Func(
      [TokenAmount, IDL.Vec(TokenAmount)],  // destinationAmount, sourceCurrencies
      [IDL.Record({
        destinationAmount: TokenAmount, message: IDL.Text, paths: IDL.Text,
        sourceAmount: TokenAmount, success: IDL.Bool,
      })], []
    ),

    // === SIGN-ONLY ENDPOINTS (1 action each) ===
    // Frontend fetches chain data (blockhash, UTXOs, gas) → calls these → broadcasts.
    // No HTTP outcalls by the canister — cheaper in cycles.

    // SOL sign-only
    signSolTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Text],  // toAddress, lamports, blockhashBase58
      [IDL.Record({
        signedTxBase64: IDL.Text, txMessage: IDL.Vec(IDL.Nat8),
        signature: IDL.Vec(IDL.Nat8), publicKey: IDL.Vec(IDL.Nat8),
      })], []
    ),
    signSolSwapTxsRelayer: IDL.Func(
      [IDL.Vec(IDL.Text)],  // txBase64Array
      [IDL.Vec(IDL.Record({ signedTxBase64: IDL.Text, signature: IDL.Vec(IDL.Nat8) }))], []
    ),

    // EVM sign-only
    buildAndSignEvmTxWithData: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Vec(IDL.Nat8), IDL.Nat, IDL.Nat, IDL.Nat, IDL.Nat],
      // to, value, data, nonce, gasLimit, gasPrice, chainId
      [IDL.Record({
        rawTxHex_v0: IDL.Text, rawTxHex_v1: IDL.Text,
        txHash: IDL.Text, signature: IDL.Text,
      })], []
    ),

    // NEAR sign-only
    signNearTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Nat, IDL.Nat64, IDL.Vec(IDL.Nat8)],  // recipientId, amountYocto, nonce, blockHash
      [IDL.Record({
        signedTxBytes: IDL.Vec(IDL.Nat8), txHash: IDL.Vec(IDL.Nat8), senderAccountId: IDL.Text,
      })], []
    ),

    // Aptos sign-only
    signAptosTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Nat64, IDL.Nat8, IDL.Nat64],
      // toAddress, amount, sequenceNumber, chainId, expirationTimestampSecs
      [IDL.Record({
        signedTxBcs: IDL.Vec(IDL.Nat8), txHash: IDL.Vec(IDL.Nat8), senderAddress: IDL.Text,
      })], []
    ),

    // TON sign-only
    signTonTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Nat32, IDL.Bool, IDL.Opt(IDL.Text), IDL.Nat32, IDL.Text],
      // toAddress, amountNanoton, seqno, bounce, comment, timeoutSeconds, accountState
      [IDL.Record({ bocBase64: IDL.Text, senderAddress: IDL.Text, payloadHash: IDL.Vec(IDL.Nat8) })], []
    ),

    // SUI sign-only
    signSuiTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Text, IDL.Nat64, IDL.Text],
      // recipientAddress, amount, gasCoinId, gasCoinVersion, gasCoinDigest
      [IDL.Record({
        txBytesBase64: IDL.Text, signatureBase64: IDL.Text, senderAddress: IDL.Text,
      })], []
    ),

    // Cardano sign-only
    signCardanoTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Nat64,
       IDL.Vec(IDL.Record({ tx_hash: IDL.Text, tx_index: IDL.Nat64, value: IDL.Nat64 })),
       IDL.Text],  // recipient, amountLovelace, utxos, senderBech32
      [IDL.Variant({
        ok: IDL.Record({ signedTxCbor: IDL.Vec(IDL.Nat8), txHash: IDL.Vec(IDL.Nat8) }),
        err: IDL.Text,
      })], []
    ),

    // XRP sign-only
    signXrpTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Text, IDL.Nat32, IDL.Nat32, IDL.Nat64, IDL.Opt(IDL.Nat32)],
      // destAddress, amountXrp, sequence, lastLedgerSeq, fee, destinationTag
      [IDL.Record({
        signedTxHex: IDL.Text, txHash: IDL.Text,
        senderAddress: IDL.Text, publicKeyHex: IDL.Text,
      })], []
    ),

    // TRON sign-only
    signTrxTransferRelayer: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Vec(IDL.Nat8), IDL.Vec(IDL.Nat8), IDL.Int64, IDL.Int64],
      // toAddress, amountSun, refBlockBytes, refBlockHash, expiration, timestamp
      [IDL.Variant({
        ok: IDL.Record({
          txHex1b: IDL.Text, txHex1c: IDL.Text, txID: IDL.Text, senderAddress: IDL.Text,
        }),
        err: IDL.Text,
      })], []
    ),

    // === STRATEGY ENGINE (1 action per creation, 1 per execution) ===
    addStrategyRule: IDL.Func(
      [IDL.Record({
        id: IDL.Nat,
        positionId: IDL.Nat,
        ruleType: IDL.Variant({
          TakeProfit: IDL.Null, StopLoss: IDL.Null, DCA: IDL.Null,
          Rebalance: IDL.Null, Scheduled: IDL.Null, APYMigration: IDL.Null,
          LiquidityProvision: IDL.Null, VolatilityTrigger: IDL.Null,
        }),
        triggerPrice: IDL.Nat64,
        sizePct: IDL.Nat,
        swapAmountLamports: IDL.Opt(IDL.Nat64),
        swapAmountWei: IDL.Opt(IDL.Nat),
        chainType: IDL.Variant({ Solana: IDL.Null, Evm: IDL.Null }),
        status: IDL.Variant({
          Draft: IDL.Null, Active: IDL.Null, Paused: IDL.Null,
          Executing: IDL.Null, Executed: IDL.Null, Cancelled: IDL.Null,
          Failed: IDL.Null, Ready: IDL.Null, Confirmed: IDL.Null,
        }),
        createdAt: IDL.Int,
        dcaConfig: IDL.Opt(IDL.Record({
          amountPerBuy: IDL.Nat, executedBuys: IDL.Nat, intervalSeconds: IDL.Nat,
          nextExecutionTime: IDL.Int, tokenIn: IDL.Text, tokenOut: IDL.Text, totalBuys: IDL.Nat,
        })),
        lpConfig: IDL.Opt(IDL.Record({
          cooldownHours: IDL.Nat, exitOnHighVolatility: IDL.Bool, maxPositionSizePct: IDL.Float64,
          maxVolatility: IDL.Float64, minApy: IDL.Float64, minTvlUSD: IDL.Float64,
          poolAddress: IDL.Text, rebalanceThreshold: IDL.Float64,
        })),
        scheduledConfig: IDL.Opt(IDL.Record({
          action: IDL.Variant({
            AddLP: IDL.Record({ amountUSD: IDL.Nat, poolAddress: IDL.Text }),
            RemoveLP: IDL.Record({ percentage: IDL.Nat, poolAddress: IDL.Text }),
            Send: IDL.Record({ amount: IDL.Nat, recipient: IDL.Text, token: IDL.Text }),
            Swap: IDL.Record({ amountIn: IDL.Nat, tokenIn: IDL.Text, tokenOut: IDL.Text }),
          }),
          cronPattern: IDL.Text, executedCount: IDL.Nat,
          nextExecutionTime: IDL.Int, repeatCount: IDL.Nat,
        })),
        apyMigrationConfig: IDL.Opt(IDL.Record({
          cooldownHours: IDL.Nat, currentPoolAddress: IDL.Text, lastMigrated: IDL.Int,
          maxMigrationCostPct: IDL.Float64, minApyDelta: IDL.Float64, targetPools: IDL.Vec(IDL.Text),
        })),
        volatilityConfig: IDL.Opt(IDL.Record({
          action: IDL.Variant({
            Alert: IDL.Null,
            Buy: IDL.Record({ amountUSD: IDL.Nat }),
            ExitLP: IDL.Record({ poolAddress: IDL.Text }),
            Sell: IDL.Record({ percentage: IDL.Nat }),
          }),
          cooldownMinutes: IDL.Nat,
          direction: IDL.Variant({ Above: IDL.Null, Below: IDL.Null }),
          lastTriggered: IDL.Int, tokenSymbol: IDL.Text, triggerStdDev: IDL.Float64,
        })),
      })],
      [IDL.Variant({ ok: IDL.Nat, err: IDL.Text })], []
    ),
    getMyStrategyRules: IDL.Func(
      [],
      [IDL.Vec(IDL.Record({
        id: IDL.Nat,
        positionId: IDL.Nat,
        ruleType: IDL.Variant({
          TakeProfit: IDL.Null, StopLoss: IDL.Null, DCA: IDL.Null,
          Rebalance: IDL.Null, Scheduled: IDL.Null, APYMigration: IDL.Null,
          LiquidityProvision: IDL.Null, VolatilityTrigger: IDL.Null,
        }),
        triggerPrice: IDL.Nat64,
        sizePct: IDL.Nat,
        swapAmountLamports: IDL.Opt(IDL.Nat64),
        swapAmountWei: IDL.Opt(IDL.Nat),
        chainType: IDL.Variant({ Solana: IDL.Null, Evm: IDL.Null }),
        status: IDL.Variant({
          Draft: IDL.Null, Active: IDL.Null, Paused: IDL.Null,
          Executing: IDL.Null, Executed: IDL.Null, Cancelled: IDL.Null,
          Failed: IDL.Null, Ready: IDL.Null, Confirmed: IDL.Null,
        }),
        createdAt: IDL.Int,
        dcaConfig: IDL.Opt(IDL.Record({
          amountPerBuy: IDL.Nat, executedBuys: IDL.Nat, intervalSeconds: IDL.Nat,
          nextExecutionTime: IDL.Int, tokenIn: IDL.Text, tokenOut: IDL.Text, totalBuys: IDL.Nat,
        })),
        lpConfig: IDL.Opt(IDL.Record({
          cooldownHours: IDL.Nat, exitOnHighVolatility: IDL.Bool, maxPositionSizePct: IDL.Float64,
          maxVolatility: IDL.Float64, minApy: IDL.Float64, minTvlUSD: IDL.Float64,
          poolAddress: IDL.Text, rebalanceThreshold: IDL.Float64,
        })),
        scheduledConfig: IDL.Opt(IDL.Record({
          action: IDL.Variant({
            AddLP: IDL.Record({ amountUSD: IDL.Nat, poolAddress: IDL.Text }),
            RemoveLP: IDL.Record({ percentage: IDL.Nat, poolAddress: IDL.Text }),
            Send: IDL.Record({ amount: IDL.Nat, recipient: IDL.Text, token: IDL.Text }),
            Swap: IDL.Record({ amountIn: IDL.Nat, tokenIn: IDL.Text, tokenOut: IDL.Text }),
          }),
          cronPattern: IDL.Text, executedCount: IDL.Nat,
          nextExecutionTime: IDL.Int, repeatCount: IDL.Nat,
        })),
        apyMigrationConfig: IDL.Opt(IDL.Record({
          cooldownHours: IDL.Nat, currentPoolAddress: IDL.Text, lastMigrated: IDL.Int,
          maxMigrationCostPct: IDL.Float64, minApyDelta: IDL.Float64, targetPools: IDL.Vec(IDL.Text),
        })),
        volatilityConfig: IDL.Opt(IDL.Record({
          action: IDL.Variant({
            Alert: IDL.Null,
            Buy: IDL.Record({ amountUSD: IDL.Nat }),
            ExitLP: IDL.Record({ poolAddress: IDL.Text }),
            Sell: IDL.Record({ percentage: IDL.Nat }),
          }),
          cooldownMinutes: IDL.Nat,
          direction: IDL.Variant({ Above: IDL.Null, Below: IDL.Null }),
          lastTriggered: IDL.Int, tokenSymbol: IDL.Text, triggerStdDev: IDL.Float64,
        })),
      }))], []
    ),
    updateStrategyRuleStatus: IDL.Func(
      [IDL.Nat, IDL.Variant({
        Draft: IDL.Null, Active: IDL.Null, Paused: IDL.Null,
        Executing: IDL.Null, Executed: IDL.Null, Cancelled: IDL.Null,
        Failed: IDL.Null, Ready: IDL.Null, Confirmed: IDL.Null,
      })],
      [IDL.Variant({ ok: IDL.Null, err: IDL.Text })], []
    ),
    deleteStrategyRule: IDL.Func(
      [IDL.Nat],
      [IDL.Variant({ ok: IDL.Null, err: IDL.Text })], []
    ),
    getStrategyLogs: IDL.Func(
      [],
      [IDL.Vec(IDL.Record({
        error: IDL.Opt(IDL.Text),
        intent_hash: IDL.Text,
        rule_id: IDL.Text,
        stage: IDL.Variant({
          ACTIVATED: IDL.Null, ADDRESS_GENERATED: IDL.Null, BROADCASTING: IDL.Null,
          BUILT_TX: IDL.Null, COMPLETED: IDL.Null, ESTIMATING_FEE: IDL.Null,
          FAILED: IDL.Null, FETCHING_UTXOS: IDL.Null, INITIATED: IDL.Null,
          PENDING: IDL.Null, QUOTE_FETCHED: IDL.Null, RECEIVED_DEPOSIT: IDL.Null,
          SENT: IDL.Null, SIGNING: IDL.Null, TRIGGERED: IDL.Null, VALIDATED: IDL.Null,
        }),
        ts: IDL.Int,
        tx_id: IDL.Opt(IDL.Text),
      }))], ["query"]
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

// ============================================================
// HELPER: Broadcast signed transactions
// ============================================================
// After calling sign-only endpoints, use these to broadcast
// the signed transaction to the target chain via your own RPCs.

export async function broadcastSolana(
  signedTxBase64: string,
  rpcUrl: string = "https://api.mainnet-beta.solana.com",
): Promise<string> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "sendTransaction",
      params: [signedTxBase64, { encoding: "base64", skipPreflight: false }],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`Solana RPC error: ${json.error.message}`);
  return json.result; // tx signature
}

export async function broadcastEvm(
  signedTxHex: string,
  rpcUrl: string,
): Promise<string> {
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "eth_sendRawTransaction",
      params: [signedTxHex.startsWith("0x") ? signedTxHex : `0x${signedTxHex}`],
    }),
  });
  const json = await res.json();
  if (json.error) throw new Error(`EVM RPC error: ${json.error.message}`);
  return json.result; // tx hash
}
