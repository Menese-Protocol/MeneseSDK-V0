/**
 * MeneseSDK — mSOL (Yield-Bearing SOL) & ICP-SOL Pool Integration
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  mSOL (ckSOL)  — Deposit SOL, receive yield-bearing mSOL   │
 * │                                                             │
 * │  • Autonomous:  msolDeposit(lamports)                       │
 * │    SDK signs, broadcasts, and registers in one call.        │
 * │                                                             │
 * │  • Sign-Only:   exp_signSolTransfer(treasuryAddr, ...)      │
 * │    SDK signs, you broadcast, deposit auto-detected.         │
 * │                                                             │
 * │  • Redeem:      icrc2_approve → requestCkSolRedemption      │
 * │    Approve ckSOL canister to burn your mSOL, then redeem.   │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ICP-SOL Pool  — Bidirectional SOL ↔ ICP at oracle rate     │
 * │                                                             │
 * │  SOL → ICP:                                                 │
 * │  • Autonomous:  icpSolPoolDeposit(lamports)                 │
 * │  • Sign-Only:   exp_signSolTransfer(poolTreasuryAddr, ...)  │
 * │                                                             │
 * │  ICP → SOL:                                                 │
 * │  • Autonomous:  icrc2_approve → swapIcpToSol(e8s, addr)    │
 * │  • Sign-Only:   icrc2_approve → swapIcpToSolSign(...)      │
 * │    Both require ICRC-2 approve on ICP ledger first.         │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Cost: 1 action per operation (deducted from your gateway credits)
 *
 * PREREQUISITES:
 *   1. npm install @dfinity/agent @dfinity/principal @dfinity/auth-client
 *   2. Gateway subscription — call purchaseGatewayPackage() first (see 01-quick-start.ts)
 *   3. SOL in your Menese wallet — fund via exchange or transfer
 *      (get your address with getMySolanaAddress())
 *   4. For redemption: your Menese SOL address to receive SOL back
 *
 * SIGN-ONLY TIMING:
 *   After exp_signSolTransfer, the SDK auto-registers the deposit immediately.
 *   The canister starts verifying on-chain within ~15s. Broadcast your TX promptly
 *   (within 30s) or the deposit check may expire before your TX lands.
 *
 * CANISTER IDs:
 *   SDK:          urs2a-ziaaa-aaaad-aembq-cai
 *   ckSOL:        crmds-kqaaa-aaaaf-qf5aq-cai
 *   ckSOL Ledger: 2ykjj-eyaaa-aaaae-af4ma-cai  (ICRC-2)
 *   ICP-SOL:      w2vjc-2yaaa-aaaab-ae6zq-cai
 *   ICP Ledger:   ryjl3-tyaaa-aaaaa-aaaba-cai  (ICRC-2)
 *
 * PUBLIC SOLANA RPCs (free, rate-limited):
 *   https://api.mainnet-beta.solana.com         — official, aggressive limits
 *   https://rpc.ankr.com/solana                 — Ankr public, decent limits
 *   https://solana-mainnet.g.alchemy.com/v2/demo — Alchemy demo key
 *   https://mainnet.helius-rpc.com/?api-key=... — Helius (free tier: 100k req/day)
 *
 * For production, get a dedicated RPC from Helius, QuickNode, or Triton.
 *
 * Made with love by Menese Protocol
 * https://menese.io
 */

import { Actor, HttpAgent } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { Principal } from "@dfinity/principal";

// ══════════════════════════════════════════════════════════════
// CONFIG — Change these for your app
// ══════════════════════════════════════════════════════════════

