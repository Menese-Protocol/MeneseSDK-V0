/// 03-MerchantPayments.mo — Accept crypto payments in your canister
///
/// What this does:
///   1. Creates payment invoices with unique IDs
///   2. Customer sends crypto to your canister's derived address
///   3. Your canister checks the balance to confirm payment
///   4. Marks invoice as paid
///   5. Optionally sweeps funds to your cold wallet
///
/// Supported payment chains: SOL, ICP (balance checking built in)
/// For other chains, use the address + external verification.
///
/// Cost: Address generation = FREE, Balance check = FREE, Sweep = $0.05
///
/// Tested: Feb 11, 2026 on mainnet

import Menese "MeneseInterface";
import Result "mo:base/Result";
import HashMap "mo:base/HashMap";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import Array "mo:base/Array";
import Principal "mo:base/Principal";

actor MerchantPayments {

  // ── Config ─────────────────────────────────────────────────
  let menese = Menese.mainnet();

  // Your treasury addresses (where to sweep funds)
  stable var solTreasury : Text = "";
  stable var icpTreasury : Text = "";  // Principal as text

  // ── Invoice types ──────────────────────────────────────────
  type PaymentChain = { #SOL; #ICP };

  type Invoice = {
    id : Text;
    amountSmallest : Nat64;    // lamports or e8s
    chain : PaymentChain;
    customer : Text;           // Customer identifier
    description : Text;
    status : InvoiceStatus;
    createdAt : Int;
    paidAt : ?Int;
  };

  type InvoiceStatus = {
    #Pending;
    #Paid;
    #Expired;
    #Swept;     // Funds moved to treasury
  };

  // ── State ──────────────────────────────────────────────────
  stable var nextInvoiceId : Nat = 1;
  stable var invoiceEntries : [(Text, Invoice)] = [];
  let invoices = HashMap.HashMap<Text, Invoice>(100, Text.equal, Text.hash);

  // ── Admin: set treasury addresses ──────────────────────────
  public shared func setSolTreasury(addr : Text) : async () {
    solTreasury := addr;
  };

  public shared func setIcpTreasury(principal : Text) : async () {
    icpTreasury := principal;
  };

  // ── Create invoice ─────────────────────────────────────────
  // Returns the invoice ID and the payment address.
  public shared func createInvoice(
    chain : PaymentChain,
    amountSmallest : Nat64,
    customer : Text,
    description : Text,
  ) : async { invoiceId : Text; paymentAddress : Text } {
    let id = "INV-" # Nat.toText(nextInvoiceId);
    nextInvoiceId += 1;

    // Get the payment address for this chain
    let paymentAddress = switch (chain) {
      case (#SOL) {
        let info = await menese.getMySolanaAddress();
        info.address;
      };
      case (#ICP) {
        // For ICP, customers send to this canister's principal
        // via ICRC-1 transfer or ICP ledger transfer
        "Send ICP to this canister's principal";
      };
    };

    let invoice : Invoice = {
      id;
      amountSmallest;
      chain;
      customer;
      description;
      status = #Pending;
      createdAt = Time.now();
      paidAt = null;
    };

    invoices.put(id, invoice);

    { invoiceId = id; paymentAddress };
  };

  // ── Check if invoice is paid ───────────────────────────────
  // Checks the on-chain balance to see if payment arrived.
  // In production, you'd track the balance delta, not absolute balance.
  public shared func checkPayment(invoiceId : Text) : async {
    status : Text;
    balance : Nat64;
  } {
    switch (invoices.get(invoiceId)) {
      case null { { status = "Invoice not found"; balance = 0 } };
      case (?invoice) {
        if (invoice.status != #Pending) {
          return { status = "Already " # statusToText(invoice.status); balance = 0 };
        };

        let balance : Nat64 = switch (invoice.chain) {
          case (#SOL) {
            switch (await menese.getMySolanaBalance()) {
              case (#ok(v)) v;
              case (#err(_)) 0;
            };
          };
          case (#ICP) {
            switch (await menese.getICPBalance()) {
              case (#ok(v)) v;
              case (#err(_)) 0;
            };
          };
        };

        // Check if balance covers the invoice amount
        if (balance >= invoice.amountSmallest) {
          // Mark as paid
          let updated : Invoice = {
            id = invoice.id;
            amountSmallest = invoice.amountSmallest;
            chain = invoice.chain;
            customer = invoice.customer;
            description = invoice.description;
            status = #Paid;
            createdAt = invoice.createdAt;
            paidAt = ?Time.now();
          };
          invoices.put(invoiceId, updated);

          { status = "PAID"; balance };
        } else {
          { status = "Pending — balance: " # Nat64.toText(balance); balance };
        };
      };
    };
  };

  // ── Sweep paid invoices to treasury ────────────────────────
  // sendSolTransaction returns Result<Text, Text> (ok = txHash)
  // sendICP returns Result<SendICPResult, Text> (ok = { amount, blockHeight, fee, from, to })
  // We normalize both to Result<Text, Text> for the caller.
  public shared func sweepToTreasury(invoiceId : Text) : async Result.Result<Text, Text> {
    switch (invoices.get(invoiceId)) {
      case null { #err("Invoice not found") };
      case (?invoice) {
        if (invoice.status != #Paid) {
          return #err("Invoice not in Paid status");
        };

        // Handle each chain separately because return types differ
        let sweepResult : Result.Result<Text, Text> = switch (invoice.chain) {
          case (#SOL) {
            if (solTreasury == "") return #err("SOL treasury not set");
            // Keep 0.01 SOL for rent
            let sweepAmount = invoice.amountSmallest - 10_000_000;
            // sendSolTransaction returns Result<Text, Text> — ok = txHash
            await menese.sendSolTransaction(solTreasury, sweepAmount);
          };
          case (#ICP) {
            if (icpTreasury == "") return #err("ICP treasury not set");
            let sweepAmount = invoice.amountSmallest - 100_000; // Keep 0.001 ICP for fees
            // sendICP returns Result<SendICPResult, Text>
            //   SendICPResult = { amount, blockHeight, fee, from, to }
            let icpResult = await menese.sendICP(Principal.fromText(icpTreasury), sweepAmount);
            switch (icpResult) {
              case (#ok(receipt)) {
                #ok("Block: " # Nat64.toText(receipt.blockHeight) # " | Fee: " # Nat64.toText(receipt.fee));
              };
              case (#err(e)) { #err(e) };
            };
          };
        };

        switch (sweepResult) {
          case (#ok(info)) {
            // Mark as swept
            let updated : Invoice = {
              id = invoice.id;
              amountSmallest = invoice.amountSmallest;
              chain = invoice.chain;
              customer = invoice.customer;
              description = invoice.description;
              status = #Swept;
              createdAt = invoice.createdAt;
              paidAt = invoice.paidAt;
            };
            invoices.put(invoiceId, updated);
            #ok(info);
          };
          case (#err(e)) { #err(e) };
        };
      };
    };
  };

  // ── Query functions ────────────────────────────────────────
  public query func getInvoice(id : Text) : async ?Invoice {
    invoices.get(id);
  };

  public query func getPendingInvoices() : async [Invoice] {
    let pending = Array.filter<(Text, Invoice)>(
      Iter.toArray(invoices.entries()),
      func((_, inv)) { inv.status == #Pending },
    );
    Array.map<(Text, Invoice), Invoice>(pending, func((_, inv)) { inv });
  };

  public query func getPaidInvoices() : async [Invoice] {
    let paid = Array.filter<(Text, Invoice)>(
      Iter.toArray(invoices.entries()),
      func((_, inv)) { inv.status == #Paid },
    );
    Array.map<(Text, Invoice), Invoice>(paid, func((_, inv)) { inv });
  };

  // Get payment addresses for display on checkout page
  // Each getMyXxxAddress returns a record — use the correct field name!
  public shared func getPaymentAddresses() : async {
    solana : Text;
    evm : Text;
    bitcoin : Text;
  } {
    let sol = await menese.getMySolanaAddress();
    let evm = await menese.getMyEvmAddress();
    let btc = await menese.getMyBitcoinAddress();
    {
      solana = sol.address;           // SolanaAddressInfo.address
      evm = evm.evmAddress;           // EvmAddressInfo.evmAddress (NOT "address")
      bitcoin = btc.bech32Address;    // AddressInfo.bech32Address (NOT Text)
    };
  };

  // ── Helpers ────────────────────────────────────────────────
  func statusToText(s : InvoiceStatus) : Text {
    switch (s) {
      case (#Pending) "Pending";
      case (#Paid) "Paid";
      case (#Expired) "Expired";
      case (#Swept) "Swept";
    };
  };

  // ── Upgrade hooks ──────────────────────────────────────────
  system func preupgrade() {
    invoiceEntries := Iter.toArray(invoices.entries());
  };

  system func postupgrade() {
    for ((k, v) in invoiceEntries.vals()) {
      invoices.put(k, v);
    };
    invoiceEntries := [];
  };
};
