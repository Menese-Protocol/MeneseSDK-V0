# ClawdBot + MeneseSDK Multi-Chain Wallet Guide

Turn your ClawdBot instance into a multi-chain crypto wallet bot.
Users interact via WhatsApp — ClawdBot handles addresses, balances, sends,
and swaps across 15 chains using MeneseSDK.

## Two Integration Approaches

### Approach A: Canister-Based (Recommended for Production)

```
User (WhatsApp) → ClawdBot → Your Wallet Canister (ICP) → MeneseSDK canister
```

**Your canister** lives on ICP and makes inter-canister calls to MeneseSDK.
ClawdBot calls your canister via dfx or HTTP agent.

**Best for:**
- Multi-user bots (each user gets their own derived wallets)
- Merchant/business use (persistent invoice state, on-chain logic)
- Autonomous automation (timers, auto-sweep, DCA bots)
- Production apps that need reliability and uptime

**Pros:**
- On-chain, deterministic, no VPS dependency for wallet logic
- Developer key billing is automatic (register canister once)
- Can run ICP timers for scheduled operations (auto-swap, rebalancing)
- Persistent state survives reboots (invoices, logs, settings)
- Each caller (user principal) gets unique derived addresses

**Cons:**
- Requires deploying and maintaining a canister
- Costs ICP cycles (~$5/year for a light canister)
- More initial setup

**Setup:** See `WalletBot.mo` — deploy it, register with MeneseSDK, done.

---

### Approach B: Direct CLI (Quick Personal Setup)

```
User (WhatsApp) → ClawdBot → dfx canister call → MeneseSDK canister
```

ClawdBot runs `dfx canister call` commands directly from your VPS.
No canister deployment needed — just dfx and your identity.

**Best for:**
- Personal wallet bot (single user)
- Quick prototyping and testing
- Learning MeneseSDK before building a full canister

**Pros:**
- Zero deployment — works immediately with dfx installed
- Uses your existing dfx identity (no new canister needed)
- Simple to understand and debug
- Good for testing before committing to a canister

**Cons:**
- Tied to your VPS — if VPS is down, wallet bot is down
- Single identity — all operations use YOUR principal
- No on-chain automation (no timers, no persistent state)
- Not suitable for multi-user scenarios

**Setup:** See `wallet_commands.py` — copy to your workspace, done.

---

## Performance Tip: Use Your Own RPC for Balance Queries

**Balance queries through MeneseSDK go through the canister's shared RPC
endpoints.** For faster balance checks, query the chain directly with your
own RPC. This is free and much faster.

| Chain | Recommended RPC | How |
|-------|----------------|-----|
| Solana | Helius, QuickNode, Triton | `getBalance(address)` |
| EVM chains | Alchemy, Infura, your node | `eth_getBalance(address)` |
| Bitcoin | Mempool.space, Blockstream | REST API |
| ICP | ICP ledger canister | `icrc1_balance_of` directly |
| XRP | XRPL websocket | `account_info` command |
| SUI | SUI RPC | `suix_getBalance` |

**MeneseSDK is best for:** address derivation, signing, sending, swapping, bridging.
**Your own RPC is best for:** read-only balance checks at scale (faster, free).

```typescript
// Fast: Query SOL balance with your own RPC
const connection = new Connection("https://your-rpc.helius.xyz");
const balance = await connection.getBalance(new PublicKey(myAddress));

// Use MeneseSDK for address derivation (one-time, cache it)
const addr = await menese.getMySolanaAddress();
// Then use addr.address with your own RPC for all future balance checks
```

```python
# Fast: Query ICP balance directly (no MeneseSDK needed)
# dfx ledger balance --network ic
# Or call the ICP ledger canister directly
```

---

## Approach A: Canister Setup (WalletBot.mo)

### 1. Deploy the Wallet Canister

```bash
# Copy WalletBot.mo to your dfx project
cp WalletBot.mo src/
dfx deploy WalletBot --network ic
```

### 2. Register your canister with MeneseSDK (one-time)

```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-WALLET-BOT-CANISTER-ID", "MyWalletBot")'
# Returns: msk_xxxxx... (save this key)
```

### 3. Configure ClawdBot system prompt

Add this to your ClawdBot's context so it knows how to use the wallet:

```
You control a crypto wallet canister on ICP. Call it with dfx:
- Addresses: dfx canister call CANISTER_ID getAddresses --network ic
- Balance: dfx canister call CANISTER_ID checkBalance '("sol")' --network ic
- Send: dfx canister call CANISTER_ID sendTokens '("sol", 1000000, "ADDR")' --network ic
- Account: dfx canister call CANISTER_ID getBillingStatus --network ic
```

---

## Approach B: Direct CLI Setup (wallet_commands.py)

### 1. Install

```bash
cp wallet_commands.py /root/.openclaw/workspace/
chmod +x wallet_commands.py
```

### 2. Test

```bash
python3 wallet_commands.py addresses          # Get all 15 chain addresses
python3 wallet_commands.py balance sol         # Check SOL balance
python3 wallet_commands.py account             # Check billing status
```

### 3. Configure ClawdBot system prompt

```
You can manage crypto wallets. Run these commands:
- python3 wallet_commands.py addresses
- python3 wallet_commands.py balance <chain>   (sol, icp, eth, btc, xrp, sui)
- python3 wallet_commands.py send <chain> <amount> <address>
- python3 wallet_commands.py account
```

---

## Example WhatsApp Conversations

Both approaches support natural language via ClawdBot:

```
User: "What are my wallet addresses?"
Bot:  Your multi-chain addresses:
        Solana:   5xK2abc...
        Ethereum: 0x7f3d...  (same for ARB/BASE/POLY/BNB/OP)
        Bitcoin:  bc1q...
        ICP:      aaaaa-bbbbb-...
        ... (15 chains total)

User: "Check my SOL balance"
Bot:  SOL balance: 2.45 SOL

User: "Send 0.5 SOL to 5xK2abc..."
Bot:  Sending 0.5 SOL (500,000,000 lamports)...
      TX: 4vJ7k... (view on solscan.io)

User: "How much does a send cost?"
Bot:  Sends cost $0.05 per operation. Swaps are $0.075.
      Balance checks and address queries are always FREE.
```

---

## Files

| File | Approach | Purpose |
|------|----------|---------|
| `README.md` | Both | This guide |
| `WalletBot.mo` | A (Canister) | ICP canister wrapping MeneseSDK |
| `wallet_commands.py` | B (CLI) | Direct dfx commands from VPS |

## Pricing

| Operation | Cost | Requires MeneseSDK? |
|-----------|------|---------------------|
| Get addresses | FREE | Yes (one-time, cache result) |
| Check balance | FREE | Optional (faster with own RPC) |
| Send tokens | $0.05 | Yes (signing requires MeneseSDK) |
| Swap (DEX) | $0.075 | Yes |
| Bridge ETH→SOL | $0.10 | Yes |

## MeneseSDK Canister ID

**Mainnet:** `urs2a-ziaaa-aaaad-aembq-cai`
