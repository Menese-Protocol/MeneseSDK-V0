---
name: menesesdk-wallet
description: Multi-chain crypto wallet operations via MeneseSDK on ICP. Supports 19 blockchains — addresses, balances, sends, swaps, DeFi (Aave/Lido/Uniswap/ICPSwap/KongSwap), ICRC tokens, ICP LP, AI rebalancing, and automated strategies (DCA, stop-loss, take-profit). Triggers on any crypto wallet, transfer, swap, DeFi, or automation request.
---

# MeneseSDK Agent Skill Guide

## Section 1: Quick Start

MeneseSDK is a multi-chain crypto execution layer on the Internet Computer that lets you send, swap, and manage DeFi positions across 19 blockchains from a single canister.

**Canister ID:** `urs2a-ziaaa-aaaad-aembq-cai`

**Step 0: Install dfx (one-time)**

If you don't have dfx installed yet, run these commands first:

```bash
# Install dfx (the IC SDK)
sh -ci "$(curl -fsSL https://internetcomputer.org/install.sh)"

# Create a new identity for your wallet
dfx identity new my-wallet --storage-mode=plaintext

# Switch to the new identity
dfx identity use my-wallet

# Suppress the plaintext identity warning (add to your shell profile too)
export DFX_WARNING=-mainnet_plaintext_identity

# Verify connectivity — should return (true)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai health '()' --network ic

# Get your principal (this is your unique wallet identifier)
dfx identity get-principal
```

All wallet addresses are **deterministic per principal** — the same identity always produces the same addresses across all 19 chains.

**How to call any function:**
```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai <method> '(<args>)' --network ic
```

**First steps (all FREE):**
1. Get your addresses: `dfx canister call urs2a-ziaaa-aaaad-aembq-cai getAllAddresses '()' --network ic`
2. Check all balances: `dfx canister call urs2a-ziaaa-aaaad-aembq-cai getAllBalances '()' --network ic`
3. Fund your wallet on the chain you need (send crypto to the address from step 1)
4. Perform operations (each costs 1 action from your subscription)

**Supported chains:** Solana, Ethereum, Bitcoin, Arbitrum, Base, Polygon, BSC, Optimism, ICP, XRP, SUI, TON, Cardano, Aptos, NEAR, Tron, Litecoin, CloakCoin, THORChain.

---

## Section 2: Subscription & Billing

### Pricing Tiers

| Tier | Monthly Price | Actions Included |
|------|--------------|-----------------|
| **Basic** | $20.00/mo | 100 |
| **Developer** | $45.50/mo | 1,000 |
| **Pro** | $128.70/mo | 5,000 |
| **Enterprise** | $323.70/mo | Unlimited |

All operations cost exactly **1 action**. No per-action fees. No relay middleman.

### How to Purchase a Subscription

```bash
# Pay with ICP (or any supported token)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai purchaseGatewayPackage '(variant { Developer }, "ICP")' --network ic
```

First deposit credits, then purchase:
```bash
# Step 1: Deposit credits (amount in token's smallest unit)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai depositGatewayCredits '("ICP", 500_000_000)' --network ic

# Step 2: Purchase the subscription tier
dfx canister call urs2a-ziaaa-aaaad-aembq-cai purchaseGatewayPackage '(variant { Developer }, "ICP")' --network ic
```

### Check Your Account

```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyGatewayAccount '()' --network ic
```

Returns:
```
record {
  creditsMicroUsd = 45_500_000;   // $45.50 in micro-USD
  tier = variant { Developer };
  actionsRemaining = 987;
  subscriptionExpiry = opt 1_741_000_000_000_000_000;  // nanoseconds
  actionsUsed = 13;
  totalDepositedMicroUsd = 50_000_000;
  createdAt = 1_709_000_000_000_000_000;
}
```

### FREE Operations (no subscription needed)

- All address derivation (`getMySolanaAddress`, `getMyEvmAddress`, `getAllAddresses`, etc.)
- All balance queries (`getMySolanaBalance`, `getAllBalances`, `getICPBalance`, etc.)
- All swap quotes (`getRaydiumQuote`, `getICPDexQuote`, `getSuiSwapQuote`, etc.)
- All read-only calls (`callEvmContractRead`, `health`, `version`, query methods)
- Developer registration (`registerDeveloperCanister`, `getMyDeveloperKey`)
- Pool/token info queries (`getAllPools`, `getTokenInfo`, `getSupportedTokens`, etc.)

### 1-Action Operations (requires active subscription)

- All send/transfer operations
- All swap executions
- All DeFi operations (Aave, Lido, Uniswap LP)
- All sign-only endpoints
- Strategy rule creation
- Custom EVM contract writes
- ATA creation, trustline setup

---

## Section 3: Complete Function Catalog

### 3.1 Address Derivation (FREE)

Addresses are **deterministic** per principal. Fetch once, cache forever.

| Function | Returns | Key Field | Example |
|----------|---------|-----------|---------|
| `getMySolanaAddress` | `SolanaAddressInfo` | `.address` | Base58 Solana address |
| `getMyEvmAddress` | `EvmAddressInfo` | `.evmAddress` | 0x address (same for all EVM chains) |
| `getMyBitcoinAddress` | `AddressInfo` | `.bech32Address` | bc1... address |
| `getMyLitecoinAddress` | `AddressInfo` | `.bech32Address` | ltc1... address |
| `getMyCardanoAddress` | `CardanoAddressInfo` | `.bech32Address` | addr1... address |
| `getMySuiAddress` | `SuiAddressInfo` | `.suiAddress` | 0x... SUI address |
| `getMyXrpAddress` | `XrpAddressInfo` | `.classicAddress` | r... address |
| `getMyTonAddress` | `TonAddressInfo` | `.nonBounceable` | UQ... address |
| `getTronAddress` | `TronAddressInfo` | `.base58Address` | T... address |
| `getMyAptosAddress` | `AptosAddressInfo` | `.address` | 0x... address |
| `getMyNearAddress` | `PubKeyInfo` | `.implicitAccountId` | Hex account ID |
| `getMyCloakAddress` | `CloakAddressInfo` | `.base58Address` | Base58 address |
| `getMyThorAddress` | `AddressInfo` | `.bech32Address` | thor1... address |

**Batch call — get all addresses at once:**
```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getAllAddresses '()' --network ic
```
Returns a record with fields: `aptos`, `bitcoin`, `cardano`, `evm`, `litecoin`, `near`, `solana`, `sui`, `thorchain`, `ton`, `tron`, `xrp`.

**Get Solana ATA (Associated Token Account):**
```bash
# Get ATA for a specific SPL token mint
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMySolanaAta '("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")' --network ic
```

**Individual address examples:**
```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMySolanaAddress '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyEvmAddress '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyBitcoinAddress '()' --network ic
```

### 3.2 Balance Queries (FREE)

| Function | Args | Returns | Unit |
|----------|------|---------|------|
| `getMySolanaBalance` | `()` | `Result<Nat64, Text>` | lamports (9 decimals) |
| `getMyEvmBalance` | `(rpcEndpoint: Text)` | `Result<Nat, Text>` | wei (18 decimals) |
| `getICPBalance` | `()` | `Result<Nat64, Text>` | e8s (8 decimals) |
| `getBitcoinBalance` | `()` | `Nat64` | satoshis (8 decimals) |
| `getLitecoinBalance` | `()` | `Nat64` | litoshis (8 decimals) |
| `getMyXrpBalance` | `()` | `Result<Text, Text>` | XRP as text string |
| `getMySuiBalance` | `()` | `Nat64` | MIST (9 decimals) |
| `getMyTonBalance` | `()` | `Result<Nat64, Text>` | nanotons (9 decimals) |
| `getCardanoBalance` | `()` | `Result<Nat64, Text>` | lovelace (6 decimals) |
| `getAptosBalance` | `()` | `Result<Nat64, Text>` | octas (8 decimals) |
| `getMyNearBalance` | `()` | `Nat` | yoctoNEAR (24 decimals) |
| `getThorBalance` | `()` | `[{amount: Nat, denom: Text}]` | array of denoms |
| `getCloakBalance` | `()` | `Result<{address, balance, utxoCount}, Text>` | smallest unit (6 decimals) |
| `getTrxBalance` | `(address: Text)` | `Result<Nat64, Text>` | sun (6 decimals) |
| `getICRC1Balance` | `(ledgerCanisterId: Text)` | `Result<Nat, Text>` | token's smallest unit |
| `getMyTrc20Balance` | `(contractAddress: Text)` | `Result<Nat, Text>` | token's smallest unit |

**Batch call — get all native balances at once:**
```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getAllBalances '()' --network ic
```
Returns a record with fields: `aptos`, `bitcoin`, `cardano`, `icp`, `litecoin`, `near`, `solana`, `thorchain`, `ton`, `xrp`.

**Additional balance queries:**
```bash
# EVM balance (requires RPC)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyEvmBalance '("https://eth.llamarpc.com")' --network ic

# ICRC-1 token balance (e.g., ckBTC)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC1Balance '("mxzaz-hqaaa-aaaar-qaada-cai")' --network ic

# ICP balance for another principal
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPBalanceFor '(principal "xxxxx-xxxxx-xxxxx-xxxxx-cai")' --network ic

# ICRC-1 balance for another principal
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC1BalanceFor '(principal "xxxxx-xxxxx", "mxzaz-hqaaa-aaaar-qaada-cai")' --network ic

# ICRC-1 token info (name, symbol, decimals, fee, totalSupply)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC1TokenInfo '("mxzaz-hqaaa-aaaar-qaada-cai")' --network ic

# Get all supported ICP tokens
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getSupportedICPTokens '()' --network ic

# Multiple ICRC-1 balances at once
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC1Balances '(vec { "mxzaz-hqaaa-aaaar-qaada-cai"; "ryjl3-tyaaa-aaaaa-aaaba-cai" })' --network ic
```


### 3.3 Send / Transfer (1 action each)

#### Solana

```bash
# Send native SOL (amount in lamports, 1 SOL = 1_000_000_000 lamports)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendSolTransaction '("RecipientBase58Address", 500_000_000 : nat64)' --network ic
# Returns: Result<Text, Text> — ok = tx signature

# Transfer SPL token (amount in token's smallest unit)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai transferSplToken '(1_000_000 : nat64, "SourceAtaBase58", "DestAtaBase58")' --network ic
# Returns: TransferAndSendResult { txSignature, serializedTxBase64, blockhash }
```

#### EVM (Ethereum, Arbitrum, Base, Polygon, BSC, Optimism)

