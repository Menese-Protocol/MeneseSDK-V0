/**
 * Sovereign Send — Per-User Solana Wallet with Atomic Protocol Fee
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Every ICP identity gets a unique Solana wallet derived     │
 * │  via threshold Schnorr (ed25519). No seed phrase. No key.   │
 * │                                                             │
 * │  Every SOL transfer includes a 0.1% protocol fee — atomic,  │
 * │  built into the signed TX bytes, unforgeable.               │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │  SIGN-ONLY  (caller broadcasts, 0 canister cycle cost):     │
 * │  • signSend(to, amount, blockhash)     → signed TX + sig    │
 * │  • signDeposit(target, amt, blockhash) → signed + deposit   │
 * │                                                             │
 * │  AUTONOMOUS  (canister does everything, ~500M cycle cost):  │
 * │  • sendSol(to, amount)                → TX broadcast by IC  │
 * │  • depositSol(target, amount)         → broadcast + deposit │
 * │                                                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │  TARGETS:                                                   │
 * │  • ICP-SOL Swap  — send SOL, receive ICP at oracle rate     │
 * │  • mSOL          — send SOL, receive yield-bearing mSOL     │
 * │  • SOL Borrow V3 — send SOL collateral, receive USDC loan   │
 * └─────────────────────────────────────────────────────────────┘
 *
 * CANISTER:  fxjsq-raaaa-aaaab-agdaa-cai
 * FEE:       0.1% (10 basis points) per signSend/sendSol
 * DEPOSIT:   0% fee (full amount goes to treasury)
 *
 * Made with love by Menese Protocol — https://meneseprotocol.io
 */

import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { IDL } from "@dfinity/candid";

// ═══════════════════════════════════════════════════════════════
//  CONSTANTS
// ═══════════════════════════════════════════════════════════════

const SOVEREIGN_SEND = "fxjsq-raaaa-aaaab-agdaa-cai";
const ICP_SOL_SWAP   = "w2vjc-2yaaa-aaaab-ae6zq-cai";
const CKSOL_CANISTER = "crmds-kqaaa-aaaaf-qf5aq-cai";
const SOL_BORROW_V3  = "p7teu-wyaaa-aaaab-afnvq-cai";
const IC_HOST        = "https://icp-api.io";

const SOLANA_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
];

// ═══════════════════════════════════════════════════════════════
//  CANDID IDL — matches deployed canister exactly
// ═══════════════════════════════════════════════════════════════

const sovereignSendIDL = ({ IDL }: any) => {
  const BorrowParams = IDL.Record({
    iasolExpected: IDL.Nat64,
    iausdToMint: IDL.Nat64,
    minUsdcOut: IDL.Nat64,
    userPubkey: IDL.Vec(IDL.Nat8),
    userUsdcAta: IDL.Vec(IDL.Nat8),
  });

  const TreasuryType = IDL.Variant({
    IcpSolSwap: IDL.Null,
    SolBorrow: IDL.Null,
    CkSol: IDL.Null,
  });

  return IDL.Service({
    getMyAddress: IDL.Func([], [IDL.Record({
      address: IDL.Text,
      publicKeyBytes: IDL.Vec(IDL.Nat8),
    })], []),

    getFeeTreasuryAddress: IDL.Func([], [IDL.Text], []),
    getAdmin: IDL.Func([], [IDL.Principal], ["query"]),
    getRegisteredTreasuries: IDL.Func([], [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Text))], ["query"]),
    init: IDL.Func([], [], []),

    registerTreasury: IDL.Func(
      [IDL.Principal, IDL.Text, TreasuryType],
      [IDL.Variant({ ok: IDL.Null, err: IDL.Text })],
      [],
    ),

    // Sign-only: caller provides blockhash, broadcasts TX themselves
    signSend: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Text],
      [IDL.Variant({
        ok: IDL.Record({
          signedTxBase64: IDL.Text,
          sendAmount: IDL.Nat64,
          feeAmount: IDL.Nat64,
          txSignature: IDL.Text,
        }),
        err: IDL.Text,
      })],
      [],
    ),

    signDeposit: IDL.Func(
      [IDL.Principal, IDL.Nat64, IDL.Text, IDL.Opt(BorrowParams)],
      [IDL.Variant({
        ok: IDL.Record({
          signedTxBase64: IDL.Text,
          txSignature: IDL.Text,
          depositId: IDL.Nat,
        }),
        err: IDL.Text,
      })],
      [],
    ),

    // Autonomous: canister fetches blockhash + broadcasts via HTTP outcall
    sendSol: IDL.Func(
      [IDL.Text, IDL.Nat64],
      [IDL.Variant({
        ok: IDL.Record({
          txSignature: IDL.Text,
          sendAmount: IDL.Nat64,
          feeAmount: IDL.Nat64,
        }),
        err: IDL.Text,
      })],
      [],
    ),

    depositSol: IDL.Func(
      [IDL.Principal, IDL.Nat64, IDL.Opt(BorrowParams)],
      [IDL.Variant({
        ok: IDL.Record({
          txSignature: IDL.Text,
          depositId: IDL.Nat,
        }),
        err: IDL.Text,
      })],
      [],
    ),
  });
};

