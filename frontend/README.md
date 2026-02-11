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
| `01-quick-start.ts` | Connect + get addresses + balances | All 19 chains |
| `02-send-tokens.ts` | Send any token on any chain | All 19 chains (SOL, ETH, BTC, ICP, XRP, SUI, TON, ADA, TRX, APT, LTC, NEAR, CLOAK, RUNE) |
| `03-swap.ts` | DEX swaps (6 DEXes) | SOL, EVM, ICP, SUI, Cardano, XRP |
| `04-bridge-eth-to-sol.ts` | Bridge between EVM and Solana (both directions) | ETH/ARB/BASE/OP/POLY ↔ SOL |
| `05-merchant-checkout.ts` | Accept crypto payments in your store | SOL, ETH, BTC, ICP |
| `06-portfolio-tracker.ts` | Multi-chain portfolio dashboard | All 19 chains |

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
| Sign/Send | $0.05 | sendSolTransaction, sendBitcoin, sendICP, sendEvmNativeTokenAutonomous |
| Swap | $0.075 | swapRaydiumApiUser, swapTokens, executeICPDexSwap, executeSuiSwap, executeMinswapSwap, xrpSwap |
| Bridge | $0.10 | quickUltrafastEthToSol, quickCctpBridge, quickSolToEth |
| Read/Query | FREE | getBalance, getAddress, getQuote |

## EVM Chains — Bring Your Own RPC

For EVM sends, swaps, and bridges, you must provide your own RPC endpoint and chain ID.
MeneseSDK does NOT manage EVM RPC connections — this keeps costs low and gives you
control over reliability and rate limits.

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

// Send ETH on Arbitrum — pass RPC + chainId
await menese.sendEvmNativeTokenAutonomous(
  "0xRecipient", amountWei, EVM_CHAINS.arbitrum.rpc, BigInt(42161), []
);
```

Free public RPCs work fine for testing. For production, use Alchemy, Infura, or
chain-specific premium RPCs for better reliability and throughput.

## Chain-Specific Setup

Some chains require one-time setup before you can hold or trade tokens.

### Solana — Associated Token Accounts (ATAs)

On Solana, each token requires a separate account (ATA) in your wallet.
Before receiving or swapping to a new SPL token, create the ATA:

```typescript
// Create ATA for USDC (one-time per token, costs ~0.002 SOL for rent)
await menese.createMySolanaAtaForMint(mintBase58, ataBase58);

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
- **TON/Tron/Aptos/NEAR/CloakCoin/Thorchain**: No setup needed.

## Important: Correct Field Names

Address types return records with specific field names. Using the wrong field will
cause runtime errors. Key differences from what you might expect:

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

See `menese-config.ts` for the complete, correct IDL.

## Performance Tip

For production apps that check balances frequently, use your own RPC
endpoints (Helius, Alchemy, Infura) instead of MeneseSDK balance queries.
MeneseSDK uses shared RPCs — your own will be faster.

Use MeneseSDK for: **address derivation (once), signing, sending, swapping, bridging**.
Use your own RPC for: **balance checks, transaction history, token metadata**.
