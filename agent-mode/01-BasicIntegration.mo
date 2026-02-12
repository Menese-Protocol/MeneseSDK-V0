/// 01-BasicIntegration.mo — Simple canister calling MeneseSDK
///
/// What this does:
///   1. Gets your canister's derived wallet addresses on every chain
///   2. Checks balances on SOL and ICP
///   3. Sends SOL, ICP, BTC, and ETH
///
/// Setup: Register your canister first (see README.md)
///
/// IMPORTANT: Field names must match the .did exactly:
///   EVM → evmAddress (not "address")
///   Bitcoin/Litecoin → bech32Address (returns AddressInfo record, not Text)
///   SUI → suiAddress, Cardano → bech32Address, TON → bounceable/nonBounceable
///
/// Tested: Feb 11, 2026 on mainnet

import Menese "MeneseInterface";
import Result "mo:base/Result";
import Debug "mo:base/Debug";
import Principal "mo:base/Principal";

actor BasicIntegration {

  let menese = Menese.mainnet();

  // ── Get key addresses (FREE) ────────────────────────────
  // Your canister gets its own unique address on every chain.
  // These are deterministic — same canister principal = same addresses.
  public shared func getMyAddresses() : async {
    solana : Text;
    evm : Text;
    bitcoin : Text;
    sui : Text;
    xrp : Text;
    cardano : Text;
    ton : Text;
  } {
    let sol = await menese.getMySolanaAddress();
    let evm = await menese.getMyEvmAddress();
    let btc = await menese.getMyBitcoinAddress();
    let sui = await menese.getMySuiAddress();
    let xrp = await menese.getMyXrpAddress();
    let cardano = await menese.getMyCardanoAddress();
    let ton = await menese.getMyTonAddress();
    {
      solana = sol.address;
      evm = evm.evmAddress;           // NOT "address" — field is "evmAddress"
      bitcoin = btc.bech32Address;     // NOT Text — returns AddressInfo record
      sui = sui.suiAddress;            // NOT "address" — field is "suiAddress"
      xrp = xrp.classicAddress;
      cardano = cardano.bech32Address; // NOT "address" — field is "bech32Address"
      ton = ton.nonBounceable;         // NOT "address" — use bounceable or nonBounceable
    };
  };

  // ── Get individual addresses (FREE) ──────────────────────
  public shared func getSolanaAddress() : async Text {
    let info = await menese.getMySolanaAddress();
    info.address;
  };

  public shared func getEvmAddress() : async Text {
    let info = await menese.getMyEvmAddress();
    info.evmAddress;  // Same address for ETH, ARB, BASE, POLY, BNB, OP
  };

  public shared func getBitcoinAddress() : async Text {
    let info = await menese.getMyBitcoinAddress();
    info.bech32Address;  // Returns AddressInfo record, not Text
  };

  // ── Check balances (FREE) ────────────────────────────────
  public shared func checkBalances() : async {
    solLamports : ?Nat64;
    icpE8s : ?Nat64;
  } {
    let solResult = await menese.getMySolanaBalance();
    let icpResult = await menese.getICPBalance();

    {
      solLamports = switch (solResult) { case (#ok(v)) ?v; case (#err(_)) null };
      icpE8s = switch (icpResult) { case (#ok(v)) ?v; case (#err(_)) null };
    };
  };

  // ── Send SOL ($0.05) ─────────────────────────────────────
  // Returns: Result<Text, Text> — ok = txHash
  public shared func sendSol(toAddress : Text, lamports : Nat64) : async Result.Result<Text, Text> {
    await menese.sendSolTransaction(toAddress, lamports);
  };

  // ── Send ICP ($0.05) ─────────────────────────────────────
  // Returns: Result<SendICPResult, Text>
  //   SendICPResult = { amount, blockHeight, fee, from, to }
  public shared func sendIcp(to : Principal, e8s : Nat64) : async Result.Result<Menese.SendICPResult, Text> {
    await menese.sendICP(to, e8s);
  };

  // ── Send ETH on any EVM chain ($0.05) ────────────────────
  // NOTE: Requires 5 params: to, valueWei, rpcEndpoint, chainId, quoteId?
  // You must provide your own RPC endpoint for the target chain.
  // Returns: Result<SendResultEvm, Text>
  //   SendResultEvm = { expectedTxHash, nonce, senderAddress, note }
  public shared func sendEvm(
    toAddress : Text,
    amountWei : Nat,
    rpcEndpoint : Text,    // Your RPC (e.g., "https://arb1.arbitrum.io/rpc")
    chainId : Nat,         // Chain ID (1=ETH, 42161=ARB, 8453=BASE, etc.)
  ) : async Result.Result<Menese.SendResultEvm, Text> {
    await menese.sendEvmNativeTokenAutonomous(toAddress, amountWei, rpcEndpoint, chainId, null);
  };

  // ── Send BTC ($0.05) ─────────────────────────────────────
  // Returns: Result<SendResultBtcLtc, Text>
  //   SendResultBtcLtc = { txid, amount, fee, senderAddress, recipientAddress, note }
  public shared func sendBtc(toAddress : Text, satoshis : Nat64) : async Result.Result<Menese.SendResultBtcLtc, Text> {
    await menese.sendBitcoin(toAddress, satoshis);
  };

  // ── Check billing status (FREE) ──────────────────────────
  public shared func getMyBillingStatus() : async {
    credits : Nat;
    tier : Menese.Tier;
    actionsUsed : Nat;
    actionsRemaining : Nat;
  } {
    let account = await menese.getMyGatewayAccount();
    {
      credits = account.creditsMicroUsd;
      tier = account.tier;
      actionsUsed = account.actionsUsed;
      actionsRemaining = account.actionsRemaining;
    };
  };
};
