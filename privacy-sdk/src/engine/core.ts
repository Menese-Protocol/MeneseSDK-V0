// The private-balance engine: the shielded-ledger client (../zk, the same code the ledger's end-to-end
// tests run) driven step by step, with real progress, planned fees and phone-friendly work placement.
//
// Where the work happens:
//   - proofs: a dedicated Web Worker (prover-worker.js); the main thread only builds witnesses
//   - finding claimable payments: a pool of scan workers sized to the device (claimScan.js)
//   - everything that leaves the device: transfers from one-time identities (wallet.js), address
//     lookups and log reads anonymously, only "make private" and "move out" under the user's own
//     principal (the ICP ledger sees those regardless)
// Secrets (note keys, the vetKey) live in memory while the engine is open; the device keeps only what the
// client already encrypts with a vetKey-derived key (note cache, this device's activity list).

import type { Principal } from "@dfinity/principal";
import * as W from "../zk/wallet.js";
import * as C from "../zk/claims.js";
import * as A from "../zk/auth.js";
import * as ic from "../zk/ic.js";
import * as R from "../zk/receipt.js";
import { configureZk } from "../zk/config.js";
import { envelopeContext, decoyFor } from "../zk/envelope.js";
import { loadKeyset } from "../zk/keyset.js";
import { defaultKeysetStore } from "../zk/keysetCache.js";
import { createScanPool } from "../zk/claimScan.js";
import initProver, * as proverMain from "../zk/prover-pkg/pool_prover_wasm.js";
import { planAction, TOP_UP_E8S, type Kind, type Plan } from "./plan";
import type { Activity, Fees, IncomingPayment, OnProgress, PendingSent, Progress, Quote, Receipt, ReceivedPayment, SendOptions, SendResult, StepId } from "../types";

export interface ZkNetwork {
  host: string;
  zkLedger: string;
  token: string;
  directory: string;
  vetkdMasterKey: string;
  /// Where the proving keys are served (relative to the app's origin).
  keysBase: string;
  /// Refuse to prove against a ledger whose verifying keys are not frozen (mainnet: true).
  requireFrozenKeys: boolean;
}

export interface Snapshot {
  privateE8s: bigint;
  publicE8s: bigint;
  noteCount: number;
  incoming: IncomingPayment[];
  pendingSent: PendingSent[];
  /// Every payment this account has received, newest first: direct payments and claimable ones.
  received: ReceivedPayment[];
  registered: boolean;
}

/// Where the engine finds what a browser gives it for free. Every field is optional: in a browser
/// the defaults are right; in Node, `node.js` (createNodeEngine) fills them in.
export interface EngineOptions {
  /// The prover's wasm (bytes or a compiled module); default: fetched next to its glue code.
  proverWasm?: BufferSource | WebAssembly.Module;
  /// The claim scanner's wasm; default: fetched next to its glue code.
  scanWasm?: BufferSource | WebAssembly.Module;
  /// The encrypted note cache ({ get, set, delete }); default: IndexedDB when there is one, else none.
  store?: { get(k: string): Promise<any>; set(k: string, v: any): Promise<any>; delete(k: string): Promise<any> } | null;
  /// Where the proving keys are cached; default: IndexedDB when there is one, else none.
  keysetStore?: { get(k: string): Promise<any>; put(k: string, v: any): Promise<any>; clear(): Promise<any> } | null;
  /// How the proving keys are fetched from `keysBase`; default: the global fetch.
  fetchKeys?: typeof fetch;
  /// Claim scan workers; default: from the device's cores and memory.
  scanWorkers?: number;
}

type Listener = (payment: ReceivedPayment) => void | Promise<void>;

type Note = { v: bigint; rho: string; rcm: string; cm: string; position: number; claim?: any; pay?: any; paid?: any };
type ReceivedNote = { position: number; v: bigint; rho: string; rcm: string; time: number | null; pay?: any };

// Progress weights per stage (sum 1 over an action). Proofs dominate on phones.
const WEIGHT: Record<StepId, number> = { keys: 0.25, prepare: 0.2, approve: 0.08, prove: 0.32, submit: 0.1, confirm: 0.05 };

