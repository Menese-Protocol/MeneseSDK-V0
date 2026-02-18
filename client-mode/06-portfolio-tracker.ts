/**
 * MeneseSDK — Portfolio Tracker: Multi-chain balance dashboard
 *
 * Shows balances across all 19 supported chains in one view.
 * All balance queries are FREE — no billing required.
 *
 * Supported balance queries:
 *   - Solana (SOL), Bitcoin (BTC), Litecoin (LTC)
 *   - Ethereum + all EVM chains (ETH, ARB, BASE, MATIC, BNB, OP)
 *   - ICP, Cardano (ADA), Aptos (APT)
 *   - XRP, SUI, TON, NEAR, CloakCoin, Thorchain
 *   - Tron (via getTrxBalance with address)
 *
 * PERFORMANCE TIP: For production apps, query balances directly from
 * your own RPC endpoints (Helius, Alchemy, Infura, etc.) instead of
 * going through MeneseSDK. Use MeneseSDK to derive addresses once,
 * cache them, then query balances via your own RPC — much faster.
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor } from "./menese-config";

// ── Chain config for the portfolio view ──────────────────────
const CHAINS = [
  { id: "solana", name: "Solana", symbol: "SOL", decimals: 9, explorer: "https://solscan.io/account/" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH", decimals: 18, explorer: "https://etherscan.io/address/" },
  { id: "arbitrum", name: "Arbitrum", symbol: "ETH", decimals: 18, explorer: "https://arbiscan.io/address/" },
  { id: "base", name: "Base", symbol: "ETH", decimals: 18, explorer: "https://basescan.org/address/" },
  { id: "polygon", name: "Polygon", symbol: "MATIC", decimals: 18, explorer: "https://polygonscan.com/address/" },
  { id: "bsc", name: "BNB Chain", symbol: "BNB", decimals: 18, explorer: "https://bscscan.com/address/" },
  { id: "optimism", name: "Optimism", symbol: "ETH", decimals: 18, explorer: "https://optimistic.etherscan.io/address/" },
  { id: "icp", name: "Internet Computer", symbol: "ICP", decimals: 8, explorer: "https://dashboard.internetcomputer.org/account/" },
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC", decimals: 8, explorer: "https://mempool.space/address/" },
  { id: "litecoin", name: "Litecoin", symbol: "LTC", decimals: 8, explorer: "https://blockchair.com/litecoin/address/" },
  { id: "xrp", name: "XRP Ledger", symbol: "XRP", decimals: 6, explorer: "https://xrpscan.com/account/" },
  { id: "sui", name: "SUI", symbol: "SUI", decimals: 9, explorer: "https://suiscan.xyz/mainnet/account/" },
  { id: "ton", name: "TON", symbol: "TON", decimals: 9, explorer: "https://tonscan.org/address/" },
  { id: "cardano", name: "Cardano", symbol: "ADA", decimals: 6, explorer: "https://cardanoscan.io/address/" },
  { id: "tron", name: "Tron", symbol: "TRX", decimals: 6, explorer: "https://tronscan.org/#/address/" },
  { id: "aptos", name: "Aptos", symbol: "APT", decimals: 8, explorer: "https://explorer.aptoslabs.com/account/" },
  { id: "near", name: "NEAR", symbol: "NEAR", decimals: 24, explorer: "https://nearblocks.io/address/" },
  { id: "cloak", name: "CloakCoin", symbol: "CLOAK", decimals: 6, explorer: "" },
  { id: "thorchain", name: "THORChain", symbol: "RUNE", decimals: 8, explorer: "https://thorchain.net/address/" },
];

// ── Get all addresses at once ────────────────────────────────
interface PortfolioEntry {
  chain: string;
  symbol: string;
  address: string;
  balance: number | null;
  explorerUrl: string;
}

async function getPortfolio(): Promise<PortfolioEntry[]> {
  const menese = await createMeneseActor();

  // Fetch all addresses in parallel (FREE)
  const [sol, evm, btc, ltc, sui, xrp, ton, cardano, tron, aptos, near, cloak, thor] =
    await Promise.all([
      menese.getMySolanaAddress(),
      menese.getMyEvmAddress(),
      menese.getMyBitcoinAddress(),
      menese.getMyLitecoinAddress(),
      menese.getMySuiAddress(),
      menese.getMyXrpAddress(),
      menese.getMyTonAddress(),
      menese.getMyCardanoAddress(),
      menese.getTronAddress(),
      menese.getMyAptosAddress(),
      menese.getMyNearAddress(),
      menese.getMyCloakAddress(),
      menese.getMyThorAddress(),
    ]);

  // Use correct field names from .did
  const addresses: Record<string, string> = {
    solana: (sol as any).address,
    ethereum: (evm as any).evmAddress,      // NOT "address"
    arbitrum: (evm as any).evmAddress,      // Same EVM address
    base: (evm as any).evmAddress,
    polygon: (evm as any).evmAddress,
    bsc: (evm as any).evmAddress,
    optimism: (evm as any).evmAddress,
    icp: "principal",                         // ICP uses principal, not address
    bitcoin: (btc as any).bech32Address,      // NOT Text — returns AddressInfo record
    litecoin: (ltc as any).bech32Address,     // Same as Bitcoin
    xrp: (xrp as any).classicAddress,
    sui: (sui as any).suiAddress,             // NOT "address"
    ton: (ton as any).nonBounceable,          // NOT "address"
    cardano: (cardano as any).bech32Address,  // NOT "address"
    tron: (tron as any).base58Address,        // NOT "base58"
    aptos: (aptos as any).address,
    near: (near as any).implicitAccountId,    // NOT "accountId"
    cloak: (cloak as any).base58Address,
    thorchain: (thor as any).bech32Address,   // AddressInfo record
  };

  // Fetch balances for chains with native balance queries (FREE)
  const [solBal, icpBal, btcBal, ltcBal, xrpBal, suiBal, tonBal, cardanoBal, aptosBal, nearBal] =
    await Promise.all([
      menese.getMySolanaBalance(),
      menese.getICPBalance(),
      menese.getBitcoinBalance(),
      menese.getLitecoinBalance(),
      menese.getMyXrpBalance(),
      menese.getMySuiBalance(),
      menese.getMyTonBalance(),
      menese.getCardanoBalance(),
      menese.getAptosBalance(),
      menese.getMyNearBalance(),
    ]);

  // Build balance map
  const balances: Record<string, number | null> = {};

  // SOL (ResultNat64)
  const solResult = solBal as any;
  balances.solana = "ok" in solResult ? Number(solResult.ok) / 1e9 : null;

  // ICP (ResultNat64)
  const icpResult = icpBal as any;
  balances.icp = "ok" in icpResult ? Number(icpResult.ok) / 1e8 : null;

  // Bitcoin (direct Nat64)
  balances.bitcoin = Number(btcBal as any) / 1e8;

  // Litecoin (direct Nat64)
  balances.litecoin = Number(ltcBal as any) / 1e8;

  // XRP (Result text)
  const xrpResult = xrpBal as any;
  balances.xrp = "ok" in xrpResult ? parseFloat(xrpResult.ok) : null;

  // SUI (direct Nat64)
  balances.sui = Number(suiBal as any) / 1e9;

  // TON (ResultNat64)
  const tonResult = tonBal as any;
  balances.ton = "ok" in tonResult ? Number(tonResult.ok) / 1e9 : null;

  // Cardano (ResultNat64)
  const cardanoResult = cardanoBal as any;
  balances.cardano = "ok" in cardanoResult ? Number(cardanoResult.ok) / 1e6 : null;

  // Aptos (ResultNat64)
  const aptosResult = aptosBal as any;
  balances.aptos = "ok" in aptosResult ? Number(aptosResult.ok) / 1e8 : null;

  // NEAR (direct Nat)
  balances.near = Number(nearBal as any) / 1e24;

  // EVM chains — would need your own RPC for each chain (not queried here)
  // Use getMyEvmBalance(rpcEndpoint) for each chain with your own RPC
  for (const chain of ["ethereum", "arbitrum", "base", "polygon", "bsc", "optimism"]) {
    balances[chain] = null; // Query via your own RPC for production
  }

  // Tron, CloakCoin, THORChain — also have balance functions
  balances.tron = null;       // Use getTrxBalance(address) with your own node
  balances.cloak = null;      // Use getCloakBalance()
  balances.thorchain = null;  // Use getThorBalance()

  // Build portfolio entries
  const portfolio: PortfolioEntry[] = CHAINS.map(chain => ({
    chain: chain.name,
    symbol: chain.symbol,
    address: addresses[chain.id] || "N/A",
    balance: balances[chain.id] ?? null,
    explorerUrl: chain.explorer + (addresses[chain.id] || ""),
  }));

  return portfolio;
}

// ── Display portfolio ────────────────────────────────────────
function displayPortfolio(portfolio: PortfolioEntry[]) {
  console.log("\n" + "=".repeat(70));
  console.log("  MULTI-CHAIN PORTFOLIO (19 chains)");
  console.log("=".repeat(70));

  for (const entry of portfolio) {
    const balStr = entry.balance !== null
      ? `${entry.balance.toFixed(6)} ${entry.symbol}`
      : `-- ${entry.symbol} (use explorer)`;

    const addrShort = entry.address.length > 20
      ? entry.address.slice(0, 8) + "..." + entry.address.slice(-6)
      : entry.address;

    console.log(`  ${entry.chain.padEnd(20)} ${balStr.padEnd(25)} ${addrShort}`);
  }

  console.log("=".repeat(70));

  // Show total for chains with known balances
  const withBalance = portfolio.filter(p => p.balance !== null && p.balance > 0);
  if (withBalance.length > 0) {
    console.log("\nNon-zero balances:");
    for (const entry of withBalance) {
      console.log(`  ${entry.chain}: ${entry.balance!.toFixed(6)} ${entry.symbol}`);
    }
  }
}

// ── Example: Auto-refresh dashboard ──────────────────────────
async function startDashboard(refreshIntervalMs: number = 60_000) {
  console.log("Starting portfolio dashboard (Ctrl+C to stop)...\n");

  while (true) {
    try {
      const portfolio = await getPortfolio();
      console.clear();
      displayPortfolio(portfolio);
      console.log(`\nLast updated: ${new Date().toLocaleTimeString()}`);
      console.log(`Next refresh in ${refreshIntervalMs / 1000}s...`);
    } catch (err) {
      console.error("Error fetching portfolio:", err);
    }
    await new Promise(r => setTimeout(r, refreshIntervalMs));
  }
}

// ── Example usage ────────────────────────────────────────────
async function main() {
  // One-time portfolio fetch
  const portfolio = await getPortfolio();
  displayPortfolio(portfolio);

  // Or start auto-refreshing dashboard (every 60s)
  // await startDashboard(60_000);
}

main().catch(console.error);
