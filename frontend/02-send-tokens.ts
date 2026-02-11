/**
 * MeneseSDK — Universal Send: Transfer tokens on any chain
 *
 * Supported chains and their functions:
 *   - Solana (SOL)        → sendSolTransaction(toAddress, lamports)
 *   - Solana SPL tokens   → transferSplToken(mintAddress, toAddress, amount)
 *   - Ethereum/EVM chains → sendEvmNativeTokenAutonomous(chain, to, amountWei, devKey?)
 *   - ICP                 → sendICP(toPrincipal, e8s)
 *   - ICP ICRC-1 tokens   → sendICRC1(toPrincipal, amount, ledgerCanisterId)
 *   - Bitcoin              → sendBitcoin(toAddress, satoshis) / sendBitcoinDynamicFee / sendBitcoinWithFee
 *   - XRP                 → sendXrpAutonomous(toAddress, amountXrp, destTag?)
 *   - XRP IOU tokens      → sendXrpIOU(toAddress, currency, issuer, amount, destTag?)
 *   - SUI                 → sendSui(toAddress, mist) / sendSuiMax / transferSuiCoin
 *   - TON                 → sendTonSimple(toAddress, nanotons) / sendTon / sendTonWithComment
 *   - Cardano (ADA)       → sendCardanoTransaction(toAddress, lovelace)
 *   - Tron (TRX)          → sendTrx(toAddress, sun)
 *   - Tron TRC-20 tokens  → sendTrc20(contractAddress, toAddress, amount, feeLimit)
 *   - Aptos (APT)         → sendAptos(toAddress, octas)
 *   - Litecoin (LTC)      → sendLitecoin(toAddress, litoshis) / sendLitecoinWithFee
 *   - Near (NEAR)         → sendNearTransferFromUser(receiverId, yoctoNear)
 *   - CloakCoin (CLOAK)   → sendCloak(toAddress, amount)
 *   - Thorchain (RUNE)    → sendThor(toAddress, amount, memo)
 *
 * Cost: $0.05 per send operation (billed to caller or developer key)
 *
 * EVM chains supported: "ethereum", "arbitrum", "base", "polygon", "bsc", "optimism"
 * All EVM chains use the SAME derived address — one key, multiple networks.
 * All 19 chains have native transaction building — no external signing needed.
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

// ── Send Cardano (ADA) ──────────────────────────────────────
async function sendAda(toAddress: string, amountAda: number) {
  const menese = await createMeneseActor();
  const lovelace = BigInt(Math.round(amountAda * 1e6));

  console.log(`Sending ${amountAda} ADA to ${toAddress}...`);
  const result = await menese.sendCardanoTransaction(toAddress, lovelace) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Tron (TRX) ────────────────────────────────────────
async function sendTrx(toAddress: string, amountTrx: number) {
  const menese = await createMeneseActor();
  const sun = BigInt(Math.round(amountTrx * 1e6)); // 1 TRX = 1,000,000 sun

  console.log(`Sending ${amountTrx} TRX to ${toAddress}...`);
  const result = await menese.sendTrx(toAddress, sun) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send TRC-20 Token (USDT on Tron, etc.) ─────────────────
async function sendTrc20Token(
  contractAddress: string, // TRC-20 contract (e.g., USDT: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
  toAddress: string,
  amount: number,
  feeLimit: number = 30_000_000, // Default 30 TRX fee limit
) {
  const menese = await createMeneseActor();

  console.log(`Sending TRC-20 to ${toAddress}...`);
  const result = await menese.sendTrc20(contractAddress, toAddress, BigInt(amount), BigInt(feeLimit)) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Aptos (APT) ───────────────────────────────────────
async function sendApt(toAddress: string, amountApt: number) {
  const menese = await createMeneseActor();
  const octas = BigInt(Math.round(amountApt * 1e8)); // 1 APT = 1e8 octas

  console.log(`Sending ${amountApt} APT to ${toAddress}...`);
  const result = await menese.sendAptos(toAddress, octas) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Litecoin (LTC) ────────────────────────────────────
async function sendLtc(toAddress: string, amountLtc: number) {
  const menese = await createMeneseActor();
  const litoshis = BigInt(Math.round(amountLtc * 1e8));

  console.log(`Sending ${amountLtc} LTC to ${toAddress}...`);
  const result = await menese.sendLitecoin(toAddress, litoshis) as any;

  if ("ok" in result) {
    console.log("TX ID:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Near (NEAR) ───────────────────────────────────────
async function sendNear(receiverId: string, amountNear: number) {
  const menese = await createMeneseActor();
  // 1 NEAR = 1e24 yoctoNEAR
  const yocto = BigInt(Math.round(amountNear * 1e6)) * BigInt(1e18);

  console.log(`Sending ${amountNear} NEAR to ${receiverId}...`);
  const result = await menese.sendNearTransferFromUser(receiverId, yocto) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send CloakCoin (CLOAK) ─────────────────────────────────
async function sendCloak(toAddress: string, amount: number) {
  const menese = await createMeneseActor();

  console.log(`Sending ${amount} CLOAK to ${toAddress}...`);
  const result = await menese.sendCloak(toAddress, BigInt(amount)) as any;

  if ("ok" in result) {
    console.log("TX ID:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Thorchain (RUNE) ──────────────────────────────────
async function sendRune(toAddress: string, amountRune: number, memo: string = "") {
  const menese = await createMeneseActor();
  const baseAmount = BigInt(Math.round(amountRune * 1e8)); // 1 RUNE = 1e8 base units

  console.log(`Sending ${amountRune} RUNE to ${toAddress}...`);
  const result = await menese.sendThor(toAddress, baseAmount, memo) as any;

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

  // Send 5 ADA (Cardano)
  await sendAda("addr1qRecipientCardanoAddress", 5);

  // Send 10 TRX (Tron)
  await sendTrx("TRecipientTronAddress", 10);

  // Send 10 USDT on Tron (TRC-20)
  await sendTrc20Token("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "TRecipientAddr", 10_000_000);

  // Send 0.1 APT (Aptos)
  await sendApt("0xRecipientAptosAddress", 0.1);

  // Send 0.01 LTC (Litecoin)
  await sendLtc("ltc1qRecipientLitecoinAddress", 0.01);

  // Send 0.1 NEAR
  await sendNear("recipient.near", 0.1);

  // Send 100 CLOAK
  await sendCloak("CloakRecipientAddress", 100);

  // Send 1 RUNE (Thorchain)
  await sendRune("thor1RecipientAddress", 1, "");
}

main().catch(console.error);
