# Automation & DeFi Patterns

Complete guide to building autonomous on-chain bots and DeFi yield strategies with MeneseSDK.

## Table of Contents

1. [Timer-Based Bots](#timer-based-bots)
2. [DCA Bot Pattern](#dca-bot-pattern)
3. [Strategy Engine Rules](#strategy-engine-rules)
4. [DeFi Yield Bot](#defi-yield-bot)
5. [Merchant Payment Automation](#merchant-payment-automation)
6. [Custom EVM Contract Calls](#custom-evm-contract-calls)

## Timer-Based Bots

ICP canisters can run recurring timers — no server, no cron, fully on-chain.

```motoko
import Timer "mo:base/Timer";
import Menese "MeneseInterface";

actor MyBot {
  let menese = Menese.mainnet();
  stable var timerId : ?Timer.TimerId = null;

  func botCycle() : async () {
    // Your logic here — runs every interval
    let bal = await menese.getMySolanaBalance();
    // ... process, swap, send, etc.
  };

  public shared func startBot() : async () {
    switch (timerId) {
      case (?_) {};  // Already running
      case null {
        let id = Timer.recurringTimer<system>(#seconds(300), botCycle);  // Every 5 min
        timerId := ?id;
      };
    };
  };

  public shared func stopBot() : async () {
    switch (timerId) {
      case (?id) { Timer.cancelTimer(id); timerId := null };
      case null {};
    };
  };

  // Manual trigger for testing
  public shared func runOnce() : async () { await botCycle() };
};
```

Common intervals:
- Balance monitoring: 5 minutes (`#seconds(300)`)
- DCA execution: 1 hour (`#seconds(3600)`)
- DeFi rebalancing: 6 hours (`#seconds(21600)`)
- Daily sweep: 24 hours (`#seconds(86400)`)

## DCA Bot Pattern

Auto-buy a token at regular intervals. Complete working example from `02-AutomationBot.mo`:

```motoko
let SOL_MINT = "So11111111111111111111111111111111111111112";
let USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
stable var swapThresholdLamports : Nat64 = 500_000_000; // 0.5 SOL
let SLIPPAGE_BPS : Nat64 = 150; // 1.5%

func botCycle() : async () {
  // 1. Check balance (FREE)
  let balance = switch (await menese.getMySolanaBalance()) {
    case (#ok(v)) v;
    case (#err(_)) return;
  };

  // 2. Skip if below threshold
  if (balance < swapThresholdLamports) return;

  // 3. Swap SOL → USDC on Raydium ($0.075)
  let swapAmount = balance - 50_000_000; // Keep 0.05 SOL for rent
  let result = await menese.swapRaydiumApiUser(
    SOL_MINT, USDC_MINT,
    swapAmount, SLIPPAGE_BPS,
    true,   // wrapSol (input is native SOL)
    false,  // unwrapSol (output is USDC)
    null, null  // auto-detect ATAs
  );
  // result is FLAT RaydiumApiSwapResult: { inputAmount, outputAmount, priceImpactPct, txSignature }
};
```

**Key points:**
- `wrapSol=true` when swapping FROM native SOL
- `unwrapSol=true` when swapping TO native SOL
- Always keep a reserve for rent/fees (0.05 SOL minimum)
- RaydiumApiSwapResult is FLAT — access fields directly, no `#ok/#err`

## Strategy Engine Rules

MeneseSDK has a built-in strategy engine. Create rules and MeneseSDK evaluates + executes them.

### Creating a DCA Rule

```motoko
let dcaRule : Menese.Rule = {
  id = 0;  // SDK assigns the actual ID
  ruleType = #DCA;
  status = #Active;
  chainType = #Solana;
  triggerPrice = 0;
  sizePct = 100;
  positionId = 0;
  createdAt = Time.now();
  dcaConfig = ?{
    amountPerInterval = 100_000_000;  // 0.1 SOL per interval
    currentInterval = 0;
    intervalSeconds = 3600;  // Every hour
    lastExecutedAt = 0;
    maxIntervals = 24;  // Run 24 times then stop
    targetToken = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";  // USDC
    totalSpent = 0;
  };
  lpConfig = null;
  scheduledConfig = null;
  apyMigrationConfig = null;
  volatilityConfig = null;
  swapAmountLamports = ?100_000_000;
  swapAmountWei = null;
};

let result = await menese.addStrategyRule(dcaRule);
```

### Creating a Stop-Loss Rule

```motoko
let stopLoss : Menese.Rule = {
  id = 0;
  ruleType = #StopLoss;
  status = #Active;
  chainType = #Solana;
  triggerPrice = 95_000_000;  // Trigger when price drops to this (in smallest unit)
  sizePct = 100;  // Sell 100% of position
  positionId = 0;
  createdAt = Time.now();
  dcaConfig = null;
  lpConfig = null;
  scheduledConfig = null;
  apyMigrationConfig = null;
  volatilityConfig = null;
  swapAmountLamports = null;
  swapAmountWei = null;
};
```

### Managing Rules

```motoko
// List all rules
let rules = await menese.getMyStrategyRules();

// Pause a rule
await menese.updateStrategyRuleStatus(ruleId, #Paused);

// Resume
await menese.updateStrategyRuleStatus(ruleId, #Active);

// Cancel
await menese.updateStrategyRuleStatus(ruleId, #Cancelled);

// Delete
await menese.deleteStrategyRule(ruleId);

// View execution history
let logs = await menese.getStrategyLogs();
// ExecutionLog = { action, ?error, executedAt, result, ruleId, success }

// Initialize automation (call once per principal)
let msg = await menese.initAutomation();
```

### All Rule Types

| Type | Required Config | Use Case |
|------|----------------|----------|
| `#DCA` | `dcaConfig` with interval + amount | Periodic purchases |
| `#StopLoss` | `triggerPrice` + `sizePct` | Sell on price drop |
| `#TakeProfit` | `triggerPrice` + `sizePct` | Sell on price rise |
| `#Rebalance` | LP range params | Adjust concentrated LP |
| `#Scheduled` | `scheduledConfig` | Time-based actions |
| `#APYMigration` | `apyMigrationConfig` | Chase higher yields |
| `#LiquidityProvision` | `lpConfig` | Auto LP entry/exit |
| `#VolatilityTrigger` | `volatilityConfig` | React to vol spikes |

## DeFi Yield Bot

Autonomous allocation across Aave, Lido, and Uniswap V3. From `04-DeFiBot.mo`:

### Reading Positions (FREE)

```motoko
let ethRpc = "https://eth.llamarpc.com";
let evmAddr = (await menese.getMyEvmAddress()).evmAddress;

// ETH balance
let ethBal = switch (await menese.getMyEvmBalance(ethRpc)) {
  case (#ok(v)) v; case (#err(_)) 0;
};

// Aave aWETH balance
let aaveBal = switch (await menese.getAWethBalance(evmAddr, ethRpc)) {
  case (#ok(v)) v; case (#err(_)) 0;
};

// Lido stETH balance
let stEthBal = switch (await menese.getStEthBalance(evmAddr, ethRpc)) {
  case (#ok(v)) v; case (#err(_)) 0;
};

// Lido wstETH balance
let wstEthBal = switch (await menese.getWstEthBalance(evmAddr, ethRpc)) {
  case (#ok(v)) v; case (#err(_)) 0;
};
```

### Aave V3 — Lending Yield (~2-3% APY)

```motoko
// Supply ETH → receive aWETH
let supplyResult = await menese.aaveSupplyEth(amountWei, ethRpc, null);
// Result<SupplyEthResult, Text> — ok: { txHash, aTokenAddress, suppliedAmount, senderAddress, note }

// Withdraw ETH from Aave
let withdrawResult = await menese.aaveWithdrawEth(amountWei, ethRpc, null);
// Result<WithdrawEthResult, Text> — ok: { txHash, withdrawnAmount, senderAddress, note }

// Supply/withdraw ERC-20 tokens
await menese.aaveSupplyToken(tokenAddress, amount, ethRpc, null);
await menese.aaveWithdrawToken(tokenAddress, amount, ethRpc, null);
```

### Lido — ETH Staking (~3-4% APY)

```motoko
// Stake ETH → receive stETH
let stakeResult = await menese.stakeEthForStEth(amountWei, ethRpc, null);
// Result<StakeResult, Text>

// Wrap stETH → wstETH (better DeFi composability)
let wrapResult = await menese.wrapStEth(amountStEth, ethRpc, null);
// Result<WrapResult, Text>

// Unwrap wstETH → stETH
let unwrapResult = await menese.unwrapWstEth(amountWstEth, ethRpc, null);
// Result<UnwrapResult, Text>
```

### Uniswap V3 — LP Management

```motoko
// Add ETH + token liquidity
let addResult = await menese.addLiquidityETH(
  "USDC",        // tokenSymbol
  usdcAmount,    // amountTokenDesired
  ethAmount,     // amountETHDesired
  300,           // slippageBps (3%)
  ethRpc,
  null           // quoteId
);
// ok: { txHash, senderAddress, nonce, tokenAddress, amountTokenDesired, amountETHDesired, amountTokenMin, amountETHMin, ?approvalTxHash, note }

// Remove ETH + token liquidity
let removeResult = await menese.removeLiquidityETH(
  "USDC",
  lpTokenAmount,
  300,
  false,  // useFeeOnTransfer
  ethRpc,
  null
);
// ok: { txHash, senderAddress, nonce, tokenAddress, lpTokensBurned, minTokenOut, minETHOut, ?approvalTxHash, note }

// Token-token liquidity (no ETH)
await menese.addLiquidity("USDC", "WBTC", amountA, amountB, 300, ethRpc, null);
await menese.removeLiquidity("USDC", "WBTC", lpAmount, 300, ethRpc, null);

// Read pool data (FREE)
let reserves = await menese.getPoolReserves("USDC", "WETH", ethRpc);
let pair = await menese.getPairAddress("USDC", "WETH", ethRpc);
```

### Automated Rebalance Cycle

```motoko
// Allocation targets (basis points, total = 10000)
let aaveAlloc = 4000;  // 40% to Aave
let lidoAlloc = 3000;  // 30% to Lido
let lpAlloc = 3000;    // 30% to Uniswap LP
let MIN_RESERVE = 50_000_000_000_000_000; // 0.05 ETH for gas

func rebalanceCycle() : async () {
  let positions = await getPositions();
  let total = positions.ethBalance + positions.aaveBalance + positions.stEthBalance + positions.wstEthBalance;

  if (positions.ethBalance <= MIN_RESERVE) return;
  let deployable = positions.ethBalance - MIN_RESERVE;

  // Deploy to Aave if under-allocated
  let aaveTarget = (deployable * aaveAlloc) / 10000;
  if (aaveTarget > positions.aaveBalance) {
    let toSupply = aaveTarget - positions.aaveBalance;
    if (toSupply > 10_000_000_000_000_000) {  // > 0.01 ETH minimum
      ignore await menese.aaveSupplyEth(toSupply, ethRpc, null);
    };
  };

  // Deploy to Lido if under-allocated
  let lidoTarget = (deployable * lidoAlloc) / 10000;
  let lidoCurrent = positions.stEthBalance + positions.wstEthBalance;
  if (lidoTarget > lidoCurrent) {
    let toStake = lidoTarget - lidoCurrent;
    if (toStake > 10_000_000_000_000_000) {
      ignore await menese.stakeEthForStEth(toStake, ethRpc, null);
      ignore await menese.wrapStEth(toStake, ethRpc, null);  // Wrap for composability
    };
  };
};
```

## Merchant Payment Automation

Accept crypto payments with invoice tracking and treasury sweep. From `03-MerchantPayments.mo`:

```motoko
// 1. Create invoice — returns payment address
let invoice = await createInvoice(#SOL, 500_000_000, "customer123", "Widget purchase");
// { invoiceId = "INV-1"; paymentAddress = "5xK2..." }

// 2. Check if payment arrived (FREE — balance check)
let status = await checkPayment("INV-1");
// { status = "PAID" | "Pending — balance: 0"; balance = 500000000 }

// 3. Sweep paid funds to treasury ($0.05)
let sweep = await sweepToTreasury("INV-1");
// #ok("TX: 4vJ7k...")
```

**Pattern**: Address generation is FREE + deterministic (cache after first call). Balance checks are FREE. Only the sweep send costs $0.05.

## Custom EVM Contract Calls

Call any EVM smart contract — read for FREE, write for $0.10.

### Read (FREE) — e.g., Chainlink Price Feed

```motoko
// latestRoundData() selector: 0xfeaf968c
let result = await menese.callEvmContractRead(
  "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",  // ETH/USD feed
  "feaf968c",   // 4-byte selector (no 0x prefix)
  [],            // no additional args
  ethRpc
);
// Result<Text, Text> — ok = hex-encoded response data
```

### Write ($0.10) — e.g., Custom DEX

```motoko
let result = await menese.callEvmContractWrite(
  contractAddress,
  functionSelector,  // 4-byte hex (no 0x)
  ["arg1hex", "arg2hex"],  // ABI-encoded args
  ethRpc,
  1,     // chainId
  0,     // value (wei to send with call)
  null   // quoteId
);
// Result<SendResultEvm, Text>
```

### Selector Reference

Compute 4-byte selectors with `keccak256("functionName(type1,type2)")[:4]`. Common ones:
- `latestRoundData()` → `feaf968c`
- `balanceOf(address)` → `70a08231`
- `transfer(address,uint256)` → `a9059cbb`
- `approve(address,uint256)` → `095ea7b3`
- `totalSupply()` → `18160ddd`
