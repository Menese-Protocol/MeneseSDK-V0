/**
 * MeneseSDK — Universal Send: Transfer tokens on any chain
 *
 * Supported chains and their functions:
 *   - Solana (SOL)        → sendSolTransaction(toAddress, lamports)
 *   - Solana SPL tokens   → transferSplToken(mintAddress, toAddress, amount)
 *   - Ethereum/EVM chains → sendEvmNativeTokenAutonomous(chain, to, amountWei, devKey?)
 *   - ICP                 → sendICP(toPrincipal, e8s)
 *   - Bitcoin              → sendBitcoin(toAddress, satoshis)
 *   - XRP                 → sendXrpAutonomous(toAddress, amountDrops, destTag?)
 *   - SUI                 → sendSui(toAddress, mist)
 *   - TON                 → sendTonSimple(toAddress, nanotons)
 *
 * Cost: $0.05 per send operation (billed to caller or developer key)
 *
 * EVM chains supported: "ethereum", "arbitrum", "base", "polygon", "bsc", "optimism"
 * All EVM chains use the SAME derived address — one key, multiple networks.
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { Principal } from "@dfinity/principal";
import { createMeneseActor } from "./menese-config";

// ── Send SOL ─────────────────────────────────────────────────
async function sendSol(toAddress: string, amountSol: number) {
  const menese = await createMeneseActor();
  const lamports = BigInt(Math.round(amountSol * 1e9));

  console.log(`Sending ${amountSol} SOL to ${toAddress}...`);
  const result = await menese.sendSolTransaction(toAddress, lamports) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
    console.log(`Explorer: https://solscan.io/tx/${result.ok}`);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send SPL Token (USDC, BONK, any Solana token) ───────────
async function sendSplToken(
  mintAddress: string,   // Token mint address (e.g., USDC: EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v)
  toAddress: string,     // Recipient's Solana wallet
  amount: number,        // Amount in token's smallest unit
) {
  const menese = await createMeneseActor();

  console.log(`Sending ${amount} tokens (mint: ${mintAddress}) to ${toAddress}...`);
  const result = await menese.transferSplToken(mintAddress, toAddress, BigInt(amount)) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send ETH / ARB / BASE / MATIC / BNB / OP ────────────────
// All EVM chains use the same function — just pass the chain name.
// Amount is in WEI (1 ETH = 1e18 wei).
async function sendEvmToken(
  chain: string,        // "ethereum" | "arbitrum" | "base" | "polygon" | "bsc" | "optimism"
  toAddress: string,    // 0x... address
  amountWei: string,    // Amount as string (e.g., "1000000000000000" for 0.001 ETH)
  developerKey?: string // Optional: bill your developer account
) {
  const menese = await createMeneseActor();

  console.log(`Sending on ${chain} to ${toAddress}...`);
  const result = await menese.sendEvmNativeTokenAutonomous(
    chain,
    toAddress,
    amountWei,
    developerKey ? [developerKey] : [],
  ) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok.txHash);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send ICP ─────────────────────────────────────────────────
async function sendIcp(toPrincipal: string, amountIcp: number) {
  const menese = await createMeneseActor();
  const e8s = BigInt(Math.round(amountIcp * 1e8));

  console.log(`Sending ${amountIcp} ICP to ${toPrincipal}...`);
  const result = await menese.sendICP(Principal.fromText(toPrincipal), e8s) as any;

  if ("ok" in result) {
    console.log("Success:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Bitcoin ─────────────────────────────────────────────
async function sendBtc(toAddress: string, amountBtc: number) {
  const menese = await createMeneseActor();
  const satoshis = BigInt(Math.round(amountBtc * 1e8));

  console.log(`Sending ${amountBtc} BTC to ${toAddress}...`);
  const result = await menese.sendBitcoin(toAddress, satoshis) as any;

  if ("ok" in result) {
    console.log("TX ID:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send XRP ─────────────────────────────────────────────────
async function sendXrp(
  toAddress: string,     // Classic XRP address (r...)
  amountDrops: string,   // Amount in drops (1 XRP = 1,000,000 drops)
  destinationTag?: number
) {
  const menese = await createMeneseActor();

  console.log(`Sending ${amountDrops} drops to ${toAddress}...`);
  const result = await menese.sendXrpAutonomous(
    toAddress,
    amountDrops,
    destinationTag !== undefined ? [destinationTag] : [],
  ) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok.txHash);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send SUI ─────────────────────────────────────────────────
async function sendSuiTokens(toAddress: string, amountSui: number) {
  const menese = await createMeneseActor();
  const mist = BigInt(Math.round(amountSui * 1e9));

  console.log(`Sending ${amountSui} SUI to ${toAddress}...`);
  const result = await menese.sendSui(toAddress, mist) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok.txHash);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send TON ─────────────────────────────────────────────────
async function sendTon(toAddress: string, amountTon: number) {
  const menese = await createMeneseActor();
  const nanotons = BigInt(Math.round(amountTon * 1e9));

  console.log(`Sending ${amountTon} TON to ${toAddress}...`);
  const result = await menese.sendTonSimple(toAddress, nanotons) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Example usage ────────────────────────────────────────────
async function main() {
  // Send 0.001 SOL
  await sendSol("RecipientSolanaAddressHere", 0.001);

  // Send 1 USDC on Solana
  await sendSplToken(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // USDC mint
    "RecipientSolanaAddressHere",
    1_000_000,  // 1 USDC (6 decimals)
  );

  // Send 0.001 ETH on Arbitrum
  await sendEvmToken("arbitrum", "0xRecipientAddress", "1000000000000000");

  // Send 0.1 ICP
  await sendIcp("xxxxx-xxxxx-xxxxx-xxxxx-cai", 0.1);

  // Send 0.0001 BTC
  await sendBtc("bc1qRecipientBitcoinAddress", 0.0001);

  // Send 1 XRP
  await sendXrp("rRecipientXrpAddress", "1000000");  // 1 XRP = 1M drops

  // Send 0.1 SUI
  await sendSuiTokens("0xRecipientSuiAddress", 0.1);

  // Send 0.1 TON
  await sendTon("EQRecipientTonAddress", 0.1);
}

main().catch(console.error);
