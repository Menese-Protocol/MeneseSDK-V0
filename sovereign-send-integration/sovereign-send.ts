/**
 * Sovereign Send — Per-User Solana Wallet with Atomic Protocol Fee
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  Sovereign Send gives every ICP user a Solana wallet.       │
 * │  Each wallet is derived from the user's ICP principal via   │
 * │  threshold Schnorr (ed25519). No private key ever exists.   │
 * │                                                             │
 * │  Every send includes an atomic 0.1% protocol fee — built    │
 * │  into the signed TX, unforgeable, invisible to users.       │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                             │
 * │  SIGN-ONLY (0 canister cycles for broadcast):               │
 * │  • getMyAddress()                 — get derived SOL address │
 * │  • signSend(to, amount, bh)       — sign TX, you broadcast  │
 * │  • signDeposit(canister, amt, bh) — sign + expectDeposit    │
 * │                                                             │
 * │  AUTONOMOUS (canister handles everything):                  │
 * │  • sendSol(to, amount)            — fetch bh + sign + send  │
 * │  • depositSol(canister, amount)   — full swap, one call     │
 * │                                                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │  REGISTERED TREASURIES:                                     │
 * │  • ICP-SOL Swap (w2vjc) — SOL→ICP at oracle rate            │
 * │  • SOL Borrow V3 (p7teu) — deposit SOL, borrow USDC        │
 * │  • ckSol/mSOL (crmds) — stake SOL, get yield-bearing mSOL  │
 * └─────────────────────────────────────────────────────────────┘
 *
 * CANISTER ID:  fxjsq-raaaa-aaaab-agdaa-cai
 * FEE:          0.1% (10 bps) — atomic, in every signed TX
 *
 * PREREQUISITES:
 *   npm install @dfinity/agent @dfinity/principal @dfinity/auth-client
 *
 * Made with love by Menese Protocol — https://menese.io
 */

import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { AuthClient } from "@dfinity/auth-client";

// ── Canister IDs ──────────────────────────────────────────────
const SOVEREIGN_SEND_CANISTER_ID = "fxjsq-raaaa-aaaab-agdaa-cai";
const ICP_SOL_SWAP_CANISTER_ID = "w2vjc-2yaaa-aaaab-ae6zq-cai";
const CKSOL_CANISTER_ID = "crmds-kqaaa-aaaaf-qf5aq-cai";
const SOL_BORROW_CANISTER_ID = "p7teu-wyaaa-aaaab-afnvq-cai";

// ── Solana RPCs (for sign-only broadcast) ─────────────────────
const SOLANA_RPCS = [
  "https://api.mainnet-beta.solana.com",
  "https://solana-rpc.publicnode.com",
  "https://rpc.ankr.com/solana",
];

// ── IDL (Candid interface) ────────────────────────────────────
const idlFactory = ({ IDL }: any) => {
  const TreasuryType = IDL.Variant({
    IcpSolSwap: IDL.Null,
    SolBorrow: IDL.Null,
    CkSol: IDL.Null,
  });

  const BorrowParams = IDL.Record({
    iasolExpected: IDL.Nat64,
    iausdToMint: IDL.Nat64,
    minUsdcOut: IDL.Nat64,
    userPubkey: IDL.Vec(IDL.Nat8),
    userUsdcAta: IDL.Vec(IDL.Nat8),
  });

  return IDL.Service({
    // Queries
    getMyAddress: IDL.Func(
      [],
      [IDL.Record({ address: IDL.Text, publicKeyBytes: IDL.Vec(IDL.Nat8) })],
      []
    ),
    getFeeTreasuryAddress: IDL.Func([], [IDL.Text], []),
    getAdmin: IDL.Func([], [IDL.Principal], ["query"]),
    getRegisteredTreasuries: IDL.Func(
      [],
      [IDL.Vec(IDL.Tuple(IDL.Principal, IDL.Text))],
      ["query"]
    ),

    // Sign-only path
    signSend: IDL.Func(
      [IDL.Text, IDL.Nat64, IDL.Text],
      [
        IDL.Variant({
          ok: IDL.Record({
            signedTxBase64: IDL.Text,
            sendAmount: IDL.Nat64,
            feeAmount: IDL.Nat64,
            txSignature: IDL.Text,
          }),
          err: IDL.Text,
        }),
      ],
      []
    ),
    signDeposit: IDL.Func(
      [IDL.Principal, IDL.Nat64, IDL.Text, IDL.Opt(BorrowParams)],
      [
        IDL.Variant({
          ok: IDL.Record({
            signedTxBase64: IDL.Text,
            txSignature: IDL.Text,
            depositId: IDL.Nat,
          }),
          err: IDL.Text,
        }),
      ],
      []
    ),

    // Autonomous path
    sendSol: IDL.Func(
      [IDL.Text, IDL.Nat64],
      [
        IDL.Variant({
          ok: IDL.Record({
            txSignature: IDL.Text,
            sendAmount: IDL.Nat64,
            feeAmount: IDL.Nat64,
          }),
          err: IDL.Text,
        }),
      ],
      []
    ),
    depositSol: IDL.Func(
      [IDL.Principal, IDL.Nat64, IDL.Opt(BorrowParams)],
      [
        IDL.Variant({
          ok: IDL.Record({ txSignature: IDL.Text, depositId: IDL.Nat }),
          err: IDL.Text,
        }),
      ],
      []
    ),
  });
};