export const CONFIG = {
  /** MeneseSDK canister on IC mainnet */
  SDK_CANISTER_ID: "urs2a-ziaaa-aaaad-aembq-cai",
  /** ckSOL canister (mSOL minting/redemption) */
  CKSOL_CANISTER_ID: "crmds-kqaaa-aaaaf-qf5aq-cai",
  /** ckSOL ICRC-2 ledger (mSOL token) */
  CKSOL_LEDGER_ID: "2ykjj-eyaaa-aaaae-af4ma-cai",
  /** ICP-SOL oracle swap pool */
  ICP_SOL_SWAP_ID: "w2vjc-2yaaa-aaaab-ae6zq-cai",
  /** ICP ICRC-2 ledger */
  ICP_LEDGER_ID: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  /** IC host for agent creation */
  IC_HOST: "https://icp0.io",
  /** Solana RPC — swap for your own in production */
  SOLANA_RPC: "https://api.mainnet-beta.solana.com",
};

// ══════════════════════════════════════════════════════════════
// IDL FACTORIES — Candid type definitions for each canister
// ══════════════════════════════════════════════════════════════

// --- SDK canister (only the functions we need here) ---
const sdkIdl = ({ IDL }: any) => {
  const SolanaAddressInfo = IDL.Record({
    address: IDL.Text,
    publicKeyHex: IDL.Text,
    publicKeyBytes: IDL.Vec(IDL.Nat8),
  });
  const SignedSolTx = IDL.Record({
    signedTxBase64: IDL.Text,
    signatureBase58: IDL.Text,
    signerAddress: IDL.Text,
    purpose: IDL.Text,
  });
  return IDL.Service({
    msolDeposit: IDL.Func(
      [IDL.Nat64],
      [IDL.Variant({ ok: IDL.Record({ depositId: IDL.Nat, txSignature: IDL.Text }), err: IDL.Text })],
      [],
    ),
    icpSolPoolDeposit: IDL.Func(
      [IDL.Nat64],
      [IDL.Variant({ ok: IDL.Record({ expectedDepositId: IDL.Nat, txSignature: IDL.Text }), err: IDL.Text })],
      [],
    ),
    exp_signSolTransfer: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Text],
      [IDL.Variant({ ok: SignedSolTx, err: IDL.Text })],
      [],
    ),
    getMsolTreasuryAddress: IDL.Func([], [IDL.Text], []),
    getIcpSolTreasuryAddress: IDL.Func([], [IDL.Text], []),
    getMySolanaAddress: IDL.Func([], [SolanaAddressInfo], []),
  });
};

// --- ckSOL canister (redemption + rate queries) ---
const cksolIdl = ({ IDL }: any) => IDL.Service({
  requestCkSolRedemption: IDL.Func(
    [IDL.Nat64, IDL.Text, IDL.Opt(IDL.Text)],
    [IDL.Variant({
      ok: IDL.Record({ redemptionId: IDL.Nat, signedTxBase64: IDL.Text, signatureBase58: IDL.Text }),
      err: IDL.Text,
    })],
    [],
  ),
  getCksolRate: IDL.Func([], [IDL.Record({
    solPerCkSolE9: IDL.Nat64,
    epoch: IDL.Nat,
    totalBackingLamports: IDL.Nat64,
    totalCkSolSupply: IDL.Nat64,
    iasolToSolRateE9: IDL.Nat64,
  })], ["query"]),
});

// --- ICP-SOL swap canister (ICP → SOL direction) ---
const icpSolSwapIdl = ({ IDL }: any) => {
  const SwapDirection = IDL.Variant({ IcpToSol: IDL.Null, SolToIcp: IDL.Null });
  const CompletedInfo = IDL.Record({ solTxHash: IDL.Text, icpBlockHeight: IDL.Nat, completedAt: IDL.Int });
  const SwapStatus = IDL.Variant({
    Pending: IDL.Null, IcpPulled: IDL.Null, SolBroadcast: IDL.Text,
    Completed: CompletedInfo, Failed: IDL.Text, Refunded: IDL.Text,
  });
  const SwapRecord = IDL.Record({
    id: IDL.Nat, caller: IDL.Principal, direction: SwapDirection,
    inputAmount: IDL.Nat, expectedOutput: IDL.Nat, feeCharged: IDL.Nat,
    icpPriceMicroUsd: IDL.Nat64, solPriceMicroUsd: IDL.Nat64,
    solTxHash: IDL.Text, icpBlockHeight: IDL.Nat, status: SwapStatus,
    createdAt: IDL.Int, updatedAt: IDL.Int,
  });
  return IDL.Service({
    swapIcpToSol: IDL.Func([IDL.Nat, IDL.Text], [IDL.Variant({ ok: SwapRecord, err: IDL.Text })], []),
    swapIcpToSolSign: IDL.Func(
      [IDL.Nat, IDL.Text, IDL.Text],
      [IDL.Variant({ ok: IDL.Record({ swapId: IDL.Nat, signedTxBase64: IDL.Text, solOutputLamports: IDL.Nat }), err: IDL.Text })],
      [],
    ),
  });
};