// ═══════════════════════════════════════════════════════════════
//  TYPES
// ═══════════════════════════════════════════════════════════════

interface SignSendResult {
  signedTxBase64: string;
  sendAmount: bigint;
  feeAmount: bigint;
  txSignature: string;
}

interface SignDepositResult {
  signedTxBase64: string;
  txSignature: string;
  depositId: bigint;
}

interface AutonomousSendResult {
  txSignature: string;
  sendAmount: bigint;
  feeAmount: bigint;
}

interface AutonomousDepositResult {
  txSignature: string;
  depositId: bigint;
}

// ═══════════════════════════════════════════════════════════════
//  ACTOR FACTORY
// ═══════════════════════════════════════════════════════════════

/**
 * Create an authenticated Sovereign Send actor.
 * Pass the identity from AuthClient.getIdentity().
 */
export function createSovereignSendActor(identity: any) {
  const agent = new HttpAgent({ host: IC_HOST, identity });
  return Actor.createActor(sovereignSendIDL, {
    agent,
    canisterId: SOVEREIGN_SEND,
  });
}

// ═══════════════════════════════════════════════════════════════
//  SOLANA HELPERS (for sign-only path)
// ═══════════════════════════════════════════════════════════════

/** Fetch a recent Solana blockhash. Tries 3 RPCs with fallback. */
export async function fetchSolanaBlockhash(): Promise<string> {
  for (const rpc of SOLANA_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "getLatestBlockhash",
          params: [{ commitment: "confirmed" }],
        }),
      });
      const json = await res.json();
      if (json.result?.value?.blockhash) return json.result.value.blockhash;
    } catch { continue; }
  }
  throw new Error("Failed to fetch Solana blockhash from all RPCs");
}

/** Broadcast a base64-encoded signed Solana TX. Returns TX signature. */
export async function broadcastSolanaTx(signedTxBase64: string): Promise<string> {
  for (const rpc of SOLANA_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0", id: 1,
          method: "sendTransaction",
          params: [signedTxBase64, { encoding: "base64", skipPreflight: true }],
        }),
      });
      const json = await res.json();
      if (json.result) return json.result;
    } catch { continue; }
  }
  throw new Error("Broadcast failed on all RPCs");
}

/** Convert SOL amount (e.g. 0.5) to lamports (500_000_000). */
export function solToLamports(sol: number): bigint {
  return BigInt(Math.round(sol * 1_000_000_000));
}

// ═══════════════════════════════════════════════════════════════
//  API — The 6 operations developers use
// ═══════════════════════════════════════════════════════════════

/**
 * Get the caller's derived Solana address.
 * First call derives via IC threshold Schnorr (~4s).
 * Second call returns from cache (~2s).
 *
 * Fund this address with SOL before calling any send/deposit.
 */
export async function getMyAddress(actor: any): Promise<{ address: string; publicKeyBytes: Uint8Array }> {
  const result = await actor.getMyAddress();
  return { address: result.address, publicKeyBytes: new Uint8Array(result.publicKeyBytes) };
}

/**
 * SIGN-ONLY SEND — Transfer SOL to any Solana address.
 *
 * The canister signs an atomic TX with two instructions:
 *   IX1: Transfer 99.9% to your destination
 *   IX2: Transfer 0.1% to the protocol fee treasury
 *
 * You provide the blockhash and broadcast the TX yourself.
 * This is the cheapest path — 0 canister cycles for broadcast.
 *
 * Flow:
 *   1. fetchSolanaBlockhash() from any Solana RPC
 *   2. signSend(destination, lamports, blockhash) → signed TX
 *   3. broadcastSolanaTx(signedTxBase64) → TX lands on Solana
 */
export async function signSend(
  actor: any,
  toAddress: string,
  solAmount: number,
): Promise<{ txSignature: string; signedTxBase64: string; sendAmount: bigint; feeAmount: bigint }> {
  const blockhash = await fetchSolanaBlockhash();
  const lamports = solToLamports(solAmount);

  const result = await actor.signSend(toAddress, lamports, blockhash);
  if ("err" in result) throw new Error(result.err);

  const { signedTxBase64, sendAmount, feeAmount, txSignature } = result.ok;

  // Broadcast from browser (0 canister cycles)
  await broadcastSolanaTx(signedTxBase64);

  return { txSignature, signedTxBase64, sendAmount, feeAmount };
}

/**
 * AUTONOMOUS SEND — Transfer SOL, canister handles everything.
 *
 * One call. The canister:
 *   1. Fetches a fresh Solana blockhash via HTTP outcall
 *   2. Signs the atomic TX (destination + 0.1% fee)
 *   3. Broadcasts to 3 Solana RPCs in parallel
 *
 * Higher cycle cost (~500M) but simplest integration.
 * No Solana RPC handling needed on your end.
 */
