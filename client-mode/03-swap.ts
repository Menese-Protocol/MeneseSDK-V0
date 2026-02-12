/**
 * MeneseSDK — DEX Swaps: Trade tokens on 6 chains
 *
 * Supported DEXes:
 *   - Solana:  Raydium (AMM + CLMM pools)
 *   - EVM:     Uniswap V3 (Ethereum, Arbitrum, Base, Polygon, BSC, Optimism)
 *   - ICP:     ICPSwap + KongSwap (best price routing)
 *   - SUI:     Cetus aggregator
 *   - Cardano: Minswap
 *   - XRP:     XRP Ledger built-in DEX
 *
 * Cost: $0.075 per swap operation
 *
 * IMPORTANT — Chain-specific prerequisites:
 *   - Solana: You need ATAs (Associated Token Accounts) for SPL tokens.
 *     Call createMySolanaAtaForMint(mintBase58, ataBase58) before swapping to a new token.
 *   - XRP: You need trustlines for non-XRP tokens.
 *     Call xrpSetTrustline(currency, issuer, limit) before receiving tokens.
 *   - SUI/EVM/ICP/Cardano: No special setup needed.
 *
 * Tested: Feb 11, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor } from "./menese-config";

// ══════════════════════════════════════════════════════════════
// 1. RAYDIUM (Solana)
// ══════════════════════════════════════════════════════════════

// PREREQUISITE: Before swapping to a new SPL token for the first time,
// you need an Associated Token Account (ATA) for that token mint:
//
//   await menese.createMySolanaAtaForMint(mintBase58, ataBase58);
//
// This creates the ATA on-chain so your wallet can hold that token.
// Only needed once per token. SOL doesn't need an ATA.

// swapRaydiumApiUser has 8 params: inputMint, outputMint, amount, slippageBps,
// wrapSol, unwrapSol, inputAta?, outputAta?
// Returns: RaydiumApiSwapResult = { inputAmount, outputAmount, priceImpactPct, txSignature }
async function swapOnRaydium(
  inputMint: string,     // Input token mint address
  outputMint: string,    // Output token mint address
  amountIn: number,      // Amount in input token's smallest unit
  slippageBps: number,   // Slippage tolerance (100 = 1%)
  wrapSol: boolean = false,   // Set true if swapping native SOL (wraps to wSOL)
  unwrapSol: boolean = false, // Set true if receiving SOL (unwraps wSOL)
) {
  const menese = await createMeneseActor();

  console.log(`Swapping on Raydium: ${amountIn} of ${inputMint} → ${outputMint}...`);
  const result = await menese.swapRaydiumApiUser(
    inputMint,
    outputMint,
    BigInt(amountIn),
    BigInt(slippageBps),
    wrapSol,
    unwrapSol,
    [],   // inputAta: auto-detect
    [],   // outputAta: auto-detect
  ) as any;

  // Direct record (NOT a variant with ok/err)
  console.log("Swap TX:", result.txSignature);
  console.log("Input:", result.inputAmount, "→ Output:", result.outputAmount);
  console.log("Price impact:", result.priceImpactPct);
  console.log(`Explorer: https://solscan.io/tx/${result.txSignature}`);
  return result;
}

// ══════════════════════════════════════════════════════════════
// 2. UNISWAP V3 (EVM chains)
// ══════════════════════════════════════════════════════════════
// swapTokens takes 7 params: quoteId, fromSymbol, toSymbol, amountIn, slippageBps,
//   useFeeOnTransfer, rpcEndpoint
// Returns: { ok: { expectedTxHash, approvalTxHash?, nonce, note, path, ... }, err: text }
//
// NOTE: For EVM L2s (Arbitrum, Base, Polygon, BSC, Optimism) you must
// provide your own RPC endpoint — free public RPCs like Alchemy, Infura,
// or chain-specific ones work fine.

async function swapOnUniswap(
  quoteId: string,       // Get a quote first with getTokenQuote, use returned ID
  fromToken: string,     // Input token symbol or address
  toToken: string,       // Output token symbol or address
  amountIn: bigint,      // Amount in smallest unit
  slippageBps: number,   // Slippage tolerance (100 = 1%)
  rpcEndpoint: string,   // Your RPC endpoint for the target chain
) {
  const menese = await createMeneseActor();

  console.log(`Swapping on Uniswap V3: ${fromToken} → ${toToken}...`);
  const result = await menese.swapTokens(
    quoteId,
    fromToken,
    toToken,
    amountIn,
    BigInt(slippageBps),
    false,          // useFeeOnTransfer: true for rebase/tax tokens
    rpcEndpoint,
  ) as any;

  if ("ok" in result) {
    console.log("Swap TX:", result.ok.expectedTxHash);
    console.log("Nonce:", result.ok.nonce.toString());
    console.log("Path:", result.ok.pathSymbols.join(" → "));
  } else {
    console.error("Swap failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// 3. ICPSwap + KongSwap (ICP)
// ══════════════════════════════════════════════════════════════
// Routes to the DEX with the best price automatically.
// executeICPDexSwap takes a SwapRequest record:
//   { tokenIn, tokenOut, amountIn, minAmountOut, slippagePct, preferredDex? }
// Returns: { ok: SwapResultIcp, err: text }

async function swapOnICPDex(
  tokenIn: string,       // Token canister ID (e.g., "ryjl3-tyaaa-aaaaa-aaaba-cai" for ICP)
  tokenOut: string,      // Token canister ID
  amountIn: bigint,      // Amount in token's smallest unit
  minAmountOut: bigint,  // Minimum acceptable output (slippage protection)
  slippagePct: number,   // Slippage as percentage (e.g., 1.0 = 1%)
) {
  const menese = await createMeneseActor();

  console.log(`Swapping on ICP DEX: ${tokenIn} → ${tokenOut}...`);
  const result = await menese.executeICPDexSwap({
    tokenIn,
    tokenOut,
    amountIn,
    minAmountOut,
    slippagePct,
    preferredDex: [],    // auto-route to best DEX
  }) as any;

  if ("ok" in result) {
    console.log("Swap complete!");
    console.log("Amount in:", result.ok.amountIn.toString());
    console.log("Amount out:", result.ok.amountOut.toString());
    console.log("DEX used:", "ICPSwap" in result.ok.dex ? "ICPSwap" : "KongSwap");
  } else {
    console.error("Swap failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// 4. CETUS (SUI)
// ══════════════════════════════════════════════════════════════
// Uses Cetus aggregator for best routing on SUI.
// Get a quote first, then execute with the quoted minAmountOut.

// getSuiSwapQuote returns: opt { amountIn, amountOut, estimatedGas, priceImpact, routerData }
async function getSuiQuote(
  fromToken: string,
  toToken: string,
  amountIn: string,      // Amount as string (in smallest unit)
  slippageBps: number,
) {
  const menese = await createMeneseActor();

  const quote = await menese.getSuiSwapQuote(
    { mainnet: null },    // Network: mainnet
    fromToken,
    toToken,
    amountIn,
    BigInt(slippageBps),
  ) as any;

  if (quote.length > 0) {
    console.log("SUI quote:", {
      amountIn: quote[0].amountIn,
      amountOut: quote[0].amountOut,
      priceImpact: quote[0].priceImpact,
    });
    return quote[0];
  }
  console.log("No quote available for this pair");
  return null;
}

// executeSuiSwap returns: SwapResultSui = { success, txDigest, amountOut, error? }
async function swapOnCetus(
  fromToken: string,     // Token type (e.g., "0x2::sui::SUI")
  toToken: string,       // Token type (e.g., USDC on SUI)
  amountIn: string,      // Amount in smallest unit as string
  minAmountOut: string,  // From quote, or your own calculation
) {
  const menese = await createMeneseActor();

  console.log(`Swapping on SUI Cetus: ${fromToken} → ${toToken}...`);
  const result = await menese.executeSuiSwap(
    { mainnet: null },    // Network
    fromToken,
    toToken,
    amountIn,
    minAmountOut,
  ) as any;

  // Direct record (NOT a variant)
  if (result.success) {
    console.log("Swap TX:", result.txDigest);
    console.log("Amount out:", result.amountOut);
    console.log(`Explorer: https://suiscan.xyz/mainnet/tx/${result.txDigest}`);
  } else {
    console.error("Swap failed:", result.error?.[0] || "Unknown error");
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// 5. MINSWAP (Cardano)
// ══════════════════════════════════════════════════════════════
// Cardano's largest DEX. Get a quote first to see the expected output.

// getMinswapQuote returns: { ok: { amount_in, amount_out, min_amount_out, avg_price_impact, success }, err: text }
async function getMinswapQuote(
  tokenIn: string,       // Token identifier (e.g., "lovelace" for ADA)
  tokenOut: string,      // Token identifier (policy_id.token_name)
  amountIn: number,      // Amount in lovelace (1 ADA = 1,000,000 lovelace)
  slippagePct: number,   // Slippage as percentage (e.g., 1.0 = 1%)
) {
  const menese = await createMeneseActor();

  const result = await menese.getMinswapQuote(
    tokenIn,
    tokenOut,
    BigInt(amountIn),
    slippagePct,
  ) as any;

  if ("ok" in result) {
    console.log("Minswap quote:", {
      amountIn: result.ok.amount_in,
      amountOut: result.ok.amount_out,
      minAmountOut: result.ok.min_amount_out,
      priceImpact: result.ok.avg_price_impact,
    });
    return result.ok;
  }
  console.error("Quote failed:", result.err);
  return null;
}

// executeMinswapSwap returns: Result = { ok: text (txHash), err: text }
async function swapOnMinswap(
  tokenIn: string,       // Token identifier
  tokenOut: string,      // Token identifier
  amountIn: number,      // Amount in smallest unit
  slippagePct: number,   // Slippage as percentage
) {
  const menese = await createMeneseActor();

  console.log(`Swapping on Minswap: ${tokenIn} → ${tokenOut}...`);
  const result = await menese.executeMinswapSwap(
    tokenIn,
    tokenOut,
    BigInt(amountIn),
    slippagePct,
  ) as any;

  if ("ok" in result) {
    console.log("Swap TX:", result.ok);
  } else {
    console.error("Swap failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// 6. XRP LEDGER DEX
// ══════════════════════════════════════════════════════════════
// XRP has a built-in DEX on the ledger itself.
//
// PREREQUISITE: Before receiving non-XRP tokens, you need a trustline:
//
//   await menese.xrpSetTrustline(currency, issuer, limit);
//
// Example: To receive USD from Bitstamp:
//   await menese.xrpSetTrustline("USD", "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B", "1000");
//
// Trustlines tell the network you accept that token from that issuer.

// xrpSwap takes: (destAmount: TokenAmount, sendMax: TokenAmount, paths: text, slippageBps: nat)
// Returns: SwapResultXrp = { success, txHash, explorerUrl, message, sourceAmount, destinationAmount }
async function swapOnXrpDex(
  // What you want to receive
  destCurrency: string,    // e.g., "USD"
  destIssuer: string,      // e.g., Bitstamp issuer address
  destValue: string,       // Amount you want

  // Maximum you'll spend
  sendCurrency: string,    // e.g., "XRP"
  sendIssuer: string,      // "" for native XRP
  sendMaxValue: string,    // Max amount to send

  paths: string,           // Path-finding JSON (from xrpFindPaths)
  slippageBps: number,     // Slippage tolerance (100 = 1%)
) {
  const menese = await createMeneseActor();

  console.log(`Swapping on XRP DEX: ${sendCurrency} → ${destCurrency}...`);
  const result = await menese.xrpSwap(
    { currency: destCurrency, issuer: destIssuer, value: destValue },
    { currency: sendCurrency, issuer: sendIssuer, value: sendMaxValue },
    paths,
    BigInt(slippageBps),
  ) as any;

  // Direct record (NOT a variant)
  if (result.success) {
    console.log("Swap TX:", result.txHash);
    console.log("Explorer:", result.explorerUrl);
    console.log(`${result.sourceAmount} → ${result.destinationAmount}`);
  } else {
    console.error("Swap failed:", result.message);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// COMMON TOKEN ADDRESSES
// ══════════════════════════════════════════════════════════════

const TOKENS = {
  // Solana mints
  SOL_NATIVE: "So11111111111111111111111111111111111111112",
  USDC_SOL: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  USDT_SOL: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  BONK: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",

  // EVM contracts
  USDC_ETH: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  USDT_ETH: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
  WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",

  // ICP canister IDs
  ICP_LEDGER: "ryjl3-tyaaa-aaaaa-aaaba-cai",
  CKBTC_LEDGER: "mxzaz-hqaaa-aaaar-qaada-cai",
  CKETH_LEDGER: "ss2fx-dyaaa-aaaar-qacoq-cai",

  // SUI token types
  SUI_NATIVE: "0x2::sui::SUI",

  // Cardano
  ADA_LOVELACE: "lovelace",
};

// ══════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ══════════════════════════════════════════════════════════════

async function main() {
  // 1. Swap 0.1 SOL → USDC on Raydium (1% slippage)
  //    wrapSol=true because input is native SOL
  await swapOnRaydium(
    TOKENS.SOL_NATIVE,
    TOKENS.USDC_SOL,
    100_000_000,  // 0.1 SOL in lamports
    100,          // 1% slippage
    true,         // wrapSol: input is native SOL
    false,        // unwrapSol: output is USDC not SOL
  );

  // 2. Swap ETH → USDC on Arbitrum (need quote first, then swap)
  //    NOTE: You must provide your own RPC endpoint for EVM chains
  const menese = await createMeneseActor();
  const quote = await menese.getTokenQuote(
    "ETH", "USDC", BigInt("1000000000000000"), "https://arb1.arbitrum.io/rpc"
  ) as any;
  if ("ok" in quote) {
    await swapOnUniswap(
      "arb-quote-id",        // Use quote ID from your system
      "ETH",
      "USDC",
      BigInt("1000000000000000"),  // 0.001 ETH in wei
      50,                          // 0.5% slippage
      "https://arb1.arbitrum.io/rpc",
    );
  }

  // 3. Swap 1 ICP → ckBTC on ICP DEX (routes to best of ICPSwap/KongSwap)
  await swapOnICPDex(
    TOKENS.ICP_LEDGER,
    TOKENS.CKBTC_LEDGER,
    BigInt(100_000_000),  // 1 ICP in e8s
    BigInt(1),            // min 1 sat ckBTC out
    1.0,                  // 1% slippage
  );

  // 4. Swap SUI → USDC on Cetus (get quote first)
  const suiQuote = await getSuiQuote(
    TOKENS.SUI_NATIVE,
    "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN", // USDC on SUI
    "100000000",   // 0.1 SUI in MIST
    100,           // 1% slippage
  );
  if (suiQuote) {
    await swapOnCetus(
      TOKENS.SUI_NATIVE,
      "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN",
      "100000000",
      suiQuote.amountOut, // Use quoted min output
    );
  }

  // 5. Swap 10 ADA → MIN on Minswap
  const minQuote = await getMinswapQuote(
    TOKENS.ADA_LOVELACE,
    "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e", // MIN token
    10_000_000,   // 10 ADA in lovelace
    1.0,          // 1% slippage
  );
  if (minQuote) {
    await swapOnMinswap(
      TOKENS.ADA_LOVELACE,
      "29d222ce763455e3d7a09a665ce554f00ac89d2e99a1a83d267170c64d494e",
      10_000_000,
      1.0,
    );
  }

  // 6. Swap XRP → USD on XRP DEX (simplified — use xrpFindPaths for real paths)
  // NOTE: Requires trustline for USD token first!
  // await swapOnXrpDex("USD", "rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B", "5",
  //   "XRP", "", "50", "[]", 100);
}

main().catch(console.error);
