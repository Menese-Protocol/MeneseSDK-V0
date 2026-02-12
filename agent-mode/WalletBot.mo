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
/// IMPORTANT: For EVM chains (ETH, ARB, BASE, etc.), you must provide
/// your own RPC endpoint. Call setEvmRpc() to configure each chain.
///
/// Tested: Feb 11, 2026 on mainnet

import Result "mo:base/Result";
import Principal "mo:base/Principal";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Buffer "mo:base/Buffer";
import HashMap "mo:base/HashMap";
import Iter "mo:base/Iter";

actor WalletBot {

  // ── MeneseSDK remote actor type ────────────────────────────
  // Minimal interface — only the functions ClawdBot needs.
  // Field names MUST match the .did exactly.

  // Address info records (correct field names from .did)
  type SolanaAddressInfo = { address : Text; publicKeyHex : Text; publicKeyBytes : [Nat8] };
  type EvmAddressInfo = { evmAddress : Text; publicKeyHex : Text };
  type AddressInfo = { bech32Address : Text; hash160Hex : Text; pubKeyHex : Text };  // BTC, LTC, Thor
  type SuiAddressInfo = { suiAddress : Text; publicKeyHex : Text; publicKeyBytes : [Nat8] };
  type XrpAddressInfo = { classicAddress : Text; accountIdHex : Text; accountIdBytes : [Nat8]; publicKeyHex : Text };
  type TonAddressInfo = { bounceable : Text; nonBounceable : Text; rawAddress : Text; publicKeyHex : Text; stateInitBocBase64 : Text };
  type CardanoAddressInfo = { bech32Address : Text; addressBytesHex : Text; paymentPubKeyHex : Text; stakePubKeyHex : Text };
  type AptosAddressInfo = { address : Text; publicKeyHex : Text };
  type PubKeyInfo = { implicitAccountId : Text; publicKeyBase58 : Text; publicKeyHex : Text };  // NEAR
  type TronAddressInfo = { base58Address : Text; hexAddress : Text; publicKeyHex : Text };
  type CloakAddressInfo = { base58Address : Text; addressBytesHex : Text; hash160Hex : Text; pubKeyHex : Text };

  // Send result records (from .did)
  type SendICPResult = { amount : Nat64; blockHeight : Nat64; fee : Nat64; from : Principal; to : Principal };
  type SendResultBtcLtc = { txid : Text; amount : Nat64; fee : Nat64; senderAddress : Text; recipientAddress : Text; note : Text };
  type SendResultEvm = { expectedTxHash : Text; nonce : Nat; senderAddress : Text; note : Text };
  type SendResult = { txHash : Text; senderAddress : Text; note : Text };  // SUI, Aptos, LTC
  type SendResultCloak = { txHash : Text; txHex : Text; changeValue : Nat64 };
  // Flat records (NOT variants):
  type SendResultXrp = { success : Bool; txHash : Text; explorerUrl : Text; message : Text; sequence : Nat32; ledgerUsed : Nat32 };
  type SendResultTon = { success : Bool; txHash : Text; bocBase64 : Text; senderAddress : Text; error : ?Text };
  // Swap result (flat record, NOT variant):
  type RaydiumApiSwapResult = { inputAmount : Text; outputAmount : Text; priceImpactPct : Text; txSignature : Text };

  type MeneseSDK = actor {
    // ── Addresses (FREE) ──
    getMySolanaAddress : shared () -> async SolanaAddressInfo;
    getMyEvmAddress : shared () -> async EvmAddressInfo;
    getMyBitcoinAddress : shared () -> async AddressInfo;
    getMyLitecoinAddress : shared () -> async AddressInfo;
    getMyThorAddress : shared () -> async AddressInfo;
    getMySuiAddress : shared () -> async SuiAddressInfo;
    getMyXrpAddress : shared () -> async XrpAddressInfo;
    getMyTonAddress : shared () -> async TonAddressInfo;
    getMyCardanoAddress : shared () -> async CardanoAddressInfo;
    getMyAptosAddress : shared () -> async AptosAddressInfo;
    getMyNearAddress : shared () -> async PubKeyInfo;
    getTronAddress : shared () -> async TronAddressInfo;
    getMyCloakAddress : shared () -> async CloakAddressInfo;

    // ── Balances (FREE) ──
    getMySolanaBalance : shared () -> async Result.Result<Nat64, Text>;
    getICPBalance : shared () -> async Result.Result<Nat64, Text>;
    getMyXrpBalance : shared () -> async Result.Result<Text, Text>;
    getMySuiBalance : shared () -> async Nat64;
    getMyEvmBalance : shared (Text) -> async Result.Result<Nat, Text>;  // param = RPC endpoint URL

    // ── Sends ($0.05 each) ──
    sendSolTransaction : shared (Text, Nat64) -> async Result.Result<Text, Text>;
    sendICP : shared (Principal, Nat64) -> async Result.Result<SendICPResult, Text>;
    sendBitcoin : shared (Text, Nat64) -> async Result.Result<SendResultBtcLtc, Text>;
    sendLitecoin : shared (Text, Nat64) -> async Result.Result<SendResult, Text>;
    // EVM: (to, valueWei:Nat, rpcEndpoint, chainId:Nat, ?quoteId)
    sendEvmNativeTokenAutonomous : shared (Text, Nat, Text, Nat, ?Text) -> async Result.Result<SendResultEvm, Text>;
    sendXrpAutonomous : shared (Text, Text, ?Nat32) -> async SendResultXrp;  // FLAT record
    sendSui : shared (Text, Nat64) -> async Result.Result<SendResult, Text>;
    sendTonSimple : shared (Text, Nat64) -> async SendResultTon;  // FLAT record
    sendAptos : shared (Text, Nat64) -> async Result.Result<SendResult, Text>;
    sendNearTransfer : shared (Text, Nat) -> async Result.Result<Text, Text>;
    sendTrx : shared (Text, Nat64) -> async Result.Result<Text, Text>;
    sendCardanoTransaction : shared (Text, Nat64) -> async Result.Result<Text, Text>;
    sendCloak : shared (Text, Nat64) -> async Result.Result<SendResultCloak, Text>;
    sendThor : shared (Text, Nat64, Text) -> async Result.Result<Text, Text>;

    // ── Swap ($0.075) ──
    // 8 params: inputMint, outputMint, amount, slippageBps, wrapSol, unwrapSol, ?inputAta, ?outputAta
    swapRaydiumApiUser : shared (Text, Text, Nat64, Nat64, Bool, Bool, ?Text, ?Text) -> async RaydiumApiSwapResult;
  };

  let menese : MeneseSDK = actor ("urs2a-ziaaa-aaaad-aembq-cai");

  // ── EVM RPC config ──────────────────────────────────────────
  // You MUST provide your own RPC endpoints for EVM chains.
  // MeneseSDK does NOT manage EVM RPCs — this keeps costs low.
  type EvmChainConfig = { rpc : Text; chainId : Nat };

  stable var evmConfigEntries : [(Text, EvmChainConfig)] = [];
  let evmConfigs = HashMap.HashMap<Text, EvmChainConfig>(10, Text.equal, Text.hash);

  // Set RPC for an EVM chain. Call once per chain.
  // Example: setEvmRpc("ethereum", "https://eth.llamarpc.com", 1)
  public shared func setEvmRpc(chain : Text, rpc : Text, chainId : Nat) : async () {
    evmConfigs.put(chain, { rpc; chainId });
  };

  // ── Address cache ──────────────────────────────────────────
  // Addresses are deterministic — cache them after first fetch.
  stable var cachedAddresses : ?AddressBook = null;

  type AddressBook = {
    solana : Text;
    evm : Text;        // Same address for all 6 EVM chains
    bitcoin : Text;
    litecoin : Text;
    sui : Text;
    xrp : Text;
    ton : Text;
    cardano : Text;
    aptos : Text;
    near : Text;
    tron : Text;
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
        let ltc = await menese.getMyLitecoinAddress();
        let sui = await menese.getMySuiAddress();
        let xrp = await menese.getMyXrpAddress();
        let ton = await menese.getMyTonAddress();
        let ada = await menese.getMyCardanoAddress();
        let apt = await menese.getMyAptosAddress();
        let near = await menese.getMyNearAddress();
        let tron = await menese.getTronAddress();
        let cloak = await menese.getMyCloakAddress();
        let thor = await menese.getMyThorAddress();

        let addrs : AddressBook = {
          solana = sol.address;
          evm = evm.evmAddress;            // NOT "address" — field is "evmAddress"
          bitcoin = btc.bech32Address;      // AddressInfo record, NOT Text
          litecoin = ltc.bech32Address;     // AddressInfo record, NOT Text
          sui = sui.suiAddress;             // NOT "address" — field is "suiAddress"
          xrp = xrp.classicAddress;
          ton = ton.nonBounceable;          // NOT "address" — use bounceable or nonBounceable
          cardano = ada.bech32Address;      // NOT "address" — field is "bech32Address"
          aptos = apt.address;
          near = near.implicitAccountId;    // NOT "accountId"
          tron = tron.base58Address;        // NOT "base58"
          cloak = cloak.base58Address;
          thorchain = thor.bech32Address;   // AddressInfo record, NOT "address"
        };
        cachedAddresses := ?addrs;
        addrs;
      };
    };
  };

  // ── Check balance (FREE) ──────────────────────────────────
  // Pass chain name: "sol", "icp", "xrp", "sui"
  // For EVM: set RPC first with setEvmRpc(), then pass "ethereum", "arbitrum", etc.
  //
  // TIP: For production, query balances directly from chain RPCs
  // for faster response. Use the address from getAddresses() with
  // your own Helius/Alchemy/Infura RPC.
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
      // EVM chains: requires RPC endpoint (set via setEvmRpc first)
      case ("ethereum" or "arbitrum" or "base" or "polygon" or "bsc" or "optimism") {
        switch (evmConfigs.get(chain)) {
          case null { #err("No RPC configured for " # chain # ". Call setEvmRpc first.") };
          case (?config) {
            // getMyEvmBalance takes RPC endpoint URL, returns Result<Nat, Text>
            switch (await menese.getMyEvmBalance(config.rpc)) {
              case (#ok(wei)) #ok(Nat.toText(wei) # " wei on " # chain);
              case (#err(e)) #err(e);
            };
          };
        };
      };
      case _ {
        #err("Unknown chain: " # chain # ". Use: sol, icp, xrp, sui, ethereum, arbitrum, base, polygon, bsc, optimism");
      };
    };
  };

  // ── Send tokens ($0.05 each) ──────────────────────────────
  // Supports all 19 chains. Amount is in smallest unit.
  // For EVM chains: configure RPC first with setEvmRpc().
  //
  // Return types vary by chain — we normalize to Result<Text, Text>
  // for ClawdBot convenience.
  public shared func sendTokens(chain : Text, amount : Nat64, to : Text) : async Result.Result<Text, Text> {
    switch (chain) {
      case "sol" {
        // sendSolTransaction returns Result<Text, Text> — ok = txHash
        await menese.sendSolTransaction(to, amount);
      };
      case "icp" {
        // sendICP returns Result<SendICPResult, Text>
        switch (await menese.sendICP(Principal.fromText(to), amount)) {
          case (#ok(receipt)) {
            #ok("Block: " # Nat64.toText(receipt.blockHeight) # " | Amount: " # Nat64.toText(receipt.amount) # " | Fee: " # Nat64.toText(receipt.fee));
          };
          case (#err(e)) #err(e);
        };
      };
      case "btc" {
        // sendBitcoin returns Result<SendResultBtcLtc, Text>
        //   SendResultBtcLtc = { txid, amount, fee, senderAddress, recipientAddress, note }
        switch (await menese.sendBitcoin(to, amount)) {
          case (#ok(r)) #ok("TX: " # r.txid # " | Fee: " # Nat64.toText(r.fee) # " sats");
          case (#err(e)) #err(e);
        };
      };
      case "ltc" {
        // sendLitecoin returns Result<SendResult, Text> — NOT SendResultBtcLtc!
        //   SendResult = { txHash, senderAddress, note }
        switch (await menese.sendLitecoin(to, amount)) {
          case (#ok(r)) #ok("TX: " # r.txHash);
          case (#err(e)) #err(e);
        };
      };
      // EVM chains: sendEvmNativeTokenAutonomous(to, valueWei:Nat, rpcEndpoint, chainId:Nat, ?quoteId)
      case ("eth" or "ethereum") {
        switch (evmConfigs.get("ethereum")) {
          case null { #err("No RPC for ethereum. Call setEvmRpc(\"ethereum\", \"https://...\", 1)") };
          case (?config) {
            switch (await menese.sendEvmNativeTokenAutonomous(to, Nat64.toNat(amount), config.rpc, config.chainId, null)) {
              case (#ok(r)) #ok("TX: " # r.expectedTxHash # " | Nonce: " # Nat.toText(r.nonce));
              case (#err(e)) #err(e);
            };
          };
        };
      };
      case ("arb" or "arbitrum") {
        switch (evmConfigs.get("arbitrum")) {
          case null { #err("No RPC for arbitrum. Call setEvmRpc(\"arbitrum\", \"https://...\", 42161)") };
          case (?config) {
            switch (await menese.sendEvmNativeTokenAutonomous(to, Nat64.toNat(amount), config.rpc, config.chainId, null)) {
              case (#ok(r)) #ok("TX: " # r.expectedTxHash);
              case (#err(e)) #err(e);
            };
          };
        };
      };
      case "base" {
        switch (evmConfigs.get("base")) {
          case null { #err("No RPC for base. Call setEvmRpc(\"base\", \"https://...\", 8453)") };
          case (?config) {
            switch (await menese.sendEvmNativeTokenAutonomous(to, Nat64.toNat(amount), config.rpc, config.chainId, null)) {
              case (#ok(r)) #ok("TX: " # r.expectedTxHash);
              case (#err(e)) #err(e);
            };
          };
        };
      };
      case "xrp" {
        // sendXrpAutonomous returns FLAT SendResultXrp (NOT a variant!)
        let r = await menese.sendXrpAutonomous(to, Nat64.toText(amount), null);
        if (r.success) { #ok("TX: " # r.txHash # " | " # r.explorerUrl) }
        else { #err("XRP send failed: " # r.message) };
      };
      case "sui" {
        // sendSui returns Result<SendResult, Text>
        switch (await menese.sendSui(to, amount)) {
          case (#ok(r)) #ok("TX: " # r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case "ton" {
        // sendTonSimple returns FLAT SendResultTon (NOT a variant!)
        let r = await menese.sendTonSimple(to, amount);
        if (r.success) { #ok("TX: " # r.txHash) }
        else { #err("TON send failed: " # (switch (r.error) { case (?e) e; case null "unknown" })) };
      };
      case "apt" {
        // sendAptos returns Result<SendResult, Text>
        switch (await menese.sendAptos(to, amount)) {
          case (#ok(r)) #ok("TX: " # r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case "near" {
        // sendNearTransfer takes (Text, Nat) — amount is yoctoNEAR
        await menese.sendNearTransfer(to, Nat64.toNat(amount));
      };
      case "trx" {
        // sendTrx returns Result<Text, Text>
        await menese.sendTrx(to, amount);
      };
      case "ada" {
        // sendCardanoTransaction returns Result<Text, Text>
        await menese.sendCardanoTransaction(to, amount);
      };
      case "cloak" {
        // sendCloak returns Result<SendResultCloak, Text>
        switch (await menese.sendCloak(to, amount)) {
          case (#ok(r)) #ok("TX: " # r.txHash);
          case (#err(e)) #err(e);
        };
      };
      case "rune" {
        // sendThor takes (toAddress, amount, memo) — returns Result<Text, Text>
        await menese.sendThor(to, amount, "");
      };
      case _ {
        #err("Unsupported chain: " # chain # ". Use: sol, icp, btc, ltc, eth, arb, base, xrp, sui, ton, apt, near, trx, ada, cloak, rune");
      };
    };
  };

  // ── Swap SOL tokens on Raydium ($0.075) ───────────────────
  // swapRaydiumApiUser takes 8 params and returns FLAT RaydiumApiSwapResult
  //   (inputMint, outputMint, amount, slippageBps, wrapSol, unwrapSol, ?inputAta, ?outputAta)
  //   Returns: { inputAmount, outputAmount, priceImpactPct, txSignature }
  public shared func swapSolana(
    inputMint : Text,
    outputMint : Text,
    amountIn : Nat64,
    slippageBps : Nat64,
    wrapSol : Bool,
    unwrapSol : Bool,
  ) : async { txSignature : Text; outputAmount : Text } {
    let r = await menese.swapRaydiumApiUser(
      inputMint, outputMint, amountIn, slippageBps,
      wrapSol, unwrapSol, null, null,
    );
    { txSignature = r.txSignature; outputAmount = r.outputAmount };
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

  // ── Upgrade hooks ──────────────────────────────────────────
  system func preupgrade() {
    txLogEntries := Buffer.toArray(txLog);
    evmConfigEntries := Iter.toArray(evmConfigs.entries());
  };

  system func postupgrade() {
    for (entry in txLogEntries.vals()) {
      txLog.add(entry);
    };
    txLogEntries := [];
    for ((k, v) in evmConfigEntries.vals()) {
      evmConfigs.put(k, v);
    };
    evmConfigEntries := [];
  };
};
