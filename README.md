# MeneseSDK Examples

Multi-chain payment gateway on the Internet Computer. Send, swap, stake, and manage liquidity
across 19 blockchains from a single canister.

## What You Can Build

MeneseSDK is a **programmable multi-chain execution layer**. Your canister or frontend can
automate any on-chain action across 19 blockchains.

### Automated Trading & DCA
Build bots that execute trades based on price conditions, all running autonomously on ICP timers:

- **Dollar-Cost Averaging** — Buy SOL/ETH/any token at fixed intervals (see `backend/02-AutomationBot.mo`)
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
// Add ETH + USDC liquidity on Uniswap V3
const result = await actor.addLiquidityETH(
  "USDC",                      // token to pair with ETH
  1000000000n,                 // 1000 USDC desired
  500000000000000000n,         // 0.5 ETH desired
  100,                         // 1% slippage
  "https://eth-mainnet.rpc.url",
  []                           // optional quoteId
);
```

### DeFi Protocol Integration
Access Aave and Lido directly from your canister or frontend:

- **Aave Lending** — `aaveSupplyEth`, `aaveSupplyToken` to earn yield
- **Aave Withdrawals** — `aaveWithdrawEth`, `aaveWithdrawToken` to reclaim funds
- **Lido Staking** — `stakeEthForStEth`, `wrapStEth`, `unwrapWstEth`

### Custom Smart Contract Calls
Call **any** EVM smart contract — read state or execute transactions:

```motoko
// Write: execute a function on any Ethereum contract (1 action)
await menese.callEvmContractWrite(
  "0xContractAddress",
  "transfer(address,uint256)",
  ["0xRecipient", "1000000"],
  "https://eth-mainnet.rpc.url",
  1,  // chainId
  0,  // value (ETH to send)
  null
);

// Read: query any contract state (FREE)
let balance = await menese.callEvmContractRead(
  "0xTokenContract",
  "balanceOf(address)",
  ["0xWalletAddress"],
  "https://eth-mainnet.rpc.url"
);
```

---

## Two Integration Modes

| | Full Execution | Sign-Only |
|---|---|---|
| **How** | Call canister → it handles everything (RPC + sign + broadcast) | You fetch chain data → canister signs → you broadcast |
| **Best for** | Bots, automation, AI agents, quick prototyping | Production frontends, custom retry logic, cost savings |
| **RPC** | MeneseSDK handles it | You provide your own |
| **Canister cycles** | Higher (HTTP outcalls) | Lower (no outcalls) |

Both modes consume 1 action per operation from your subscription.

## Directory Structure

```
├── frontend/                   # TypeScript — build web apps
│   ├── sdk-setup.ts            # Full Candid IDL + actor helpers + broadcast helpers
│   ├── 01-quick-start.ts       # Get addresses on 19 chains (FREE)
│   ├── 02-send-tokens.ts       # Send on all chains
│   ├── 03-swap.ts              # DEX swaps on 6 chains
│   ├── 04-merchant-checkout.ts # Payment flow
│   ├── 05-portfolio-tracker.ts # Balance dashboard (FREE)
│   ├── 06-defi-lending.ts      # Aave V3 + Lido staking
│   ├── 07-defi-liquidity.ts    # Uniswap V3 + ICP DEX LP
│   ├── 08-custom-contracts.ts  # Call any EVM contract
│   ├── 09-icrc2-tokens.ts      # ICRC-2 approve/transfer/allowance
│   ├── 10-strategy-engine.ts   # Automation rules from TypeScript
│   ├── 11-sign-and-broadcast.ts # Sign-only mode: full flow (SOL, EVM, XRP, SUI)
│   ├── DeveloperDashboard.tsx  # Developer account management (React)
│   └── README.md
├── backend/                    # Motoko — build autonomous canisters
│   ├── MeneseInterface.mo      # Full actor type (all endpoints)
│   ├── 01-BasicIntegration.mo  # Canister basics
│   ├── 02-AutomationBot.mo     # Timer-based DCA bot
│   ├── 03-MerchantPayments.mo  # Invoice + payment system
│   ├── 04-DeFiBot.mo           # Autonomous DeFi yield bot
│   ├── 05-StrategyBot.mo       # Strategy engine (TP/SL/DCA/Rebalance)
│   ├── WalletBot.mo            # Multi-chain wallet bot
│   ├── wallet-commands.py      # Python CLI wrapper
│   └── README.md
├── ai-agents/                 # Build AI agents that manage crypto
│   ├── SKILL.md                # Agent skill file (400+ functions, feed to your AI)
│   ├── WalletBot.mo            # Example wallet canister (Approach A)
│   ├── wallet_commands.py      # Python CLI wrapper (Approach B)
│   ├── README.md               # Setup guide + two integration approaches
│   └── references/             # API surface + automation patterns
├── scripts/                    # Internal validation tools
├── AI_CODING_GUIDE.md          # AI-assisted development tips
└── README.md                   # This file
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
| **Basic** | $20/mo | 100 | Agents & personal wallets |
| **Developer** | $45.50/mo | 1,000 | Side projects, small apps |
| **Pro** | $128.70/mo | 5,000 | Production apps |
| **Enterprise** | $323.70/mo | Unlimited | High-volume, multi-app |

All operations require an active subscription. No free tier for actions.

```bash
# Purchase a subscription (ICP payment)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai purchaseGatewayPackage '(variant { Developer }, "ICP")' --network ic

# Check your account
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyGatewayAccount '()' --network ic
```

## FREE Operations (no subscription needed)

- All address derivation (19 chains): `getMySolanaAddress`, `getMyEvmAddress`, `getAllAddresses`, etc.
- All balance queries: `getMySolanaBalance`, `getAllBalances`, etc.
- Swap quotes: `getRaydiumQuote`, `getICPDexQuote`, `getSuiSwapQuote`, etc.
- Developer registration: `registerDeveloperCanister`
- Gateway queries: `getMyGatewayAccount`, `getMyDeveloperAccount`

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

## AI-Assisted Development

See **[AI_CODING_GUIDE.md](./AI_CODING_GUIDE.md)** for how to use AI coding assistants
with MeneseSDK. Includes context file recommendations and prompt templates.
