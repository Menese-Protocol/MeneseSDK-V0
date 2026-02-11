/// MeneseInterface.mo — Remote actor type for calling MeneseSDK
///
/// Import this file into your canister project.
/// Only includes the functions most commonly used for integration.
/// Full Candid interface: https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io/?id=urs2a-ziaaa-aaaad-aembq-cai

import Result "mo:base/Result";
import Principal "mo:base/Principal";

module {

  // ============================================================
  // TYPES
  // ============================================================

  public type SolanaAddressInfo = {
    address : Text;
    publicKeyHex : Text;
    publicKeyBytes : [Nat8];
  };

  public type EvmAddressInfo = {
    address : Text;
    publicKeyHex : Text;
  };

  public type SuiAddressInfo = {
    address : Text;
    publicKeyHex : Text;
  };

  public type XrpAddressInfo = {
    classicAddress : Text;
    xAddress : Text;
  };

  public type TonAddressInfo = {
    address : Text;
    rawAddress : Text;
  };

  public type TronAddressInfo = {
    base58 : Text;
    hex : Text;
  };

  // Note: getAllAddresses exists but returns nested records per chain.
  // For simplicity, use the individual getMyXAddress() functions.

  public type Tier = {
    #Free;
    #Developer;
    #Pro;
    #Enterprise;
  };

  public type UserAccount = {
    creditsMicroUsd : Nat;
    tier : Tier;
    actionsRemaining : Nat;
    subscriptionExpiry : ?Int;
    actionsUsed : Nat;
    totalDepositedMicroUsd : Nat;
    createdAt : Int;
  };

  public type DeveloperAccountV3 = {
    owner : Principal;
    canisters : [Principal];
    appName : Text;
    developerKey : Text;
    createdAt : Int;
  };

  // ============================================================
  // REMOTE ACTOR TYPE
  // ============================================================

  public type MeneseSDK = actor {
    // === ADDRESSES (FREE) ===
    getMySolanaAddress : shared () -> async SolanaAddressInfo;
    getMyEvmAddress : shared () -> async EvmAddressInfo;
    getMyBitcoinAddress : shared () -> async Text;
    getMySuiAddress : shared () -> async SuiAddressInfo;
    getMyXrpAddress : shared () -> async XrpAddressInfo;
    getMyTonAddress : shared () -> async TonAddressInfo;
    getMyCardanoAddress : shared () -> async { address : Text };
    getMyAptosAddress : shared () -> async { address : Text };
    getMyNearAddress : shared () -> async { accountId : Text };
    getTronAddress : shared () -> async TronAddressInfo;
    getMyLitecoinAddress : shared () -> async Text;
    getMyCloakAddress : shared () -> async { base58Address : Text };
    getMyThorAddress : shared () -> async { address : Text };
    // getAllAddresses returns nested records per chain.
    // For simplicity, use the individual getMyXAddress() functions above.

    // === BALANCES (FREE) ===
    getMySolanaBalance : shared () -> async Result.Result<Nat64, Text>;
    getMyEvmBalance : shared (Text) -> async Result.Result<Nat, Text>;
    getICPBalance : shared () -> async Result.Result<Nat64, Text>;
    getMyXrpBalance : shared () -> async Result.Result<Text, Text>;
    getMySuiBalance : shared () -> async Nat64;

    // === SEND ($0.05) ===
    sendSolTransaction : shared (Text, Nat64) -> async Result.Result<Text, Text>;
    transferSplToken : shared (Text, Text, Nat64) -> async Result.Result<Text, Text>;
    sendEvmNativeTokenAutonomous : shared (Text, Text, Text, ?Text) -> async Result.Result<{ txHash : Text }, Text>;
    sendICP : shared (Principal, Nat64) -> async Result.Result<Text, Text>;
    sendBitcoin : shared (Text, Nat64) -> async Result.Result<Text, Text>;
    sendXrpAutonomous : shared (Text, Text, ?Nat32) -> async Result.Result<{ txHash : Text }, Text>;
    sendSui : shared (Text, Nat64) -> async Result.Result<{ txHash : Text }, Text>;
    sendTonSimple : shared (Text, Nat64) -> async Result.Result<Text, Text>;

    // === SWAP ($0.075) ===
    swapRaydiumApiUser : shared (Text, Text, Nat64, Nat64) -> async Result.Result<{ txHash : Text }, Text>;
    swapTokens : shared (Text, Text, Text, Text, Text, Nat) -> async Result.Result<{ txHash : Text }, Text>;
    executeICPDexSwap : shared (Text, Text, Nat, Nat) -> async Result.Result<{ amountOut : Nat }, Text>;

    // === BRIDGE ($0.10) ===
    quickUltrafastEthToSol : shared (Text, Nat) -> async Result.Result<{ jobId : Text }, Text>;
    quickUltrafastUsdcToSol : shared (Text, Nat) -> async Result.Result<{ jobId : Text }, Text>;
    quickCctpBridge : shared (Text, Nat) -> async Result.Result<{ jobId : Text }, Text>;

    // === DEVELOPER ===
    getMyGatewayAccount : shared () -> async UserAccount;
    getMyDeveloperAccount : shared () -> async ?DeveloperAccountV3;
    validateDeveloperKey : shared query (Text) -> async Bool;
  };

  // ============================================================
  // CONSTRUCTOR — call this to get a handle to MeneseSDK
  // ============================================================

  public func mainnet() : MeneseSDK {
    actor ("urs2a-ziaaa-aaaad-aembq-cai") : MeneseSDK;
  };
};