```bash
# Send native ETH/token (amount in wei, 1 ETH = 1_000_000_000_000_000_000 wei)
# chainId: 1=ETH, 42161=ARB, 8453=BASE, 137=POLY, 56=BSC, 10=OP
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendEvmNativeTokenAutonomous '("0xRecipientAddress", 100_000_000_000_000_000 : nat, "https://eth.llamarpc.com", 1 : nat, null)' --network ic
# Returns: Result<SendResultEvm, Text> — ok: { expectedTxHash, nonce, senderAddress, note }
```

**EVM RPC endpoints:**

| Chain | Chain ID | Free RPC |
|-------|----------|----------|
| Ethereum | 1 | `https://eth.llamarpc.com` |
| Arbitrum | 42161 | `https://arb1.arbitrum.io/rpc` |
| Base | 8453 | `https://mainnet.base.org` |
| Polygon | 137 | `https://polygon-rpc.com` |
| BSC | 56 | `https://bsc-dataseed1.binance.org` |
| Optimism | 10 | `https://mainnet.optimism.io` |

#### ICP

```bash
# Send ICP (amount in e8s, 1 ICP = 100_000_000 e8s)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendICP '(principal "recipient-principal-here", 100_000_000 : nat64)' --network ic
# Returns: Result<SendICPResult, Text> — ok: { amount, blockHeight, fee, from, to }

# Send ICRC-1 token (e.g., ckBTC, ckETH, CHAT, etc.)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendICRC1 '(principal "recipient-principal", 100_000 : nat, "mxzaz-hqaaa-aaaar-qaada-cai")' --network ic
# Returns: Result<SendICRC1Result, Text> — ok: { amount, blockHeight, fee, to, token }

# ICRC-2 approve (allow spender to transfer on your behalf)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai approveICRC2 '(principal "spender-principal", 1_000_000 : nat, null, "mxzaz-hqaaa-aaaar-qaada-cai")' --network ic
# Returns: Result<{ amount, blockHeight, spender, token }, Text>

# ICRC-2 transferFrom
dfx canister call urs2a-ziaaa-aaaad-aembq-cai transferFromICRC2 '(principal "from-principal", principal "to-principal", 500_000 : nat, "mxzaz-hqaaa-aaaar-qaada-cai")' --network ic
# Returns: Result<{ amount, blockHeight, from, to, token }, Text>

# Check ICRC-2 allowance (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC2Allowance '(principal "owner", principal "spender", "mxzaz-hqaaa-aaaar-qaada-cai")' --network ic
```

#### Bitcoin

```bash
# Send BTC (amount in satoshis, 1 BTC = 100_000_000 sats)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendBitcoin '("bc1qRecipientAddress", 50_000 : nat64)' --network ic
# Returns: Result<SendResultBtcLtc, Text> — ok: { txid, amount, fee, senderAddress, recipientAddress, note }

# Send with dynamic fee estimation
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendBitcoinDynamicFee '("bc1qRecipientAddress", 50_000 : nat64)' --network ic

# Send with custom fee rate (sat/vByte)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendBitcoinWithFee '("bc1qRecipientAddress", 50_000 : nat64, 10 : nat64)' --network ic

# Send with explicit network (mainnet or testnet)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendBitcoinWithNetwork '("bc1qRecipientAddress", 50_000 : nat64, opt (10 : nat64), variant { mainnet })' --network ic
# Network options: mainnet, testnet, regtest

# Check max sendable amount (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getBitcoinMaxSendAmount '(null)' --network ic
# or with custom fee rate:
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getBitcoinMaxSendAmount '(opt (10 : nat64))' --network ic
```

#### Litecoin

```bash
# Send LTC (amount in litoshis, 1 LTC = 100_000_000 litoshis)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendLitecoin '("ltc1qRecipientAddress", 100_000 : nat64)' --network ic
# Returns: Result<SendResult, Text> — ok: { txHash, senderAddress, note }
# NOTE: Litecoin returns SendResult, NOT SendResultBtcLtc

# Send with custom fee rate
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendLitecoinWithFee '("ltc1qRecipientAddress", 100_000 : nat64, 5 : nat64)' --network ic

# Check max sendable amount (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getLitecoinMaxSendAmount '(null)' --network ic
```

#### XRP

```bash
# Send XRP (amount as TEXT string in XRP, e.g., "10.5" = 10.5 XRP)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendXrpAutonomous '("rRecipientAddress", "10.5", null)' --network ic
# With destination tag:
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendXrpAutonomous '("rRecipientAddress", "10.5", opt (12345 : nat32))' --network ic
# Returns: SendResultXrp (FLAT record, NOT a Result variant)
# { txHash, explorerUrl, message, success, sequence, ledgerUsed }
# CHECK .success field!

# Send XRP IOU (issued currency)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendXrpIOU '("rRecipientAddress", "USD", "rIssuerAddress", "100.00", null)' --network ic
```

#### SUI

```bash
# Send SUI (amount in MIST, 1 SUI = 1_000_000_000 MIST)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendSui '("0xRecipientSuiAddress", 500_000_000 : nat64)' --network ic
# Returns: Result<SendResult, Text> — ok: { txHash, senderAddress, note }

# Send max SUI (leaves gas reserve)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendSuiMax '("0xRecipientSuiAddress")' --network ic

# Send SUI with specific network (mainnet/testnet/devnet)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendSuiWithNetwork '("0xRecipientSuiAddress", 500_000_000 : nat64, variant { mainnet })' --network ic

# Transfer specific SUI coin object
dfx canister call urs2a-ziaaa-aaaad-aembq-cai transferSuiCoin '("0xCoinObjectId", "0xRecipientAddress", 100_000_000 : nat64)' --network ic
```

#### TON

```bash
# Simple TON send (amount in nanotons, 1 TON = 1_000_000_000 nanotons)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendTonSimple '("UQRecipientAddress", 500_000_000 : nat64)' --network ic
# Returns: SendResultTon (FLAT record, NOT a Result variant)
# { txHash, bocBase64, senderAddress, success, error }
# CHECK .success field!

# Send with options (bounce, comment, timeout)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendTon '("UQRecipientAddress", 500_000_000 : nat64, false, opt "Payment for services", 60 : nat32)' --network ic

# Send with comment (shorthand)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendTonWithComment '("UQRecipientAddress", 500_000_000 : nat64, "Hello from ICP")' --network ic
```

#### Cardano

```bash
# Send ADA (amount in lovelace, 1 ADA = 1_000_000 lovelace)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendCardanoTransaction '("addr1RecipientAddress", 2_000_000 : nat64)' --network ic
# Returns: Result<Text, Text> — ok = tx hash
```

#### Tron

```bash
# Send TRX (amount in sun, 1 TRX = 1_000_000 sun)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendTrx '("TRecipientAddress", 10_000_000 : nat64)' --network ic
# Returns: Result<Text, Text> — ok = tx hash

# Send TRC-20 token (e.g., USDT on Tron)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendTrc20 '("TContractAddress", "TRecipientAddress", 10_000_000 : nat, 30_000_000 : nat64)' --network ic
# Returns: Result<Text, Text> — ok = tx hash
# feeLimit is in sun (30_000_000 = 30 TRX)
```

#### Aptos

```bash
# Send APT (amount in octas, 1 APT = 100_000_000 octas)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendAptos '("0xRecipientAddress", 50_000_000 : nat64)' --network ic
# Returns: Result<SendResult, Text> — ok: { txHash, senderAddress, note }
```

#### NEAR

```bash
# Send NEAR (amount in yoctoNEAR, 1 NEAR = 1_000_000_000_000_000_000_000_000 yocto)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendNearTransfer '("recipient.near", 1_000_000_000_000_000_000_000_000 : nat)' --network ic
# Returns: Result<Text, Text> — ok = tx hash

# Alternative: sendNearTransferFromUser (same signature)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendNearTransferFromUser '("recipient.near", 1_000_000_000_000_000_000_000_000 : nat)' --network ic
```

#### CloakCoin

```bash
# Send CLOAK (amount in smallest unit, 1 CLOAK = 1_000_000 units — 6 DECIMALS)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendCloak '("RecipientBase58Address", 1_000_000 : nat64)' --network ic
# Returns: Result<SendResultCloak, Text> — ok: { txHash, txHex, changeValue }
```

#### THORChain

```bash
# Send RUNE (amount in smallest unit, 1 RUNE = 100_000_000)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendThor '("thor1RecipientAddress", 100_000_000 : nat64, "")' --network ic
# Returns: Result<Text, Text> — ok = tx hash
# memo field can be used for THORChain-specific operations
```


### 3.4 Swap & DEX (1 action each)

#### Raydium (Solana) — `swapRaydiumApiUser`

```bash
# Swap SOL -> USDC on Raydium
# Args: inputMint, outputMint, amount (lamports), slippageBps, wrapSol, unwrapSol, inputAta, outputAta
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapRaydiumApiUser '(
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  500_000_000 : nat64,
  150 : nat64,
  true,
  false,
  null,
  null
)' --network ic
# Returns: RaydiumApiSwapResult (FLAT record, NOT a variant)
# { inputAmount, outputAmount, priceImpactPct, txSignature }
```

**Other Raydium swap functions:**
```bash
# Canister-wallet Raydium swap (the canister's own Solana wallet, not yours)
# Same args as swapRaydiumApiUser, but uses canister address
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapRaydiumApi '("So11111111111111111111111111111111111111112", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 500_000_000 : nat64, 150 : nat64, true, false, null, null)' --network ic

# Native on-chain Raydium swap (no API dependency, requires ATAs and minimum amount)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapRaydiumNative '(500_000_000 : nat64, 450_000 : nat64, "YourSourceAta", "YourDestAta")' --network ic
# Returns: NativeSwapResult { inputAmountLamports, outputAmountReceived, raydiumTxSig, note }
```

**Key Raydium parameters:**
- `wrapSol = true` when input is native SOL
- `unwrapSol = true` when output should be native SOL (not wrapped)
- `inputAta` / `outputAta` = null to auto-detect, or specify explicitly
- slippageBps: 150 = 1.5%

**Common Solana token mints:**
- SOL: `So11111111111111111111111111111111111111112`
- USDC: `EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v`
- USDT: `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB`

#### Uniswap V3 (EVM) — `swapTokens` / `swapTokensMultiHop`

```bash
# Single-hop swap (requires quoteId from getTokenQuote first)
# Step 1: Get quote (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getTokenQuote '("ETH", "USDC", 100_000_000_000_000_000 : nat, "https://eth.llamarpc.com")' --network ic

# Step 2: Execute swap with quoteId
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapTokens '("quoteId-from-step1", "ETH", "USDC", 100_000_000_000_000_000 : nat, 300 : nat, false, "https://eth.llamarpc.com")' --network ic
# Returns: Result<{expectedTxHash, approvalTxHash, nonce, note, path, senderAddress, amountIn, minAmountOut}, Text>

# Multi-hop swap (auto-routes, no quoteId needed)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapTokensMultiHop '("WBTC", "USDC", 10_000_000 : nat, 300 : nat, false, 1 : nat, "https://eth.llamarpc.com")' --network ic
# Returns: Result<{amountIn, approvalTxHash, expectedTxHash, isDirect, minAmountOut, nonce, note, path, pathSymbols, senderAddress}, Text>
```

