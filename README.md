# MeneseSDK V0 — Integration Guide

**One SDK. 19 chains. 6 DEXes. One canister call.**

MeneseSDK is a multi-chain crypto SDK deployed on the Internet Computer (ICP).
Your app (frontend or backend canister) makes a single inter-canister call to sign,
send, swap, or bridge across 19 blockchains — no private keys to manage, no RPC
infrastructure to maintain.

**Mainnet Canister:** `urs2a-ziaaa-aaaad-aembq-cai`

---

## What's Inside

```
examples/
├── README.md                  ← You are here
├── frontend/                  ← TypeScript examples for web apps
│   ├── menese-config.ts       ← Shared config: Candid IDL + actor helpers
│   ├── 01-quick-start.ts      ← Connect via II, get 19-chain addresses + balances
│   ├── 02-send-tokens.ts      ← Send tokens on all 19 chains
│   ├── 03-swap.ts             ← DEX swaps across 6 DEXes
│   ├── 04-bridge-eth-to-sol.ts← Bridge ETH↔SOL (both directions)
│   ├── 05-merchant-checkout.ts← Accept payments, poll, sweep to treasury
│   ├── 06-portfolio-tracker.ts← Multi-chain portfolio dashboard (19 chains)
│   └── README.md
├── backend/                   ← Motoko examples for canister-to-canister calls
│   ├── MeneseInterface.mo     ← Remote actor type definition (import this)
│   ├── 01-BasicIntegration.mo ← Get addresses, check balances, send tokens
│   ├── 02-AutomationBot.mo    ← Timer-based DCA / auto-swap / sweep bot
│   ├── 03-MerchantPayments.mo ← Invoice system + payment verification
│   └── README.md
└── clawdbot/                  ← AI wallet bot integration (WhatsApp/chat)
    ├── WalletBot.mo           ← Approach A: ICP canister (production, multi-user)
    ├── wallet_commands.py     ← Approach B: Direct dfx CLI (personal, quick setup)
    └── README.md
```

---

## Supported Chains (19)

| Chain | Address | Send | Swap | Bridge |
|-------|---------|------|------|--------|
| **Solana** | getMySolanaAddress | sendSolTransaction, transferSplToken | Raydium | ETH↔SOL |
| **Ethereum** | getMyEvmAddress | sendEvmNativeTokenAutonomous | Uniswap V3 | ETH↔SOL |
| **Arbitrum** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **Base** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | USDC→SOL |
| **Polygon** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **BNB Chain** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **Optimism** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **Bitcoin** | getMyBitcoinAddress | sendBitcoin, sendBitcoinDynamicFee | — | — |
| **ICP** | (caller principal) | sendICP, sendICRC1 | ICPSwap + KongSwap | — |
| **Cardano** | getMyCardanoAddress | sendCardanoTransaction | Minswap | — |
| **XRP** | getMyXrpAddress | sendXrpAutonomous, sendXrpIOU | XRP Ledger DEX | — |
| **SUI** | getMySuiAddress | sendSui, sendSuiMax, transferSuiCoin | Cetus | — |
| **TON** | getMyTonAddress | sendTonSimple, sendTon, sendTonWithComment | — | — |
| **Tron** | getTronAddress | sendTrx, sendTrc20 | — | — |
| **Aptos** | getMyAptosAddress | sendAptos | — | — |
| **Litecoin** | getMyLitecoinAddress | sendLitecoin, sendLitecoinWithFee | — | — |
| **Near** | getMyNearAddress | sendNearTransfer | — | — |
| **CloakCoin** | getMyCloakAddress | sendCloak | — | — |
| **Thorchain** | getMyThorAddress | sendThor | — | — |

---

## 6 DEXes

| DEX | Chain | Function |
|-----|-------|----------|
| **Raydium** | Solana | `swapRaydiumApiUser(inputMint, outputMint, amount, slippage, wrapSol, unwrapSol, ?inputAta, ?outputAta)` |
| **Uniswap V3** | ETH/ARB/BASE/POLY/BNB/OP | `swapTokens(quoteId, from, to, amount, slippage, feeOnTransfer, rpcEndpoint)` |
| **ICPSwap + KongSwap** | ICP | `executeICPDexSwap(request)` |
| **Cetus** | SUI | `executeSuiSwap(network, from, to, amount, minOut)` |
| **Minswap** | Cardano | `executeMinswapSwap(tokenIn, tokenOut, amount, slippage)` |
| **XRP Ledger DEX** | XRP | `xrpSwap(destAmount, sendMax, paths, slippage)` |

---

## Pricing

| Operation | Cost | Examples |
|-----------|------|----------|
| **Sign / Send** | $0.05 | sendSolTransaction, sendBitcoin, sendICP, sendEvmNativeTokenAutonomous |
| **Swap** | $0.075 | swapRaydiumApiUser, swapTokens, executeICPDexSwap, executeSuiSwap, executeMinswapSwap, xrpSwap |
| **Bridge** | $0.10 | quickUltrafastEthToSol, quickCctpBridge, quickSolToEth |
| **Read / Query** | FREE | getAddress, getBalance, getQuote, validateDeveloperKey |

Payment accepted in: **ckBTC, ICP, ckETH** (via ICRC-2 approve+transferFrom).

---

## Quick Start

### Frontend (TypeScript)

```bash
npm install @dfinity/agent @dfinity/candid @dfinity/principal @dfinity/auth-client
```