// --- ICRC-2 ledger (approve, balance, fee — works for BOTH ICP and mSOL ledgers) ---
const icrc2Idl = ({ IDL }: any) => {
  const Account = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) });
  const ApproveArg = IDL.Record({
    fee: IDL.Opt(IDL.Nat), memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
    from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)), created_at_time: IDL.Opt(IDL.Nat64),
    amount: IDL.Nat, expected_allowance: IDL.Opt(IDL.Nat),
    expires_at: IDL.Opt(IDL.Nat64), spender: Account,
  });
  const ApproveError = IDL.Variant({
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
    AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
    Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    GenericError: IDL.Record({ error_code: IDL.Nat, message: IDL.Text }),
  });
  return IDL.Service({
    icrc1_fee: IDL.Func([], [IDL.Nat], ["query"]),
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    icrc2_approve: IDL.Func([ApproveArg], [IDL.Variant({ Ok: IDL.Nat, Err: ApproveError })], []),
  });
};

// ══════════════════════════════════════════════════════════════
// AUTH + ACTOR CREATION
// ══════════════════════════════════════════════════════════════

/** Create an authenticated HttpAgent using Internet Identity */
export async function createAuthAgent(): Promise<HttpAgent> {
  const authClient = await AuthClient.create();
  if (!authClient.isAuthenticated()) {
    await new Promise<void>((resolve, reject) => {
      authClient.login({
        identityProvider: "https://identity.ic0.app",
        onSuccess: () => resolve(),
        onError: (err) => reject(new Error(err)),
      });
    });
  }
  const identity = authClient.getIdentity();
  return HttpAgent.createSync({ host: CONFIG.IC_HOST, identity });
}

/** Create an authenticated MeneseSDK actor */
export async function createSdkActor(agent?: HttpAgent) {
  const a = agent || await createAuthAgent();
  return Actor.createActor(sdkIdl, { agent: a, canisterId: CONFIG.SDK_CANISTER_ID });
}

/** Create an actor for a specific canister using an authenticated agent */
function createCksolActor(agent: HttpAgent) {
  return Actor.createActor(cksolIdl, { agent, canisterId: CONFIG.CKSOL_CANISTER_ID });
}
function createIcpSolActor(agent: HttpAgent) {
  return Actor.createActor(icpSolSwapIdl, { agent, canisterId: CONFIG.ICP_SOL_SWAP_ID });
}
function createLedgerActor(agent: HttpAgent, canisterId: string) {
  return Actor.createActor(icrc2Idl, { agent, canisterId });
}

// ══════════════════════════════════════════════════════════════
// SOLANA RPC HELPERS
// ══════════════════════════════════════════════════════════════

/** Fetch a recent Solana blockhash. Uses CONFIG.SOLANA_RPC by default. */
export async function fetchBlockhash(rpc?: string): Promise<string> {
  const url = rpc || CONFIG.SOLANA_RPC;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "getLatestBlockhash",
      params: [{ commitment: "finalized" }],
    }),
  });
  const json = await resp.json();
  if (json.error) throw new Error(`Solana RPC error: ${json.error.message}`);
  return json.result.value.blockhash;
}

/** Broadcast a signed Solana transaction (base64). Returns tx signature or throws. */
export async function broadcastTx(signedTxBase64: string, rpc?: string): Promise<string> {
  const url = rpc || CONFIG.SOLANA_RPC;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 1,
      method: "sendTransaction",
      params: [signedTxBase64, { encoding: "base64", skipPreflight: false }],
    }),
  });
  const json = await resp.json();
  if (json.error) throw new Error(`Broadcast failed: ${json.error.message}`);
  return json.result;
}

