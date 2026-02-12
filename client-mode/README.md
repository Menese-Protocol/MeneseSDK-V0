# MeneseSDK — Client Mode Examples

**Client Mode** = your frontend calls the relay API, which handles RPC calls.
The canister only signs transactions (no HTTP outcalls = cheaper).

## Pricing (Client Mode)

| Operation | Cost |
|-----------|------|
| Send/Transfer | $0.05 |
| DEX Swap | $0.075 |
| Cross-chain Bridge | $0.10 |
| Address/Balance queries | FREE |
| Strategy creation | FREE |

## Subscription Packages

| Tier | Price | Actions/Month |
|------|-------|---------------|
| **Free** | $0 | 5 (lifetime) |
| **Developer** | $35/mo | 1,000 |
| **Pro** | $99/mo | 5,000 |
| **Enterprise** | $249/mo | Unlimited |

Or deposit credits (ICP) for pay-per-use at the rates above.

## When to use Client Mode

- Your app has a **browser/frontend** that can call HTTP APIs
- You want the **cheapest** per-operation pricing
- You're building a **consumer-facing** app (wallet, checkout, dashboard)
- You have a **developer key** (`msk_*`) from `registerDeveloperCanister`

## Automation from Client Mode

Client mode isn't just for one-off sends. Build **price-driven automation** from any hosted environment:

- **Price Listener + Action** — Run a server/worker that monitors prices via WebSocket or REST, then triggers MeneseSDK relay calls when conditions are met
- **Liquidity Management** — Call `addLiquidityETH`, `removeLiquidity` on Uniswap V3 based on your own logic
- **DeFi Yield** — Supply to Aave (`aaveSupplyEth`, `aaveSupplyToken`), withdraw when APY drops
- **Custom Contracts** — Call any EVM smart contract with `callEvmContractWrite` / `callEvmContractRead`
- **Webhook-Driven** — Integrate with price alert services (e.g., CoinGecko, TradingView alerts) to trigger automated trades

```typescript
// Example: Price listener that auto-swaps when ETH drops below $2000
async function onPriceUpdate(ethPrice: number) {
  if (ethPrice < 2000) {
    // Buy ETH with USDC via relay (cheapest mode)
    await relay.swap("USDC", "ETH", 500_000_000n, 100); // $500 USDC → ETH, 1% slippage
  }
}
```

**Need complex automation?** Contact Menese Protocol — we help build custom multi-chain workflows, arbitrage bots, and conditional bridging strategies.

## How it works

```
Frontend → Relay API (relay.menese.io) → Canister signs only → Relay broadcasts
```

1. Frontend calls relay with your developer key
2. Relay fetches chain data (blockhash, nonce, gas price) — FREE
3. Relay calls canister sign-only endpoint — only cost is ECDSA signing
4. Relay broadcasts the signed transaction — FREE

## Files

| File | Description |
|------|-------------|
| `menese-config.ts` | Shared config, full Candid IDL, relay + agent helpers |
| `01-quick-start.ts` | Get wallet addresses on 19 chains (FREE) |
| `02-send-tokens.ts` | Send tokens on all 19 chains ($0.05/send) |
| `03-swap.ts` | DEX swaps on 6 chains ($0.075/swap) |
| `04-bridge-eth-to-sol.ts` | Cross-chain bridges ($0.10/bridge) |
| `05-merchant-checkout.ts` | Payment flow with balance monitoring |
| `06-portfolio-tracker.ts` | Multi-chain balance dashboard (FREE) |
| `07-defi-lending.ts` | Aave V3 supply/withdraw + Lido stake/wrap ($0.10) |
| `08-defi-liquidity.ts` | Uniswap V3 + ICP DEX LP management ($0.10) |
| `09-custom-contracts.ts` | Call any EVM contract (write $0.10 / read FREE) |
| `DeveloperDashboard.tsx` | Developer account management (credits, key, canisters) |

## Quick Start

```typescript
import { createMeneseActor, relay, DEVELOPER_KEY } from "./menese-config";

// Agent Mode (direct canister call — $0.10/send)
const menese = await createMeneseActor();
await menese.sendSolTransaction("recipient...", BigInt(100000000));

// Client Mode (via relay — $0.05/send)
const result = await relay.sendSol("recipient...", 100000000);
```

## Setup

1. Install: `npm install @dfinity/agent @dfinity/candid @dfinity/principal @dfinity/auth-client`
2. Register as developer: call `registerDeveloperCanister` on the canister
3. Set your `DEVELOPER_KEY` in `menese-config.ts`
4. Import the helpers and start building

## Production Canister

| | |
|---|---|
| **Canister ID** | `urs2a-ziaaa-aaaad-aembq-cai` |
| **Candid UI** | https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai |
| **Local dev** | `dfx start` then `dfx deploy`, update `CANISTER_ID` in `menese-config.ts` |

## Developer Packages

```bash
npm install @dfinity/agent @dfinity/candid @dfinity/principal @dfinity/auth-client
```

Type declarations (auto-generated after `dfx generate`):
- `src/declarations/backend/backend.did.d.ts` — 150+ TypeScript types
- `src/declarations/backend/backend.did.js` — Candid IDL factory

## AI-Assisted Development (Caffeine)

Feed Caffeine these files for best results:
1. `menese-config.ts` — full Candid IDL + relay helpers
2. `backend.did.d.ts` — all TypeScript type definitions
3. Any relevant example file from this directory

See **[../VIBE_CODING_GUIDE.md](../VIBE_CODING_GUIDE.md)** for prompt templates and tips.
