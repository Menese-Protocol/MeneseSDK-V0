// Private balance — the contract between the screens and the wallet engine.
//
// The screens never touch note secrets, proofs or keys. They call a PrivateWallet, which is either the
// real engine (engine.ts: the shielded ledger client, proving in a Web Worker) or the mock used by the
// design harness. Amounts are always e8s (ICP has 8 decimals).

export type StepId = "keys" | "prepare" | "approve" | "prove" | "submit" | "confirm";

/// One stage of an action, reported as it happens. `fraction` is 0..1 within the whole action, so the
/// cartouche rope can be drawn from it directly.
export interface Progress {
  step: StepId;
  fraction: number;
  /// Bytes downloaded / total during the one-time key download.
  bytes?: { done: number; total: number };
}

export type OnProgress = (p: Progress) => void;

export interface IncomingPayment {
  id: string;
  amountE8s: bigint;
  /// The payment reference, when known ("6-1-9").
  reference?: string;
  /// ms since epoch, from the ledger's claim log
  receivedAt: number;
}

export type ActivityKind = "madePrivate" | "sent" | "received" | "claimed" | "tookBack" | "movedOut";

export interface Activity {
  id: string;
  kind: ActivityKind;
  amountE8s: bigint;
  at: number;
  /// Recipient principal for sends (kept on this device only).
  counterparty?: string;
  reference?: string;
}

export interface Fees {
  /// Flat protocol fee per private send.
  sendE8s: bigint;
  /// Protocol fee on moving out, in basis points of the amount moved out.
  moveOutBps: number;
  /// ICP ledger fee per token transfer (0.0001 ICP).
  ledgerE8s: bigint;
}

/// A payment this account sent that the recipient has not claimed yet; the sender can take it back.
export interface PendingSent {
  id: string;
  to: string;
  amountE8s: bigint;
}

/// What an action will cost and take, worked out before anything is sent.
export interface Quote {
  possible: boolean;
  reason: string | null;
  /// fees taken from the private balance
  privateFeesE8s: bigint;
  /// ICP network fees taken from the ICP balance (preparing a balance held in one note)
  publicFeesE8s: bigint;
  /// the recipient has no private balance yet: the payment goes as a claimable payment
  claimable: boolean;
  steps: StepId[];
}

export interface PrivateWalletState {
  /// whether this account has turned on private balance; null while that is being checked
  enabled: boolean | null;
  /// false until the first sync finishes
  ready: boolean;
  syncing: boolean;
  privateE8s: bigint | null;
  publicE8s: bigint | null;
  incoming: IncomingPayment[];
  pendingSent: PendingSent[];
  /// Most recent first. Stored on this device only; the ledger does not know any of it.
  activity: Activity[];
  /// true once the proving keys are cached on this device
  keysCached: boolean;
  /// How many separate notes make up the private balance (each send spends two).
  noteCount: number;
  error: string | null;
}

export interface SendResult {
  /// true when the recipient has never used a private balance: they claim it when they next sign in
  claimable: boolean;
  /// The claim reference, for claimable payments only (a payment straight into a private balance
  /// carries a decoy envelope, so there is nothing to look up).
  reference: string | null;
}

export interface PrivateWallet {
  state: PrivateWalletState;
  fees: Fees;
  refresh(): Promise<void>;
  /// Turn on private balance (derives this account's key and files its private address once).
  enable(): Promise<void>;
  makePrivate(amountE8s: bigint, onProgress: OnProgress): Promise<void>;
  quote(kind: "send" | "moveOut", amountE8s: bigint, recipient?: string): Promise<Quote>;
  sendPrivately(recipient: string, amountE8s: bigint, onProgress: OnProgress): Promise<SendResult>;
  claim(paymentId: string, onProgress: OnProgress): Promise<void>;
  takeBack(paymentId: string, onProgress: OnProgress): Promise<void>;
  moveOut(amountE8s: bigint, onProgress: OnProgress): Promise<void>;
}

export const E8S = 100_000_000n;

export function formatIcp(e8s: bigint, maxDecimals = 4): string {
  const negative = e8s < 0n;
  const v = negative ? -e8s : e8s;
  const whole = v / E8S;
  const frac = (v % E8S).toString().padStart(8, "0").slice(0, maxDecimals).replace(/0+$/, "");
  const wholeText = whole.toLocaleString("en-US");
  return `${negative ? "−" : ""}${frac ? `${wholeText}.${frac}` : wholeText}`;
}

/// Parses what a person types ("1", "1.5", "0,25") into e8s; null when it is not a valid amount.
export function parseIcp(text: string): bigint | null {
  const t = text.trim().replace(",", ".");
  if (!/^\d*(\.\d{0,8})?$/.test(t) || t === "" || t === ".") return null;
  const [w, f = ""] = t.split(".");
  return BigInt(w || "0") * E8S + BigInt((f + "00000000").slice(0, 8));
}

export function moveOutFee(amountE8s: bigint, fees: Fees): bigint {
  // the ledger rounds the protocol share up
  const share = (amountE8s * BigInt(fees.moveOutBps) + 9_999n) / 10_000n;
  return share + fees.ledgerE8s;
}