**Convenience ETH/USDC swaps:**
```bash
# Swap ETH -> USDC (simplified)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapETHForUSDC '(100_000_000_000_000_000 : nat, 300 : nat, "https://eth.llamarpc.com")' --network ic

# Swap USDC -> ETH (simplified)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapUSDCForETH '(1_000_000_000 : nat, 300 : nat, "https://eth.llamarpc.com")' --network ic
```

#### ICP DEX (ICPSwap + KongSwap) — `executeICPDexSwap`

```bash
# Swap ICP -> ckBTC via best DEX
dfx canister call urs2a-ziaaa-aaaad-aembq-cai executeICPDexSwap '(record {
  tokenIn = "ryjl3-tyaaa-aaaaa-aaaba-cai";
  tokenOut = "mxzaz-hqaaa-aaaar-qaada-cai";
  amountIn = 500_000_000 : nat;
  minAmountOut = 0 : nat;
  slippagePct = 1.0 : float64;
  preferredDex = null
})' --network ic
# Returns: Result<SwapResultIcp, Text> — ok: { amountIn, amountOut, dex, fee, message, success, txId }

# Or prefer a specific DEX:
# preferredDex = opt variant { ICPSwap }
# preferredDex = opt variant { KongSwap }
```

#### Cetus (SUI) — `executeSuiSwap`

```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai executeSuiSwap '(variant { mainnet }, "0x2::sui::SUI", "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN", "500000000", "490000000")' --network ic
# Returns: SwapResultSui (FLAT record)
# { success, txDigest, amountOut, error }
```

#### Minswap (Cardano) — `executeMinswapSwap`

```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai executeMinswapSwap '("lovelace", "target-token-id", 5_000_000 : nat64, 1.0 : float64)' --network ic
# Returns: Result<Text, Text> — ok = tx hash
```

#### XRP DEX — `xrpSwap`

```bash
# XRP DEX swap using payment paths
# First find paths (FREE):
dfx canister call urs2a-ziaaa-aaaad-aembq-cai xrpFindPaths '(record { currency = "USD"; issuer = "rIssuer"; value = "100" }, vec { record { currency = "XRP"; issuer = ""; value = "1000" } })' --network ic

# Then execute swap:
dfx canister call urs2a-ziaaa-aaaad-aembq-cai xrpSwap '(record { currency = "USD"; issuer = "rIssuer"; value = "100" }, record { currency = "XRP"; issuer = ""; value = "200" }, "paths-json-from-findPaths", 300 : nat)' --network ic
# Returns: SwapResultXrp (FLAT record)
# { success, txHash, explorerUrl, message, sourceAmount, destinationAmount }
```

### 3.5 Swap Quotes (FREE)

```bash
# Raydium quote
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getRaydiumQuote '("So11111111111111111111111111111111111111112", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 500_000_000 : nat64, 150 : nat64)' --network ic
# Returns: { inputAmount, minOutputAmount, outputAmount, priceImpactPct, routeInfo, success }

# ICP DEX quote (aggregates ICPSwap + KongSwap)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexQuote '("ryjl3-tyaaa-aaaaa-aaaba-cai", "mxzaz-hqaaa-aaaar-qaada-cai", 500_000_000 : nat, 1.0 : float64)' --network ic
# Returns: AggregatedQuote { best, icpswapQuote, kongswapQuote }

# SUI swap quote
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getSuiSwapQuote '(variant { mainnet }, "0x2::sui::SUI", "0xUsdcType", "500000000", 150 : nat64)' --network ic
# Returns: opt SwapQuote { amountIn, amountOut, estimatedGas, priceImpact, routerData }

# Minswap (Cardano) quote
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMinswapQuote '("lovelace", "target-token", 5_000_000 : nat64, 1.0 : float64)' --network ic
# Returns: Result<MinswapEstimateResponse, Text>

# EVM token quote (Uniswap V3 routing)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getTokenQuote '("ETH", "USDC", 1_000_000_000_000_000_000 : nat, "https://eth.llamarpc.com")' --network ic
# Returns: Result<{ amountIn, amountOut, fromToken, toToken, path }, Text>

# EVM multi-hop quote
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getTokenQuoteMultiHop '("WBTC", "USDC", 10_000_000 : nat, "https://eth.llamarpc.com")' --network ic

# EVM ETH/USDC convenience quotes
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getUSDCQuote '(1_000_000_000_000_000_000 : nat, "https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getETHQuote '(1_000_000_000 : nat, "https://eth.llamarpc.com")' --network ic

# XRP path finding
dfx canister call urs2a-ziaaa-aaaad-aembq-cai xrpFindPaths '(record { currency = "USD"; issuer = "rIssuer"; value = "100" }, vec { record { currency = "XRP"; issuer = ""; value = "500" } })' --network ic
```


### 3.6 DeFi -- Aave V3 (1 action each)

```bash
# Supply ETH to Aave (earn yield)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai aaveSupplyEth '(100_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<SupplyEthResult, Text> — ok: { txHash, ethSupplied, nonce, senderAddress, note }

# Withdraw ETH from Aave
dfx canister call urs2a-ziaaa-aaaad-aembq-cai aaveWithdrawEth '(100_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<WithdrawEthResult, Text> — ok: { txHash, approvalTxHash, ethWithdrawn, nonce, senderAddress, note }

# Supply ERC-20 token to Aave
dfx canister call urs2a-ziaaa-aaaad-aembq-cai aaveSupplyToken '("0xTokenAddress", 1_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<SupplyTokenResult, Text>

# Withdraw ERC-20 token from Aave
dfx canister call urs2a-ziaaa-aaaad-aembq-cai aaveWithdrawToken '("0xTokenAddress", 1_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<WithdrawTokenResult, Text>

# Check Aave balances (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getAWethBalance '("0xYourEvmAddress", "https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getATokenBalance '("0xATokenAddress", "0xYourEvmAddress", "https://eth.llamarpc.com")' --network ic
```

### 3.7 DeFi — Lido Staking (1 action each)

```bash
# Stake ETH -> stETH (~3-4% APY)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai stakeEthForStEth '(500_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<StakeResult, Text> — ok: { txHash, ethStaked, nonce, senderAddress, note }

# Wrap stETH -> wstETH (DeFi composability)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai wrapStEth '(500_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<WrapResult, Text> — ok: { txHash, approvalTxHash, stEthWrapped, nonce, senderAddress, note }

# Unwrap wstETH -> stETH
dfx canister call urs2a-ziaaa-aaaad-aembq-cai unwrapWstEth '(500_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<UnwrapResult, Text> — ok: { txHash, wstEthUnwrapped, nonce, senderAddress, note }

# Check Lido balances (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getStEthBalance '("0xYourEvmAddress", "https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getWstEthBalance '("0xYourEvmAddress", "https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getStEthAllowance '("0xYourEvmAddress", "https://eth.llamarpc.com")' --network ic
```

### 3.8 DeFi — Uniswap V3 Liquidity (1 action each)

```bash
# Add ETH + token liquidity
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addLiquidityETH '("USDC", 1_000_000_000 : nat, 500_000_000_000_000_000 : nat, 300 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<{ txHash, senderAddress, nonce, tokenAddress, amountTokenDesired, amountETHDesired, amountTokenMin, amountETHMin, approvalTxHash, note }, Text>

# Add token-token liquidity
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addLiquidity '("USDC", "WBTC", 1_000_000_000 : nat, 10_000_000 : nat, 300 : nat, "https://eth.llamarpc.com", null)' --network ic

# Remove ETH + token liquidity
dfx canister call urs2a-ziaaa-aaaad-aembq-cai removeLiquidityETH '("USDC", 1_000_000 : nat, 300 : nat, false, "https://eth.llamarpc.com", null)' --network ic

# Remove token-token liquidity
dfx canister call urs2a-ziaaa-aaaad-aembq-cai removeLiquidity '("USDC", "WBTC", 1_000_000 : nat, 300 : nat, "https://eth.llamarpc.com", null)' --network ic

# Read pool data (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getPairAddress '("USDC", "WETH", "https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getPoolReserves '("USDC", "WETH", "https://eth.llamarpc.com")' --network ic
```

### 3.9 DeFi — ICP DEX Liquidity (1 action each)

```bash
# Add liquidity on ICPSwap or KongSwap
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addICPLiquidity '(record {
  poolId = "pool-id-here";
  dex = variant { ICPSwap };
  token0 = "ryjl3-tyaaa-aaaaa-aaaba-cai";
  token1 = "mxzaz-hqaaa-aaaar-qaada-cai";
  token0Amount = 500_000_000 : nat;
  token1Amount = 50_000 : nat;
  slippagePct = 1.0 : float64
})' --network ic
# Returns: Result<AddLiquidityResult, Text>

# Remove liquidity
dfx canister call urs2a-ziaaa-aaaad-aembq-cai removeICPLiquidity '(record {
  poolId = "pool-id-here";
  dex = variant { ICPSwap };
  lpTokens = 1_000_000 : nat;
  slippagePct = 1.0 : float64
})' --network ic

# View LP positions (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPLPPositions '()' --network ic

# Browse pools and tokens (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexPools '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexTokens '()' --network ic

# AI rebalance recommendations (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPRebalanceRecommendations '(
  record {
    targetCategories = vec { "DeFi"; "Infrastructure" };
    riskTolerance = "medium";
    minApy = opt (5.0 : float64);
    maxImpermanentLoss = opt (10.0 : float64);
    autoCompound = true
  },
  vec { record { "ryjl3-tyaaa-aaaaa-aaaba-cai"; 500_000_000 : nat } },
  null
)' --network ic
```


### 3.10 Strategy Engine (1 action per rule creation/modification)

