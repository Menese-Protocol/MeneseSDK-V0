# MeneseSDK Examples

Multi-chain payment gateway on the Internet Computer. Send, swap, and bridge
across 19 blockchains from a single canister.

## What You Can Build

MeneseSDK isn't just a payment gateway — it's a **programmable multi-chain execution layer**.
Your canister or frontend can automate any on-chain action across 19 blockchains.

### Automated Trading & DCA
Build bots that execute trades based on price conditions, all running autonomously on ICP timers:

- **Dollar-Cost Averaging** — Buy SOL/ETH/any token at fixed intervals (see `02-AutomationBot.mo`)
- **Take Profit / Stop Loss** — Set price thresholds, MeneseSDK executes the swap when triggered
- **Volatility Triggers** — React to market volatility automatically
- **Scheduled Execution** — Time-based actions (weekly buys, monthly rebalancing)

```motoko
// Set a take-profit rule: sell SOL when price hits $250
let rule : Rule = {
  id = 0;
  positionId = 0;
  ruleType = #TakeProfit;
  triggerPrice = 250_000_000; // $250 in micro-USD
  sizePct = 100;
  swapAmountLamports = ?500_000_000; // 0.5 SOL
  swapAmountWei = null;
  chainType = #Solana;
  status = #Draft;
  createdAt = Time.now();
  dcaConfig = null;
  lpConfig = null;
  scheduledConfig = null;
  volatilityConfig = null;
};
await menese.addStrategyRule(rule);
```

### Liquidity Management
Automate LP positions on Ethereum (Uniswap V3) and ICP DEXes (ICPSwap, KongSwap):

- **Add/Remove Liquidity** — `addLiquidity`, `addLiquidityETH`, `removeLiquidity`, `removeLiquidityETH`
- **Auto-Rebalance** — Use `#Rebalance` rules to adjust concentrated LP ranges
- **APY Migration** — `#APYMigration` rules automatically move LP to higher-yield pools
- **ICP DEX Liquidity** — `addICPLiquidity`, `removeICPLiquidity` on ICPSwap and KongSwap

```typescript
// Client mode: Add ETH + USDC liquidity on Uniswap V3
const result = await actor.addLiquidityETH(
  "USDC",           // token to pair with ETH
  1000000000n,      // 1000 USDC desired
  500000000000000000n, // 0.5 ETH desired
  100,               // 1% slippage
  "https://eth-mainnet.rpc.url",
  quoteId
);
```

### DeFi Protocol Integration
Access Aave and Lido directly from your canister:

- **Aave Lending** — `aaveSupplyEth`, `aaveSupplyToken` to earn yield
- **Aave Withdrawals** — `aaveWithdrawEth`, `aaveWithdrawToken` to reclaim funds
- **Lido Staking** — `stakeEthForStEth`, `wrapStEth`, `unwrapWstEth`

### Custom Smart Contract Calls
Call **any** EVM smart contract — read state or execute transactions:

```motoko
// Write: execute a function on any Ethereum contract
await menese.callEvmContractWrite(
  "0xContractAddress",
  "transfer(address,uint256)",
  ["0xRecipient", "1000000"],
  "https://eth-mainnet.rpc.url"
);

// Read: query any contract state (FREE)
let balance = await menese.callEvmContractRead(
  "0xTokenContract",
  "balanceOf(address)",
  ["0xWalletAddress"],
  "https://eth-mainnet.rpc.url"
);
```

### Build Your Own Automation Layer
You don't have to use the built-in strategy engine. Build your own:

1. **ICP Canister with Timers** — Deploy your own canister that calls MeneseSDK on a schedule
2. **Hosted Price Listener** — Run a server that monitors prices via WebSockets and triggers MeneseSDK actions via client mode
3. **Webhook-Driven** — Integrate with price alert services, trigger swaps/sends when conditions are met
4. **Custom Logic** — Combine balance checks, price feeds, and multi-chain actions into any workflow

**Need something specific?** Contact Menese Protocol for custom automation challenges — multi-chain arbitrage,
cross-chain yield optimization, conditional bridging, or any complex DeFi workflow you can imagine.

---

## Two Modes

