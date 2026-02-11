# MeneseSDK Backend (Motoko) Integration Examples

Canister-to-canister integration examples for calling MeneseSDK from your own ICP canister.

## How It Works

Your canister calls MeneseSDK's public functions via inter-canister calls.
Since the `caller` is your **canister principal** (not a human), you must first
register your canister as a developer canister — then all operations bill YOUR
developer account automatically.

## Setup

### 1. Register your canister (one-time)

From `dfx` or your frontend, call with your human identity:

```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-CANISTER-ID", "MyApp")'
```

This returns your developer key (`msk_xxxxx...`). All calls from your canister
will now bill your developer account.

### 2. Add MeneseSDK to your canister

Copy the `MeneseInterface.mo` file into your project. It defines the remote
actor type with all 248+ functions and correct types from the `.did`.

### 3. Call MeneseSDK from your code

```motoko
import Menese "MeneseInterface";

let menese = Menese.mainnet();
let addr = await menese.getMySolanaAddress();
// addr.address — correct field for Solana
```

## EVM Chains — Bring Your Own RPC

For EVM chains (ETH, Arbitrum, Base, Polygon, BSC, Optimism), you must provide
your own RPC endpoint and chain ID. MeneseSDK does NOT manage EVM RPCs.

```motoko
// sendEvmNativeTokenAutonomous takes 5 params:
//   (to: Text, valueWei: Nat, rpcEndpoint: Text, chainId: Nat, ?quoteId: ?Text)
let result = await menese.sendEvmNativeTokenAutonomous(
  "0xRecipient",
  1_000_000_000_000_000_000,  // 1 ETH in wei
  "https://arb1.arbitrum.io/rpc",
  42161,                        // Arbitrum chain ID
  null,
);
```

## Important: Correct Field Names

Address types return records with specific field names:

| Chain | Correct Field | Wrong (will fail) |
|-------|--------------|-------------------|
| EVM | `evmAddress` | `address` |
| SUI | `suiAddress` | `address` |
| TON | `bounceable` / `nonBounceable` | `address` |
| Cardano | `bech32Address` | `address` |
| Bitcoin | `bech32Address` | (returns AddressInfo record, not Text) |
| Litecoin | `bech32Address` | (returns AddressInfo record, not Text) |
| Thorchain | `bech32Address` | `address` |
| Tron | `base58Address` | `base58` |
| NEAR | `implicitAccountId` | `accountId` |

## Important: Return Types Differ

| Function | Return | Access Pattern |
|----------|--------|---------------|
| `sendSolTransaction` | `Result<Text, Text>` | `#ok(txHash)` |
| `sendICP` | `Result<SendICPResult, Text>` | `#ok(receipt)` → `receipt.blockHeight` |
| `sendBitcoin` | `Result<SendResultBtcLtc, Text>` | `#ok(r)` → `r.txid`, `r.fee` |
| `sendLitecoin` | `Result<SendResult, Text>` | `#ok(r)` → `r.txHash` (NOT BtcLtc!) |
| `sendEvmNativeTokenAutonomous` | `Result<SendResultEvm, Text>` | `#ok(r)` → `r.expectedTxHash` |
| `sendXrpAutonomous` | **FLAT** `SendResultXrp` | `r.success`, `r.txHash` directly |
| `sendTonSimple` | **FLAT** `SendResultTon` | `r.success`, `r.txHash` directly |
| `swapRaydiumApiUser` | **FLAT** `RaydiumApiSwapResult` | `r.txSignature`, `r.outputAmount` |

## Examples

| File | Use Case |
|------|----------|
| `MeneseInterface.mo` | Shared actor type definition (import this) |
| `01-BasicIntegration.mo` | Get addresses and balances, send tokens (SOL, ICP, BTC, ETH) |
| `02-AutomationBot.mo` | Automated trading: timer-based Raydium swap + sweep |
| `03-MerchantPayments.mo` | Accept SOL/ICP payments, verify, sweep to treasury |

## Canister ID

**Mainnet:** `urs2a-ziaaa-aaaad-aembq-cai`

## Billing

When your canister calls MeneseSDK, the caller is your canister's principal.
If registered via `registerDeveloperCanister`, operations bill your developer
account. Otherwise, the canister itself needs credits deposited.

| Operation | Cost |
|-----------|------|
| Sign/Send | $0.05 |
| Swap      | $0.075 |
| Bridge    | $0.10 |
| Query     | FREE |
