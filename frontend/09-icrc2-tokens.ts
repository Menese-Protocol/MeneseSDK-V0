// 10-icrc2-tokens.ts — ICRC-2 approve, transferFrom, and allowance
//
// ICRC-2 extends ICRC-1 with an approve/transferFrom pattern (like ERC-20).
// Use this for:
//   - Allowing a canister to spend tokens on your behalf
//   - Building payment flows where a backend pulls tokens after user approval
//   - Checking existing allowances before initiating transfers
//
// Subscription required: 1 action per call (except getICRC2Allowance which is a query)
//
// Common ICRC-2 tokens on ICP:
//   ckBTC  — ryjl3-tyaaa-aaaaa-aaaba-cai
//   ckETH  — ss2fx-dyaaa-aaaar-qacoq-cai
//   ICP    — ryjl3-tyaaa-aaaaa-aaaba-cai (NNS ledger, also supports ICRC-2)

import { createMeneseActor } from "./sdk-setup";
import { Principal } from "@dfinity/principal";

const CKBTC_LEDGER = "mxzaz-hqaaa-aaaar-qaada-cai";
const CKETH_LEDGER = "ss2fx-dyaaa-aaaar-qacoq-cai";

async function main() {
  const actor = await createMeneseActor();

  // ── 1. Check token info ────────────────────────────────────
  // FREE — no subscription needed for read queries
  const ckbtcInfo = await actor.getICRC1TokenInfo(CKBTC_LEDGER);
  if ("ok" in ckbtcInfo) {
    console.log(`ckBTC: ${ckbtcInfo.ok.symbol}, ${ckbtcInfo.ok.decimals} decimals, fee: ${ckbtcInfo.ok.fee}`);
  }

  // ── 2. Check your ICRC-1 balance ───────────────────────────
  const balance = await actor.getICRC1Balance(CKBTC_LEDGER);
  if ("ok" in balance) {
    console.log(`ckBTC balance: ${balance.ok}`);
  }

  // ── 3. Approve a spender ───────────────────────────────────
  // Allow another canister to spend up to 50,000 satoshis of your ckBTC
  const spenderPrincipal = Principal.fromText("YOUR_SPENDER_CANISTER_ID");
  const approveAmount = BigInt(50_000); // 50,000 satoshis = 0.0005 ckBTC

  // Optional: set expiration (nanoseconds since epoch). null = no expiry.
  const expiresAt: bigint | null = null;

  const approveResult = await actor.approveICRC2(
    spenderPrincipal,
    approveAmount,
    expiresAt ? [expiresAt] : [],
    CKBTC_LEDGER,
  );

  if ("ok" in approveResult) {
    console.log(`Approved! Block: ${approveResult.ok.blockHeight}, Amount: ${approveResult.ok.amount}`);
  } else {
    console.error(`Approve failed: ${approveResult.err}`);
  }

  // ── 4. Check allowance ─────────────────────────────────────
  const ownerPrincipal = Principal.fromText("YOUR_PRINCIPAL_OR_CANISTER_ID");

  const allowance = await actor.getICRC2Allowance(
    ownerPrincipal,
    spenderPrincipal,
    CKBTC_LEDGER,
  );

  if ("ok" in allowance) {
    console.log(`Allowance: ${allowance.ok.allowance}`);
    if (allowance.ok.expires_at.length > 0) {
      console.log(`Expires at: ${allowance.ok.expires_at[0]}`);
    }
  }

  // ── 5. TransferFrom (pull tokens) ──────────────────────────
  // This is called by the SPENDER canister, not the token owner.
  // The spender must have been approved via approveICRC2 first.
  const fromPrincipal = Principal.fromText("TOKEN_OWNER_PRINCIPAL");
  const toPrincipal = Principal.fromText("DESTINATION_PRINCIPAL");
  const transferAmount = BigInt(10_000); // 10,000 satoshis

  const transferResult = await actor.transferFromICRC2(
    fromPrincipal,
    toPrincipal,
    transferAmount,
    CKBTC_LEDGER,
  );

  if ("ok" in transferResult) {
    console.log(`Transfer complete! Block: ${transferResult.ok.blockHeight}`);
    console.log(`From: ${transferResult.ok.from.toText()}`);
    console.log(`To: ${transferResult.ok.to.toText()}`);
    console.log(`Amount: ${transferResult.ok.amount}`);
  } else {
    console.error(`TransferFrom failed: ${transferResult.err}`);
  }

  // ── 6. Direct ICRC-1 send ──────────────────────────────────
  // Simple send (no approve needed — sender is the caller)
  const sendResult = await actor.sendICRC1(
    Principal.fromText("RECIPIENT_PRINCIPAL"),
    BigInt(25_000), // 25,000 satoshis
    CKBTC_LEDGER,
  );

  if ("ok" in sendResult) {
    console.log(`Sent! Block: ${sendResult.ok.blockHeight}, Token: ${sendResult.ok.token}`);
  }

  // ── 7. List supported ICP tokens ───────────────────────────
  const tokens = await actor.getSupportedICPTokens();
  console.log(`\nSupported ICP tokens (${tokens.length}):`);
  for (const t of tokens) {
    console.log(`  ${t.symbol} (${t.name}) — ${t.canisterId} [${t.type_}]`);
  }
}

main().catch(console.error);