export async function sendSol(
  actor: any,
  toAddress: string,
  solAmount: number,
): Promise<AutonomousSendResult> {
  const lamports = solToLamports(solAmount);
  const result = await actor.sendSol(toAddress, lamports);
  if ("err" in result) throw new Error(result.err);
  return result.ok;
}

/**
 * SIGN-ONLY DEPOSIT — Send SOL to a registered treasury.
 *
 * The canister signs a TX sending 100% of your SOL to the target
 * treasury, then calls that canister's expectDeposit to register it.
 *
 * Supported targets:
 *   - ICP-SOL Swap (w2vjc): you send SOL, receive ICP at oracle rate
 *   - mSOL (crmds): you send SOL, receive yield-bearing mSOL on ICP
 *   - SOL Borrow V3 (p7teu): you send SOL collateral, receive USDC loan
 *
 * Flow:
 *   1. fetchSolanaBlockhash()
 *   2. signDeposit(targetCanister, lamports, blockhash) → signed TX + depositId
 *   3. broadcastSolanaTx(signedTxBase64) → SOL arrives at treasury
 *   4. Target canister auto-detects deposit → sends ICP/mSOL/USDC to you
 */
export async function signDeposit(
  actor: any,
  targetCanisterId: string,
  solAmount: number,
): Promise<{ txSignature: string; signedTxBase64: string; depositId: bigint }> {
  const blockhash = await fetchSolanaBlockhash();
  const lamports = solToLamports(solAmount);

  const result = await actor.signDeposit(
    Principal.fromText(targetCanisterId),
    lamports,
    blockhash,
    [], // no borrow params for swap/mSOL
  );
  if ("err" in result) throw new Error(result.err);

  const { signedTxBase64, txSignature, depositId } = result.ok;

  // Broadcast promptly — target canister starts checking within 15s
  await broadcastSolanaTx(signedTxBase64);

  return { txSignature, signedTxBase64, depositId };
}

/**
 * AUTONOMOUS DEPOSIT — Send SOL to treasury, canister handles everything.
 *
 * One call. The canister:
 *   1. Fetches Solana blockhash via HTTP outcall
 *   2. Signs TX sending SOL to target treasury
 *   3. Broadcasts to 3 Solana RPCs
 *   4. Calls target canister's expectDeposit
 *
 * You receive ICP/mSOL/USDC automatically after Solana confirms.
 */
export async function depositSol(
  actor: any,
  targetCanisterId: string,
  solAmount: number,
): Promise<AutonomousDepositResult> {
  const lamports = solToLamports(solAmount);
  const result = await actor.depositSol(
    Principal.fromText(targetCanisterId),
    lamports,
    [], // no borrow params for swap/mSOL
  );
  if ("err" in result) throw new Error(result.err);
  return result.ok;
}

// ═══════════════════════════════════════════════════════════════
//  SHORTCUT FUNCTIONS — Named by what you get back
// ═══════════════════════════════════════════════════════════════

/** Send SOL, receive ICP at oracle rate. Autonomous — one call. */
export async function solToIcp(actor: any, solAmount: number) {
  return depositSol(actor, ICP_SOL_SWAP, solAmount);
}

/** Send SOL, receive yield-bearing mSOL. Autonomous — one call. */
export async function solToMsol(actor: any, solAmount: number) {
  return depositSol(actor, CKSOL_CANISTER, solAmount);
}

/** Send SOL, receive ICP. Sign-only — you broadcast. */
export async function signSolToIcp(actor: any, solAmount: number) {
  return signDeposit(actor, ICP_SOL_SWAP, solAmount);
}

/** Send SOL, receive mSOL. Sign-only — you broadcast. */
export async function signSolToMsol(actor: any, solAmount: number) {
  return signDeposit(actor, CKSOL_CANISTER, solAmount);
}

// ═══════════════════════════════════════════════════════════════
//  VERIFICATION TEST — Call this to confirm your integration works
// ═══════════════════════════════════════════════════════════════

/**
 * Run a basic integration test:
 *   1. Derives your Solana address
 *   2. Checks the fee treasury address
 *   3. Lists registered treasuries
 *
 * Does NOT send any SOL — safe to call anytime.
 */
export async function verifyIntegration(actor: any): Promise<{
  myAddress: string;
  feeTreasury: string;
  treasuries: [string, string][];
}> {
  const [addr, fee, treasuries] = await Promise.all([
    actor.getMyAddress(),
    actor.getFeeTreasuryAddress(),
    actor.getRegisteredTreasuries(),
  ]);

  const result = {
    myAddress: addr.address,
    feeTreasury: fee,
    treasuries: treasuries.map(([p, sol]: [any, string]) => [p.toText(), sol]),
  };

  console.log("✓ Sovereign Send Integration Verified");
  console.log("  Your SOL address:", result.myAddress);
  console.log("  Fee treasury:", result.feeTreasury);
  console.log("  Registered treasuries:", result.treasuries.length);
  for (const [canister, solAddr] of result.treasuries) {
    console.log("    ", canister, "→", solAddr.slice(0, 12) + "...");
  }

  return result;
}