```typescript
import { createMeneseActor } from "./menese-config";
import { AuthClient } from "@dfinity/auth-client";

const authClient = await AuthClient.create();
// ... authenticate via Internet Identity ...
const menese = createMeneseActor(authClient.getIdentity());

// Get your Solana address (deterministic, derived from your ICP identity)
const sol = await menese.getMySolanaAddress();
console.log("Solana:", sol.address);

// Send 0.1 SOL
const tx = await menese.sendSolTransaction("5xK2abc...", 100_000_000n);

// Swap 1 SOL → USDC on Raydium (8 params, returns flat record)
const swap = await menese.swapRaydiumApiUser(
  "So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  1_000_000_000n, 150n, true, false, [], []
);
console.log("TX:", swap.txSignature, "Output:", swap.outputAmount);
```

### Backend (Motoko canister)

```motoko
import Menese "MeneseInterface";

actor MyApp {
  let menese = Menese.mainnet();

  public shared func getWallet() : async Text {
    let addr = await menese.getMySolanaAddress();
    addr.address;
  };

  // sendSolTransaction returns Result<Text, Text>
  public shared func paySol(to : Text, lamports : Nat64) : async Text {
    switch (await menese.sendSolTransaction(to, lamports)) {
      case (#ok(txHash)) txHash;
      case (#err(e)) "Error: " # e;
    };
  };
};
```

Register your canister first:
```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-CANISTER-ID", "MyApp")'
```

---

## EVM Chains — Bring Your Own RPC

**For all EVM chains (ETH, Arbitrum, Base, Polygon, BSC, Optimism), you must
provide your own RPC endpoint.** MeneseSDK does NOT manage EVM RPC connections.

```typescript
// EVM chain config — provide your own RPCs
const EVM_CHAINS = {
  ethereum:  { chainId: 1,     rpc: "https://eth.llamarpc.com" },
  arbitrum:  { chainId: 42161, rpc: "https://arb1.arbitrum.io/rpc" },
  base:      { chainId: 8453,  rpc: "https://mainnet.base.org" },
  polygon:   { chainId: 137,   rpc: "https://polygon-rpc.com" },
  bsc:       { chainId: 56,    rpc: "https://bsc-dataseed1.binance.org" },
  optimism:  { chainId: 10,    rpc: "https://mainnet.optimism.io" },
};

// sendEvmNativeTokenAutonomous(to, valueWei, rpcEndpoint, chainId, ?quoteId)
await menese.sendEvmNativeTokenAutonomous(
  "0xRecipient", amountWei, EVM_CHAINS.arbitrum.rpc, BigInt(42161), []
);
```

Free public RPCs work for testing. For production, use Alchemy, Infura, or
chain-specific premium RPCs for better reliability.

---

## Chain-Specific Setup

### Solana — Associated Token Accounts (ATAs)

Before receiving SPL tokens, create the ATA (one-time per token, ~0.002 SOL rent):

```typescript
// createMySolanaAtaForMint takes 2 params: mint address + ATA address
await menese.createMySolanaAtaForMint(mintBase58, ataBase58);

// Get your ATA address first
const ata = await menese.getMySolanaAta("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
```

Native SOL does **not** need an ATA — only SPL tokens (USDC, USDT, BONK, etc.).

### XRP — Trustlines

Before receiving non-XRP tokens, set a trustline (one-time per token+issuer):

```typescript
await menese.xrpSetTrustline("USD", "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B", "1000");
```

### Other Chains

EVM, ICP, SUI, Cardano, Bitcoin, TON — no setup needed. Tokens work automatically.

---

## Important: Correct Field Names

Address types return records with chain-specific field names. Using the wrong
field will cause runtime errors:

| Chain | Correct Field | Wrong (will fail) |
|-------|--------------|-------------------|
| EVM | `evmAddress` | `address` |
| SUI | `suiAddress` | `address` |
| TON | `bounceable` / `nonBounceable` | `address` |
| Cardano | `bech32Address` | `address` |
| Bitcoin | `bech32Address` | (returns record, not text) |
| Litecoin | `bech32Address` | (returns record, not text) |
| Thorchain | `bech32Address` | `address` |
| Tron | `base58Address` | `base58` |
| NEAR | `implicitAccountId` | `accountId` |

---

## Bridge (ETH ↔ Solana)

Both directions are supported:

| Method | Direction | Speed | Tokens | Chains |
|--------|-----------|-------|--------|--------|
| **Ultrafast** | ETH → SOL | ~30s | ETH, USDC | ETH/ARB/BASE → SOL |
| **CCTP** | ETH → SOL | ~15min | USDC only | ETH/ARB/BASE/OP/POLY → SOL |
| **quickSolToEth** | SOL → ETH | ~15min | SOL | SOL → ETH |
| **quickUsdcBridgeSolToEth** | SOL → ETH | ~15min | USDC | SOL → ETH |

---

## Developer Key & Billing

Register once to get your API key. All operations from your app bill your developer account:

```bash
# From dfx CLI
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-CANISTER-ID", "MyAppName")'
# Returns: msk_a7f3c291e5b8d4f7...
```

Deposit credits: Transfer ckBTC/ICP/ckETH to the MeneseSDK canister principal with ICRC-2.

---

## Performance Tip

For production apps that check balances frequently, use your **own RPC endpoints**
(Helius, Alchemy, Infura) instead of MeneseSDK balance queries. MeneseSDK uses shared
RPCs — your own will be faster and more reliable.

| Use MeneseSDK for | Use your own RPC for |
|-------------------|---------------------|
| Address derivation (one-time, cache it) | Balance checks |
| Signing & sending transactions | Transaction history |
| DEX swaps & bridges | Token metadata |
| Developer billing & key management | Real-time price feeds |

---

## Need Help?

- **Candid UI:** https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai
- **Full .did file:** Query the canister directly for the complete Candid interface
- Each subfolder has its own README with detailed per-file documentation
