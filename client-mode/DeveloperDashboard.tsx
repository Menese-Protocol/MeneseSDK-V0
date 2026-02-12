// DeveloperDashboard.tsx — Developer account management for MeneseSDK
//
// Shows: credits, tier, usage, developer key, registered canisters.
// Actions: deposit credits, regenerate key, register canister.
//
// Usage:
//   import { DeveloperDashboard } from "./DeveloperDashboard";
//   <DeveloperDashboard backend={meneseActor} />

import React, { useState, useEffect, useCallback } from "react";

// ─── Types (match menese-config.ts IDL) ──────────────────────────

interface UserAccount {
  creditsMicroUsd: bigint;
  tier: { Free: null } | { Developer: null } | { Pro: null } | { Enterprise: null };
  actionsRemaining: bigint;
  subscriptionExpiry: [] | [bigint];
  actionsUsed: bigint;
  totalDepositedMicroUsd: bigint;
  createdAt: bigint;
}

interface DeveloperAccountV3 {
  owner: { toText(): string };
  canisters: { toText(): string }[];
  appName: string;
  developerKey: string;
  createdAt: bigint;
}

interface DeveloperDashboardProps {
  backend: any; // Actor from @dfinity/agent
}

// ─── Helpers ─────────────────────────────────────────────────────

function tierName(tier: UserAccount["tier"]): string {
  if ("Free" in tier) return "Free";
  if ("Developer" in tier) return "Developer";
  if ("Pro" in tier) return "Pro";
  if ("Enterprise" in tier) return "Enterprise";
  return "Unknown";
}

function microUsdToString(micro: bigint): string {
  const dollars = Number(micro) / 1_000_000;
  return `$${dollars.toFixed(2)}`;
}

