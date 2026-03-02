# Vibe Coding with MeneseSDK + Caffeine

Build multi-chain dApps on ICP using AI-assisted development.
Feed Caffeine the right context files and let it generate your integration.

---

## What is Caffeine?

[Caffeine](https://caffeine.ai) is an AI coding assistant for Internet Computer projects.
It understands Motoko, Candid, and ICP architecture. Feed it the right context
and it can generate working canister code and frontend integrations.

---

## Quick Setup

### 1. Install Dependencies

**Frontend (TypeScript/React)**:
```bash
npm install @dfinity/agent @dfinity/candid @dfinity/principal @dfinity/auth-client
```

**Backend (Motoko)** — add to your `mops.toml`:
```toml
[dependencies]
base = "0.13.2"
```

Then in `dfx.json`, set:
```json
{
  "defaults": {
    "build": { "packtool": "mops sources" }
  }
}
```

### 2. Get Your Developer Key

```bash
# Register as a developer (one-time)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR_CANISTER_ID", "My App")'

# Get your msk_* key
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyDeveloperKey '()'
```

### 3. Deposit Credits

```bash
# First approve the transfer (ICP ledger)
dfx canister call ryjl3-tyaaa-aaaaa-aaaba-cai icrc2_approve \
  '(record { spender = record { owner = principal "urs2a-ziaaa-aaaad-aembq-cai" }; amount = 100_000_000 })'

# Then deposit ($10 worth at ~$10/ICP)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai depositGatewayCredits '("ICP", 100000000)'
```

---

## Context Files for Caffeine

### For Frontend / Client Mode (TypeScript)

Feed Caffeine these files to build browser-based dApps:

| File | Purpose | Location |
|------|---------|----------|
| **sdk-setup.ts** | Full Candid IDL + actor factory | `examples/frontend/sdk-setup.ts` |
| **01-quick-start.ts** | Address derivation pattern | `examples/frontend/01-quick-start.ts` |
| **02-send-tokens.ts** | All 19 chains send pattern | `examples/frontend/02-send-tokens.ts` |
| **03-swap.ts** | DEX swap patterns (6 DEXes) | `examples/frontend/03-swap.ts` |
| **backend.did.d.ts** | All TypeScript type definitions | `src/declarations/backend/backend.did.d.ts` |

**Prompt template for Caffeine (frontend)**:
```
I'm building a [wallet/checkout/dashboard] using MeneseSDK on ICP.

Context files attached:
- sdk-setup.ts (Candid IDL + actor factory)
- backend.did.d.ts (all TypeScript types)
- [relevant example file]

Production canister: urs2a-ziaaa-aaaad-aembq-cai
Use sign-only endpoints for cheaper canister cycles.

Generate a React component that [describes what you want].
```

### For Backend / Agent Mode (Motoko)

Feed Caffeine these files to build autonomous canister-to-canister integrations:

| File | Purpose | Location |
|------|---------|----------|
| **MeneseInterface.mo** | Full actor type (ALL endpoints) | `examples/backend/MeneseInterface.mo` |
| **01-BasicIntegration.mo** | Canister basics pattern | `examples/backend/01-BasicIntegration.mo` |
| **02-AutomationBot.mo** | Timer/DCA bot pattern | `examples/backend/02-AutomationBot.mo` |
| **03-MerchantPayments.mo** | Invoice/payment pattern | `examples/backend/03-MerchantPayments.mo` |

**Prompt template for Caffeine (backend)**:
```
I'm building a [DCA bot/merchant system/automation canister] using MeneseSDK on ICP.

Context files attached:
- MeneseInterface.mo (full remote actor type — use this as the import)
- [relevant example file]

Production canister: urs2a-ziaaa-aaaad-aembq-cai
Use full execution mode for autonomous operation.

Generate a Motoko actor that [describes what you want].
Import MeneseSDK as: import Menese "MeneseInterface";
Use: let menese = Menese.mainnet();
```

---

## What Caffeine Can Build With These Files

### Frontend Examples
- **Multi-chain wallet** — show balances on 19 chains, send from any
- **Payment checkout** — accept crypto, monitor for payment, auto-confirm
- **Portfolio tracker** — real-time balances across all chains (FREE queries)
- **DEX trading UI** — swap tokens on Raydium, Uniswap, ICPSwap, Cetus, Minswap
- **Cross-chain bridge UI** — CCTP USDC bridges between Ethereum and Solana

### Backend Examples
- **DCA bot** — dollar-cost averaging on timers (no frontend needed)
- **Treasury sweeper** — auto-consolidate funds across chains
- **Merchant payment processor** — invoice generation + payment verification
- **Rebalance bot** — maintain target allocations across chains
- **Arbitrage scanner** — cross-DEX price monitoring + execution

---

## Production Canister

| | |
|---|---|
| **Canister ID** | `urs2a-ziaaa-aaaad-aembq-cai` |
| **Candid UI** | https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai |
| **Local dev** | `dfx start` then `dfx deploy`, use your local canister ID |

---

## Pricing — Subscription Model

| Operation | Cost |
|-----------|------|
| Send/Transfer | 1 action |
| DEX Swap | 1 action |
| Cross-chain Bridge | 1 action |
| Address derivation | FREE |
| Balance queries | FREE |
| Swap quotes | FREE |
| Strategy creation | 1 action |

All write operations cost **1 action** from your subscription. No per-action dollar fees.

---

## Subscription Packages

| Tier | Price | Actions/Month | Best for |
|------|-------|---------------|----------|
| **Basic** | $20/mo | 100 | Agents & personal wallets |
| **Developer** | $45.50/mo | 1,000 | Side projects, small apps |
| **Pro** | $128.70/mo | 5,000 | Production apps |
| **Enterprise** | $323.70/mo | Unlimited | High-volume, multi-app |

```bash
# Purchase a subscription
dfx canister call urs2a-ziaaa-aaaad-aembq-cai purchaseGatewayPackage '(variant { Developer }, "ICP")'
```

---

## Developer Packages

### NPM (Frontend)

Required:
```bash
npm install @dfinity/agent @dfinity/candid @dfinity/principal
```

Optional (for auth):
```bash
npm install @dfinity/auth-client
```

Blockchain-specific (if building custom UI):
```bash
npm install @solana/web3.js    # Solana utilities
npm install xrpl               # XRP utilities
npm install tronweb            # Tron utilities
```

### Mops (Motoko Backend)

Required — add to `mops.toml`:
```toml
[dependencies]
base = "0.13.2"
```

You do NOT need MeneseSDK's internal dependencies (evm-txs, libsecp256k1, etc.).
Your canister only calls MeneseSDK via inter-canister calls — all crypto is handled internally.

### Declarations (Auto-generated)

After running `dfx generate`, you get:
```
src/declarations/backend/
├── backend.did          # Candid interface (human-readable)
├── backend.did.d.ts     # TypeScript type definitions (150+ types)
├── backend.did.js       # JavaScript IDL factory
└── index.js             # Pre-configured actor creator
```

These are the type-safe bindings for calling MeneseSDK from JavaScript/TypeScript.

---

## Supported Chains (19)

| Chain | Send | Swap | Bridge | DEX |
|-------|------|------|--------|-----|
| Solana | 1 action | 1 action | 1 action | Raydium |
| Ethereum | 1 action | 1 action | 1 action | Uniswap V3 |
| Arbitrum | 1 action | 1 action | - | Uniswap V3 |
| Base | 1 action | 1 action | - | Uniswap V3 |
| Polygon | 1 action | 1 action | - | Uniswap V3 |
| BSC | 1 action | 1 action | - | PancakeSwap |
| Optimism | 1 action | 1 action | - | Uniswap V3 |
| Bitcoin | 1 action | - | - | - |
| Litecoin | 1 action | - | - | - |
| ICP | FREE | 1 action | - | ICPSwap, KongSwap |
| XRP | 1 action | 1 action | - | XRP DEX |
| SUI | 1 action | 1 action | - | Cetus |
| TON | 1 action | - | - | - |
| Cardano | 1 action | 1 action | - | Minswap |
| Tron | 1 action | - | - | - |
| Aptos | 1 action | - | - | - |
| NEAR | 1 action | - | - | - |
| CloakCoin | 1 action | - | - | - |
| THORChain | 1 action | - | - | - |

All operations cost 1 action from your subscription.

---

## FREE Operations (No Credits Needed)

These operations cost nothing — great for building read-only dashboards:

```typescript
// All address derivation (19 chains)
await menese.getMySolanaAddress();
await menese.getMyEvmAddress();
await menese.getMyBitcoinAddress();
await menese.getMyCardanoAddress();
// ... all 19 chains

// All balance queries
await menese.getMySolanaBalance();
await menese.getEvmBalance(address, chainId);

// Swap quotes (no execution)
await menese.getRaydiumQuote(inputMint, outputMint, amount, slippage);
await menese.getICPDexQuote(tokenIn, tokenOut, amountIn);

// Strategy management
await menese.addStrategyRule(rule);
await menese.getMyStrategyRules();

// Developer registration
await menese.registerDeveloperCanister(principal, name);
await menese.getMyDeveloperKey();
```

---

## Tips for Caffeine

1. **Always include `sdk-setup.ts`** — it has the full Candid IDL that Caffeine needs to understand the API
2. **Include `MeneseInterface.mo`** for Motoko — it's the complete actor type definition
3. **Include `backend.did.d.ts`** for TypeScript — it has all 150+ type definitions
4. **Start with FREE operations** — address derivation and balances cost nothing, great for prototyping
5. **Use Client Mode by default** — it's cheaper and works for any app with a frontend
6. **Use Agent Mode only when autonomous** — bots, timers, canister-to-canister (no browser)
7. **Start with FREE operations** — address derivation and balance queries cost nothing, great for prototyping before using paid ops
