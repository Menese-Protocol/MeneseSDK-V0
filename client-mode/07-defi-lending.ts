/**
 * MeneseSDK — DeFi Lending: Aave V3 + Lido Staking
 *
 * Aave V3 (Ethereum mainnet):
 *   - aaveSupplyEth(ethAmountWei, rpcEndpoint, quoteId?)        → Supply ETH, receive aWETH
 *   - aaveWithdrawEth(amountWei, rpcEndpoint, quoteId?)         → Burn aWETH, receive ETH
 *   - aaveSupplyToken(tokenAddress, amount, rpcEndpoint, quoteId?) → Supply ERC20 token
 *   - aaveWithdrawToken(tokenAddress, amount, rpcEndpoint, quoteId?) → Withdraw ERC20 token
 *
 * Lido (Ethereum mainnet):
 *   - stakeEthForStEth(ethAmountWei, rpcEndpoint, quoteId?)     → Stake ETH, receive stETH
 *   - wrapStEth(amountStEth, rpcEndpoint, quoteId?)             → Wrap stETH → wstETH
 *   - unwrapWstEth(amountWstEth, rpcEndpoint, quoteId?)         → Unwrap wstETH → stETH
 *
 * Cost: $0.10 per operation (Agent Mode — these use HTTP outcalls)
 *
 * NOTE: You must provide your own Ethereum RPC endpoint.
 * Free public RPCs (Alchemy, Infura, Ankr) work fine.
 *
 * Tested: Feb 12, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor } from "./menese-config";

const ETH_RPC = "https://eth.llamarpc.com"; // Replace with your own RPC

// ══════════════════════════════════════════════════════════════
// AAVE V3 — Lending & Borrowing
// ══════════════════════════════════════════════════════════════

// ── Supply ETH to Aave (earn yield) ──────────────────────────
// Deposits ETH into Aave V3 lending pool. You receive aWETH (interest-bearing).
// Returns: { ok: SupplyEthResult, err: text }
//   SupplyEthResult = { txHash, aTokenAddress, suppliedAmount, senderAddress, note }
async function supplyEthToAave(amountEth: number) {
  const menese = await createMeneseActor();
  const wei = BigInt(Math.round(amountEth * 1e18));

  console.log(`Supplying ${amountEth} ETH to Aave V3...`);
  const result = await menese.aaveSupplyEth(wei, ETH_RPC, []) as any;

  if ("ok" in result) {
    console.log("Supply TX:", result.ok.txHash);
    console.log("aWETH address:", result.ok.aTokenAddress);
    console.log("Supplied:", result.ok.suppliedAmount, "wei");
    console.log("You now earn interest on this deposit.");
  } else {
    console.error("Supply failed:", result.err);
  }
  return result;
}

// ── Withdraw ETH from Aave ──────────────────────────────────
// Burns your aWETH and returns ETH to your wallet.
// Returns: { ok: WithdrawEthResult, err: text }
//   WithdrawEthResult = { txHash, withdrawnAmount, senderAddress, note }
async function withdrawEthFromAave(amountEth: number) {
  const menese = await createMeneseActor();
  const wei = BigInt(Math.round(amountEth * 1e18));

  console.log(`Withdrawing ${amountEth} ETH from Aave V3...`);
  const result = await menese.aaveWithdrawEth(wei, ETH_RPC, []) as any;

  if ("ok" in result) {
    console.log("Withdraw TX:", result.ok.txHash);
    console.log("Withdrawn:", result.ok.withdrawnAmount, "wei");
  } else {
    console.error("Withdraw failed:", result.err);
  }
  return result;
}

// ── Supply ERC20 token to Aave ──────────────────────────────
// Supply any supported ERC20 token (USDC, USDT, DAI, WBTC, etc.)
// The canister handles the ERC20 approve + supply in one call.
// Returns: { ok: SupplyTokenResult, err: text }
async function supplyTokenToAave(
  tokenAddress: string,  // ERC20 contract address
  amount: bigint,        // Amount in token's smallest unit
) {
  const menese = await createMeneseActor();

  console.log(`Supplying token ${tokenAddress} to Aave V3...`);
  const result = await menese.aaveSupplyToken(tokenAddress, amount, ETH_RPC, []) as any;

  if ("ok" in result) {
    console.log("Supply TX:", result.ok.txHash);
  } else {
    console.error("Supply failed:", result.err);
  }
  return result;
}

// ── Withdraw ERC20 token from Aave ──────────────────────────
async function withdrawTokenFromAave(
  tokenAddress: string,
  amount: bigint,
) {
  const menese = await createMeneseActor();

  console.log(`Withdrawing token ${tokenAddress} from Aave V3...`);
  const result = await menese.aaveWithdrawToken(tokenAddress, amount, ETH_RPC, []) as any;

  if ("ok" in result) {
    console.log("Withdraw TX:", result.ok.txHash);
  } else {
    console.error("Withdraw failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// LIDO — ETH Staking
// ══════════════════════════════════════════════════════════════

// ── Stake ETH → stETH ───────────────────────────────────────
// Stake ETH with Lido to earn staking rewards (~3-4% APY).
// stETH balance rebases daily (increases automatically).
// Returns: { ok: StakeResult, err: text }
async function stakeEth(amountEth: number) {
  const menese = await createMeneseActor();
  const wei = BigInt(Math.round(amountEth * 1e18));

  console.log(`Staking ${amountEth} ETH with Lido...`);
  const result = await menese.stakeEthForStEth(wei, ETH_RPC, []) as any;

  if ("ok" in result) {
    console.log("Stake TX:", result.ok.txHash);
    console.log("You now hold stETH that earns staking rewards.");
  } else {
    console.error("Staking failed:", result.err);
  }
  return result;
}

// ── Wrap stETH → wstETH ─────────────────────────────────────
// wstETH doesn't rebase — the value per token increases instead.
// Better for DeFi composability (Aave accepts wstETH as collateral).
// Returns: { ok: WrapResult, err: text }
async function wrapStEth(amountStEth: bigint) {
  const menese = await createMeneseActor();

  console.log("Wrapping stETH → wstETH...");
  const result = await menese.wrapStEth(amountStEth, ETH_RPC, []) as any;

  if ("ok" in result) {
    console.log("Wrap TX:", result.ok.txHash);
  } else {
    console.error("Wrap failed:", result.err);
  }
  return result;
}

// ── Unwrap wstETH → stETH ───────────────────────────────────
// Returns: { ok: UnwrapResult, err: text }
async function unwrapWstEth(amountWstEth: bigint) {
  const menese = await createMeneseActor();

  console.log("Unwrapping wstETH → stETH...");
  const result = await menese.unwrapWstEth(amountWstEth, ETH_RPC, []) as any;

  if ("ok" in result) {
    console.log("Unwrap TX:", result.ok.txHash);
  } else {
    console.error("Unwrap failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ══════════════════════════════════════════════════════════════

const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

async function main() {
  // === Aave V3 ===

  // Supply 0.1 ETH to Aave (earn ~2-3% APY)
  await supplyEthToAave(0.1);

  // Supply 100 USDC to Aave
  await supplyTokenToAave(USDC_ETH, BigInt(100_000_000)); // 100 USDC (6 decimals)

  // Withdraw 0.05 ETH from Aave
  await withdrawEthFromAave(0.05);

  // Withdraw 50 USDC from Aave
  await withdrawTokenFromAave(USDC_ETH, BigInt(50_000_000));

  // === Lido ===

  // Stake 0.5 ETH → stETH (earns ~3-4% APY)
  await stakeEth(0.5);

  // Wrap stETH → wstETH (for DeFi composability)
  // Use the stETH amount in wei
  await wrapStEth(BigInt("500000000000000000")); // 0.5 stETH

  // Unwrap back: wstETH → stETH
  await unwrapWstEth(BigInt("450000000000000000")); // ~0.45 wstETH
}

main().catch(console.error);