// ── Helper: create authenticated actor ────────────────────────
async function createActor(identity: any) {
  const agent = new HttpAgent({ host: "https://icp-api.io", identity });
  return Actor.createActor(idlFactory, {
    agent,
    canisterId: SOVEREIGN_SEND_CANISTER_ID,
  });
}

// ── Helper: fetch Solana blockhash ────────────────────────────
async function fetchBlockhash(): Promise<string> {
  for (const rpc of SOLANA_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
          params: [{ commitment: "confirmed" }],
        }),
      });
      const json = await res.json();
      return json.result.value.blockhash;
    } catch {
      continue;
    }
  }
  throw new Error("Failed to fetch blockhash from all RPCs");
}

// ── Helper: broadcast signed TX ───────────────────────────────
async function broadcastTx(signedTxBase64: string): Promise<string> {
  for (const rpc of SOLANA_RPCS) {
    try {
      const res = await fetch(rpc, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "sendTransaction",
          params: [signedTxBase64, { encoding: "base64", skipPreflight: true }],
        }),
      });
      const json = await res.json();
      if (json.result) return json.result;
    } catch {
      continue;
    }
  }
  throw new Error("Broadcast failed on all RPCs");
}

// ═══════════════════════════════════════════════════════════════
//  EXAMPLES
// ═══════════════════════════════════════════════════════════════

/**
 * Example 1: Get your Solana address
 */
async function getMyAddress(identity: any): Promise<string> {
  const actor = await createActor(identity);
  const result = await actor.getMyAddress();
  console.log("Your Solana address:", result.address);
  console.log("Fund this address with SOL to start using Sovereign Send");
  return result.address;
}

/**
 * Example 2: Sign-Only Send — you broadcast
 * Cheapest option. Canister signs, you handle Solana RPC.
 */
async function signOnlySend(
  identity: any,
  toAddress: string,
  solAmount: number
): Promise<string> {
  const actor = await createActor(identity);
  const lamports = BigInt(Math.round(solAmount * 1e9));
  const blockhash = await fetchBlockhash();

  const result = await actor.signSend(toAddress, lamports, blockhash);
  if ("err" in result) throw new Error(result.err);

  const { signedTxBase64, sendAmount, feeAmount, txSignature } = result.ok;
  console.log(`Signed: ${Number(sendAmount) / 1e9} SOL to dest + ${Number(feeAmount) / 1e9} SOL fee`);

  // Broadcast from browser
  const sig = await broadcastTx(signedTxBase64);
  console.log("TX broadcast:", sig);
  console.log("Solscan: https://solscan.io/tx/" + sig);
  return sig;
}

/**
 * Example 3: Autonomous Send — canister does everything
 * One call. Canister fetches blockhash, signs, broadcasts.
 * Higher cycle cost but simplest integration.
 */
