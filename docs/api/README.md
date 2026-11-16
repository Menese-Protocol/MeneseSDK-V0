# Menese signing gateway: API reference

Every public method of the gateway canister `urs2a-ziaaa-aaaad-aembq-cai`, generated from its live candid interface.

- Module `27b2e7dcc3620e061822cc7e4a9425024a37c3c4d4eb444d4552fc2a3fd56ce5`, candid sha256 `153a399e23b34e8044f4c1fe34f2e4b111cd511b4b832b3b4457756fa51cb88c`, read 2026-11-16.
- 365 methods. Each call either uses one action of the caller's plan or none (`getGatewayPricing` lists the plans).
- Methods reserved to the gateway's controllers, and methods the gateway refuses for every caller, are listed apart at the end.
- Regenerate and check: [`api-reference/`](../../api-reference/README.md).

## Groups

- [Addresses · User Addresses](#addresses-user-addresses) (15)
- [Addresses · For Specific Principal](#addresses-for-specific-principal) (8)
- [Addresses · Canister Addresses](#addresses-canister-addresses) (11)
- [Balances · User Balances](#balances-user-balances) (18)
- [Balances · For Any Address/Principal](#balances-for-any-address-principal) (11)
- [Balances · DeFi Positions](#balances-defi-positions) (5)
- [UTXO Management](#utxo-management) (18)
- [SUI Coins](#sui-coins) (2)
- [TON Account Info](#ton-account-info) (2)
- [NEAR Account Info](#near-account-info) (2)
- [Send · All Chains](#send-all-chains) (31)
- [Swap · Execution](#swap-execution) (12)
- [Swap · Quotes](#swap-quotes) (11)
- [DeFi · Aave V3](#defi-aave-v3) (4)
- [DeFi · Lido Staking](#defi-lido-staking) (3)
- [DeFi · Uniswap V2 Liquidity](#defi-uniswap-v2-liquidity) (6)
- [DeFi · ICP DEX Liquidity](#defi-icp-dex-liquidity) (3)
- [Token Operations](#token-operations) (8)
- [XRP Operations](#xrp-operations) (2)
- [Custom EVM Contracts](#custom-evm-contracts) (2)
- [EVM Signing](#evm-signing) (2)
- [EVM Nonce / Gas Management](#evm-nonce-gas-management) (13)
- [EVM Gas Preflight](#evm-gas-preflight) (7)
- [Sign-Only · Relayer Pattern](#sign-only-relayer-pattern) (9)
- [Sign-Only · Offchain Pattern](#sign-only-offchain-pattern) (2)
- [Sign-Only · exp_ Experimental](#sign-only-exp-experimental) (32)
- [Strategy / Automation](#strategy-automation) (5)
- [Developer / Billing](#developer-billing) (14)
- [Token / Pool Info](#token-pool-info) (21)
- [CLMM Pools](#clmm-pools) (3)
- [SUI Package Config](#sui-package-config) (1)
- [Address Validation](#address-validation) (5)
- [Cache Management](#cache-management) (6)
- [Solana Helpers](#solana-helpers) (2)
- [System](#system) (4)
- [TON Configuration](#ton-configuration) (2)
- [Other calls](#other-calls) (28)
- [Not available](#not-available) (3)
- [Gateway controllers only](#gateway-controllers-only) (32)

## Addresses · User Addresses

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getAllAddresses` | update | one action | `()` | `record { aptos: record { address: text; publicKeyHex: text; }; bitcoin: record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }; cardano: record { addressBytesHex: text; bech32Address: text; paymentPubKeyHex: text; stakePubKeyHex: text; }; evm: record { evmAddress: text; publicKeyHex: text; }; litecoin: record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }; near: record { implicitAccountId: text; publicKeyBase58: text; publicKeyHex: text; }; solana: record { address: text; publicKeyBytes: vec nat8; publicKeyHex: text; }; sui: record { publicKeyBytes: vec nat8; publicKeyHex: text; suiAddress: text; }; thorchain: record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }; ton: record { bounceable: text; nonBounceable: text; publicKeyHex: text; rawAddress: text; stateInitBocBase64: text; }; tron: record { base58Address: text; hexAddress: text; publicKeyHex: text; }; xrp: record { accountIdBytes: vec nat8; accountIdHex: text; classicAddress: text; publicKeyHex: text; }; }` |
| `getMyAptosAddress` | update | one action | `()` | `record { address: text; publicKeyHex: text; }` |
| `getMyBitcoinAddress` | update | one action | `()` | `record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getMyCardanoAddress` | update | no action | `()` | `record { addressBytesHex: text; bech32Address: text; paymentPubKeyHex: text; stakePubKeyHex: text; }` |
| `getMyCloakAddress` | update | one action | `()` | `record { addressBytesHex: text; base58Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getMyEvmAddress` | update | no action | `()` | `record { evmAddress: text; publicKeyHex: text; }` |
| `getMyLitecoinAddress` | update | one action | `()` | `record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getMyNearAddress` | update | one action | `()` | `record { implicitAccountId: text; publicKeyBase58: text; publicKeyHex: text; }` |
| `getMySolanaAddress` | update | no action | `()` | `record { address: text; publicKeyBytes: vec nat8; publicKeyHex: text; }` |
| `getMySolanaAta` | update | one action | `mint: text` | `text` |
| `getMySuiAddress` | update | one action | `()` | `record { publicKeyBytes: vec nat8; publicKeyHex: text; suiAddress: text; }` |
| `getMyThorAddress` | update | one action | `()` | `record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getMyTonAddress` | update | one action | `()` | `record { bounceable: text; nonBounceable: text; publicKeyHex: text; rawAddress: text; stateInitBocBase64: text; }` |
| `getMyXrpAddress` | update | no action | `()` | `record { accountIdBytes: vec nat8; accountIdHex: text; classicAddress: text; publicKeyHex: text; }` |
| `getTronAddress` | update | one action | `()` | `record { base58Address: text; hexAddress: text; publicKeyHex: text; }` |

## Addresses · For Specific Principal

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getBitcoinAddressFor` | update | no action | `user: principal` | `record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getCloakAddressFor` | update | no action | `user: principal` | `record { addressBytesHex: text; base58Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getEvmAddressFor` | update | no action | `user: principal` | `record { evmAddress: text; publicKeyHex: text; }` |
| `getLitecoinAddressFor` | update | no action | `user: principal` | `record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getSolanaAddressFor` | update | no action | `user: principal` | `record { address: text; publicKeyBytes: vec nat8; publicKeyHex: text; }` |
| `getSuiAddressFor` | update | no action | `user: principal` | `record { publicKeyBytes: vec nat8; publicKeyHex: text; suiAddress: text; }` |
| `getTonAddressFor` | update | no action | `user: principal` | `record { bounceable: text; nonBounceable: text; publicKeyHex: text; rawAddress: text; stateInitBocBase64: text; }` |
| `getXrpAddressFor` | update | no action | `user: principal` | `record { accountIdBytes: vec nat8; accountIdHex: text; classicAddress: text; publicKeyHex: text; }` |

## Addresses · Canister Addresses

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getCanisterBitcoinAddress` | update | no action | `()` | `record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getCanisterCloakAddress` | update | no action | `()` | `record { addressBytesHex: text; base58Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getCanisterEvmAddress` | update | no action | `()` | `record { evmAddress: text; publicKeyHex: text; }` |
| `getCanisterLitecoinAddress` | update | no action | `()` | `record { bech32Address: text; hash160Hex: text; pubKeyHex: text; }` |
| `getCanisterNearBalance` | update | no action | `()` | `nat` |
| `getCanisterNearPubKey` | update | no action | `()` | `record { implicitAccountId: text; publicKeyBase58: text; publicKeyHex: text; }` |
| `getCanisterSolanaAddress` | update | no action | `()` | `record { address: text; publicKeyBytes: vec nat8; publicKeyHex: text; }` |
| `getCanisterSuiAddress` | update | no action | `()` | `record { publicKeyBytes: vec nat8; publicKeyHex: text; suiAddress: text; }` |
| `getCanisterTonAddress` | update | no action | `()` | `record { bounceable: text; nonBounceable: text; publicKeyHex: text; rawAddress: text; stateInitBocBase64: text; }` |
| `getCanisterTronAddress` | update | no action | `()` | `record { base58Address: text; hexAddress: text; publicKeyHex: text; }` |
| `getCanisterXrpAddress` | update | no action | `()` | `record { accountIdBytes: vec nat8; accountIdHex: text; classicAddress: text; publicKeyHex: text; }` |

## Balances · User Balances

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getAllBalances` | update | one action | `()` | `record { aptos: variant { err: text; ok: nat64; }; bitcoin: nat64; cardano: variant { err: text; ok: nat64; }; icp: variant { err: text; ok: nat64; }; litecoin: nat64; near: nat; solana: variant { err: text; ok: nat64; }; thorchain: vec record { amount: nat; denom: text; }; ton: variant { err: text; ok: nat64; }; xrp: variant { err: text; ok: text; }; }` |
| `getAptosBalance` | update | one action | `()` | `variant { err: text; ok: nat64; }` |
| `getBitcoinBalance` | update | one action | `()` | `nat64` |
| `getCardanoBalance` | update | one action | `()` | `variant { err: text; ok: nat64; }` |
| `getCardanoWalletBalance` | update | one action | `()` | `variant { err: text; ok: record { lovelace: nat64; tokens: vec TokenBalance; }; }` |
| `getCloakBalance` | update | one action | `()` | `variant { err: text; ok: record { address: text; balance: nat64; utxoCount: nat; }; }` |
| `getICPBalance` | update | one action | `()` | `variant { err: text; ok: nat64; }` |
| `getICRC1Balance` | update | one action | `ledgerCanisterId: text` | `variant { err: text; ok: nat; }` |
| `getLitecoinBalance` | update | one action | `()` | `nat64` |
| `getMyEvmBalance` | update | one action | `rpcEndpoint: text` | `variant { err: text; ok: nat; }` |
| `getMyNearBalance` | update | one action | `()` | `nat` |
| `getMySolanaBalance` | update | one action | `()` | `variant { err: text; ok: nat64; }` |
| `getMySuiBalance` | update | one action | `()` | `nat64` |
| `getMyTonBalance` | update | one action | `()` | `variant { err: text; ok: nat64; }` |
| `getMyTrc20Balance` | update | one action | `contractAddress: text` | `variant { err: text; ok: nat; }` |
| `getMyXrpBalance` | update | one action | `()` | `variant { err: text; ok: text; }` |
| `getThorBalance` | update | one action | `()` | `vec record { amount: nat; denom: text; }` |
| `getTrxBalance` | update | no action | `address: text` | `variant { err: text; ok: nat64; }` |

## Balances · For Any Address/Principal

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getBitcoinBalanceFor` | update | no action | `address: text` | `nat64` |
| `getCloakBalanceFor` | update | no action | `address: text` | `variant { err: text; ok: record { address: text; balance: nat64; utxoCount: nat; }; }` |
| `getEvmBalance` | update | no action | `address: text, rpcEndpoint: text` | `opt nat` |
| `getICPBalanceFor` | update | no action | `"principal": principal` | `variant { err: text; ok: nat64; }` |
| `getICRC1BalanceFor` | update | no action | `"principal": principal, ledgerCanisterId: text` | `variant { err: text; ok: nat; }` |
| `getICRC1Balances` | update | one action | `canisterIds: vec text` | `vec record { text; variant { err: text; ok: nat; }; }` |
| `getLitecoinBalanceFor` | update | no action | `address: text` | `nat64` |
| `getSolanaBalance` | update | no action | `address: text` | `variant { err: text; ok: nat64; }` |
| `getSuiBalanceFor` | update | no action | `address: text` | `nat64` |
| `getTonBalanceFor` | update | no action | `address: text` | `variant { err: text; ok: nat64; }` |
| `getTrc20Balance` | update | no action | `ownerAddress: text, contractAddress: text` | `variant { err: text; ok: nat; }` |

## Balances · DeFi Positions

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getATokenBalance` | update | no action | `aTokenAddress: text, user: text, rpcEndpoint: text` | `variant { err: text; ok: nat; }` |
| `getAWethBalance` | update | no action | `user: text, rpcEndpoint: text` | `variant { err: text; ok: nat; }` |
| `getStEthAllowance` | update | no action | `owner: text, rpcEndpoint: text` | `variant { err: text; ok: nat; }` |
| `getStEthBalance` | update | no action | `user: text, rpcEndpoint: text` | `variant { err: text; ok: nat; }` |
| `getWstEthBalance` | update | no action | `user: text, rpcEndpoint: text` | `variant { err: text; ok: nat; }` |

## UTXO Management

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `cleanupBitcoinReservations` | update | no action | `()` | `nat` |
| `cleanupLitecoinReservations` | update | no action | `()` | `nat` |
| `estimateBitcoinFee` | update | no action | `inputCount: nat, outputCount: nat, feeRate: opt nat64` | `nat64` |
| `getBitcoinDustLimit` | query | no action | `()` | `nat64` |
| `getBitcoinFeePercentiles` | update | no action | `()` | `vec nat64` |
| `getBitcoinMaxSendAmount` | update | one action | `feeRate: opt nat64` | `variant { err: text; ok: record { fee: nat64; maxAmount: nat64; utxoCount: nat; }; }` |
| `getBitcoinRecommendedFeeRate` | update | no action | `()` | `nat64` |
| `getBitcoinReservationCount` | query | no action | `()` | `nat` |
| `getBitcoinUTXOs` | update | one action | `()` | `vec record { scriptPubKey: vec nat8; txid: text; value: nat64; vout: nat32; }` |
| `getBitcoinUTXOsFor` | update | no action | `address: text` | `vec record { scriptPubKey: vec nat8; txid: text; value: nat64; vout: nat32; }` |
| `getCloakUTXOs` | update | one action | `()` | `variant { err: text; ok: vec record { outputIndex: nat32; scriptPubKey: vec nat8; txHash: text; value: nat64; }; }` |
| `getLitecoinDustLimit` | query | no action | `()` | `nat64` |
| `getLitecoinMaxSendAmount` | update | one action | `feeRate: opt nat64` | `variant { err: text; ok: record { fee: nat64; maxAmount: nat64; utxoCount: nat; }; }` |
| `getLitecoinReservationCount` | query | no action | `()` | `nat` |
| `getLitecoinUTXOs` | update | one action | `()` | `vec record { scriptPubKey: vec nat8; txid: text; value: nat64; vout: nat32; }` |
| `getLitecoinUTXOsFor` | update | no action | `address: text` | `vec record { scriptPubKey: vec nat8; txid: text; value: nat64; vout: nat32; }` |
| `syncBitcoinUTXOs` | update | one action | `()` | `nat` |
| `syncLitecoinUTXOs` | update | one action | `()` | `nat` |

## SUI Coins

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getMySuiCoins` | update | one action | `()` | `vec record { balance: nat64; digest: text; objectId: text; version: nat64; }` |
| `getSuiCoinsFor` | update | no action | `address: text` | `vec record { balance: nat64; digest: text; objectId: text; version: nat64; }` |

## TON Account Info

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getMyTonAccountInfo` | update | one action | `()` | `record { balance: nat64; seqno: nat32; state: text; }` |
| `getTonAccountInfoFor` | update | no action | `address: text` | `record { balance: nat64; seqno: nat32; state: text; }` |

## NEAR Account Info

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getMyNearPubKey` | update | one action | `()` | `record { implicitAccountId: text; publicKeyBase58: text; publicKeyHex: text; }` |
| `getNearUserAccountInfo` | update | one action | `()` | `record { accountId: text; pkBase58: text; pkBytes: vec nat8; }` |

## Send · All Chains

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `approveICRC2`<br>Approves from the caller's ICRC account inside the gateway. | update | one action | `spender: principal, amount: nat, expiresAt: opt nat64, ledgerCanisterId: text` | `variant { err: text; ok: record { amount: nat; blockHeight: nat; spender: principal; token: text; }; }` |
| `getMyIcrcWallet`<br>The caller's ICRC account inside the gateway: owner, subaccount and ICP account id. Deposit ICP or ICRC-1 tokens there before sendICP, sendICRC1 or executeICPDexSwap. | query | no action | `()` | `record { icpAccountId: blob; owner: principal; subaccount: blob; }` |
| `sendAptos` | update | one action | `toAddress: text, amount: nat64` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `sendBitcoin` | update | one action | `toAddress: text, amount: nat64` | `variant { err: text; ok: record { amount: nat64; fee: nat64; note: text; recipientAddress: text; senderAddress: text; txid: text; }; }` |
| `sendBitcoinDynamicFee` | update | one action | `toAddress: text, amount: nat64` | `variant { err: text; ok: record { amount: nat64; fee: nat64; note: text; recipientAddress: text; senderAddress: text; txid: text; }; }` |
| `sendBitcoinWithFee` | update | one action | `toAddress: text, amount: nat64, feeRate: nat64` | `variant { err: text; ok: record { amount: nat64; fee: nat64; note: text; recipientAddress: text; senderAddress: text; txid: text; }; }` |
| `sendBitcoinWithNetwork` | update | one action | `toAddress: text, amount: nat64, feeRate: opt nat64, network: variant { mainnet; regtest; testnet; }` | `variant { err: text; ok: record { amount: nat64; fee: nat64; note: text; recipientAddress: text; senderAddress: text; txid: text; }; }` |
| `sendCardanoTransaction` | update | one action | `toAddress: text, amount: nat64` | `variant { err: text; ok: text; }` |
| `sendCloak` | update | one action | `toAddress: text, amount: nat64` | `variant { err: text; ok: record { changeValue: nat64; txHash: text; txHex: text; }; }` |
| `sendEvmNativeTokenAutonomous` | update | one action | `to: text, value: nat, rpcEndpoint: text, chainId: nat, quoteId: opt text` | `variant { err: text; ok: record { expectedTxHash: text; nonce: nat; note: text; senderAddress: text; }; }` |
| `sendICP`<br>Sends from the caller's ICRC account inside the gateway. Fund it first: getMyIcrcWallet gives its owner, subaccount and ICP account id. | update | one action | `to: principal, amount: nat64` | `variant { err: text; ok: record { amount: nat64; blockHeight: nat64; fee: nat64; from: principal; to: principal; }; }` |
| `sendICRC1`<br>Sends from the caller's ICRC account inside the gateway. Fund it first at the account getMyIcrcWallet gives. | update | one action | `to: principal, amount: nat, ledgerCanisterId: text` | `variant { err: text; ok: record { amount: nat; blockHeight: nat; fee: nat; to: principal; token: text; }; }` |
| `sendLitecoin` | update | one action | `toAddress: text, amount: nat64` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `sendLitecoinWithFee` | update | one action | `toAddress: text, amount: nat64, feeRate: nat64` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `sendNearTransferFromUser` | update | one action | `receiverId: text, amount: nat` | `variant { err: text; ok: text; }` |
| `sendSolTransaction` | update | one action | `toAddress: text, lamports: nat64` | `variant { err: text; ok: text; }` |
| `sendSui` | update | one action | `recipientAddress: text, amount: nat64` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `sendSuiMax` | update | one action | `recipientAddress: text` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `sendSuiWithNetwork` | update | one action | `recipientAddress: text, amount: nat64, network: variant { devnet; mainnet; testnet; }` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `sendThor` | update | one action | `toAddress: text, amount: nat64, memo: text` | `variant { err: text; ok: text; }` |
| `sendTon` | update | one action | `toAddress: text, amountNanoton: nat64, bounce: bool, comment: opt text, timeoutSeconds: nat32` | `record { bocBase64: text; error: opt text; senderAddress: text; success: bool; txHash: text; }` |
| `sendTonSimple` | update | one action | `toAddress: text, amountNanoton: nat64` | `record { bocBase64: text; error: opt text; senderAddress: text; success: bool; txHash: text; }` |
| `sendTonTestnet` | update | one action | `toAddress: text, amountNanoton: nat64, comment: opt text` | `record { bocBase64: text; error: opt text; senderAddress: text; success: bool; txHash: text; }` |
| `sendTonWithComment` | update | one action | `toAddress: text, amountNanoton: nat64, comment: text` | `record { bocBase64: text; error: opt text; senderAddress: text; success: bool; txHash: text; }` |
| `sendTrc20` | update | one action | `contractAddress: text, toAddress: text, amount: nat, feeLimit: nat64` | `variant { err: text; ok: text; }` |
| `sendTrx` | update | one action | `toAddress: text, amount: nat64` | `variant { err: text; ok: text; }` |
| `sendXrpAutonomous` | update | one action | `destAddress: text, amountXrp: text, destinationTag: opt nat32` | `record { explorerUrl: text; ledgerUsed: nat32; message: text; sequence: nat32; success: bool; txHash: text; }` |
| `sendXrpIOU` | update | one action | `destAddress: text, currency: text, issuer: text, amount: text, destinationTag: opt nat32` | `record { explorerUrl: text; ledgerUsed: nat32; message: text; sequence: nat32; success: bool; txHash: text; }` |
| `transferFromICRC2`<br>Only from the caller's own account; any other `from` is refused before an action is charged. | update | one action | `from: principal, to: principal, amount: nat, ledgerCanisterId: text` | `variant { err: text; ok: record { amount: nat; blockHeight: nat; from: principal; to: principal; token: text; }; }` |
| `transferSplToken` | update | one action | `amount: nat64, sourceAta: text, destinationAta: text` | `record { blockhash: text; serializedTxBase64: text; txSignature: text; }` |
| `transferSuiCoin` | update | one action | `coinObjectId: text, recipientAddress: text, amount: nat64` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |

## Swap · Execution

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `executeICPDexSwap`<br>Runs on ICPSwap only. A request for KongSwap is refused: "KongSwap is no longer supported". The swap is paid from, and pays into, the caller's ICRC account inside the gateway (see getMyIcrcWallet). | update | one action | `request: record { amountIn: nat; minAmountOut: nat; preferredDex: opt DexId; slippagePct: float64; tokenIn: text; tokenOut: text; }` | `variant { err: text; ok: record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; message: text; success: bool; txId: nat; }; }` |
| `executeMinswapSwap` | update | one action | `tokenIn: text, tokenOut: text, amountIn: nat64, slippagePct: float64` | `variant { err: text; ok: text; }` |
| `executeSuiSwap` | update | one action | `network: variant { devnet; mainnet; testnet; }, fromToken: text, toToken: text, amountIn: text, minAmountOut: text` | `record { amountOut: text; error: opt text; success: bool; txDigest: text; }` |
| `getMyIcpSwapOwed`<br>Amounts a failed or incomplete ICPSwap swap still owes the caller. | query | no action | `()` | `vec record { amount: nat; pool: text; stage: variant { poolBalance; poolSubaccount; }; token: text; }` |
| `retryMyIcpSwapPayout`<br>Tries again to pay the caller what getMyIcpSwapOwed lists. | update | no action | `()` | `record { paid: nat; stillHeld: nat; }` |
| `swapClmmUser` | update | one action | `poolId: variant { CRCLX_USDC; CRCLX_WSOL; GOOGLX_USDC; QQQX_WSOL; TSLAX_USDC; TSLAX_WSOL; USD1_USDC; }, amount: nat64, slippageBps: nat64, zeroForOne: bool, inputAta: opt text, outputAta: opt text` | `record { outputAmount: text; priceImpactPct: text; txSignature: text; }` |
| `swapETHForUSDC` | update | one action | `ethAmount: nat, slippageBps: nat, rpcEndpoint: text` | `variant { err: text; ok: record { ethIn: nat; expectedTxHash: text; minUSDCOut: nat; nonce: nat; note: text; senderAddress: text; }; }` |
| `swapRaydiumApiUser` | update | one action | `inputMint: text, outputMint: text, amount: nat64, slippageBps: nat64, wrapSol: bool, unwrapSol: bool, inputAta: opt text, outputAta: opt text` | `record { inputAmount: text; outputAmount: text; priceImpactPct: text; txSignature: text; }` |
| `swapTokens` | update | one action | `quoteId: text, fromSymbol: text, toSymbol: text, amountIn: nat, slippageBps: nat, useFeeOnTransfer: bool, rpcEndpoint: text` | `variant { err: text; ok: record { amountIn: nat; approvalTxHash: opt text; expectedTxHash: text; minAmountOut: nat; nonce: nat; note: text; path: vec text; senderAddress: text; }; }` |
| `swapTokensMultiHop` | update | one action | `fromSymbol: text, toSymbol: text, amountIn: nat, slippageBps: nat, useFeeOnTransfer: bool, chainId: nat, rpcEndpoint: text` | `variant { err: text; ok: record { amountIn: nat; approvalTxHash: opt text; expectedTxHash: text; isDirect: bool; minAmountOut: nat; nonce: nat; note: text; path: vec text; pathSymbols: vec text; senderAddress: text; }; }` |
| `swapUSDCForETH` | update | one action | `usdcAmount: nat, slippageBps: nat, rpcEndpoint: text` | `variant { err: text; ok: record { approvalTxHash: opt text; expectedTxHash: text; minETHOut: nat; nonce: nat; note: text; senderAddress: text; usdcIn: nat; }; }` |
| `xrpSwap` | update | one action | `destinationAmount: record { currency: text; issuer: text; value: text; }, sendMaxAmount: record { currency: text; issuer: text; value: text; }, paths: text, slippageBps: nat` | `record { destinationAmount: text; explorerUrl: text; message: text; sourceAmount: text; success: bool; txHash: text; }` |

## Swap · Quotes

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `calculateSuiMinAmountOut` | query | no action | `amountOut: text, slippageBps: nat64` | `text` |
| `getClmmQuote` | update | no action | `poolId: variant { CRCLX_USDC; CRCLX_WSOL; GOOGLX_USDC; QQQX_WSOL; TSLAX_USDC; TSLAX_WSOL; USD1_USDC; }, amount: nat64, slippageBps: nat64, zeroForOne: bool` | `record { inputAmount: text; otherAmountThreshold: text; outputAmount: text; priceImpactPct: text; rawJson: text; success: bool; }` |
| `getETHQuote` | update | no action | `usdcAmount: nat, rpcEndpoint: text` | `variant { err: text; ok: record { ethOut: nat; priceImpact: text; usdcIn: nat; }; }` |
| `getICPDexQuote`<br>Quotes ICPSwap only; KongSwap is no longer supported. | update | one action | `tokenIn: text, tokenOut: text, amountIn: nat, slippagePct: float64` | `record { best: record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; minAmountOut: nat; poolId: opt text; priceImpactPct: text; rawData: text; route: vec text; success: bool; tokenIn: text; tokenOut: text; }; icpswapQuote: opt record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; minAmountOut: nat; poolId: opt text; priceImpactPct: text; rawData: text; route: vec text; success: bool; tokenIn: text; tokenOut: text; }; kongswapQuote: opt record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; minAmountOut: nat; poolId: opt text; priceImpactPct: text; rawData: text; route: vec text; success: bool; tokenIn: text; tokenOut: text; }; timestamp: int; }` |
| `getMinswapQuote` | update | one action | `tokenIn: text, tokenOut: text, amountIn: nat64, slippagePct: float64` | `variant { err: text; ok: record { aggregator_fee: text; amount_in: text; amount_out: text; avg_price_impact: text; min_amount_out: text; paths_json: text; rawJson: text; success: bool; token_in: text; token_out: text; total_dex_fee: text; total_lp_fee: text; }; }` |
| `getRaydiumQuote` | update | no action | `inputMint: text, outputMint: text, amount: nat64, slippageBps: nat64` | `record { inputAmount: text; minOutputAmount: text; outputAmount: text; priceImpactPct: text; routeInfo: text; success: bool; }` |
| `getSuiSwapQuote` | update | no action | `network: variant { devnet; mainnet; testnet; }, fromToken: text, toToken: text, amountIn: text, slippageBps: nat64` | `opt record { amountIn: text; amountOut: text; estimatedGas: nat64; priceImpact: float64; routerData: text; }` |
| `getTokenQuote` | update | no action | `fromSymbol: text, toSymbol: text, amountIn: nat, rpcEndpoint: text` | `variant { err: text; ok: record { amountIn: nat; amountOut: nat; fromToken: text; path: vec text; toToken: text; }; }` |
| `getTokenQuoteMultiHop` | update | no action | `fromSymbol: text, toSymbol: text, amountIn: nat, rpcEndpoint: text` | `variant { err: text; ok: record { amountIn: nat; amountOut: nat; fromToken: text; isDirect: bool; path: vec text; pathSymbols: vec text; routeNote: text; toToken: text; }; }` |
| `getUSDCQuote` | update | no action | `ethAmount: nat, rpcEndpoint: text` | `variant { err: text; ok: record { ethIn: nat; priceImpact: text; usdcOut: nat; }; }` |
| `xrpFindPaths` | update | one action | `destinationAmount: record { currency: text; issuer: text; value: text; }, sourceCurrencies: vec record { currency: text; issuer: text; value: text; }` | `record { destinationAmount: record { currency: text; issuer: text; value: text; }; message: text; paths: text; sourceAmount: record { currency: text; issuer: text; value: text; }; success: bool; }` |

## DeFi · Aave V3

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `aaveSupplyEth` | update | one action | `ethAmountWei: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { ethSupplied: nat; nonce: nat; note: text; senderAddress: text; txHash: text; }; }` |
| `aaveSupplyToken` | update | one action | `tokenAddress: text, amount: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { amountSupplied: nat; approvalTxHash: opt text; nonce: nat; note: text; senderAddress: text; tokenAddress: text; txHash: text; }; }` |
| `aaveWithdrawEth` | update | one action | `amountWei: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { approvalTxHash: opt text; ethWithdrawn: nat; nonce: nat; note: text; senderAddress: text; txHash: text; }; }` |
| `aaveWithdrawToken` | update | one action | `tokenAddress: text, amount: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { amountWithdrawn: nat; nonce: nat; note: text; senderAddress: text; tokenAddress: text; txHash: text; }; }` |

## DeFi · Lido Staking

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `stakeEthForStEth` | update | one action | `ethAmountWei: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { ethStaked: nat; nonce: nat; note: text; senderAddress: text; txHash: text; }; }` |
| `unwrapWstEth` | update | one action | `amountWstEth: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { nonce: nat; note: text; senderAddress: text; txHash: text; wstEthUnwrapped: nat; }; }` |
| `wrapStEth` | update | one action | `amountStEth: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { approvalTxHash: opt text; nonce: nat; note: text; senderAddress: text; stEthWrapped: nat; txHash: text; }; }` |

## DeFi · Uniswap V2 Liquidity

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `addLiquidity` | update | one action | `tokenASymbol: text, tokenBSymbol: text, amountADesired: nat, amountBDesired: nat, slippageBps: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { amountADesired: nat; amountAMin: nat; amountBDesired: nat; amountBMin: nat; approvalTxHashA: opt text; approvalTxHashB: opt text; nonce: nat; note: text; senderAddress: text; tokenA: text; tokenB: text; txHash: text; }; }` |
| `addLiquidityETH` | update | one action | `tokenSymbol: text, amountTokenDesired: nat, amountETHDesired: nat, slippageBps: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { amountETHDesired: nat; amountETHMin: nat; amountTokenDesired: nat; amountTokenMin: nat; approvalTxHash: opt text; nonce: nat; note: text; senderAddress: text; tokenAddress: text; txHash: text; }; }` |
| `getPairAddress` | update | no action | `tokenA: text, tokenB: text, rpcEndpoint: text` | `variant { err: text; ok: record { pairAddress: text; tokenA: text; tokenB: text; }; }` |
| `getPoolReserves` | update | no action | `tokenA: text, tokenB: text, rpcEndpoint: text` | `variant { err: text; ok: record { blockTimestampLast: nat; pairAddress: text; reserve0: nat; reserve1: nat; token0: text; token1: text; }; }` |
| `removeLiquidity` | update | one action | `tokenASymbol: text, tokenBSymbol: text, lpTokenAmount: nat, slippageBps: nat, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { approvalTxHash: opt text; lpTokensBurned: nat; minAmountAOut: nat; minAmountBOut: nat; nonce: nat; note: text; senderAddress: text; tokenA: text; tokenB: text; txHash: text; }; }` |
| `removeLiquidityETH` | update | one action | `tokenSymbol: text, lpTokenAmount: nat, slippageBps: nat, useFeeOnTransfer: bool, rpcEndpoint: text, quoteId: opt text` | `variant { err: text; ok: record { approvalTxHash: opt text; lpTokensBurned: nat; minETHOut: nat; minTokenOut: nat; nonce: nat; note: text; senderAddress: text; tokenAddress: text; txHash: text; }; }` |

## DeFi · ICP DEX Liquidity

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getICPDexPools` | update | no action | `()` | `vec record { apr: opt float64; dex: variant { ICPSwap; KongSwap; }; fee: nat; poolId: text; reserve0: nat; reserve1: nat; token0: text; token0Symbol: text; token1: text; token1Symbol: text; tvl: opt nat; volume24h: opt nat; }` |
| `getICPDexTokens` | update | no action | `()` | `vec record { availableOn: vec variant { ICPSwap; KongSwap; }; canisterId: text; category: opt text; decimals: nat8; fee: nat; logo: opt text; name: text; standard: variant { DIP20; ICRC1; ICRC2; }; symbol: text; }` |
| `getICPRebalanceRecommendations` | update | one action | `preferences: record { autoCompound: bool; maxImpermanentLoss: opt float64; minApy: opt float64; riskTolerance: text; targetCategories: vec text; }, tokenBalances: vec record { text; nat; }, pools: opt vec record { apr: opt float64; dex: DexId; fee: nat; poolId: text; reserve0: nat; reserve1: nat; token0: text; token0Symbol: text; token1: text; token1Symbol: text; tvl: opt nat; volume24h: opt nat; }` | `vec record { action: variant { AddLiquidity; Compound; RemoveLiquidity; Swap; }; amount: nat; confidence: float64; currentApy: opt float64; estimatedApy: opt float64; estimatedGasUsd: opt float64; fromSymbol: text; fromToken: text; id: text; impermanentLossRisk: variant { High; Low; Medium; }; reason: text; toSymbol: text; toToken: text; }` |

## Token Operations

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `burnSuiTokens` | update | one action | `coinToBurnId: text, icpRecipient: principal, nonce: nat64` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `createMyAta` | update | one action | `mintBase58: text, ataBase58: text` | `variant { err: text; ok: record { ata: text; blockhash: text; mint: text; owner: text; txSignature: text; }; }` |
| `createMySolanaAtaForMint` | update | one action | `mintBase58: text, ataBase58: text` | `record { ata: text; blockhash: text; mint: text; owner: text; txSignature: text; }` |
| `createMySolanaAtaForMintWithProgram` | update | one action | `mintBase58: text, ataBase58: text, tokenProgramId: text` | `record { ata: text; blockhash: text; mint: text; owner: text; txSignature: text; }` |
| `lockMyTokens` | update | one action | `amount: nat64, sourceAtaBase58: text` | `record { blockhash: text; icrcBlockIndex: opt nat; icrcMinted: bool; message: text; serializedTxBase64: text; txSignature: text; }` |
| `mintSuiTokens` | update | one action | `recipientAddress: text, amount: nat64` | `variant { err: text; ok: record { note: text; senderAddress: text; txHash: text; }; }` |
| `registerCloakDeposit` | update | one action | `txHash: text` | `variant { err: text; ok: text; }` |
| `xrpSetTrustline` | update | one action | `currency: text, issuer: text, limit: text` | `record { explorerUrl: text; message: text; success: bool; txHash: text; }` |

## XRP Operations

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `xrpGetAccountLines` | update | one action | `()` | `variant { err: text; ok: text; }` |
| `xrpGetAmmInfo` | update | no action | `asset1Currency: text, asset1Issuer: text, asset2Currency: text, asset2Issuer: text` | `variant { err: text; ok: text; }` |

## Custom EVM Contracts

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `callEvmContractRead` | update | one action | `contract: text, functionSelector: text, argsHexes: vec text, rpcEndpoint: text` | `variant { err: text; ok: text; }` |
| `callEvmContractWrite` | update | one action | `contract: text, functionSelector: text, argsHexes: vec text, rpcEndpoint: text, chainId: nat, value: nat, quoteId: opt text` | `variant { err: text; ok: record { expectedTxHash: text; nonce: nat; note: text; senderAddress: text; }; }` |

## EVM Signing

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `buildAndSignEvmTransaction` | update | one action | `to: text, value: nat, nonce: nat, gasLimit: nat, gasPrice: nat, chainId: nat` | `record { rawTxHex_v0: text; rawTxHex_v1: text; signature: text; txHash: text; }` |
| `buildAndSignEvmTxWithData` | update | one action | `to: text, value: nat, data: vec nat8, nonce: nat, gasLimit: nat, gasPrice: nat, chainId: nat` | `record { rawTxHex_v0: text; rawTxHex_v1: text; signature: text; txHash: text; }` |

## EVM Nonce / Gas Management

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `exp_rollbackEvmNonce` | update | no action | `evmAddress: text, unusedNonce: nat` | `variant { err: text; ok; }` |
| `forceClearEvmNonceState` | update | one action | `()` | `()` |
| `forceReleaseEvmNonceLock` | update | one action | `()` | `bool` |
| `forceSetEvmNonce` | update | one action | `nonce: nat` | `()` |
| `getEvmNonceState` | update | one action | `()` | `opt record { cachedNonce: nat; isLocked: bool; lockAgeSeconds: int; updatedAt: int; }` |
| `getEvmTransactionReceipt` | update | no action | `txHash: text, rpcEndpoint: text` | `opt record { blockNumber: text; gasUsed: text; status: nat; }` |
| `hasEvmNonceState` | update | one action | `()` | `bool` |
| `invalidateEvmNonce` | update | one action | `()` | `variant { err: text; ok; }` |
| `invalidateGasQuote` | update | no action | `quoteId: text` | `()` |
| `isEvmNonceLocked` | update | one action | `()` | `bool` |
| `resyncEvmNonce` | update | one action | `rpcEndpoint: text` | `variant { err: text; ok: nat; }` |
| `verifyEvmAddressFormat` | update | no action | `address: text` | `record { isValid: bool; reason: text; }` |
| `verifyLastEvmTransaction` | update | one action | `rpcEndpoint: text` | `record { currentNonce: nat; increased: bool; note: text; }` |

## EVM Gas Preflight

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `preflightEvmAddLiquidityGas` | update | one action | `quoteId: text, valueWei: nat, rpcEndpoint: text, chainId: opt nat` | `variant { err: text; ok: record { bufferedFeeWei: nat; bufferedGasPriceWei: nat; caller: principal; chainId: opt nat; estimatedFeeWei: nat; expiresAtNs: int; fetchedAtNs: int; gasLimit: nat; gasPriceWei: nat; op: OperationType; quoteId: text; rpcEndpoint: text; tier: GasTier; tierLabel: text; valueWei: nat; }; }` |
| `preflightEvmApproveGas` | update | one action | `quoteId: text, rpcEndpoint: text, chainId: opt nat` | `variant { err: text; ok: record { bufferedFeeWei: nat; bufferedGasPriceWei: nat; caller: principal; chainId: opt nat; estimatedFeeWei: nat; expiresAtNs: int; fetchedAtNs: int; gasLimit: nat; gasPriceWei: nat; op: OperationType; quoteId: text; rpcEndpoint: text; tier: GasTier; tierLabel: text; valueWei: nat; }; }` |
| `preflightEvmContractWriteGas` | update | one action | `quoteId: text, valueWei: nat, rpcEndpoint: text, chainId: opt nat` | `variant { err: text; ok: record { bufferedFeeWei: nat; bufferedGasPriceWei: nat; caller: principal; chainId: opt nat; estimatedFeeWei: nat; expiresAtNs: int; fetchedAtNs: int; gasLimit: nat; gasPriceWei: nat; op: OperationType; quoteId: text; rpcEndpoint: text; tier: GasTier; tierLabel: text; valueWei: nat; }; }` |
| `preflightEvmRemoveLiquidityGas` | update | one action | `quoteId: text, rpcEndpoint: text, chainId: opt nat` | `variant { err: text; ok: record { bufferedFeeWei: nat; bufferedGasPriceWei: nat; caller: principal; chainId: opt nat; estimatedFeeWei: nat; expiresAtNs: int; fetchedAtNs: int; gasLimit: nat; gasPriceWei: nat; op: OperationType; quoteId: text; rpcEndpoint: text; tier: GasTier; tierLabel: text; valueWei: nat; }; }` |
| `preflightEvmSendGas` | update | one action | `quoteId: text, valueWei: nat, rpcEndpoint: text, chainId: nat` | `variant { err: text; ok: record { bufferedFeeWei: nat; bufferedGasPriceWei: nat; caller: principal; chainId: opt nat; estimatedFeeWei: nat; expiresAtNs: int; fetchedAtNs: int; gasLimit: nat; gasPriceWei: nat; op: OperationType; quoteId: text; rpcEndpoint: text; tier: GasTier; tierLabel: text; valueWei: nat; }; }` |
| `preflightEvmSwapGas` | update | one action | `quoteId: text, fromSymbol: text, amountIn: nat, rpcEndpoint: text, chainId: opt nat` | `variant { err: text; ok: record { bufferedFeeWei: nat; bufferedGasPriceWei: nat; caller: principal; chainId: opt nat; estimatedFeeWei: nat; expiresAtNs: int; fetchedAtNs: int; gasLimit: nat; gasPriceWei: nat; op: OperationType; quoteId: text; rpcEndpoint: text; tier: GasTier; tierLabel: text; valueWei: nat; }; }` |
| `preflightGasPrice` | update | one action | `rpcEndpoint: text, bufferBps: opt nat` | `variant { err: text; ok: record { bufferedGasPriceWei: nat; gasPriceWei: nat; }; }` |

## Sign-Only · Relayer Pattern

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `signAptosTransferRelayer` | update | one action | `toAddress: text, amount: nat64, sequenceNumber: nat64, chainId: nat8, expirationTimestampSecs: nat64` | `record { senderAddress: text; signedTxBcs: vec nat8; txHash: vec nat8; }` |
| `signCardanoTransferRelayer` | update | one action | `recipient: text, amountLovelace: nat64, utxos: vec record { tx_hash: text; tx_index: nat64; value: nat64; }, senderBech32: text` | `variant { err: text; ok: record { signedTxCbor: vec nat8; txHash: vec nat8; }; }` |
| `signNearTransferRelayer` | update | one action | `recipientId: text, amountYocto: nat, nonce: nat64, blockHash: vec nat8` | `record { senderAccountId: text; signedTxBytes: vec nat8; txHash: vec nat8; }` |
| `signSolSwapTxsRelayer` | update | one action | `txBase64Array: vec text` | `vec record { signature: vec nat8; signedTxBase64: text; }` |
| `signSolTransferRelayer` | update | one action | `toAddress: text, lamports: nat64, blockhashBase58: text` | `record { publicKey: vec nat8; signature: vec nat8; signedTxBase64: text; txMessage: vec nat8; }` |
| `signSuiTransferRelayer` | update | one action | `recipientAddress: text, amount: nat64, gasCoinId: text, gasCoinVersion: nat64, gasCoinDigest: text` | `record { senderAddress: text; signatureBase64: text; txBytesBase64: text; }` |
| `signTonTransferRelayer` | update | one action | `toAddress: text, amountNanoton: nat64, seqno: nat32, bounce: bool, comment: opt text, timeoutSeconds: nat32, accountState: text` | `record { bocBase64: text; payloadHash: vec nat8; senderAddress: text; }` |
| `signTrxTransferRelayer` | update | one action | `toAddress: text, amountSun: nat64, refBlockBytes: vec nat8, refBlockHash: vec nat8, expiration: int64, timestamp: int64` | `variant { err: text; ok: record { senderAddress: text; txHex1b: text; txHex1c: text; txID: text; }; }` |
| `signXrpTransferRelayer` | update | one action | `destAddress: text, amountXrp: text, sequence: nat32, lastLedgerSeq: nat32, fee: nat64, destinationTag: opt nat32` | `record { publicKeyHex: text; senderAddress: text; signedTxHex: text; txHash: text; }` |

## Sign-Only · Offchain Pattern

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `signSolSwapTxsOffchain` | update | one action | `txBase64Array: vec text` | `vec record { signature: vec nat8; signedTxBase64: text; }` |
| `signSolTransferOffchain` | update | one action | `toAddress: text, lamports: nat64, blockhashBase58: text` | `record { publicKey: vec nat8; signature: vec nat8; signedTxBase64: text; txMessage: vec nat8; }` |

## Sign-Only · exp_ Experimental

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `exp_deriveSolanaTokenTransferAccounts` | update | one action | `destOwner: text, mint: text, tokenProgramId: text` | `variant { err: text; ok: record { destAta: text; destOwner: text; mint: text; signerAddress: text; sourceAta: text; tokenProgramId: text; }; }` |
| `exp_inspectSolanaTokenTransferAccounts` | update | one action | `sourceAta: text, destAta: text, destOwner: text, mint: text, tokenProgramId: text` | `variant { err: text; ok: record { destAtaMatches: bool; destOwner: text; expectedDestAta: text; expectedSourceAta: text; mint: text; passedDestAta: text; passedSourceAta: text; signerAddress: text; sourceAtaMatches: bool; tokenProgramId: text; }; }` |
| `exp_signAddLiquidity` | update | one action | `tokenASymbol: text, tokenBSymbol: text, amountADesired: nat, amountBDesired: nat, slippageBps: nat, gasPrice: nat, gasLimit: nat, overrideNonce: opt nat, rpcEndpoint: text` | `variant { err: text; ok: record { chainId: nat; note: text; transactions: vec SignedEvmTx; }; }` |
| `exp_signAddLiquidityETH` | update | one action | `tokenSymbol: text, amountTokenDesired: nat, amountETHDesired: nat, slippageBps: nat, gasPrice: nat, gasLimit: nat, overrideNonce: opt nat, rpcEndpoint: text` | `variant { err: text; ok: record { chainId: nat; note: text; transactions: vec SignedEvmTx; }; }` |
| `exp_signAptosTransfer` | update | one action | `toAddress: text, amount: nat64, sequenceNumber: nat64, chainId: nat8, expirationTimestampSecs: nat64` | `variant { err: text; ok: record { note: text; transaction: SignedAptosTx; }; }` |
| `exp_signBtcTransfer` | update | one action | `toAddress: text, amount: nat64, feeRate: nat64, utxos: vec record { txHash: text; txIndex: nat32; value: nat64; }` | `variant { err: text; ok: record { note: text; transaction: SignedBtcTx; }; }` |
| `exp_signCardanoSend` | update | one action | `toAddress: text, amountLovelace: nat64, utxos: vec record { tx_hash: text; tx_index: nat64; value: nat64; }` | `variant { err: text; ok: record { note: text; transaction: SignedCardanoTx; }; }` |
| `exp_signCardanoTokenSend` | update | one action | `toAddress: text, lovelaceToSend: nat64, tokensToSend: vec record { quantity: nat64; unit: text; }, utxos: vec record { lovelace: nat64; tokens: vec record { quantity: text; unit: text; }; tx_hash: text; tx_index: nat64; }` | `variant { err: text; ok: record { note: text; transaction: SignedCardanoTx; }; }` |
| `exp_signClmmSwapUser` | update | one action | `poolId: variant { CRCLX_USDC; CRCLX_WSOL; GOOGLX_USDC; QQQX_WSOL; TSLAX_USDC; TSLAX_WSOL; USD1_USDC; }, amount: nat64, slippageBps: nat64, zeroForOne: bool, inputAta: opt text, outputAta: opt text, recentBlockhash: text` | `variant { err: text; ok: record { note: text; transactions: vec SignedSolTx; }; }` |
| `exp_signCloakTransfer` | update | one action | `toAddress: text, amount: nat64, utxos: vec record { txHash: text; txIndex: nat32; value: nat64; }` | `variant { err: text; ok: record { note: text; transaction: SignedCloakTx; }; }` |
| `exp_signDirectSwapUser` | update | one action | `direction: text, amountIn: nat64, minimumAmountOut: nat64, recentBlockhash: text` | `variant { err: text; ok: record { note: text; transactions: vec SignedSolTx; }; }` |
| `exp_signEvmSend` | update | one action | `to: text, value: nat, chainId: nat, gasPrice: nat, gasLimit: nat, data: vec nat8, overrideNonce: opt nat, rpcEndpoint: text` | `variant { err: text; ok: record { nonce: nat; purpose: text; senderAddress: text; signedTxHexV0: text; signedTxHexV1: text; txHash: text; }; }` |
| `exp_signEvmSwap` | update | one action | `fromSymbol: text, toSymbol: text, amountIn: nat, slippageBps: nat, useFeeOnTransfer: bool, gasPrice: nat, gasLimit: nat, overrideNonce: opt nat, rpcEndpoint: text` | `variant { err: text; ok: record { chainId: nat; note: text; transactions: vec SignedEvmTx; }; }` |
| `exp_signLtcTransfer` | update | one action | `toAddress: text, amount: nat64, feeRate: nat64, utxos: vec record { txHash: text; txIndex: nat32; value: nat64; }` | `variant { err: text; ok: record { note: text; transaction: SignedBtcTx; }; }` |
| `exp_signMinswapSwap` | update | one action | `tokenIn: text, tokenOut: text, amountIn: nat64, slippagePct: float64, estimateRawJson: text` | `variant { err: text; ok: record { note: text; transaction: SignedMinswapTx; }; }` |
| `exp_signNearTransfer` | update | one action | `recipientId: text, amountYocto: nat, nonce: nat64, blockHash: vec nat8` | `variant { err: text; ok: record { note: text; transaction: SignedNearTx; }; }` |
| `exp_signRaydiumSwap` | update | one action | `amountIn: nat64, minimumAmountOut: nat64, userSourceAta: text, userDestAta: text, recentBlockhash: text` | `variant { err: text; ok: record { purpose: text; signatureBase58: text; signedTxBase64: text; signerAddress: text; }; }` |
| `exp_signRaydiumSwapUser` | update | one action | `inputMint: text, outputMint: text, amount: nat64, slippageBps: nat64, wrapSol: bool, unwrapSol: bool, inputAta: opt text, outputAta: opt text, recentBlockhash: text` | `variant { err: text; ok: record { note: text; transactions: vec SignedSolTx; }; }` |
| `exp_signRemoveLiquidity` | update | one action | `tokenASymbol: text, tokenBSymbol: text, lpTokenAmount: nat, amountAMin: nat, amountBMin: nat, gasPrice: nat, gasLimit: nat, overrideNonce: opt nat, rpcEndpoint: text` | `variant { err: text; ok: record { chainId: nat; note: text; transactions: vec SignedEvmTx; }; }` |
| `exp_signRemoveLiquidityETH` | update | one action | `tokenSymbol: text, lpTokenAmount: nat, amountTokenMin: nat, amountETHMin: nat, useFeeOnTransfer: bool, gasPrice: nat, gasLimit: nat, overrideNonce: opt nat, rpcEndpoint: text` | `variant { err: text; ok: record { chainId: nat; note: text; transactions: vec SignedEvmTx; }; }` |
| `exp_signSolTransfer` | update | one action | `toAddress: text, lamports: nat64, recentBlockhash: text` | `variant { err: text; ok: record { purpose: text; signatureBase58: text; signedTxBase64: text; signerAddress: text; }; }` |
| `exp_signSplTransfer` | update | one action | `amount: nat64, sourceAta: text, destAta: text, tokenProgramId: text, recentBlockhash: text` | `variant { err: text; ok: record { purpose: text; signatureBase58: text; signedTxBase64: text; signerAddress: text; }; }` |
| `exp_signSplTransferSafeChecked` | update | one action | `amount: nat64, decimals: nat8, sourceAta: text, destAta: text, destOwner: text, mint: text, tokenProgramId: text, recentBlockhash: text` | `variant { err: text; ok: record { destAta: text; destOwner: text; mint: text; purpose: text; signatureBase58: text; signedTxBase64: text; signerAddress: text; sourceAta: text; tokenProgramId: text; }; }` |
| `exp_signSplTransferSafeDerived` | update | one action | `amount: nat64, decimals: nat8, destOwner: text, mint: text, tokenProgramId: text, recentBlockhash: text` | `variant { err: text; ok: record { destAta: text; destOwner: text; mint: text; purpose: text; signatureBase58: text; signedTxBase64: text; signerAddress: text; sourceAta: text; tokenProgramId: text; }; }` |
| `exp_signSuiTransfer` | update | one action | `recipientAddress: text, amount: nat64, gasCoinId: text, gasCoinVersion: nat64, gasCoinDigest: text` | `variant { err: text; ok: record { note: text; transaction: SignedSuiTx; }; }` |
| `exp_signThorTransfer` | update | one action | `toAddress: text, amount: nat, chainId: text, accountNumber: nat64, sequence: nat64, memo: text` | `variant { err: text; ok: record { note: text; transaction: SignedThorTx; }; }` |
| `exp_signTonTransfer` | update | one action | `toAddress: text, amountNanoton: nat64, seqno: nat32, bounce: bool, comment: opt text, timeoutSeconds: nat32, accountState: text` | `variant { err: text; ok: record { note: text; transaction: SignedTonTx; }; }` |
| `exp_signTronTransfer` | update | one action | `toAddress: text, amountSun: nat64, refBlockBytes: vec nat8, refBlockHash: vec nat8, expiration: int64, timestamp: int64` | `variant { err: text; ok: record { note: text; transaction: SignedTronTx; }; }` |
| `exp_signXrpIOUPayment` | update | one action | `destAddress: text, currency: text, issuer: text, amount: text, sequence: nat32, lastLedgerSeq: nat32, fee: nat64, destinationTag: opt nat32` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |
| `exp_signXrpPayment` | update | one action | `destAddress: text, amountXrp: text, sequence: nat32, lastLedgerSeq: nat32, fee: nat64, destinationTag: opt nat32` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |
| `exp_signXrpSwap` | update | one action | `destinationAmount: record { currency: text; issuer: text; value: text; }, sendMaxAmount: record { currency: text; issuer: text; value: text; }, sequence: nat32, lastLedgerSeq: nat32, fee: nat64` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |
| `exp_signXrpTrustline` | update | one action | `currency: text, issuer: text, limit: text, sequence: nat32, lastLedgerSeq: nat32, fee: nat64` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |

## Strategy / Automation

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `addStrategyRule` | update | one action | `rule: record { apyMigrationConfig: opt APYMigrationConfig; chainType: ChainType; createdAt: int; dcaConfig: opt DCAConfig; id: nat; lpConfig: opt LPConfig; positionId: nat; ruleType: RuleType; scheduledConfig: opt ScheduledConfig; sizePct: nat; status: RuleStatus; swapAmountLamports: opt nat64; swapAmountWei: opt nat; triggerPrice: nat64; volatilityConfig: opt VolatilityConfig; }` | `variant { err: text; ok: nat; }` |
| `deleteStrategyRule` | update | one action | `ruleId: nat` | `variant { err: text; ok; }` |
| `getMyStrategyRules` | update | one action | `()` | `vec record { apyMigrationConfig: opt record { cooldownHours: nat; currentPoolAddress: text; lastMigrated: int; maxMigrationCostPct: float64; minApyDelta: float64; targetPools: vec text; }; chainType: variant { Evm; Solana; }; createdAt: int; dcaConfig: opt record { amountPerBuy: nat; executedBuys: nat; intervalSeconds: nat; nextExecutionTime: int; tokenIn: text; tokenOut: text; totalBuys: nat; }; id: nat; lpConfig: opt record { cooldownHours: nat; exitOnHighVolatility: bool; maxPositionSizePct: float64; maxVolatility: float64; minApy: float64; minTvlUSD: float64; poolAddress: text; rebalanceThreshold: float64; }; positionId: nat; ruleType: variant { APYMigration; DCA; LiquidityProvision; Rebalance; Scheduled; StopLoss; TakeProfit; VolatilityTrigger; }; scheduledConfig: opt record { action: ScheduledAction; cronPattern: text; executedCount: nat; nextExecutionTime: int; repeatCount: nat; }; sizePct: nat; status: variant { Active; Cancelled; Confirmed; Draft; Executed; Executing; Failed; Paused; Ready; }; swapAmountLamports: opt nat64; swapAmountWei: opt nat; triggerPrice: nat64; volatilityConfig: opt record { action: VolatilityAction; cooldownMinutes: nat; direction: variant { Above; Below; }; lastTriggered: int; tokenSymbol: text; triggerStdDev: float64; }; }` |
| `getStrategyLogs` | query | no action | `()` | `vec record { error: opt text; intent_hash: text; rule_id: text; stage: variant { ACTIVATED; ADDRESS_GENERATED; BROADCASTING; BUILT_TX; CHECKED; CONFIG_UPDATED; CONFIRMED; DCA_EXECUTED; EXECUTING; FAILED; PNL_REPORTED; POSITION_CREATED; RULE_CREATED; SENT; SIGNING; TRIGGERED; VALIDATED; }; ts: int; tx_id: opt text; }` |
| `updateStrategyRuleStatus` | update | one action | `ruleId: nat, status: variant { Active; Cancelled; Confirmed; Draft; Executed; Executing; Failed; Paused; Ready; }` | `variant { err: text; ok; }` |

## Developer / Billing

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `depositGatewayCredits` | update | no action | `tokenSymbol: text, amount: nat` | `variant { err: text; ok: record { amount: nat; currency: text; id: nat; ledgerCanisterId: text; timestamp: int; usdValueMicroUsd: nat; user: principal; }; }` |
| `getCanisterDeveloper` | query | no action | `canisterId: principal` | `opt principal` |
| `getGatewayPricing` | query | no action | `()` | `record { acceptedTokens: vec record { decimals: nat; fixedRateMicroUsd: opt nat; ledgerCanisterId: text; symbol: text; xrcSymbol: opt text; }; fees: vec record { microUsd: nat; opType: variant { admin; bridge; bridgeRelay; sign; signRelay; swap; swapRelay; }; }; packages: vec record { actionsIncluded: nat; durationNanos: int; priceMicroUsd: nat; tier: variant { Basic; Developer; Enterprise; Free; Pro; }; }; }` |
| `getMyCanisterUsage` | update | no action | `canisterId: principal` | `variant { err: text; ok: record { canisterId: principal; lastUsed: int; operationsCharged: nat; }; }` |
| `getMyDeveloperAccount` | update | no action | `()` | `opt record { appName: text; canisters: vec principal; createdAt: int; developerKey: text; owner: principal; }` |
| `getMyDeveloperKey` | update | no action | `()` | `variant { err: text; ok: text; }` |
| `getMyGatewayAccount` | update | no action | `()` | `record { actionsRemaining: nat; actionsUsed: nat; createdAt: int; creditsMicroUsd: nat; subscriptionExpiry: opt int; tier: variant { Basic; Developer; Enterprise; Free; Pro; }; totalDepositedMicroUsd: nat; }` |
| `getMyGatewayDeposits` | update | no action | `()` | `vec record { amount: nat; currency: text; id: nat; ledgerCanisterId: text; timestamp: int; usdValueMicroUsd: nat; user: principal; }` |
| `isGatewayEnabled` | query | no action | `()` | `bool` |
| `purchaseGatewayPackage` | update | no action | `tier: variant { Basic; Developer; Enterprise; Free; Pro; }, tokenSymbol: text` | `variant { err: text; ok: record { actionsRemaining: nat; actionsUsed: nat; createdAt: int; creditsMicroUsd: nat; subscriptionExpiry: opt int; tier: Tier; totalDepositedMicroUsd: nat; }; }` |
| `regenerateDeveloperKey` | update | no action | `()` | `variant { err: text; ok: text; }` |
| `registerDeveloperCanister` | update | no action | `canisterId: principal, appName: text` | `variant { err: text; ok: text; }` |
| `unregisterDeveloperCanister` | update | no action | `canisterId: principal` | `variant { err: text; ok; }` |
| `validateDeveloperKey` | query | no action | `key: text` | `bool` |

## Token / Pool Info

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getAllMinswapTokens` | query | no action | `()` | `vec record { category: text; decimals: nat; id: text; isVerified: bool; logoUrl: opt text; name: text; symbol: text; }` |
| `getAllPools` | query | no action | `()` | `vec record { liquidityLevel: variant { High; Low; Medium; }; pairAddress: opt text; symbolA: text; symbolB: text; tokenA: text; tokenB: text; }` |
| `getBaseTokens` | query | no action | `()` | `vec text` |
| `getICRC1TokenInfo` | update | no action | `ledgerCanisterId: text` | `variant { err: text; ok: record { canisterId: text; decimals: nat8; fee: nat; name: text; symbol: text; }; }` |
| `getICRC2Allowance` | update | no action | `owner: principal, spender: principal, ledgerCanisterId: text` | `variant { err: text; ok: record { allowance: nat; expires_at: opt nat64; }; }` |
| `getMinswapTokens` | query | no action | `()` | `vec record { category: text; decimals: nat; id: text; isVerified: bool; logoUrl: opt text; name: text; symbol: text; }` |
| `getPoolCount` | query | no action | `()` | `nat` |
| `getPoolStats` | query | no action | `()` | `record { highLiquidityPools: nat; lowLiquidityPools: nat; mediumLiquidityPools: nat; tokensWithPools: nat; totalPools: nat; }` |
| `getRoutingSuggestions` | query | no action | `fromSymbol: text, toSymbol: text` | `variant { err: text; ok: vec record { intermediary: text; reason: text; symbol: text; }; }` |
| `getStablecoins` | query | no action | `()` | `vec text` |
| `getSupportedChains` | query | no action | `()` | `vec text` |
| `getSupportedICPTokens` | query | no action | `()` | `vec record { canisterId: text; category: text; name: text; symbol: text; "type": text; }` |
| `getSupportedTokens` | query | no action | `()` | `vec text` |
| `getSwapErrorMessage` | query | no action | `fromSymbol: text, toSymbol: text` | `text` |
| `getTokenCount` | query | no action | `()` | `nat` |
| `getTokenInfo` | query | no action | `symbol: text` | `opt record { address: text; decimals: nat; symbol: text; }` |
| `hasPathThrough` | query | no action | `symbolA: text, symbolIntermediary: text, symbolB: text` | `bool` |
| `isTokenSupported` | query | no action | `symbol: text` | `bool` |
| `listPoolsForToken` | query | no action | `symbol: text` | `vec record { liquidityLevel: variant { High; Low; Medium; }; pairAddress: opt text; symbolA: text; symbolB: text; tokenA: text; tokenB: text; }` |
| `poolExists` | query | no action | `symbolA: text, symbolB: text` | `bool` |
| `validateSwapPath` | query | no action | `fromSymbol: text, toSymbol: text` | `variant { err: text; ok: record { isDirect: bool; note: text; path: vec text; symbols: vec text; }; }` |

## CLMM Pools

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getClmmPool` | query | no action | `poolId: variant { CRCLX_USDC; CRCLX_WSOL; GOOGLX_USDC; QQQX_WSOL; TSLAX_USDC; TSLAX_WSOL; USD1_USDC; }` | `record { decimalsA: nat; decimalsB: nat; id: text; mintA: text; mintB: text; poolAddress: text; symbol: text; }` |
| `isClmmPoolReady` | query | no action | `poolId: variant { CRCLX_USDC; CRCLX_WSOL; GOOGLX_USDC; QQQX_WSOL; TSLAX_USDC; TSLAX_WSOL; USD1_USDC; }` | `bool` |
| `listClmmPools` | query | no action | `()` | `vec record { decimalsA: nat; decimalsB: nat; id: text; mintA: text; mintB: text; poolAddress: text; symbol: text; }` |

## SUI Package Config

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getSuiPackageConfig` | query | no action | `()` | `opt record { moduleName: text; packageId: text; treasuryCapId: text; }` |

## Address Validation

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `isValidBitcoinAddress` | update | no action | `address: text` | `bool` |
| `isValidLitecoinAddress` | update | no action | `address: text` | `bool` |
| `isValidSuiAddress` | query | no action | `address: text` | `bool` |
| `isValidTonAddress` | update | no action | `address: text` | `bool` |
| `solanaAccountExists` | update | no action | `address: text` | `bool` |

## Cache Management

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getEvmCacheSize` | query | no action | `()` | `nat` |
| `getGasOracleCacheSize` | query | no action | `()` | `nat` |
| `getSuiCacheSize` | query | no action | `()` | `nat` |
| `getTonCacheSize` | query | no action | `()` | `nat` |
| `getTotalCacheSize` | query | no action | `()` | `record { aptos: nat; bitcoin: nat; cardano: nat; evm: nat; litecoin: nat; near: nat; solana: nat; sui: nat; thorchain: nat; ton: nat; total: nat; tron: nat; xrp: nat; }` |
| `listCachedEvmNonceAddresses` | query | no action | `()` | `vec text` |

## Solana Helpers

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `formatSuiTokenType` | query | no action | `tokenType: text` | `text` |
| `getSolanaTokenProgramIds` | query | no action | `()` | `record { legacySpl: text; token2022: text; }` |

## System

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `getStrategyPriceCacheStats` | query | no action | `()` | `vec record { text; record { ageSeconds: int; price: nat64; }; }` |
| `getSystemLogs` | query | no action | `()` | `vec text` |
| `health` | query | no action | `()` | `text` |
| `version` | query | no action | `()` | `text` |

## TON Configuration

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `hasTonApiKey` | query | no action | `()` | `bool` |
| `verifyTonWalletCode` | update | no action | `()` | `variant { err: text; ok: text; }` |

## Other calls

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `debugGetMySolanaAta` | update | no action | `mint: text` | `record { callerPrincipal: text; derivedAta: text; ownerAddress: text; ownerHex: text; }` |
| `debugPdaDerivation` | update | no action | `ownerB58: text, mintB58: text` | `record { bump252Hash: text; bump253Hash: text; bump254Hash: text; bump255Hash: text; finalAta: text; finalBump: nat8; }` |
| `debugTokenProgram` | query | no action | `mint: text` | `record { isLegacy: bool; mint: text; program: text; }` |
| `deriveSolanaAtaWithProgram` | query | no action | `ownerBase58: text, mintBase58: text, tokenProgramId: text` | `variant { err: text; ok: text; }` |
| `dumpSolanaBorshWriterBehavior` | update | no action | `()` | `text` |
| `getCachedPrices` | query | no action | `()` | `vec record { ageSeconds: int; priceMicroUsd: nat64; symbol: text; }` |
| `getIcpSolTreasuryAddress` | update | no action | `()` | `text` |
| `getMsolTreasuryAddress` | update | no action | `()` | `text` |
| `getMySession` | update | no action | `()` | `opt principal` |
| `getMySolanaAtaWithProgram` | update | one action | `mint: text, tokenProgramId: text` | `variant { err: text; ok: text; }` |
| `getRaydiumSwapMessageDiagnostics` | update | no action | `amountIn: nat64, minimumAmountOut: nat64, userSourceAta: text, userDestAta: text` | `record { blockhashB58: text; expectedLen: nat; messageBase64: text; messageHex: text; messageLen: nat; parsed: text; signedTxBase64: text; }` |
| `getRegisteredUsers` | update | no action | `()` | `variant { err: text; ok: vec principal; }` |
| `getThorBalanceFor` | update | no action | `address: text` | `vec record { amount: nat; denom: text; }` |
| `icpSolPoolDeposit` | update | one action | `lamports: nat64` | `variant { err: text; ok: record { expectedDepositId: nat; txSignature: text; }; }` |
| `msolDeposit` | update | one action | `lamports: nat64` | `variant { err: text; ok: record { depositId: nat; txSignature: text; }; }` |
| `registerSession` | update | no action | `developerKey: text` | `variant { err: text; ok; }` |
| `registerUserForBilling` | update | no action | `user: principal` | `variant { err: text; ok; }` |
| `simulateSignedSolanaTxBase64` | update | no action | `txB64: text` | `text` |
| `testAtaDerivation` | update | no action | `()` | `record { expectedFromSdk: text; match: bool; mint: text; owner: text; viaModule: text; viaPdaDirect: text; }` |
| `testSpecificAta` | update | no action | `ownerB58: text, mintB58: text` | `record { derivedAta: text; mint: text; owner: text; }` |
| `testUsdcTokenProgram` | update | no action | `()` | `text` |
| `transform` | query | no action | `args: record { context: blob; response: record { body: blob; headers: vec record { name: text; value: text; }; status: nat; }; }` | `record { body: blob; headers: vec record { name: text; value: text; }; status: nat; }` |
| `transformSuiResponse` | query | no action | `args: record { context: blob; response: HttpResponse; }` | `record { body: blob; headers: vec record { name: text; value: text; }; status: nat; }` |
| `unregisterUserFromBilling` | update | no action | `user: principal` | `variant { err: text; ok; }` |
| `xrpSignIOUPayment` | update | one action | `destAddress: text, currency: text, issuer: text, amount: text, sequence: nat32, lastLedgerSeq: nat32, fee: nat64, destinationTag: opt nat32` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |
| `xrpSignPayment` | update | one action | `destAddress: text, amountXrp: text, sequence: nat32, lastLedgerSeq: nat32, fee: nat64, destinationTag: opt nat32` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |
| `xrpSignSwap` | update | one action | `destinationAmount: record { currency: text; issuer: text; value: text; }, sendMaxAmount: record { currency: text; issuer: text; value: text; }, sequence: nat32, lastLedgerSeq: nat32, fee: nat64` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |
| `xrpSignTrustline` | update | one action | `currency: text, issuer: text, limit: text, sequence: nat32, lastLedgerSeq: nat32, fee: nat64` | `record { message: text; signedTxHex: text; success: bool; txHash: text; }` |

## Not available

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `addICPLiquidity`<br>Refused for every caller: "ICPSwap liquidity is not available through the gateway". | update | – | `_request: record { dex: DexId; poolId: text; slippagePct: float64; token0: text; token0Amount: nat; token1: text; token1Amount: nat; }` | `variant { err: text; ok: record { lpTokens: nat; message: text; poolId: text; success: bool; token0Used: nat; token1Used: nat; }; }` |
| `getICPLPPositions`<br>Answers an empty list for every caller: ICPSwap liquidity is not available through the gateway. | update | – | `()` | `vec record { dex: variant { ICPSwap; KongSwap; }; liquidity: nat; poolId: text; token0: text; token0Amount: nat; token0Symbol: text; token1: text; token1Amount: nat; token1Symbol: text; unclaimedFees: opt record { nat; nat; }; valueUsd: opt nat; }` |
| `removeICPLiquidity`<br>Refused for every caller: "ICPSwap liquidity is not available through the gateway". | update | – | `_request: record { dex: DexId; lpTokens: nat; poolId: text; slippagePct: float64; }` | `variant { err: text; ok: record { message: text; success: bool; token0Received: nat; token1Received: nat; }; }` |

## Gateway controllers only

| Method | Kind | Cost | Arguments | Answer |
|---|---|---|---|---|
| `addGatewayPaymentToken` | update | – | `config: record { decimals: nat; fixedRateMicroUsd: opt nat; ledgerCanisterId: text; symbol: text; xrcSymbol: opt text; }` | `variant { err: text; ok; }` |
| `addGatewayWhitelist` | update | – | `p: principal` | `variant { err: text; ok; }` |
| `adminClearDeveloperSessions` | update | – | `devPrincipal: principal` | `variant { err: text; ok: nat; }` |
| `adminGetAccount` | update | – | `user: principal` | `variant { err: text; ok: record { actionsRemaining: nat; actionsUsed: nat; createdAt: int; creditsMicroUsd: nat; subscriptionExpiry: opt int; tier: Tier; totalDepositedMicroUsd: nat; }; }` |
| `adminGetAllAccounts` | update | – | `()` | `variant { err: text; ok: vec record { principal; record { actionsRemaining: nat; actionsUsed: nat; createdAt: int; creditsMicroUsd: nat; subscriptionExpiry: opt int; tier: Tier; totalDepositedMicroUsd: nat; }; }; }` |
| `adminGetAllDeposits` | update | – | `()` | `variant { err: text; ok: vec record { amount: nat; currency: text; id: nat; ledgerCanisterId: text; timestamp: int; usdValueMicroUsd: nat; user: principal; }; }` |
| `adminGetAllRules` | update | – | `()` | `variant { err: text; ok: vec record { principal; vec record { apyMigrationConfig: opt APYMigrationConfig; chainType: ChainType; createdAt: int; dcaConfig: opt DCAConfig; id: nat; lpConfig: opt LPConfig; positionId: nat; ruleType: RuleType; scheduledConfig: opt ScheduledConfig; sizePct: nat; status: RuleStatus; swapAmountLamports: opt nat64; swapAmountWei: opt nat; triggerPrice: nat64; volatilityConfig: opt VolatilityConfig; }; }; }` |
| `adminGetAllSessions` | update | – | `()` | `variant { err: text; ok: vec record { principal; principal; }; }` |
| `adminGrantSubscription` | update | – | `user: principal, tier: variant { Basic; Developer; Enterprise; Free; Pro; }, actions: nat, durationDays: nat` | `variant { err: text; ok: record { actionsRemaining: nat; actionsUsed: nat; createdAt: int; creditsMicroUsd: nat; subscriptionExpiry: opt int; tier: Tier; totalDepositedMicroUsd: nat; }; }` |
| `adminPauseAllRules` | update | – | `()` | `variant { err: text; ok: nat; }` |
| `clearAllCaches` | update | – | `()` | `()` |
| `clearEvmCache` | update | – | `()` | `()` |
| `clearSolanaAddressCache` | update | – | `()` | `text` |
| `clearStrategyPriceCache` | update | – | `()` | `()` |
| `clearSuiCache` | update | – | `()` | `()` |
| `clearTonCache` | update | – | `()` | `()` |
| `createCanisterSolanaAtaForMint` | update | – | `mintBase58: text, ataBase58: text` | `record { ata: text; blockhash: text; mint: text; owner: text; txSignature: text; }` |
| `createCanisterSolanaAtaForMintWithProgram` | update | – | `mintBase58: text, ataBase58: text, tokenProgramId: text` | `record { ata: text; blockhash: text; mint: text; owner: text; txSignature: text; }` |
| `getChainStats` | update | – | `blockchain: text` | `record { blockchain: text; totalOperations: nat; uniqueUsers: nat; }` |
| `getGatewayRevenue` | update | – | `()` | `variant { err: text; ok: record { activePaidUsers: nat; activeSubscriptions: nat; totalDeposits: nat; totalOperationsCharged: nat; totalRevenueMicroUsd: nat; }; }` |
| `initAutomation` | update | – | `()` | `text` |
| `initGateway` | update | – | `()` | `variant { err: text; ok: text; }` |
| `pushPrices` | update | – | `prices: vec record { priceMicroUsd: nat64; symbol: text; }` | `variant { err: text; ok; }` |
| `removeGatewayWhitelist` | update | – | `p: principal` | `variant { err: text; ok; }` |
| `sendNearTransfer` | update | – | `receiverId: text, amount: nat` | `variant { err: text; ok: text; }` |
| `setGatewayEnabled` | update | – | `e: bool` | `variant { err: text; ok; }` |
| `setSuiPackageConfig` | update | – | `packageId: text, treasuryCapId: text, moduleName: text` | `()` |
| `setTonApiKey` | update | – | `key: text` | `()` |
| `swapClmm` | update | – | `poolId: variant { CRCLX_USDC; CRCLX_WSOL; GOOGLX_USDC; QQQX_WSOL; TSLAX_USDC; TSLAX_WSOL; USD1_USDC; }, amount: nat64, slippageBps: nat64, zeroForOne: bool, inputAta: opt text, outputAta: opt text` | `record { outputAmount: text; priceImpactPct: text; txSignature: text; }` |
| `swapRaydiumApi` | update | – | `inputMint: text, outputMint: text, amount: nat64, slippageBps: nat64, wrapSol: bool, unwrapSol: bool, inputAta: opt text, outputAta: opt text` | `record { inputAmount: text; outputAmount: text; priceImpactPct: text; txSignature: text; }` |
| `swapRaydiumNative` | update | – | `amountIn: nat64, minimumAmountOut: nat64, userSourceAta: text, userDestAta: text` | `record { blockhash: text; messageHex: text; serializedTxBase64: text; txSignature: text; }` |
| `withdrawGatewayFees` | update | – | `tokenSymbol: text, amount: nat, to: principal` | `variant { err: text; ok: nat; }` |
