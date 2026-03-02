/// 05-StrategyBot.mo — Autonomous strategy engine usage
///
/// Demonstrates the built-in strategy engine for automated trading:
///   - Create TP/SL/DCA/Rebalance rules
///   - Monitor and manage rule lifecycle
///   - Check execution logs
///   - Combine with timers for fully autonomous operation
///
/// The strategy engine evaluates rules automatically — you don't need
/// to poll prices yourself. Just create rules and activate them.
///
/// Subscription required: 1 action per rule creation, 1 action per execution.

import Menese "MeneseInterface";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Time "mo:base/Time";
import Timer "mo:base/Timer";
import Array "mo:base/Array";

actor StrategyBot {

  let menese = Menese.mainnet();

  // ── Create a Take Profit rule ──────────────────────────────
  // Sell SOL when price exceeds target
  public shared func createTakeProfit(
    targetPriceUsd : Nat64, // e.g., 250_000_000 = $250
    solLamports : Nat64,    // e.g., 500_000_000 = 0.5 SOL
  ) : async Result.Result<Nat, Text> {
    let rule : Menese.Rule = {
      id = 0; // auto-assigned
      positionId = 0;
      ruleType = #TakeProfit;
      triggerPrice = targetPriceUsd;
      sizePct = 100;
      swapAmountLamports = ?solLamports;
      swapAmountWei = null;
      chainType = #Solana;
      status = #Draft;
      createdAt = Time.now();
      dcaConfig = null;
      lpConfig = null;
      scheduledConfig = null;
      apyMigrationConfig = null;
      volatilityConfig = null;
    };
    await menese.addStrategyRule(rule);
  };

  // ── Create a Stop Loss rule ────────────────────────────────
  // Sell ETH when price drops below threshold
  public shared func createStopLoss(
    floorPriceUsd : Nat64, // e.g., 1_500_000_000 = $1500
    ethWei : Nat,          // e.g., 500_000_000_000_000_000 = 0.5 ETH
  ) : async Result.Result<Nat, Text> {
    let rule : Menese.Rule = {
      id = 0;
      positionId = 0;
      ruleType = #StopLoss;
      triggerPrice = floorPriceUsd;
      sizePct = 100;
      swapAmountLamports = null;
      swapAmountWei = ?ethWei;
      chainType = #Evm;
      status = #Draft;
      createdAt = Time.now();
      dcaConfig = null;
      lpConfig = null;
      scheduledConfig = null;
      apyMigrationConfig = null;
      volatilityConfig = null;
    };
    await menese.addStrategyRule(rule);
  };

  // ── Create a DCA rule ──────────────────────────────────────
  // Buy SOL at regular intervals
  public shared func createDCA(
    amountPerBuy : Nat,       // lamports per buy
    intervalSecs : Nat,       // seconds between buys
    maxBuys : Nat,            // total number of buys
  ) : async Result.Result<Nat, Text> {
    let rule : Menese.Rule = {
      id = 0;
      positionId = 0;
      ruleType = #DCA;
      triggerPrice = 0; // DCA doesn't use price trigger
      sizePct = 0;
      swapAmountLamports = null;
      swapAmountWei = null;
      chainType = #Solana;
      status = #Draft;
      createdAt = Time.now();
      dcaConfig = ?{
        amountPerBuy = amountPerBuy;
        executedBuys = 0;
        intervalSeconds = intervalSecs;
        nextExecutionTime = 0;
        tokenIn = "USDC";
        tokenOut = "SOL";
        totalBuys = maxBuys;
      };
      lpConfig = null;
      scheduledConfig = null;
      apyMigrationConfig = null;
      volatilityConfig = null;
    };
    await menese.addStrategyRule(rule);
  };

  // ── Activate a rule ────────────────────────────────────────
  // Rules start as #Draft. Must be set to #Active to execute.
  public shared func activateRule(ruleId : Nat) : async Result.Result<(), Text> {
    await menese.updateStrategyRuleStatus(ruleId, #Active);
  };

  // ── Pause a rule ───────────────────────────────────────────
  public shared func pauseRule(ruleId : Nat) : async Result.Result<(), Text> {
    await menese.updateStrategyRuleStatus(ruleId, #Paused);
  };

  // ── Delete a rule ──────────────────────────────────────────
  public shared func deleteRule(ruleId : Nat) : async Result.Result<(), Text> {
    await menese.deleteStrategyRule(ruleId);
  };

  // ── List all rules ─────────────────────────────────────────
  public shared func getMyRules() : async [Menese.Rule] {
    await menese.getMyStrategyRules();
  };

  // ── Get execution history ──────────────────────────────────
  public shared func getExecutionLogs() : async [Menese.ExecutionLog] {
    await menese.getStrategyLogs();
  };

  // ── Quick setup: TP + SL bracket ───────────────────────────
  // Create both take profit and stop loss in one call
  public shared func createBracket(
    tpPriceUsd : Nat64,   // take profit trigger
    slPriceUsd : Nat64,   // stop loss trigger
    solLamports : Nat64,  // amount for both
  ) : async { tp : Result.Result<Nat, Text>; sl : Result.Result<Nat, Text> } {
    let tp = await createTakeProfit(tpPriceUsd, solLamports);
    let sl = await createStopLoss(slPriceUsd, 0); // EVM wei not used for SOL

    // Auto-activate both if creation succeeded
    switch (tp) { case (#ok(id)) { let _ = await activateRule(id) }; case _ {} };
    switch (sl) { case (#ok(id)) { let _ = await activateRule(id) }; case _ {} };

    { tp; sl };
  };

  // ── Monitor: periodic rule status check ────────────────────
  // Use ICP timers to periodically check and log rule status
  var monitorTimerId : ?Timer.TimerId = null;

  public shared func startMonitor() : async Text {
    switch (monitorTimerId) {
      case (?_) { "Monitor already running" };
      case null {
        let id = Timer.recurringTimer<system>(#seconds(600), func () : async () {
          let rules = await menese.getMyStrategyRules();
          let active = Array.filter(rules, func (r : Menese.Rule) : Bool {
            r.status == #Active or r.status == #Executing;
          });
          Debug.print("Strategy monitor: " # debug_show(active.size()) # " active rules");
        });
        monitorTimerId := ?id;
        "Monitor started (checks every 10 minutes)";
      };
    };
  };

  public shared func stopMonitor() : async Text {
    switch (monitorTimerId) {
      case (?id) { Timer.cancelTimer(id); monitorTimerId := null; "Monitor stopped" };
      case null { "No monitor running" };
    };
  };
};
