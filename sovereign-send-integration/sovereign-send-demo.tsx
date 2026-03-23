/**
 * Sovereign Send — React Demo Component
 *
 * Drop-in UI for Sovereign Send integration.
 * Shows: wallet address, SOL balance, send form, swap to ICP, convert to mSOL.
 *
 * Prerequisites:
 *   npm install @dfinity/agent @dfinity/principal @dfinity/auth-client react
 *
 * Usage:
 *   import { SovereignSendDemo } from "./sovereign-send-demo";
 *   <SovereignSendDemo identity={authClient.getIdentity()} />
 *
 * Canister: fxjsq-raaaa-aaaab-agdaa-cai
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  createSovereignSendActor,
  getMyAddress,
  signSend,
  sendSol,
  signDeposit,
  depositSol,
  solToIcp,
  solToMsol,
  verifyIntegration,
  fetchSolanaBlockhash,
  broadcastSolanaTx,
  solToLamports,
} from "./sovereign-send";

// ── Solana RPC for balance check ─────────────────────────────
const SOL_RPC = "https://api.mainnet-beta.solana.com";

async function getSolBalance(address: string): Promise<number> {
  try {
    const res = await fetch(SOL_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "getBalance",
        params: [address],
      }),
    });
    const json = await res.json();
    return (json.result?.value ?? 0) / 1e9;
  } catch {
    return 0;
  }
}

// ── Types ─────────────────────────────────────────────────────

interface Props {
  identity: any; // from AuthClient.getIdentity()
}

type Tab = "send" | "swap" | "convert";

// ═══════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════

export function SovereignSendDemo({ identity }: Props) {
  const [actor, setActor] = useState<any>(null);
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("send");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [txHash, setTxHash] = useState("");

  // Send form
  const [sendTo, setSendTo] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [useAutonomous, setUseAutonomous] = useState(true);

  // Swap/convert amount
  const [depositAmount, setDepositAmount] = useState("");

  // ── Init: create actor + get address + balance ─────────
  useEffect(() => {
    (async () => {
      try {
        const a = createSovereignSendActor(identity);
        setActor(a);

        const { address: addr } = await getMyAddress(a);
        setAddress(addr);

        const bal = await getSolBalance(addr);
        setBalance(bal);
      } catch (e: any) {
        setError("Init failed: " + e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [identity]);

  // ── Refresh balance ────────────────────────────────────
  const refreshBalance = useCallback(async () => {
    if (!address) return;
    const bal = await getSolBalance(address);
    setBalance(bal);
  }, [address]);

  // ── Send SOL ───────────────────────────────────────────
  const handleSend = useCallback(async () => {
    if (!actor || !sendTo || !sendAmount) return;
    setStatus("Signing...");
    setError("");
    setTxHash("");

    try {
      const amount = parseFloat(sendAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      if (useAutonomous) {
        // Autonomous: one call, canister handles everything
        setStatus("Sending (autonomous — canister fetches blockhash + broadcasts)...");
        const result = await sendSol(actor, sendTo, amount);
        setTxHash(result.txSignature);
        setStatus(`Sent ${Number(result.sendAmount) / 1e9} SOL + ${Number(result.feeAmount) / 1e9} fee`);
      } else {
        // Sign-only: we fetch blockhash + broadcast
        setStatus("Fetching blockhash...");
        const result = await signSend(actor, sendTo, amount);
        setTxHash(result.txSignature);
        setStatus(`Sent ${Number(result.sendAmount) / 1e9} SOL + ${Number(result.feeAmount) / 1e9} fee`);
      }

      await refreshBalance();
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    }
  }, [actor, sendTo, sendAmount, useAutonomous, refreshBalance]);

  // ── Swap SOL → ICP ────────────────────────────────────
  const handleSwapToIcp = useCallback(async () => {
    if (!actor || !depositAmount) return;
    setStatus("Initiating SOL → ICP swap...");
    setError("");
    setTxHash("");

    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount <= 0) throw new Error("Invalid amount");

      if (useAutonomous) {
        setStatus("Swapping (autonomous)...");
        const result = await solToIcp(actor, amount);
        setTxHash(result.txSignature);
        setStatus(`Swap initiated! Deposit ID: ${Number(result.depositId)}. ICP arriving in ~30-60s.`);
      } else {
        setStatus("Signing deposit + broadcasting...");
        const result = await signDeposit(actor, "w2vjc-2yaaa-aaaab-ae6zq-cai", amount);
        setTxHash(result.txSignature);
        setStatus(`Signed + broadcast! Deposit ID: ${Number(result.depositId)}. ICP arriving in ~30-60s.`);
      }

      await refreshBalance();
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    }
  }, [actor, depositAmount, useAutonomous, refreshBalance]);

  // ── Convert SOL → mSOL ────────────────────────────────
  const handleConvertToMsol = useCallback(async () => {
    if (!actor || !depositAmount) return;
    setStatus("Converting SOL → mSOL...");
    setError("");
    setTxHash("");

    try {
      const amount = parseFloat(depositAmount);
      if (isNaN(amount) || amount < 0.05) throw new Error("Minimum 0.05 SOL for mSOL conversion");

      if (useAutonomous) {
        setStatus("Converting (autonomous)...");
        const result = await solToMsol(actor, amount);
        setTxHash(result.txSignature);
        setStatus(`Conversion initiated! Deposit ID: ${Number(result.depositId)}. mSOL will be credited after verification.`);
      } else {
        setStatus("Signing deposit + broadcasting...");
        const result = await signDeposit(actor, "crmds-kqaaa-aaaaf-qf5aq-cai", amount);
        setTxHash(result.txSignature);
        setStatus(`Signed + broadcast! Deposit ID: ${Number(result.depositId)}. mSOL arriving after verification.`);
      }

      await refreshBalance();
    } catch (e: any) {
      setError(e.message);
      setStatus("");
    }
  }, [actor, depositAmount, useAutonomous, refreshBalance]);

  // ── Render ─────────────────────────────────────────────
  if (loading) return <div style={styles.container}><p>Deriving your Solana wallet...</p></div>;

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Sovereign Send</h2>

      {/* Wallet Info */}
      <div style={styles.card}>
        <p style={styles.label}>Your Solana Address</p>
        <p style={styles.address}>{address}</p>
        <p style={styles.balance}>
          {balance.toFixed(6)} SOL
          <button onClick={refreshBalance} style={styles.refreshBtn}>↻</button>
        </p>
        {balance === 0 && (
          <p style={styles.hint}>
            Send SOL to this address from any wallet or exchange to get started.
          </p>
        )}
      </div>

      {/* Mode toggle */}
      <div style={styles.toggle}>
        <label style={styles.toggleLabel}>
          <input
            type="checkbox"
            checked={useAutonomous}
            onChange={(e) => setUseAutonomous(e.target.checked)}
          />
          {" "}Autonomous mode (canister handles Solana RPC)
        </label>
        <p style={styles.hint}>
          {useAutonomous
            ? "One call — canister fetches blockhash + broadcasts. Simpler but ~500M cycles."
            : "Sign-only — you fetch blockhash + broadcast. Cheaper, more control."}
        </p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        {(["send", "swap", "convert"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setStatus(""); setError(""); setTxHash(""); }}
            style={tab === t ? { ...styles.tab, ...styles.activeTab } : styles.tab}
          >
            {t === "send" ? "Send SOL" : t === "swap" ? "SOL → ICP" : "SOL → mSOL"}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.card}>
        {tab === "send" && (
          <>
            <input
              type="text"
              placeholder="Recipient Solana address (base58)"
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value)}
              style={styles.input}
            />
            <input
              type="number"
              placeholder="Amount (SOL)"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
              step="0.001"
              min="0.00001"
              style={styles.input}
            />
            <p style={styles.hint}>0.1% protocol fee deducted atomically from send amount.</p>
            <button onClick={handleSend} style={styles.button} disabled={!sendTo || !sendAmount}>
              Send SOL
            </button>
          </>
        )}

        {tab === "swap" && (
          <>
            <input
              type="number"
              placeholder="SOL amount to swap"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              step="0.01"
              min="0.001"
              style={styles.input}
            />
            <p style={styles.hint}>SOL is sent to the ICP-SOL oracle pool. You receive ICP at the current oracle rate. No fee on deposit — full amount swapped.</p>
            <button onClick={handleSwapToIcp} style={styles.button} disabled={!depositAmount}>
              Swap SOL → ICP
            </button>
          </>
        )}

        {tab === "convert" && (
          <>
            <input
              type="number"
              placeholder="SOL amount (min 0.05)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              step="0.01"
              min="0.05"
              style={styles.input}
            />
            <p style={styles.hint}>SOL is deposited into the ckSOL pool. You receive mSOL (yield-bearing wrapped SOL) on ICP. Minimum 0.05 SOL.</p>
            <button onClick={handleConvertToMsol} style={styles.button} disabled={!depositAmount}>
              Convert SOL → mSOL
            </button>
          </>
        )}
      </div>

      {/* Status / Error / TX */}
      {status && <p style={styles.status}>⏳ {status}</p>}
      {error && <p style={styles.error}>✗ {error}</p>}
      {txHash && (
        <p style={styles.tx}>
          ✓ TX:{" "}
          <a href={`https://solscan.io/tx/${txHash}`} target="_blank" rel="noopener" style={styles.link}>
            {txHash.slice(0, 20)}...{txHash.slice(-8)}
          </a>
        </p>
      )}
    </div>
  );
}

