/**
 * MeneseSDK — Sign-Only Mode: Sign on Canister, Broadcast from Frontend
 *
 * This example demonstrates the two-step sign-only pattern:
 *
 *   1. Frontend fetches chain data (blockhash, nonce, gas, UTXOs) via YOUR OWN RPCs
 *   2. Canister signs the transaction (1 action)
 *   3. Frontend broadcasts the signed transaction to the chain via YOUR OWN RPCs
 *
 * Why use sign-only instead of autonomous (full execution)?
 *   - CHEAPER: The canister makes zero HTTP outcalls → saves cycles
 *   - FASTER: No waiting for canister→chain round trips
 *   - FLEXIBLE: Use your own RPCs, retry logic, and error handling
 *   - RELIABLE: No canister-side timeout or retry issues
 *
 * Available sign-only endpoints:
 *   - signSolTransferRelayer(to, lamports, blockhash)           → Solana
 *   - signSolSwapTxsRelayer(txBase64Array)                      → Solana swap txs
 *   - buildAndSignEvmTxWithData(to, value, data, nonce, gas...) → EVM (ETH/ARB/BASE/etc)
 *   - signXrpTransferRelayer(dest, amount, seq, ledger, fee)    → XRP
 *   - signSuiTransferRelayer(recipient, amount, gasCoin...)      → SUI
 *   - signTonTransferRelayer(to, amount, seqno, bounce...)       → TON
 *   - signCardanoTransferRelayer(recipient, amount, utxos...)     → Cardano
 *   - signNearTransferRelayer(recipient, amount, nonce, block)   → NEAR
 *   - signAptosTransferRelayer(to, amount, seq, chain, expiry)   → Aptos
 *   - signTrxTransferRelayer(to, amount, refBlock...)             → TRON
 *
 * Cost: 1 action per sign operation. Chain reads (RPC calls) are free — they're yours.
 */

import {
  createMeneseActor,
  broadcastSolana,
  broadcastEvm,
} from "./sdk-setup";

// ══════════════════════════════════════════════════════════════
// SOLANA — Sign-Only Send
// ══════════════════════════════════════════════════════════════

async function signOnlySolSend(
  toAddress: string,
  lamports: bigint,
  rpcUrl: string = "https://api.mainnet-beta.solana.com",
) {
  const menese = await createMeneseActor();

  // Step 1: Fetch latest blockhash from Solana via YOUR RPC
  console.log("Fetching latest blockhash...");
  const bhRes = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "getLatestBlockhash",
      params: [{ commitment: "finalized" }],
    }),
  });
  const bhJson = await bhRes.json();
  const blockhash: string = bhJson.result.value.blockhash;
  console.log("Blockhash:", blockhash);

  // Step 2: Canister signs the transaction (1 action)
  console.log("Signing on canister...");
  const signed = await menese.signSolTransferRelayer(toAddress, lamports, blockhash);
  console.log("Signed TX ready. Size:", signed.signedTxBase64.length, "chars");

  // Step 3: Broadcast from frontend via YOUR RPC
  console.log("Broadcasting...");
  const txSig = await broadcastSolana(signed.signedTxBase64, rpcUrl);
  console.log("TX confirmed:", txSig);
  console.log("Explorer: https://solscan.io/tx/" + txSig);

  return txSig;
}

// ══════════════════════════════════════════════════════════════
// EVM — Sign-Only Send (ETH, ARB, BASE, POLY, BNB, OP)
// ══════════════════════════════════════════════════════════════

async function signOnlyEvmSend(
  toAddress: string,
  valueWei: bigint,
  rpcUrl: string,
  chainId: bigint,
) {
  const menese = await createMeneseActor();

  // Step 1: Fetch nonce + gas price from YOUR RPC
  const evmInfo = await menese.getMyEvmAddress();
  const senderAddress = evmInfo.evmAddress;

  console.log("Fetching nonce and gas price...");
  const [nonceRes, gasPriceRes] = await Promise.all([
    fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1, method: "eth_getTransactionCount",
        params: [senderAddress, "latest"],
      }),
    }),
    fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 2, method: "eth_gasPrice", params: [],
      }),
    }),
  ]);

  const nonceJson = await nonceRes.json();
  const gasPriceJson = await gasPriceRes.json();

  const nonce = BigInt(nonceJson.result);
  const gasPrice = BigInt(gasPriceJson.result);
  const gasLimit = BigInt(21000); // Standard ETH transfer

  console.log(`Nonce: ${nonce}, Gas price: ${gasPrice}, Gas limit: ${gasLimit}`);

  // Step 2: Canister signs the transaction (1 action)
  // buildAndSignEvmTxWithData(to, value, data, nonce, gasLimit, gasPrice, chainId)
  console.log("Signing on canister...");
  const signed = await menese.buildAndSignEvmTxWithData(
    toAddress,
    valueWei,
    [],            // data: empty for simple ETH transfer
    nonce,
    gasLimit,
    gasPrice,
    chainId,
  );
  console.log("TX hash:", signed.txHash);

  // Step 3: Broadcast from frontend via YOUR RPC
  // The canister returns two versions: rawTxHex_v0 (legacy) and rawTxHex_v1 (EIP-1559 compatible)
  console.log("Broadcasting...");
  const txHash = await broadcastEvm(signed.rawTxHex_v1, rpcUrl);
  console.log("TX confirmed:", txHash);

  return txHash;
}

// ══════════════════════════════════════════════════════════════
// XRP — Sign-Only Send
// ══════════════════════════════════════════════════════════════