```bash
# Initialize automation (call once per principal)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai initAutomation '()' --network ic

# Create a DCA rule (buy token at intervals)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addStrategyRule '(record {
  id = 0 : nat;
  ruleType = variant { DCA };
  status = variant { Active };
  chainType = variant { Solana };
  triggerPrice = 0 : nat64;
  sizePct = 100 : nat;
  positionId = 0 : nat;
  createdAt = 0 : int;
  dcaConfig = opt record {
    amountPerBuy = 100_000_000 : nat;
    executedBuys = 0 : nat;
    intervalSeconds = 3600 : nat;
    nextExecutionTime = 0 : int;
    tokenIn = "So11111111111111111111111111111111111111112";
    tokenOut = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    totalBuys = 24 : nat
  };
  lpConfig = null;
  scheduledConfig = null;
  apyMigrationConfig = null;
  volatilityConfig = null;
  swapAmountLamports = opt (100_000_000 : nat64);
  swapAmountWei = null
})' --network ic
# Returns: Result<Nat, Text> — ok = rule ID

# Create a StopLoss rule
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addStrategyRule '(record {
  id = 0 : nat;
  ruleType = variant { StopLoss };
  status = variant { Active };
  chainType = variant { Solana };
  triggerPrice = 95_000_000 : nat64;
  sizePct = 100 : nat;
  positionId = 0 : nat;
  createdAt = 0 : int;
  dcaConfig = null;
  lpConfig = null;
  scheduledConfig = null;
  apyMigrationConfig = null;
  volatilityConfig = null;
  swapAmountLamports = opt (500_000_000 : nat64);
  swapAmountWei = null
})' --network ic

# Create a TakeProfit rule
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addStrategyRule '(record {
  id = 0 : nat;
  ruleType = variant { TakeProfit };
  status = variant { Active };
  chainType = variant { Solana };
  triggerPrice = 250_000_000 : nat64;
  sizePct = 50 : nat;
  positionId = 0 : nat;
  createdAt = 0 : int;
  dcaConfig = null;
  lpConfig = null;
  scheduledConfig = null;
  apyMigrationConfig = null;
  volatilityConfig = null;
  swapAmountLamports = opt (250_000_000 : nat64);
  swapAmountWei = null
})' --network ic

# List all my rules (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyStrategyRules '()' --network ic

# Update rule status (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai updateStrategyRuleStatus '(1 : nat, variant { Paused })' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai updateStrategyRuleStatus '(1 : nat, variant { Active })' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai updateStrategyRuleStatus '(1 : nat, variant { Cancelled })' --network ic

# Delete a rule (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai deleteStrategyRule '(1 : nat)' --network ic

# View execution logs (FREE, query)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getStrategyLogs '()' --network ic
```

**Rule types and their required configs:**

| Rule Type | Required Config | Description |
|-----------|----------------|-------------|
| `#DCA` | `dcaConfig` | Dollar-cost average: buy fixed amounts at intervals |
| `#StopLoss` | `triggerPrice`, `sizePct` | Sell when price drops below threshold |
| `#TakeProfit` | `triggerPrice`, `sizePct` | Sell when price rises above target |
| `#Rebalance` | `lpConfig` | Adjust concentrated LP positions |
| `#Scheduled` | `scheduledConfig` | Time-based actions (swaps, LP adds/removes) |
| `#APYMigration` | `apyMigrationConfig` | Auto-migrate LP to higher-yield pools |
| `#LiquidityProvision` | `lpConfig` | Automated LP entry/exit based on conditions |
| `#VolatilityTrigger` | `volatilityConfig` | React to volatility spikes (buy dips, sell pumps) |

**Rule statuses:** `#Active`, `#Paused`, `#Cancelled`, `#Executed`, `#Executing`, `#Failed`, `#Draft`, `#Confirmed`, `#Ready`

**Chain types:** `#Solana`, `#Evm`

### 3.11 Developer & Billing (mixed FREE/1 action)

```bash
# Register your canister as a developer (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister '(principal "your-canister-id", "My App Name")' --network ic

# Get your developer key (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyDeveloperKey '()' --network ic

# Regenerate developer key (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai regenerateDeveloperKey '()' --network ic

# Validate a developer key (FREE, query)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai validateDeveloperKey '("dev-key-here")' --network ic

# Get your gateway account info (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyGatewayAccount '()' --network ic

# Get developer account details (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyDeveloperAccount '()' --network ic

# Deposit credits (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai depositGatewayCredits '("ICP", 500_000_000 : nat)' --network ic

# Purchase subscription (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai purchaseGatewayPackage '(variant { Developer }, "ICP")' --network ic

# View deposit history (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyGatewayDeposits '()' --network ic

# Check canister usage (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyCanisterUsage '(principal "your-canister-id")' --network ic

# View pricing info (FREE, query)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getGatewayPricing '()' --network ic
```

### 3.12 Sign-Only Endpoints (1 action each)

Sign-only mode: the canister signs the transaction but does NOT broadcast. Your frontend or backend handles broadcasting. No HTTP outcalls needed by the canister (cheaper in cycles).

There are two naming patterns:
- `sign*Relayer` -- the "relayer" pattern, generally identical to the "offchain" pattern
- `sign*Offchain` -- the "offchain" variant, same functionality

```bash
# Solana transfer (sign only) -- offchain variant also available as signSolTransferOffchain
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signSolTransferRelayer '("ToAddress", 500_000_000 : nat64, "RecentBlockhashBase58")' --network ic
# Returns: { signedTxBase64, txMessage, signature, publicKey }

# Solana swap transactions (sign only, array of txs)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signSolSwapTxsRelayer '(vec { "TxBase64_1"; "TxBase64_2" })' --network ic
# Returns: vec { signedTxBase64, signature }

# EVM transaction with data (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai buildAndSignEvmTxWithData '("0xTo", 0 : nat, vec { 0; 1; 2 }, 5 : nat, 21000 : nat, 20_000_000_000 : nat, 1 : nat)' --network ic
# Returns: { rawTxHex_v0, rawTxHex_v1, txHash, signature }

# EVM simple transfer (sign only, no data field)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai buildAndSignEvmTransaction '("0xTo", 100_000_000_000_000_000 : nat, 5 : nat, 21000 : nat, 20_000_000_000 : nat, 1 : nat)' --network ic

# NEAR transfer (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signNearTransferRelayer '("recipient.near", 1_000_000_000_000_000_000_000_000 : nat, 100 : nat64, vec { 0; 1; 2 })' --network ic

# Aptos transfer (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signAptosTransferRelayer '("0xToAddress", 50_000_000 : nat64, 1 : nat64, 1 : nat8, 9999999999 : nat64)' --network ic

# TON transfer (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signTonTransferRelayer '("UQToAddress", 500_000_000 : nat64, 5 : nat32, false, null, 60 : nat32, "active")' --network ic

# SUI transfer (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signSuiTransferRelayer '("0xRecipient", 500_000_000 : nat64, "0xGasCoinId", 100 : nat64, "CoinDigest")' --network ic

# Cardano transfer (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signCardanoTransferRelayer '("addr1Recipient", 2_000_000 : nat64, vec { record { tx_hash = "hash"; tx_index = 0 : nat64; value = 5_000_000 : nat64 } }, "addr1SenderBech32")' --network ic

# XRP payment (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signXrpTransferRelayer '("rDestAddress", "10.0", 100 : nat32, 200 : nat32, 12 : nat64, null)' --network ic

# Tron transfer (sign only)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai signTrxTransferRelayer '("TToAddress", 10_000_000 : nat64, vec { 0; 1 }, vec { 0; 1; 2; 3; 4; 5; 6; 7 }, 1700000000000 : int64, 1699999000000 : int64)' --network ic
```

### 3.13 Token Operations (1 action each)

```bash
# Create Solana ATA (Associated Token Account) for a mint
dfx canister call urs2a-ziaaa-aaaad-aembq-cai createMySolanaAtaForMint '("MintBase58", "AtaBase58")' --network ic
# Returns: CreateAtaResult { ata, mint, owner, txSignature, blockhash }

# Alternative ATA creation
dfx canister call urs2a-ziaaa-aaaad-aembq-cai createMyAta '("MintBase58", "AtaBase58")' --network ic
# Returns: Result<record { ... }, Text>

# Create ATA with specific token program (Token-2022)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai createMySolanaAtaForMintWithProgram '("MintBase58", "AtaBase58", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")' --network ic

# Create canister's ATA (for developer canisters that need their own token accounts)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai createCanisterSolanaAtaForMint '("MintBase58", "AtaBase58")' --network ic

# Create canister's ATA with specific token program
dfx canister call urs2a-ziaaa-aaaad-aembq-cai createCanisterSolanaAtaForMintWithProgram '("MintBase58", "AtaBase58", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")' --network ic

# Lock Solana tokens and mint ICRC equivalent
dfx canister call urs2a-ziaaa-aaaad-aembq-cai lockMyTokens '(1_000_000 : nat64, "YourSourceAtaBase58")' --network ic
# Returns: LockResult { icrcMinted, icrcBlockIndex, txSignature, note }

# Mint tokens on SUI (requires package config)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai mintSuiTokens '("0xRecipientAddress", 1_000_000 : nat64)' --network ic
# Returns: Result<SendResult, Text>

# Burn tokens on SUI (with ICP recipient for cross-chain)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai burnSuiTokens '("0xCoinObjectId", principal "icp-recipient-principal", 12345 : nat64)' --network ic
# Returns: Result<SendResult, Text>

# Register a CloakCoin deposit (track incoming UTXOs)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerCloakDeposit '("tx-hash-hex")' --network ic
# Returns: Result<Text, Text>

# Set XRP trustline (required before receiving IOUs)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai xrpSetTrustline '("USD", "rIssuerAddress", "1000000")' --network ic
# Returns: TrustSetResult { success, txHash, explorerUrl, message }

# Get XRP account lines/trustlines (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai xrpGetAccountLines '()' --network ic

# Get XRP AMM info (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai xrpGetAmmInfo '("USD", "rIssuer1", "EUR", "rIssuer2")' --network ic
```

### 3.14 Custom EVM Contracts (1 action write / FREE read)

```bash
# Read any contract (FREE) — e.g., Chainlink ETH/USD price feed
dfx canister call urs2a-ziaaa-aaaad-aembq-cai callEvmContractRead '("0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419", "feaf968c", vec {}, "https://eth.llamarpc.com")' --network ic
# functionSelector: 4-byte hex WITHOUT 0x prefix
# Returns: Result<Text, Text> — ok = hex-encoded response

# Write to any contract (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai callEvmContractWrite '("0xContractAddress", "a9059cbb", vec { "0xRecipientHexPadded"; "0xAmountHexPadded" }, "https://eth.llamarpc.com", 1 : nat, 0 : nat, null)' --network ic
# Returns: Result<SendResultEvm, Text>
```

**Common 4-byte selectors (keccak256 first 4 bytes):**
- `balanceOf(address)` = `70a08231`
- `transfer(address,uint256)` = `a9059cbb`
- `approve(address,uint256)` = `095ea7b3`
- `totalSupply()` = `18160ddd`
- `latestRoundData()` = `feaf968c`
- `decimals()` = `313ce567`