/** ICRC-2 approve helper — works for any ICRC-2 ledger (ICP, mSOL, etc.) */
export async function icrc2Approve(
  agent: HttpAgent,
  ledgerCanisterId: string,
  spenderCanisterId: string,
  amount: bigint,
): Promise<bigint> {
  const ledger = createLedgerActor(agent, ledgerCanisterId);
  const fee = await ledger.icrc1_fee() as bigint;
  const result = await ledger.icrc2_approve({
    spender: { owner: Principal.fromText(spenderCanisterId), subaccount: [] },
    amount: amount + fee,
    fee: [fee],
    memo: [], from_subaccount: [], created_at_time: [],
    expected_allowance: [], expires_at: [],
  }) as any;
  if ("Err" in result) {
    const err = result.Err;
    if ("InsufficientFunds" in err) throw new Error(`Insufficient funds. Balance: ${err.InsufficientFunds.balance}`);
    if ("BadFee" in err) throw new Error(`Bad fee. Expected: ${err.BadFee.expected_fee}`);
    throw new Error(`ICRC-2 approve failed: ${JSON.stringify(err)}`);
  }
  return result.Ok as bigint;
}

// ══════════════════════════════════════════════════════════════
// 1. mSOL DEPOSIT — AUTONOMOUS
// ══════════════════════════════════════════════════════════════

/** Deposit SOL and receive mSOL. One call — SDK handles everything. */
export async function depositMsolAutonomous(solAmount: number, agent?: HttpAgent) {
  const sdk = await createSdkActor(agent);
  const lamports = BigInt(Math.floor(solAmount * 1_000_000_000));
  const result = await sdk.msolDeposit(lamports) as any;
  if ("err" in result) throw new Error(result.err);
  return result.ok as { depositId: bigint; txSignature: string };
}

// ══════════════════════════════════════════════════════════════
// 2. mSOL DEPOSIT — SIGN-ONLY
// ══════════════════════════════════════════════════════════════

/** SDK signs the SOL transfer, you broadcast. Deposit auto-detected by SDK. */
export async function depositMsolSignOnly(solAmount: number, agent?: HttpAgent, rpc?: string) {
  const sdk = await createSdkActor(agent);
  const lamports = BigInt(Math.floor(solAmount * 1_000_000_000));

  const treasuryAddr = await sdk.getMsolTreasuryAddress() as string;
  const blockhash = await fetchBlockhash(rpc);

  const signed = await sdk.exp_signSolTransfer(treasuryAddr, lamports, blockhash) as any;
  if ("err" in signed) throw new Error(signed.err);

  // Broadcast (deposit already auto-registered by SDK)
  const txSig = await broadcastTx(signed.ok.signedTxBase64, rpc);

  return {
    signatureBase58: signed.ok.signatureBase58 as string,
    signedTxBase64: signed.ok.signedTxBase64 as string,
    broadcastResult: txSig,
  };
}

// ══════════════════════════════════════════════════════════════
// 3. mSOL REDEMPTION — APPROVE + REDEEM + BROADCAST
// ══════════════════════════════════════════════════════════════

/**
 * Redeem mSOL back to SOL.
 * 1. Approves ckSOL canister to burn your mSOL (ICRC-2)
 * 2. Canister burns mSOL and signs a SOL transfer to your address
 * 3. You broadcast the signed TX to Solana
 */
