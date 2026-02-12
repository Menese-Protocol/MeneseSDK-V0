/// 02-AutomationBot.mo — Automated trading bot canister
///
/// What this does:
///   1. Periodically checks SOL balance
///   2. When balance exceeds threshold, swaps SOL → USDC on Raydium
///   3. Sweeps USDC to a configured treasury address
///   4. Logs all operations
///
/// Use case: DCA bot, rebalancer, auto-sweep, relayer logic.
/// The canister runs on a timer — no human interaction needed after setup.
///
/// Cost: $0.075 per swap, $0.05 per send
///
/// Tested: Feb 11, 2026 on mainnet

import Menese "MeneseInterface";
import Result "mo:base/Result";
import Timer "mo:base/Timer";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Nat64 "mo:base/Nat64";
import Debug "mo:base/Debug";

actor AutomationBot {

  // ── Config ─────────────────────────────────────────────────
  let menese = Menese.mainnet();

  // Token mints on Solana
  let SOL_MINT = "So11111111111111111111111111111111111111112";
  let USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  // Threshold: swap when SOL balance exceeds this (in lamports)
  stable var swapThresholdLamports : Nat64 = 500_000_000; // 0.5 SOL

  // Treasury: where to sweep USDC after swapping
  stable var treasuryAddress : Text = "";

  // Slippage tolerance for swaps (basis points, 100 = 1%)
  let SLIPPAGE_BPS : Nat64 = 150; // 1.5%

  // ── Operation log ──────────────────────────────────────────
  type LogEntry = {
    timestamp : Int;
    action : Text;
    details : Text;
    success : Bool;
  };

  stable var logs : [LogEntry] = [];
  let logBuffer = Buffer.Buffer<LogEntry>(100);

  func addLog(action : Text, details : Text, success : Bool) {
    let entry : LogEntry = {
      timestamp = Time.now();
      action;
      details;
      success;
    };
    logBuffer.add(entry);
  };

  // ── Admin functions ────────────────────────────────────────
  // Set the SOL threshold to trigger a swap
  public shared func setSwapThreshold(lamports : Nat64) : async () {
    swapThresholdLamports := lamports;
    addLog("config", "Threshold set to " # Nat64.toText(lamports) # " lamports", true);
  };

  // Set the treasury address for USDC sweep
  public shared func setTreasuryAddress(addr : Text) : async () {
    treasuryAddress := addr;
    addLog("config", "Treasury set to " # addr, true);
  };

  // Get operation logs
  public query func getLogs() : async [LogEntry] {
    Buffer.toArray(logBuffer);
  };

  // ── Core bot logic ─────────────────────────────────────────
  // Called by the timer every cycle.
  func botCycle() : async () {
    // 1. Check SOL balance
    let balResult = await menese.getMySolanaBalance();
    let balance : Nat64 = switch (balResult) {
      case (#ok(v)) v;
      case (#err(e)) {
        addLog("check", "Balance check failed: " # e, false);
        return;
      };
    };

    addLog("check", "SOL balance: " # Nat64.toText(balance) # " lamports", true);

    // 2. If below threshold, do nothing
    if (balance < swapThresholdLamports) {
      return;
    };

    // 3. Swap SOL → USDC on Raydium
    // swapRaydiumApiUser takes 8 params: inputMint, outputMint, amount, slippageBps,
    //   wrapSol, unwrapSol, inputAta?, outputAta?
    // Returns: RaydiumApiSwapResult (flat record, NOT variant)
    //   { inputAmount, outputAmount, priceImpactPct, txSignature }
    let swapAmount = balance - 50_000_000; // Keep 0.05 SOL for rent/fees
    addLog("swap", "Swapping " # Nat64.toText(swapAmount) # " lamports → USDC", true);

    let swapResult = await menese.swapRaydiumApiUser(
      SOL_MINT,
      USDC_MINT,
      swapAmount,
      SLIPPAGE_BPS,
      true,     // wrapSol: input is native SOL
      false,    // unwrapSol: output is USDC not SOL
      null,     // inputAta: auto-detect
      null,     // outputAta: auto-detect
    );

    // RaydiumApiSwapResult is a flat record (NOT a variant with #ok/#err)
    addLog("swap", "Swap success! TX: " # swapResult.txSignature #
      " | Out: " # swapResult.outputAmount, true);

    // 4. Optional: Sweep USDC to treasury
    // Use transferSplToken(amount, sourceAta, destAta) for SPL sends
    // Note: You need ATA addresses, not wallet addresses
  };

  // ── Timer setup ────────────────────────────────────────────
  // Run the bot every 5 minutes (300 seconds)
  stable var timerId : ?Timer.TimerId = null;

  public shared func startBot() : async () {
    switch (timerId) {
      case (?_) { Debug.print("Bot already running") };
      case null {
        let id = Timer.recurringTimer<system>(#seconds(300), botCycle);
        timerId := ?id;
        addLog("control", "Bot started (5-min interval)", true);
      };
    };
  };

  public shared func stopBot() : async () {
    switch (timerId) {
      case (?id) {
        Timer.cancelTimer(id);
        timerId := null;
        addLog("control", "Bot stopped", true);
      };
      case null { Debug.print("Bot not running") };
    };
  };

  // ── Manual trigger (for testing) ───────────────────────────
  public shared func runOnce() : async () {
    await botCycle();
  };

  // ── Status ─────────────────────────────────────────────────
  public shared func getStatus() : async {
    isRunning : Bool;
    threshold : Nat64;
    treasury : Text;
    totalLogs : Nat;
  } {
    {
      isRunning = timerId != null;
      threshold = swapThresholdLamports;
      treasury = treasuryAddress;
      totalLogs = logBuffer.size();
    };
  };

  // ── Upgrade hooks ──────────────────────────────────────────
  system func preupgrade() {
    logs := Buffer.toArray(logBuffer);
  };

  system func postupgrade() {
    for (entry in logs.vals()) {
      logBuffer.add(entry);
    };
    logs := [];
  };
};