class Progressor {
  private done = 0;
  private total: number;
  constructor(private steps: StepId[], private on: OnProgress) {
    this.total = steps.reduce((t, s) => t + WEIGHT[s], 0);
  }
  at(step: StepId, within = 0, bytes?: Progress["bytes"]) {
    const before = this.steps.slice(0, this.steps.indexOf(step)).reduce((t, s) => t + WEIGHT[s], 0);
    this.done = Math.max(this.done, before + WEIGHT[step] * Math.min(1, within));
    this.on({ step, fraction: Math.min(0.99, this.done / this.total), bytes });
  }
}

/// A fetch that reports bytes as they arrive, for the one-time key download.
function progressFetch(onBytes: (done: number, total: number) => void, expectedTotal: number, base: typeof fetch = fetch): typeof fetch {
  let done = 0;
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await base(input, init);
    if (!response.ok || !response.body) return response;
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    for (;;) {
      const { done: end, value } = await reader.read();
      if (end) break;
      chunks.push(value);
      done += value.length;
      // a retried part counts its bytes twice; the bar stops at full rather than running past it
      onBytes(Math.min(done, expectedTotal), expectedTotal);
    }
    return new Response(new Blob(chunks as BlobPart[]), { status: response.status, headers: response.headers });
  }) as typeof fetch;
}

const KEYSET_BYTES = 8_903_520;

/// The public ICP balance of `principal`, read with no identity and no open engine: one query, so a
/// screen can show it while the engine is still opening (or before it is ever opened).
export async function publicBalanceOf(net: ZkNetwork, principal: Principal): Promise<bigint> {
  configureZk(net);
  return BigInt(await ic.anonymousTokenBalance(principal));
}

export class PrivateEngine {
  private actors: any = null;
  private account: any = null;
  private wasm: any = null; // the main-thread prover module with prove_* routed to the worker
  private keys: { transfer: Uint8Array; deposit: Uint8Array } | null = null;
  private keysLoading: Promise<void> | null = null;
  private worker: Worker | null = null;
  private pending = new Map<number, { resolve: (v: string) => void; reject: (e: Error) => void }>();
  private nextId = 0;
  private onProved: (() => void) | null = null;
  private onApproved: (() => void) | null = null;
  private spent = new Set<string>();
  /// nullifier → log position of output 1 of the transfer that spent it
  private spentAt = new Map<string, number>();
  private spentCursor = 0;
  private receivedNotes: ReceivedNote[] = [];
  /// claimable payments to this account whose parts are spent: who spent them (by reference)
  private settled = new Map<string, { status: "paid" | "takenBack"; sweep: { position: number; rcm: string; v: bigint } | null }>();
  private listeners = new Set<Listener>();
  /// references already passed to onPayment listeners
  private reported = new Set<string>();
  private notes: Note[] = [];
  private claimsFound: any[] = [];
  private claimsCursor = 0;
  private scanPool: any = null;
  private scanPoolReady: Promise<any> | null = null;
  fees: Fees = { sendE8s: 10_000_000n, moveOutBps: 30, ledgerE8s: 10_000n };
  snapshot: Snapshot = { privateE8s: 0n, publicE8s: 0n, noteCount: 0, incoming: [], pendingSent: [], received: [], registered: false };

  constructor(
    private net: ZkNetwork,
    private identity: any,
    private makeProverWorker: () => Worker,
    private makeScanWorker: () => Worker,
    private options: EngineOptions = {},
  ) {}

  get keysCached() {
    return this.keys !== null;
  }

  // ─── open and close ───────────────────────────────────────────────────────────────────────────────

  /// Turn on private balance for this account: file its private address in the directory. Until then
  /// nobody can send to it directly; payments to it arrive as claimable payments.
  async enable(): Promise<void> {
    await this.register();
  }