| | Client Mode | Agent Mode |
|---|---|---|
| **How** | Frontend → Relay → Canister signs | Your canister → MeneseSDK (HTTP outcalls) |
| **Send** | $0.05 | $0.10 |
| **Swap** | $0.075 | $0.15 |
| **Bridge** | $0.10 | $0.20 |
| **Best for** | Browser apps, wallets, checkouts | Bots, automation, canister-to-canister |
| **Requires** | Developer key + relay | Credits deposited in gateway |

## Directory Structure

```
examples/
├── client-mode/              # Relay-based (browser/app present, cheaper)
│   ├── menese-config.ts      # Shared config + relay helpers
│   ├── 01-quick-start.ts     # Get addresses on 19 chains (FREE)
│   ├── 02-send-tokens.ts     # Send on all chains ($0.05)
│   ├── 03-swap.ts            # DEX swaps on 6 chains ($0.075)
│   ├── 04-bridge-eth-to-sol.ts  # Cross-chain bridges ($0.10)
│   ├── 05-merchant-checkout.ts  # Payment flow
│   ├── 06-portfolio-tracker.ts  # Balance dashboard (FREE)
│   ├── 07-defi-lending.ts    # Aave V3 + Lido staking ($0.10)
│   ├── 08-defi-liquidity.ts  # Uniswap V3 + ICP DEX LP ($0.10)
│   ├── 09-custom-contracts.ts  # Call any EVM contract ($0.10 write / FREE read)
│   ├── DeveloperDashboard.tsx  # Developer account management
│   └── README.md
├── agent-mode/               # Canister HTTP outcalls (autonomous, more expensive)
│   ├── MeneseInterface.mo    # Full actor type (all endpoints incl. DeFi)
│   ├── 01-BasicIntegration.mo  # Canister basics
│   ├── 02-AutomationBot.mo   # Timer-based DCA bot
│   ├── 03-MerchantPayments.mo  # Invoice + payment system
│   ├── 04-DeFiBot.mo         # Autonomous DeFi yield bot (Aave + Lido + LP)
│   ├── WalletBot.mo          # Multi-chain wallet bot
│   ├── wallet_commands.py    # Python CLI wrapper
│   └── README.md
└── README.md                 # This file
```

## Supported Chains (19)

Solana, Ethereum, Arbitrum, Base, Polygon, BSC, Optimism, Bitcoin, Litecoin,
ICP, XRP, SUI, TON, Cardano, Tron, Aptos, NEAR, CloakCoin, THORChain

## Production Canister

| | |
|---|---|
| **Canister ID** | `urs2a-ziaaa-aaaad-aembq-cai` |
| **Candid UI** | https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai |
| **Local dev** | `dfx start` then `dfx deploy` |

## Subscription Packages

| Tier | Price | Actions/Month | Best for |
|------|-------|---------------|----------|
| **Free** | $0 | 5 (lifetime) | Testing & prototyping |
| **Developer** | $35/mo | 1,000 | Side projects, small apps |
| **Pro** | $99/mo | 5,000 | Production apps |
| **Enterprise** | $249/mo | Unlimited | High-volume, multi-app |

Or use **pay-per-use credits** — deposit ICP and pay per operation at the rates above.

```bash
# Purchase a subscription
dfx canister call urs2a-ziaaa-aaaad-aembq-cai purchaseGatewayPackage '(variant { Developer }, "ICP")'

# Or deposit credits (pay-per-use)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai depositGatewayCredits '("ICP", 100000000)'
```

## FREE Operations

- All address derivation (19 chains)
- All balance queries
- Swap quotes (Raydium, ICP DEX, Cetus, Minswap)
- Strategy creation
- Developer registration

## AI-Assisted Development

See **[VIBE_CODING_GUIDE.md](./VIBE_CODING_GUIDE.md)** for how to use Caffeine or other
AI coding assistants with MeneseSDK. Includes context file recommendations,
prompt templates, and developer package setup.

## Developer Packages

**Frontend (npm)**:
```bash
npm install @dfinity/agent @dfinity/candid @dfinity/principal @dfinity/auth-client
```

**Backend (Motoko via mops)**:
```toml
# mops.toml — only base is needed, MeneseSDK handles all crypto internally
[dependencies]
base = "0.13.2"
```

**Type declarations** (auto-generated):
```bash
dfx generate  # Creates src/declarations/backend/ with .did, .did.d.ts, .did.js
```
