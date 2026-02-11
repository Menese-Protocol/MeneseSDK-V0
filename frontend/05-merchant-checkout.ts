/**
 * MeneseSDK — Merchant Checkout: Accept crypto payments in your store
 *
 * How it works:
 *   1. Register as a developer to get your API key
 *   2. Show customers a payment page with your derived addresses
 *   3. Customer sends crypto to YOUR Menese-derived address
 *   4. You check the balance to confirm payment
 *   5. Optionally auto-sweep funds to your cold wallet
 *
 * This example builds a simple checkout flow that:
 *   - Generates payment addresses for SOL, ETH, and BTC
 *   - Monitors for incoming payments
 *   - Confirms when payment is received
 *   - Sweeps funds to your treasury address
 *
 * Addresses are FREE. Sends cost $0.05 each (for sweeping).
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor, MENESE_CANISTER_ID } from "./menese-config";
import { Principal } from "@dfinity/principal";

// ── Your merchant config ─────────────────────────────────────
const MERCHANT_CONFIG = {
  // Your cold wallet addresses (where to sweep funds)
  treasury: {
    solana: "YourTreasurySolanaAddress",
    evm: "0xYourTreasuryEthAddress",
    bitcoin: "bc1qYourTreasuryBtcAddress",
    icp: "your-treasury-principal-id",
  },
  // Polling interval for payment checks (ms)
  pollInterval: 10_000,
  // How long to wait for payment before timeout (ms)
  paymentTimeout: 30 * 60 * 1000, // 30 minutes
};

// ── Step 1: Register as a developer (one-time setup) ────────
async function setupMerchant() {
  const menese = await createMeneseActor();

  // Check if already registered
  const existing = await menese.getMyDeveloperAccount() as any;
  if (existing.length > 0 && existing[0].developerKey) {
    console.log("Already registered! Key:", existing[0].developerKey);
    return existing[0].developerKey;
  }

  // Register your canister and get API key
  const result = await menese.registerDeveloperCanister(
    Principal.fromText(MENESE_CANISTER_ID),
    "My Marketplace"
  ) as any;

  if ("ok" in result) {
    console.log("Developer key:", result.ok);
    console.log("Save this key — you'll use it for billing.");
    return result.ok;
  } else {
    console.error("Registration failed:", result.err);
    return null;
  }
}

// ── Step 2: Generate payment addresses ──────────────────────
// Each user who logs in gets unique addresses. Show these on your
// checkout page so customers know where to send.
interface PaymentAddresses {
  solana: string;
  evm: string;
  bitcoin: string;
  icp: string;
}

async function getPaymentAddresses(): Promise<PaymentAddresses> {
  const menese = await createMeneseActor();

  const [sol, evm, btc] = await Promise.all([
    menese.getMySolanaAddress(),
    menese.getMyEvmAddress(),
    menese.getMyBitcoinAddress(),
  ]);

  const addresses = {
    solana: (sol as any).address,
    evm: (evm as any).address,
    bitcoin: btc as string,
    icp: "Pay via ICP ledger transfer",
  };

  console.log("Payment addresses for this user:");
  console.log("  SOL:", addresses.solana);
  console.log("  ETH:", addresses.evm);
  console.log("  BTC:", addresses.bitcoin);

  return addresses;
}

// ── Step 3: Monitor for payment ─────────────────────────────
// Poll the balance until the expected amount arrives.
async function waitForPayment(
  chain: "solana" | "icp",
  expectedAmount: number,
  timeoutMs: number = MERCHANT_CONFIG.paymentTimeout,
): Promise<boolean> {
  const menese = await createMeneseActor();
  const startTime = Date.now();

  console.log(`Waiting for ${expectedAmount} on ${chain}...`);

  while (Date.now() - startTime < timeoutMs) {
    let balance = 0;

    if (chain === "solana") {
      const result = await menese.getMySolanaBalance() as any;
      if ("ok" in result) {
        balance = Number(result.ok) / 1e9;
      }
    } else if (chain === "icp") {
      const result = await menese.getICPBalance() as any;
      if ("ok" in result) {
        balance = Number(result.ok) / 1e8;
      }
    }

    if (balance >= expectedAmount) {
      console.log(`Payment received! Balance: ${balance}`);
      return true;
    }

    console.log(`Balance: ${balance}, waiting...`);
    await new Promise(r => setTimeout(r, MERCHANT_CONFIG.pollInterval));
  }

  console.log("Payment timeout — no payment received.");
  return false;
}

// ── Step 4: Sweep funds to treasury ─────────────────────────
// After confirming payment, move funds to your cold wallet.
async function sweepToTreasury(chain: "solana" | "icp", amount: number) {
  const menese = await createMeneseActor();

  if (chain === "solana") {
    const lamports = BigInt(Math.round(amount * 1e9));
    // Keep 0.01 SOL for rent/fees
    const sweepAmount = lamports - BigInt(10_000_000);
    if (sweepAmount <= 0n) return;

    const result = await menese.sendSolTransaction(
      MERCHANT_CONFIG.treasury.solana,
      sweepAmount,
    ) as any;

    if ("ok" in result) {
      console.log(`Swept ${Number(sweepAmount) / 1e9} SOL to treasury. TX: ${result.ok}`);
    }
  } else if (chain === "icp") {
    const e8s = BigInt(Math.round(amount * 1e8));
    // Keep 0.001 ICP for fees
    const sweepAmount = e8s - BigInt(100_000);
    if (sweepAmount <= 0n) return;

    const result = await menese.sendICP(
      Principal.fromText(MERCHANT_CONFIG.treasury.icp),
      sweepAmount,
    ) as any;

    if ("ok" in result) {
      console.log(`Swept ${Number(sweepAmount) / 1e8} ICP to treasury.`);
    }
  }
}

// ── Full checkout flow ──────────────────────────────────────
async function checkout(
  orderId: string,
  amountUsd: number,
  paymentChain: "solana" | "icp",
) {
  console.log(`\nOrder ${orderId}: $${amountUsd} USD`);
  console.log("=".repeat(40));

  // 1. Get payment addresses
  const addresses = await getPaymentAddresses();

  // 2. Show address to customer
  if (paymentChain === "solana") {
    // Convert USD to SOL (you'd use a price API in production)
    const solPrice = 150; // Example: $150/SOL
    const solAmount = amountUsd / solPrice;
    console.log(`\nPlease send ${solAmount.toFixed(6)} SOL to:`);
    console.log(addresses.solana);

    // 3. Wait for payment
    const paid = await waitForPayment("solana", solAmount);
    if (paid) {
      console.log("Order confirmed! Fulfilling...");
      await sweepToTreasury("solana", solAmount);
    }
  } else if (paymentChain === "icp") {
    const icpPrice = 12; // Example: $12/ICP
    const icpAmount = amountUsd / icpPrice;
    console.log(`\nPlease send ${icpAmount.toFixed(4)} ICP to:`);
    console.log(addresses.icp);

    const paid = await waitForPayment("icp", icpAmount);
    if (paid) {
      console.log("Order confirmed! Fulfilling...");
      await sweepToTreasury("icp", icpAmount);
    }
  }
}

// ── Example usage ────────────────────────────────────────────
async function main() {
  // One-time: register as developer
  await setupMerchant();

  // Process a $25 payment in SOL
  await checkout("ORD-001", 25.00, "solana");
}

main().catch(console.error);