### 3.15 Utility Functions (FREE)

```bash
# Health check
dfx canister call urs2a-ziaaa-aaaad-aembq-cai health '()' --network ic

# Version
dfx canister call urs2a-ziaaa-aaaad-aembq-cai version '()' --network ic

# Bitcoin max sendable amount
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getBitcoinMaxSendAmount '(null)' --network ic

# Litecoin max sendable amount
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getLitecoinMaxSendAmount '(null)' --network ic

# Bitcoin fee estimation
dfx canister call urs2a-ziaaa-aaaad-aembq-cai estimateBitcoinFee '(2 : nat, 2 : nat, null)' --network ic

# Bitcoin recommended fee rate
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getBitcoinRecommendedFeeRate '()' --network ic

# Validate addresses
dfx canister call urs2a-ziaaa-aaaad-aembq-cai isValidBitcoinAddress '("bc1q...")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai isValidLitecoinAddress '("ltc1q...")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai isValidSuiAddress '("0x...")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai isValidTonAddress '("UQ...")' --network ic

# EVM address validation
dfx canister call urs2a-ziaaa-aaaad-aembq-cai verifyEvmAddressFormat '("0xAddress")' --network ic

# Solana account existence check
dfx canister call urs2a-ziaaa-aaaad-aembq-cai solanaAccountExists '("SolanaAddress")' --network ic

# Get supported chains/tokens
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getSupportedChains '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getSupportedTokens '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getTokenInfo '("ETH")' --network ic

# EVM nonce management
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getEvmNonceState '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai resyncEvmNonce '("https://eth.llamarpc.com")' --network ic

# Invalidate cached nonce (forces re-fetch on next call)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai invalidateEvmNonce '()' --network ic

# Force clear ALL nonce state for your address
dfx canister call urs2a-ziaaa-aaaad-aembq-cai forceClearEvmNonceState '()' --network ic

# Force set a specific nonce (use with extreme caution!)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai forceSetEvmNonce '(42 : nat)' --network ic

# Rollback nonce after a broadcast failure (must call this if broadcast fails!)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_rollbackEvmNonce '("0xYourEvmAddress", 42 : nat)' --network ic

# EVM gas price (legacy, simple)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai preflightGasPrice '("https://eth.llamarpc.com", null)' --network ic
# With buffer: preflightGasPrice '("https://eth.llamarpc.com", opt (500 : nat))' = 5% buffer

# EVM gas preflight per operation type (more accurate, uses quoteId from a prior quote)
# These return a GasQuote with buffered gas price, estimated fee, and a quoteId you pass to the write call.
dfx canister call urs2a-ziaaa-aaaad-aembq-cai preflightEvmSendGas '("quoteId", 100_000_000_000_000_000 : nat, "https://eth.llamarpc.com", 1 : nat)' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai preflightEvmSwapGas '("quoteId", "ETH", 1_000_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai preflightEvmApproveGas '("quoteId", "https://eth.llamarpc.com", null)' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai preflightEvmAddLiquidityGas '("quoteId", 500_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai preflightEvmRemoveLiquidityGas '("quoteId", "https://eth.llamarpc.com", null)' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai preflightEvmContractWriteGas '("quoteId", 0 : nat, "https://eth.llamarpc.com", null)' --network ic
# Returns: Result<GasQuote, Text>
# GasQuote: { bufferedGasPriceWei, bufferedFeeWei, estimatedFee, estimatedFeeWei, gasPriceWei, gasLimit, quoteId }

# Invalidate a gas quote (if you decide not to use it)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai invalidateGasQuote '("quoteId")' --network ic

# TON account info
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyTonAccountInfo '()' --network ic

# SUI coins
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMySuiCoins '()' --network ic

# Cardano full wallet balance (including tokens)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getCardanoWalletBalance '()' --network ic

# NEAR user account info
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getNearUserAccountInfo '()' --network ic

# EVM swap path validation (FREE, query)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai validateSwapPath '("ETH", "USDC")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getRoutingSuggestions '("WBTC", "USDC")' --network ic

# Verify TON wallet code (diagnostic)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai verifyTonWalletCode '()' --network ic

# Set TON API key (for higher rate limits with TON Center)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai setTonApiKey '("your-api-key")' --network ic

# Check if TON API key is configured
dfx canister call urs2a-ziaaa-aaaad-aembq-cai hasTonApiKey '()' --network ic

# Unregister a canister from your developer account
dfx canister call urs2a-ziaaa-aaaad-aembq-cai unregisterDeveloperCanister '(principal "your-canister-id")' --network ic
```

### 3.15b Cache Management

If address derivations seem stale or you want to force a fresh derivation, clear the cache:

```bash
# Clear ALL address caches (all chains)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai clearAllCaches '()' --network ic

# Clear specific chain caches
dfx canister call urs2a-ziaaa-aaaad-aembq-cai clearEvmCache '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai clearSolanaAddressCache '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai clearSuiCache '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai clearTonCache '()' --network ic

# Check cache sizes (FREE, query)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getTotalCacheSize '()' --network ic
# Returns: record { aptos; bitcoin; cardano; evm; litecoin; near; solana; sui; thorchain; ton; total; tron }

dfx canister call urs2a-ziaaa-aaaad-aembq-cai getEvmCacheSize '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getSuiCacheSize '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getTonCacheSize '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getGasOracleCacheSize '()' --network ic
```


### 3.16 exp_ Sign-Only Endpoints (1 action each)

These `exp_` (experimental) endpoints sign transactions with caller-provided chain data. They do NOT broadcast. Your app fetches chain state (blockhash, UTXOs, nonce, gas) and passes it in. The canister only signs.

```bash
# Sign Solana transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signSolTransfer '("ToAddr", 500_000_000 : nat64, "RecentBlockhash")' --network ic

# Sign SPL token transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signSplTransfer '(1_000_000 : nat64, "SourceAta", "DestAta", "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "RecentBlockhash")' --network ic

# Sign Raydium swap
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signRaydiumSwapUser '("InputMint", "OutputMint", 500_000_000 : nat64, 150 : nat64, true, false, null, null, "RecentBlockhash")' --network ic

# Sign EVM send
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signEvmSend '("0xTo", 100_000_000_000_000_000 : nat, 1 : nat, 20_000_000_000 : nat, 21000 : nat, vec {}, null, "https://eth.llamarpc.com")' --network ic

# Sign EVM swap
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signEvmSwap '("ETH", "USDC", 1_000_000_000_000_000_000 : nat, 300 : nat, false, 20_000_000_000 : nat, 300000 : nat, null, "https://eth.llamarpc.com")' --network ic

# Sign Bitcoin transfer (with UTXOs)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signBtcTransfer '("bc1qTo", 50_000 : nat64, 10 : nat64, vec { record { txHash = "utxo_txhash"; txIndex = 0 : nat32; value = 100_000 : nat64 } })' --network ic

# Sign Litecoin transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signLtcTransfer '("ltc1qTo", 100_000 : nat64, 5 : nat64, vec { record { txHash = "utxo_txhash"; txIndex = 0 : nat32; value = 200_000 : nat64 } })' --network ic

# Sign CloakCoin transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signCloakTransfer '("CloakAddr", 1_000_000 : nat64, vec { record { txHash = "utxo_txhash"; txIndex = 0 : nat32; value = 2_000_000 : nat64 } })' --network ic

# Sign Cardano send
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signCardanoSend '("addr1To", 2_000_000 : nat64, vec { record { tx_hash = "hash"; tx_index = 0 : nat64; value = 5_000_000 : nat64 } })' --network ic

# Sign SUI transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signSuiTransfer '("0xRecipient", 500_000_000 : nat64, "0xGasCoinId", 100 : nat64, "CoinDigest")' --network ic

# Sign NEAR transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signNearTransfer '("recipient.near", 1_000_000_000_000_000_000_000_000 : nat, 100 : nat64, vec { 0; 1; 2 })' --network ic

# Sign Aptos transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signAptosTransfer '("0xTo", 50_000_000 : nat64, 1 : nat64, 1 : nat8, 9999999999 : nat64)' --network ic

# Sign TON transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signTonTransfer '("UQTo", 500_000_000 : nat64, 5 : nat32, false, null, 60 : nat32, "active")' --network ic

# Sign Tron transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signTronTransfer '("TTo", 10_000_000 : nat64, vec { 0; 1 }, vec { 0; 1; 2; 3; 4; 5; 6; 7 }, 1700000000000 : int64, 1699999000000 : int64)' --network ic

# Sign Thor transfer
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signThorTransfer '("thor1To", 100_000_000 : nat, "thorchain-mainnet-v1", 100 : nat64, 5 : nat64, "")' --network ic

# Sign XRP payment
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signXrpPayment '("rDest", "10.0", 100 : nat32, 200 : nat32, 12 : nat64, null)' --network ic

# Sign XRP IOU payment
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signXrpIOUPayment '("rDest", "USD", "rIssuer", "100.0", 100 : nat32, 200 : nat32, 12 : nat64, null)' --network ic

# Sign XRP trustline
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signXrpTrustline '("USD", "rIssuer", "1000000", 100 : nat32, 200 : nat32, 12 : nat64)' --network ic

# Sign XRP swap
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signXrpSwap '(record { currency = "USD"; issuer = "rIssuer"; value = "100" }, record { currency = "XRP"; issuer = ""; value = "200" }, 100 : nat32, 200 : nat32, 12 : nat64)' --network ic

# Sign Minswap swap (Cardano) [PLANNED -- not yet in current .did]
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signMinswapSwap '("lovelace", "target-token", 5_000_000 : nat64, 1.0 : float64, "{raw-json-from-estimate}")' --network ic

# Sign EVM add/remove liquidity [PLANNED -- not yet in current .did]
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signAddLiquidityETH '("USDC", 1_000_000_000 : nat, 500_000_000_000_000_000 : nat, 300 : nat, 20_000_000_000 : nat, 500000 : nat, null, "https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signRemoveLiquidityETH '("USDC", 1_000_000 : nat, 900_000 : nat, 400_000_000_000_000_000 : nat, false, 20_000_000_000 : nat, 500000 : nat, null, "https://eth.llamarpc.com")' --network ic

# Sign CLMM swap (concentrated liquidity on Raydium) [IN .did]
dfx canister call urs2a-ziaaa-aaaad-aembq-cai exp_signClmmSwapUser '(variant { TSLAX_USDC }, 1_000_000 : nat64, 150 : nat64, true, null, null, "RecentBlockhash")' --network ic
```

**NOTE on exp_ sign-only functions:** The following exp_ functions are documented here but are **planned / not yet in the current canister .did file**. They may be available in a future deployment. The equivalent `sign*Relayer` functions (Section 3.13) ARE available now:

- `exp_signBtcTransfer`, `exp_signLtcTransfer`, `exp_signCloakTransfer` -- use relayer Bitcoin/Litecoin signing instead
- `exp_signCardanoSend`, `exp_signCardanoTokenSend` -- use `signCardanoTransferRelayer`
- `exp_signNearTransfer` -- use `signNearTransferRelayer`
- `exp_signAptosTransfer` -- use `signAptosTransferRelayer`
- `exp_signTonTransfer` -- use `signTonTransferRelayer`
- `exp_signTronTransfer` -- use `signTrxTransferRelayer`
- `exp_signSuiTransfer` -- use `signSuiTransferRelayer`
- `exp_signThorTransfer` -- no relayer equivalent yet
- `exp_signXrpPayment`, `exp_signXrpIOUPayment`, `exp_signXrpTrustline`, `exp_signXrpSwap` -- use `signXrpTransferRelayer`
- `exp_signRaydiumSwapUser`, `exp_signDirectSwapUser` -- use `exp_signRaydiumSwap` or `signSolSwapTxsRelayer`
- `exp_signAddLiquidity`, `exp_signAddLiquidityETH`, `exp_signRemoveLiquidity`, `exp_signRemoveLiquidityETH` -- use direct LP functions
- `exp_signMinswapSwap` -- use `executeMinswapSwap` directly

**Functions confirmed in the current .did:** `exp_signSolTransfer`, `exp_signSplTransfer`, `exp_signRaydiumSwap`, `exp_signEvmSend`, `exp_signEvmSwap`, `exp_signClmmSwapUser`, `exp_rollbackEvmNonce`

### 3.17 CLMM (Concentrated Liquidity) Swaps (1 action each)

```bash
# Execute CLMM swap (Raydium concentrated liquidity pools)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapClmmUser '(variant { TSLAX_USDC }, 1_000_000 : nat64, 150 : nat64, true, null, null)' --network ic
# Returns: ClmmSwapResult { outputAmount, priceImpactPct, txSignature }

# Get CLMM quote (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getClmmQuote '(variant { TSLAX_USDC }, 1_000_000 : nat64, 150 : nat64, true)' --network ic

# List available CLMM pools (FREE, query)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai listClmmPools '()' --network ic

# Check if pool is ready (FREE, query)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai isClmmPoolReady '(variant { TSLAX_USDC })' --network ic
```

**Available CLMM pool IDs:** `CRCLX_USDC`, `CRCLX_WSOL`, `GOOGLX_USDC`, `QQQX_WSOL`, `TSLAX_USDC`, `TSLAX_WSOL`, `USD1_USDC`

---

## Section 4: Type Reference

### Address Types

```candid
type SolanaAddressInfo = record { address: text; publicKeyHex: text; publicKeyBytes: vec nat8 };
type EvmAddressInfo = record { evmAddress: text; publicKeyHex: text };
type AddressInfo = record { bech32Address: text; hash160Hex: text; pubKeyHex: text };
type CardanoAddressInfo = record { bech32Address: text; addressBytesHex: text; paymentPubKeyHex: text; stakePubKeyHex: text };
type SuiAddressInfo = record { suiAddress: text; publicKeyHex: text; publicKeyBytes: vec nat8 };
type XrpAddressInfo = record { classicAddress: text; accountIdHex: text; accountIdBytes: vec nat8; publicKeyHex: text };
type TonAddressInfo = record { bounceable: text; nonBounceable: text; rawAddress: text; publicKeyHex: text; stateInitBocBase64: text };
type TronAddressInfo = record { base58Address: text; hexAddress: text; publicKeyHex: text };
type AptosAddressInfo = record { address: text; publicKeyHex: text };
type PubKeyInfo = record { implicitAccountId: text; publicKeyBase58: text; publicKeyHex: text };
type CloakAddressInfo = record { base58Address: text; addressBytesHex: text; hash160Hex: text; pubKeyHex: text };
```

### Send Result Types

```candid
type SendResult = record { txHash: text; senderAddress: text; note: text };
type SendResultBtcLtc = record { txid: text; amount: nat64; fee: nat64; senderAddress: text; recipientAddress: text; note: text };
type SendICPResult = record { amount: nat64; blockHeight: nat64; fee: nat64; from: principal; to: principal };
type SendICRC1Result = record { amount: nat; blockHeight: nat; fee: nat; to: principal; token: text };
type SendResultEvm = record { expectedTxHash: text; nonce: nat; senderAddress: text; note: text };
type SendResultTon = record { txHash: text; bocBase64: text; senderAddress: text; success: bool; error: opt text };
type SendResultXrp = record { txHash: text; explorerUrl: text; message: text; success: bool; sequence: nat32; ledgerUsed: nat32 };
type SendResultCloak = record { txHash: text; txHex: text; changeValue: nat64 };
type TransferAndSendResult = record { txSignature: text; serializedTxBase64: text; blockhash: text };
```

### Swap/Quote Types

```candid
type RaydiumApiSwapResult = record { inputAmount: text; outputAmount: text; priceImpactPct: text; txSignature: text };
type SwapResultIcp = record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; message: text; success: bool; txId: nat };
type SwapResultSui = record { success: bool; txDigest: text; amountOut: text; error: opt text };
type SwapResultXrp = record { success: bool; txHash: text; explorerUrl: text; message: text; sourceAmount: text; destinationAmount: text };
type DexId = variant { ICPSwap; KongSwap };
type SwapRequest = record { tokenIn: text; tokenOut: text; amountIn: nat; minAmountOut: nat; slippagePct: float64; preferredDex: opt DexId };
type AggregatedQuote = record { best: SwapQuoteIcp; icpswapQuote: opt SwapQuoteIcp; kongswapQuote: opt SwapQuoteIcp; timestamp: int };
type SwapQuoteIcp = record { amountIn: nat; amountOut: nat; dex: DexId; fee: nat; minAmountOut: nat; poolId: opt text; priceImpactPct: text; rawData: text; route: vec text; success: bool; tokenIn: text; tokenOut: text };
type SwapQuote = record { amountIn: text; amountOut: text; estimatedGas: nat64; priceImpact: float64; routerData: text };
type ClmmSwapResult = record { outputAmount: text; priceImpactPct: text; txSignature: text };
type TokenAmount = record { currency: text; issuer: text; value: text };
```

### DeFi Result Types

```candid
type SupplyEthResult = record { txHash: text; ethSupplied: nat; nonce: nat; senderAddress: text; note: text };
type WithdrawEthResult = record { txHash: text; approvalTxHash: opt text; ethWithdrawn: nat; nonce: nat; senderAddress: text; note: text };
type SupplyTokenResult = record { txHash: text; approvalTxHash: opt text; amountSupplied: nat; tokenAddress: text; nonce: nat; senderAddress: text; note: text };
type WithdrawTokenResult = record { txHash: text; approvalTxHash: opt text; amountWithdrawn: nat; tokenAddress: text; nonce: nat; senderAddress: text; note: text };
type StakeResult = record { txHash: text; ethStaked: nat; nonce: nat; senderAddress: text; note: text };
type WrapResult = record { txHash: text; approvalTxHash: opt text; stEthWrapped: nat; nonce: nat; senderAddress: text; note: text };
type UnwrapResult = record { txHash: text; wstEthUnwrapped: nat; nonce: nat; senderAddress: text; note: text };
```

### Strategy/Automation Types

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
type ExecutionLog = record { error: opt text; intent_hash: text; rule_id: text; stage: ExecutionStage; ts: int; tx_id: opt text };
```

### Billing Types

```candid
type Tier = variant { Basic; Developer; Enterprise; Free; Pro };
type UserAccount = record { creditsMicroUsd: nat; tier: Tier; actionsRemaining: nat; subscriptionExpiry: opt int; actionsUsed: nat; totalDepositedMicroUsd: nat; createdAt: int };
type DeveloperAccountV3 = record { owner: principal; canisters: vec principal; appName: text; developerKey: text; createdAt: int };
type PackagePricing = record { actionsIncluded: nat; durationNanos: int; priceMicroUsd: nat; tier: Tier };
```

### ICP DEX LP Types

```candid
type PoolInfo = record { poolId: text; dex: DexId; token0: text; token1: text; token0Symbol: text; token1Symbol: text; reserve0: nat; reserve1: nat; fee: nat; tvl: opt nat; apr: opt float64; volume24h: opt nat };
type LPPosition = record { poolId: text; dex: DexId; token0: text; token1: text; token0Symbol: text; token1Symbol: text; liquidity: nat; token0Amount: nat; token1Amount: nat; unclaimedFees: opt record { nat; nat }; valueUsd: opt nat };
type AddLiquidityRequest = record { poolId: text; dex: DexId; token0: text; token0Amount: nat; token1: text; token1Amount: nat; slippagePct: float64 };
type AddLiquidityResult = record { success: bool; lpTokens: nat; token0Used: nat; token1Used: nat; poolId: text; message: text };
type RemoveLiquidityRequest = record { poolId: text; dex: DexId; lpTokens: nat; slippagePct: float64 };
type RemoveLiquidityResult = record { success: bool; token0Received: nat; token1Received: nat; message: text };
type RebalanceRecommendation = record { id: text; action: RebalanceAction; fromToken: text; toToken: text; fromSymbol: text; toSymbol: text; amount: nat; reason: text; estimatedApy: opt float64; currentApy: opt float64; impermanentLossRisk: ImpermanentLossRisk; confidence: float64; estimatedGasUsd: opt float64 };
```

### Misc Types

```candid
type CreateAtaResult = record { ata: text; blockhash: text; mint: text; owner: text; txSignature: text };
type TrustSetResult = record { success: bool; txHash: text; explorerUrl: text; message: text };
type SignedTxResult = record { message: text; signedTxHex: text; success: bool; txHash: text };
type TransactionReceipt = record { blockNumber: text; gasUsed: text; status: nat };
type AccountInfo = record { balance: nat64; seqno: nat32; state: text };
type CoinData = record { balance: nat64; digest: text; objectId: text; version: nat64 };
type WalletBalance = record { lovelace: nat64; tokens: vec TokenBalance };
type TokenBalance = record { quantity: text; unit: text };
```

---

## Section 5: Gotchas & Field Name Warnings

### Address Field Names Are NOT Consistent

This is the most common source of bugs. Each chain returns a different field name for the address:

| Chain | Function | Address Field | WRONG guess |
|-------|----------|--------------|-------------|
| Solana | `getMySolanaAddress` | `.address` | -- |
| EVM | `getMyEvmAddress` | `.evmAddress` | NOT `.address` |
| Bitcoin | `getMyBitcoinAddress` | `.bech32Address` | NOT `.address` |
| Litecoin | `getMyLitecoinAddress` | `.bech32Address` | NOT `.address` |
| SUI | `getMySuiAddress` | `.suiAddress` | NOT `.address` |
| XRP | `getMyXrpAddress` | `.classicAddress` | NOT `.address` |
| TON | `getMyTonAddress` | `.nonBounceable` | NOT `.address`, NOT `.bounceable` |
| Cardano | `getMyCardanoAddress` | `.bech32Address` | NOT `.address` |
| Aptos | `getMyAptosAddress` | `.address` | -- |
| NEAR | `getMyNearAddress` | `.implicitAccountId` | NOT `.address` |
| CloakCoin | `getMyCloakAddress` | `.base58Address` | NOT `.address` |
| Tron | `getTronAddress` | `.base58Address` | NOT `.address` |
| THORChain | `getMyThorAddress` | `.bech32Address` | NOT `.address` |

### Return Type Patterns

Most functions return `Result<T, Text>` (Candid variant `#ok(value)` / `#err(message)`). BUT some return **flat records** where you must check a `.success` field:

**FLAT records (NOT Result variants):**
- `sendXrpAutonomous` / `sendXrpIOU` -> `SendResultXrp` -- check `.success` bool
- `sendTonSimple` / `sendTon` / `sendTonWithComment` -> `SendResultTon` -- check `.success` bool
- `swapRaydiumApiUser` -> `RaydiumApiSwapResult` -- always succeeds or traps
- `executeSuiSwap` -> `SwapResultSui` -- check `.success` bool
- `xrpSwap` -> `SwapResultXrp` -- check `.success` bool

**Direct values (no wrapper):**
- `getBitcoinBalance` / `getLitecoinBalance` -> `Nat64` (no Result)
- `getMySuiBalance` -> `Nat64` (no Result)
- `getMyNearBalance` -> `Nat` (no Result)
- `getThorBalance` -> `[{amount, denom}]` (array, no Result)

### Decimal Conventions

| Token | Unit | Decimals | 1 token = |
|-------|------|----------|-----------|
| SOL | lamports | 9 | 1_000_000_000 |
| ETH/EVM | wei | 18 | 1_000_000_000_000_000_000 |
| BTC | satoshis | 8 | 100_000_000 |
| ICP | e8s | 8 | 100_000_000 |
| XRP | drops (but sent as text string like "10.5") | 6 | "1.0" |
| SUI | MIST | 9 | 1_000_000_000 |
| TON | nanotons | 9 | 1_000_000_000 |
| ADA | lovelace | 6 | 1_000_000 |
| APT | octas | 8 | 100_000_000 |
| NEAR | yoctoNEAR | 24 | 1_000_000_000_000_000_000_000_000 |
| LTC | litoshis | 8 | 100_000_000 |
| CLOAK | smallest unit | **6** | 1_000_000 |
| TRX | sun | 6 | 1_000_000 |
| RUNE (Thor) | smallest unit | 8 | 100_000_000 |
| USDC (SOL) | micro-USDC | 6 | 1_000_000 |
| USDC (ETH) | micro-USDC | 6 | 1_000_000 |

**CRITICAL: CloakCoin uses 6 decimals, NOT 8.**

### Litecoin Returns SendResult, NOT SendResultBtcLtc

Bitcoin returns `SendResultBtcLtc` with fields `{txid, amount, fee, senderAddress, recipientAddress, note}`.
Litecoin returns generic `SendResult` with fields `{txHash, senderAddress, note}`. Do NOT try to access `.txid` or `.fee` on a Litecoin result.

### XRP Amounts Are TEXT Strings

Unlike every other chain where amounts are numeric (Nat64/Nat), XRP uses text strings:
- `sendXrpAutonomous("rAddr", "10.5", null)` -- "10.5" is text, not a number
- The balance query `getMyXrpBalance` also returns `Result<Text, Text>`

### EVM Requires Your Own RPC

All EVM functions need an `rpcEndpoint` parameter. MeneseSDK does NOT provide RPC endpoints. Use:
- Ethereum: `https://eth.llamarpc.com` (chain ID 1)
- Arbitrum: `https://arb1.arbitrum.io/rpc` (chain ID 42161)
- Base: `https://mainnet.base.org` (chain ID 8453)
- Polygon: `https://polygon-rpc.com` (chain ID 137)
- BSC: `https://bsc-dataseed1.binance.org` (chain ID 56)
- Optimism: `https://mainnet.optimism.io` (chain ID 10)

### TON Bounce Behavior

When sending TON, the `bounce` parameter matters:
- `bounce = true`: if recipient doesn't exist, funds bounce back (safe for contracts)
- `bounce = false`: funds are delivered even to non-existent addresses (use for new wallets)
- `sendTonSimple` uses `bounce = false` by default

### Solana wrapSol / unwrapSol on Raydium

When swapping on Raydium:
- `wrapSol = true` if your INPUT is native SOL (wraps to WSOL automatically)
- `unwrapSol = true` if your OUTPUT should be native SOL (unwraps WSOL automatically)
- If swapping SPL token to SPL token, both should be `false`

---

## Section 6: Common Workflows

### Workflow 1: Send SOL to someone

```bash
# Step 1: Check your SOL balance (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMySolanaBalance '()' --network ic
# Returns: variant { ok = 1_500_000_000 : nat64 }  (1.5 SOL)

# Step 2: Send SOL (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendSolTransaction '("RecipientBase58Address", 500_000_000 : nat64)' --network ic
# Sends 0.5 SOL
```

### Workflow 2: Swap tokens on Solana (Raydium)

```bash
# Step 1: Get quote (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getRaydiumQuote '("So11111111111111111111111111111111111111112", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 500_000_000 : nat64, 150 : nat64)' --network ic

# Step 2: Execute swap (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai swapRaydiumApiUser '("So11111111111111111111111111111111111111112", "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 500_000_000 : nat64, 150 : nat64, true, false, null, null)' --network ic
# wrapSol=true because input is native SOL
# unwrapSol=false because output is USDC (not SOL)
```

### Workflow 3: Set up a DCA strategy

```bash
# Step 1: Initialize automation (one-time)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai initAutomation '()' --network ic

# Step 2: Create DCA rule — buy USDC with 0.1 SOL every hour, 24 times
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addStrategyRule '(record {
  id = 0 : nat;
  ruleType = variant { DCA };
  status = variant { Active };
  chainType = variant { Solana };
  triggerPrice = 0 : nat64;
  sizePct = 100 : nat;
  positionId = 0 : nat;
  createdAt = 0 : int;
  dcaConfig = opt record {
    amountPerBuy = 100_000_000 : nat;
    executedBuys = 0 : nat;
    intervalSeconds = 3600 : nat;
    nextExecutionTime = 0 : int;
    tokenIn = "So11111111111111111111111111111111111111112";
    tokenOut = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
    totalBuys = 24 : nat
  };
  lpConfig = null;
  scheduledConfig = null;
  apyMigrationConfig = null;
  volatilityConfig = null;
  swapAmountLamports = opt (100_000_000 : nat64);
  swapAmountWei = null
})' --network ic

# Step 3: Verify it was created
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyStrategyRules '()' --network ic

# Step 4: Monitor execution logs
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getStrategyLogs '()' --network ic
```

### Workflow 4: Check all my balances across chains

```bash
# Option A: Batch call (fastest, one call)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getAllBalances '()' --network ic
# Returns: { aptos, bitcoin, cardano, icp, litecoin, near, solana, thorchain, ton, xrp }
# NOTE: Does NOT include EVM (needs RPC) or token-specific balances

# Option B: Check EVM separately
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyEvmBalance '("https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyEvmBalance '("https://arb1.arbitrum.io/rpc")' --network ic

# Option C: Check ICRC-1 token balances
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC1Balances '(vec { "mxzaz-hqaaa-aaaar-qaada-cai"; "ryjl3-tyaaa-aaaaa-aaaba-cai" })' --network ic
```

### Workflow 5: Earn yield with Lido + Aave

```bash
# Step 1: Get EVM address and check ETH balance
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyEvmAddress '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyEvmBalance '("https://eth.llamarpc.com")' --network ic

# Step 2: Stake 50% in Lido (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai stakeEthForStEth '(250_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic

# Step 3: Supply 50% to Aave (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai aaveSupplyEth '(250_000_000_000_000_000 : nat, "https://eth.llamarpc.com", null)' --network ic

# Step 4: Check positions (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getStEthBalance '("0xYourEvmAddress", "https://eth.llamarpc.com")' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getAWethBalance '("0xYourEvmAddress", "https://eth.llamarpc.com")' --network ic
```

### Workflow 6: ICP DEX swap and LP

```bash
# Step 1: Get ICP balance
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPBalance '()' --network ic

# Step 2: Get quote for ICP -> ckBTC (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexQuote '("ryjl3-tyaaa-aaaaa-aaaba-cai", "mxzaz-hqaaa-aaaar-qaada-cai", 500_000_000 : nat, 1.0 : float64)' --network ic

# Step 3: Execute swap (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai executeICPDexSwap '(record { tokenIn = "ryjl3-tyaaa-aaaaa-aaaba-cai"; tokenOut = "mxzaz-hqaaa-aaaar-qaada-cai"; amountIn = 500_000_000 : nat; minAmountOut = 0 : nat; slippagePct = 1.0 : float64; preferredDex = null })' --network ic

# Step 4: Browse available pools (FREE)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexPools '()' --network ic

# Step 5: Add liquidity (1 action)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addICPLiquidity '(record { poolId = "pool-id"; dex = variant { ICPSwap }; token0 = "ryjl3-tyaaa-aaaaa-aaaba-cai"; token0Amount = 500_000_000 : nat; token1 = "mxzaz-hqaaa-aaaar-qaada-cai"; token1Amount = 50_000 : nat; slippagePct = 1.0 : float64 })' --network ic
```

---

## Section 7: Error Handling

### Common Errors and What They Mean

| Error Message | Cause | Fix |
|---------------|-------|-----|
| `"No active subscription"` | No subscription or expired | Call `purchaseGatewayPackage` |
| `"Insufficient actions"` | Ran out of actions in current period | Upgrade tier or wait for renewal |
| `"Insufficient balance"` | Not enough crypto on the chain | Fund your address (check with balance query) |
| `"Invalid address"` | Bad recipient address format | Verify the address format for that chain |
| `"Nonce too low"` | EVM nonce conflict | Call `resyncEvmNonce` with RPC endpoint |
| `"EVM nonce locked"` | Previous EVM tx still pending | Wait or call `forceReleaseEvmNonceLock` |
| `"UTXO conflict"` | BTC/LTC UTXO already spent | Wait for confirmation, call `syncBitcoinUTXOs` |
| `"Slippage exceeded"` | Price moved beyond tolerance | Increase slippageBps or retry |
| `"Account not found"` | TON/XRP account doesn't exist yet | Fund it first (minimum balance required) |
| `"ATA does not exist"` | Solana token account missing | Call `createMySolanaAtaForMint` first |
| `"Gateway not enabled"` | Gateway system is off | Contact admin |
| `"Rate limit exceeded"` | Too many requests too fast | Wait and retry |

