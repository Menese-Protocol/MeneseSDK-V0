/**
 * MeneseSDK — Universal Send: Transfer tokens on any of the 19 chains
 *
 * Supported chains and their functions:
 *   - Solana (SOL)        → sendSolTransaction(toAddress, lamports)
 *   - Solana SPL tokens   → transferSplToken(amount, sourceAta, destAta)
 *                            NOTE: params are (amount, YOUR ata, THEIR ata) — not (mint, to, amount)
 *   - EVM (6 chains)      → sendEvmNativeTokenAutonomous(to, valueWei, rpcEndpoint, chainId, quoteId?)
 *                            NOTE: 5 params with RPC + chainId — not a chain name
 *   - ICP                 → sendICP(toPrincipal, e8s)
 *   - ICP ICRC-1 tokens   → sendICRC1(toPrincipal, amount, ledgerCanisterId)
 *   - Bitcoin              → sendBitcoin(toAddress, satoshis) / sendBitcoinDynamicFee / sendBitcoinWithFee
 *   - XRP                 → sendXrpAutonomous(destAddress, amountXrp, destTag?)
 *   - XRP IOU tokens      → sendXrpIOU(destAddress, currency, issuer, amount, destTag?)
 *   - SUI                 → sendSui(recipientAddress, mist) / sendSuiMax / transferSuiCoin
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
 * EVM chains: chainId 1 (ETH), 42161 (ARB), 8453 (BASE), 137 (POLY), 56 (BSC), 10 (OP)
 * All EVM chains use the SAME derived address — one key, multiple networks.
 * All 19 chains have native transaction building — no external signing needed.
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { Principal } from "@dfinity/principal";
import { createMeneseActor } from "./menese-config";

// ── EVM chain config ─────────────────────────────────────────
// sendEvmNativeTokenAutonomous requires the actual RPC endpoint and chain ID
const EVM_CHAINS: Record<string, { chainId: number; rpc: string }> = {
  ethereum:  { chainId: 1,     rpc: "https://eth.llamarpc.com" },
  arbitrum:  { chainId: 42161, rpc: "https://arb1.arbitrum.io/rpc" },
  base:      { chainId: 8453,  rpc: "https://mainnet.base.org" },
  polygon:   { chainId: 137,   rpc: "https://polygon-rpc.com" },
  bsc:       { chainId: 56,    rpc: "https://bsc-dataseed1.binance.org" },
  optimism:  { chainId: 10,    rpc: "https://mainnet.optimism.io" },
};

// ── Send SOL ─────────────────────────────────────────────────
// Returns: Result = { ok: text (txHash), err: text }
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
// IMPORTANT: transferSplToken takes (amount, sourceAta, destinationAta)
// You must know both ATAs. Use getMySolanaAta(mint) to get yours.
// Create ATAs first with createMySolanaAtaForMint if they don't exist.
// Returns: TransferAndSendResult = { txSignature, serializedTxBase64, blockhash }
async function sendSplToken(
  sourceAta: string,       // YOUR ATA for this token (get via getMySolanaAta)
  destinationAta: string,  // Recipient's ATA for this token
  amount: number,          // Amount in token's smallest unit
) {
  const menese = await createMeneseActor();

  console.log(`Sending ${amount} tokens from ${sourceAta} to ${destinationAta}...`);
  const result = await menese.transferSplToken(BigInt(amount), sourceAta, destinationAta) as any;

  console.log("TX signature:", result.txSignature);
  return result;
}

// ── Send ETH / ARB / BASE / MATIC / BNB / OP ────────────────
// sendEvmNativeTokenAutonomous(to, value, rpcEndpoint, chainId, quoteId?)
// Returns: { ok: { expectedTxHash, nonce, senderAddress, note }, err: text }
async function sendEvmToken(
  chain: string,        // "ethereum" | "arbitrum" | "base" | "polygon" | "bsc" | "optimism"
  toAddress: string,    // 0x... address
  amountWei: bigint,    // Amount in wei (1 ETH = 1e18 wei)
) {
  const menese = await createMeneseActor();
  const config = EVM_CHAINS[chain];
  if (!config) throw new Error(`Unknown chain: ${chain}`);

  console.log(`Sending on ${chain} to ${toAddress}...`);
  const result = await menese.sendEvmNativeTokenAutonomous(
    toAddress,
    amountWei,
    config.rpc,
    BigInt(config.chainId),
    [],  // quoteId: optional
  ) as any;

  if ("ok" in result) {
    console.log("Expected TX hash:", result.ok.expectedTxHash);
    console.log("Nonce:", result.ok.nonce.toString());
    console.log("From:", result.ok.senderAddress);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send ICP ─────────────────────────────────────────────────
// Returns: { ok: { amount, blockHeight, fee, from, to }, err: text }
async function sendIcp(toPrincipal: string, amountIcp: number) {
  const menese = await createMeneseActor();
  const e8s = BigInt(Math.round(amountIcp * 1e8));

  console.log(`Sending ${amountIcp} ICP to ${toPrincipal}...`);
  const result = await menese.sendICP(Principal.fromText(toPrincipal), e8s) as any;

  if ("ok" in result) {
    console.log("Block height:", result.ok.blockHeight.toString());
    console.log("Amount:", Number(result.ok.amount) / 1e8, "ICP");
    console.log("Fee:", Number(result.ok.fee) / 1e8, "ICP");
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Bitcoin ─────────────────────────────────────────────
// Returns: { ok: { txid, amount, fee, senderAddress, recipientAddress, note }, err: text }
async function sendBtc(toAddress: string, amountBtc: number) {
  const menese = await createMeneseActor();
  const satoshis = BigInt(Math.round(amountBtc * 1e8));

  console.log(`Sending ${amountBtc} BTC to ${toAddress}...`);
  const result = await menese.sendBitcoin(toAddress, satoshis) as any;

  if ("ok" in result) {
    console.log("TX ID:", result.ok.txid);
    console.log("Fee:", Number(result.ok.fee), "satoshis");
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send XRP ─────────────────────────────────────────────────
// Returns: SendResultXrp (flat record, NOT Result variant)
// Fields: { txHash, explorerUrl, message, success, sequence, ledgerUsed }
async function sendXrp(
  toAddress: string,     // Classic XRP address (r...)
  amountXrp: string,     // Amount as string (e.g., "1.5" for 1.5 XRP)
  destinationTag?: number
) {
  const menese = await createMeneseActor();

  console.log(`Sending ${amountXrp} XRP to ${toAddress}...`);
  const result = await menese.sendXrpAutonomous(
    toAddress,
    amountXrp,
    destinationTag !== undefined ? [destinationTag] : [],
  ) as any;

  // NOT a variant — it's a flat record
  if (result.success) {
    console.log("TX hash:", result.txHash);
    console.log("Explorer:", result.explorerUrl);
  } else {
    console.error("Failed:", result.message);
  }
  return result;
}

// ── Send SUI ─────────────────────────────────────────────────
// Returns: { ok: { txHash, senderAddress, note }, err: text }
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
// Returns: SendResultTon (flat record, NOT Result variant)
// Fields: { txHash, bocBase64, senderAddress, success, error }
async function sendTon(toAddress: string, amountTon: number) {
  const menese = await createMeneseActor();
  const nanotons = BigInt(Math.round(amountTon * 1e9));

  console.log(`Sending ${amountTon} TON to ${toAddress}...`);
  const result = await menese.sendTonSimple(toAddress, nanotons) as any;

  // NOT a variant — it's a flat record
  if (result.success) {
    console.log("TX hash:", result.txHash);
  } else {
    console.error("Failed:", result.error?.[0] || "Unknown error");
  }
  return result;
}

// ── Send Cardano (ADA) ──────────────────────────────────────
// Returns: Result = { ok: text (txHash), err: text }
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
// Returns: Result = { ok: text, err: text }
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
// Returns: Result = { ok: text, err: text }
async function sendTrc20Token(
  contractAddress: string, // TRC-20 contract (e.g., USDT: TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
  toAddress: string,
  amount: bigint,           // Amount in token smallest unit (Nat, not Nat64)
  feeLimit: number = 30_000_000, // Default 30 TRX fee limit
) {
  const menese = await createMeneseActor();

  console.log(`Sending TRC-20 to ${toAddress}...`);
  const result = await menese.sendTrc20(contractAddress, toAddress, amount, BigInt(feeLimit)) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Aptos (APT) ───────────────────────────────────────
// Returns: { ok: { txHash, senderAddress, note }, err: text }
async function sendApt(toAddress: string, amountApt: number) {
  const menese = await createMeneseActor();
  const octas = BigInt(Math.round(amountApt * 1e8)); // 1 APT = 1e8 octas

  console.log(`Sending ${amountApt} APT to ${toAddress}...`);
  const result = await menese.sendAptos(toAddress, octas) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok.txHash);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Litecoin (LTC) ────────────────────────────────────
// Returns: { ok: { txHash, senderAddress, note }, err: text }
async function sendLtc(toAddress: string, amountLtc: number) {
  const menese = await createMeneseActor();
  const litoshis = BigInt(Math.round(amountLtc * 1e8));

  console.log(`Sending ${amountLtc} LTC to ${toAddress}...`);
  const result = await menese.sendLitecoin(toAddress, litoshis) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok.txHash);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Near (NEAR) ───────────────────────────────────────
// Returns: Result = { ok: text, err: text }
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
// Returns: { ok: { txHash, txHex, changeValue }, err: text }
async function sendCloak(toAddress: string, amount: number) {
  const menese = await createMeneseActor();

  console.log(`Sending ${amount} CLOAK to ${toAddress}...`);
  const result = await menese.sendCloak(toAddress, BigInt(amount)) as any;

  if ("ok" in result) {
    console.log("TX hash:", result.ok.txHash);
  } else {
    console.error("Failed:", result.err);
  }
  return result;
}

// ── Send Thorchain (RUNE) ──────────────────────────────────
// Returns: Result = { ok: text, err: text }
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

  // Send 1 USDC on Solana (need your ATA and recipient's ATA)
  // First get your ATA: const myAta = await menese.getMySolanaAta("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
  await sendSplToken(
    "YourUSDCAtaAddressHere",          // Your ATA for USDC
    "RecipientUSDCAtaAddressHere",     // Recipient's ATA for USDC
    1_000_000,                          // 1 USDC (6 decimals)
  );

  // Send 0.001 ETH on Arbitrum (chainId 42161)
  await sendEvmToken("arbitrum", "0xRecipientAddress", BigInt("1000000000000000"));

  // Send 0.1 ICP
  await sendIcp("xxxxx-xxxxx-xxxxx-xxxxx-cai", 0.1);

  // Send 0.0001 BTC
  await sendBtc("bc1qRecipientBitcoinAddress", 0.0001);

  // Send 1 XRP
  await sendXrp("rRecipientXrpAddress", "1");  // Amount as string, e.g., "1" = 1 XRP

  // Send 0.1 SUI
  await sendSuiTokens("0xRecipientSuiAddress", 0.1);

  // Send 0.1 TON
  await sendTon("EQRecipientTonAddress", 0.1);

  // Send 5 ADA (Cardano)
  await sendAda("addr1qRecipientCardanoAddress", 5);

  // Send 10 TRX (Tron)
  await sendTrx("TRecipientTronAddress", 10);

  // Send 10 USDT on Tron (TRC-20)
  await sendTrc20Token("TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", "TRecipientAddr", BigInt(10_000_000));

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
