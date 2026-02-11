# MeneseSDK Frontend Integration Examples

Tested TypeScript examples for integrating MeneseSDK into any web app.
Each file is self-contained — copy the one you need and adapt.

## Prerequisites

```bash
npm install @dfinity/agent @dfinity/candid @dfinity/principal @dfinity/auth-client
```

## Examples

| File | Use Case | Chains |
|------|----------|--------|
| `01-quick-start.ts` | Connect + get addresses + balances | All 15 chains |
| `02-send-tokens.ts` | Send any token on any chain | SOL, ETH, BTC, ICP, XRP, SUI, TON, etc. |
| `03-swap.ts` | DEX swaps (6 DEXes) | SOL, EVM, ICP, SUI, Cardano, XRP |
| `04-bridge-eth-to-sol.ts` | CCTP bridge USDC from EVM to Solana | ETH/ARB/BASE → SOL |
| `05-merchant-checkout.ts` | Accept crypto payments in your store | All chains |
| `06-portfolio-tracker.ts` | Multi-chain portfolio dashboard | All 15 chains |

## Canister ID

**Mainnet:** `urs2a-ziaaa-aaaad-aembq-cai`

## Developer Billing

Register once to get your API key. All user operations bill YOUR account:

```typescript
const key = await menese.registerDeveloperCanister(myCanisterId, "MyApp");
// Returns: msk_a7f3c291e5b8d4f7...
```

## Pricing

| Operation | Cost | Examples |
|-----------|------|----------|
| Sign/Send | $0.05 | sendSol, sendBtc, sendIcp, transferSplToken |
| Swap | $0.075 | Raydium, Uniswap, ICPSwap/KongSwap, Cetus, Minswap, XRP DEX |
| Bridge | $0.10 | startCctpBridge, quickUltrafastBridge |
| Read/Query | FREE | getBalance, getAddress, getQuote |

## Chain-Specific Setup

Some chains require one-time setup before you can hold or trade tokens.

### Solana — Associated Token Accounts (ATAs)

On Solana, each token requires a separate account (ATA) in your wallet.
Before receiving or swapping to a new SPL token, create the ATA:

```typescript
// Create ATA for USDC (one-time per token, costs ~0.002 SOL for rent)
await menese.createMySolanaAtaForMint("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");

// Check your ATA address
const ata = await menese.getMySolanaAta("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
console.log("My USDC ATA:", ata);
```

Native SOL does NOT need an ATA — only SPL tokens (USDC, USDT, BONK, etc.).

### XRP — Trustlines

The XRP Ledger requires trustlines before you can hold non-XRP tokens.
A trustline tells the network you accept a specific token from a specific issuer:

```typescript
// Trust USD from Bitstamp (one-time per token+issuer)
await menese.xrpSetTrustline("USD", "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B", "1000");

// Check your trustlines
const lines = await menese.xrpGetAccountLines();
```

Without a trustline, swaps and transfers receiving that token will fail.

### Other Chains

- **EVM (ETH, ARB, BASE, etc.)**: No setup needed. ERC-20 tokens work automatically.
- **ICP**: No setup needed. ICRC-1 tokens work automatically.
- **SUI**: No setup needed. Coin objects are created automatically.
- **Cardano**: No setup needed. Native tokens transfer alongside ADA.
- **Bitcoin/Litecoin**: No setup needed. UTXO-based.
- **TON**: No setup needed.

## Performance Tip

For production apps that check balances frequently, use your own RPC
endpoints (Helius, Alchemy, Infura) instead of MeneseSDK balance queries.
MeneseSDK uses shared RPCs — your own will be faster.

Use MeneseSDK for: **address derivation (once), signing, sending, swapping, bridging**.
Use your own RPC for: **balance checks, transaction history, token metadata**.
