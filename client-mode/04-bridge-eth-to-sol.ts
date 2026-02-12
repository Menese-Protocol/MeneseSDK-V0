/**
 * MeneseSDK — Bridge: Move assets between EVM chains and Solana
 *
 * ETH/EVM → Solana (3 methods, fastest → cheapest):
 *   1. quickUltrafastEthToSol(ethAmountWei)          — Bridge native ETH to SOL (~2 min)
 *   2. quickUltrafastUsdcToSol(usdcAmount)            — Bridge USDC to SOL (~2 min)
 *   3. quickCctpBridge(chainId, usdcAmt, output, fast, slip, rpc) — CCTP USDC bridge (~5 min)
 *
 * Solana → ETH (2 methods):
 *   1. quickSolToEth(solLamports, slippageBps)        — Bridge SOL to ETH
 *   2. quickUsdcBridgeSolToEth(usdcAmount)            — Bridge USDC SOL→ETH
 *
 * Cost: $0.10 per bridge operation
 *
 * NOTE for EVM L2s: You must provide your own RPC endpoint for the source chain
 * when using quickCctpBridge. Free public RPCs (Alchemy, Infura) work fine.
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor } from "./menese-config";

// ══════════════════════════════════════════════════════════════
// ETH/EVM → SOLANA
// ══════════════════════════════════════════════════════════════

// ── Bridge ETH → SOL (Ultrafast) ────────────────────────────
// quickUltrafastEthToSol(ethAmountWei: nat) → Result = { ok: text, err: text }
// The canister handles the cross-chain swap via ultrafast bridge.
async function bridgeEthToSol(amountWei: bigint) {
  const menese = await createMeneseActor();

  const ethAmount = Number(amountWei) / 1e18;
  console.log(`Bridging ${ethAmount} ETH → SOL...`);

  const result = await menese.quickUltrafastEthToSol(amountWei) as any;

  if ("ok" in result) {
    console.log("Bridge initiated:", result.ok);
    console.log("SOL will arrive in ~2 minutes.");
  } else {
    console.error("Bridge failed:", result.err);
  }
  return result;
}

// ── Bridge USDC → SOL (Ultrafast) ───────────────────────────
// quickUltrafastUsdcToSol(usdcAmount: nat) → Result = { ok: text, err: text }
async function bridgeUsdcToSol(usdcAmount: bigint) {
  const menese = await createMeneseActor();

  const usdcHuman = Number(usdcAmount) / 1e6;
  console.log(`Bridging ${usdcHuman} USDC → SOL...`);

  const result = await menese.quickUltrafastUsdcToSol(usdcAmount) as any;

  if ("ok" in result) {
    console.log("Bridge initiated:", result.ok);
    console.log("SOL will arrive in ~2 minutes.");
  } else {
    console.error("Bridge failed:", result.err);
  }
  return result;
}

// ── CCTP Bridge USDC (Official Circle Bridge) ───────────────
// quickCctpBridge(sourceChainId, usdcAmount, outputToken, useFastMode, slippageBps, ethRpc)
// Returns: { ok: { jobId, userUsdcAta }, err: text }
// NOTE: You must provide your own RPC endpoint for the source EVM chain.
const CHAIN_IDS: Record<string, number> = {
  ethereum: 1, arbitrum: 42161, base: 8453,
  optimism: 10, polygon: 137, avalanche: 43114,
};

async function bridgeCctpUsdc(
  sourceChain: string,     // "ethereum", "arbitrum", "base", etc.
  usdcAmount: bigint,      // USDC in micro-units (1 USDC = 1,000,000)
  rpcEndpoint: string,     // YOUR RPC for the source chain
  outputToken: string = "USDC",  // Output token on Solana
) {
  const menese = await createMeneseActor();
  const chainId = CHAIN_IDS[sourceChain];
  if (!chainId) throw new Error(`Unknown chain: ${sourceChain}`);

  const usdcHuman = Number(usdcAmount) / 1e6;
  console.log(`CCTP bridging ${usdcHuman} USDC from ${sourceChain} to Solana...`);

  const result = await menese.quickCctpBridge(
    BigInt(chainId),
    usdcAmount,
    outputToken,
    true,                 // useFastMode
    BigInt(100),          // slippageBps (1%)
    rpcEndpoint,
  ) as any;

  if ("ok" in result) {
    console.log("CCTP bridge started! Job ID:", result.ok.jobId);
    console.log("Your USDC ATA:", result.ok.userUsdcAta);
    console.log("USDC will arrive in ~5 minutes on Solana.");
  } else {
    console.error("Bridge failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// SOLANA → ETH
// ══════════════════════════════════════════════════════════════

// ── Bridge SOL → ETH ────────────────────────────────────────
// quickSolToEth(solAmountLamports: nat64, slippageBps: nat)
// Returns: { ok: { jobId, userUsdcAta }, err: text }
async function bridgeSolToEth(amountSol: number, slippageBps: number = 100) {
  const menese = await createMeneseActor();
  const lamports = BigInt(Math.round(amountSol * 1e9));

  console.log(`Bridging ${amountSol} SOL → ETH...`);

  const result = await menese.quickSolToEth(lamports, BigInt(slippageBps)) as any;

  if ("ok" in result) {
    console.log("SOL→ETH bridge started! Job ID:", result.ok.jobId);
    console.log("Your USDC ATA:", result.ok.userUsdcAta);
  } else {
    console.error("Bridge failed:", result.err);
  }
  return result;
}

// ── Bridge USDC SOL → ETH ───────────────────────────────────
// quickUsdcBridgeSolToEth(usdcAmount: nat64)
// Returns: { ok: { jobId, userUsdcAta }, err: text }
async function bridgeUsdcSolToEth(usdcAmount: number) {
  const menese = await createMeneseActor();

  console.log(`Bridging ${usdcAmount / 1e6} USDC from Solana → ETH...`);

  const result = await menese.quickUsdcBridgeSolToEth(BigInt(usdcAmount)) as any;

  if ("ok" in result) {
    console.log("USDC SOL→ETH bridge started! Job ID:", result.ok.jobId);
    console.log("Your USDC ATA:", result.ok.userUsdcAta);
  } else {
    console.error("Bridge failed:", result.err);
  }
  return result;
}

// ── Example usage ────────────────────────────────────────────
async function main() {
  // === ETH → SOL direction ===

  // Bridge 0.01 ETH to SOL (ultrafast, ~2 min)
  await bridgeEthToSol(BigInt("10000000000000000")); // 0.01 ETH in wei

  // Bridge 10 USDC to SOL (ultrafast, ~2 min)
  await bridgeUsdcToSol(BigInt(10_000_000)); // 10 USDC

  // Bridge 5 USDC via CCTP from Arbitrum (official, ~5 min)
  // NOTE: Provide YOUR RPC endpoint for the source chain
  await bridgeCctpUsdc("arbitrum", BigInt(5_000_000), "https://arb1.arbitrum.io/rpc");

  // === SOL → ETH direction ===

  // Bridge 0.5 SOL → ETH (1% slippage)
  await bridgeSolToEth(0.5, 100);

  // Bridge 50 USDC from Solana → ETH
  await bridgeUsdcSolToEth(50_000_000); // 50 USDC
}

main().catch(console.error);