async function autonomousSend(
  identity: any,
  toAddress: string,
  solAmount: number
): Promise<string> {
  const actor = await createActor(identity);
  const lamports = BigInt(Math.round(solAmount * 1e9));

  const result = await actor.sendSol(toAddress, lamports);
  if ("err" in result) throw new Error(result.err);

  console.log(`Sent: ${Number(result.ok.sendAmount) / 1e9} SOL + ${Number(result.ok.feeAmount) / 1e9} fee`);
  console.log("TX:", result.ok.txSignature);
  return result.ok.txSignature;
}

/**
 * Example 4: Swap SOL → ICP (Autonomous)
 * Deposits SOL to ICP-SOL oracle pool. Canister handles everything.
 * You receive ICP at the oracle rate automatically.
 */
async function swapSolToIcp(
  identity: any,
  solAmount: number
): Promise<{ txSignature: string; depositId: number }> {
  const actor = await createActor(identity);
  const lamports = BigInt(Math.round(solAmount * 1e9));

  const result = await actor.depositSol(
    Principal.fromText(ICP_SOL_SWAP_CANISTER_ID),
    lamports,
    [] // no borrow params needed for swaps
  );
  if ("err" in result) throw new Error(result.err);

  console.log("SOL→ICP swap initiated!");
  console.log("TX:", result.ok.txSignature);
  console.log("Deposit ID:", Number(result.ok.depositId));
  console.log("ICP will be sent to your account automatically (~30-60s)");
  return {
    txSignature: result.ok.txSignature,
    depositId: Number(result.ok.depositId),
  };
}

/**
 * Example 5: Stake SOL → mSOL (Autonomous)
 * Deposits SOL to ckSol canister. Receive yield-bearing mSOL.
 */
async function stakeSolForMsol(
  identity: any,
  solAmount: number
): Promise<{ txSignature: string; depositId: number }> {
  const actor = await createActor(identity);
  const lamports = BigInt(Math.round(solAmount * 1e9));

  const result = await actor.depositSol(
    Principal.fromText(CKSOL_CANISTER_ID),
    lamports,
    [] // no borrow params for mSOL
  );
  if ("err" in result) throw new Error(result.err);

  console.log("SOL staked for mSOL!");
  console.log("TX:", result.ok.txSignature);
  console.log("mSOL will be minted to your account after verification");
  return {
    txSignature: result.ok.txSignature,
    depositId: Number(result.ok.depositId),
  };
}

/**
 * Example 6: Sign-Only Swap SOL → ICP (you broadcast)
 * Lower cost. Canister signs + calls expectDeposit, you broadcast.
 */
async function signOnlySwapSolToIcp(
  identity: any,
  solAmount: number
): Promise<string> {
  const actor = await createActor(identity);
  const lamports = BigInt(Math.round(solAmount * 1e9));
  const blockhash = await fetchBlockhash();

  const result = await actor.signDeposit(
    Principal.fromText(ICP_SOL_SWAP_CANISTER_ID),
    lamports,
    blockhash,
    [] // no borrow params
  );
  if ("err" in result) throw new Error(result.err);

  console.log("Signed deposit, expectDeposit registered (ID:", Number(result.ok.depositId), ")");

  // Broadcast promptly — canister starts checking within 15s
  const sig = await broadcastTx(result.ok.signedTxBase64);
  console.log("Broadcast:", sig);
  console.log("ICP will arrive automatically once Solana confirms");
  return sig;
}

// ── Main demo ─────────────────────────────────────────────────
async function main() {
  // Authenticate with Internet Identity
  const authClient = await AuthClient.create();
  const identity = authClient.getIdentity();

  // 1. Get your Solana address (fund it first!)
  const myAddr = await getMyAddress(identity);

  // 2. Send SOL to someone (autonomous — easiest)
  // await autonomousSend(identity, "RecipientBase58Address...", 0.01);

  // 3. Swap SOL → ICP (one call does everything)
  // await swapSolToIcp(identity, 0.1);

  // 4. Stake SOL for mSOL
  // await stakeSolForMsol(identity, 0.05);
}

export {
  getMyAddress,
  signOnlySend,
  autonomousSend,
  swapSolToIcp,
  stakeSolForMsol,
  signOnlySwapSolToIcp,
  createActor,
  fetchBlockhash,
  broadcastTx,
};