export async function redeemMsol(
  msolAmount: number,
  solDestination: string,
  agent: HttpAgent,
  rpc?: string,
) {
  const msolLamports = BigInt(Math.floor(msolAmount * 1_000_000_000));

  // Step 1: Approve
  await icrc2Approve(agent, CONFIG.CKSOL_LEDGER_ID, CONFIG.CKSOL_CANISTER_ID, msolLamports);

  // Step 2: Burn + sign
  const cksol = createCksolActor(agent);
  const result = await cksol.requestCkSolRedemption(msolLamports, solDestination, []) as any;
  if ("err" in result) throw new Error(result.err);

  // Step 3: Broadcast
  const txSig = await broadcastTx(result.ok.signedTxBase64, rpc);

  return {
    redemptionId: result.ok.redemptionId as bigint,
    signatureBase58: result.ok.signatureBase58 as string,
    broadcastResult: txSig,
    explorerUrl: `https://solscan.io/tx/${result.ok.signatureBase58}`,
  };
}

// ══════════════════════════════════════════════════════════════
// 4. SOL → ICP — AUTONOMOUS
// ══════════════════════════════════════════════════════════════

/** Deposit SOL into ICP-SOL pool, receive ICP at oracle rate. One call. */
export async function depositSolForIcp(solAmount: number, agent?: HttpAgent) {
  const sdk = await createSdkActor(agent);
  const lamports = BigInt(Math.floor(solAmount * 1_000_000_000));
  const result = await sdk.icpSolPoolDeposit(lamports) as any;
  if ("err" in result) throw new Error(result.err);
  return result.ok as { expectedDepositId: bigint; txSignature: string };
}

// ══════════════════════════════════════════════════════════════
// 5. SOL → ICP — SIGN-ONLY
// ══════════════════════════════════════════════════════════════

/** SDK signs SOL transfer to pool treasury, you broadcast. Auto-detected. */
export async function depositSolForIcpSignOnly(solAmount: number, agent?: HttpAgent, rpc?: string) {
  const sdk = await createSdkActor(agent);
  const lamports = BigInt(Math.floor(solAmount * 1_000_000_000));

  const treasuryAddr = await sdk.getIcpSolTreasuryAddress() as string;
  const blockhash = await fetchBlockhash(rpc);

  const signed = await sdk.exp_signSolTransfer(treasuryAddr, lamports, blockhash) as any;
  if ("err" in signed) throw new Error(signed.err);

  const txSig = await broadcastTx(signed.ok.signedTxBase64, rpc);

  return {
    signatureBase58: signed.ok.signatureBase58 as string,
    broadcastResult: txSig,
  };
}

// ══════════════════════════════════════════════════════════════
// 6. ICP → SOL — AUTONOMOUS (pool broadcasts)
// ══════════════════════════════════════════════════════════════

/**
 * Swap ICP for SOL. Pool pulls your ICP via ICRC-2 and broadcasts SOL to your address.
 * Requires ICRC-2 approve on ICP ledger first (handled automatically).
 */
export async function swapIcpToSol(icpAmount: number, solDestination: string, agent: HttpAgent) {
  const icpE8s = BigInt(Math.floor(icpAmount * 100_000_000));

  // Approve
  await icrc2Approve(agent, CONFIG.ICP_LEDGER_ID, CONFIG.ICP_SOL_SWAP_ID, icpE8s);

  // Swap
  const pool = createIcpSolActor(agent);
  const result = await pool.swapIcpToSol(icpE8s, solDestination) as any;
  if ("err" in result) throw new Error(result.err);
  return result.ok;
}

// ══════════════════════════════════════════════════════════════
// 7. ICP → SOL — SIGN-ONLY (you broadcast)
// ══════════════════════════════════════════════════════════════

/**
 * Pool pulls your ICP and signs a SOL transfer. You broadcast.
 * Requires ICRC-2 approve on ICP ledger first (handled automatically).
 */
export async function swapIcpToSolSignOnly(
  icpAmount: number,
  solDestination: string,
  agent: HttpAgent,
  rpc?: string,
) {
  const icpE8s = BigInt(Math.floor(icpAmount * 100_000_000));

  // Approve
  await icrc2Approve(agent, CONFIG.ICP_LEDGER_ID, CONFIG.ICP_SOL_SWAP_ID, icpE8s);

  // Pool pulls ICP + signs SOL TX
  const blockhash = await fetchBlockhash(rpc);
  const pool = createIcpSolActor(agent);
  const result = await pool.swapIcpToSolSign(icpE8s, solDestination, blockhash) as any;
  if ("err" in result) throw new Error(result.err);

  // Broadcast
  const txSig = await broadcastTx(result.ok.signedTxBase64, rpc);

  return {
    swapId: result.ok.swapId as bigint,
    solOutputLamports: result.ok.solOutputLamports as bigint,
    broadcastResult: txSig,
  };
}

