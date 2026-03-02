# MeneseSDK — Frontend Examples (TypeScript)

Two integration patterns for frontend/browser apps:

**Full Execution** — Call the canister → it handles RPC, signing, and broadcasting. Simplest integration.

**Sign-Only** — Your frontend fetches chain data from your RPCs → canister signs → you broadcast.
The canister makes zero HTTP outcalls — cheaper in cycles.

## Pricing

All operations cost **1 action** from your subscription. No per-action fees.

| Tier | Price | Actions/Month |
|------|-------|---------------|
| **Basic** | $20/mo | 100 |
| **Developer** | $45.50/mo | 1,000 |
| **Pro** | $128.70/mo | 5,000 |
| **Enterprise** | $323.70/mo | Unlimited |

**FREE (no subscription needed):** All address derivation, balance queries, swap quotes,
`registerDeveloperCanister`, gateway queries.

## Files

| File | Mode | Description |
|------|------|-------------|
| `sdk-setup.ts` | — | Shared config, full Candid IDL, actor + broadcast helpers |
| `01-quick-start.ts` | FREE | Get wallet addresses on 19 chains |
| `02-send-tokens.ts` | Full Execution | Send tokens on all 19 chains |
| `03-swap.ts` | Full Execution | DEX swaps on 6 chains (Raydium, Uniswap, ICPSwap, Cetus, Minswap, XRP DEX) |
| `04-merchant-checkout.ts` | Full Execution | Payment flow with balance monitoring |
| `05-portfolio-tracker.ts` | FREE | Multi-chain balance dashboard |
| `06-defi-lending.ts` | Full Execution | Aave V3 supply/withdraw + Lido stake/wrap |
| `07-defi-liquidity.ts` | Full Execution | Uniswap V3 + ICP DEX LP management |
| `08-custom-contracts.ts` | Full Execution | Call any EVM contract (write = 1 action / read = FREE) |
| `09-icrc2-tokens.ts` | Full Execution | ICRC-2 approve, transferFrom, allowance |
| `10-strategy-engine.ts` | Full Execution | Automation rules (TP/SL/DCA/Rebalance) from TypeScript |
| `11-sign-and-broadcast.ts` | **Sign-Only** | Full sign-only flow: fetch → sign → broadcast (SOL, EVM, XRP, SUI) |
| `DeveloperDashboard.tsx` | — | Developer account management (subscription, key, canisters) |

## Quick Start

```typescript
import { createMeneseActor, broadcastSolana } from "./sdk-setup";

const actor = await createMeneseActor();

// Get your Solana address (FREE)
const sol = await actor.getMySolanaAddress();
console.log("Solana:", sol.address);

// Full execution: canister handles everything (1 action)
const result = await actor.sendSolTransaction("recipient...", BigInt(100000000));

// Sign-only: you provide blockhash, canister signs, you broadcast (1 action)
const signed = await actor.signSolTransferRelayer("recipient...", BigInt(100000000), blockhash);
const txSig = await broadcastSolana(signed.signedTxBase64, "https://api.mainnet-beta.solana.com");
```

## Sign-Only vs Full Execution

| | Full Execution | Sign-Only |
|---|---|---|
| **How it works** | Call canister → it handles everything | Fetch chain data → canister signs → you broadcast |
| **Canister cycles** | Higher (HTTP outcalls) | Lower (no outcalls) |
| **Complexity** | Simplest (one call) | More code (3 steps) |
| **Control** | Canister manages RPCs | You choose RPCs |
| **Best for** | Quick prototyping, backend bots | Production apps, custom retry logic |
| **Examples** | 02 through 10 | 11-sign-and-broadcast.ts |

## Setup

1. Install: `npm install @dfinity/agent @dfinity/candid @dfinity/principal @dfinity/auth-client`
2. Register as developer: call `registerDeveloperCanister` on the canister
3. Purchase a subscription: call `purchaseGatewayPackage`
4. Import the helpers and start building

## Chain-Specific Setup

- **Solana**: Create ATAs for SPL tokens before transferring (`createMySolanaAtaForMint`)
- **XRP**: Set trustlines before receiving IOUs (`xrpSetTrustline`)
- **EVM**: Provide your own RPC endpoint and chain ID for each network
- **TON**: Address has `bounceable` and `nonBounceable` variants — use the right one

## Field Name Gotchas

| Chain | Field | NOT this |
|-------|-------|----------|
| EVM | `evmAddress` | `address` |
| Bitcoin/Litecoin | `bech32Address` | `address` |
| SUI | `suiAddress` | `address` |
| TON | `bounceable` / `nonBounceable` | `address` |
| XRP | `classicAddress` | `address` |
| Tron | `base58Address` | `address` |
| CloakCoin | 6 decimals (1 CLOAK = 1,000,000 units) | 8 decimals |

## Production Canister

| | |
|---|---|
| **Canister ID** | `urs2a-ziaaa-aaaad-aembq-cai` |
| **Candid UI** | https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai |
| **Local dev** | `dfx start` then `dfx deploy`, update `CANISTER_ID` in `sdk-setup.ts` |

## AI-Assisted Development

Feed your AI coding assistant these files for best results:
1. `sdk-setup.ts` — full Candid IDL
2. Any relevant example file from this directory

See **[../AI_CODING_GUIDE.md](../AI_CODING_GUIDE.md)** for prompt templates and tips.
