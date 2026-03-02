# MeneseSDK Full API Reference

Complete function signatures and type definitions for `urs2a-ziaaa-aaaad-aembq-cai`.
Total: **336 public functions** as defined in `backend.did`.

## Table of Contents

1. [Address Types](#address-types)
2. [Send Result Types](#send-result-types)
3. [Swap/Quote Types](#swapquote-types)
4. [DeFi Result Types](#defi-result-types)
5. [Strategy/Automation Types](#strategyautomation-types)
6. [Billing Types](#billing-types)
7. [ICP DEX LP Types](#icp-dex-lp-types)
8. [Misc Types](#misc-types)
9. [All Functions by Category](#all-functions-by-category)

---

## Address Types

```candid
type SolanaAddressInfo = record { address: text; publicKeyHex: text; publicKeyBytes: vec nat8 };
type EvmAddressInfo = record { evmAddress: text; publicKeyHex: text };
type AddressInfo = record { bech32Address: text; hash160Hex: text; pubKeyHex: text };  // BTC, LTC, Thor
type CardanoAddressInfo = record { bech32Address: text; addressBytesHex: text; paymentPubKeyHex: text; stakePubKeyHex: text };
type SuiAddressInfo = record { suiAddress: text; publicKeyHex: text; publicKeyBytes: vec nat8 };
type XrpAddressInfo = record { classicAddress: text; accountIdHex: text; accountIdBytes: vec nat8; publicKeyHex: text };
type TonAddressInfo = record { bounceable: text; nonBounceable: text; rawAddress: text; publicKeyHex: text; stateInitBocBase64: text };
type TronAddressInfo = record { base58Address: text; hexAddress: text; publicKeyHex: text };
type AptosAddressInfo = record { address: text; publicKeyHex: text };
type PubKeyInfo = record { implicitAccountId: text; publicKeyBase58: text; publicKeyHex: text };  // NEAR
type CloakAddressInfo = record { base58Address: text; addressBytesHex: text; hash160Hex: text; pubKeyHex: text };
```

## Send Result Types

```candid
type SendResult = record { txHash: text; senderAddress: text; note: text };
type SendResultBtcLtc = record { txid: text; amount: nat64; fee: nat64; senderAddress: text; recipientAddress: text; note: text };
// NOTE: Litecoin uses SendResult, NOT SendResultBtcLtc
type SendICPResult = record { amount: nat64; blockHeight: nat64; fee: nat64; from: principal; to: principal };
type SendICRC1Result = record { amount: nat; blockHeight: nat; fee: nat; to: principal; token: text };
type SendResultEvm = record { expectedTxHash: text; nonce: nat; senderAddress: text; note: text };
type SendResultCloak = record { txHash: text; txHex: text; changeValue: nat64 };

// FLAT records (NOT variants -- check .success, do NOT pattern match #ok/#err)
type SendResultTon = record { txHash: text; bocBase64: text; senderAddress: text; success: bool; error: opt text };
type SendResultXrp = record { txHash: text; explorerUrl: text; message: text; success: bool; sequence: nat32; ledgerUsed: nat32 };

// SPL Token transfer
type TransferAndSendResult = record { txSignature: text; serializedTxBase64: text; blockhash: text };
```

## Swap/Quote Types

```candid
// Raydium -- FLAT record (NOT a variant)
type RaydiumApiSwapResult = record { inputAmount: text; outputAmount: text; priceImpactPct: text; txSignature: text };
type NativeSwapResult = record { blockhash: text; messageHex: text; serializedTxBase64: text; txSignature: text };
type RaydiumQuoteResponse = record { inputAmount: text; minOutputAmount: text; outputAmount: text; priceImpactPct: text; routeInfo: text; success: bool };

// ICP DEX
type DexId = variant { ICPSwap; KongSwap };
type SwapRequest = record { tokenIn: text; tokenOut: text; amountIn: nat; minAmountOut: nat; slippagePct: float64; preferredDex: opt DexId };
type SwapResultIcp = record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; message: text; success: bool; txId: nat };

// SUI (Cetus)
type SwapResultSui = record { success: bool; txDigest: text; amountOut: text; error: opt text };

// XRP DEX
type SwapResultXrp = record { success: bool; txHash: text; explorerUrl: text; message: text; sourceAmount: text; destinationAmount: text };
type TokenAmount = record { currency: text; issuer: text; value: text };

// CLMM (Concentrated Liquidity)
type ClmmPoolId = variant { CRCLX_USDC; CRCLX_WSOL; GOOGLX_USDC; QQQX_WSOL; TSLAX_USDC; TSLAX_WSOL; USD1_USDC };
type ClmmSwapResult = record { outputAmount: text; priceImpactPct: text; txSignature: text };
type ClmmSwapQuote = record { inputAmount: text; otherAmountThreshold: text; outputAmount: text; priceImpactPct: text; rawJson: text; success: bool };
type ClmmPoolConfig = record { /* pool configuration fields */ };

// Quotes
type SwapQuote = record { amountIn: text; amountOut: text; estimatedGas: nat64; priceImpact: float64; routerData: text };
type AggregatedQuote = record { best: SwapQuoteIcp; icpswapQuote: opt SwapQuoteIcp; kongswapQuote: opt SwapQuoteIcp; timestamp: int };
type SwapQuoteIcp = record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; minAmountOut: nat; poolId: opt text; priceImpactPct: text; rawData: text; route: vec text; success: bool; tokenIn: text; tokenOut: text };
type PathFindResult = record { destinationAmount: TokenAmount; message: text; paths: text; sourceAmount: TokenAmount; success: bool };
```

## DeFi Result Types

```candid
// Aave V3
type SupplyEthResult = record { txHash: text; ethSupplied: nat; nonce: nat; senderAddress: text; note: text };
type WithdrawEthResult = record { txHash: text; approvalTxHash: opt text; ethWithdrawn: nat; nonce: nat; senderAddress: text; note: text };
type SupplyTokenResult = record { txHash: text; approvalTxHash: opt text; amountSupplied: nat; tokenAddress: text; nonce: nat; senderAddress: text; note: text };
type WithdrawTokenResult = record { txHash: text; approvalTxHash: opt text; amountWithdrawn: nat; tokenAddress: text; nonce: nat; senderAddress: text; note: text };

// Lido
type StakeResult = record { txHash: text; ethStaked: nat; nonce: nat; senderAddress: text; note: text };
type WrapResult = record { txHash: text; approvalTxHash: opt text; stEthWrapped: nat; nonce: nat; senderAddress: text; note: text };
type UnwrapResult = record { txHash: text; wstEthUnwrapped: nat; nonce: nat; senderAddress: text; note: text };

// ICP DEX Liquidity (AddLiquidityResult / RemoveLiquidityResult are ICP DEX types in the DID)
type AddLiquidityResult = record { lpTokens: nat; message: text; poolId: text; success: bool; token0Used: nat; token1Used: nat };
type RemoveLiquidityResult = record { message: text; success: bool; token0Received: nat; token1Received: nat };
```

## Strategy/Automation Types

```candid
type ChainType = variant { Evm; Solana };
type RuleType = variant { APYMigration; DCA; LiquidityProvision; Rebalance; Scheduled; StopLoss; TakeProfit; VolatilityTrigger };
type RuleStatus = variant { Active; Cancelled; Confirmed; Draft; Executed; Executing; Failed; Paused; Ready };
type Rule = record {
  id: nat; ruleType: RuleType; status: RuleStatus; chainType: ChainType;
  triggerPrice: nat64; sizePct: nat; positionId: nat; createdAt: int;
  dcaConfig: opt DCAConfig; lpConfig: opt LPConfig;
  scheduledConfig: opt ScheduledConfig; apyMigrationConfig: opt APYMigrationConfig;
  volatilityConfig: opt VolatilityConfig;
  swapAmountLamports: opt nat64; swapAmountWei: opt nat
};
type DCAConfig = record { amountPerBuy: nat; executedBuys: nat; intervalSeconds: nat; nextExecutionTime: int; tokenIn: text; tokenOut: text; totalBuys: nat };
type LPConfig = record { cooldownHours: nat; exitOnHighVolatility: bool; maxPositionSizePct: float64; maxVolatility: float64; minApy: float64; minTvlUSD: float64; poolAddress: text; rebalanceThreshold: float64 };
type ScheduledConfig = record { action: ScheduledAction; cronPattern: text; executedCount: nat; nextExecutionTime: int; repeatCount: nat };
type ScheduledAction = variant { Swap: record { tokenIn: text; tokenOut: text; amountIn: nat }; AddLP: record { poolAddress: text; amountUSD: nat }; RemoveLP: record { poolAddress: text; percentage: nat }; Custom: text };
type APYMigrationConfig = record { cooldownHours: nat; currentPoolAddress: text; lastMigrated: int; maxMigrationCostPct: float64; minApyDelta: float64; targetPools: vec text };
type VolatilityConfig = record { action: VolatilityAction; cooldownMinutes: nat; direction: variant { Above; Below }; lastTriggered: int; tokenSymbol: text; triggerStdDev: float64 };
type VolatilityAction = variant { Alert; Buy: record { amountUSD: nat }; Sell: record { percentage: nat }; ExitLP: record { poolAddress: text } };
type ExecutionStage = variant { ACTIVATED; ADDRESS_GENERATED; BROADCASTING; BUILT_TX; COMPLETED; ESTIMATING_FEE; FAILED; FETCHING_UTXOS; INITIATED; PENDING; QUOTE_FETCHED; RECEIVED_DEPOSIT; SENT; SIGNING; TRIGGERED; VALIDATED };
type ExecutionLog = record { error: opt text; intent_hash: text; rule_id: text; stage: ExecutionStage; ts: int; tx_id: opt text };
```

## Billing Types

```candid
type Tier = variant { Basic; Developer; Enterprise; Free; Pro };
type UserAccount = record { creditsMicroUsd: nat; tier: Tier; actionsRemaining: nat; subscriptionExpiry: opt int; actionsUsed: nat; totalDepositedMicroUsd: nat; createdAt: int };
type DeveloperAccountV3 = record { owner: principal; canisters: vec principal; appName: text; developerKey: text; createdAt: int };
type PackagePricing = record { actionsIncluded: nat; durationNanos: int; priceMicroUsd: nat; tier: Tier };
type TokenConfig = record { decimals: nat; fixedRateMicroUsd: opt nat; ledgerCanisterId: text; symbol: text; xrcSymbol: opt text };
type FeeEntry = record { microUsd: nat; opType: OpType };
type DepositRecord = record { amount: nat; currency: text; id: nat; ledgerCanisterId: text; timestamp: int; usdValueMicroUsd: nat; user: principal };
```

## ICP DEX LP Types

```candid
type PoolInfo = record { poolId: text; dex: DexId; token0: text; token1: text; token0Symbol: text; token1Symbol: text; reserve0: nat; reserve1: nat; fee: nat; tvl: opt nat; apr: opt float64; volume24h: opt nat };
type PoolInfo__1 = record { /* Extended pool info for ICP DEX */ };
type LPPosition = record { poolId: text; dex: DexId; token0: text; token1: text; token0Symbol: text; token1Symbol: text; liquidity: nat; token0Amount: nat; token1Amount: nat; unclaimedFees: opt record { nat; nat }; valueUsd: opt nat };
type AddLiquidityRequest = record { poolId: text; dex: DexId; token0: text; token0Amount: nat; token1: text; token1Amount: nat; slippagePct: float64 };
type RemoveLiquidityRequest = record { poolId: text; dex: DexId; lpTokens: nat; slippagePct: float64 };
type TokenStandard = variant { DIP20; ICRC1; ICRC2 };
type DexToken = record { availableOn: vec DexId; canisterId: text; category: opt text; decimals: nat8; fee: nat; logo: opt text; name: text; standard: TokenStandard; symbol: text };
type RebalancePreferences = record { targetCategories: vec text; riskTolerance: text; minApy: opt float64; maxImpermanentLoss: opt float64; autoCompound: bool };
type RebalanceRecommendation = record { id: text; action: text; fromToken: text; toToken: text; fromSymbol: text; toSymbol: text; amount: nat; reason: text; estimatedApy: opt float64; currentApy: opt float64; confidence: float64; estimatedGasUsd: opt float64 };
```

## Misc Types

```candid
type CreateAtaResult = record { ata: text; blockhash: text; mint: text; owner: text; txSignature: text };
type LockResult = record { blockhash: text; icrcBlockIndex: opt nat; icrcMinted: bool; message: text; serializedTxBase64: text; txSignature: text };
type TrustSetResult = record { success: bool; txHash: text; explorerUrl: text; message: text };
type TransactionReceipt = record { blockNumber: text; gasUsed: text; status: nat };
type AccountInfo = record { balance: nat64; seqno: nat32; state: text };
type CoinData = record { balance: nat64; digest: text; objectId: text; version: nat64 };
type WalletBalance = record { lovelace: nat64; tokens: vec TokenBalance };
type TokenBalance = record { quantity: text; unit: text };
type TokenInfo = record { /* token info fields */ };
type PoolInfo = record { /* pool info fields */ };
type MinswapTokenConfig = record { /* Minswap token config */ };
type MinswapEstimateResponse = record { /* Minswap estimate */ };
type Network = variant { devnet; mainnet; testnet };
type Network__1 = variant { mainnet; regtest; testnet };
type Balance = record { amount: nat; denom: text };
type UTXO = record { scriptPubKey: vec nat8; txid: text; value: nat64; vout: nat32 };
type ChainStats = record { /* chain statistics */ };
type PackageConfig = record { /* Sui package config */ };
type RaydiumDiagnostics = record { /* diagnostics fields */ };
type HttpResponse = record { body: blob; headers: vec record { name: text; value: text }; status: nat };
type TransformArgs = record { context: blob; response: HttpResponse };
type GasQuote = record { bufferedGasPriceWei: nat; bufferedFeeWei: nat; estimatedFee: nat; estimatedFeeWei: nat; gasPriceWei: nat; gasLimit: nat; quoteId: text };
```

---

## All Functions by Category

### Addresses -- User Addresses (FREE)

```
getAllAddresses : () -> record { aptos, bitcoin, cardano, evm, litecoin, near, solana, sui, thorchain, ton, tron, xrp }
getMySolanaAddress : () -> SolanaAddressInfo
getMyEvmAddress : () -> EvmAddressInfo
getMyBitcoinAddress : () -> AddressInfo
getMyLitecoinAddress : () -> AddressInfo
getMyCardanoAddress : () -> CardanoAddressInfo
getMySuiAddress : () -> SuiAddressInfo
getMyXrpAddress : () -> XrpAddressInfo
getMyTonAddress : () -> TonAddressInfo
getTronAddress : () -> TronAddressInfo
getMyAptosAddress : () -> AptosAddressInfo
getMyNearAddress : () -> PubKeyInfo
getMyCloakAddress : () -> CloakAddressInfo
getMyThorAddress : () -> AddressInfo
getMySolanaAta : (mint:Text) -> Text
```

### Addresses -- For Specific Principal (FREE)

```
getBitcoinAddressFor : (user:Principal) -> AddressInfo
getCloakAddressFor : (user:Principal) -> CloakAddressInfo
getEvmAddressFor : (user:Principal) -> EvmAddressInfo
getLitecoinAddressFor : (user:Principal) -> AddressInfo
getSolanaAddressFor : (user:Principal) -> SolanaAddressInfo
getSuiAddressFor : (user:Principal) -> SuiAddressInfo
getTonAddressFor : (user:Principal) -> TonAddressInfo
getXrpAddressFor : (user:Principal) -> XrpAddressInfo
```

### Addresses -- Canister Addresses (FREE)

```
getCanisterBitcoinAddress : () -> AddressInfo
getCanisterCloakAddress : () -> CloakAddressInfo
getCanisterEvmAddress : () -> EvmAddressInfo
getCanisterLitecoinAddress : () -> AddressInfo
getCanisterSolanaAddress : () -> SolanaAddressInfo
getCanisterSuiAddress : () -> SuiAddressInfo
getCanisterTonAddress : () -> TonAddressInfo
getCanisterTronAddress : () -> TronAddressInfo
getCanisterXrpAddress : () -> XrpAddressInfo
getCanisterNearPubKey : () -> PubKeyInfo
getCanisterNearBalance : () -> Nat
```

### Balances -- User Balances (FREE)

```
getAllBalances : () -> record { aptos, bitcoin, cardano, icp, litecoin, near, solana, thorchain, ton, xrp }
getMySolanaBalance : () -> Result<Nat64, Text>
getMyEvmBalance : (rpcEndpoint:Text) -> Result<Nat, Text>
getICPBalance : () -> Result<Nat64, Text>
getBitcoinBalance : () -> Nat64
getLitecoinBalance : () -> Nat64
getMyXrpBalance : () -> Result<Text, Text>
getMySuiBalance : () -> Nat64
getMyTonBalance : () -> Result<Nat64, Text>
getCardanoBalance : () -> Result<Nat64, Text>
getAptosBalance : () -> Result<Nat64, Text>
getMyNearBalance : () -> Nat
getThorBalance : () -> vec Balance
getCloakBalance : () -> Result<record { address: text; balance: nat64; utxoCount: nat }, Text>
getTrxBalance : (address:Text) -> Result<Nat64, Text>
getICRC1Balance : (ledgerCanisterId:Text) -> Result<Nat, Text>
getMyTrc20Balance : (contractAddress:Text) -> Result<Nat, Text>
getCardanoWalletBalance : () -> Result<WalletBalance, Text>
```

### Balances -- For Any Address/Principal (FREE)

```
getBitcoinBalanceFor : (address:Text) -> Nat64
getCloakBalanceFor : (address:Text) -> Result<record { address; balance; utxoCount }, Text>
getEvmBalance : (address:Text, rpcEndpoint:Text) -> opt Nat
getICPBalanceFor : (principal:Principal) -> Result<Nat64, Text>
getICRC1BalanceFor : (principal:Principal, ledgerCanisterId:Text) -> Result<Nat, Text>
getICRC1Balances : (canisterIds:vec Text) -> vec record { Text; Result<Nat, Text> }
getLitecoinBalanceFor : (address:Text) -> Nat64
getSolanaBalance : (address:Text) -> Result<Nat64, Text>
getSuiBalanceFor : (address:Text) -> Nat64
getTonBalanceFor : (address:Text) -> Result<Nat64, Text>
getTrc20Balance : (ownerAddress:Text, contractAddress:Text) -> Result<Nat, Text>
```

### Balances -- DeFi Positions (FREE)

```
getATokenBalance : (aTokenAddress:Text, user:Text, rpcEndpoint:Text) -> Result<Nat, Text>
getAWethBalance : (user:Text, rpcEndpoint:Text) -> Result<Nat, Text>
getStEthBalance : (user:Text, rpcEndpoint:Text) -> Result<Nat, Text>
getStEthAllowance : (owner:Text, rpcEndpoint:Text) -> Result<Nat, Text>
getWstEthBalance : (user:Text, rpcEndpoint:Text) -> Result<Nat, Text>
getICPLPPositions : () -> vec LPPosition
```

### UTXO Management (FREE)

```
getBitcoinUTXOs : () -> vec UTXO
getBitcoinUTXOsFor : (address:Text) -> vec UTXO
getBitcoinDustLimit : () -> Nat64  // query
getBitcoinMaxSendAmount : (feeRate:opt Nat64) -> Result<record { maxAmount; fee; utxoCount }, Text>
getBitcoinRecommendedFeeRate : () -> Nat64
getBitcoinFeePercentiles : () -> vec Nat64
getBitcoinReservationCount : () -> Nat  // query
getLitecoinUTXOs : () -> vec UTXO
getLitecoinUTXOsFor : (address:Text) -> vec UTXO
getLitecoinDustLimit : () -> Nat64  // query
getLitecoinMaxSendAmount : (feeRate:opt Nat64) -> Result<record { maxAmount; fee; utxoCount }, Text>
getLitecoinReservationCount : () -> Nat  // query
getCloakUTXOs : () -> Result<vec UTXO, Text>
estimateBitcoinFee : (inputCount:Nat, outputCount:Nat, feeRate:opt Nat64) -> Nat64
syncBitcoinUTXOs : () -> Nat
syncLitecoinUTXOs : () -> Nat
cleanupBitcoinReservations : () -> Nat
cleanupLitecoinReservations : () -> Nat
```

### SUI Coins (FREE)

```
getMySuiCoins : () -> vec CoinData
getSuiCoinsFor : (address:Text) -> vec CoinData
```

### TON Account Info (FREE)

```
getMyTonAccountInfo : () -> AccountInfo
getTonAccountInfoFor : (address:Text) -> AccountInfo
```

### NEAR Account Info (FREE)

```
getNearUserAccountInfo : () -> record { accountId: text; pkBase58: text; pkBytes: vec nat8 }
getMyNearPubKey : () -> PubKeyInfo
```

### Send -- All Chains (1 action each)

```
sendSolTransaction : (toAddress:Text, lamports:Nat64) -> Result<Text, Text>
transferSplToken : (amount:Nat64, sourceAta:Text, destinationAta:Text) -> TransferAndSendResult
sendEvmNativeTokenAutonomous : (to:Text, value:Nat, rpcEndpoint:Text, chainId:Nat, quoteId:opt Text) -> Result<SendResultEvm, Text>
sendICP : (to:Principal, amount:Nat64) -> Result<SendICPResult, Text>
sendICRC1 : (to:Principal, amount:Nat, ledgerCanisterId:Text) -> Result<SendICRC1Result, Text>
approveICRC2 : (spender:Principal, amount:Nat, expiresAt:opt Nat64, ledgerCanisterId:Text) -> Result<record { amount; blockHeight; spender; token }, Text>
transferFromICRC2 : (from:Principal, to:Principal, amount:Nat, ledgerCanisterId:Text) -> Result<record { amount; blockHeight; from; to; token }, Text>
sendBitcoin : (toAddress:Text, amount:Nat64) -> Result<SendResultBtcLtc, Text>
sendBitcoinDynamicFee : (toAddress:Text, amount:Nat64) -> Result<SendResultBtcLtc, Text>
sendBitcoinWithFee : (toAddress:Text, amount:Nat64, feeRate:Nat64) -> Result<SendResultBtcLtc, Text>
sendBitcoinWithNetwork : (toAddress:Text, amount:Nat64, feeRate:opt Nat64, network:Network__1) -> Result<SendResultBtcLtc, Text>
sendLitecoin : (toAddress:Text, amount:Nat64) -> Result<SendResult, Text>
sendLitecoinWithFee : (toAddress:Text, amount:Nat64, feeRate:Nat64) -> Result<SendResult, Text>
sendXrpAutonomous : (destAddress:Text, amountXrp:Text, destinationTag:opt Nat32) -> SendResultXrp  // FLAT
sendXrpIOU : (destAddress:Text, currency:Text, issuer:Text, amount:Text, destinationTag:opt Nat32) -> SendResultXrp  // FLAT
sendSui : (recipientAddress:Text, amount:Nat64) -> Result<SendResult, Text>
sendSuiMax : (recipientAddress:Text) -> Result<SendResult, Text>
sendSuiWithNetwork : (recipientAddress:Text, amount:Nat64, network:Network) -> Result<SendResult, Text>
sendTonSimple : (toAddress:Text, amountNanoton:Nat64) -> SendResultTon  // FLAT
sendTon : (toAddress:Text, amountNanoton:Nat64, bounce:Bool, comment:opt Text, timeoutSeconds:Nat32) -> SendResultTon  // FLAT
sendTonWithComment : (toAddress:Text, amountNanoton:Nat64, comment:Text) -> SendResultTon  // FLAT
sendTonTestnet : (toAddress:Text, amountNanoton:Nat64, comment:opt Text) -> SendResultTon  // FLAT, testnet only
sendCardanoTransaction : (toAddress:Text, amount:Nat64) -> Result<Text, Text>
sendTrx : (toAddress:Text, amount:Nat64) -> Result<Text, Text>
sendTrc20 : (contractAddress:Text, toAddress:Text, amount:Nat, feeLimit:Nat64) -> Result<Text, Text>
sendAptos : (toAddress:Text, amount:Nat64) -> Result<SendResult, Text>
sendNearTransfer : (receiverId:Text, amount:Nat) -> Result<Text, Text>
sendNearTransferFromUser : (receiverId:Text, amount:Nat) -> Result<Text, Text>
sendCloak : (toAddress:Text, amount:Nat64) -> Result<SendResultCloak, Text>
sendThor : (toAddress:Text, amount:Nat64, memo:Text) -> Result<Text, Text>
transferSuiCoin : (coinObjectId:Text, recipientAddress:Text, amount:Nat64) -> Result<SendResult, Text>
```

### Swap -- Execution (1 action each)

```
swapRaydiumApiUser : (inputMint:Text, outputMint:Text, amount:Nat64, slippageBps:Nat64, wrapSol:Bool, unwrapSol:Bool, inputAta:opt Text, outputAta:opt Text) -> RaydiumApiSwapResult  // FLAT
swapRaydiumApi : (inputMint:Text, outputMint:Text, amount:Nat64, slippageBps:Nat64, wrapSol:Bool, unwrapSol:Bool, inputAta:opt Text, outputAta:opt Text) -> RaydiumApiSwapResult  // FLAT, canister wallet
swapRaydiumNative : (amountIn:Nat64, minimumAmountOut:Nat64, userSourceAta:Text, userDestAta:Text) -> NativeSwapResult
swapTokens : (quoteId:Text, fromSymbol:Text, toSymbol:Text, amountIn:Nat, slippageBps:Nat, useFeeOnTransfer:Bool, rpcEndpoint:Text) -> Result<record { ... }, Text>
swapTokensMultiHop : (fromSymbol:Text, toSymbol:Text, amountIn:Nat, slippageBps:Nat, useFeeOnTransfer:Bool, chainId:Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
swapETHForUSDC : (ethAmount:Nat, slippageBps:Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
swapUSDCForETH : (usdcAmount:Nat, slippageBps:Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
executeICPDexSwap : (request:SwapRequest) -> Result<SwapResultIcp, Text>
executeSuiSwap : (network:Network, fromToken:Text, toToken:Text, amountIn:Text, minAmountOut:Text) -> SwapResultSui  // FLAT
executeMinswapSwap : (tokenIn:Text, tokenOut:Text, amountIn:Nat64, slippagePct:Float64) -> Result<Text, Text>
xrpSwap : (destinationAmount:TokenAmount, sendMaxAmount:TokenAmount, paths:Text, slippageBps:Nat) -> SwapResultXrp  // FLAT
swapClmm : (poolId:ClmmPoolId, amount:Nat64, slippageBps:Nat64, zeroForOne:Bool, inputAta:opt Text, outputAta:opt Text) -> ClmmSwapResult
swapClmmUser : (poolId:ClmmPoolId, amount:Nat64, slippageBps:Nat64, zeroForOne:Bool, inputAta:opt Text, outputAta:opt Text) -> ClmmSwapResult
```

### Swap -- Quotes (FREE)

```
getRaydiumQuote : (inputMint:Text, outputMint:Text, amount:Nat64, slippageBps:Nat64) -> RaydiumQuoteResponse
getICPDexQuote : (tokenIn:Text, tokenOut:Text, amountIn:Nat, slippagePct:Float64) -> AggregatedQuote
getSuiSwapQuote : (network:Network, fromToken:Text, toToken:Text, amountIn:Text, slippageBps:Nat64) -> opt SwapQuote
getMinswapQuote : (tokenIn:Text, tokenOut:Text, amountIn:Nat64, slippagePct:Float64) -> Result<MinswapEstimateResponse, Text>
getTokenQuote : (fromSymbol:Text, toSymbol:Text, amountIn:Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
getTokenQuoteMultiHop : (fromSymbol:Text, toSymbol:Text, amountIn:Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
getUSDCQuote : (ethAmount:Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
getETHQuote : (usdcAmount:Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
getClmmQuote : (poolId:ClmmPoolId, amount:Nat64, slippageBps:Nat64, zeroForOne:Bool) -> ClmmSwapQuote
xrpFindPaths : (destinationAmount:TokenAmount, sourceCurrencies:vec TokenAmount) -> PathFindResult
calculateSuiMinAmountOut : (amountOut:Text, slippageBps:Nat64) -> Text  // query
```

### DeFi -- Aave V3 (1 action each)

```
aaveSupplyEth : (ethAmountWei:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<SupplyEthResult, Text>
aaveWithdrawEth : (amountWei:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<WithdrawEthResult, Text>
aaveSupplyToken : (tokenAddress:Text, amount:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<SupplyTokenResult, Text>
aaveWithdrawToken : (tokenAddress:Text, amount:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<WithdrawTokenResult, Text>
```

### DeFi -- Lido Staking (1 action each)

```
stakeEthForStEth : (ethAmountWei:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<StakeResult, Text>
wrapStEth : (amountStEth:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<WrapResult, Text>
unwrapWstEth : (amountWstEth:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<UnwrapResult, Text>
```

### DeFi -- Uniswap V2 Liquidity (1 action each)

```
addLiquidityETH : (tokenSymbol:Text, amountTokenDesired:Nat, amountETHDesired:Nat, slippageBps:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<record { ... }, Text>
addLiquidity : (tokenASymbol:Text, tokenBSymbol:Text, amountADesired:Nat, amountBDesired:Nat, slippageBps:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<record { ... }, Text>
removeLiquidityETH : (tokenSymbol:Text, lpTokenAmount:Nat, slippageBps:Nat, useFeeOnTransfer:Bool, rpcEndpoint:Text, quoteId:opt Text) -> Result<record { ... }, Text>
removeLiquidity : (tokenASymbol:Text, tokenBSymbol:Text, lpTokenAmount:Nat, slippageBps:Nat, rpcEndpoint:Text, quoteId:opt Text) -> Result<record { ... }, Text>
getPairAddress : (tokenA:Text, tokenB:Text, rpcEndpoint:Text) -> Result<record { tokenA; tokenB; pairAddress }, Text>
getPoolReserves : (tokenA:Text, tokenB:Text, rpcEndpoint:Text) -> Result<record { pairAddress; reserve0; reserve1; token0; token1; blockTimestampLast }, Text>
```

### DeFi -- ICP DEX Liquidity (1 action each)

```
addICPLiquidity : (request:AddLiquidityRequest) -> Result<AddLiquidityResult, Text>
removeICPLiquidity : (request:RemoveLiquidityRequest) -> Result<RemoveLiquidityResult, Text>
getICPDexPools : () -> vec PoolInfo  // FREE
getICPDexTokens : () -> vec DexToken  // FREE
getICPRebalanceRecommendations : (preferences:RebalancePreferences, tokenBalances:vec record { Text; Nat }, pools:opt vec PoolInfo) -> vec RebalanceRecommendation  // FREE
```

### Token Operations (1 action each)

```
createMySolanaAtaForMint : (mintBase58:Text, ataBase58:Text) -> CreateAtaResult
createMySolanaAtaForMintWithProgram : (mintBase58:Text, ataBase58:Text, tokenProgramId:Text) -> CreateAtaResult
createMyAta : (mintBase58:Text, ataBase58:Text) -> Result<record { ... }, Text>
createCanisterSolanaAtaForMint : (mintBase58:Text, ataBase58:Text) -> CreateAtaResult
createCanisterSolanaAtaForMintWithProgram : (mintBase58:Text, ataBase58:Text, tokenProgramId:Text) -> CreateAtaResult
xrpSetTrustline : (currency:Text, issuer:Text, limit:Text) -> TrustSetResult
lockMyTokens : (amount:Nat64, sourceAtaBase58:Text) -> LockResult
burnSuiTokens : (coinToBurnId:Text, icpRecipient:Principal, nonce:Nat64) -> Result<SendResult, Text>
mintSuiTokens : (recipientAddress:Text, amount:Nat64) -> Result<SendResult, Text>
registerCloakDeposit : (txHash:Text) -> Result<Text, Text>
```

### XRP Operations (FREE unless stated)

```
xrpGetAccountLines : () -> Result<Text, Text>  // FREE
xrpGetAmmInfo : (asset1Currency:Text, asset1Issuer:Text, asset2Currency:Text, asset2Issuer:Text) -> Result<Text, Text>  // FREE
xrpFindPaths : (see Swap Quotes)  // FREE
xrpSetTrustline : (see Token Operations)  // 1 action
xrpSwap : (see Swap Execution)  // 1 action
```

### Custom EVM Contracts

```
callEvmContractRead : (contract:Text, functionSelector:Text, argsHexes:vec Text, rpcEndpoint:Text) -> Result<Text, Text>  // FREE
callEvmContractWrite : (contract:Text, functionSelector:Text, argsHexes:vec Text, rpcEndpoint:Text, chainId:Nat, value:Nat, quoteId:opt Text) -> Result<SendResultEvm, Text>  // 1 action
```

### EVM Signing (1 action each)

```
buildAndSignEvmTransaction : (to:Text, value:Nat, nonce:Nat, gasLimit:Nat, gasPrice:Nat, chainId:Nat) -> record { rawTxHex_v0; rawTxHex_v1; signature; txHash }
buildAndSignEvmTxWithData : (to:Text, value:Nat, data:vec Nat8, nonce:Nat, gasLimit:Nat, gasPrice:Nat, chainId:Nat) -> record { rawTxHex_v0; rawTxHex_v1; signature; txHash }
```

### EVM Nonce / Gas Management

```
getEvmNonceState : () -> opt record { cachedNonce; isLocked; lockAgeSeconds; updatedAt }  // FREE
hasEvmNonceState : () -> Bool  // FREE
isEvmNonceLocked : () -> Bool  // FREE
resyncEvmNonce : (rpcEndpoint:Text) -> Result<Nat, Text>
invalidateEvmNonce : () -> Result<(), Text>
forceReleaseEvmNonceLock : () -> Bool
forceClearEvmNonceState : () -> ()
forceSetEvmNonce : (nonce:Nat) -> ()
exp_rollbackEvmNonce : (evmAddress:Text, unusedNonce:Nat) -> Result<(), Text>
invalidateGasQuote : (quoteId:Text) -> ()
getEvmTransactionReceipt : (txHash:Text, rpcEndpoint:Text) -> opt TransactionReceipt  // FREE
verifyLastEvmTransaction : (rpcEndpoint:Text) -> record { currentNonce; increased; note }
verifyEvmAddressFormat : (address:Text) -> record { isValid; reason }  // FREE
```

### EVM Gas Preflight (FREE)

```
preflightGasPrice : (rpcEndpoint:Text, bufferBps:opt Nat) -> Result<GasQuote, Text>
preflightEvmSendGas : (quoteId:Text, valueWei:Nat, rpcEndpoint:Text, chainId:Nat) -> Result<GasQuote, Text>
preflightEvmSwapGas : (quoteId:Text, fromSymbol:Text, amountIn:Nat, rpcEndpoint:Text, chainId:opt Nat) -> Result<GasQuote, Text>
preflightEvmApproveGas : (quoteId:Text, rpcEndpoint:Text, chainId:opt Nat) -> Result<GasQuote, Text>
preflightEvmAddLiquidityGas : (quoteId:Text, valueWei:Nat, rpcEndpoint:Text, chainId:opt Nat) -> Result<GasQuote, Text>
preflightEvmRemoveLiquidityGas : (quoteId:Text, rpcEndpoint:Text, chainId:opt Nat) -> Result<GasQuote, Text>
preflightEvmContractWriteGas : (quoteId:Text, valueWei:Nat, rpcEndpoint:Text, chainId:opt Nat) -> Result<GasQuote, Text>
```

### Sign-Only -- Relayer Pattern (1 action each)

```
signSolTransferRelayer : (toAddress:Text, lamports:Nat64, blockhashBase58:Text) -> record { publicKey; signature; signedTxBase64; txMessage }
signSolSwapTxsRelayer : (txBase64Array:vec Text) -> vec record { signature; signedTxBase64 }
signAptosTransferRelayer : (toAddress:Text, amount:Nat64, sequenceNumber:Nat64, chainId:Nat8, expirationTimestampSecs:Nat64) -> record { senderAddress; signedTxBcs; txHash }
signCardanoTransferRelayer : (recipient:Text, amountLovelace:Nat64, utxos:vec record { tx_hash; tx_index; value }, senderBech32:Text) -> variant { ok: record { signedTxCbor; txHash }; err: Text }
signNearTransferRelayer : (recipientId:Text, amountYocto:Nat, nonce:Nat64, blockHash:vec Nat8) -> record { senderAccountId; signedTxBytes; txHash }
signSuiTransferRelayer : (recipientAddress:Text, amount:Nat64, gasCoinId:Text, gasCoinVersion:Nat64, gasCoinDigest:Text) -> record { senderAddress; signatureBase64; txBytesBase64 }
signTonTransferRelayer : (toAddress:Text, amountNanoton:Nat64, seqno:Nat32, bounce:Bool, comment:opt Text, timeoutSeconds:Nat32, accountState:Text) -> record { bocBase64; payloadHash; senderAddress }
signTrxTransferRelayer : (toAddress:Text, amountSun:Nat64, refBlockBytes:vec Nat8, refBlockHash:vec Nat8, expiration:Int64, timestamp:Int64) -> Result<record { ... }, Text>
signXrpTransferRelayer : (destAddress:Text, amountXrp:Text, sequence:Nat32, lastLedgerSeq:Nat32, fee:Nat64, destinationTag:opt Nat32) -> record { publicKeyHex; senderAddress; signedTxHex; txHash }
```

### Sign-Only -- Offchain Pattern (1 action each)

```
signSolTransferOffchain : (toAddress:Text, lamports:Nat64, blockhashBase58:Text) -> record { publicKey; signature; signedTxBase64; txMessage }
signSolSwapTxsOffchain : (txBase64Array:vec Text) -> vec record { signature; signedTxBase64 }
```

### Sign-Only -- exp_ Experimental (1 action each)

```
exp_signSolTransfer : (toAddress:Text, lamports:Nat64, recentBlockhash:Text) -> Result<record { signedTxBase64 }, Text>
exp_signSplTransfer : (amount:Nat64, sourceAta:Text, destAta:Text, tokenProgramId:Text, recentBlockhash:Text) -> Result<record { signedTxBase64 }, Text>
exp_signRaydiumSwap : (amountIn:Nat64, minimumAmountOut:Nat64, userSourceAta:Text, userDestAta:Text, recentBlockhash:Text) -> Result<record { signedTxBase64 }, Text>
exp_signEvmSend : (to:Text, value:Nat, chainId:Nat, gasPrice:Nat, gasLimit:Nat, data:vec Nat8, overrideNonce:opt Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
exp_signEvmSwap : (fromSymbol:Text, toSymbol:Text, amountIn:Nat, slippageBps:Nat, useFeeOnTransfer:Bool, gasPrice:Nat, gasLimit:Nat, overrideNonce:opt Nat, rpcEndpoint:Text) -> Result<record { ... }, Text>
exp_signClmmSwapUser : (poolId:ClmmPoolId, amount:Nat64, slippageBps:Nat64, zeroForOne:Bool, inputAta:opt Text, outputAta:opt Text, recentBlockhash:Text) -> Result<vec record { signedTxBase64 }, Text>
exp_rollbackEvmNonce : (evmAddress:Text, unusedNonce:Nat) -> Result<(), Text>
```

### Strategy / Automation

```
addStrategyRule : (rule:Rule) -> Result<Nat, Text>  // 1 action
getMyStrategyRules : () -> vec Rule  // FREE
updateStrategyRuleStatus : (ruleId:Nat, status:RuleStatus) -> Result<(), Text>  // 1 action
deleteStrategyRule : (ruleId:Nat) -> Result<(), Text>  // 1 action
getStrategyLogs : () -> vec ExecutionLog  // FREE, query
initAutomation : () -> Text  // 1 action
```

### Developer / Billing

```
registerDeveloperCanister : (canisterId:Principal, appName:Text) -> Result<Text, Text>  // FREE
unregisterDeveloperCanister : (canisterId:Principal) -> Result<(), Text>
getMyDeveloperKey : () -> Result<Text, Text>  // FREE
regenerateDeveloperKey : () -> Result<Text, Text>  // 1 action
validateDeveloperKey : (key:Text) -> Bool  // FREE, query
getMyDeveloperAccount : () -> opt DeveloperAccountV3  // FREE
getMyCanisterUsage : (canisterId:Principal) -> Result<record { ... }, Text>  // FREE
getCanisterDeveloper : (canisterId:Principal) -> opt Principal  // FREE, query
getMyGatewayAccount : () -> UserAccount  // FREE
getMyGatewayDeposits : () -> vec DepositRecord  // FREE
depositGatewayCredits : (tokenSymbol:Text, amount:Nat) -> Result<record { id: Nat }, Text>  // 1 action
purchaseGatewayPackage : (tier:Tier, tokenSymbol:Text) -> Result<record { ... }, Text>  // 1 action
getGatewayPricing : () -> record { acceptedTokens; fees; packages }  // FREE, query
isGatewayEnabled : () -> Bool  // FREE, query
```

### Token / Pool Info (FREE)

```
getSupportedChains : () -> vec Text  // query
getSupportedTokens : () -> vec Text  // query
getSupportedICPTokens : () -> vec record { canisterId; category; name; symbol; type }  // query
getTokenInfo : (symbol:Text) -> opt TokenInfo  // query
getTokenCount : () -> Nat  // query
isTokenSupported : (symbol:Text) -> Bool  // query
getAllPools : () -> vec PoolInfo  // query
getPoolCount : () -> Nat  // query
getPoolStats : () -> record { highLiquidityPools; lowLiquidityPools; mediumLiquidityPools; tokensWithPools; totalPools }  // query
listPoolsForToken : (symbol:Text) -> vec PoolInfo  // query
poolExists : (symbolA:Text, symbolB:Text) -> Bool  // query
hasPathThrough : (symbolA:Text, symbolIntermediary:Text, symbolB:Text) -> Bool  // query
getRoutingSuggestions : (fromSymbol:Text, toSymbol:Text) -> Result<record { ... }, Text>  // query
validateSwapPath : (fromSymbol:Text, toSymbol:Text) -> Result<record { ... }, Text>  // query
getSwapErrorMessage : (fromSymbol:Text, toSymbol:Text) -> Text  // query
getBaseTokens : () -> vec Text  // query
getStablecoins : () -> vec Text  // query
getAllMinswapTokens : () -> vec MinswapTokenConfig  // query
getMinswapTokens : () -> vec MinswapTokenConfig  // query
getICRC1TokenInfo : (ledgerCanisterId:Text) -> Result<record { ... }, Text>
getICRC2Allowance : (owner:Principal, spender:Principal, ledgerCanisterId:Text) -> Result<record { ... }, Text>
```

### CLMM Pools (FREE)

```
listClmmPools : () -> vec ClmmPoolConfig  // query
getClmmPool : (poolId:ClmmPoolId) -> ClmmPoolConfig  // query
isClmmPoolReady : (poolId:ClmmPoolId) -> Bool  // query
```

### SUI Package Config (FREE)

```
getSuiPackageConfig : () -> opt PackageConfig  // query
```

### Address Validation (FREE)

```
isValidBitcoinAddress : (address:Text) -> Bool
isValidLitecoinAddress : (address:Text) -> Bool
isValidSuiAddress : (address:Text) -> Bool  // query
isValidTonAddress : (address:Text) -> Bool
verifyEvmAddressFormat : (address:Text) -> record { isValid; reason }
solanaAccountExists : (address:Text) -> Bool
```

### Cache Management

```
clearAllCaches : () -> ()
clearEvmCache : () -> ()
clearSolanaAddressCache : () -> Text
clearSuiCache : () -> ()
clearTonCache : () -> ()
getEvmCacheSize : () -> Nat  // query
getSuiCacheSize : () -> Nat  // query
getTonCacheSize : () -> Nat  // query
getGasOracleCacheSize : () -> Nat  // query
getTotalCacheSize : () -> record { aptos; bitcoin; cardano; evm; litecoin; near; solana; sui; thorchain; ton; total; tron }  // query
listCachedEvmNonceAddresses : () -> vec Text  // query
```

### Solana Helpers (FREE)

```
getSolanaTokenProgramIds : () -> record { legacySpl; token2022 }  // query
formatSuiTokenType : (tokenType:Text) -> Text  // query
```

### System (FREE)

```
health : () -> Text  // query
version : () -> Text  // query
getSystemLogs : () -> vec Text  // query
getStrategyPriceCacheStats : () -> vec record { Text; record { ageSeconds; price } }  // query
```

### TON Configuration

```
setTonApiKey : (key:Text) -> ()
hasTonApiKey : () -> Bool  // query
verifyTonWalletCode : () -> Result<Text, Text>
```

### Admin / Controller-Only

```
addGatewayPaymentToken : (config:TokenConfig) -> Result<(), Text>
addGatewayWhitelist : (p:Principal) -> Result<(), Text>
removeGatewayWhitelist : (p:Principal) -> Result<(), Text>
setGatewayEnabled : (e:Bool) -> Result<(), Text>
initGateway : () -> Result<Text, Text>
getGatewayRevenue : () -> Result<record { ... }, Text>
getChainStats : (blockchain:Text) -> ChainStats
withdrawGatewayFees : (tokenSymbol:Text, amount:Nat, to:Principal) -> Result<Nat, Text>
setSuiPackageConfig : (packageId:Text, treasuryCapId:Text, moduleName:Text) -> ()
clearStrategyPriceCache : () -> ()
```

### Debug / Test (internal use)

```
debugGetMySolanaAta : (mint:Text) -> record { callerPrincipal; derivedAta; ownerAddress; ownerHex }
debugPdaDerivation : (ownerB58:Text, mintB58:Text) -> record { ... }
debugTokenProgram : (mint:Text) -> record { isLegacy; mint; program }  // query
dumpSolanaBorshWriterBehavior : () -> Text
testAtaDerivation : () -> record { ... }
testSpecificAta : (ownerB58:Text, mintB58:Text) -> record { derivedAta; mint; owner }
testUsdcTokenProgram : () -> Text
simulateSignedSolanaTxBase64 : (txB64:Text) -> Text
getRaydiumSwapMessageDiagnostics : (amountIn:Nat64, minimumAmountOut:Nat64, userSourceAta:Text, userDestAta:Text) -> RaydiumDiagnostics
transform : (args:TransformArgs) -> HttpResponse  // query
transformSuiResponse : (args:TransformArgs) -> HttpResponse  // query
sendTonTestnet : (toAddress:Text, amountNanoton:Nat64, comment:opt Text) -> SendResultTon
```
