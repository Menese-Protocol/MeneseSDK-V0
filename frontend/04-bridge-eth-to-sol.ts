/**
 * MeneseSDK — Bridge: Move assets from EVM chains to Solana
 *
 * Three bridge methods (fastest → cheapest):
 *   1. quickUltrafastEthToSol  — Bridge native ETH to SOL (~2 min)
 *   2. quickUltrafastUsdcToSol — Bridge USDC from EVM to SOL (~2 min)
 *   3. quickCctpBridge         — CCTP official USDC bridge (~5 min, cheapest)
 *
 * Cost: $0.10 per bridge operation
 *
 * NOTE: Only ETH/EVM → Solana direction is supported.
 *       SOL → ETH bridging is still in testing and not yet available.
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor } from "./menese-config";

// ── Bridge ETH → SOL (Ultrafast) ────────────────────────────
// Converts native ETH on the source chain to SOL on Solana.
// The canister handles the cross-chain swap via ultrafast bridge.
async function bridgeEthToSol(
  solanaAddress: string,  // Your Solana wallet to receive SOL
  amountWei: string,      // Amount of ETH in wei (1 ETH = 1e18 wei)
) {
  const menese = await createMeneseActor();

  const ethAmount = Number(BigInt(amountWei)) / 1e18;
  console.log(`Bridging ${ethAmount} ETH → SOL to ${solanaAddress}...`);

  const result = await menese.quickUltrafastEthToSol(
    solanaAddress,
    BigInt(amountWei),
  ) as any;

  if ("ok" in result) {
    console.log("Bridge job started! Job ID:", result.ok.jobId);
    console.log("SOL will arrive in ~2 minutes.");
    return result.ok.jobId;
  } else {
    console.error("Bridge failed:", result.err);
    return null;
  }
}

// ── Bridge USDC → SOL (Ultrafast) ───────────────────────────
// Bridges USDC from an EVM chain to SOL on Solana.
// Fast execution via ultrafast bridge provider.
async function bridgeUsdcToSol(
  solanaAddress: string,    // Your Solana wallet to receive SOL
  amountMicroUsdc: string,  // USDC amount in micro-USDC (1 USDC = 1,000,000)
) {
  const menese = await createMeneseActor();

  const usdcAmount = Number(BigInt(amountMicroUsdc)) / 1e6;
  console.log(`Bridging ${usdcAmount} USDC → SOL to ${solanaAddress}...`);

  const result = await menese.quickUltrafastUsdcToSol(
    solanaAddress,
    BigInt(amountMicroUsdc),
  ) as any;

  if ("ok" in result) {
    console.log("Bridge job started! Job ID:", result.ok.jobId);
    console.log("SOL will arrive in ~2 minutes.");
    return result.ok.jobId;
  } else {
    console.error("Bridge failed:", result.err);
    return null;
  }
}

// ── CCTP Bridge USDC (Official Circle Bridge) ───────────────
// Uses Circle's Cross-Chain Transfer Protocol for USDC bridging.
// Slower than ultrafast (~5 min) but uses the official USDC bridge.
async function bridgeCctpUsdc(
  solanaAddress: string,    // Your Solana wallet to receive USDC
  amountMicroUsdc: string,  // USDC amount in micro-USDC (1 USDC = 1,000,000)
) {
  const menese = await createMeneseActor();

  const usdcAmount = Number(BigInt(amountMicroUsdc)) / 1e6;
  console.log(`CCTP bridging ${usdcAmount} USDC to Solana ${solanaAddress}...`);

  const result = await menese.quickCctpBridge(
    solanaAddress,
    BigInt(amountMicroUsdc),
  ) as any;

  if ("ok" in result) {
    console.log("CCTP bridge started! Job ID:", result.ok.jobId);
    console.log("USDC will arrive in ~5 minutes on Solana.");
    return result.ok.jobId;
  } else {
    console.error("Bridge failed:", result.err);
    return null;
  }
}

// ── Example usage ────────────────────────────────────────────
async function main() {
  const menese = await createMeneseActor();

  // First, get your Solana address (the destination for bridges)
  const solAddr = await menese.getMySolanaAddress() as any;
  console.log("My Solana address:", solAddr.address);

  // Bridge 0.01 ETH to SOL
  await bridgeEthToSol(solAddr.address, "10000000000000000"); // 0.01 ETH

  // Bridge 10 USDC to SOL (ultrafast)
  await bridgeUsdcToSol(solAddr.address, "10000000"); // 10 USDC

  // Bridge 5 USDC via CCTP (official, slower)
  await bridgeCctpUsdc(solAddr.address, "5000000"); // 5 USDC
}

main().catch(console.error);