// ── Inline styles ────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 480, margin: "0 auto", padding: 20, fontFamily: "system-ui, sans-serif" },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 16 },
  card: { background: "#f8f9fa", borderRadius: 12, padding: 16, marginBottom: 16, border: "1px solid #e9ecef" },
  label: { fontSize: 12, color: "#6c757d", marginBottom: 4 },
  address: { fontSize: 13, fontFamily: "monospace", wordBreak: "break-all", color: "#212529" },
  balance: { fontSize: 28, fontWeight: 700, marginTop: 8, color: "#212529" },
  refreshBtn: { marginLeft: 8, background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6c757d" },
  hint: { fontSize: 12, color: "#868e96", marginTop: 4 },
  toggle: { marginBottom: 16 },
  toggleLabel: { fontSize: 14, cursor: "pointer" },
  tabs: { display: "flex", gap: 4, marginBottom: 16 },
  tab: { flex: 1, padding: "10px 0", border: "1px solid #dee2e6", borderRadius: 8, background: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 500 },
  activeTab: { background: "#212529", color: "#fff", borderColor: "#212529" },
  input: { width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #dee2e6", fontSize: 14, marginBottom: 8, boxSizing: "border-box" as const },
  button: { width: "100%", padding: "12px 0", borderRadius: 8, border: "none", background: "#212529", color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", marginTop: 8 },
  status: { fontSize: 13, color: "#495057", marginTop: 8 },
  error: { fontSize: 13, color: "#dc3545", marginTop: 8 },
  tx: { fontSize: 13, color: "#28a745", marginTop: 8 },
  link: { color: "#28a745", textDecoration: "underline" },
};

export default SovereignSendDemo;