// ══════════════════════════════════════════════════════════════
// HELPERS — Balance, rate, address queries
// ══════════════════════════════════════════════════════════════

/** Get your Menese-derived Solana address */
export async function getMySolAddress(agent?: HttpAgent): Promise<string> {
  const sdk = await createSdkActor(agent);
  const info = await sdk.getMySolanaAddress() as { address: string };
  return info.address;
}

/** Get mSOL balance for any principal */
export async function getMsolBalance(agent: HttpAgent, owner?: Principal): Promise<bigint> {
  const p = owner || (await agent.getPrincipal?.()) || Principal.anonymous();
  const ledger = createLedgerActor(agent, CONFIG.CKSOL_LEDGER_ID);
  return await ledger.icrc1_balance_of({ owner: p, subaccount: [] }) as bigint;
}

/** Get current mSOL exchange rate and treasury stats */
export async function getCksolRate(agent: HttpAgent) {
  const cksol = createCksolActor(agent);
  return await cksol.getCksolRate() as {
    solPerCkSolE9: bigint;
    epoch: bigint;
    totalBackingLamports: bigint;
    totalCkSolSupply: bigint;
    iasolToSolRateE9: bigint;
  };
}

// ══════════════════════════════════════════════════════════════
// FORMATTERS
// ══════════════════════════════════════════════════════════════

export const fmtSol = (lamports: bigint) => (Number(lamports) / 1e9).toFixed(4);
export const fmtIcp = (e8s: bigint) => (Number(e8s) / 1e8).toFixed(4);
export const fmtRate = (e9: bigint) => (Number(e9) / 1e9).toFixed(6);

// ══════════════════════════════════════════════════════════════
// EXAMPLE USAGE (uncomment to run)
// ══════════════════════════════════════════════════════════════

/*
async function main() {
  // Authenticate with Internet Identity
  const agent = await createAuthAgent();

  // Get your SOL address
  const solAddr = await getMySolAddress(agent);
  console.log("My SOL address:", solAddr);

  // ── mSOL: Deposit 0.1 SOL (autonomous — simplest) ──
  const deposit = await depositMsolAutonomous(0.1, agent);
  console.log("Deposit ID:", deposit.depositId.toString());
  console.log("Explorer:", `https://solscan.io/tx/${deposit.txSignature}`);

  // ── mSOL: Deposit 0.1 SOL (sign-only — you control broadcast) ──
  const signOnly = await depositMsolSignOnly(0.1, agent);
  console.log("Broadcast:", signOnly.broadcastResult);

  // ── mSOL: Redeem 0.05 mSOL → SOL ──
  const redeem = await redeemMsol(0.05, solAddr, agent);
  console.log("Redeemed:", redeem.explorerUrl);

  // ── SOL → ICP: Deposit 0.5 SOL (autonomous) ──
  const solToIcp = await depositSolForIcp(0.5, agent);
  console.log("Expected deposit:", solToIcp.expectedDepositId.toString());

  // ── ICP → SOL: Swap 1 ICP (autonomous — pool broadcasts SOL) ──
  const icpToSol = await swapIcpToSol(1.0, solAddr, agent);
  console.log("Swap:", icpToSol.id.toString(), "SOL:", icpToSol.expectedOutput.toString());

  // ── Check mSOL balance and rate ──
  const balance = await getMsolBalance(agent);
  const rate = await getCksolRate(agent);
  console.log(`Balance: ${fmtSol(balance)} mSOL = ${fmtSol(balance * rate.solPerCkSolE9 / 1_000_000_000n)} SOL`);
}

main().catch(console.error);
*/
