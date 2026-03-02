// 11-strategy-engine.ts — Create and manage automation rules from TypeScript
//
// The MeneseSDK strategy engine lets you define rules that execute automatically:
//   - TakeProfit / StopLoss — sell when price crosses a threshold
//   - DCA — buy fixed amounts at regular intervals
//   - Rebalance — adjust LP ranges based on conditions
//   - VolatilityTrigger — react to market volatility
//   - Scheduled — time-based execution (weekly, monthly)
//   - APYMigration — move LP to higher-yield pools
//   - LiquidityProvision — auto-LP based on conditions
//
// Strategy creation costs 1 action. Strategy execution costs 1 action per triggered action.
//
// NOTE: For fully autonomous execution (timer-based, no frontend),
//       use backend/05-StrategyBot.mo instead.

import { createMeneseActor } from "./sdk-setup";

async function main() {
  const actor = await createMeneseActor();

  // ── 1. Create a Take Profit rule ───────────────────────────
  // Sell 100% of SOL position when price exceeds $250
  const takeProfitRule = {
    id: 0, // auto-assigned by canister
    positionId: 0,
    ruleType: { TakeProfit: null },
    triggerPrice: BigInt(250_000_000), // $250 in micro-USD
    sizePct: 100, // sell 100%
    swapAmountLamports: [BigInt(500_000_000)], // 0.5 SOL
    swapAmountWei: [],
    chainType: { Solana: null },
    status: { Draft: null },
    createdAt: BigInt(Date.now() * 1_000_000), // nanoseconds
    dcaConfig: [],
    lpConfig: [],
    scheduledConfig: [],
    apyMigrationConfig: [],
    volatilityConfig: [],
  };

  const tpResult = await actor.addStrategyRule(takeProfitRule);
  if ("ok" in tpResult) {
    console.log(`Take Profit rule created, ID: ${tpResult.ok}`);
  } else {
    console.error(`Failed: ${tpResult.err}`);
  }

  // ── 2. Create a DCA rule ───────────────────────────────────
  // Buy SOL every 24 hours with 0.1 SOL worth of USDC, max 30 buys
  const dcaRule = {
    id: 0,
    positionId: 0,
    ruleType: { DCA: null },
    triggerPrice: BigInt(0), // DCA doesn't use price trigger
    sizePct: 0,
    swapAmountLamports: [BigInt(100_000_000)], // 0.1 SOL equivalent
    swapAmountWei: [],
    chainType: { Solana: null },
    status: { Draft: null },
    createdAt: BigInt(Date.now() * 1_000_000),
    dcaConfig: [{
      amountPerBuy: BigInt(100_000_000), // 0.1 SOL
      executedBuys: BigInt(0),
      intervalSeconds: BigInt(86400), // 24 hours
      nextExecutionTime: BigInt(0),
      totalBuys: BigInt(30),
      tokenIn: "USDC",
      tokenOut: "SOL",
    }],
    lpConfig: [],
    scheduledConfig: [],
    apyMigrationConfig: [],
    volatilityConfig: [],
  };

  const dcaResult = await actor.addStrategyRule(dcaRule);
  if ("ok" in dcaResult) {
    console.log(`DCA rule created, ID: ${dcaResult.ok}`);
  }

  // ── 3. Create a Stop Loss rule (EVM) ───────────────────────
  // Sell ETH if price drops below $1500
  const stopLossRule = {
    id: 0,
    positionId: 0,
    ruleType: { StopLoss: null },
    triggerPrice: BigInt(1_500_000_000), // $1500 in micro-USD
    sizePct: 100,
    swapAmountLamports: [],
    swapAmountWei: [BigInt("500000000000000000")], // 0.5 ETH in wei
    chainType: { Evm: null },
    status: { Draft: null },
    createdAt: BigInt(Date.now() * 1_000_000),
    dcaConfig: [],
    lpConfig: [],
    scheduledConfig: [],
    apyMigrationConfig: [],
    volatilityConfig: [],
  };

  const slResult = await actor.addStrategyRule(stopLossRule);
  if ("ok" in slResult) {
    console.log(`Stop Loss rule created, ID: ${slResult.ok}`);
  }

  // ── 4. List all your rules ─────────────────────────────────
  const rules = await actor.getMyStrategyRules();
  console.log(`\nYour strategy rules (${rules.length}):`);
  for (const rule of rules) {
    const ruleType = Object.keys(rule.ruleType)[0];
    const status = Object.keys(rule.status)[0];
    const chain = Object.keys(rule.chainType)[0];
    console.log(`  [${rule.id}] ${ruleType} on ${chain} — ${status} (trigger: $${Number(rule.triggerPrice) / 1_000_000})`);
  }

  // ── 5. Activate a rule ─────────────────────────────────────
  // Rules start as #Draft. Set to #Active to enable execution.
  if (rules.length > 0) {
    const ruleId = Number(rules[0].id);
    const activateResult = await actor.updateStrategyRuleStatus(ruleId, { Active: null });
    if ("ok" in activateResult) {
      console.log(`Rule ${ruleId} activated!`);
    }
  }

  // ── 6. Pause a rule ────────────────────────────────────────
  if (rules.length > 0) {
    const ruleId = Number(rules[0].id);
    const pauseResult = await actor.updateStrategyRuleStatus(ruleId, { Paused: null });
    if ("ok" in pauseResult) {
      console.log(`Rule ${ruleId} paused.`);
    }
  }

  // ── 7. Delete a rule ───────────────────────────────────────
  if (rules.length > 1) {
    const ruleId = Number(rules[1].id);
    const deleteResult = await actor.deleteStrategyRule(ruleId);
    if ("ok" in deleteResult) {
      console.log(`Rule ${ruleId} deleted.`);
    }
  }

  // ── 8. Check execution logs ────────────────────────────────
  const logs = await actor.getStrategyLogs();
  console.log(`\nExecution logs (${logs.length}):`);
  for (const log of logs.slice(0, 10)) { // show latest 10
    const stage = Object.keys(log.stage)[0];
    const status = stage === "COMPLETED" ? "OK" : stage;
    console.log(`  [${status}] Rule ${log.rule_id}: ${stage} — tx: ${log.tx_id.length > 0 ? log.tx_id[0] : "n/a"}`);
    if (log.error.length > 0) {
      console.log(`    Error: ${log.error[0]}`);
    }
    console.log(`    Timestamp: ${log.ts}`);
  }
}

main().catch(console.error);
