/// WalletBot.mo — ClawdBot Wallet Canister
///
/// A simple ICP canister that wraps MeneseSDK for ClawdBot integration.
/// Deploy this canister, register it with MeneseSDK, then point ClawdBot
/// at it for multi-chain wallet operations.
///
/// Functions are designed for easy calling via dfx from ClawdBot:
///   dfx canister call WalletBot getAddresses --network ic
///   dfx canister call WalletBot checkBalance '("sol")' --network ic
///   dfx canister call WalletBot sendTokens '("sol", 500000000, "5xK2...")' --network ic
///
/// Tested: Feb 11, 2026 on mainnet

import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import Iter "mo:base/Iter";

actor WalletBot {

  // ── MeneseSDK remote actor type ────────────────────────────
  // Minimal interface — only the functions ClawdBot needs.

  type MeneseSDK = actor {
    getMySolanaAddress : shared () -> async { address : Text; publicKeyHex : Text; publicKeyBytes : [Nat8] };
    getMyEvmAddress : shared () -> async { address : Text; publicKeyHex : Text };
    getMyBitcoinAddress : shared () -> async Text;
    getMySuiAddress : shared () -> async { address : Text; publicKeyHex : Text };
    getMyXrpAddress : shared () -> async { classicAddress : Text; xAddress : Text };
    getMyTonAddress : shared () -> async { address : Text; rawAddress : Text };
    getMyCardanoAddress : shared () -> async { address : Text };
    getMyAptosAddress : shared () -> async { address : Text };
    getMyNearAddress : shared () -> async { accountId : Text };
    getTronAddress : shared () -> async { base58 : Text; hex : Text };
    getMyLitecoinAddress : shared () -> async Text;
    getMyCloakAddress : shared () -> async { base58Address : Text };
    getMyThorAddress : shared () -> async { address : Text };

    getMySolanaBalance : shared () -> async Result.Result<Nat64, Text>;
    getMyEvmBalance : shared (Text) -> async Result.Result<Nat, Text>;
    getICPBalance : shared () -> async Result.Result<Nat64, Text>;
    getMyXrpBalance : shared () -> async Result.Result<Text, Text>;
    getMySuiBalance : shared () -> async Nat64;

    sendSolTransaction : shared (Text, Nat64) -> async Result.Result<Text, Text>;
    sendICP : shared (Principal, Nat64) -> async Result.Result<Text, Text>;
    sendBitcoin : shared (Text, Nat64) -> async Result.Result<Text, Text>;
    sendEvmNativeTokenAutonomous : shared (Text, Text, Text, ?Text) -> async Result.Result<{ txHash : Text }, Text>;
    sendXrpAutonomous : shared (Text, Text, ?Nat32) -> async Result.Result<{ txHash : Text }, Text>;
    sendSui : shared (Text, Nat64) -> async Result.Result<{ txHash : Text }, Text>;
    sendTonSimple : shared (Text, Nat64) -> async Result.Result<Text, Text>;

    swapRaydiumApiUser : shared (Text, Text, Nat64, Nat64) -> async Result.Result<{ txHash : Text }, Text>;

    getMyGatewayAccount : shared () -> async {
      creditsMicroUsd : Nat;
      tier : { #Free; #Developer; #Pro; #Enterprise };
      actionsRemaining : Nat;
      subscriptionExpiry : ?Int;
      actionsUsed : Nat;
      totalDepositedMicroUsd : Nat;
      createdAt : Int;
    };
  };

  let menese : MeneseSDK = actor ("urs2a-ziaaa-aaaad-aembq-cai");

  // ── Address cache ──────────────────────────────────────────
  // Addresses are deterministic — cache them after first fetch.
  stable var cachedAddresses : ?AddressBook = null;

  type AddressBook = {
    solana : Text;
    evm : Text;
    bitcoin : Text;
    sui : Text;
    xrp : Text;
    ton : Text;
    cardano : Text;
    aptos : Text;
    near : Text;
    tron : Text;
    litecoin : Text;
    cloak : Text;
    thorchain : Text;
  };

  // ── Get all addresses (FREE, cached) ──────────────────────
  public shared func getAddresses() : async AddressBook {
    switch (cachedAddresses) {
      case (?addrs) { addrs };
      case null {
        let sol = await menese.getMySolanaAddress();
        let evm = await menese.getMyEvmAddress();
        let btc = await menese.getMyBitcoinAddress();
        let sui = await menese.getMySuiAddress();
        let xrp = await menese.getMyXrpAddress();
        let ton = await menese.getMyTonAddress();
        let ada = await menese.getMyCardanoAddress();
        let apt = await menese.getMyAptosAddress();
        let near = await menese.getMyNearAddress();
        let tron = await menese.getTronAddress();
        let ltc = await menese.getMyLitecoinAddress();
        let cloak = await menese.getMyCloakAddress();
        let thor = await menese.getMyThorAddress();

        let addrs : AddressBook = {
          solana = sol.address;
          evm = evm.address;
          bitcoin = btc;
          sui = sui.address;
          xrp = xrp.classicAddress;
          ton = ton.address;
          cardano = ada.address;
          aptos = apt.address;
          near = near.accountId;
          tron = tron.base58;
          litecoin = ltc;
          cloak = cloak.base58Address;
          thorchain = thor.address;
        };
        cachedAddresses := ?addrs;
        addrs;
      };
    };
  };

  // ── Check balance (FREE) ──────────────────────────────────
  // Pass chain name: "sol", "icp", "eth", "xrp", "sui"
  // For EVM, pass: "ethereum", "arbitrum", "base", "polygon", "bsc", "optimism"
  //
  // TIP: For production, query balances directly from chain RPCs
  // for faster response. MeneseSDK balance queries go through
  // shared RPC endpoints. Use your own Helius/Alchemy/Infura RPC
  // and query the address you got from getAddresses().
  public shared func checkBalance(chain : Text) : async Result.Result<Text, Text> {
    switch (chain) {
      case "sol" {
        switch (await menese.getMySolanaBalance()) {
          case (#ok(lamports)) {
            let sol = Nat64.toText(lamports / 1_000_000_000);
            let remainder = Nat64.toText(lamports % 1_000_000_000);
            #ok(sol # "." # remainder # " SOL (" # Nat64.toText(lamports) # " lamports)");
          };
          case (#err(e)) #err(e);
        };
      };
      case "icp" {
        switch (await menese.getICPBalance()) {
          case (#ok(e8s)) {
            let icp = Nat64.toText(e8s / 100_000_000);
            let remainder = Nat64.toText(e8s % 100_000_000);
            #ok(icp # "." # remainder # " ICP (" # Nat64.toText(e8s) # " e8s)");
          };
          case (#err(e)) #err(e);
        };
      };
      case "xrp" {
        await menese.getMyXrpBalance();
      };
      case "sui" {
        let mist = await menese.getMySuiBalance();
        let sui = Nat64.toText(mist / 1_000_000_000);
        #ok(sui # " SUI (" # Nat64.toText(mist) # " mist)");
      };
      // EVM chains: pass the chain name directly
      case ("ethereum" or "arbitrum" or "base" or "polygon" or "bsc" or "optimism") {
        switch (await menese.getMyEvmBalance(chain)) {
          case (#ok(_nat)) #ok("Balance retrieved (see raw output)");
          case (#err(e)) #err(e);
        };
      };
      case _ {
        #err("Unknown chain: " # chain # ". Use: sol, icp, xrp, sui, ethereum, arbitrum, base, polygon, bsc, optimism");
      };
    };
  };

  // ── Send tokens ($0.05 each) ──────────────────────────────
  // chain: "sol", "icp", "btc", "eth", "arb", "base", "xrp", "sui", "ton"
  // amount: in smallest unit (lamports, e8s, satoshis, wei, drops, mist, nanotons)
  // to: recipient address (or principal for ICP)
  public shared func sendTokens(chain : Text, amount : Nat64, to : Text) : async Result.Result<Text, Text> {
    switch (chain) {
      case "sol" {
        await menese.sendSolTransaction(to, amount);
      };
      case "icp" {
        await menese.sendICP(Principal.fromText(to), amount);
      };
      case "btc" {
        await menese.sendBitcoin(to, amount);
      };
      case ("eth" or "ethereum") {
        switch (await menese.sendEvmNativeTokenAutonomous("ethereum", to, Nat64.toText(amount), null)) {
          case (#ok(r)) #ok(r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case ("arb" or "arbitrum") {
        switch (await menese.sendEvmNativeTokenAutonomous("arbitrum", to, Nat64.toText(amount), null)) {
          case (#ok(r)) #ok(r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case "base" {
        switch (await menese.sendEvmNativeTokenAutonomous("base", to, Nat64.toText(amount), null)) {
          case (#ok(r)) #ok(r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case "xrp" {
        switch (await menese.sendXrpAutonomous(to, Nat64.toText(amount), null)) {
          case (#ok(r)) #ok(r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case "sui" {
        switch (await menese.sendSui(to, amount)) {
          case (#ok(r)) #ok(r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case "ton" {
        await menese.sendTonSimple(to, amount);
      };
      case _ {
        #err("Unsupported chain: " # chain # ". Use: sol, icp, btc, eth, arb, base, xrp, sui, ton");
      };
    };
  };

  // ── Swap SOL tokens on Raydium ($0.075) ───────────────────
  public shared func swapSolana(
    inputMint : Text,
    outputMint : Text,
    amountIn : Nat64,
    slippageBps : Nat64,
  ) : async Result.Result<Text, Text> {
    switch (await menese.swapRaydiumApiUser(inputMint, outputMint, amountIn, slippageBps)) {
      case (#ok(r)) #ok(r.txHash);
      case (#err(e)) #err(e);
    };
  };

  // ── Billing status (FREE) ─────────────────────────────────
  public shared func getBillingStatus() : async {
    credits : Nat;
    actionsUsed : Nat;
    actionsRemaining : Nat;
  } {
    let account = await menese.getMyGatewayAccount();
    {
      credits = account.creditsMicroUsd;
      actionsUsed = account.actionsUsed;
      actionsRemaining = account.actionsRemaining;
    };
  };

  // ── Transaction log ────────────────────────────────────────
  type TxLog = {
    timestamp : Int;
    chain : Text;
    action : Text;
    result : Text;
  };

  stable var txLogEntries : [TxLog] = [];
  let txLog = Buffer.Buffer<TxLog>(50);

  public query func getTransactionLog() : async [TxLog] {
    Buffer.toArray(txLog);
  };

  system func preupgrade() {
    txLogEntries := Buffer.toArray(txLog);
  };

  system func postupgrade() {
    for (entry in txLogEntries.vals()) {
      txLog.add(entry);
    };
    txLogEntries := [];
  };
};