function formatDate(nanos: bigint): string {
  return new Date(Number(nanos) / 1_000_000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ─── Component ───────────────────────────────────────────────────

export function DeveloperDashboard({ backend }: DeveloperDashboardProps) {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [devAccount, setDevAccount] = useState<DeveloperAccountV3 | null>(null);
  const [devKey, setDevKey] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string>("");

  // Register form
  const [regCanisterId, setRegCanisterId] = useState("");
  const [regAppName, setRegAppName] = useState("");

  // Deposit form
  const [depositAmount, setDepositAmount] = useState("");

  const loadData = useCallback(async () => {
    if (!backend) return;
    setLoading(true);
    setError("");
    try {
      const [acct, devAcctOpt, keyResult] = await Promise.all([
        backend.getMyGatewayAccount(),
        backend.getMyDeveloperAccount(),
        backend.getMyDeveloperKey(),
      ]);
      setAccount(acct);
      setDevAccount(devAcctOpt.length > 0 ? devAcctOpt[0] : null);
      if ("ok" in keyResult) setDevKey(keyResult.ok);
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [backend]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyKey = async () => {
    await navigator.clipboard.writeText(devKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerateKey = async () => {
    setActionLoading("regenerate");
    try {
      const result = await backend.regenerateDeveloperKey();
      if ("ok" in result) {
        setDevKey(result.ok);
      } else {
        setError(result.err);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setActionLoading("");
    }
  };

  const registerCanister = async () => {
    if (!regCanisterId || !regAppName) return;
    setActionLoading("register");
    try {
      const { Principal } = await import("@dfinity/principal");
      const result = await backend.registerDeveloperCanister(
        Principal.fromText(regCanisterId),
        regAppName
      );
      if ("ok" in result) {
        setRegCanisterId("");
        setRegAppName("");
        await loadData();
      } else {
        setError(result.err);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setActionLoading("");
    }
  };

  const depositCredits = async () => {
    const amount = Number(depositAmount);
    if (!amount || amount <= 0) return;
    setActionLoading("deposit");
    try {
      const e8s = BigInt(Math.round(amount * 1e8));
      const result = await backend.depositGatewayCredits("ICP", e8s);
      if ("ok" in result) {
        setDepositAmount("");
        await loadData();
      } else {
        setError(result.err);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setActionLoading("");
    }
  };

  // ─── Render ────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white/60 text-sm">Loading developer dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Developer Dashboard</h1>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-300 text-sm">
            {error}
            <button onClick={() => setError("")} className="ml-4 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* ── Account Overview ── */}
        {account && (
          <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Gateway Account</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-white/40">Tier</p>
                <p className="text-lg font-medium">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-sm ${
                      tierName(account.tier) === "Free"
                        ? "bg-white/10 text-white/60"
                        : tierName(account.tier) === "Developer"
                        ? "bg-cyan-500/20 text-cyan-300"
                        : tierName(account.tier) === "Pro"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-yellow-500/20 text-yellow-300"
                    }`}
                  >
                    {tierName(account.tier)}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Credits</p>
                <p className="text-lg font-medium text-cyan-400">
                  {microUsdToString(account.creditsMicroUsd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Total Deposited</p>
                <p className="text-lg font-medium">
                  {microUsdToString(account.totalDepositedMicroUsd)}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Actions Used</p>
                <p className="text-lg font-medium">{account.actionsUsed.toString()}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Actions Remaining</p>
                <p className="text-lg font-medium text-green-400">
                  {account.actionsRemaining.toString()}
                </p>
              </div>
              {account.subscriptionExpiry.length > 0 && (
                <div>
                  <p className="text-xs text-white/40">Subscription Expires</p>
                  <p className="text-lg font-medium">
                    {formatDate(account.subscriptionExpiry[0])}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── Developer Key ── */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Developer Key</h2>
          {devKey ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 bg-black/50 border border-white/10 rounded-lg p-3">
                <code className="flex-1 text-cyan-300 text-sm font-mono break-all">
                  {devKey}
                </code>
                <button
                  onClick={copyKey}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-md text-xs transition-colors flex-shrink-0"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                onClick={regenerateKey}
                disabled={actionLoading === "regenerate"}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                {actionLoading === "regenerate" ? "Regenerating..." : "Regenerate Key"}
              </button>
              <p className="text-xs text-white/30">
                Warning: regenerating invalidates your current key. Update it in all your apps.
              </p>
            </div>
          ) : (
            <p className="text-white/40 text-sm">
              No developer key yet. Register a canister below to get one.
            </p>
          )}
        </section>

        {/* ── Registered Canisters ── */}
        {devAccount && (
          <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold">Registered Canisters</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">App Name:</span>
                <span className="text-sm font-medium">{devAccount.appName}</span>
              </div>
              {devAccount.canisters.length > 0 ? (
                <div className="space-y-1">
                  {devAccount.canisters.map((c, i) => (
                    <div
                      key={i}
                      className="bg-black/30 border border-white/5 rounded-lg px-3 py-2 font-mono text-sm text-white/70"
                    >
                      {c.toText()}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">No canisters registered.</p>
              )}
            </div>
          </section>
        )}

        {/* ── Register Canister ── */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Register Canister</h2>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Canister ID (e.g. rrkah-fqaaa-aaaaa-aaaaq-cai)"
              value={regCanisterId}
              onChange={(e) => setRegCanisterId(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <input
              type="text"
              placeholder="App Name (e.g. My DeFi Bot)"
              value={regAppName}
              onChange={(e) => setRegAppName(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={registerCanister}
              disabled={!regCanisterId || !regAppName || actionLoading === "register"}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "register" ? "Registering..." : "Register"}
            </button>
          </div>
        </section>

        {/* ── Deposit Credits ── */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Deposit Credits (ICP)</h2>
          <p className="text-xs text-white/40">
            First approve the transfer on the ICP ledger (icrc2_approve), then deposit here.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Amount in ICP (e.g. 1.0)"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            />
            <button
              onClick={depositCredits}
              disabled={!depositAmount || Number(depositAmount) <= 0 || actionLoading === "deposit"}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading === "deposit" ? "Depositing..." : "Deposit"}
            </button>
          </div>
        </section>

        {/* ── Pricing Reference ── */}
        <section className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Pricing</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Per-Operation Fees</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-left">
                    <th className="pb-2">Operation</th>
                    <th className="pb-2">Client Mode</th>
                    <th className="pb-2">Agent Mode</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  <tr>
                    <td className="py-1">Send/Transfer</td>
                    <td className="py-1 text-cyan-400">$0.05</td>
                    <td className="py-1">$0.10</td>
                  </tr>
                  <tr>
                    <td className="py-1">DEX Swap</td>
                    <td className="py-1 text-cyan-400">$0.075</td>
                    <td className="py-1">$0.15</td>
                  </tr>
                  <tr>
                    <td className="py-1">Cross-chain Bridge</td>
                    <td className="py-1 text-cyan-400">$0.10</td>
                    <td className="py-1">$0.20</td>
                  </tr>
                  <tr>
                    <td className="py-1 text-white/40">Queries / Addresses</td>
                    <td className="py-1 text-green-400">FREE</td>
                    <td className="py-1 text-green-400">FREE</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-2">Subscription Packages</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-white/40 text-left">
                    <th className="pb-2">Tier</th>
                    <th className="pb-2">Price</th>
                    <th className="pb-2">Actions/Month</th>
                  </tr>
                </thead>
                <tbody className="text-white/80">
                  <tr>
                    <td className="py-1">Free</td>
                    <td className="py-1">$0</td>
                    <td className="py-1">5 (lifetime)</td>
                  </tr>
                  <tr>
                    <td className="py-1">Developer</td>
                    <td className="py-1">$35/mo</td>
                    <td className="py-1">1,000</td>
                  </tr>
                  <tr>
                    <td className="py-1">Pro</td>
                    <td className="py-1">$99/mo</td>
                    <td className="py-1">5,000</td>
                  </tr>
                  <tr>
                    <td className="py-1">Enterprise</td>
                    <td className="py-1">$249/mo</td>
                    <td className="py-1">Unlimited</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