  async open(): Promise<void> {
    configureZk(this.net);
    await initProver(this.options.proverWasm ? { module_or_path: this.options.proverWasm } : undefined);
    this.worker = this.makeProverWorker();
    this.worker.onmessage = (event: MessageEvent) => {
      const m = event.data;
      if (m.type === "keys-ready") return;
      const job = this.pending.get(m.id);
      if (!job) return;
      this.pending.delete(m.id);
      if (m.type === "error") job.reject(new Error(m.error));
      else {
        this.onProved?.();
        job.resolve(m.out);
      }
    };
    const prove = (type: string, args: unknown[]) =>
      new Promise<string>((resolve, reject) => {
        const id = this.nextId++;
        this.pending.set(id, { resolve, reject });
        this.worker!.postMessage({ type, id, args });
      });
    this.wasm = {
      ...proverMain,
      // the keyset bytes are already in the worker; the argument stays for the client's call shape
      prove_deposit: (_pk: Uint8Array, value: bigint, pk: string, rho: string, rcm: string) => prove("prove_deposit", [value, pk, rho, rcm]),
      prove_transfer: (_pk: Uint8Array, witness: string) => prove("prove_transfer", [witness]),
    };
    this.actors = await ic.actorsFor(this.identity);
    // report the moment the ledger allowance is in place (make private: prove → approve → submit)
    const token = this.actors.token;
    this.actors.token = new Proxy(token, {
      get: (target, prop) =>
        prop === "icrc2_approve"
          ? async (...args: unknown[]) => {
              const r = await target.icrc2_approve(...args);
              this.onApproved?.();
              return r;
            }
          : target[prop],
    });
    this.account = await A.vetkeyShieldedAccountFor(this.wasm, this.actors);
    const entry = await W.lookupPrincipal(this.actors, this.actors.principal.toText());
    this.snapshot.registered = !!entry && entry.shielded_pk === this.account.pk && entry.enc_pk === A.encPkHex(this.account.encPk);
    if (entry && !this.snapshot.registered) {
      throw new Error("This account already has a different private address. Nothing was changed.");
    }
    const anon = await ic.anonymousLedger();
    const [sendFee, protocol] = await Promise.all([anon.required_transfer_fee(0n), anon.protocol_fee_status()]);
    this.fees = { sendE8s: BigInt(sendFee), moveOutBps: Number(protocol.unshield_bps), ledgerE8s: BigInt(protocol.transparent_ledger_fee) };
  }

  close() {
    this.worker?.terminate();
    this.scanPool?.close();
    for (const job of this.pending.values()) job.reject(new Error("closed"));
    this.pending.clear();
  }

  /// Spent nullifiers, built locally from the public log (no per-note queries, which would tell the
  /// node providers which notes this account owns). The log is append-only: only the tail is read each time.
  private async spentSet(): Promise<Set<string>> {
    const total = Number((await this.actors.ledger.status()).log_length);
    if (total > this.spentCursor) {
      const tail = await W.readNotes(this.actors, { from: this.spentCursor, to: total });
      for (const rec of tail) {
        for (const nf of rec.nullifiers) {
          this.spent.add(nf);
          if (!this.spentAt.has(nf)) this.spentAt.set(nf, rec.position); // output 1 comes first
        }
      }
      this.spentCursor = total;
    }
    return this.spent;
  }

  moveOutFee(amount: bigint): bigint {
    return this.fees.ledgerE8s + (amount * BigInt(this.fees.moveOutBps) + 9_999n) / 10_000n;
  }

