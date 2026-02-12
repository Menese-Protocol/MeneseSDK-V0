/**
 * MeneseSDK — Liquidity Management: Uniswap V3 + ICP DEXes
 *
 * EVM Liquidity (Uniswap V3 on Ethereum, Arbitrum, Base, etc.):
 *   - addLiquidityETH(tokenSymbol, amountTokenDesired, amountETHDesired, slippageBps, rpcEndpoint, quoteId?)
 *   - addLiquidity(tokenASymbol, tokenBSymbol, amountADesired, amountBDesired, slippageBps, rpcEndpoint, quoteId?)
 *   - removeLiquidityETH(tokenSymbol, lpTokenAmount, slippageBps, useFeeOnTransfer, rpcEndpoint, quoteId?)
 *   - removeLiquidity(tokenASymbol, tokenBSymbol, lpTokenAmount, slippageBps, rpcEndpoint, quoteId?)
 *
 * ICP Liquidity (ICPSwap + KongSwap):
 *   - addICPLiquidity(request: AddLiquidityRequest)
 *   - removeICPLiquidity(request: RemoveLiquidityRequest)
 *   - getICPLPPositions()
 *
 * Cost: $0.10 per operation (sign + HTTP outcalls)
 *
 * NOTE: LP operations involve approve + deposit in a single call.
 * The canister handles token approvals automatically.
 *
 * Tested: Feb 12, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor } from "./menese-config";

const ETH_RPC = "https://eth.llamarpc.com";
const ARB_RPC = "https://arb1.arbitrum.io/rpc";

// ══════════════════════════════════════════════════════════════
// UNISWAP V3 — EVM Liquidity
// ══════════════════════════════════════════════════════════════

// ── Add Liquidity: Token + ETH ──────────────────────────────
// Pairs a token with native ETH. The canister handles:
//   1. Token approval (if needed)
//   2. addLiquidityETH call to Uniswap V3 Router
// Returns: { ok: { txHash, senderAddress, nonce, tokenAddress,
//   amountTokenDesired, amountETHDesired, amountTokenMin, amountETHMin,
//   approvalTxHash?, note }, err: text }
async function addLiquidityWithETH(
  tokenSymbol: string,           // e.g., "USDC"
  amountTokenDesired: bigint,    // Token amount in smallest unit
  amountETHDesired: bigint,      // ETH amount in wei
  slippageBps: number,           // Slippage (100 = 1%)
  rpcEndpoint: string,
) {
  const menese = await createMeneseActor();

  console.log(`Adding liquidity: ${tokenSymbol} + ETH...`);
  const result = await menese.addLiquidityETH(
    tokenSymbol,
    amountTokenDesired,
    amountETHDesired,
    BigInt(slippageBps),
    rpcEndpoint,
    [],  // quoteId: optional
  ) as any;

  if ("ok" in result) {
    console.log("LP TX:", result.ok.txHash);
    console.log("Token:", result.ok.tokenAddress);
    console.log("Token desired:", result.ok.amountTokenDesired);
    console.log("ETH desired:", result.ok.amountETHDesired);
    if (result.ok.approvalTxHash?.[0]) {
      console.log("Approval TX:", result.ok.approvalTxHash[0]);
    }
    console.log("LP tokens minted to your address.");
  } else {
    console.error("Add liquidity failed:", result.err);
  }
  return result;
}

// ── Add Liquidity: Token + Token ────────────────────────────
// Pairs two ERC20 tokens. Handles both token approvals.
// Returns: { ok: { txHash, senderAddress, nonce, tokenA, tokenB,
//   amountADesired, amountBDesired, amountAMin, amountBMin,
//   approvalTxHashA?, approvalTxHashB?, note }, err: text }
async function addTokenPairLiquidity(
  tokenASymbol: string,
  tokenBSymbol: string,
  amountADesired: bigint,
  amountBDesired: bigint,
  slippageBps: number,
  rpcEndpoint: string,
) {
  const menese = await createMeneseActor();

  console.log(`Adding liquidity: ${tokenASymbol} + ${tokenBSymbol}...`);
  const result = await menese.addLiquidity(
    tokenASymbol,
    tokenBSymbol,
    amountADesired,
    amountBDesired,
    BigInt(slippageBps),
    rpcEndpoint,
    [],  // quoteId: optional
  ) as any;

  if ("ok" in result) {
    console.log("LP TX:", result.ok.txHash);
    console.log(`${result.ok.tokenA} + ${result.ok.tokenB} paired.`);
    console.log("LP tokens minted to your address.");
  } else {
    console.error("Add liquidity failed:", result.err);
  }
  return result;
}

// ── Remove Liquidity: Token + ETH ───────────────────────────
// Burns LP tokens and returns token + ETH.
// Returns: { ok: { txHash, senderAddress, nonce, tokenAddress,
//   lpTokensBurned, minTokenOut, minETHOut, approvalTxHash?, note }, err: text }
async function removeLiquidityWithETH(
  tokenSymbol: string,
  lpTokenAmount: bigint,         // LP tokens to burn
  slippageBps: number,
  rpcEndpoint: string,
) {
  const menese = await createMeneseActor();

  console.log(`Removing ${tokenSymbol}/ETH liquidity...`);
  const result = await menese.removeLiquidityETH(
    tokenSymbol,
    lpTokenAmount,
    BigInt(slippageBps),
    false,       // useFeeOnTransfer: true for rebase/tax tokens
    rpcEndpoint,
    [],          // quoteId: optional
  ) as any;

  if ("ok" in result) {
    console.log("Remove TX:", result.ok.txHash);
    console.log("LP burned:", result.ok.lpTokensBurned);
    console.log("Min token out:", result.ok.minTokenOut);
    console.log("Min ETH out:", result.ok.minETHOut);
  } else {
    console.error("Remove liquidity failed:", result.err);
  }
  return result;
}

// ── Remove Liquidity: Token + Token ─────────────────────────
// Returns: { ok: { txHash, senderAddress, nonce, tokenA, tokenB,
//   lpTokensBurned, minAmountAOut, minAmountBOut, approvalTxHash?, note }, err: text }
async function removeTokenPairLiquidity(
  tokenASymbol: string,
  tokenBSymbol: string,
  lpTokenAmount: bigint,
  slippageBps: number,
  rpcEndpoint: string,
) {
  const menese = await createMeneseActor();

  console.log(`Removing ${tokenASymbol}/${tokenBSymbol} liquidity...`);
  const result = await menese.removeLiquidity(
    tokenASymbol,
    tokenBSymbol,
    lpTokenAmount,
    BigInt(slippageBps),
    rpcEndpoint,
    [],
  ) as any;

  if ("ok" in result) {
    console.log("Remove TX:", result.ok.txHash);
  } else {
    console.error("Remove liquidity failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// ICP DEX — ICPSwap + KongSwap Liquidity
// ══════════════════════════════════════════════════════════════

// ── View LP Positions ───────────────────────────────────────
async function viewICPLPPositions() {
  const menese = await createMeneseActor();

  const positions = await menese.getICPLPPositions() as any[];
  console.log(`You have ${positions.length} LP positions on ICP DEXes:`);
  for (const pos of positions) {
    console.log(`  Pool: ${pos.tokenA}/${pos.tokenB} | Shares: ${pos.shares}`);
  }
  return positions;
}

// ── Add ICP DEX Liquidity ───────────────────────────────────
// AddLiquidityRequest = { tokenA, tokenB, amountA, amountB, slippagePct, preferredDex? }
async function addICPDexLiquidity(
  tokenA: string,      // Token canister ID
  tokenB: string,      // Token canister ID
  amountA: bigint,
  amountB: bigint,
  slippagePct: number,
) {
  const menese = await createMeneseActor();

  console.log("Adding liquidity to ICP DEX...");
  const result = await menese.addICPLiquidity({
    tokenA,
    tokenB,
    amountA,
    amountB,
    slippagePct,
    preferredDex: [],  // auto-route
  }) as any;

  if ("ok" in result) {
    console.log("LP added! Shares:", result.ok.shares?.toString());
  } else {
    console.error("Add LP failed:", result.err);
  }
  return result;
}

// ── Remove ICP DEX Liquidity ────────────────────────────────
// RemoveLiquidityRequest = { tokenA, tokenB, shares, slippagePct, preferredDex? }
async function removeICPDexLiquidity(
  tokenA: string,
  tokenB: string,
  shares: bigint,
  slippagePct: number,
) {
  const menese = await createMeneseActor();

  console.log("Removing liquidity from ICP DEX...");
  const result = await menese.removeICPLiquidity({
    tokenA,
    tokenB,
    shares,
    slippagePct,
    preferredDex: [],
  }) as any;

  if ("ok" in result) {
    console.log("LP removed!");
  } else {
    console.error("Remove LP failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ══════════════════════════════════════════════════════════════

const ICP_LEDGER = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const CKBTC_LEDGER = "mxzaz-hqaaa-aaaar-qaada-cai";

async function main() {
  // === Uniswap V3 (Ethereum) ===

  // Add 1000 USDC + 0.5 ETH to Uniswap V3 pool (1% slippage)
  await addLiquidityWithETH(
    "USDC",
    BigInt(1000_000_000),              // 1000 USDC (6 decimals)
    BigInt("500000000000000000"),       // 0.5 ETH in wei
    100,                                // 1% slippage
    ETH_RPC,
  );

  // Add USDC + USDT liquidity (token-token pair)
  await addTokenPairLiquidity(
    "USDC", "USDT",
    BigInt(500_000_000),   // 500 USDC
    BigInt(500_000_000),   // 500 USDT
    50,                     // 0.5% slippage
    ETH_RPC,
  );

  // Remove USDC/ETH liquidity (burn LP tokens)
  await removeLiquidityWithETH(
    "USDC",
    BigInt("1000000000000000000"),  // LP token amount
    100,
    ETH_RPC,
  );

  // === ICP DEX ===

  // View existing LP positions
  await viewICPLPPositions();

  // Add ICP + ckBTC liquidity
  await addICPDexLiquidity(
    ICP_LEDGER,
    CKBTC_LEDGER,
    BigInt(100_000_000),   // 1 ICP (8 decimals)
    BigInt(10_000),        // 0.0001 ckBTC (8 decimals)
    1.0,                    // 1% slippage
  );
}

main().catch(console.error);
