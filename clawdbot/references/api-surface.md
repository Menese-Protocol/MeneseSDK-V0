# MeneseSDK Full API Reference

Complete function signatures and type definitions for `urs2a-ziaaa-aaaad-aembq-cai`.

## Table of Contents

1. [Address Types](#address-types)
2. [Send Result Types](#send-result-types)
3. [Swap/Quote Types](#swapquote-types)
4. [DeFi Result Types](#defi-result-types)
5. [Strategy/Automation Types](#strategyautomation-types)
6. [Billing Types](#billing-types)
7. [Bridge Types](#bridge-types)
8. [All Functions by Category](#all-functions-by-category)

## Address Types

```motoko
type SolanaAddressInfo = { address : Text; publicKeyHex : Text; publicKeyBytes : [Nat8] };
type EvmAddressInfo = { evmAddress : Text; publicKeyHex : Text };
type AddressInfo = { bech32Address : Text; hash160Hex : Text; pubKeyHex : Text };  // BTC, LTC, Thor
type CardanoAddressInfo = { bech32Address : Text; addressBytesHex : Text; paymentPubKeyHex : Text; stakePubKeyHex : Text };
type SuiAddressInfo = { suiAddress : Text; publicKeyHex : Text; publicKeyBytes : [Nat8] };
type XrpAddressInfo = { classicAddress : Text; accountIdHex : Text; accountIdBytes : [Nat8]; publicKeyHex : Text };
type TonAddressInfo = { bounceable : Text; nonBounceable : Text; rawAddress : Text; publicKeyHex : Text; stateInitBocBase64 : Text };
type TronAddressInfo = { base58Address : Text; hexAddress : Text; publicKeyHex : Text };
type AptosAddressInfo = { address : Text; publicKeyHex : Text };
type PubKeyInfo = { implicitAccountId : Text; publicKeyBase58 : Text; publicKeyHex : Text };  // NEAR
type CloakAddressInfo = { base58Address : Text; addressBytesHex : Text; hash160Hex : Text; pubKeyHex : Text };
```

## Send Result Types

```motoko
// Generic (Solana, SUI, Aptos, NEAR, LTC, Thor)
type SendResult = { txHash : Text; senderAddress : Text; note : Text };

// Bitcoin + Litecoin (Bitcoin ONLY uses this variant)
type SendResultBtcLtc = { txid : Text; amount : Nat64; fee : Nat64; senderAddress : Text; recipientAddress : Text; note : Text };
// NOTE: Litecoin uses SendResult, NOT SendResultBtcLtc

type SendICPResult = { amount : Nat64; blockHeight : Nat64; fee : Nat64; from : Principal; to : Principal };
type SendICRC1Result = { amount : Nat; blockHeight : Nat; fee : Nat; to : Principal; token : Text };
type SendResultEvm = { expectedTxHash : Text; nonce : Nat; senderAddress : Text; note : Text };
type SendResultCloak = { txHash : Text; txHex : Text; changeValue : Nat64 };

// FLAT records (NOT variants — check .success, don't pattern match #ok/#err)
type SendResultTon = { txHash : Text; bocBase64 : Text; senderAddress : Text; success : Bool; error : ?Text };
type SendResultXrp = { txHash : Text; explorerUrl : Text; message : Text; success : Bool; sequence : Nat32; ledgerUsed : Nat32 };

// SPL Token transfer
type TransferAndSendResult = { txSignature : Text; serializedTxBase64 : Text; blockhash : Text };
```

## Swap/Quote Types

```motoko
// Raydium — FLAT record (NOT a variant)
type RaydiumApiSwapResult = { inputAmount : Text; outputAmount : Text; priceImpactPct : Text; txSignature : Text };

// ICP DEX
type DexId = { #ICPSwap; #KongSwap };
type SwapRequest = { tokenIn : Text; tokenOut : Text; amountIn : Nat; minAmountOut : Nat; slippagePct : Float; preferredDex : ?DexId };
type SwapResultIcp = { amountIn : Nat; amountOut : Nat; dex : DexId; fee : Nat; message : Text; success : Bool; txId : Nat };

// SUI (Cetus)
type SwapResultSui = { success : Bool; txDigest : Text; amountOut : Text; error : ?Text };

// XRP DEX
type SwapResultXrp = { success : Bool; txHash : Text; explorerUrl : Text; message : Text; sourceAmount : Text; destinationAmount : Text };
type TokenAmount = { currency : Text; issuer : Text; value : Text };

// Quotes
type SwapQuote = { amountIn : Text; amountOut : Text; estimatedGas : Nat64; priceImpact : Float; routerData : Text };  // SUI
type AggregatedQuote = { best : SwapQuoteIcp; icpswapQuote : ?SwapQuoteIcp; kongswapQuote : ?SwapQuoteIcp };  // ICP
type SwapQuoteIcp = { amountIn : Nat; amountOut : Nat; dex : DexId; fee : Nat; minAmountOut : Nat; poolId : ?Text; priceImpactPct : Text; rawData : Text; route : [Text]; success : Bool; tokenIn : Text; tokenOut : Text };
```

## DeFi Result Types

```motoko
// Aave V3
type SupplyEthResult = { txHash : Text; aTokenAddress : Text; suppliedAmount : Nat; senderAddress : Text; note : Text };
type WithdrawEthResult = { txHash : Text; withdrawnAmount : Nat; senderAddress : Text; note : Text };
type SupplyTokenResult = { txHash : Text; senderAddress : Text; note : Text };
type WithdrawTokenResult = { txHash : Text; senderAddress : Text; note : Text };

// Lido
type StakeResult = { txHash : Text; senderAddress : Text; note : Text };
type WrapResult = { txHash : Text; senderAddress : Text; note : Text };
type UnwrapResult = { txHash : Text; senderAddress : Text; note : Text };

// Strategy execution
type ExecutionLog = { action : Text; error : ?Text; executedAt : Int; result : Text; ruleId : Nat; success : Bool };
```

## Strategy/Automation Types

```motoko
type ChainType = { #EVM; #Solana; #ICP };

type RuleType = {
  #DCA; #StopLoss; #TakeProfit; #Rebalance;
  #Scheduled; #APYMigration; #LiquidityProvision; #VolatilityTrigger;
};

type RuleStatus = {
  #Active; #Paused; #Cancelled; #Executed;
  #Executing; #Failed; #Draft; #Confirmed; #Ready;
};

type DCAConfig = {
  amountPerInterval : Nat;
  currentInterval : Nat;
  intervalSeconds : Int;
  lastExecutedAt : Int;
  maxIntervals : Nat;
  targetToken : Text;
  totalSpent : Nat;
};

type Rule = {
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
```

## Billing Types

```motoko
type Tier = { #Free; #Developer; #Pro; #Enterprise };

type UserAccount = {
  creditsMicroUsd : Nat;
  tier : Tier;
  actionsRemaining : Nat;
  subscriptionExpiry : ?Int;
  actionsUsed : Nat;
  totalDepositedMicroUsd : Nat;
  createdAt : Int;
};

type DeveloperAccountV3 = {
  owner : Principal;
  canisters : [Principal];
  appName : Text;
  developerKey : Text;
  createdAt : Int;
};
```

## Bridge Types

```motoko
type OutputToken = { #SOL; #Token : Text; #USDC };
type BridgeJobResult = { jobId : Text; userUsdcAta : Text };
```

## All Functions by Category

### Addresses (FREE)

```
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
getAllAddresses : () -> { aptos, bitcoin, cardano, evm, litecoin, near, solana, sui, ton, tron, xrp }
```

### Balances (FREE)

```
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
getThorBalance : () -> [{ amount : Nat; denom : Text }]
getCloakBalance : () -> Result<{ address : Text; balance : Nat64; utxoCount : Nat }, Text>
getTrxBalance : (address:Text) -> Result<Nat64, Text>
getICRC1Balance : (ledgerCanisterId:Text) -> Result<Nat, Text>
getMyTrc20Balance : (contractAddress:Text) -> Result<Nat, Text>
getAllBalances : () -> { aptos, bitcoin, cardano, icp, litecoin, near, solana, thorchain, ton, xrp }
```

### Send — All Chains

```
sendSolTransaction : (to:Text, lamports:Nat64) -> Result<Text, Text>
transferSplToken : (amount:Nat64, sourceAta:Text, destAta:Text) -> TransferAndSendResult
sendEvmNativeTokenAutonomous : (to:Text, value:Nat, rpc:Text, chainId:Nat, ?quoteId:Text) -> Result<SendResultEvm, Text>
sendICP : (to:Principal, amount:Nat64) -> Result<SendICPResult, Text>
sendICRC1 : (to:Principal, amount:Nat, ledger:Text) -> Result<SendICRC1Result, Text>
transferFromICRC2 : (from:Principal, to:Principal, amount:Nat, ledger:Text) -> Result<{amount, blockHeight, from, to, token}, Text>
approveICRC2 : (spender:Principal, amount:Nat, ?expiresAt:Nat64, ledger:Text) -> Result<{amount, blockHeight, spender, token}, Text>
sendBitcoin : (to:Text, sats:Nat64) -> Result<SendResultBtcLtc, Text>
sendBitcoinDynamicFee : (to:Text, sats:Nat64) -> Result<SendResultBtcLtc, Text>
sendBitcoinWithFee : (to:Text, sats:Nat64, feeRate:Nat64) -> Result<SendResultBtcLtc, Text>
sendLitecoin : (to:Text, litoshis:Nat64) -> Result<SendResult, Text>
sendLitecoinWithFee : (to:Text, litoshis:Nat64, feeRate:Nat64) -> Result<SendResult, Text>
sendXrpAutonomous : (dest:Text, amountXrp:Text, ?destTag:Nat32) -> SendResultXrp  // FLAT
sendXrpIOU : (dest:Text, currency:Text, issuer:Text, amount:Text, ?destTag:Nat32) -> SendResultXrp
sendSui : (to:Text, mist:Nat64) -> Result<SendResult, Text>
sendSuiMax : (to:Text) -> Result<SendResult, Text>
transferSuiCoin : (coinObjId:Text, to:Text, amount:Nat64) -> Result<SendResult, Text>
sendTonSimple : (to:Text, nanotons:Nat64) -> SendResultTon  // FLAT
sendTon : (to:Text, nanotons:Nat64, bounce:Bool, ?comment:Text, timeout:Nat32) -> SendResultTon
sendTonWithComment : (to:Text, nanotons:Nat64, comment:Text) -> SendResultTon
sendCardanoTransaction : (to:Text, lovelace:Nat64) -> Result<Text, Text>
sendTrx : (to:Text, sun:Nat64) -> Result<Text, Text>
sendTrc20 : (contract:Text, to:Text, amount:Nat, feeLimit:Nat64) -> Result<Text, Text>
sendAptos : (to:Text, octas:Nat64) -> Result<SendResult, Text>
sendNearTransfer : (to:Text, yocto:Nat) -> Result<Text, Text>
sendNearTransferFromUser : (to:Text, yocto:Nat) -> Result<Text, Text>
sendCloak : (to:Text, amount:Nat64) -> Result<SendResultCloak, Text>
sendThor : (to:Text, amount:Nat64, memo:Text) -> Result<Text, Text>
```

### Swap

```
swapRaydiumApiUser : (inputMint, outputMint, amount:Nat64, slipBps:Nat64, wrapSol:Bool, unwrapSol:Bool, ?inputAta, ?outputAta) -> RaydiumApiSwapResult  // FLAT
swapTokens : (quoteId, from, to, amountIn:Nat, slipBps:Nat, feeOnTransfer:Bool, rpc) -> Result<{expectedTxHash, ?approvalTxHash, nonce, note, path, senderAddress, amountIn, minAmountOut}, Text>
swapTokensMultiHop : (from, to, amountIn:Nat, slipBps:Nat, feeOnTransfer:Bool, chainId:Nat, rpc) -> Result<{...}, Text>
swapETHForUSDC : (ethAmount:Nat, slipBps:Nat, rpc) -> Result<{...}, Text>
swapUSDCForETH : (usdcAmount:Nat, slipBps:Nat, rpc) -> Result<{...}, Text>
executeICPDexSwap : (SwapRequest) -> Result<SwapResultIcp, Text>
executeSuiSwap : (network, from, to, amountIn, minOut) -> SwapResultSui
executeMinswapSwap : (tokenIn, tokenOut, amountIn:Nat64, slippagePct:Float) -> Result<Text, Text>
xrpSwap : (destAmount:TokenAmount, sendMax:TokenAmount, paths, slipBps:Nat) -> SwapResultXrp
```

### Swap Quotes (FREE)

```
getRaydiumQuote : (inputMint, outputMint, amount:Nat64, slipBps:Nat64) -> { inputAmount, minOutputAmount, outputAmount, priceImpactPct, routeInfo, success }
getICPDexQuote : (tokenIn, tokenOut, amountIn:Nat, slipPct:Float) -> AggregatedQuote
getSuiSwapQuote : (network, from, to, amountIn, slipBps:Nat64) -> ?SwapQuote
getMinswapQuote : (tokenIn, tokenOut, amountIn:Nat64, slipPct:Float) -> Result<{...}, Text>
getTokenQuote : (from, to, amountIn:Nat, rpc) -> Result<{amountIn, amountOut, fromToken, toToken, path}, Text>
xrpFindPaths : (destAmount:TokenAmount, sourceCurrencies:[TokenAmount]) -> { destAmount, message, paths, sourceAmount, success }
```

### Bridge

```
quickUltrafastEthToSol : (ethWei:Nat) -> Result<Text, Text>
quickUltrafastUsdcToSol : (usdc:Nat) -> Result<Text, Text>
quickUltrafastEthToToken : (ethWei:Nat, outputMint, slipBps:Nat) -> Result<Text, Text>
quickCctpBridge : (srcChainId:Nat, usdc:Nat, outputToken, fast:Bool, slipBps:Nat, ethRpc) -> Result<BridgeJobResult, Text>
quickSolToEth : (solLamports:Nat64, slipBps:Nat) -> Result<BridgeJobResult, Text>
quickUsdcBridgeSolToEth : (usdc:Nat64) -> Result<BridgeJobResult, Text>
```

### DeFi — Aave V3

```
aaveSupplyEth : (wei:Nat, rpc, ?quoteId) -> Result<SupplyEthResult, Text>
aaveWithdrawEth : (wei:Nat, rpc, ?quoteId) -> Result<WithdrawEthResult, Text>
aaveSupplyToken : (tokenAddr, amount:Nat, rpc, ?quoteId) -> Result<SupplyTokenResult, Text>
aaveWithdrawToken : (tokenAddr, amount:Nat, rpc, ?quoteId) -> Result<WithdrawTokenResult, Text>
getAWethBalance : (user, rpc) -> Result<Nat, Text>
getATokenBalance : (aTokenAddr, user, rpc) -> Result<Nat, Text>
```

### DeFi — Lido

```
stakeEthForStEth : (wei:Nat, rpc, ?quoteId) -> Result<StakeResult, Text>
wrapStEth : (amountStEth:Nat, rpc, ?quoteId) -> Result<WrapResult, Text>
unwrapWstEth : (amountWstEth:Nat, rpc, ?quoteId) -> Result<UnwrapResult, Text>
getStEthBalance : (user, rpc) -> Result<Nat, Text>
getWstEthBalance : (user, rpc) -> Result<Nat, Text>
```

### DeFi — Uniswap V3 Liquidity

```
addLiquidityETH : (tokenSymbol, amountToken:Nat, amountETH:Nat, slipBps:Nat, rpc, ?quoteId) -> Result<{txHash, senderAddress, nonce, tokenAddress, ...}, Text>
addLiquidity : (tokenA, tokenB, amountA:Nat, amountB:Nat, slipBps:Nat, rpc, ?quoteId) -> Result<{...}, Text>
removeLiquidityETH : (tokenSymbol, lpAmount:Nat, slipBps:Nat, feeOnTransfer:Bool, rpc, ?quoteId) -> Result<{...}, Text>
removeLiquidity : (tokenA, tokenB, lpAmount:Nat, slipBps:Nat, rpc, ?quoteId) -> Result<{...}, Text>
getPairAddress : (tokenA, tokenB, rpc) -> Result<{tokenA, tokenB, pairAddress}, Text>
getPoolReserves : (tokenA, tokenB, rpc) -> Result<{pairAddress, reserve0, reserve1, token0, token1, blockTimestampLast}, Text>
```

### Custom EVM Contracts

```
callEvmContractWrite : (contract, selector, argsHexes:[Text], rpc, chainId:Nat, value:Nat, ?quoteId) -> Result<SendResultEvm, Text>
callEvmContractRead : (contract, selector, argsHexes:[Text], rpc) -> Result<Text, Text>  // FREE
```

### Strategy/Automation

```
addStrategyRule : (Rule) -> Result<Nat, Text>
getMyStrategyRules : () -> [Rule]
updateStrategyRuleStatus : (ruleId:Nat, status:RuleStatus) -> Result<(), Text>
deleteStrategyRule : (ruleId:Nat) -> Result<(), Text>
getStrategyLogs : query () -> [ExecutionLog]
initAutomation : () -> Text
```

### Developer/Billing

```
registerDeveloperCanister : (Principal, appName:Text) -> Result<Text, Text>
getMyDeveloperKey : () -> Result<Text, Text>
regenerateDeveloperKey : () -> Result<Text, Text>
validateDeveloperKey : query (key:Text) -> Bool
getMyGatewayAccount : () -> UserAccount
getMyDeveloperAccount : () -> ?DeveloperAccountV3
depositGatewayCredits : (currency:Text, amount:Nat) -> Result<{id:Nat}, Text>
```

### Solana ATA / XRP Trustlines

```
createMySolanaAtaForMint : (mint, ata) -> CreateAtaResult
createMySolanaAtaForMintWithProgram : (mint, ata, tokenProgramId) -> CreateAtaResult
xrpSetTrustline : (currency, issuer, limit) -> TrustSetResult
xrpGetAccountLines : () -> Result<Text, Text>
```

### Utility (FREE)

```
getBitcoinMaxSendAmount : (?feeRate:Nat64) -> Result<{maxAmount, fee, utxoCount}, Text>
getLitecoinMaxSendAmount : (?feeRate:Nat64) -> Result<{maxAmount, fee, utxoCount}, Text>
health : query () -> Text
version : query () -> Text
```