  /// Notes, public balance, claimable payments to this account, and this account's own unclaimed sends.
  async sync(onScan?: (done: number, total: number) => void): Promise<Snapshot> {
    const store = this.options.store !== undefined ? this.options.store : (globalThis as any).indexedDB ? W.indexedDbStore() : null;
    const [scan, publicE8s] = await Promise.all([
      W.syncWallet(this.actors, this.wasm, this.account, { store }),
      W.tokenBalance(this.actors, this.actors.principal),
    ]);
    this.notes = scan.notes;
    this.receivedNotes = scan.received;
    const spent = await this.spentSet();
    // made once, even when two syncs start together
    this.scanPoolReady ??= (async () => {
      const scanWasm = this.options.scanWasm ?? (await (await fetch(new URL("../zk/claim-scan-pkg/claim_scan_wasm_bg.wasm", import.meta.url))).arrayBuffer());
      const nav = (globalThis as any).navigator;
      const memory = nav?.deviceMemory as number | undefined;
      const cores = nav?.hardwareConcurrency || 4;
      // leave a core for the page; low-memory phones get two workers
      const workers = this.options.scanWorkers ?? (memory !== undefined && memory < 3 ? 2 : Math.max(1, Math.min(cores - 1, 6)));
      this.scanPool = await createScanPool({ vetKey: this.account.vetKey, wasm: scanWasm, makeWorker: this.makeScanWorker, workers });
      return this.scanPool;
    })().catch((e) => {
      this.scanPoolReady = null; // a failed start is tried again by the next sync
      throw e;
    });
    await this.scanPoolReady;
    const fresh = await C.scanClaims(this.actors, this.wasm, this.account.vetKey, {
      from: this.claimsCursor,
      spent,
      scanner: this.scanPool,
      onProgress: onScan ?? null,
    });
    this.claimsCursor = fresh.cursor;
    // earlier finds stay known; their spent flags are refreshed against the current spent set
    const byNote = new Map<string, any>();
    for (const c of [...this.claimsFound, ...fresh.claims]) byNote.set(c.note.cm, { ...c, spent: spent.has(this.wasm.note_nullifier_hex(c.nk, c.note.rho)) });
    this.claimsFound = [...byNote.values()];
    const groups = C.groupPayments(this.claimsFound);
    const incoming: IncomingPayment[] = groups
      .filter((p: any) => p.complete && p.total > this.fees.sendE8s)
      .map((p: any) => ({
        id: p.otkNk,
        amountE8s: p.total - this.fees.sendE8s, // what lands after the claim's fee
        reference: p.reference ?? "",
        receivedAt: Math.min(...p.notes.map((n: any) => Number(n.time) / 1e6)),
      }));
    const received = await this.receivedList(groups);
    const pending = await C.pendingFromMemos(this.actors, this.wasm, this.notes, spent, this.account.nk);
    const pendingSent: PendingSent[] = pending
      .filter((p: any) => p.complete)
      .map((p: any) => ({ id: p.otkNk, to: p.to, amountE8s: p.total - this.fees.sendE8s }));
    this.snapshot = {
      ...this.snapshot,
      privateE8s: this.notes.reduce((t, n) => t + n.v, 0n),
      publicE8s: BigInt(publicE8s),
      noteCount: this.notes.length,
      incoming,
      pendingSent,
      received,
    };
    await this.report(received);
    return this.snapshot;
  }

  // ─── payments received (a shop's inbox) ───────────────────────────────────────────────────────

  /// Direct payments (found by the note scan) and claimable ones (found by the claim scan), with
  /// what happened to each claimable one: still waiting, claimed by this account, or taken back.
  private async receivedList(groups: any[]): Promise<ReceivedPayment[]> {
    const out: ReceivedPayment[] = this.receivedNotes.map((r) => ({
      reference: C.formatNoteReference(r.position),
      amountE8s: r.v,
      orderId: W.orderIdFrom(r.pay),
      receivedAt: r.time ?? 0,
      status: "paid",
      kind: "direct",
      claimId: null,
    }));
    for (const g of groups) {
      if (!g.reference) continue; // a part is still missing from the claim log scan
      let status: ReceivedPayment["status"] = "claimable";
      if (g.notes.every((n: any) => n.spent)) {
        let known = this.settled.get(g.reference);
        if (!known) {
          const at = R.sweepPosition(g.notes, this.spentAt);
          const own = at === null ? null : await R.ownNoteRcm(this.actors, this.wasm, this.account, at);
          known = own && at !== null ? { status: "paid", sweep: { position: at, rcm: own.rcm, v: own.v } } : { status: "takenBack", sweep: null };
          this.settled.set(g.reference, known);
        }
        status = known.status;
      } else if (!g.complete) {
        continue;
      }
      const sweep = this.settled.get(g.reference)?.sweep;
      out.push({
        reference: g.reference,
        amountE8s: sweep ? sweep.v : g.total - this.fees.sendE8s,
        orderId: W.orderIdFrom(g.pay),
        receivedAt: Math.floor(Math.min(...g.notes.map((n: any) => Number(n.time) / 1e6))),
        status,
        kind: "claimable",
        claimId: status === "claimable" ? g.otkNk : null,
      });
    }
    return out.sort((a, b) => b.receivedAt - a.receivedAt);
  }

