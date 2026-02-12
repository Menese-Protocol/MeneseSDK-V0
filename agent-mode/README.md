# MeneseSDK — Agent Mode Examples

**Agent Mode** = your canister calls MeneseSDK directly via inter-canister calls.
The canister handles everything including HTTP outcalls (autonomous execution).

## Pricing (Agent Mode)

| Operation | Cost |
|-----------|------|
| Send/Transfer | $0.10 |
| DEX Swap | $0.15 |
| Cross-chain Bridge | $0.20 |
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

## When to use Agent Mode

- Your canister runs **autonomously** (timers, bots, automation)
- There is **no browser/client** present to call a relay
- You need **canister-to-canister** calls (backend integration)
- You're building a **DCA bot**, **rebalancer**, or **automated strategy**

## What You Can Automate

Agent mode is where MeneseSDK shines — **fully autonomous, on-chain execution** with no human in the loop.

### Built-in Strategy Engine
Create rules that MeneseSDK evaluates and executes automatically:

| Rule Type | What It Does |
|-----------|-------------|
| `#TakeProfit` | Sell when price exceeds target |
| `#StopLoss` | Sell when price drops below threshold |
| `#DCA` | Buy fixed amounts at regular intervals |
| `#LiquidityProvision` | Auto-LP based on APY/volatility |
| `#Rebalance` | Adjust concentrated LP ranges |
| `#APYMigration` | Move LP to higher-yield pools |
| `#VolatilityTrigger` | React to market volatility |
| `#Scheduled` | Time-based execution (weekly, monthly) |

### DeFi Endpoints (Canister-to-Chain)
Call these directly from your Motoko canister:

- **Aave**: `aaveSupplyEth`, `aaveWithdrawEth`, `aaveSupplyToken`, `aaveWithdrawToken`
- **Lido**: `stakeEthForStEth`, `wrapStEth`, `unwrapWstEth`
- **Uniswap V3 LP**: `addLiquidity`, `addLiquidityETH`, `removeLiquidity`, `removeLiquidityETH`
- **ICP DEXes**: `addICPLiquidity`, `removeICPLiquidity` (ICPSwap, KongSwap)
- **Any EVM Contract**: `callEvmContractWrite`, `callEvmContractRead`

### Build Your Own Bot
Deploy a canister with ICP timers that calls MeneseSDK on a schedule:

```motoko
// Timer-based bot: check balance every 5 minutes, swap when threshold exceeded
let timerId = Timer.recurringTimer<system>(#seconds(300), func () : async () {
  let bal = await menese.getMySolanaBalance();
  switch (bal) {
    case (#ok(lamports)) {
      if (lamports > 500_000_000) { // > 0.5 SOL
        let _ = await menese.swapRaydiumApiUser(SOL, USDC, lamports - 50_000_000, 150, true, false, null, null);
      };
    };
    case (#err(_)) {};
  };
});
```

See `02-AutomationBot.mo` for a complete working example.

**Need something custom?** Contact Menese Protocol for complex automation — multi-chain arbitrage, cross-chain yield farming, conditional bridging, or any DeFi workflow.

## How it works

```
Your Canister → MeneseSDK Canister (HTTP outcalls + signing) → Blockchain
```

1. Your canister calls MeneseSDK via inter-canister call
2. MeneseSDK fetches chain data via HTTP outcalls
3. MeneseSDK signs the transaction
4. MeneseSDK broadcasts to the target chain

## Files

| File | Description |
|------|-------------|
| `MeneseInterface.mo` | Full remote actor type with ALL endpoints |
| `01-BasicIntegration.mo` | Canister-to-canister basics (addresses, balances, sends) |
| `02-AutomationBot.mo` | Timer-based DCA/rebalance bot (autonomous) |
| `03-MerchantPayments.mo` | Invoice + payment verification + treasury sweep |
| `04-DeFiBot.mo` | Autonomous DeFi yield bot (Aave + Lido + LP rebalancing) |
| `WalletBot.mo` | Multi-chain wallet bot canister for ClawdBot |
| `wallet_commands.py` | Python CLI wrapper using dfx (for bots/scripts) |

## Quick Start (Motoko)

```motoko
import Menese "MeneseInterface";

actor MyApp {
  let menese = Menese.mainnet();

  // Get your canister's Solana address (FREE)
  public shared func getMyAddress() : async Text {
    let info = await menese.getMySolanaAddress();
    info.address;
  };

  // Send SOL ($0.10 in Agent Mode)
  public shared func sendSol(to : Text, lamports : Nat64) : async Result.Result<Text, Text> {
    await menese.sendSolTransaction(to, lamports);
  };
};
```

## Setup

1. Add `MeneseInterface.mo` to your project
2. Register your canister: `dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister '(principal "YOUR_CANISTER_ID", "My App")'`
3. Deposit credits: `dfx canister call urs2a-ziaaa-aaaad-aembq-cai depositGatewayCredits '("ICP", 100000000)'`
4. Start calling MeneseSDK functions

## Production Canister

| | |
|---|---|
| **Canister ID** | `urs2a-ziaaa-aaaad-aembq-cai` |
| **Candid UI** | https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai |
| **Local dev** | `dfx start` then `dfx deploy`, update canister ID in `MeneseInterface.mo` |

## Developer Packages

**Motoko** (add to `mops.toml`):
```toml
[dependencies]
base = "0.13.2"
```

You do NOT need MeneseSDK's internal dependencies (evm-txs, libsecp256k1, etc.).
Your canister only calls MeneseSDK via inter-canister calls.

## AI-Assisted Development (Caffeine)

Feed Caffeine these files for best results:
1. `MeneseInterface.mo` — full actor type definition (ALL endpoints)
2. Any relevant example `.mo` file from this directory

See **[../VIBE_CODING_GUIDE.md](../VIBE_CODING_GUIDE.md)** for prompt templates and tips.
