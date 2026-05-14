import { FormEvent, type CSSProperties, useMemo, useState } from "react";
import {
  DEFAULT_SOLANA_RPC,
  getSolanaMintInfo,
  signAndSendSolanaToken,
  toBaseUnits,
  type MeneseSolanaTokenActor,
  type SolanaMintInfo,
  type SolanaTokenTransferResult,
} from "./solana-token-sign-only";

type Status = "idle" | "loading" | "success" | "error";

type SolanaTokenSendPanelProps = {
  actor: MeneseSolanaTokenActor | (() => Promise<MeneseSolanaTokenActor>);
  defaultRpcUrl?: string;
};

export function SolanaTokenSendPanel({
  actor,
  defaultRpcUrl = DEFAULT_SOLANA_RPC,
}: SolanaTokenSendPanelProps) {
  const [rpcUrl, setRpcUrl] = useState(defaultRpcUrl);
  const [mint, setMint] = useState("");
  const [destOwner, setDestOwner] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [mintInfo, setMintInfo] = useState<SolanaMintInfo | null>(null);
  const [result, setResult] = useState<SolanaTokenTransferResult | null>(null);
  const [error, setError] = useState("");

  const canSubmit = useMemo(() => {
    return mint.trim() !== "" && destOwner.trim() !== "" && amount.trim() !== "" && status !== "loading";
  }, [amount, destOwner, mint, status]);

  async function loadMintInfo(nextMint = mint) {
    setError("");
    const info = await getSolanaMintInfo(nextMint.trim(), rpcUrl.trim());
    setMintInfo(info);
    return info;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setStatus("loading");
    setError("");
    setResult(null);

    try {
      const sdkActor = typeof actor === "function" ? await actor() : actor;
      const info = mintInfo?.mint === mint.trim() ? mintInfo : await loadMintInfo();
      const amountBaseUnits = toBaseUnits(amount, info.decimals);

      const sendResult = await signAndSendSolanaToken({
        actor: sdkActor,
        rpcUrl: rpcUrl.trim(),
        mint: mint.trim(),
        destOwner: destOwner.trim(),
        amountBaseUnits,
      });

      setResult(sendResult);
      setMintInfo(sendResult.mintInfo);
      setStatus("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("error");
    }
  }

  return (
    <section style={styles.shell}>
      <header style={styles.header}>
        <h2 style={styles.title}>Solana Token Send</h2>
        <span style={styles.badge}>SPL / Token-2022</span>
      </header>

      <form style={styles.form} onSubmit={onSubmit}>
        <label style={styles.label}>
          <span>RPC URL</span>
          <input
            style={styles.input}
            value={rpcUrl}
            onChange={(event) => setRpcUrl(event.target.value)}
          />
        </label>

        <label style={styles.label}>
          <span>Mint</span>
          <input
            style={styles.input}
            value={mint}
            onBlur={() => mint.trim() && loadMintInfo().catch((err) => {
              setError(err instanceof Error ? err.message : String(err));
            })}
            onChange={(event) => {
              setMint(event.target.value);
              setMintInfo(null);
            }}
          />
        </label>

        <label style={styles.label}>
          <span>Recipient owner</span>
          <input
            style={styles.input}
            value={destOwner}
            onChange={(event) => setDestOwner(event.target.value)}
          />
        </label>

        <label style={styles.label}>
          <span>Amount</span>
          <input
            style={styles.input}
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>

        {mintInfo && (
          <dl style={styles.metaGrid}>
            <div>
              <dt style={styles.metaLabel}>Decimals</dt>
              <dd style={styles.metaValue}>{mintInfo.decimals}</dd>
            </div>
            <div>
              <dt style={styles.metaLabel}>Token program</dt>
              <dd style={styles.metaValue}>{mintInfo.tokenProgramId}</dd>
            </div>
          </dl>
        )}

        <button style={styles.button} disabled={!canSubmit} type="submit">
          {status === "loading" ? "Signing" : "Sign and send"}
        </button>
      </form>

      {result && (
        <div style={styles.result}>
          <div style={styles.resultRow}>
            <span>Signature</span>
            <code style={styles.code}>{result.signature}</code>
          </div>
          <div style={styles.resultRow}>
            <span>Source ATA</span>
            <code style={styles.code}>{result.accounts.sourceAta}</code>
          </div>
          <div style={styles.resultRow}>
            <span>Destination ATA</span>
            <code style={styles.code}>{result.accounts.destAta}</code>
          </div>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}
    </section>
  );
}

const styles: Record<string, CSSProperties> = {
  shell: {
    width: "min(100%, 680px)",
    border: "1px solid #d8dee8",
    borderRadius: 8,
    padding: 20,
    background: "#ffffff",
    color: "#172033",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 18,
  },
  title: {
    margin: 0,
    fontSize: 20,
    lineHeight: 1.2,
  },
  badge: {
    border: "1px solid #b8c4d8",
    borderRadius: 999,
    padding: "4px 10px",
    fontSize: 12,
    color: "#41506b",
    whiteSpace: "nowrap",
  },
  form: {
    display: "grid",
    gap: 14,
  },
  label: {
    display: "grid",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    minHeight: 40,
    border: "1px solid #c7d0df",
    borderRadius: 6,
    padding: "8px 10px",
    font: "inherit",
  },
  metaGrid: {
    display: "grid",
    gridTemplateColumns: "120px minmax(0, 1fr)",
    gap: 12,
    margin: 0,
    padding: 12,
    border: "1px solid #e1e6ef",
    borderRadius: 6,
    background: "#f8fafc",
  },
  metaLabel: {
    margin: 0,
    fontSize: 12,
    color: "#63718a",
  },
  metaValue: {
    margin: 0,
    minWidth: 0,
    overflowWrap: "anywhere",
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
    fontSize: 12,
  },
  button: {
    minHeight: 42,
    border: "1px solid #172033",
    borderRadius: 6,
    padding: "0 14px",
    background: "#172033",
    color: "#ffffff",
    fontWeight: 700,
    cursor: "pointer",
  },
  result: {
    display: "grid",
    gap: 10,
    marginTop: 16,
    padding: 12,
    border: "1px solid #c7d0df",
    borderRadius: 6,
  },
  resultRow: {
    display: "grid",
    gap: 4,
    fontSize: 13,
  },
  code: {
    overflowWrap: "anywhere",
    fontSize: 12,
  },
  error: {
    margin: "14px 0 0",
    color: "#b42318",
    overflowWrap: "anywhere",
  },
};