### Debug Checklist

When an operation fails:

1. **Check subscription**: `getMyGatewayAccount` -- is tier active? actions remaining > 0?
2. **Check balance**: Use the appropriate balance query for the chain
3. **Check address**: Make sure you are using the correct field name (see Section 5)
4. **Check return type**: Is it a Result variant (#ok/#err) or a flat record (.success)?
5. **For EVM**: Check nonce state with `getEvmNonceState`, resync if needed
6. **For BTC/LTC**: Sync UTXOs with `syncBitcoinUTXOs` / `syncLitecoinUTXOs`
7. **For Solana SPL**: Make sure ATA exists for both sender and recipient

### EVM Nonce Recovery

If EVM transactions get stuck:
```bash
# Check current nonce state
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getEvmNonceState '()' --network ic

# Release nonce lock if stuck
dfx canister call urs2a-ziaaa-aaaad-aembq-cai forceReleaseEvmNonceLock '()' --network ic

# Resync nonce from chain
dfx canister call urs2a-ziaaa-aaaad-aembq-cai resyncEvmNonce '("https://eth.llamarpc.com")' --network ic

# Verify last transaction confirmed
dfx canister call urs2a-ziaaa-aaaad-aembq-cai verifyLastEvmTransaction '("https://eth.llamarpc.com")' --network ic

# Check transaction receipt
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getEvmTransactionReceipt '("0xTxHash", "https://eth.llamarpc.com")' --network ic
```

### UTXO Sync (Bitcoin / Litecoin)

If BTC/LTC sends fail with UTXO errors:
```bash
# Force UTXO resync
dfx canister call urs2a-ziaaa-aaaad-aembq-cai syncBitcoinUTXOs '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai syncLitecoinUTXOs '()' --network ic

# Check UTXOs
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getBitcoinUTXOs '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getLitecoinUTXOs '()' --network ic

# Cleanup stale reservations
dfx canister call urs2a-ziaaa-aaaad-aembq-cai cleanupBitcoinReservations '()' --network ic
dfx canister call urs2a-ziaaa-aaaad-aembq-cai cleanupLitecoinReservations '()' --network ic
```

---

## Appendix A: Quick Reference — All Public Functions

Alphabetical list of every public function with cost indicator.

### FREE Functions (no subscription needed)

```
calculateSuiMinAmountOut          formatSuiTokenType
getATokenBalance                  getAWethBalance
getAllAddresses                    getAllBalances
getAllMinswapTokens                getAllPools
getAptosBalance                   getBaseTokens
getBitcoinAddressFor              getBitcoinBalance
getBitcoinBalanceFor              getBitcoinDustLimit
getBitcoinFeePercentiles          getBitcoinMaxSendAmount
getBitcoinRecommendedFeeRate      getBitcoinReservationCount
getBitcoinUTXOs                   getBitcoinUTXOsFor
getCanisterBitcoinAddress         getCanisterCloakAddress
getCanisterDeveloper              getCanisterEvmAddress
getCanisterLitecoinAddress        getCanisterNearBalance
getCanisterNearPubKey             getCanisterSolanaAddress
getCanisterSuiAddress             getCanisterTonAddress
getCanisterTronAddress            getCanisterXrpAddress
getCardanoBalance                 getCardanoWalletBalance
getChainStats                     getClmmPool
getClmmQuote                      getCloakAddressFor
getCloakBalance                   getCloakBalanceFor
getCloakUTXOs                     getETHQuote
getEvmAddressFor                  getEvmBalance
getEvmCacheSize                   getEvmNonceState
getEvmTransactionReceipt          getGasOracleCacheSize
getGatewayPricing                 getICPBalance
getICPBalanceFor                  getICPDexPools
getICPDexQuote                    getICPDexTokens
getICPLPPositions                 getICPRebalanceRecommendations
getICRC1Balance                   getICRC1BalanceFor
getICRC1Balances                  getICRC1TokenInfo
getICRC2Allowance                 getLitecoinAddressFor
getLitecoinBalance                getLitecoinBalanceFor
getLitecoinDustLimit              getLitecoinMaxSendAmount
getLitecoinReservationCount       getLitecoinUTXOs
getLitecoinUTXOsFor               getMinswapQuote
getMinswapTokens                  getMyAptosAddress
getMyBitcoinAddress               getMyCanisterUsage
getMyCardanoAddress               getMyCloakAddress
getMyDeveloperAccount             getMyDeveloperKey
getMyEvmAddress                   getMyEvmBalance
getMyGatewayAccount               getMyGatewayDeposits
getMyLitecoinAddress              getMyNearAddress
getMyNearBalance                  getMyNearPubKey
getMySolanaAddress                getMySolanaAta
getMySolanaBalance                getMyStrategyRules
getMySuiAddress                   getMySuiBalance
getMySuiCoins                     getMyThorAddress
getMyTonAccountInfo               getMyTonAddress
getMyTonBalance                   getMyTrc20Balance
getMyXrpAddress                   getMyXrpBalance
getNearUserAccountInfo            getPairAddress
getPoolCount                      getPoolReserves
getPoolStats                      getRaydiumQuote
getRoutingSuggestions             getSolanaAddressFor
getSolanaBalance                  getSolanaTokenProgramIds
getStEthAllowance                 getStEthBalance
getStablecoins                    getStrategyLogs
getStrategyPriceCacheStats        getSuiAddressFor
getSuiBalanceFor                  getSuiCacheSize
getSuiCoinsFor                    getSuiPackageConfig
getSuiSwapQuote                   getSupportedChains
getSupportedICPTokens             getSupportedTokens
getSwapErrorMessage               getSystemLogs
getThorBalance                    getTokenCount
getTokenInfo                      getTokenQuote
getTokenQuoteMultiHop             getTonAccountInfoFor
getTonAddressFor                  getTonBalanceFor
getTonCacheSize                   getTotalCacheSize
getTrc20Balance                   getTronAddress
getTrxBalance                     getUSDCQuote
getWstEthBalance                  getXrpAddressFor
hasEvmNonceState                  hasPathThrough
hasTonApiKey                      health
isClmmPoolReady                   isEvmNonceLocked
isGatewayEnabled                  isTokenSupported
isValidBitcoinAddress             isValidLitecoinAddress
isValidSuiAddress                 isValidTonAddress
listCachedEvmNonceAddresses       listClmmPools
listPoolsForToken                 poolExists
validateDeveloperKey              validateSwapPath
verifyEvmAddressFormat            version
xrpFindPaths                     xrpGetAccountLines
xrpGetAmmInfo
clearAllCaches                    clearEvmCache
clearSolanaAddressCache           clearSuiCache
clearTonCache                     preflightEvmAddLiquidityGas
preflightEvmApproveGas            preflightEvmContractWriteGas
preflightEvmRemoveLiquidityGas    preflightEvmSendGas
preflightEvmSwapGas               verifyTonWalletCode
```

### 1-Action Functions (requires subscription)

```
aaveSupplyEth                     aaveSupplyToken
aaveWithdrawEth                   aaveWithdrawToken
addICPLiquidity                   addLiquidity
addLiquidityETH                   addStrategyRule
approveICRC2                      buildAndSignEvmTransaction
buildAndSignEvmTxWithData         callEvmContractWrite
createMySolanaAtaForMint          createMySolanaAtaForMintWithProgram
deleteStrategyRule                depositGatewayCredits
executeICPDexSwap                 executeMinswapSwap
executeSuiSwap                    exp_signAddLiquidity
exp_signAddLiquidityETH           exp_signAptosTransfer
exp_signBtcTransfer               exp_signCardanoSend
exp_signCardanoTokenSend          exp_signClmmSwapUser
exp_signCloakTransfer             exp_signDirectSwapUser
exp_signEvmSend                   exp_signEvmSwap
exp_signLtcTransfer               exp_signMinswapSwap
exp_signNearTransfer              exp_signRaydiumSwap
exp_signRaydiumSwapUser           exp_signRemoveLiquidity
exp_signRemoveLiquidityETH        exp_signSolTransfer
exp_signSplTransfer               exp_signSuiTransfer
exp_signThorTransfer              exp_signTonTransfer
exp_signTronTransfer              exp_signXrpIOUPayment
exp_signXrpPayment                exp_signXrpSwap
exp_signXrpTrustline              initAutomation
purchaseGatewayPackage            regenerateDeveloperKey
registerDeveloperCanister         removeICPLiquidity
removeLiquidity                   removeLiquidityETH
sendAptos                         sendBitcoin
sendBitcoinDynamicFee             sendBitcoinWithFee
sendCardanoTransaction            sendCloak
sendEvmNativeTokenAutonomous      sendICP
sendICRC1                         sendLitecoin
sendLitecoinWithFee               sendNearTransfer
sendNearTransferFromUser          sendSolTransaction
sendSui                           sendSuiMax
sendThor                          sendTon
sendTonSimple                     sendTonWithComment
sendTrc20                         sendTrx
sendXrpAutonomous                 sendXrpIOU
signAptosTransferRelayer          signCardanoTransferRelayer
signNearTransferRelayer           signSolSwapTxsRelayer
signSolTransferRelayer            signSuiTransferRelayer
signTonTransferRelayer            signTrxTransferRelayer
signXrpTransferRelayer            stakeEthForStEth
swapClmm                         swapClmmUser
swapETHForUSDC                    swapRaydiumApiUser
swapTokens                        swapTokensMultiHop
swapUSDCForETH                    transferFromICRC2
transferSplToken                  transferSuiCoin
unwrapWstEth                      updateStrategyRuleStatus
wrapStEth                         xrpSetTrustline
xrpSwap
burnSuiTokens                     createCanisterSolanaAtaForMint
createCanisterSolanaAtaForMintWithProgram createMyAta
exp_rollbackEvmNonce              forceClearEvmNonceState
forceReleaseEvmNonceLock          forceSetEvmNonce
invalidateEvmNonce                lockMyTokens
mintSuiTokens                     registerCloakDeposit
sendBitcoinWithNetwork            sendSuiWithNetwork
setTonApiKey                      signSolSwapTxsOffchain
signSolTransferOffchain           swapRaydiumApi
swapRaydiumNative                 unregisterDeveloperCanister
```

