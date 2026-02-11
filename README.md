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
│   ├── 01-quick-start.ts      ← Connect via II, get 15-chain addresses + balances
│   ├── 02-send-tokens.ts      ← Send tokens: SOL, ETH, BTC, ICP, XRP, SUI, TON
│   ├── 03-swap.ts             ← DEX swaps across 6 DEXes
│   ├── 04-bridge-eth-to-sol.ts← Bridge ETH/USDC → SOL (ultrafast + CCTP)
│   ├── 05-merchant-checkout.ts← Accept payments, poll, sweep to treasury
│   ├── 06-portfolio-tracker.ts← Multi-chain portfolio dashboard
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
| **Solana** | getMySolanaAddress | sendSolTransaction, transferSplToken | Raydium | ETH→SOL |
| **Ethereum** | getMyEvmAddress | sendEvmNativeTokenAutonomous | Uniswap V3 | ETH→SOL |
| **Arbitrum** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **Base** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | USDC→SOL |
| **Polygon** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **BNB Chain** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **Optimism** | (same EVM address) | sendEvmNativeTokenAutonomous | Uniswap V3 | — |
| **Bitcoin** | getMyBitcoinAddress | sendBitcoin, sendBitcoinWithFee, sendBitcoinDynamicFee | — | — |
| **ICP** | (caller principal) | sendICP, sendICRC1 | ICPSwap + KongSwap | — |
| **Cardano** | getMyCardanoAddress | sendCardanoTransaction | Minswap | — |
| **XRP** | getMyXrpAddress | sendXrpAutonomous, sendXrpIOU | XRP Ledger DEX | — |
| **SUI** | getMySuiAddress | sendSui, sendSuiMax, transferSuiCoin | Cetus | — |
| **TON** | getMyTonAddress | sendTonSimple, sendTon, sendTonWithComment | — | — |
| **Tron** | getMyTronAddress | sendTrx, sendTrc20 | — | — |
| **Aptos** | getMyAptosAddress | sendAptos | — | — |
| **Litecoin** | getMyLitecoinAddress | sendLitecoin, sendLitecoinWithFee | — | — |
| **Near** | getMyNearAddress | sendNearTransfer, sendNearTransferFromUser | — | — |
| **CloakCoin** | getMyCloakAddress | sendCloak | — | — |
| **Thorchain** | getMyThorAddress | sendThor | — | — |

---

## 6 DEXes

| DEX | Chain | Example |
|-----|-------|---------|
| **Raydium** | Solana | `swapSolana("SOL", "USDC", amount, slippage)` |
| **Uniswap V3** | ETH/ARB/BASE/POLY/BNB/OP | `swapEvm(chainId, tokenIn, tokenOut, amount, slippage)` |
| **ICPSwap + KongSwap** | ICP | `swapIcp(tokenIn, tokenOut, amount, slippage)` |
| **Cetus** | SUI | `executeSuiSwap(network, from, to, amount, minOut)` |
| **Minswap** | Cardano | `executeMinswapSwap(tokenIn, tokenOut, amount, slippage)` |
| **XRP Ledger DEX** | XRP | `xrpSwap(dest, send, paths, slippage)` |

---

## Pricing

| Operation | Cost | Examples |
|-----------|------|----------|
| **Sign / Send** | $0.05 | sendSol, sendBtc, sendIcp, sendEth, xrpSend, suiSend, tonSend |
| **Swap** | $0.075 | Raydium, Uniswap, ICPSwap, KongSwap, Cetus, Minswap, XRP DEX |
| **Bridge** | $0.10 | quickUltrafastEthToSol, startCctpBridge |
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
const tx = await menese.sendSol(100_000_000n, "5xK2abc...");

// Swap 1 SOL → USDC on Raydium
const swap = await menese.swapSolana("So11111111111111111111111111111111111111112",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", 1_000_000_000n, 50n);
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

  public shared func paySol(amount : Nat64, to : Text) : async Text {
    let result = await menese.sendSol(amount, to);
    result.txHash;
  };
};
```

Register your canister first:
```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-CANISTER-ID", "MyApp")'
```

---

## Chain-Specific Setup

### Solana — Associated Token Accounts (ATAs)

Before receiving SPL tokens, create the ATA (one-time per token, ~0.002 SOL rent):

```typescript
await menese.createMySolanaAtaForMint("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // USDC
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

## Developer Key & Billing

Register once to get your API key. All operations from your app bill your developer account:

```bash
# From dfx CLI
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-CANISTER-ID", "MyAppName")'
# Returns: msk_a7f3c291e5b8d4f7...
```

```typescript
// Validate a key
const valid = await menese.validateDeveloperKey("msk_a7f3c291e5b8d4f7...");

// Check your account balance
const account = await menese.getMyGatewayAccount();
console.log("Credits:", account.credits);
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

## Bridge (ETH → Solana)

Two methods available:

| Method | Speed | Tokens | Chains |
|--------|-------|--------|--------|
| **Ultrafast** | ~30s | ETH, USDC | ETH/ARB/BASE → SOL |
| **CCTP** | ~15min | USDC only | ETH/ARB/BASE → SOL |

**Note:** Only ETH/EVM → Solana direction is supported. SOL → ETH bridging is still in testing.

---

## Need Help?

- **Candid UI:** https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai
- **Full .did file:** Query the canister directly for the complete Candid interface
- Each subfolder has its own README with detailed per-file documentation
