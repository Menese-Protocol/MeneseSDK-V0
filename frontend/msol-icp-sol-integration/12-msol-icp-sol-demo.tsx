/**
 * MeneseSDK — mSOL & ICP-SOL Demo Component
 *
 * A complete, self-contained React component showing all 7 flows:
 *   1. mSOL deposit (autonomous)       — one-click SOL → mSOL
 *   2. mSOL deposit (sign-only)        — sign + broadcast yourself
 *   3. mSOL redeem                     — approve + burn + broadcast
 *   4. SOL → ICP (autonomous)          — one-click SOL → ICP
 *   5. SOL → ICP (sign-only)           — sign + broadcast yourself
 *   6. ICP → SOL (autonomous)          — approve + swap, pool broadcasts
 *   7. ICP → SOL (sign-only)           — approve + swap + broadcast yourself
 *
 * Dependencies:
 *   npm install @dfinity/agent @dfinity/principal @dfinity/auth-client react
 *
 * Usage:
 *   import { MsolIcpSolDemo } from "./12-msol-icp-sol-demo";
 *   <MsolIcpSolDemo />
 *
 * Made with love by Menese Protocol
 * https://menese.io
 */

import React, { useState, useEffect, useCallback } from "react";
import { HttpAgent } from "@dfinity/agent";
import {
  CONFIG,
  createAuthAgent,
  depositMsolAutonomous,
  depositMsolSignOnly,
  redeemMsol,
  depositSolForIcp,
  depositSolForIcpSignOnly,
  swapIcpToSol,
  swapIcpToSolSignOnly,
  getMySolAddress,
  getMsolBalance,
  getCksolRate,
  fmtSol,
  fmtIcp,
  fmtRate,
} from "./12-msol-icp-sol";

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

type Tab = "msol" | "icp-sol";
type MsolAction = "deposit" | "redeem";
type IcpSolDirection = "sol-to-icp" | "icp-to-sol";
type PathMode = "autonomous" | "sign-only";
type Status = "idle" | "loading" | "success" | "error";

interface TxResult {
  message: string;
  explorerUrl?: string;
}

// ══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════