async function signOnlyXrpSend(
  destAddress: string,
  amountXrp: string,   // e.g. "10.5" (XRP, not drops)
  rpcUrl: string = "https://s1.ripple.com:51234",
) {
  const menese = await createMeneseActor();

  // Step 1: Fetch account info (sequence number) from YOUR RPC
  const xrpInfo = await menese.getMyXrpAddress();
  const senderAddress = xrpInfo.classicAddress;

  console.log("Fetching XRP account info...");
  const acctRes = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "account_info",
      params: [{ account: senderAddress, ledger_index: "current" }],
    }),
  });
  const acctJson = await acctRes.json();
  const sequence: number = acctJson.result.account_data.Sequence;

  // Fetch current ledger for lastLedgerSequence (timeout protection)
  const ledgerRes = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "ledger_current", params: [{}],
    }),
  });
  const ledgerJson = await ledgerRes.json();
  const currentLedger: number = ledgerJson.result.ledger_current_index;
  const lastLedgerSeq = currentLedger + 20; // Valid for ~20 ledgers (~80 seconds)

  const fee = BigInt(12); // 12 drops (standard XRP fee)

  console.log(`Sequence: ${sequence}, Last ledger: ${lastLedgerSeq}`);

  // Step 2: Canister signs the transaction (1 action)
  console.log("Signing on canister...");
  const signed = await menese.signXrpTransferRelayer(
    destAddress,
    amountXrp,
    sequence,
    lastLedgerSeq,
    fee,
    [],  // destinationTag: optional
  );
  console.log("TX hash:", signed.txHash);

  // Step 3: Broadcast — submit the signed blob to YOUR XRP node
  console.log("Broadcasting...");
  const submitRes = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      method: "submit",
      params: [{ tx_blob: signed.signedTxHex }],
    }),
  });
  const submitJson = await submitRes.json();

  if (submitJson.result.engine_result === "tesSUCCESS") {
    console.log("TX submitted successfully!");
    console.log("Explorer: https://xrpscan.com/tx/" + signed.txHash);
  } else {
    console.error("Submit result:", submitJson.result.engine_result_message);
  }

  return signed.txHash;
}

// ══════════════════════════════════════════════════════════════
// SUI — Sign-Only Send
// ══════════════════════════════════════════════════════════════

async function signOnlySuiSend(
  recipientAddress: string,
  amountMist: bigint,
  rpcUrl: string = "https://fullnode.mainnet.sui.io",
) {
  const menese = await createMeneseActor();

  // Step 1: Fetch gas coin info from YOUR RPC
  const suiInfo = await menese.getMySuiAddress();
  const senderAddress = suiInfo.suiAddress;

  console.log("Fetching SUI gas coins...");
  const coinsRes = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "suix_getCoins",
      params: [senderAddress, "0x2::sui::SUI", null, 1],
    }),
  });
  const coinsJson = await coinsRes.json();
  const coin = coinsJson.result.data[0];

  const gasCoinId: string = coin.coinObjectId;
  const gasCoinVersion: bigint = BigInt(coin.version);
  const gasCoinDigest: string = coin.digest;

  console.log(`Gas coin: ${gasCoinId} v${gasCoinVersion}`);

  // Step 2: Canister signs the transaction (1 action)
  console.log("Signing on canister...");
  const signed = await menese.signSuiTransferRelayer(
    recipientAddress,
    amountMist,
    gasCoinId,
    gasCoinVersion,
    gasCoinDigest,
  );
  console.log("Signed TX ready");

  // Step 3: Broadcast — execute the signed tx via YOUR RPC
  console.log("Broadcasting...");
  const execRes = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1, method: "sui_executeTransactionBlock",
      params: [
        signed.txBytesBase64,
        [signed.signatureBase64],
        { showEffects: true },
        "WaitForLocalExecution",
      ],
    }),
  });
  const execJson = await execRes.json();

  if (execJson.result?.effects?.status?.status === "success") {
    const digest = execJson.result.digest;
    console.log("TX confirmed:", digest);
    console.log("Explorer: https://suiscan.xyz/mainnet/tx/" + digest);
    return digest;
  } else {
    console.error("TX failed:", execJson.result?.effects?.status);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ══════════════════════════════════════════════════════════════

async function main() {
  // ── Solana: sign-only send ─────────────────────────────────
  // Send 0.01 SOL (10M lamports)
  await signOnlySolSend(
    "RecipientSolanaAddress...",
    BigInt(10_000_000),
    "https://api.mainnet-beta.solana.com",
  );

  // ── EVM: sign-only send on Ethereum ────────────────────────
  // Send 0.01 ETH
  await signOnlyEvmSend(
    "0xRecipientAddress...",
    BigInt("10000000000000000"),  // 0.01 ETH in wei
    "https://eth.llamarpc.com",
    BigInt(1),  // chainId: 1 = Ethereum
  );

  // ── EVM: sign-only send on Arbitrum ────────────────────────
  // Same function, different RPC and chainId — that's it.
  await signOnlyEvmSend(
    "0xRecipientAddress...",
    BigInt("10000000000000000"),
    "https://arb1.arbitrum.io/rpc",
    BigInt(42161),  // chainId: 42161 = Arbitrum
  );

  // ── XRP: sign-only send ────────────────────────────────────
  await signOnlyXrpSend(
    "rRecipientXRPAddress...",
    "10.5",  // 10.5 XRP
  );

  // ── SUI: sign-only send ────────────────────────────────────
  await signOnlySuiSend(
    "0xRecipientSuiAddress...",
    BigInt(100_000_000),  // 0.1 SUI (9 decimals)
  );
}

main().catch(console.error);
