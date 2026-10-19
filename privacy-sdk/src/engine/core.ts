// The private-balance engine: the shielded-ledger client (../zk, the same code the ledger's end-to-end
// tests run) driven step by step, with real progress, planned fees and phone-friendly work placement.
//
// Where the work happens:
//   - proofs: a dedicated Web Worker (prover-worker.js); the main thread only builds witnesses
//   - finding claimable payments: a pool of scan workers sized to the device (claimScan.js)
//   - everything that leaves the device: transfers from one-time identities (wallet.js), address
//     lookups and log reads anonymously, only "make private" and "move out" under the user's own
//     principal (the ICP ledger sees those regardless)
// Secrets (note keys, the vetKey) live in memory for the session; the device keeps only what the
// client already encrypts with a vetKey-derived key (note cache, this device's activity list).

import type { Principal } from "@dfinity/principal";
import * as W from "../zk/wallet.js";
import * as C from "../zk/claims.js";
import * as A from "../zk/auth.js";
import * as ic from "../zk/ic.js";
import { configureZk } from "../zk/config.js";
import { envelopeContext, decoyFor } from "../zk/envelope.js";
import { loadKeyset } from "../zk/keyset.js";
import { defaultKeysetStore } from "../zk/keysetCache.js";
import { createScanPool } from "../zk/claimScan.js";
import initProver, * as proverMain from "../zk/prover-pkg/pool_prover_wasm.js";
import { planAction, TOP_UP_E8S, type Kind, type Plan } from "./plan";
import type { Activity, Fees, IncomingPayment, OnProgress, PendingSent, Progress, Quote, SendResult, StepId } from "../types";

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
  registered: boolean;
}

type Note = { v: bigint; rho: string; rcm: string; cm: string; position: number; claim?: any };

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
function progressFetch(onBytes: (done: number, total: number) => void, expectedTotal: number): typeof fetch {
  let done = 0;
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    const response = await fetch(input, init);
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

/// The public ICP balance of `principal`, read with no identity and no open session: one query, so a
/// screen can show it while the private session is still opening (or before it is ever opened).
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
  private spentCursor = 0;
  private notes: Note[] = [];
  private claimsFound: any[] = [];
  private claimsCursor = 0;
  private scanPool: any = null;
  fees: Fees = { sendE8s: 10_000_000n, moveOutBps: 30, ledgerE8s: 10_000n };
  snapshot: Snapshot = { privateE8s: 0n, publicE8s: 0n, noteCount: 0, incoming: [], pendingSent: [], registered: false };

  constructor(
    private net: ZkNetwork,
    private identity: any,
    private makeProverWorker: () => Worker,
    private makeScanWorker: () => Worker,
  ) {}

  get keysCached() {
    return this.keys !== null;
  }

  // ─── session ───────────────────────────────────────────────────────────────────────────────

  /// Turn on private balance for this account: file its private address in the directory. Until then
  /// nobody can send to it directly; payments to it arrive as claimable payments.
  async enable(): Promise<void> {
    await this.register();
  }

  async open(): Promise<void> {
    configureZk(this.net);
    await initProver();
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
  /// node providers which notes are ours). The log is append-only: only the tail is read each time.
  private async spentSet(): Promise<Set<string>> {
    const total = Number((await this.actors.ledger.status()).log_length);
    if (total > this.spentCursor) {
      const tail = await W.readNotes(this.actors, { from: this.spentCursor, to: total });
      for (const rec of tail) for (const nf of rec.nullifiers) this.spent.add(nf);
      this.spentCursor = total;
    }
    return this.spent;
  }

  moveOutFee(amount: bigint): bigint {
    return this.fees.ledgerE8s + (amount * BigInt(this.fees.moveOutBps) + 9_999n) / 10_000n;
  }

  /// Notes, public balance, claimable payments to this account, and this account's own unclaimed sends.
  async sync(onScan?: (done: number, total: number) => void): Promise<Snapshot> {
    const [scan, publicE8s] = await Promise.all([
      W.syncWallet(this.actors, this.wasm, this.account, { store: W.indexedDbStore() }),
      W.tokenBalance(this.actors, this.actors.principal),
    ]);
    this.notes = scan.notes;
    const spent = await this.spentSet();
    if (!this.scanPool) {
      const scanWasm = await (await fetch(new URL("../zk/claim-scan-pkg/claim_scan_wasm_bg.wasm", import.meta.url))).arrayBuffer();
      const memory = (navigator as any).deviceMemory as number | undefined;
      const cores = navigator.hardwareConcurrency || 4;
      // leave a core for the page; low-memory phones get two workers
      const workers = memory !== undefined && memory < 3 ? 2 : Math.max(1, Math.min(cores - 1, 6));
      this.scanPool = await createScanPool({ vetKey: this.account.vetKey, wasm: scanWasm, makeWorker: this.makeScanWorker, workers });
    }
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
    const incoming: IncomingPayment[] = C.groupPayments(this.claimsFound)
      .filter((p: any) => p.complete && p.total > this.fees.sendE8s)
      .map((p: any) => ({
        id: p.otkNk,
        amountE8s: p.total - this.fees.sendE8s, // what lands after the claim's fee
        reference: "",
        receivedAt: Math.min(...p.notes.map((n: any) => Number(n.time) / 1e6)),
      }));
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
    };
    return this.snapshot;
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
          store: defaultKeysetStore(),
          fetchImpl: onBytes ? progressFetch(onBytes, KEYSET_BYTES) : undefined,
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

  async sendPrivately(recipient: string, amount: bigint, onProgress: OnProgress): Promise<SendResult> {
    const entry = await W.lookupPrincipal(this.actors, recipient);
    const plan = this.plan(entry ? "send" : "claimable", amount);
    if (!plan.possible) throw new Error(plan.reason ?? "Not possible");
    return this.withProgress(this.stepsFor(plan, ["prove", "submit", "confirm"]), onProgress, async (p) => {
      await this.prepare(plan, p);
      p.at("prove");
      this.onProved = () => p.at("submit");
      if (entry) {
        const { res } = await W.privateTransfer(this.actors, this.wasm, this.keys, this.account, this.largestPair(), entry, amount, this.fees.sendE8s);
        this.accept(res, "the payment");
        p.at("confirm");
        await this.sync();
        return { claimable: false, reference: null };
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
      });
      for (const r of sent.results) this.accept(r, "the payment");
      if (sent.results.length !== 2) throw new Error("The payment did not complete. Nothing more was sent.");
      p.at("confirm");
      await this.sync();
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