  /// Call `listener` once for every payment that is in this account's private balance: a direct
  /// payment when it is first seen, a claimable one once it is claimed. Each sync() reports the
  /// payments it finds; a new engine (a restarted shop server) reports earlier payments again on
  /// its first sync, so a listener must be safe to call twice for one payment (mark an order paid,
  /// not "add to the total"). Returns a function that removes the listener.
  onPayment(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async report(received: ReceivedPayment[]) {
    const fresh = received.filter((p) => p.status === "paid" && !this.reported.has(p.reference)).sort((a, b) => a.receivedAt - b.receivedAt);
    // all of them are marked before any listener runs: a sync that overlaps this one (an action's
    // own sync while a listener is still busy) must not report them a second time
    for (const p of fresh) this.reported.add(p.reference);
    for (const p of fresh) {
      for (const listener of [...this.listeners]) {
        try {
          await listener(p);
        } catch (e) {
          // a listener's own failure must not stop the inbox; it is reported, not swallowed
          console.error("onPayment listener failed for", p.reference, e);
        }
      }
    }
  }

  // ─── receipts ──────────────────────────────────────────────────────────────────────────────

  /// A receipt for one payment this account made or received: its opening, which anyone can check
  /// with verifyReceipt (src/receipt.ts) without keys. It shows that payment only (amount,
  /// recipient, order id, where it is on the log), never a balance, another payment or a key.
  /// A claimable payment has a receipt once it has been claimed.
  async receipt(reference: string): Promise<Receipt> {
    const ref = C.parsePaymentReference(reference);
    if (!ref) throw new Error("That is not a payment reference (or a digit is wrong).");
    const ledgerId = this.net.zkLedger;
    const me = this.actors.principal.toText();
    await this.spentSet();
    let receipt: any;
    if (ref.kind === "direct") {
      const rec = this.receivedNotes.find((r) => r.position === ref.position);
      receipt = rec ? R.receiptForReceived(ledgerId, me, rec) : await R.receiptForPaid(ledgerId, this.actors, this.wasm, this.account, ref.position);
    } else {
      const text = C.formatReference(ref.indices);
      const group = C.groupPayments(this.claimsFound).find((g: any) => g.reference === text);
      if (group) {
        const known = this.settled.get(text);
        if (!known || known.status !== "paid" || !known.sweep) throw new Error("This payment has not been claimed yet. Claim it first; a receipt can be made once it is in your private balance.");
        receipt = R.receiptForClaimed(ledgerId, text, me, group.otkNk, group.notes, { position: known.sweep.position, rcm: known.sweep.rcm }, known.sweep.v);
      } else {
        const sent = await R.payerClaimableParts(this.actors, this.wasm, this.account, ref.indices);
        const at = R.sweepPosition(sent.parts, this.spentAt);
        if (at === null) throw new Error("This payment has not been claimed yet, so there is nothing to show: until it is claimed you can still take it back.");
        const total = sent.parts.reduce((t: bigint, p: any) => t + p.v, 0n);
        receipt = R.receiptForClaimed(ledgerId, text, sent.to, sent.otk, sent.parts, { position: at, rcm: R.claimedNoteRcm(this.wasm, sent.otk) }, total - this.fees.sendE8s);
      }
    }
    // never hand out a receipt that does not check
    const check = await R.checkReceipt(receipt, { actors: await ic.anonymousActorsAt(this.net), wasm: this.wasm, ledgerId });
    if (!check.valid) {
      throw new Error(
        ref.kind === "claimable"
          ? `A receipt for this payment cannot be made here (${check.reason}). If the recipient claimed it with an earlier version of the app, ask them for the receipt.`
          : `A receipt for this payment cannot be made (${check.reason}).`,
      );
    }
    return receipt as Receipt;
  }

  // ─── keys ──────────────────────────────────────────────────────────────────────────────────

  /// Download (first time) or load from this device, verify against the ledger's certified anchor,
  /// and hand the proving keys to the prover worker.
  ensureKeys(onBytes?: (done: number, total: number) => void): Promise<void> {
    if (this.keys) return Promise.resolve();
    if (!this.keysLoading) {
      this.keysLoading = (async () => {
        const anchor = await (await ic.anonymousLedger()).verifying_key_anchor();
        if (this.net.requireFrozenKeys && !anchor.frozen) {
          throw new Error("The ledger's proof keys are not locked yet, so the app will not use it.");
        }
        const keyset = await loadKeyset(anchor, {
          base: this.net.keysBase,
          store: this.options.keysetStore !== undefined ? this.options.keysetStore : defaultKeysetStore(),
          fetchImpl: onBytes ? progressFetch(onBytes, KEYSET_BYTES, this.options.fetchKeys) : this.options.fetchKeys,
        });
        if (!this.wasm.assert_pk_matches_vk(keyset.transfer, keyset.transferVk) || !this.wasm.assert_pk_matches_vk(keyset.deposit, keyset.depositVk)) {
          throw new Error("The proving keys do not belong to this ledger's verifying keys.");
        }
        const transfer = keyset.transfer.slice();
        const deposit = keyset.deposit.slice();
        this.worker!.postMessage({ type: "keys", transfer: transfer.buffer, deposit: deposit.buffer }, [transfer.buffer, deposit.buffer]);
        this.keys = { transfer: keyset.transfer, deposit: keyset.deposit };
      })().catch((e) => {
        this.keysLoading = null;
        throw e;
      });
    }
    return this.keysLoading;
  }

  // ─── planning ──────────────────────────────────────────────────────────────────────────────

  private plan(kind: Kind, amount: bigint): Plan {
    return planAction({
      kind,
      amountE8s: amount,
      notes: this.notes.map((n) => n.v),
      publicE8s: this.snapshot.publicE8s,
      sendFeeE8s: this.fees.sendE8s,
      ledgerFeeE8s: this.fees.ledgerE8s,
      moveOutFee: (a) => this.moveOutFee(a),
    });
  }

  private stepsFor(plan: Plan, main: StepId[]): StepId[] {
    const prep = plan.steps.some((s) => s.kind === "topUp" || s.kind === "merge");
    return [...(this.keys ? [] : (["keys"] as StepId[])), ...(prep ? (["prepare"] as StepId[]) : []), ...main];
  }

  async quote(kind: "send" | "moveOut", amount: bigint, recipient?: string): Promise<Quote> {
    let k: Kind = kind;
    let claimable = false;
    if (kind === "send") {
      if (!recipient) return { possible: false, reason: "Enter who to pay.", privateFeesE8s: 0n, publicFeesE8s: 0n, claimable: false, steps: [] };
      claimable = !(await W.lookupPrincipal(this.actors, recipient));
      if (claimable) k = "claimable";
    }
    const plan = this.plan(k, amount);
    return {
      possible: plan.possible,
      reason: plan.reason,
      privateFeesE8s: plan.privateFeesE8s,
      publicFeesE8s: plan.publicFeesE8s,
      claimable,
      steps: this.stepsFor(plan, ["prove", "submit", "confirm"]),
    };
  }

  // ─── actions ───────────────────────────────────────────────────────────────────────────────

  private async withProgress<T>(steps: StepId[], onProgress: OnProgress, run: (p: Progressor) => Promise<T>): Promise<T> {
    const p = new Progressor(steps, onProgress);
    if (steps[0] === "keys") {
      p.at("keys", 0, { done: 0, total: KEYSET_BYTES });
      await this.ensureKeys((done, total) => p.at("keys", done / total, { done, total }));
    } else {
      await this.ensureKeys();
    }
    try {
      return await run(p);
    } finally {
      this.onProved = null;
      this.onApproved = null;
    }
  }

  private async register() {
    if (this.snapshot.registered) return;
    const res = await W.registerInDirectory(this.actors, this.account, A.encPkHex(this.account.encPk));
    if ("err" in res) throw new Error(`Could not set up your private balance: ${res.err}`);
    this.snapshot.registered = true;
  }

  private accept(res: { outcome: string }, what: string) {
    if (!String(res.outcome).startsWith("ACCEPT")) throw new Error(`The ledger refused ${what} (${res.outcome}). Nothing was moved.`);
  }

  /// Run the plan's preparation steps (top-ups, merges) against the live note set.
  private async prepare(plan: Plan, p: Progressor) {
    const prep = plan.steps.filter((s) => s.kind === "topUp" || s.kind === "merge");
    let i = 0;
    for (const step of prep) {
      p.at("prepare", i / prep.length);
      if (step.kind === "topUp") {
        const { res } = await W.shield(this.actors, this.wasm, this.keys, this.account, TOP_UP_E8S);
        this.accept(res, "preparing your private balance");
      } else {
        const [a, b] = [...this.notes].sort((x, y) => (x.v > y.v ? -1 : 1));
        const self = { shielded_pk: this.account.pk, enc_pk: A.encPkHex(this.account.encPk) };
        const { res } = await W.privateTransfer(this.actors, this.wasm, this.keys, this.account, [a, b], self, a.v + b.v - this.fees.sendE8s, this.fees.sendE8s);
        this.accept(res, "combining your notes");
      }
      await this.sync();
      i++;
    }
  }

  private largestPair(): [Note, Note] {
    const sorted = [...this.notes].sort((x, y) => (x.v > y.v ? -1 : 1));
    return [sorted[0], sorted[1]];
  }

  async makePrivate(amount: bigint, onProgress: OnProgress): Promise<void> {
    // a balance held in one note cannot move: the first time, add a second (1 e8s) note as well
    const second = this.notes.length === 0;
    const steps: StepId[] = [...(this.keys ? [] : (["keys"] as StepId[])), "prove", "approve", "submit", "confirm"];
    await this.withProgress(steps, onProgress, async (p) => {
      await this.register();
      for (const value of second ? [amount, TOP_UP_E8S] : [amount]) {
        p.at("prove", value === amount ? 0 : 0.5);
        this.onProved = () => p.at("approve");
        this.onApproved = () => p.at("submit");
        const { res } = await W.shield(this.actors, this.wasm, this.keys, this.account, value);
        this.accept(res, "making ICP private");
        p.at("submit", value === amount ? 0.5 : 1);
      }
      p.at("confirm");
      await this.sync();
    });
  }

  /// Pay `recipient` (a principal, as text). `options.orderId` (a string of at most 32 bytes in
  /// UTF-8, or up to 32 bytes) is sealed inside the payment for the recipient alone and bound to it,
  /// so a shop can match the payment to its order. The result's `reference` identifies the payment
  /// for both sides (snapshot.received, receipt) and is safe to share: it opens nothing.
  async sendPrivately(recipient: string, amount: bigint, onProgress: OnProgress, options: SendOptions = {}): Promise<SendResult> {
    W.orderIdBytes(options.orderId); // refuse a bad order id before anything moves
    const entry = await W.lookupPrincipal(this.actors, recipient);
    const plan = this.plan(entry ? "send" : "claimable", amount);
    if (!plan.possible) throw new Error(plan.reason ?? "Not possible");
    return this.withProgress(this.stepsFor(plan, ["prove", "submit", "confirm"]), onProgress, async (p) => {
      await this.prepare(plan, p);
      p.at("prove");
      this.onProved = () => p.at("submit");
      if (entry) {
        const { res, tx } = await W.privateTransfer(this.actors, this.wasm, this.keys, this.account, this.largestPair(), entry, amount, this.fees.sendE8s, {
          payment: { to: recipient, orderId: options.orderId },
        });
        this.accept(res, "the payment");
        p.at("confirm");
        await this.sync();
        // a transfer appends its two outputs in one message: the payment note is output 1, and the
        // ledger's reply counts both; the position is checked against the log, not assumed
        const position = Number(res.note_count) - 2;
        const leaves = await W.leavesInOrder(this.actors);
        if (leaves[position] !== tx.cm_out1_hex) throw new Error("The payment went through, but the ledger's log does not show it where expected. Sync and look for it in your history.");
        return { claimable: false, reference: C.formatNoteReference(position) };
      }
      // claimable: part 1 = amount + the recipient's claim fee; part 2 = 0, spending part 1's change
      const { dpk, pool } = await envelopeContext(this.actors);
      const f = this.fees.sendE8s;
      const pair1 = this.largestPair();
      const sent = await C.sendClaimable(this.actors, this.wasm, this.keys, this.account, {
        dpk,
        poolPrincipal: pool,
        recipient: C.recipientPrincipal(recipient),
        parts: [amount + f, 0n],
        spends: [
          pair1,
          async () => {
            await this.sync();
            const used = new Set(pair1.map((n) => n.cm));
            const rest = this.notes.filter((n) => !used.has(n.cm)).sort((x, y) => (x.v > y.v ? -1 : 1));
            if (rest.length < 2) throw new Error("The first part went through, but the second part has no notes to spend. Try again from Private.");
            return [rest[0], rest[1]];
          },
        ],
        fee: f,
        orderId: options.orderId ?? null,
      });
      for (const r of sent.results) this.accept(r, "the payment");
      if (sent.results.length !== 2) throw new Error("The payment did not complete. Nothing more was sent.");
      p.at("confirm");
      await this.sync();
      if (!sent.reference) throw new Error("The payment went through, but its reference could not be read back from the claim log. Sync and find it in your pending payments.");
      return { claimable: true, reference: sent.reference };
    });
  }

  async claim(paymentId: string, onProgress: OnProgress): Promise<void> {
    const payment = C.groupPayments(this.claimsFound).find((g: any) => g.otkNk === paymentId);
    if (!payment || !payment.complete) throw new Error("That payment is not available to claim.");
    await this.withProgress(this.stepsFor({ steps: [] } as any, ["prove", "submit", "confirm"]), onProgress, async (p) => {
      await this.register();
      p.at("prove");
      this.onProved = () => p.at("submit");
      const { dpk, pool } = await envelopeContext(this.actors);
      const decoy = await decoyFor(dpk, pool);
      const { res } = await C.sweepOneTime(this.actors, this.wasm, this.keys, this.account, payment.notes, { fee: this.fees.sendE8s, ...decoy });
      this.accept(res, "the claim");
      p.at("confirm");
      await this.sync();
    });
  }

  async takeBack(paymentId: string, onProgress: OnProgress): Promise<void> {
    const spent = await this.spentSet();
    const pending = (await C.pendingFromMemos(this.actors, this.wasm, this.notes, spent, this.account.nk)).find((g: any) => g.otkNk === paymentId);
    if (!pending || !pending.complete) throw new Error("That payment has already been claimed or taken back.");
    await this.withProgress(this.stepsFor({ steps: [] } as any, ["prove", "submit", "confirm"]), onProgress, async (p) => {
      p.at("prove");
      this.onProved = () => p.at("submit");
      const { dpk, pool } = await envelopeContext(this.actors);
      const decoy = await decoyFor(dpk, pool);
      const { res } = await C.sweepOneTime(this.actors, this.wasm, this.keys, this.account, pending.notes, { fee: this.fees.sendE8s, ...decoy });
      this.accept(res, "taking the payment back");
      p.at("confirm");
      await this.sync();
    });
  }

  async moveOut(amount: bigint, onProgress: OnProgress): Promise<void> {
    const plan = this.plan("moveOut", amount);
    if (!plan.possible) throw new Error(plan.reason ?? "Not possible");
    await this.withProgress(this.stepsFor(plan, ["prove", "submit", "confirm"]), onProgress, async (p) => {
      await this.prepare(plan, p);
      p.at("prove");
      this.onProved = () => p.at("submit");
      const res = await W.unshield(this.actors, this.wasm, this.keys, this.account, this.largestPair(), amount);
      // an unshield is accepted, then paid out by the ledger's token leg in the same call
      if (!String(res.outcome).startsWith("ACCEPT")) throw new Error(`The ledger refused moving out (${res.outcome}). Nothing was moved.`);
      p.at("confirm");
      await this.sync();
    });
  }

  // ─── this device's activity list (encrypted with a vetKey-derived key) ─────────────────────

  private async activityKey(): Promise<CryptoKey> {
    return crypto.subtle.importKey("raw", this.account.cacheKey, "AES-GCM", false, ["encrypt", "decrypt"]);
  }

  private activityStoreKey() {
    return `menese.private.activity.${this.actors.principal.toText()}`;
  }

  async loadActivity(): Promise<Activity[]> {
    try {
      const raw = localStorage.getItem(this.activityStoreKey());
      if (!raw) return [];
      const bytes = Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
      const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, await this.activityKey(), bytes.slice(12));
      return JSON.parse(new TextDecoder().decode(plain)).map((a: any) => ({ ...a, amountE8s: BigInt(a.amountE8s) }));
    } catch {
      return []; // unreadable (other account, cleared storage): start a fresh list
    }
  }

  async saveActivity(list: Activity[]): Promise<void> {
    try {
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const plain = new TextEncoder().encode(JSON.stringify(list.slice(0, 200).map((a) => ({ ...a, amountE8s: a.amountE8s.toString() }))));
      const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await this.activityKey(), plain));
      const all = new Uint8Array(12 + ct.length);
      all.set(iv);
      all.set(ct, 12);
      localStorage.setItem(this.activityStoreKey(), btoa(String.fromCharCode(...all)));
    } catch {
      /* storage full or blocked: the list lives for this visit only */
    }
  }
}