export function MsolIcpSolDemo() {
  // Auth
  const [agent, setAgent] = useState<HttpAgent | null>(null);
  const [principal, setPrincipal] = useState("");
  const [connecting, setConnecting] = useState(false);

  // Wallet data
  const [solAddress, setSolAddress] = useState("");
  const [msolBalance, setMsolBalance] = useState<bigint>(0n);
  const [rate, setRate] = useState<{ solPerCkSolE9: bigint } | null>(null);

  // UI state
  const [tab, setTab] = useState<Tab>("msol");
  const [msolAction, setMsolAction] = useState<MsolAction>("deposit");
  const [icpSolDir, setIcpSolDir] = useState<IcpSolDirection>("sol-to-icp");
  const [pathMode, setPathMode] = useState<PathMode>("autonomous");
  const [amount, setAmount] = useState("");
  const [solDest, setSolDest] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<TxResult | null>(null);
  const [error, setError] = useState("");

  // ── Connect ──
  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      const a = await createAuthAgent();
      setAgent(a);
      const p = await a.getPrincipal();
      setPrincipal(p.toText());
    } catch (e: any) {
      setError(e.message);
    }
    setConnecting(false);
  }, []);

  // ── Load wallet data ──
  const loadData = useCallback(async () => {
    if (!agent) return;
    try {
      const [addr, bal, r] = await Promise.all([
        getMySolAddress(agent),
        getMsolBalance(agent).catch(() => 0n),
        getCksolRate(agent).catch(() => null),
      ]);
      setSolAddress(addr);
      setSolDest(prev => prev || addr); // default redeem destination (only if not yet set)
      setMsolBalance(bal);
      if (r) setRate(r);
    } catch (e: any) {
      console.warn("Load data:", e.message);
    }
  }, [agent]);

  useEffect(() => { loadData(); }, [loadData]);

  // ── Execute ──
  const execute = async () => {
    if (!agent || !amount) return;
    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const amt = parseFloat(amount);
      if (isNaN(amt) || amt <= 0) throw new Error("Enter a valid amount");

      let res: TxResult;

      // ── mSOL TAB ──
      if (tab === "msol") {
        if (msolAction === "deposit") {
          if (pathMode === "autonomous") {
            const d = await depositMsolAutonomous(amt, agent);
            res = {
              message: `Deposited ${amt} SOL → mSOL. Deposit #${d.depositId}`,
              explorerUrl: `https://solscan.io/tx/${d.txSignature}`,
            };
          } else {
            const d = await depositMsolSignOnly(amt, agent);
            res = {
              message: `Sign-only deposit broadcast. Sig: ${d.signatureBase58.slice(0, 16)}...`,
              explorerUrl: `https://solscan.io/tx/${d.signatureBase58}`,
            };
          }
        } else {
          // Redeem
          if (!solDest) throw new Error("Enter a Solana destination address");
          const d = await redeemMsol(amt, solDest, agent);
          res = {
            message: `Redeemed ${amt} mSOL → SOL. Redemption #${d.redemptionId}`,
            explorerUrl: d.explorerUrl,
          };
        }
      }

      // ── ICP-SOL TAB ──
      else {
        if (icpSolDir === "sol-to-icp") {
          if (pathMode === "autonomous") {
            const d = await depositSolForIcp(amt, agent);
            res = {
              message: `Deposited ${amt} SOL → ICP. Expected deposit #${d.expectedDepositId}`,
              explorerUrl: `https://solscan.io/tx/${d.txSignature}`,
            };
          } else {
            const d = await depositSolForIcpSignOnly(amt, agent);
            res = {
              message: `Sign-only SOL→ICP broadcast. Sig: ${d.signatureBase58.slice(0, 16)}...`,
              explorerUrl: `https://solscan.io/tx/${d.signatureBase58}`,
            };
          }
        } else {
          // ICP → SOL
          if (!solDest) throw new Error("Enter a Solana destination address");
          if (pathMode === "autonomous") {
            const d = await swapIcpToSol(amt, solDest, agent);
            res = {
              message: `Swapped ${amt} ICP → SOL. Swap #${d.id}. Output: ${Number(d.expectedOutput) / 1e9} SOL`,
              explorerUrl: d.solTxHash ? `https://solscan.io/tx/${d.solTxHash}` : undefined,
            };
          } else {
            const d = await swapIcpToSolSignOnly(amt, solDest, agent);
            res = {
              message: `Sign-only ICP→SOL. Swap #${d.swapId}. Output: ${Number(d.solOutputLamports) / 1e9} SOL`,
            };
          }
        }
      }

      setResult(res!);
      setStatus("success");
      setAmount("");
      loadData(); // refresh balances
    } catch (e: any) {
      setError(e.message || "Transaction failed");
      setStatus("error");
    }
  };

  // ── Derived state ──
  const needsSolDest = (tab === "msol" && msolAction === "redeem") || (tab === "icp-sol" && icpSolDir === "icp-to-sol");
  const inputLabel = tab === "icp-sol" && icpSolDir === "icp-to-sol" ? "ICP" : tab === "msol" && msolAction === "redeem" ? "mSOL" : "SOL";
  const buttonLabel = tab === "msol"
    ? msolAction === "deposit" ? "Deposit SOL → mSOL" : "Redeem mSOL → SOL"
    : icpSolDir === "sol-to-icp" ? "Deposit SOL → ICP" : "Swap ICP → SOL";

  // ══════════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════════

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>Menese DeFi</h2>
          <p style={styles.subtitle}>mSOL Staking & ICP-SOL Swap</p>
        </div>

        {/* Connect */}
        {!agent ? (
          <button onClick={connect} disabled={connecting} style={styles.connectBtn}>
            {connecting ? "Connecting..." : "Connect with Internet Identity"}
          </button>
        ) : (
          <div style={styles.infoBox}>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Principal</span>
              <span style={styles.infoValue}>{principal.slice(0, 12)}...{principal.slice(-6)}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>SOL Address</span>
              <span style={styles.infoValue}>{solAddress ? `${solAddress.slice(0, 8)}...${solAddress.slice(-6)}` : "Loading..."}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>mSOL Balance</span>
              <span style={styles.infoValue}>{fmtSol(msolBalance)} mSOL</span>
            </div>
            {rate && (
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Rate</span>
                <span style={styles.infoValue}>1 mSOL = {fmtRate(rate.solPerCkSolE9)} SOL</span>
              </div>
            )}
          </div>
        )}

        {agent && (
          <>
            {/* Tab Selector */}
            <div style={styles.tabRow}>
              <button onClick={() => setTab("msol")} style={tab === "msol" ? styles.tabActive : styles.tab}>
                mSOL Staking
              </button>
              <button onClick={() => setTab("icp-sol")} style={tab === "icp-sol" ? styles.tabActive : styles.tab}>
                ICP-SOL Swap
              </button>
            </div>

            {/* Action Selector */}
            <div style={styles.tabRow}>
              {tab === "msol" ? (
                <>
                  <button onClick={() => setMsolAction("deposit")} style={msolAction === "deposit" ? styles.pillActive : styles.pill}>Deposit</button>
                  <button onClick={() => setMsolAction("redeem")} style={msolAction === "redeem" ? styles.pillActive : styles.pill}>Redeem</button>
                </>
              ) : (
                <>
                  <button onClick={() => setIcpSolDir("sol-to-icp")} style={icpSolDir === "sol-to-icp" ? styles.pillActive : styles.pill}>SOL → ICP</button>
                  <button onClick={() => setIcpSolDir("icp-to-sol")} style={icpSolDir === "icp-to-sol" ? styles.pillActive : styles.pill}>ICP → SOL</button>
                </>
              )}
            </div>

            {/* Path Mode */}
            <div style={styles.pathRow}>
              <span style={styles.pathLabel}>Execution:</span>
              <button onClick={() => setPathMode("autonomous")} style={pathMode === "autonomous" ? styles.pathBtnActive : styles.pathBtn}>
                Autonomous
              </button>
              <button onClick={() => setPathMode("sign-only")} style={pathMode === "sign-only" ? styles.pathBtnActive : styles.pathBtn}>
                Sign-Only
              </button>
            </div>
            <p style={styles.pathHint}>
              {pathMode === "autonomous"
                ? "One call — SDK signs, broadcasts, and registers automatically."
                : "SDK signs, you control broadcasting. Uses your Solana RPC."}
            </p>

            {/* Amount Input */}
            <div style={styles.inputGroup}>
              <label style={styles.inputLabel}>Amount ({inputLabel})</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`0.0 ${inputLabel}`}
                style={styles.input}
                step="0.001"
                min="0"
              />
            </div>

            {/* SOL Destination (redeem + ICP→SOL) */}
            {needsSolDest && (
              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>SOL Destination Address</label>
                <input
                  type="text"
                  value={solDest}
                  onChange={(e) => setSolDest(e.target.value)}
                  placeholder="Your Solana address (base58)"
                  style={styles.input}
                />
                <p style={styles.hint}>
                  Defaults to your Menese SOL wallet. You can use any Solana address.
                </p>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={execute}
              disabled={status === "loading" || !amount}
              style={status === "loading" ? styles.btnDisabled : styles.btn}
            >
              {status === "loading" ? "Processing..." : buttonLabel}
            </button>

            {/* Result */}
            {result && (
              <div style={styles.successBox}>
                <p>{result.message}</p>
                {result.explorerUrl && (
                  <a href={result.explorerUrl} target="_blank" rel="noopener noreferrer" style={styles.link}>
                    View on Solscan
                  </a>
                )}
              </div>
            )}

            {/* Error */}
            {error && <div style={styles.errorBox}>{error}</div>}
          </>
        )}

        {/* Flow Reference */}
        <div style={styles.reference}>
          <h3 style={styles.refTitle}>Flow Reference</h3>
          <div style={styles.refGrid}>
            <div style={styles.refCard}>
              <strong>mSOL Deposit (Autonomous)</strong>
              <code style={styles.code}>await depositMsolAutonomous(0.1, agent)</code>
              <p>SDK signs + broadcasts + registers. One call.</p>
            </div>
            <div style={styles.refCard}>
              <strong>mSOL Deposit (Sign-Only)</strong>
              <code style={styles.code}>await depositMsolSignOnly(0.1, agent)</code>
              <p>SDK signs, auto-registers. You broadcast within 30s.</p>
            </div>
            <div style={styles.refCard}>
              <strong>mSOL Redeem</strong>
              <code style={styles.code}>await redeemMsol(0.05, solAddr, agent)</code>
              <p>ICRC-2 approve → burn mSOL → sign SOL → you broadcast.</p>
            </div>
            <div style={styles.refCard}>
              <strong>SOL → ICP (Autonomous)</strong>
              <code style={styles.code}>await depositSolForIcp(0.5, agent)</code>
              <p>SDK signs + broadcasts + registers. Pool credits ICP.</p>
            </div>
            <div style={styles.refCard}>
              <strong>ICP → SOL (Autonomous)</strong>
              <code style={styles.code}>await swapIcpToSol(1.0, solAddr, agent)</code>
              <p>ICRC-2 approve → pool pulls ICP → broadcasts SOL.</p>
            </div>
            <div style={styles.refCard}>
              <strong>ICP → SOL (Sign-Only)</strong>
              <code style={styles.code}>await swapIcpToSolSignOnly(1.0, solAddr, agent)</code>
              <p>ICRC-2 approve → pool signs SOL TX → you broadcast.</p>
            </div>
          </div>
        </div>

        {/* Solana RPCs */}
        <div style={styles.rpcSection}>
          <h3 style={styles.refTitle}>Public Solana RPCs</h3>
          <table style={styles.rpcTable}>
            <thead>
              <tr>
                <th style={styles.th}>Provider</th>
                <th style={styles.th}>URL</th>
                <th style={styles.th}>Limits</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={styles.td}>Solana (official)</td><td style={styles.td}><code>api.mainnet-beta.solana.com</code></td><td style={styles.td}>Aggressive rate limits</td></tr>
              <tr><td style={styles.td}>Ankr</td><td style={styles.td}><code>rpc.ankr.com/solana</code></td><td style={styles.td}>Decent free tier</td></tr>
              <tr><td style={styles.td}>Helius</td><td style={styles.td}><code>mainnet.helius-rpc.com/?api-key=...</code></td><td style={styles.td}>100k/day free</td></tr>
              <tr><td style={styles.td}>QuickNode</td><td style={styles.td}><code>your-endpoint.quiknode.pro</code></td><td style={styles.td}>Free tier available</td></tr>
            </tbody>
          </table>
          <p style={styles.hint}>
            Set your RPC: <code>CONFIG.SOLANA_RPC = "https://your-rpc.com"</code>
          </p>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          Made with love by <a href="https://menese.io" target="_blank" rel="noopener noreferrer" style={styles.footerLink}>Menese Protocol</a>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// STYLES (inline — no CSS dependencies)
// ══════════════════════════════════════════════════════════════

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a0f 0%, #111827 50%, #0a0a0f 100%)",
    display: "flex",
    justifyContent: "center",
    alignItems: "flex-start",
    padding: "2rem 1rem",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    color: "#e5e7eb",
  },
  card: {
    maxWidth: 640,
    width: "100%",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: "2rem",
  },
  header: { textAlign: "center" as const, marginBottom: "1.5rem" },
  title: { fontSize: "1.5rem", fontWeight: 700, color: "#f59e0b", margin: 0 },
  subtitle: { fontSize: "0.875rem", color: "#9ca3af", marginTop: 4 },

  connectBtn: {
    width: "100%", padding: "0.875rem", borderRadius: 12,
    background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000",
    fontWeight: 600, fontSize: "0.875rem", border: "none", cursor: "pointer",
  },

  infoBox: {
    background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 12, padding: "1rem", marginBottom: "1rem",
  },
  infoRow: { display: "flex", justifyContent: "space-between", padding: "0.25rem 0" },
  infoLabel: { color: "#9ca3af", fontSize: "0.8rem" },
  infoValue: { color: "#e5e7eb", fontSize: "0.8rem", fontFamily: "monospace" },

  tabRow: { display: "flex", gap: 8, marginBottom: "0.75rem" },
  tab: {
    flex: 1, padding: "0.625rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: "0.8rem", fontWeight: 500,
  },
  tabActive: {
    flex: 1, padding: "0.625rem", borderRadius: 8, border: "1px solid #f59e0b",
    background: "rgba(245,158,11,0.1)", color: "#f59e0b", cursor: "pointer", fontSize: "0.8rem", fontWeight: 600,
  },
  pill: {
    flex: 1, padding: "0.5rem", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: "0.75rem",
  },
  pillActive: {
    flex: 1, padding: "0.5rem", borderRadius: 20, border: "1px solid #3b82f6",
    background: "rgba(59,130,246,0.1)", color: "#60a5fa", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600,
  },

  pathRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 4 },
  pathLabel: { color: "#9ca3af", fontSize: "0.75rem", marginRight: 4 },
  pathBtn: {
    padding: "0.375rem 0.75rem", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)",
    background: "transparent", color: "#9ca3af", cursor: "pointer", fontSize: "0.7rem",
  },
  pathBtnActive: {
    padding: "0.375rem 0.75rem", borderRadius: 6, border: "1px solid #10b981",
    background: "rgba(16,185,129,0.1)", color: "#34d399", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600,
  },
  pathHint: { color: "#6b7280", fontSize: "0.7rem", margin: "0 0 1rem 0" },

  inputGroup: { marginBottom: "1rem" },
  inputLabel: { display: "block", color: "#9ca3af", fontSize: "0.75rem", marginBottom: 4 },
  input: {
    width: "100%", padding: "0.75rem", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)",
    background: "rgba(255,255,255,0.03)", color: "#e5e7eb", fontSize: "0.875rem",
    outline: "none", boxSizing: "border-box" as const,
  },
  hint: { color: "#6b7280", fontSize: "0.7rem", marginTop: 4 },

  btn: {
    width: "100%", padding: "0.875rem", borderRadius: 12,
    background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "#fff",
    fontWeight: 600, fontSize: "0.875rem", border: "none", cursor: "pointer",
    marginBottom: "1rem",
  },
  btnDisabled: {
    width: "100%", padding: "0.875rem", borderRadius: 12,
    background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.3)",
    fontWeight: 600, fontSize: "0.875rem", border: "none", cursor: "not-allowed",
    marginBottom: "1rem",
  },

  successBox: {
    background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)",
    borderRadius: 8, padding: "0.75rem", marginBottom: "1rem", fontSize: "0.8rem",
  },
  errorBox: {
    background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 8, padding: "0.75rem", marginBottom: "1rem", fontSize: "0.8rem", color: "#fca5a5",
  },
  link: { color: "#60a5fa", textDecoration: "none", fontSize: "0.8rem" },

  reference: {
    borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1.5rem", marginTop: "1rem",
  },
  refTitle: { fontSize: "0.875rem", fontWeight: 600, color: "#f59e0b", marginBottom: "0.75rem" },
  refGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 },
  refCard: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
    borderRadius: 8, padding: "0.75rem", fontSize: "0.7rem", color: "#d1d5db",
  },
  code: {
    display: "block", background: "rgba(0,0,0,0.3)", borderRadius: 4,
    padding: "0.375rem", margin: "0.375rem 0", fontSize: "0.65rem", color: "#93c5fd",
    fontFamily: "monospace", overflowX: "auto" as const, whiteSpace: "nowrap" as const,
  },

  rpcSection: {
    borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "1rem", marginTop: "1rem",
  },
  rpcTable: { width: "100%", borderCollapse: "collapse" as const, fontSize: "0.7rem", marginBottom: "0.5rem" },
  th: { textAlign: "left" as const, padding: "0.375rem", color: "#9ca3af", borderBottom: "1px solid rgba(255,255,255,0.06)" },
  td: { padding: "0.375rem", color: "#d1d5db", borderBottom: "1px solid rgba(255,255,255,0.03)" },

  footer: {
    textAlign: "center" as const, marginTop: "2rem", paddingTop: "1rem",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    color: "#6b7280", fontSize: "0.75rem",
  },
  footerLink: { color: "#f59e0b", textDecoration: "none", fontWeight: 600 },
};

export default MsolIcpSolDemo;
