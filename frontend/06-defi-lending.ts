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
 * Cost: 1 action per operation
 *
 * NOTE: You must provide your own Ethereum RPC endpoint.
 * Free public RPCs (Alchemy, Infura, Ankr) work fine.
 */

import { createMeneseActor } from "./sdk-setup";

const ETH_RPC = "https://eth.llamarpc.com"; // Replace with your own RPC

// ══════════════════════════════════════════════════════════════
// AAVE V3 — Lending & Borrowing
// ══════════════════════════════════════════════════════════════

// ── Supply ETH to Aave (earn yield) ──────────────────────────
// Deposits ETH into Aave V3 lending pool. You receive aWETH (interest-bearing).
// Returns: { ok: { ethSupplied, nonce, note, senderAddress, txHash }, err: text }
async function supplyEthToAave(amountEth: number) {
  const menese = await createMeneseActor();
  const wei = BigInt(Math.round(amountEth * 1e18));

  console.log(`Supplying ${amountEth} ETH to Aave V3...`);
  const result = await menese.aaveSupplyEth(wei, ETH_RPC, []);

  if ("ok" in result) {
    console.log("Supply TX:", result.ok.txHash);
    console.log("Supplied:", result.ok.ethSupplied.toString(), "wei");
    console.log("You now earn interest on this deposit.");
  } else {
    console.error("Supply failed:", result.err);
  }
  return result;
}

// ── Withdraw ETH from Aave ──────────────────────────────────
// Burns your aWETH and returns ETH to your wallet.
// Returns: { ok: { approvalTxHash?, ethWithdrawn, nonce, note, senderAddress, txHash }, err: text }
async function withdrawEthFromAave(amountEth: number) {
  const menese = await createMeneseActor();
  const wei = BigInt(Math.round(amountEth * 1e18));

  console.log(`Withdrawing ${amountEth} ETH from Aave V3...`);
  const result = await menese.aaveWithdrawEth(wei, ETH_RPC, []);

  if ("ok" in result) {
    console.log("Withdraw TX:", result.ok.txHash);
    console.log("Withdrawn:", result.ok.ethWithdrawn.toString(), "wei");
  } else {
    console.error("Withdraw failed:", result.err);
  }
  return result;
}

// ── Supply ERC20 token to Aave ──────────────────────────────
// Supply any supported ERC20 token (USDC, USDT, DAI, WBTC, etc.)
// The canister handles the ERC20 approve + supply in one call.
// Returns: { ok: { amountSupplied, approvalTxHash?, nonce, note, senderAddress, tokenAddress, txHash }, err: text }
async function supplyTokenToAave(
  tokenAddress: string,  // ERC20 contract address
  amount: bigint,        // Amount in token's smallest unit
) {
  const menese = await createMeneseActor();

  console.log(`Supplying token ${tokenAddress} to Aave V3...`);
  const result = await menese.aaveSupplyToken(tokenAddress, amount, ETH_RPC, []);

  if ("ok" in result) {
    console.log("Supply TX:", result.ok.txHash);
    console.log("Amount supplied:", result.ok.amountSupplied.toString());
  } else {
    console.error("Supply failed:", result.err);
  }
  return result;
}

// ── Withdraw ERC20 token from Aave ──────────────────────────
// Returns: { ok: { amountWithdrawn, nonce, note, senderAddress, tokenAddress, txHash }, err: text }
async function withdrawTokenFromAave(
  tokenAddress: string,
  amount: bigint,
) {
  const menese = await createMeneseActor();

  console.log(`Withdrawing token ${tokenAddress} from Aave V3...`);
  const result = await menese.aaveWithdrawToken(tokenAddress, amount, ETH_RPC, []);

  if ("ok" in result) {
    console.log("Withdraw TX:", result.ok.txHash);
    console.log("Amount withdrawn:", result.ok.amountWithdrawn.toString());
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
// Returns: { ok: { ethStaked, nonce, note, senderAddress, txHash }, err: text }
async function stakeEth(amountEth: number) {
  const menese = await createMeneseActor();
  const wei = BigInt(Math.round(amountEth * 1e18));

  console.log(`Staking ${amountEth} ETH with Lido...`);
  const result = await menese.stakeEthForStEth(wei, ETH_RPC, []);

  if ("ok" in result) {
    console.log("Stake TX:", result.ok.txHash);
    console.log("ETH staked:", result.ok.ethStaked.toString(), "wei");
    console.log("You now hold stETH that earns staking rewards.");
  } else {
    console.error("Staking failed:", result.err);
  }
  return result;
}

// ── Wrap stETH → wstETH ─────────────────────────────────────
// wstETH doesn't rebase — the value per token increases instead.
// Better for DeFi composability (Aave accepts wstETH as collateral).
// Returns: { ok: { approvalTxHash?, nonce, note, senderAddress, stEthWrapped, txHash }, err: text }
async function wrapStEthExample(amountStEth: bigint) {
  const menese = await createMeneseActor();

  console.log("Wrapping stETH → wstETH...");
  const result = await menese.wrapStEth(amountStEth, ETH_RPC, []);

  if ("ok" in result) {
    console.log("Wrap TX:", result.ok.txHash);
    console.log("stETH wrapped:", result.ok.stEthWrapped.toString(), "wei");
  } else {
    console.error("Wrap failed:", result.err);
  }
  return result;
}

// ── Unwrap wstETH → stETH ───────────────────────────────────
// Returns: { ok: { nonce, note, senderAddress, txHash, wstEthUnwrapped }, err: text }
async function unwrapWstEthExample(amountWstEth: bigint) {
  const menese = await createMeneseActor();

  console.log("Unwrapping wstETH → stETH...");
  const result = await menese.unwrapWstEth(amountWstEth, ETH_RPC, []);

  if ("ok" in result) {
    console.log("Unwrap TX:", result.ok.txHash);
    console.log("wstETH unwrapped:", result.ok.wstEthUnwrapped.toString(), "wei");
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
  await wrapStEthExample(BigInt("500000000000000000")); // 0.5 stETH

  // Unwrap back: wstETH → stETH
  await unwrapWstEthExample(BigInt("450000000000000000")); // ~0.45 wstETH

  // ── Check DeFi Position Balances ───────────────────────────
  const actor = await createMeneseActor();
  const evmInfo = await actor.getMyEvmAddress();
  const userAddr = evmInfo.evmAddress;

  // Aave: check aWETH balance (your supplied ETH earning yield)
  const aWethBal = await actor.getAWethBalance(userAddr, ETH_RPC);
  if ("ok" in aWethBal) console.log(`aWETH balance: ${aWethBal.ok} wei`);

  // Lido: check stETH balance
  const stEthBal = await actor.getStEthBalance(userAddr, ETH_RPC);
  if ("ok" in stEthBal) console.log(`stETH balance: ${stEthBal.ok} wei`);

  // Lido: check wstETH balance
  const wstEthBal = await actor.getWstEthBalance(userAddr, ETH_RPC);
  if ("ok" in wstEthBal) console.log(`wstETH balance: ${wstEthBal.ok} wei`);
}

main().catch(console.error);
