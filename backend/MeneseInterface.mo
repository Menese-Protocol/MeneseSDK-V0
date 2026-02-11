/// MeneseInterface.mo — Remote actor type for calling MeneseSDK
///
/// Import this file into your canister project, OR add MeneseSDK as a
/// remote canister in your dfx.json:
///
///   "menese": {
///     "type": "custom",
///     "candid": "https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai",
///     "remote": { "id": { "ic": "urs2a-ziaaa-aaaad-aembq-cai" } }
///   }
///
/// Full Candid interface:
///   https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai

import Result "mo:base/Result";
import Principal "mo:base/Principal";

module {

  // ============================================================
  // ADDRESS TYPES (exact match to backend.did)
  // ============================================================

  /// Solana — field: `address` (base58)
  public type SolanaAddressInfo = {
    address : Text;
    publicKeyHex : Text;
    publicKeyBytes : [Nat8];
  };

  /// EVM (ETH/ARB/BASE/POLY/BNB/OP) — field: `evmAddress` (0x...)
  public type EvmAddressInfo = {
    evmAddress : Text;
    publicKeyHex : Text;
  };

  /// Bitcoin/Litecoin — field: `bech32Address` (bc1.../ltc1...)
  public type AddressInfo = {
    bech32Address : Text;
    hash160Hex : Text;
    pubKeyHex : Text;
  };

  /// Cardano — field: `bech32Address` (addr1...)
  public type CardanoAddressInfo = {
    bech32Address : Text;
    addressBytesHex : Text;
    paymentPubKeyHex : Text;
    stakePubKeyHex : Text;
  };

  /// SUI — field: `suiAddress` (0x...)
  public type SuiAddressInfo = {
    suiAddress : Text;
    publicKeyHex : Text;
    publicKeyBytes : [Nat8];
  };

  /// XRP — field: `classicAddress` (r...)
  public type XrpAddressInfo = {
    classicAddress : Text;
    accountIdHex : Text;
    accountIdBytes : [Nat8];
    publicKeyHex : Text;
  };

  /// TON — fields: `bounceable`, `nonBounceable` (not "address")
  public type TonAddressInfo = {
    bounceable : Text;
    nonBounceable : Text;
    rawAddress : Text;
    publicKeyHex : Text;
    stateInitBocBase64 : Text;
  };

  /// Tron — field: `base58Address` (T...)
  public type TronAddressInfo = {
    base58Address : Text;
    hexAddress : Text;
    publicKeyHex : Text;
  };

  /// Aptos — field: `address` (0x...)
  public type AptosAddressInfo = {
    address : Text;
    publicKeyHex : Text;
  };

  /// Near — field: `implicitAccountId`
  public type PubKeyInfo = {
    implicitAccountId : Text;
    publicKeyBase58 : Text;
    publicKeyHex : Text;
  };

  /// CloakCoin — field: `base58Address`
  public type CloakAddressInfo = {
    base58Address : Text;
    addressBytesHex : Text;
    hash160Hex : Text;
    pubKeyHex : Text;
  };

  // ============================================================
  // SEND RESULT TYPES (exact match to backend.did)
  // ============================================================

  /// Generic send result (Solana, SUI, Aptos, Near, Thor)
  public type SendResult = {
    txHash : Text;
    senderAddress : Text;
    note : Text;
  };

  /// Bitcoin/Litecoin send result
  public type SendResultBtcLtc = {
    txid : Text;
    amount : Nat64;
    fee : Nat64;
    senderAddress : Text;
    recipientAddress : Text;
    note : Text;
  };

  /// ICP send result
  public type SendICPResult = {
    amount : Nat64;
    blockHeight : Nat64;
    fee : Nat64;
    from : Principal;
    to : Principal;
  };

  /// ICRC-1 send result
  public type SendICRC1Result = {
    amount : Nat;
    blockHeight : Nat;
    fee : Nat;
    to : Principal;
    token : Text;
  };

  /// EVM send result
  public type SendResultEvm = {
    expectedTxHash : Text;
    nonce : Nat;
    senderAddress : Text;
    note : Text;
  };

  /// TON send result
  public type SendResultTon = {
    txHash : Text;
    bocBase64 : Text;
    senderAddress : Text;
    success : Bool;
    error : ?Text;
  };

  /// XRP send result
  public type SendResultXrp = {
    txHash : Text;
    explorerUrl : Text;
    message : Text;
    success : Bool;
    sequence : Nat32;
    ledgerUsed : Nat32;
  };

  /// CloakCoin send result
  public type SendResultCloak = {
    txHash : Text;
    txHex : Text;
    changeValue : Nat64;
  };

  /// Solana SPL transfer result
  public type TransferAndSendResult = {
    txSignature : Text;
    serializedTxBase64 : Text;
    blockhash : Text;
  };

  // ============================================================
  // SWAP / QUOTE TYPES
  // ============================================================

  public type DexId = {
    #ICPSwap;
    #KongSwap;
  };

  /// ICP DEX swap request
  public type SwapRequest = {
    tokenIn : Text;
    tokenOut : Text;
    amountIn : Nat;
    minAmountOut : Nat;
    slippagePct : Float;
    preferredDex : ?DexId;
  };

  /// ICP DEX swap result
  public type SwapResultIcp = {
    amountIn : Nat;
    amountOut : Nat;
    dex : DexId;
    fee : Nat;
    message : Text;
    success : Bool;
    txId : Nat;
  };

  /// SUI (Cetus) swap result
  public type SwapResultSui = {
    success : Bool;
    txDigest : Text;
    amountOut : Text;
    error : ?Text;
  };

  /// XRP swap result
  public type SwapResultXrp = {
    success : Bool;
    txHash : Text;
    explorerUrl : Text;
    message : Text;
    sourceAmount : Text;
    destinationAmount : Text;
  };

  public type TokenAmount = {
    currency : Text;
    issuer : Text;
    value : Text;
  };

  /// Raydium API swap result
  public type RaydiumApiSwapResult = {
    #ok : { txHash : Text };
    #err : Text;
  };

  /// SUI swap quote
  public type SwapQuote = {
    amountIn : Text;
    amountOut : Text;
    estimatedGas : Nat64;
    priceImpact : Float;
    routerData : Text;
  };

  /// ICP DEX aggregated quote
  public type AggregatedQuote = {
    best : SwapQuoteIcp;
    icpswapQuote : ?SwapQuoteIcp;
    kongswapQuote : ?SwapQuoteIcp;
  };

  public type SwapQuoteIcp = {
    amountIn : Nat;
    amountOut : Nat;
    dex : DexId;
    fee : Nat;
    minAmountOut : Nat;
    poolId : ?Text;
    priceImpactPct : Text;
    rawData : Text;
    route : [Text];
    success : Bool;
    tokenIn : Text;
    tokenOut : Text;
  };

  // ============================================================
  // ATA / SETUP TYPES
  // ============================================================

  public type CreateAtaResult = {
    ata : Text;
    mint : Text;
    owner : Text;
    txSignature : Text;
    blockhash : Text;
  };

  public type TrustSetResult = {
    success : Bool;
    txHash : Text;
    explorerUrl : Text;
    message : Text;
  };

  // ============================================================
  // AUTOMATION / STRATEGY TYPES
  // ============================================================

  public type ChainType = {
    #EVM;
    #Solana;
    #ICP;
  };

  public type RuleType = {
    #DCA;
    #StopLoss;
    #TakeProfit;
    #Rebalance;
    #Scheduled;
    #APYMigration;
    #LiquidityProvision;
    #VolatilityTrigger;
  };

  public type RuleStatus = {
    #Active;
    #Paused;
    #Cancelled;
    #Executed;
    #Executing;
    #Failed;
    #Draft;
    #Confirmed;
    #Ready;
  };

  public type DCAConfig = {
    amountPerInterval : Nat;
    currentInterval : Nat;
    intervalSeconds : Int;
    lastExecutedAt : Int;
    maxIntervals : Nat;
    targetToken : Text;
    totalSpent : Nat;
  };

  public type Rule = {
    id : Nat;
    ruleType : RuleType;
    status : RuleStatus;
    chainType : ChainType;
    triggerPrice : Nat64;
    sizePct : Nat;
    positionId : Nat;
    createdAt : Int;
    dcaConfig : ?DCAConfig;
    lpConfig : ?LPConfig;
    scheduledConfig : ?ScheduledConfig;
    apyMigrationConfig : ?APYMigrationConfig;
    volatilityConfig : ?VolatilityConfig;
    swapAmountLamports : ?Nat64;
    swapAmountWei : ?Nat;
  };

  // Simplified optional config types — fill in if needed
  public type LPConfig = {};
  public type ScheduledConfig = {};
  public type APYMigrationConfig = {};
  public type VolatilityConfig = {};

  public type ExecutionLog = {
    action : Text;
    error : ?Text;
    executedAt : Int;
    result : Text;
    ruleId : Nat;
    success : Bool;
  };

  // ============================================================
  // BILLING / DEVELOPER TYPES
  // ============================================================

  public type Tier = {
    #Free;
    #Developer;
    #Pro;
    #Enterprise;
  };

  public type UserAccount = {
    creditsMicroUsd : Nat;
    tier : Tier;
    actionsRemaining : Nat;
    subscriptionExpiry : ?Int;
    actionsUsed : Nat;
    totalDepositedMicroUsd : Nat;
    createdAt : Int;
  };

  public type DeveloperAccountV3 = {
    owner : Principal;
    canisters : [Principal];
    appName : Text;
    developerKey : Text;
    createdAt : Int;
  };

  // ============================================================
  // BRIDGE TYPES
  // ============================================================

  public type OutputToken = {
    #NativeSOL;
    #SPL : Text;
    #USDC;
  };

  // ============================================================
  // REMOTE ACTOR TYPE — all public functions
  // ============================================================

  public type MeneseSDK = actor {

    // ─── ADDRESSES (FREE) ───────────────────────────────────
    getMySolanaAddress : shared () -> async SolanaAddressInfo;
    getMyEvmAddress : shared () -> async EvmAddressInfo;
    getMyBitcoinAddress : shared () -> async AddressInfo;
    getMyLitecoinAddress : shared () -> async AddressInfo;
    getMyCardanoAddress : shared () -> async CardanoAddressInfo;
    getMySuiAddress : shared () -> async SuiAddressInfo;
    getMyXrpAddress : shared () -> async XrpAddressInfo;
    getMyTonAddress : shared () -> async TonAddressInfo;
    getTronAddress : shared () -> async TronAddressInfo;
    getMyAptosAddress : shared () -> async AptosAddressInfo;
    getMyNearAddress : shared () -> async PubKeyInfo;
    getMyCloakAddress : shared () -> async CloakAddressInfo;
    getMyThorAddress : shared () -> async AddressInfo;
    getMySolanaAta : shared (Text) -> async Text;

    // ─── BALANCES (FREE) ────────────────────────────────────
    getMySolanaBalance : shared () -> async Result.Result<Nat64, Text>;
    getMyEvmBalance : shared (rpcEndpoint : Text) -> async Result.Result<Nat, Text>;
    getICPBalance : shared () -> async Result.Result<Nat64, Text>;
    getBitcoinBalance : shared () -> async Nat64;
    getLitecoinBalance : shared () -> async Nat64;
    getMyXrpBalance : shared () -> async Result.Result<Text, Text>;
    getMySuiBalance : shared () -> async Nat64;
    getMyTonBalance : shared () -> async Result.Result<Nat64, Text>;
    getCardanoBalance : shared () -> async Result.Result<Nat64, Text>;
    getAptosBalance : shared () -> async Result.Result<Nat64, Text>;
    getMyNearBalance : shared () -> async Nat;
    getThorBalance : shared () -> async [{ amount : Nat; denom : Text }];
    getCloakBalance : shared () -> async Result.Result<{ address : Text; balance : Nat64; utxoCount : Nat }, Text>;
    getTrxBalance : shared (Text) -> async Result.Result<Nat64, Text>;
    getICRC1Balance : shared (Text) -> async Result.Result<Nat, Text>;
    getMyTrc20Balance : shared (Text) -> async Result.Result<Nat, Text>;

    // ─── SEND — ALL CHAINS ($0.05) ─────────────────────────

    // Solana
    sendSolTransaction : shared (toAddress : Text, lamports : Nat64) -> async Result.Result<Text, Text>;
    transferSplToken : shared (amount : Nat64, sourceAta : Text, destinationAta : Text) -> async TransferAndSendResult;

    // EVM (ETH/ARB/BASE/POLY/BNB/OP) — pass rpcEndpoint + chainId
    sendEvmNativeTokenAutonomous : shared (to : Text, value : Nat, rpcEndpoint : Text, chainId : Nat, quoteId : ?Text) -> async Result.Result<SendResultEvm, Text>;

    // ICP
    sendICP : shared (to : Principal, amount : Nat64) -> async Result.Result<SendICPResult, Text>;
    sendICRC1 : shared (to : Principal, amount : Nat, ledgerCanisterId : Text) -> async Result.Result<SendICRC1Result, Text>;
    transferFromICRC2 : shared (from : Principal, to : Principal, amount : Nat, ledgerCanisterId : Text) -> async Result.Result<{ amount : Nat; blockHeight : Nat; from : Principal; to : Principal; token : Text }, Text>;
    approveICRC2 : shared (spender : Principal, amount : Nat, expiresAt : ?Nat64, ledgerCanisterId : Text) -> async Result.Result<{ amount : Nat; blockHeight : Nat; spender : Principal; token : Text }, Text>;

    // Bitcoin
    sendBitcoin : shared (toAddress : Text, amount : Nat64) -> async Result.Result<SendResultBtcLtc, Text>;
    sendBitcoinDynamicFee : shared (toAddress : Text, amount : Nat64) -> async Result.Result<SendResultBtcLtc, Text>;
    sendBitcoinWithFee : shared (toAddress : Text, amount : Nat64, feeRate : Nat64) -> async Result.Result<SendResultBtcLtc, Text>;

    // Litecoin
    sendLitecoin : shared (toAddress : Text, amount : Nat64) -> async Result.Result<SendResultBtcLtc, Text>;
    sendLitecoinWithFee : shared (toAddress : Text, amount : Nat64, feeRate : Nat64) -> async Result.Result<SendResultBtcLtc, Text>;

    // XRP
    sendXrpAutonomous : shared (destAddress : Text, amountXrp : Text, destinationTag : ?Nat32) -> async SendResultXrp;
    sendXrpIOU : shared (destAddress : Text, currency : Text, issuer : Text, amount : Text, destinationTag : ?Nat32) -> async SendResultXrp;

    // SUI
    sendSui : shared (recipientAddress : Text, amount : Nat64) -> async Result.Result<SendResult, Text>;
    sendSuiMax : shared (recipientAddress : Text) -> async Result.Result<SendResult, Text>;
    transferSuiCoin : shared (coinObjectId : Text, recipientAddress : Text, amount : Nat64) -> async Result.Result<SendResult, Text>;

    // TON
    sendTonSimple : shared (toAddress : Text, amountNanoton : Nat64) -> async SendResultTon;
    sendTon : shared (toAddress : Text, amountNanoton : Nat64, bounce : Bool, comment : ?Text, timeoutSeconds : Nat32) -> async SendResultTon;
    sendTonWithComment : shared (toAddress : Text, amountNanoton : Nat64, comment : Text) -> async SendResultTon;

    // Cardano
    sendCardanoTransaction : shared (toAddress : Text, amount : Nat64) -> async Result.Result<Text, Text>;

    // Tron
    sendTrx : shared (toAddress : Text, amount : Nat64) -> async Result.Result<Text, Text>;
    sendTrc20 : shared (contractAddress : Text, toAddress : Text, amount : Nat, feeLimit : Nat64) -> async Result.Result<Text, Text>;

    // Aptos
    sendAptos : shared (toAddress : Text, amount : Nat64) -> async Result.Result<SendResult, Text>;

    // Near
    sendNearTransferFromUser : shared (receiverId : Text, amount : Nat) -> async Result.Result<Text, Text>;
    sendNearTransfer : shared (receiverId : Text, amount : Nat) -> async Result.Result<Text, Text>;

    // CloakCoin
    sendCloak : shared (toAddress : Text, amount : Nat64) -> async Result.Result<SendResultCloak, Text>;

    // Thorchain
    sendThor : shared (toAddress : Text, amount : Nat64, memo : Text) -> async Result.Result<Text, Text>;

    // ─── SWAP — 6 DEXes ($0.075) ───────────────────────────

    // Raydium (Solana) — 8 params
    swapRaydiumApiUser : shared (inputMint : Text, outputMint : Text, amount : Nat64, slippageBps : Nat64, wrapSol : Bool, unwrapSol : Bool, inputAta : ?Text, outputAta : ?Text) -> async RaydiumApiSwapResult;

    // Uniswap V3 (EVM) — general swap
    swapTokens : shared (quoteId : Text, fromSymbol : Text, toSymbol : Text, amountIn : Nat, slippageBps : Nat, useFeeOnTransfer : Bool, rpcEndpoint : Text) -> async Result.Result<{ expectedTxHash : Text; approvalTxHash : ?Text; nonce : Nat; note : Text; path : [Text]; pathSymbols : [Text]; senderAddress : Text; isDirect : Bool; amountIn : Nat; minAmountOut : Nat }, Text>;
    swapTokensMultiHop : shared (fromSymbol : Text, toSymbol : Text, amountIn : Nat, slippageBps : Nat, useFeeOnTransfer : Bool, chainId : Nat, rpcEndpoint : Text) -> async Result.Result<Text, Text>;
    swapETHForUSDC : shared (ethAmount : Nat, slippageBps : Nat, rpcEndpoint : Text) -> async Result.Result<{ expectedTxHash : Text; approvalTxHash : ?Text; nonce : Nat; note : Text; senderAddress : Text; ethIn : Nat; minUSDCOut : Nat }, Text>;
    swapUSDCForETH : shared (usdcAmount : Nat, slippageBps : Nat, rpcEndpoint : Text) -> async Result.Result<{ expectedTxHash : Text; approvalTxHash : ?Text; nonce : Nat; note : Text; senderAddress : Text; usdcIn : Nat; minETHOut : Nat }, Text>;

    // ICPSwap + KongSwap (ICP) — routes to best price
    executeICPDexSwap : shared (SwapRequest) -> async Result.Result<SwapResultIcp, Text>;

    // Cetus (SUI)
    executeSuiSwap : shared ({ #mainnet; #testnet; #devnet }, fromToken : Text, toToken : Text, amountIn : Text, minAmountOut : Text) -> async SwapResultSui;

    // Minswap (Cardano)
    executeMinswapSwap : shared (tokenIn : Text, tokenOut : Text, amountIn : Nat64, slippagePct : Float) -> async Result.Result<Text, Text>;

    // XRP Ledger DEX
    xrpSwap : shared (destinationAmount : TokenAmount, sendMaxAmount : TokenAmount, paths : Text, slippageBps : Nat) -> async SwapResultXrp;

    // ─── SWAP QUOTES (FREE) ────────────────────────────────
    getRaydiumQuote : shared (inputMint : Text, outputMint : Text, amount : Nat64, slippageBps : Nat64) -> async { amountIn : Nat64; amountOut : Nat64; priceImpact : Float; route : Text };
    getICPDexQuote : shared (tokenIn : Text, tokenOut : Text, amountIn : Nat, slippagePct : Float) -> async AggregatedQuote;
    getSuiSwapQuote : shared ({ #mainnet; #testnet; #devnet }, fromToken : Text, toToken : Text, amountIn : Text, slippageBps : Nat64) -> async ?SwapQuote;
    getMinswapQuote : shared (tokenIn : Text, tokenOut : Text, amountIn : Nat64, slippagePct : Float) -> async Result.Result<{ amount_in : Text; amount_out : Text; min_amount_out : Text; avg_price_impact : Text; success : Bool }, Text>;
    getTokenQuote : shared (fromSymbol : Text, toSymbol : Text, amountIn : Nat, rpcEndpoint : Text) -> async Result.Result<{ amountIn : Nat; amountOut : Nat; fromToken : Text; toToken : Text; path : [Text] }, Text>;
    xrpFindPaths : shared (destinationAmount : TokenAmount, sourceCurrencies : [TokenAmount]) -> async { alternatives : [{ destination_amount : TokenAmount; source_amount : TokenAmount; paths_computed : [Text] }] };

    // ─── BRIDGE — ETH→SOL ($0.10) ──────────────────────────

    // Quick bridges (simple, recommended)
    quickUltrafastEthToSol : shared (ethAmountWei : Nat) -> async Result.Result<Text, Text>;
    quickUltrafastUsdcToSol : shared (usdcAmount : Nat) -> async Result.Result<Text, Text>;
    quickUltrafastEthToToken : shared (ethAmountWei : Nat, outputMint : Text, slippageBps : Nat) -> async Result.Result<Text, Text>;
    quickCctpBridge : shared (sourceChainId : Nat, usdcAmount : Nat, outputToken : Text, useFastMode : Bool, slippageBps : Nat, ethRpc : Text) -> async Result.Result<Text, Text>;

    // SOL→ETH bridges
    quickSolToEth : shared (solAmountLamports : Nat64, slippageBps : Nat) -> async Result.Result<Text, Text>;
    quickUsdcBridgeSolToEth : shared (usdcAmount : Nat64) -> async Result.Result<Text, Text>;

    // ─── SOLANA ATA CREATION ────────────────────────────────
    createMySolanaAtaForMint : shared (mintBase58 : Text, ataBase58 : Text) -> async CreateAtaResult;
    createMySolanaAtaForMintWithProgram : shared (mintBase58 : Text, ataBase58 : Text, tokenProgramId : Text) -> async CreateAtaResult;

    // ─── XRP TRUSTLINES ─────────────────────────────────────
    xrpSetTrustline : shared (currency : Text, issuer : Text, limit : Text) -> async TrustSetResult;
    xrpGetAccountLines : shared () -> async Result.Result<Text, Text>;

    // ─── AUTOMATION / STRATEGY ──────────────────────────────
    addStrategyRule : shared (Rule) -> async Result.Result<Nat, Text>;
    getMyStrategyRules : shared () -> async [Rule];
    updateStrategyRuleStatus : shared (ruleId : Nat, status : RuleStatus) -> async Result.Result<(), Text>;
    deleteStrategyRule : shared (ruleId : Nat) -> async Result.Result<(), Text>;
    getStrategyLogs : shared query () -> async [ExecutionLog];
    initAutomation : shared () -> async Text;

    // ─── DEVELOPER / BILLING ────────────────────────────────
    registerDeveloperCanister : shared (Principal, Text) -> async Result.Result<Text, Text>;
    getMyDeveloperKey : shared () -> async Result.Result<Text, Text>;
    regenerateDeveloperKey : shared () -> async Result.Result<Text, Text>;
    validateDeveloperKey : shared query (Text) -> async Bool;
    getMyGatewayAccount : shared () -> async UserAccount;
    getMyDeveloperAccount : shared () -> async ?DeveloperAccountV3;
    depositGatewayCredits : shared (Text, Nat) -> async Result.Result<{ id : Nat }, Text>;

    // ─── UTILITY (FREE) ────────────────────────────────────
    getBitcoinMaxSendAmount : shared (?Nat64) -> async Result.Result<{ maxAmount : Nat64; fee : Nat64; utxoCount : Nat }, Text>;
    getLitecoinMaxSendAmount : shared (?Nat64) -> async Result.Result<{ maxAmount : Nat64; fee : Nat64; utxoCount : Nat }, Text>;
    health : shared query () -> async Text;
    version : shared query () -> async Text;
  };

  // ============================================================
  // CONSTRUCTOR — call this to get a handle to MeneseSDK
  // ============================================================

  public func mainnet() : MeneseSDK {
    actor ("urs2a-ziaaa-aaaad-aembq-cai") : MeneseSDK;
  };
};
