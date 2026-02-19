---
name: menesesdk-wallet
description: Multi-chain crypto wallet operations via MeneseSDK on ICP. Use when the user wants to check balances, get addresses, send tokens, swap on DEXes, bridge between chains, manage DeFi positions (Aave/Lido/Uniswap/ICPSwap/KongSwap), manage ICRC-1/ICRC-2 tokens, provide ICP liquidity, get AI rebalancing, or automate trading strategies (DCA, stop-loss, take-profit, rebalancing) across 19 blockchains. Triggers on crypto wallet requests, token transfers, DEX swaps, bridging, DeFi yield, automated trading bot setup, payment processing, or any multi-chain operation.
---

# MeneseSDK Multi-Chain Wallet

Operate across **19 blockchains** from a single ICP canister or CLI: Solana, Ethereum, Bitcoin, Arbitrum, Base, Polygon, BSC, Optimism, ICP, XRP, SUI, TON, Cardano, Aptos, NEAR, Tron, Litecoin, CloakCoin, THORChain.

**Canister ID (mainnet):** `urs2a-ziaaa-aaaad-aembq-cai`

---

## Two Integration Approaches

| | Canister (Recommended) | CLI (Quick) |
|---|---|---|
| **Flow** | User → ClawdBot → Your Canister → MeneseSDK | User → ClawdBot → `dfx canister call` → MeneseSDK |
| **Setup** | Deploy `WalletBot.mo`, register with SDK | Copy `scripts/wallet_commands.py`, done |
| **Best for** | Multi-user, automation, timers, production | Single-user, prototyping, testing |
| **Automation** | ICP timers for DCA/rebalance/bots | None (manual only) |

---

## Best Practice: Cache Addresses

Addresses are **deterministic** — the same principal always gets the same addresses on every chain. Fetch once, cache forever.

```motoko
// Canister pattern — cache in stable var
stable var cachedAddresses : ?AddressBook = null;

public shared func getAddresses() : async AddressBook {
  switch (cachedAddresses) {
    case (?addrs) { addrs };  // Return cached — no inter-canister call
    case null {
      let sol = await menese.getMySolanaAddress();
      let evm = await menese.getMyEvmAddress();
      // ... fetch all chains once ...
      let addrs = { solana = sol.address; evm = evm.evmAddress; /* ... */ };
      cachedAddresses := ?addrs;
      addrs;
    };
  };
};
```

```python
# CLI pattern — fetch once, store in file
import json, os
CACHE_FILE = "addresses_cache.json"

def get_addresses():
    if os.path.exists(CACHE_FILE):
        return json.load(open(CACHE_FILE))
    addrs = fetch_all_addresses()  # dfx calls
    json.dump(addrs, open(CACHE_FILE, "w"))
    return addrs
```

**Why**: Saves inter-canister call latency + cycles. Addresses never change for a given principal.

---

## EVM Chains — Bring Your Own RPC

All EVM operations (ETH, Arbitrum, Base, Polygon, BSC, Optimism) require **your own RPC endpoint**. MeneseSDK does not manage EVM RPCs.

| Chain | Chain ID | Free Public RPC |
|-------|----------|----------------|
| Ethereum | 1 | `https://eth.llamarpc.com` |
| Arbitrum | 42161 | `https://arb1.arbitrum.io/rpc` |
| Base | 8453 | `https://mainnet.base.org` |
| Polygon | 137 | `https://polygon-rpc.com` |
| BSC | 56 | `https://bsc-dataseed1.binance.org` |
| Optimism | 10 | `https://mainnet.optimism.io` |

Use Alchemy/Infura for production reliability.

---

## Complete Tool Reference

Every operation available, organized by category. Each tool shows the function, parameters, return type, cost, and a usage example.

### Tool 1: Get Addresses (FREE)

Deterministic per-principal. **Cache after first call.**

| Chain | Function | Field to Extract |
|-------|----------|-----------------|
| Solana | `getMySolanaAddress` | `.address` |
| EVM (all 6) | `getMyEvmAddress` | `.evmAddress` (NOT `.address`) |
| Bitcoin | `getMyBitcoinAddress` | `.bech32Address` |
| Litecoin | `getMyLitecoinAddress` | `.bech32Address` |
| SUI | `getMySuiAddress` | `.suiAddress` (NOT `.address`) |
| XRP | `getMyXrpAddress` | `.classicAddress` |
| TON | `getMyTonAddress` | `.nonBounceable` (NOT `.address`) |
| Cardano | `getMyCardanoAddress` | `.bech32Address` |
| Aptos | `getMyAptosAddress` | `.address` |
| NEAR | `getMyNearAddress` | `.implicitAccountId` (NOT `.accountId`) |
| Tron | `getTronAddress` | `.base58Address` (NOT `.base58`) |
| CloakCoin | `getMyCloakAddress` | `.base58Address` |
| THORChain | `getMyThorAddress` | `.bech32Address` |

**Batch**: `getAllAddresses()` — all chains in one call.
**Solana ATA**: `getMySolanaAta(mintBase58)` — get associated token account for an SPL token.

```motoko
// Example: get SOL address
let info = await menese.getMySolanaAddress();
let myAddress = info.address;  // "5xK2abc..."
```

```bash
# CLI
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMySolanaAddress --network ic --query
```

### Tool 2: Check Balances (FREE)

| Chain | Function | Returns | Unit |
|-------|----------|---------|------|
| Solana | `getMySolanaBalance` | `Result<Nat64, Text>` | lamports (÷10^9) |
| ICP | `getICPBalance` | `Result<Nat64, Text>` | e8s (÷10^8) |
| ICP (for addr) | `getICPBalanceFor(principal)` | `Result<Nat64, Text>` | e8s (÷10^8) |
| Bitcoin | `getBitcoinBalance` | `Nat64` | satoshis (÷10^8) |
| Litecoin | `getLitecoinBalance` | `Nat64` | litoshis (÷10^8) |
| EVM | `getMyEvmBalance(rpcUrl)` | `Result<Nat, Text>` | wei (÷10^18) |
| XRP | `getMyXrpBalance` | `Result<Text, Text>` | drops as text |
| SUI | `getMySuiBalance` | `Nat64` | mist (÷10^9) |
| TON | `getMyTonBalance` | `Result<Nat64, Text>` | nanotons (÷10^9) |
| Cardano | `getCardanoBalance` | `Result<Nat64, Text>` | lovelace (÷10^6) |
| Aptos | `getAptosBalance` | `Result<Nat64, Text>` | octas (÷10^8) |
| NEAR | `getMyNearBalance` | `Nat` | yoctoNEAR (÷10^24) |
| THORChain | `getThorBalance` | `[{amount, denom}]` | units (÷10^8) |
| CloakCoin | `getCloakBalance` | `Result<{address, balance, utxoCount}, Text>` | units (÷10^6) |
| Tron | `getTrxBalance(address)` | `Result<Nat64, Text>` | sun (÷10^6) |
| ICRC-1 tokens | `getICRC1Balance(ledgerId)` | `Result<Nat, Text>` | smallest unit |
| ICRC-1 (for addr) | `getICRC1BalanceFor(principal, ledgerId)` | `Result<Nat, Text>` | smallest unit |
| ICRC-1 batch | `getICRC1Balances(canisterIds:[Text])` | `[(Text, Result<Nat, Text>)]` | smallest unit per token |
| ICRC-1 info | `getICRC1TokenInfo(ledgerId)` | `Result<TokenInfo, Text>` | name, symbol, decimals, fee, canisterId |
| ICP tokens list | `getSupportedICPTokens()` | `[{name,symbol,canisterId,type_,category}]` | query (FREE) |
| TRC-20 tokens | `getMyTrc20Balance(contract)` | `Result<Nat, Text>` | smallest unit |

**Batch**: `getAllBalances()` — parallel fetch across all chains.

**Performance tip**: For high-frequency reads, query chain RPCs directly using cached addresses. MeneseSDK is best for signing; your own RPC is faster for reads.

```motoko
// Example: check SOL balance, convert to human-readable
switch (await menese.getMySolanaBalance()) {
  case (#ok(lamports)) { /* lamports / 1_000_000_000 = SOL */ };
  case (#err(e)) { /* handle error */ };
};

// Example: check ICP balance
switch (await menese.getICPBalance()) {
  case (#ok(e8s)) { /* e8s / 100_000_000 = ICP */ };
  case (#err(e)) { /* handle error */ };
};
```

```bash
# CLI — check ICP balance
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPBalance --network ic

# CLI — check ICRC-1 token balance (ckUSDC)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC1Balance '("xevnm-gaaaa-aaaar-qafnq-cai")' --network ic

# CLI — batch check ckUSDC + ckBTC balances
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC1Balances '(vec { "xevnm-gaaaa-aaaar-qafnq-cai"; "mxzaz-hqaaa-aaaar-qaada-cai" })' --network ic
```

```motoko
// Example: get ckUSDC + ckBTC balances in one call (parallel)
let ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";
let ckBTC  = "mxzaz-hqaaa-aaaar-qaada-cai";
let balances = await menese.getICRC1Balances([ckUSDC, ckBTC]);
// Returns: [("xevnm-...", #ok(150_000_000)), ("mxzaz-...", #ok(5_000))]
```

```motoko
// Example: get token info (name, symbol, decimals)
switch (await menese.getICRC1TokenInfo("xevnm-gaaaa-aaaar-qafnq-cai")) {
  case (#ok(info)) {
    // info.name = "ckUSDC", info.symbol = "ckUSDC", info.decimals = 6, info.fee = 10000
  };
  case (#err(e)) { /* handle error */ };
};
```

```motoko
// Example: list all supported ICP tokens
let tokens = await menese.getSupportedICPTokens();
// Returns: [{name="Internet Computer", symbol="ICP", canisterId="ryjl3-...", type_="native", category="ecosystem"}, ...]
```

### Tool 3: Send Tokens ($0.05 client / $0.10 agent)

**Return types differ by chain** — getting this wrong causes runtime errors.

| Chain | Function | Params | Return |
|-------|----------|--------|--------|
| Solana | `sendSolTransaction` | `(to, lamports:Nat64)` | `Result<Text, Text>` |
| ICP | `sendICP` | `(to:Principal, e8s:Nat64)` | `Result<SendICPResult, Text>` |
| ICRC-1 | `sendICRC1` | `(to:Principal, amount:Nat, ledger:Text)` | `Result<SendICRC1Result, Text>` |
| Bitcoin | `sendBitcoin` | `(to, sats:Nat64)` | `Result<SendResultBtcLtc, Text>` |
| Litecoin | `sendLitecoin` | `(to, litoshis:Nat64)` | `Result<SendResult, Text>` (NOT BtcLtc!) |
| EVM | `sendEvmNativeTokenAutonomous` | `(to, wei:Nat, rpc, chainId:Nat, ?quoteId)` | `Result<SendResultEvm, Text>` |
| XRP | `sendXrpAutonomous` | `(to, amountXrp:Text, ?destTag:Nat32)` | **FLAT** `SendResultXrp` |
| SUI | `sendSui` | `(to, mist:Nat64)` | `Result<SendResult, Text>` |
| TON | `sendTonSimple` | `(to, nanotons:Nat64)` | **FLAT** `SendResultTon` |
| Aptos | `sendAptos` | `(to, octas:Nat64)` | `Result<SendResult, Text>` |
| NEAR | `sendNearTransfer` | `(to, yocto:Nat)` | `Result<Text, Text>` |
| Tron | `sendTrx` | `(to, sun:Nat64)` | `Result<Text, Text>` |
| Cardano | `sendCardanoTransaction` | `(to, lovelace:Nat64)` | `Result<Text, Text>` |
| CloakCoin | `sendCloak` | `(to, amount:Nat64)` | `Result<SendResultCloak, Text>` |
| THORChain | `sendThor` | `(to, amount:Nat64, memo:Text)` | `Result<Text, Text>` |
| SPL Token | `transferSplToken` | `(amount:Nat64, srcAta, dstAta)` | `TransferAndSendResult` |
| XRP IOU | `sendXrpIOU` | `(dest, currency, issuer, amount, ?tag)` | `SendResultXrp` |
| TRC-20 | `sendTrc20` | `(contract, to, amount:Nat, feeLimit:Nat64)` | `Result<Text, Text>` |

**Variant extras**: `sendBitcoinDynamicFee`, `sendBitcoinWithFee`, `sendLitecoinWithFee`, `sendSuiMax`, `sendTon` (with bounce/comment), `sendTonWithComment`.

```motoko
// Example: send 1 ICP
switch (await menese.sendICP(Principal.fromText("aaaaa-aa"), 100_000_000)) {
  case (#ok(res)) { /* res.blockHeight */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 50 ckUSDC (ICRC-1 token)
let ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";
switch (await menese.sendICRC1(recipientPrincipal, 50_000_000, ckUSDC)) {
  case (#ok(res)) { /* res.blockHeight, res.amount */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 0.5 SOL
switch (await menese.sendSolTransaction("5xK2abc...", 500_000_000)) {
  case (#ok(txHash)) { /* success — txHash is the Solana TX signature */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 0.01 BTC
switch (await menese.sendBitcoin("bc1qRecipient...", 1_000_000)) {
  case (#ok(res)) { /* res.txid, res.fee */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 0.1 ETH on Ethereum mainnet
switch (await menese.sendEvmNativeTokenAutonomous("0xRecipient...", 100_000_000_000_000_000, ethRpc, 1, null)) {
  case (#ok(res)) { /* res.txHash, res.nonce */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send XRP (FLAT return — check .success, not #ok)
let r = await menese.sendXrpAutonomous("rDestAddr...", "10.5", null);
if (r.success) { /* r.txHash, r.explorerUrl */ }
else { /* r.message has error */ };

// Example: send 1 SUI
switch (await menese.sendSui("0xRecipient...", 1_000_000_000)) {
  case (#ok(res)) { /* res.txHash */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 1 TON (FLAT return — check .success)
let tonResult = await menese.sendTonSimple("EQAddress...", 1_000_000_000);
if (tonResult.success) { /* tonResult.txHash */ };

// Example: send 5 ADA (Cardano)
switch (await menese.sendCardanoTransaction("addr1...", 5_000_000)) {
  case (#ok(txHash)) { /* success */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 1 NEAR
switch (await menese.sendNearTransfer("recipient.near", 1_000_000_000_000_000_000_000_000)) {
  case (#ok(txHash)) { /* success */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 10 TRX
switch (await menese.sendTrx("TRecipient...", 10_000_000)) {
  case (#ok(txHash)) { /* success */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 0.01 LTC
switch (await menese.sendLitecoin("ltc1qRecipient...", 1_000_000)) {
  case (#ok(res)) { /* res.txHash */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 100 CLOAK (6 decimals!)
switch (await menese.sendCloak("CloakAddr...", 100_000_000)) {
  case (#ok(res)) { /* res.txHash */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 0.1 RUNE with memo
switch (await menese.sendThor("thor1addr...", 10_000_000, "memo:test")) {
  case (#ok(txHash)) { /* success */ };
  case (#err(e)) { /* handle error */ };
};

// Example: send 1 APT
switch (await menese.sendAptos("0xRecipient...", 100_000_000)) {
  case (#ok(res)) { /* res.txHash */ };
  case (#err(e)) { /* handle error */ };
};
```

```bash
# CLI — send 1 ICP
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendICP '(principal "aaaaa-aa", 100000000 : nat64)' --network ic

# CLI — send 50 ckUSDC (ICRC-1)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendICRC1 '(principal "aaaaa-aa", 50000000 : nat, "xevnm-gaaaa-aaaar-qafnq-cai")' --network ic

# CLI — send 0.5 SOL
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendSolTransaction '("5xK2abc...", 500000000 : nat64)' --network ic

# CLI — send 0.01 BTC
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendBitcoin '("bc1qRecipient...", 1000000 : nat64)' --network ic

# CLI — send 0.1 ETH
dfx canister call urs2a-ziaaa-aaaad-aembq-cai sendEvmNativeTokenAutonomous '("0xRecipient...", 100000000000000000 : nat, "https://eth.llamarpc.com", 1 : nat, null)' --network ic
```

### Tool 3b: ICRC-2 Approve & TransferFrom ($0.05 client / $0.10 agent)

ICRC-2 adds ERC-20-style `approve` + `transferFrom` to ICP tokens. Use when building escrow, payment splitters, or any pattern where a canister needs to spend tokens on behalf of users.

| Operation | Function | Params | Return | Cost |
|-----------|----------|--------|--------|------|
| Approve spender | `approveICRC2` | `(spender:Principal, amount:Nat, expiresAt:?Nat64, ledgerId:Text)` | `Result<ApproveResult, Text>` | $0.05/$0.10 |
| Check allowance | `getICRC2Allowance` | `(owner:Principal, spender:Principal, ledgerId:Text)` | `Result<Allowance, Text>` | FREE |
| TransferFrom | `transferFromICRC2` | `(from:Principal, to:Principal, amount:Nat, ledgerId:Text)` | `Result<TransferFromResult, Text>` | $0.05/$0.10 |

**Return types:**
```
ApproveResult = { amount:Nat, blockHeight:Nat, spender:Principal, token:Text }
Allowance = { allowance:Nat, expires_at:?Nat64 }
TransferFromResult = { amount:Nat, blockHeight:Nat, from:Principal, to:Principal, token:Text }
```

```motoko
// Approve MeneseSDK canister to spend 100 ckUSDC on your behalf
let ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";
let sdk = Principal.fromText("urs2a-ziaaa-aaaad-aembq-cai");
let r = await menese.approveICRC2(sdk, 100_000_000, null, ckUSDC);  // 100 ckUSDC (6 dec)

// Check remaining allowance (FREE)
let allowance = await menese.getICRC2Allowance(myPrincipal, sdk, ckUSDC);

// Transfer from (requires prior approval)
let t = await menese.transferFromICRC2(userPrincipal, treasuryPrincipal, 50_000_000, ckUSDC);
```

```bash
# CLI — approve ICRC-2 (approve SDK to spend 100 ckUSDC)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai approveICRC2 '(principal "urs2a-ziaaa-aaaad-aembq-cai", 100000000 : nat, null, "xevnm-gaaaa-aaaar-qafnq-cai")' --network ic

# CLI — check ICRC-2 allowance
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICRC2Allowance '(principal "YOUR_PRINCIPAL", principal "urs2a-ziaaa-aaaad-aembq-cai", "xevnm-gaaaa-aaaar-qafnq-cai")' --network ic
```

### Tool 4: Swap on DEXes ($0.075 client / $0.15 agent)

| DEX | Chain | Function | Key Details |
|-----|-------|----------|-------------|
| Raydium | Solana | `swapRaydiumApiUser` | 8 params, FLAT return |
| Uniswap V3 | EVM | `swapTokens`, `swapTokensMultiHop` | Pass quoteId or rpc+chainId |
| Uniswap shortcuts | EVM | `swapETHForUSDC`, `swapUSDCForETH` | Quick ETH↔USDC |
| ICPSwap/KongSwap | ICP | `executeICPDexSwap(SwapRequest)` | Auto-routes best price |
| Cetus | SUI | `executeSuiSwap(network, from, to, amountIn, minOut)` | Network: `#mainnet` |
| Minswap | Cardano | `executeMinswapSwap(tokenIn, tokenOut, amount, slippage)` | Float slippage % |
| XRP DEX | XRP | `xrpSwap(destAmount, sendMax, paths, slipBps)` | Use xrpFindPaths first |

**Always get a quote first (FREE)**:
- Raydium: `getRaydiumQuote(inputMint, outputMint, amount, slipBps)`
- Uniswap: `getTokenQuote(from, to, amountIn, rpc)`
- ICP: `getICPDexQuote(tokenIn, tokenOut, amountIn, slipPct)` → `AggregatedQuote` (compares ICPSwap vs KongSwap)
- SUI: `getSuiSwapQuote(network, from, to, amountIn, slipBps)`
- Cardano: `getMinswapQuote(tokenIn, tokenOut, amountIn, slipPct)`
- XRP: `xrpFindPaths(destAmount, sourceCurrencies)`

```motoko
// Example: swap 1 SOL → USDC on Raydium
let SOL = "So11111111111111111111111111111111111111112";
let USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

let result = await menese.swapRaydiumApiUser(
  SOL, USDC,
  1_000_000_000,  // 1 SOL in lamports
  150,            // 1.5% slippage
  true,           // wrapSol: input is native SOL
  false,          // unwrapSol: output is USDC not SOL
  null, null      // auto-detect ATAs
);
// FLAT record — access directly:
// result.txSignature, result.outputAmount, result.priceImpactPct
```

```motoko
// Example: swap on ICP DEX (auto-routes to ICPSwap or KongSwap)
let swapReq : Menese.SwapRequest = {
  tokenIn = "ryjl3-tyaaa-aaaaa-aaaba-cai";   // ICP ledger
  tokenOut = "xevnm-gaaaa-aaaar-qafnq-cai";  // ckUSDC
  amountIn = 100_000_000;  // 1 ICP
  minAmountOut = 0;
  slippagePct = 1.0;
  preferredDex = null;  // auto-pick best price
};
let result = await menese.executeICPDexSwap(swapReq);

// Example: swap on Uniswap V3 (EVM) — use quoteId from getTokenQuote
let quote = await menese.getTokenQuote("USDC", "WETH", 1000_000_000, ethRpc);
switch (quote) {
  case (#ok(q)) {
    let swap = await menese.swapTokens(q.quoteId, "USDC", "WETH", 1000_000_000, 100, false, ethRpc);
  };
  case (#err(e)) { /* handle */ };
};

// Example: quick ETH → USDC swap shortcut
let ethToUsdc = await menese.swapETHForUSDC(500_000_000_000_000_000, 100, ethRpc);  // 0.5 ETH

// Example: swap on SUI DEX (Cetus)
let suiSwap = await menese.executeSuiSwap(#mainnet, "0xSUI_COIN", "0xUSDC_COIN", "1000000000", "990000000");

// Example: swap on Minswap (Cardano)
let cardanoSwap = await menese.executeMinswapSwap("lovelace", "USDC_POLICY_ID", 5_000_000, 1.0);

// Example: swap on XRP DEX — find paths first, then execute
let paths = await menese.xrpFindPaths({currency = "USD"; value = "100"; issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"}, [{currency = "XRP"}]);
let xrpResult = await menese.xrpSwap({currency = "USD"; value = "100"; issuer = "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq"}, {currency = "XRP"; value = "150"}, paths, 300);
```

### Tool 5: Bridge ETH↔SOL ($0.10 client / $0.20 agent)

| Direction | Function | Params |
|-----------|----------|--------|
| ETH→SOL | `quickUltrafastEthToSol` | `(ethWei:Nat)` |
| USDC→SOL | `quickUltrafastUsdcToSol` | `(usdc:Nat)` |
| ETH→Token | `quickUltrafastEthToToken` | `(ethWei:Nat, outputMint, slipBps:Nat)` |
| SOL→ETH | `quickSolToEth` | `(solLamports:Nat64, slipBps:Nat)` |
| USDC SOL→ETH | `quickUsdcBridgeSolToEth` | `(usdc:Nat64)` |
| CCTP (any) | `quickCctpBridge` | `(srcChainId, usdc, outputToken, fast, slipBps, ethRpc)` |

```motoko
// Example: bridge 0.1 ETH to Solana
let result = await menese.quickUltrafastEthToSol(100_000_000_000_000_000);  // 0.1 ETH in wei
// Result<Text, Text> — ok = status text

// Example: bridge 100 USDC via CCTP from Ethereum (chainId=1) to Solana
let cctpResult = await menese.quickCctpBridge(1, 100_000_000, "SOL", true, 100, ethRpc);
// srcChainId=1 (Ethereum), usdc=100M (100 USDC), outputToken="SOL", fast=true, 1% slippage

// Example: bridge 1 SOL → ETH
let solToEth = await menese.quickSolToEth(1_000_000_000, 150);  // 1 SOL, 1.5% slippage
```

### Tool 6: DeFi — Aave V3 ($0.10 agent)

| Operation | Function | Params | Return |
|-----------|----------|--------|--------|
| Supply ETH | `aaveSupplyEth` | `(wei:Nat, rpc, ?quoteId)` | `Result<SupplyEthResult, Text>` |
| Withdraw ETH | `aaveWithdrawEth` | `(wei:Nat, rpc, ?quoteId)` | `Result<WithdrawEthResult, Text>` |
| Supply ERC-20 | `aaveSupplyToken` | `(tokenAddr, amount:Nat, rpc, ?quoteId)` | `Result<SupplyTokenResult, Text>` |
| Withdraw ERC-20 | `aaveWithdrawToken` | `(tokenAddr, amount:Nat, rpc, ?quoteId)` | `Result<WithdrawTokenResult, Text>` |
| Read aWETH bal | `getAWethBalance` | `(user, rpc)` | `Result<Nat, Text>` — FREE |
| Read aToken bal | `getATokenBalance` | `(aTokenAddr, user, rpc)` | `Result<Nat, Text>` — FREE |

**Return types:**
```
SupplyEthResult = { txHash, aTokenAddress, suppliedAmount:Nat, senderAddress, note }
WithdrawEthResult = { txHash, withdrawnAmount:Nat, senderAddress, note }
SupplyTokenResult = { txHash, senderAddress, note }
WithdrawTokenResult = { txHash, senderAddress, note }
```

```motoko
// Supply 0.5 ETH to Aave → receive aWETH (~2-3% APY)
let r = await menese.aaveSupplyEth(500_000_000_000_000_000, ethRpc, null);
switch (r) {
  case (#ok(res)) { /* res.txHash, res.aTokenAddress */ };
  case (#err(e)) { /* error */ };
};
```

### Tool 7: DeFi — Lido Staking ($0.10 agent)

| Operation | Function | Return |
|-----------|----------|--------|
| Stake ETH→stETH | `stakeEthForStEth(wei, rpc, ?quoteId)` | `Result<StakeResult, Text>` |
| Wrap stETH→wstETH | `wrapStEth(amount, rpc, ?quoteId)` | `Result<WrapResult, Text>` |
| Unwrap wstETH→stETH | `unwrapWstEth(amount, rpc, ?quoteId)` | `Result<UnwrapResult, Text>` |
| Read stETH bal | `getStEthBalance(user, rpc)` | `Result<Nat, Text>` — FREE |
| Read wstETH bal | `getWstEthBalance(user, rpc)` | `Result<Nat, Text>` — FREE |

**Return types:**
```
StakeResult = { txHash, senderAddress, note }
WrapResult = { txHash, senderAddress, note }
UnwrapResult = { txHash, senderAddress, note }
```

```motoko
// Stake 1 ETH with Lido (~3-4% APY), then wrap for DeFi composability
ignore await menese.stakeEthForStEth(1_000_000_000_000_000_000, ethRpc, null);
ignore await menese.wrapStEth(1_000_000_000_000_000_000, ethRpc, null);
```

### Tool 8: DeFi — Uniswap V3 Liquidity ($0.10 agent)

| Operation | Function | Params | Return |
|-----------|----------|--------|--------|
| Add ETH+Token LP | `addLiquidityETH` | `(tokenSymbol, tokenAmt:Nat, ethAmt:Nat, slipBps:Nat, rpc, ?quoteId)` | `Result<AddLiqETHResult, Text>` |
| Add Token+Token LP | `addLiquidity` | `(tokenA, tokenB, amtA:Nat, amtB:Nat, slipBps:Nat, rpc, ?quoteId)` | `Result<AddLiqResult, Text>` |
| Remove ETH LP | `removeLiquidityETH` | `(tokenSymbol, lpAmt:Nat, slipBps:Nat, feeOnTransfer:Bool, rpc, ?quoteId)` | `Result<RemLiqETHResult, Text>` |
| Remove Token LP | `removeLiquidity` | `(tokenA, tokenB, lpAmt:Nat, slipBps:Nat, rpc, ?quoteId)` | `Result<RemLiqResult, Text>` |
| Read reserves | `getPoolReserves(tokenA, tokenB, rpc)` | — | `Result<Reserves, Text>` — FREE |
| Get pair addr | `getPairAddress(tokenA, tokenB, rpc)` | — | `Result<PairInfo, Text>` — FREE |

**Return types:**
```
AddLiqETHResult = { txHash, senderAddress, nonce:Nat, tokenAddress, amountTokenDesired:Nat, amountETHDesired:Nat, amountTokenMin:Nat, amountETHMin:Nat, approvalTxHash:?Text, note }
AddLiqResult = { txHash, senderAddress, nonce:Nat, tokenA, tokenB, amountADesired:Nat, amountBDesired:Nat, amountAMin:Nat, amountBMin:Nat, approvalTxHashA:?Text, approvalTxHashB:?Text, note }
RemLiqETHResult = { txHash, senderAddress, nonce:Nat, tokenAddress, lpTokensBurned:Nat, minTokenOut:Nat, minETHOut:Nat, approvalTxHash:?Text, note }
RemLiqResult = { txHash, senderAddress, nonce:Nat, tokenA, tokenB, lpTokensBurned:Nat, minAmountAOut:Nat, minAmountBOut:Nat, approvalTxHash:?Text, note }
Reserves = { pairAddress, reserve0:Nat, reserve1:Nat, token0, token1, blockTimestampLast:Nat }
PairInfo = { tokenA, tokenB, pairAddress }
```

```motoko
// Add liquidity: 1000 USDC + 0.5 ETH to Uniswap V3
let r = await menese.addLiquidityETH("USDC", 1_000_000_000, 500_000_000_000_000_000, 100, ethRpc, null);
switch (r) {
  case (#ok(res)) { /* res.txHash, res.approvalTxHash */ };
  case (#err(e)) { /* error */ };
};

// Remove liquidity
let r2 = await menese.removeLiquidityETH("USDC", lpTokenAmount, 100, false, ethRpc, null);
```

### Tool 9: Custom EVM Contract Calls

| Operation | Function | Cost |
|-----------|----------|------|
| Read (view) | `callEvmContractRead(contract, selector4byte, argsHexes, rpc)` | FREE |
| Write (tx) | `callEvmContractWrite(contract, selector, args, rpc, chainId, value, ?quoteId)` | $0.10 |

Selector = first 4 bytes of `keccak256("functionName(type1,type2)")`, hex-encoded, no `0x` prefix.

```motoko
// Read Chainlink ETH/USD price (FREE)
let result = await menese.callEvmContractRead(
  "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",  // ETH/USD feed
  "feaf968c",  // latestRoundData()
  [], ethRpc
);
```

### Tool 10: Strategy Engine (rule creation FREE, execution per-action pricing)

| Operation | Function | Cost |
|-----------|----------|------|
| Create rule | `addStrategyRule(Rule)` | FREE |
| List rules | `getMyStrategyRules()` | FREE |
| Update status | `updateStrategyRuleStatus(ruleId, status)` | FREE |
| Delete rule | `deleteStrategyRule(ruleId)` | FREE |
| View logs | `getStrategyLogs()` | FREE |
| Init automation | `initAutomation()` | FREE |

Rule types: `#DCA`, `#StopLoss`, `#TakeProfit`, `#Rebalance`, `#Scheduled`, `#APYMigration`, `#LiquidityProvision`, `#VolatilityTrigger`.

Rule statuses: `#Active`, `#Paused`, `#Cancelled`, `#Executed`, `#Executing`, `#Failed`, `#Draft`, `#Confirmed`, `#Ready`.

### Tool 11: Solana ATA / XRP Trustlines (setup)

| Operation | Function | Cost |
|-----------|----------|------|
| Create Solana ATA | `createMySolanaAtaForMint(mint, ata)` | Send pricing |
| Create ATA (custom program) | `createMySolanaAtaForMintWithProgram(mint, ata, programId)` | Send pricing |
| Set XRP trustline | `xrpSetTrustline(currency, issuer, limit)` | Send pricing |
| Read XRP trustlines | `xrpGetAccountLines()` | FREE |
| Get Solana ATA | `getMySolanaAta(mint)` | FREE |

### Tool 12: Developer/Billing

| Operation | Function | Cost |
|-----------|----------|------|
| Register canister | `registerDeveloperCanister(Principal, appName)` | FREE |
| Get dev key | `getMyDeveloperKey()` | FREE |
| Regenerate key | `regenerateDeveloperKey()` | FREE |
| Validate key | `validateDeveloperKey(key)` | FREE |
| Check account | `getMyGatewayAccount()` → `UserAccount` | FREE |
| Check dev account | `getMyDeveloperAccount()` → `?DeveloperAccountV3` | FREE |
| Deposit credits | `depositGatewayCredits(currency, amount)` | ICP cost |

### Tool 13: Utility

| Operation | Function | Cost |
|-----------|----------|------|
| BTC max send | `getBitcoinMaxSendAmount(?feeRate)` → `{maxAmount, fee, utxoCount}` | FREE |
| LTC max send | `getLitecoinMaxSendAmount(?feeRate)` → `{maxAmount, fee, utxoCount}` | FREE |
| Health check | `health()` | FREE |
| Version | `version()` | FREE |
| Validate BTC address | `isValidBitcoinAddress(address)` → `Bool` | FREE |
| Validate LTC address | `isValidLitecoinAddress(address)` → `Bool` | FREE |
| Validate SUI address | `isValidSuiAddress(address)` → `Bool` | FREE |
| Validate TON address | `isValidTonAddress(address)` → `Bool` | FREE |
| Check token support | `isTokenSupported(symbol)` → `Bool` | FREE |
| Validate swap path | `validateSwapPath(from, to, rpc)` → `Bool` | FREE |
| Check route exists | `hasPathThrough(symbolA, intermediary, symbolB)` → `Bool` — query | FREE |
| Token count | `getTokenCount()` → `Nat` — query | FREE |

### Tool 14: ICP DEX LP Management ($0.10 agent)

Manage liquidity positions on ICPSwap and KongSwap. The SDK aggregates both DEXes.

| Operation | Function | Cost |
|-----------|----------|------|
| List pools | `getICPDexPools()` → `[PoolInfo]` | FREE |
| List tokens | `getICPDexTokens()` → `[DexToken]` | FREE |
| View positions | `getICPLPPositions()` → `[LPPosition]` | FREE |
| Add liquidity | `addICPLiquidity(AddLiquidityRequest)` → `Result<AddLiquidityResult, Text>` | $0.10 |
| Remove liquidity | `removeICPLiquidity(RemoveLiquidityRequest)` → `Result<RemoveLiquidityResult, Text>` | $0.10 |

**Types:**

```
DexId = { #ICPSwap | #KongSwap }

TokenStandard = { #ICRC1 | #ICRC2 | #DIP20 }

DexToken = {
  canisterId : Text,
  symbol : Text,
  name : Text,
  decimals : Nat8,
  fee : Nat,
  standard : TokenStandard,
  logo : ?Text,
  category : ?Text,        // "stablecoin" | "wrapped" | "defi" | "meme" | "ecosystem" | "lst" | "yield"
  availableOn : [DexId]
}

PoolInfo = {
  poolId : Text,
  dex : DexId,
  token0 : Text,            // Canister ID
  token1 : Text,            // Canister ID
  token0Symbol : Text,
  token1Symbol : Text,
  reserve0 : Nat,
  reserve1 : Nat,
  fee : Nat,                // Basis points
  tvl : ?Nat,               // Total value locked
  apr : ?Float,             // Annual percentage rate
  volume24h : ?Nat
}

LPPosition = {
  poolId : Text,
  dex : DexId,
  token0 : Text,
  token1 : Text,
  token0Symbol : Text,
  token1Symbol : Text,
  liquidity : Nat,          // LP token amount
  token0Amount : Nat,       // Estimated underlying
  token1Amount : Nat,       // Estimated underlying
  unclaimedFees : ?(Nat, Nat),  // Unclaimed fees (token0, token1)
  valueUsd : ?Nat           // Estimated USD value (cents)
}

AddLiquidityRequest = {
  poolId : Text,
  dex : DexId,              // #ICPSwap or #KongSwap
  token0 : Text,            // Canister ID
  token1 : Text,            // Canister ID
  token0Amount : Nat,
  token1Amount : Nat,
  slippagePct : Float
}

AddLiquidityResult = {
  success : Bool,
  lpTokens : Nat,
  token0Used : Nat,
  token1Used : Nat,
  poolId : Text,
  message : Text
}

RemoveLiquidityRequest = {
  poolId : Text,
  dex : DexId,              // #ICPSwap or #KongSwap
  lpTokens : Nat,
  slippagePct : Float
}

RemoveLiquidityResult = {
  success : Bool,
  token0Received : Nat,
  token1Received : Nat,
  message : Text
}
```

**Well-known canister IDs:**
| Token | Canister ID | Decimals |
|-------|-------------|----------|
| ICP | `ryjl3-tyaaa-aaaaa-aaaba-cai` | 8 |
| ckUSDC | `xevnm-gaaaa-aaaar-qafnq-cai` | 6 |
| ckBTC | `mxzaz-hqaaa-aaaar-qaada-cai` | 8 |
| ckETH | `ss2fx-dyaaa-aaaar-qacoq-cai` | 18 |
| ckUSDT | `cngnf-vqaaa-aaaar-qag4q-cai` | 6 |
| CHAT | `2ouva-viaaa-aaaaq-aaamq-cai` | 8 |

**Well-known pools:** ICP/ckUSDC, ckBTC/ICP, ICP/ckETH, ckUSDT/ckUSDC, CHAT/ICP (on both ICPSwap and KongSwap).

```motoko
// Discover pools, then add liquidity
let pools = await menese.getICPDexPools();
// Find ICP/ckUSDC pool
let pool = Array.find<DexTypes.PoolInfo>(pools, func(p) { p.token0Symbol == "ICP" and p.token1Symbol == "ckUSDC" });

switch (pool) {
  case (?p) {
    let req : DexTypes.AddLiquidityRequest = {
      poolId = p.poolId;
      dex = p.dex;
      token0 = "ryjl3-tyaaa-aaaaa-aaaba-cai";  // ICP ledger
      token1 = "xevnm-gaaaa-aaaar-qafnq-cai";  // ckUSDC
      token0Amount = 100_000_000;  // 1 ICP
      token1Amount = 10_000_000;   // 10 ckUSDC
      slippagePct = 1.0;
    };
    let result = await menese.addICPLiquidity(req);
  };
  case null { /* pool not found */ };
};

// View positions
let positions = await menese.getICPLPPositions();
// Remove liquidity
let removeReq : DexTypes.RemoveLiquidityRequest = {
  poolId = positions[0].poolId;
  dex = positions[0].dex;
  lpTokens = positions[0].liquidity;  // Remove all
  slippagePct = 1.0;
};
let removed = await menese.removeICPLiquidity(removeReq);
```

```bash
# CLI — list all ICP DEX pools
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexPools --network ic

# CLI — list all available tokens
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexTokens --network ic

# CLI — view your LP positions
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPLPPositions --network ic

# CLI — get swap quote (ICP → ckUSDC, 1 ICP)
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPDexQuote '("ryjl3-tyaaa-aaaaa-aaaba-cai", "xevnm-gaaaa-aaaar-qafnq-cai", 100000000 : nat, 1.0 : float64)' --network ic

# CLI — execute swap
dfx canister call urs2a-ziaaa-aaaad-aembq-cai executeICPDexSwap '(record { tokenIn = "ryjl3-tyaaa-aaaaa-aaaba-cai"; tokenOut = "xevnm-gaaaa-aaaar-qafnq-cai"; amountIn = 100000000 : nat; minAmountOut = 0 : nat; slippagePct = 1.0 : float64; preferredDex = null })' --network ic

# CLI — add ICP liquidity
dfx canister call urs2a-ziaaa-aaaad-aembq-cai addICPLiquidity '(record { poolId = "POOL_ID"; dex = variant { ICPSwap }; token0 = "ryjl3-tyaaa-aaaaa-aaaba-cai"; token1 = "xevnm-gaaaa-aaaar-qafnq-cai"; token0Amount = 100000000 : nat; token1Amount = 10000000 : nat; slippagePct = 1.0 : float64 })' --network ic

# CLI — remove ICP liquidity
dfx canister call urs2a-ziaaa-aaaad-aembq-cai removeICPLiquidity '(record { poolId = "POOL_ID"; dex = variant { ICPSwap }; lpTokens = 1000000 : nat; slippagePct = 1.0 : float64 })' --network ic
```

### Tool 15: ICP AI Rebalancer (FREE)

AI-powered portfolio rebalancing recommendations using Herfindahl-Hirschman Index diversification scoring, impermanent loss estimation, and risk-adjusted APY analysis.

| Operation | Function | Cost |
|-----------|----------|------|
| Get recommendations | `getICPRebalanceRecommendations(preferences, tokenBalances, pools?)` → `[RebalanceRecommendation]` | FREE |

**Types:**

```
RebalancePreferences = {
  targetCategories : [Text],     // ["stablecoin", "defi", "lst", "yield", "wrapped", "meme", "ecosystem"]
  riskTolerance : Text,          // "conservative" | "moderate" | "aggressive"
  minApy : ?Float,
  maxImpermanentLoss : ?Float,
  autoCompound : Bool
}

RebalanceAction = { #Swap | #AddLiquidity | #RemoveLiquidity | #Compound }

ImpermanentLossRisk = { #Low | #Medium | #High }

RebalanceRecommendation = {
  id : Text,
  action : RebalanceAction,
  fromToken : Text,              // Canister ID or pool ID
  toToken : Text,                // Canister ID or pool ID
  fromSymbol : Text,
  toSymbol : Text,
  amount : Nat,
  reason : Text,
  estimatedApy : ?Float,
  currentApy : ?Float,
  impermanentLossRisk : ImpermanentLossRisk,
  confidence : Float,            // 0.0 - 1.0
  estimatedGasUsd : ?Float
}
```

```motoko
// Get rebalancing recommendations for your ICP portfolio
let prefs : DexTypes.RebalancePreferences = {
  targetCategories = ["stablecoin", "defi", "lst"];
  riskTolerance = "moderate";
  minApy = ?5.0;             // Only suggest >5% APY
  maxImpermanentLoss = ?10.0; // Max 10% IL risk
  autoCompound = true;
};

// Pass current balances: [(canisterId, amount)]
let balances = [
  ("ryjl3-tyaaa-aaaaa-aaaba-cai", 500_000_000),   // 5 ICP
  ("xevnm-gaaaa-aaaar-qafnq-cai", 100_000_000),   // 100 ckUSDC
  ("mxzaz-hqaaa-aaaar-qaada-cai", 50_000),         // 0.0005 ckBTC
];

let recommendations = await menese.getICPRebalanceRecommendations(prefs, balances, null);
for (rec in recommendations.vals()) {
  Debug.print(rec.reason # " | Confidence: " # Float.toText(rec.confidence));
  // e.g., "Swap 2 ICP → ckUSDC and add to ICP/ckUSDC pool for 12.5% APY | Confidence: 0.85"
};
```

```bash
# CLI — get AI rebalance recommendations
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getICPRebalanceRecommendations '(record { targetCategories = vec { "stablecoin"; "defi" }; riskTolerance = "moderate"; minApy = opt (5.0 : float64); maxImpermanentLoss = opt (10.0 : float64); autoCompound = true }, vec { record { "ryjl3-tyaaa-aaaaa-aaaba-cai"; 500000000 : nat }; record { "xevnm-gaaaa-aaaar-qafnq-cai"; 100000000 : nat } }, null)' --network ic
```

### Tool 16: Cross-Principal Lookups (FREE)

Get addresses and balances for **any** principal or address — not just your own. Useful for payment verification, portfolio dashboards, and multi-user apps.

| Chain | Address For | Balance For |
|-------|------------|-------------|
| Solana | `getSolanaAddressFor(principal)` → `SolanaAddressInfo` | `getSolanaBalance(address)` → `Result<Nat64, Text>` |
| EVM | `getEvmAddressFor(principal)` → `EvmAddressInfo` | `getEvmBalance(address, rpc)` → `?Nat` |
| Bitcoin | `getBitcoinAddressFor(principal)` → `AddressInfo` | `getBitcoinBalanceFor(address)` → `Nat64` |
| Litecoin | `getLitecoinAddressFor(principal)` → `AddressInfo` | `getLitecoinBalanceFor(address)` → `Nat64` |
| SUI | `getSuiAddressFor(principal)` → `SuiAddressInfo` | `getSuiBalanceFor(address)` → `Nat64` |
| TON | `getTonAddressFor(principal)` → `TonAddressInfo` | `getTonBalanceFor(address)` → `Result<Nat64, Text>` |
| XRP | `getXrpAddressFor(principal)` → `XrpAddressInfo` | — (use XRP RPC) |
| CloakCoin | `getCloakAddressFor(principal)` → `CloakAddressInfo` | `getCloakBalanceFor(address)` → `Result<{address,balance,utxoCount}, Text>` |
| Tron | — (use `getTronAddress`) | `getTrxBalance(address)` → `Result<Nat64, Text>` |
| Tron TRC-20 | — | `getTrc20Balance(ownerAddr, contractAddr)` → `Result<Nat, Text>` |
| Cardano | — | `getCardanoWalletBalance()` → `Result<CardanoBalance, Text>` |
| TON (extra) | — | `getTonAccountInfoFor(address)` → `AccountInfo` |

**Additional chain info:**
- `getMyNearPubKey()` → `PubKeyInfo` — get your NEAR public key
- `getNearUserAccountInfo()` → `{accountId, pkBase58, pkBytes}` — full NEAR account info
- `getMyTonAccountInfo()` → `AccountInfo` — your TON account details
- `getMySuiCoins()` → `[CoinData]` — list your SUI coin objects
- `getSuiCoinsFor(address)` → `[CoinData]` — list SUI coin objects for any address

```
CoinData = { objectId:Text, digest:Text, version:Nat64, balance:Nat64 }
```

```motoko
// Check another user's Solana balance
let theirAddr = await menese.getSolanaAddressFor(otherPrincipal);
let bal = await menese.getSolanaBalance(theirAddr.address);

// Check another user's EVM balance
let theirEvm = await menese.getEvmAddressFor(otherPrincipal);
let evmBal = await menese.getEvmBalance(theirEvm.evmAddress, ethRpc);
```

### Tool 17: EVM Gas Estimation — Preflight (FREE)

Estimate gas costs **before** executing a transaction. All preflight functions return gas price and estimated cost so you can show users what they'll pay.

| Operation | Function | Params |
|-----------|----------|--------|
| Gas price | `preflightGasPrice(rpc, ?bufferBps)` | Returns current gas price |
| Send gas | `preflightEvmSendGas(quoteId, wei, rpc, chainId)` | Estimate for native send |
| Swap gas | `preflightEvmSwapGas(quoteId, fromSymbol, amountIn, rpc, ?chainId)` | Estimate for swap |
| Approve gas | `preflightEvmApproveGas(quoteId, rpc, ?chainId)` | Estimate for ERC-20 approve |
| Add LP gas | `preflightEvmAddLiquidityGas(quoteId, wei, rpc, ?chainId)` | Estimate for adding LP |
| Remove LP gas | `preflightEvmRemoveLiquidityGas(quoteId, rpc, ?chainId)` | Estimate for removing LP |
| Contract write gas | `preflightEvmContractWriteGas(quoteId, wei, rpc, ?chainId)` | Estimate for custom writes |

All return `Result<GasEstimate, Text>`.

```motoko
// Get gas price before sending ETH
let gasEst = await menese.preflightGasPrice(ethRpc, ?200);  // 200 bps buffer
switch (gasEst) {
  case (#ok(est)) { Debug.print("Gas price: " # Nat.toText(est)) };
  case (#err(e)) { /* handle */ };
};
```

### Tool 18: Bridge Monitoring & Extra Variants

#### Additional Bridge Functions

| Direction | Function | Params | Return |
|-----------|----------|--------|--------|
| ETH→SOL (flexible) | `quickUltrafastBridge(usdcAmt, userUsdcAta)` | Manual ATA | `Result<Text, Text>` |
| USDC→SOL (auto-ATA) | `quickUltrafastUsdcBridge(usdcAmt)` | Auto-detect ATA | `Result<Text, Text>` |
| Chain→SOL via CCTP | `quickCctpBridgeFromChain(srcChain, usdc, ethWei, outputToken, fast, slipBps, ?rpc)` | From any CCTP chain | `Result<Text, Text>` |
| USDC SOL→ETH | `quickUsdcSolToEth(usdc:Nat64, slipBps)` | Direct USDC bridge | `Result<Text, Text>` |

#### Fee Estimation (FREE — query)

| Function | Params | Return |
|----------|--------|--------|
| `estimateCctpFees(usdcAmt, useFastMode)` | Estimate CCTP bridge cost | `{fee:Nat, time:Text}` |
| `estimateUltrafastBridge(ethWei, usdcAmt, outputToken, useFastMode)` | Estimate ultrafast cost | `{estimatedFeeUsdc, estimatedTimeSeconds, inputType, outputType}` |

#### Supported Chains (FREE — query)

| Function | Return |
|----------|--------|
| `getCctpSupportedChains()` | `[{chainId, name, defaultRpc}]` |
| `getSolToEthSupportedChains()` | `[{chainId, domain, name}]` |

#### Job Monitoring

Track bridge operations across all three bridge systems (CCTP, SOL→ETH, Ultrafast).

| Operation | Function | Return |
|-----------|----------|--------|
| List my CCTP jobs | `getMyCctpJobs()` | `[CctpJob]` |
| List my SOL→ETH jobs | `getMySolToEthJobs()` | `[SolToEvmJob]` |
| List my ultrafast jobs | `getMyUltrafastJobs()` | `[UltrafastJob]` |
| Get active CCTP jobs | `getActiveCctpJobs()` | `[CctpJob]` — query |
| Get CCTP job | `getCctpJob(jobId)` | `?CctpJob` — query |
| Get CCTP status | `getCctpJobStatus(jobId)` | `?{burnTxHash, relayTxHash, stage, isComplete, isFailed, lastError}` — query |
| Get SOL→ETH job | `getSolToEthJob(jobId)` | `?SolToEvmJob` — query |
| Get SOL→ETH status | `getSolToEthJobStatus(jobId)` | `?{burnTxSig, evmMintTxHash, stage, progress, isComplete, isFailed, lastError}` — query |
| Get ultrafast job | `getUltrafastJob(jobId)` | `?UltrafastJob` |
| Get ultrafast status | `getUltrafastJobStatus(jobId)` | `?UltrafastJob` |
| Get ultrafast jobs | `getUltrafastJobsForCaller()` | `[UltrafastJob]` |
| Get ultrafast result | `getUltrafastResult(jobId)` | `?UltrafastResult` |
| SOL→ETH stats | `getSolToEthStats()` | `{activeJobs, completedJobs, failedJobs, totalJobs}` — query |
| Ultrafast stats | `getUltrafastStats()` | `{activeJobs, completedJobs, failedJobs, totalJobs}` |
| My CCTP USDC ATA | `getMyCctpUsdcAta()` | `Text` |
| My ultrafast USDC ATA | `getMyUltrafastUsdcAta()` | `Text` |

**Key types:**
```
UltrafastResult = {
  jobId:Text, success:Bool, error:Text, durationMs:Int,
  stage:UltrafastStage,
  txHashes: { approval:Text, burn:Text, ethSwap:Text, mint:Text, outputSwap:Text }
}
```

```motoko
// Bridge ETH→SOL then monitor until complete
let job = await menese.quickUltrafastEthToSol(100_000_000_000_000_000);
switch (job) {
  case (#ok(jobId)) {
    // Poll for completion
    var done = false;
    while (not done) {
      switch (await menese.getUltrafastJobStatus(jobId)) {
        case (?j) {
          if (j.stage == #Complete) { done := true }
          else if (j.stage == #Failed) { done := true; Debug.print("Failed: " # Option.get(j.lastError, "")) };
        };
        case null {};
      };
    };
  };
  case (#err(e)) { /* handle */ };
};
```

### Tool 19: UTXO & BTC/LTC Fee Management (FREE)

Inspect UTXOs and estimate fees for Bitcoin, Litecoin, and CloakCoin.

| Operation | Function | Return |
|-----------|----------|--------|
| My BTC UTXOs | `getBitcoinUTXOs()` | `[UTXO]` |
| BTC UTXOs for address | `getBitcoinUTXOsFor(address)` | `[UTXO]` |
| My LTC UTXOs | `getLitecoinUTXOs()` | `[UTXO]` |
| LTC UTXOs for address | `getLitecoinUTXOsFor(address)` | `[UTXO]` |
| My CLOAK UTXOs | `getCloakUTXOs()` | `Result<[UTXO], Text>` |
| BTC dust limit | `getBitcoinDustLimit()` | `Nat64` — query |
| LTC dust limit | `getLitecoinDustLimit()` | `Nat64` — query |
| Estimate BTC fee | `estimateBitcoinFee(inputCount, outputCount, ?feeRate)` | `Nat64` (satoshis) |
| BTC fee percentiles | `getBitcoinFeePercentiles()` | `[Nat64]` — network fee distribution |
| BTC recommended fee | `getBitcoinRecommendedFeeRate()` | `Nat64` (sat/vbyte) |

```motoko
// Check UTXOs and estimate fee before sending
let utxos = await menese.getBitcoinUTXOs();
let feeRate = await menese.getBitcoinRecommendedFeeRate();
let fee = await menese.estimateBitcoinFee(utxos.size(), 2, ?feeRate);
Debug.print("Estimated fee: " # Nat64.toText(fee) # " sats at " # Nat64.toText(feeRate) # " sat/vB");
```

### Tool 20: SUI — CLMM DEX & Coin Management

Concentrated Liquidity Market Maker (CLMM) swaps on SUI via Cetus protocol. Currently supports pre-configured pool pairs.

#### CLMM Pool IDs

| Pool | Variant |
|------|---------|
| CRCLX/USDC | `#CRCLX_USDC` |
| CRCLX/wSOL | `#CRCLX_WSOL` |
| GOOGLX/USDC | `#GOOGLX_USDC` |
| QQQX/wSOL | `#QQQX_WSOL` |
| TSLAX/USDC | `#TSLAX_USDC` |
| TSLAX/wSOL | `#TSLAX_WSOL` |
| USD1/USDC | `#USD1_USDC` |

#### Functions

| Operation | Function | Cost |
|-----------|----------|------|
| Get pool config | `getClmmPool(poolId)` → `ClmmPoolConfig` | FREE (query) |
| List all CLMM pools | `listClmmPools()` → `[ClmmPoolConfig]` | FREE (query) |
| Get CLMM quote | `getClmmQuote(poolId, amount, slipBps, zeroForOne)` → `ClmmSwapQuote` | FREE |
| Swap (canister wallet) | `swapClmm(poolId, amount, slipBps, zeroForOne, ?inputAta, ?outputAta)` → `ClmmSwapResult` | Swap pricing |
| Swap (user wallet) | `swapClmmUser(poolId, amount, slipBps, zeroForOne, ?inputAta, ?outputAta)` → `ClmmSwapResult` | Swap pricing |
| Transfer SUI coin | `transferSuiCoin(coinObjectId, recipient, amount)` → `Result<SendResult, Text>` | Send pricing |
| SUI swap quote | `getSuiSwapQuote(network, from, to, amountIn, slipBps)` → `?SwapQuote` | FREE |
| SUI package config | `getSuiPackageConfig()` → `?PackageConfig` | FREE (query) |

**Types:**
```
ClmmPoolConfig = { id:Text, poolAddress:Text, symbol:Text, mintA:Text, mintB:Text, decimalsA:Nat, decimalsB:Nat }
ClmmSwapQuote = { inputAmount:Text, outputAmount:Text, otherAmountThreshold:Text, priceImpactPct:Text, rawJson:Text, success:Bool }
ClmmSwapResult = { txSignature:Text, outputAmount:Text, priceImpactPct:Text }
```

`zeroForOne` = `true` means swap token A → token B. `false` means B → A.

```motoko
// Swap TSLAX → USDC on SUI Cetus CLMM
let quote = await menese.getClmmQuote(#TSLAX_USDC, 1_000_000, 100, true);
if (quote.success) {
  let result = await menese.swapClmmUser(#TSLAX_USDC, 1_000_000, 100, true, null, null);
  Debug.print("Got " # result.outputAmount # " USDC, impact: " # result.priceImpactPct);
};
```

### Tool 21: Advanced Swap Variants & Routing

#### Raydium Variants (Solana)

| Variant | Function | Key Difference |
|---------|----------|----------------|
| API (user wallet) | `swapRaydiumApiUser(...)` | **Recommended** — uses user's wallet (already in Tool 4) |
| API (canister wallet) | `swapRaydiumApi(inputMint, outputMint, amount, slipBps, wrapSol, unwrapSol, ?inputAta, ?outputAta)` → `RaydiumApiSwapResult` | Same params, uses canister's wallet |
| Native (on-chain) | `swapRaydiumNative(amountIn, minAmountOut, srcAta, dstAta)` → `NativeSwapResult` | No API dependency, needs ATAs pre-created |

```
NativeSwapResult = { txSignature:Text, messageHex:Text, serializedTxBase64:Text, blockhash:Text }
```

#### EVM Quote Shortcuts (FREE)

| Function | Params | Return |
|----------|--------|--------|
| `getETHQuote(usdcAmount, rpc)` | How much ETH for X USDC | `Result<Nat, Text>` |
| `getUSDCQuote(ethAmount, rpc)` | How much USDC for X ETH | `Result<Nat, Text>` |
| `getTokenQuoteMultiHop(from, to, amountIn, rpc)` | Auto-routes through intermediary tokens | `Result<QuoteResult, Text>` |

#### Routing (FREE — query)

| Function | Params | Return |
|----------|--------|--------|
| `getRoutingSuggestions(fromSymbol, toSymbol)` | Get swap path suggestions | `Result<RoutingSuggestions, Text>` |

```motoko
// Quick ETH price check
let usdcFor1Eth = await menese.getUSDCQuote(1_000_000_000_000_000_000, ethRpc);

// Multi-hop: route through intermediary tokens
let quote = await menese.getTokenQuoteMultiHop("LINK", "AAVE", 100_000_000_000_000_000_000, ethRpc);
```

### Tool 22: Advanced EVM — Raw Transactions

Build and sign raw EVM transactions for advanced use cases (relayers, meta-transactions, custom protocols).

| Operation | Function | Return |
|-----------|----------|--------|
| Sign TX (no calldata) | `buildAndSignEvmTransaction(to, value, nonce, gasLimit, gasPrice, chainId)` | `{rawTxHex_v0, rawTxHex_v1, signature, txHash}` |
| Sign TX (with calldata) | `buildAndSignEvmTxWithData(to, value, data:[Nat8], nonce, gasLimit, gasPrice, chainId)` | `{rawTxHex_v0, rawTxHex_v1, signature, txHash}` |
| Get TX receipt | `getEvmTransactionReceipt(txHash, rpc)` | `?TransactionReceipt` |
| Check stETH allowance | `getStEthAllowance(owner, rpc)` | `Result<Nat, Text>` — FREE |

```
TransactionReceipt = { status:Nat, blockNumber:Text, gasUsed:Text }
```

**Note**: You provide nonce, gasLimit, and gasPrice manually. Use `preflightGasPrice` to get current gas price, and manage nonces carefully.

```motoko
// Build and sign a raw transaction
let gasPrice = switch (await menese.preflightGasPrice(ethRpc, null)) {
  case (#ok(gp)) gp; case (#err(_)) 20_000_000_000;  // fallback 20 gwei
};
let signed = await menese.buildAndSignEvmTransaction(
  "0xRecipient...", 1_000_000_000_000_000_000, // 1 ETH
  42, 21000, gasPrice, 1  // nonce=42, gasLimit=21000, chainId=1
);
// signed.rawTxHex_v0 — broadcast via your own RPC
// signed.txHash — predicted tx hash

// Check receipt
let receipt = await menese.getEvmTransactionReceipt(signed.txHash, ethRpc);
switch (receipt) {
  case (?r) { if (r.status == 1) { /* success */ } else { /* reverted */ } };
  case null { /* not yet mined */ };
};
```

### Tool 23: Gateway Billing & Packages

Purchase SDK access tiers and manage billing.

| Operation | Function | Cost |
|-----------|----------|------|
| View pricing | `getGatewayPricing()` → `{acceptedTokens, fees, packages}` | FREE (query) |
| Purchase package | `purchaseGatewayPackage(tier, tokenSymbol)` | Token cost |
| View deposits | `getMyGatewayDeposits()` → `[DepositRecord]` | FREE |
| Check usage | `getMyCanisterUsage(canisterId)` → `Result<UsageStats, Text>` | FREE |
| Withdraw fees | `withdrawGatewayFees()` → `Result<Text, Text>` | FREE |
| Unregister canister | `unregisterDeveloperCanister(canisterId)` → `Result<(), Text>` | FREE |

**Tiers:** `#Free`, `#Developer`, `#Pro`, `#Enterprise`

```
PackagePricing = { tier:Tier, priceMicroUsd:Nat, actionsIncluded:Nat, durationNanos:Int }
DepositRecord = { id:Nat, user:Principal, amount:Nat, currency:Text, ledgerCanisterId:Text, usdValueMicroUsd:Nat, timestamp:Int }
```

```motoko
// Check pricing first
let pricing = await menese.getGatewayPricing();
// pricing.packages = [{tier=#Developer, priceMicroUsd=35_000_000, actionsIncluded=1000, ...}, ...]
// pricing.acceptedTokens = [{symbol="ICP", ledgerCanisterId="ryjl3-...", decimals=8, ...}, ...]
// pricing.fees = [{opType=#Send, microUsd=50_000}, {opType=#Swap, microUsd=75_000}, ...]

// Purchase Developer tier with ICP
let result = await menese.purchaseGatewayPackage(#Developer, "ICP");

// Check your deposits
let deposits = await menese.getMyGatewayDeposits();
```

### Tool 24: Chain & Token Discovery (FREE)

All query functions — zero cost.

| Operation | Function | Return |
|-----------|----------|--------|
| Supported chains | `getSupportedChains()` | `[Text]` — e.g., ["Solana", "Ethereum", ...] |
| Supported EVM tokens | `getSupportedTokens()` | `[Text]` — token symbols |
| Stablecoins list | `getStablecoins()` | `[Text]` — stablecoin symbols |
| Base tokens | `getBaseTokens()` | `[Text]` — base trading tokens |
| EVM token info | `getTokenInfo(symbol)` | `?TokenInfo` — decimals, address, etc. |
| Token count | `getPoolCount()` | `Nat` — number of tracked pools |
| Pool stats | `getPoolStats()` | `{totalPools, highLiquidityPools, mediumLiquidityPools, lowLiquidityPools, tokensWithPools}` |
| All EVM pools | `getAllPools()` | `[PoolInfo]` — all Uniswap V2 pools |
| Pools for token | `listPoolsForToken(symbol)` | `[PoolInfo]` — all pools containing a token — query |
| Pool exists | `poolExists(tokenA, tokenB)` | `Bool` — query |
| Solana token programs | `getSolanaTokenProgramIds()` | `{legacySpl:Text, token2022:Text}` |
| Minswap tokens | `getMinswapTokens()` | `[MinswapTokenConfig]` — popular Cardano tokens |
| All Minswap tokens | `getAllMinswapTokens()` | `[MinswapTokenConfig]` — full list |

```
MinswapTokenConfig = { id:Text, name:Text, symbol:Text, decimals:Nat, category:Text, isVerified:Bool, logoUrl:?Text }
```

```motoko
// Discover what chains are supported
let chains = await menese.getSupportedChains();
// ["Solana", "Ethereum", "Bitcoin", "Arbitrum", ...]

// Get token info for a symbol
switch (await menese.getTokenInfo("USDC")) {
  case (?info) { Debug.print(info.name # ": " # Nat8.toText(info.decimals) # " decimals") };
  case null { /* not found */ };
};

// Get Cardano DEX tokens
let cardanoTokens = await menese.getMinswapTokens();
```

### Tool 25: Additional Send Variants & Chain Info

#### Send Variants

| Variant | Function | Key Difference |
|---------|----------|----------------|
| BTC with network | `sendBitcoinWithNetwork(to, sats, ?feeRate, network)` → `Result<SendResultBtcLtc, Text>` | Specify `#Mainnet` or `#Testnet` |
| SUI with network | `sendSuiWithNetwork(to, mist, network)` → `Result<SendResult, Text>` | Specify `#mainnet` or `#testnet` |
| TON testnet | `sendTonTestnet(to, nanotons, ?comment)` → `SendResultTon` (FLAT) | Testnet only |
| NEAR from user | `sendNearTransferFromUser(receiverId, yocto)` → `Result<Text, Text>` | User-wallet variant |

#### Additional Utilities

| Operation | Function | Cost |
|-----------|----------|------|
| Create ATA (simple) | `createMyAta(mintBase58, ataBase58)` → `Result<CreateAtaResult, Text>` | Send pricing |
| XRP AMM info | `xrpGetAmmInfo(asset1Currency, asset1Issuer, asset2Currency, asset2Issuer)` → `Result<Text, Text>` | FREE |

```motoko
// Send BTC on testnet
let r = await menese.sendBitcoinWithNetwork("tb1qtest...", 100_000, null, #Testnet);

// Get XRP AMM pool info
let ammInfo = await menese.xrpGetAmmInfo("USD", "rhub8VRN55s94qWKDv6jmDy1pUykJzF3wq", "XRP", "");
```

---

## Combining Tools — Practical Automation Examples

The real power is combining these tools. Below are complete patterns showing how tools work together.

### Example 1: DCA Bot (Timer + Balance + Swap)

Buy USDC with SOL every hour if balance exceeds threshold.

```motoko
// Tools used: getMySolanaBalance (FREE) + swapRaydiumApiUser ($0.075)
func dcaCycle() : async () {
  let balance = switch (await menese.getMySolanaBalance()) {
    case (#ok(v)) v; case (#err(_)) return;
  };
  if (balance < 500_000_000) return;  // < 0.5 SOL, skip

  let swapAmt = balance - 50_000_000;  // Keep 0.05 SOL for rent
  let _ = await menese.swapRaydiumApiUser(
    "So11111111111111111111111111111111111111112",  // SOL
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",  // USDC
    swapAmt, 150, true, false, null, null
  );
};

// Run every hour
let timerId = Timer.recurringTimer<system>(#seconds(3600), dcaCycle);
```

### Example 2: Stop-Loss via Strategy Engine

Set a stop-loss rule that auto-sells when price drops. No timer needed — MeneseSDK evaluates.

```motoko
// Tool used: addStrategyRule (FREE to create, execution costs per action)
let rule : Menese.Rule = {
  id = 0;
  ruleType = #StopLoss;
  status = #Active;
  chainType = #Solana;
  triggerPrice = 120_000_000;  // Trigger at this price level
  sizePct = 100;  // Sell 100% of position
  positionId = 0;
  createdAt = Time.now();
  dcaConfig = null; lpConfig = null; scheduledConfig = null;
  apyMigrationConfig = null; volatilityConfig = null;
  swapAmountLamports = ?1_000_000_000;  // 1 SOL
  swapAmountWei = null;
};
let ruleId = await menese.addStrategyRule(rule);
```

### Example 3: ICP DEX Yield Farming (ICP-native DeFi)

Discover best ICP pool, add liquidity, monitor, rebalance.

```motoko
// Step 1: Get AI recommendation (FREE)
let prefs : DexTypes.RebalancePreferences = {
  targetCategories = ["stablecoin", "defi"];
  riskTolerance = "moderate";
  minApy = ?8.0;
  maxImpermanentLoss = ?5.0;
  autoCompound = true;
};
let icpBal = switch (await menese.getICPBalance()) { case (#ok(v)) v; case _ 0 };
let recs = await menese.getICPRebalanceRecommendations(
  prefs, [("ryjl3-tyaaa-aaaaa-aaaba-cai", Nat64.toNat(icpBal))], null
);

// Step 2: Execute top recommendation
for (rec in recs.vals()) {
  if (rec.confidence > 0.8) {
    switch (rec.action) {
      case (#Swap) {
        let swapReq : DexTypes.SwapRequest = {
          tokenIn = rec.fromToken;
          tokenOut = rec.toToken;
          amountIn = rec.amount;
          minAmountOut = 0;
          slippagePct = 1.0;
          preferredDex = null;
        };
        ignore await menese.executeICPDexSwap(swapReq);
      };
      case (#AddLiquidity) {
        // Get pool info first
        let pools = await menese.getICPDexPools();
        // Find matching pool and add liquidity...
      };
      case _ {};
    };
  };
};

// Step 3: Monitor positions (on timer)
func monitorPositions() : async () {
  let positions = await menese.getICPLPPositions();
  for (pos in positions.vals()) {
    Debug.print("Pool: " # pos.poolId # " | Liquidity: " # Nat.toText(pos.liquidity));
    switch (pos.unclaimedFees) {
      case (?(fee0, fee1)) {
        Debug.print("  Unclaimed fees: " # Nat.toText(fee0) # " / " # Nat.toText(fee1));
      };
      case null {};
    };
  };
};
```

### Example 4: Multi-Chain Sweep (Balance + Send across chains)

Check all balances, sweep any above threshold to treasury.

```motoko
// Tools: getAllBalances (FREE) + sendSolTransaction + sendICP + sendEvmNativeTokenAutonomous
func sweepCycle() : async () {
  let bals = await menese.getAllBalances();

  // Sweep SOL if > 1 SOL
  switch (bals.solana) {
    case (#ok(lamports)) {
      if (lamports > 1_000_000_000) {
        ignore await menese.sendSolTransaction(solTreasury, lamports - 50_000_000);
      };
    };
    case (#err(_)) {};
  };

  // Sweep ICP if > 1 ICP
  switch (bals.icp) {
    case (#ok(e8s)) {
      if (e8s > 100_000_000) {
        ignore await menese.sendICP(Principal.fromText(icpTreasury), e8s - 100_000);
      };
    };
    case (#err(_)) {};
  };

  // Sweep ETH if > 0.1 ETH
  switch (await menese.getMyEvmBalance(ethRpc)) {
    case (#ok(wei)) {
      if (wei > 100_000_000_000_000_000) {
        ignore await menese.sendEvmNativeTokenAutonomous(
          ethTreasury, wei - 50_000_000_000_000_000, ethRpc, 1, null
        );
      };
    };
    case (#err(_)) {};
  };
};
```

### Example 5: DeFi Yield Rebalancer (Aave + Lido + LP)

Allocate idle ETH across DeFi protocols on a timer.

```motoko
// Tools: getMyEvmBalance + getAWethBalance + getStEthBalance (all FREE)
//        + aaveSupplyEth + stakeEthForStEth + wrapStEth ($0.10 each)

func rebalanceCycle() : async () {
  let evmAddr = (await menese.getMyEvmAddress()).evmAddress;  // Cached ideally
  let ethBal = switch (await menese.getMyEvmBalance(ethRpc)) { case (#ok(v)) v; case _ 0 };
  let aaveBal = switch (await menese.getAWethBalance(evmAddr, ethRpc)) { case (#ok(v)) v; case _ 0 };
  let lidoBal = switch (await menese.getStEthBalance(evmAddr, ethRpc)) { case (#ok(v)) v; case _ 0 };

  let reserve = 50_000_000_000_000_000;  // 0.05 ETH for gas
  if (ethBal <= reserve) return;
  let deployable = ethBal - reserve;

  // 50% Aave, 50% Lido
  let aaveTarget = deployable / 2;
  let lidoTarget = deployable / 2;

  if (aaveTarget > aaveBal and aaveTarget - aaveBal > 10_000_000_000_000_000) {
    ignore await menese.aaveSupplyEth(aaveTarget - aaveBal, ethRpc, null);
  };
  if (lidoTarget > lidoBal and lidoTarget - lidoBal > 10_000_000_000_000_000) {
    ignore await menese.stakeEthForStEth(lidoTarget - lidoBal, ethRpc, null);
    ignore await menese.wrapStEth(lidoTarget - lidoBal, ethRpc, null);
  };
};

// Run every 6 hours
let timerId = Timer.recurringTimer<system>(#seconds(21600), rebalanceCycle);
```

### Example 6: ICRC-2 Payment Splitter (Approve + TransferFrom)

Accept ICRC-2 token payments and split to multiple recipients.

```motoko
// Tools: approveICRC2 ($0.10) + getICRC2Allowance (FREE) + transferFromICRC2 ($0.10)

let ckUSDC = "xevnm-gaaaa-aaaar-qafnq-cai";

// User approves your canister to spend their ckUSDC
// (user calls this from their frontend)
let approval = await menese.approveICRC2(
  myCanisterPrincipal,     // spender = your canister
  1_000_000_000,           // 1000 ckUSDC allowance
  null,                    // no expiry
  ckUSDC
);

// Your canister checks allowance before splitting
let allowance = await menese.getICRC2Allowance(userPrincipal, myCanisterPrincipal, ckUSDC);
switch (allowance) {
  case (#ok(a)) {
    if (a.allowance >= 100_000_000) {
      // Split 100 ckUSDC: 70% to vendor, 30% to platform
      ignore await menese.transferFromICRC2(userPrincipal, vendorPrincipal, 70_000_000, ckUSDC);
      ignore await menese.transferFromICRC2(userPrincipal, platformPrincipal, 30_000_000, ckUSDC);
    };
  };
  case (#err(e)) { /* handle */ };
};
```

### Example 7: Cross-Chain Arbitrage (Bridge + Swap)

Move funds between Ethereum and Solana to capture price differences.

```motoko
// Tools: getTokenQuote (FREE) + getRaydiumQuote (FREE)
//        + quickUltrafastEthToSol ($0.10) + swapRaydiumApiUser ($0.075)

// 1. Check ETH USDC price on Uniswap
let ethQuote = await menese.getTokenQuote("USDC", "WETH", 1000_000_000, ethRpc);

// 2. Check SOL USDC price on Raydium
let solQuote = await menese.getRaydiumQuote(USDC_MINT, SOL_MINT, 1000_000_000, 100);

// 3. If profitable, bridge and swap
// Bridge ETH → SOL: quickUltrafastEthToSol
// Swap on Raydium: swapRaydiumApiUser
// Bridge back: quickSolToEth
```

---

## Access Control: Who Can Call What

**No registration needed (anyone with dfx identity):**
- All address functions (`getMy*Address`, `getAllAddresses`, `get*AddressFor`)
- All balance functions (`get*Balance`, `get*BalanceFor`, `getICRC1Balance`, `getICRC1BalanceFor`, `getICRC1Balances`, `getICRC1TokenInfo`, `getSupportedICPTokens`)
- All quote functions (`getICPDexQuote`, `getRaydiumQuote`, `getTokenQuote`, `getTokenQuoteMultiHop`, `getETHQuote`, `getUSDCQuote`, `getClmmQuote`, `getSuiSwapQuote`, `getMinswapQuote`)
- ICP DEX discovery (`getICPDexPools`, `getICPDexTokens`)
- LP position view (`getICPLPPositions`)
- Allowance checks (`getICRC2Allowance`, `getStEthAllowance`)
- AI rebalancer (`getICPRebalanceRecommendations`)
- Strategy CRUD (`addStrategyRule`, `getMyStrategyRules`, etc.)
- Gas estimation (`preflightGasPrice`, `preflightEvm*Gas`)
- Bridge estimation & monitoring (`estimateCctpFees`, `estimateUltrafastBridge`, `getCctpJobStatus`, `getSolToEthJobStatus`, `getUltrafastJobStatus`, etc.)
- UTXO & fee info (`getBitcoinUTXOs`, `estimateBitcoinFee`, `getBitcoinFeePercentiles`, `getBitcoinRecommendedFeeRate`, dust limits)
- Chain/token discovery (`getSupportedChains`, `getSupportedTokens`, `getStablecoins`, `getTokenInfo`, `getAllPools`, `getPoolStats`, `getMinswapTokens`, `getSolanaTokenProgramIds`)
- Gateway pricing (`getGatewayPricing`, `getMyGatewayDeposits`, `getMyCanisterUsage`)
- Routing (`getRoutingSuggestions`)
- SUI CLMM pool info (`getClmmPool`)
- Utility (`health`, `version`, `getBitcoinMaxSendAmount`, `getLitecoinMaxSendAmount`)

**Requires gateway credits (charged via `chargeAccess`):**
- All send operations (`sendICP`, `sendSolTransaction`, `sendEvmNativeTokenAutonomous`, `sendBitcoinWithNetwork`, `sendSuiWithNetwork`, etc.)
- All swap executions (`executeICPDexSwap`, `swapRaydiumApiUser`, `swapRaydiumApi`, `swapClmm`, `swapClmmUser`, `swapTokens`, etc.)
- ICP liquidity operations (`addICPLiquidity`, `removeICPLiquidity`)
- ICRC-2 approve/transferFrom (`approveICRC2`, `transferFromICRC2`)
- Bridge operations (`quickUltrafastEthToSol`, `quickSolToEth`, `quickUltrafastBridge`, `quickCctpBridgeFromChain`, etc.)
- DeFi operations (`aaveSupplyEth`, `stakeEthForStEth`, `addLiquidityETH`, etc.)
- Custom EVM writes/signs (`callEvmContractWrite`, `buildAndSignEvmTransaction`, `buildAndSignEvmTxWithData`)
- Token transfers (`transferSuiCoin`, `transferSplToken`)
- Gateway purchases (`purchaseGatewayPackage`)

---

## Unit Conversion Quick Reference

| Chain | Unit | Decimals | 1 Token = |
|-------|------|----------|-----------|
| Solana | lamports | 9 | 1,000,000,000 |
| ICP | e8s | 8 | 100,000,000 |
| Bitcoin | satoshis | 8 | 100,000,000 |
| Litecoin | litoshis | 8 | 100,000,000 |
| EVM | wei | 18 | 10^18 |
| XRP | drops (Text) | 6 | "1.0" |
| SUI | mist | 9 | 1,000,000,000 |
| TON | nanotons | 9 | 1,000,000,000 |
| Cardano | lovelace | 6 | 1,000,000 |
| Aptos | octas | 8 | 100,000,000 |
| NEAR | yoctoNEAR | 24 | 10^24 |
| Tron | sun | 6 | 1,000,000 |
| CloakCoin | units | 6 | 1,000,000 |
| THORChain | units | 8 | 100,000,000 |

---

## Common Pitfalls

1. **Wrong field names** — `evmAddress` not `address`, `suiAddress` not `address`, `nonBounceable` not `address`, `implicitAccountId` not `accountId`, `base58Address` not `base58`
2. **Flat vs variant returns** — XRP and TON send return FLAT records (check `.success`). Raydium swap also returns FLAT. Everything else uses `Result<T, Text>` with `#ok/#err`.
3. **Litecoin ≠ Bitcoin return type** — Litecoin = `SendResult` (`.txHash`), Bitcoin = `SendResultBtcLtc` (`.txid` + `.fee`)
4. **CloakCoin = 6 decimals**, never 8
5. **EVM needs your RPC** — configure endpoints before any EVM operation
6. **XRP amount is Text** — pass `"1.5"` not `1500000`
7. **Cache addresses** — deterministic per principal, fetch once and store
8. **Always keep a reserve** — leave min balance for rent/fees (0.05 SOL, 0.001 ICP, 0.05 ETH)
9. **Get quotes before swaps** — all quote functions are FREE
10. **Strategy rules are FREE to create** — you only pay when execution happens
11. **ICP DEX fields use token0/token1** — NOT tokenA/tokenB. The AddLiquidityRequest uses `token0`, `token1`, `token0Amount`, `token1Amount`.
12. **ckUSDC canister ID** is `xevnm-gaaaa-aaaar-qafnq-cai` — NOT `mxzaz-hqaaa-aaaar-qaada-cai` (that's ckBTC)

---

## Pricing Summary

| Operation | Client Mode | Agent Mode |
|-----------|------------|------------|
| Addresses/Balances/Quotes | FREE | FREE |
| Strategy rule CRUD | FREE | FREE |
| ICP DEX discovery/positions | FREE | FREE |
| AI Rebalancer | FREE | FREE |
| ICRC-2 allowance check | FREE | FREE |
| Send/Transfer | $0.05 | $0.10 |
| DEX Swap | $0.075 | $0.15 |
| Bridge | $0.10 | $0.20 |
| DeFi (Aave/Lido/LP/Custom) | — | $0.10 |

| Tier | Price | Actions/Month |
|------|-------|---------------|
| Free | $0 | 5 (lifetime) |
| Developer | $35/mo | 1,000 |
| Pro | $99/mo | 5,000 |
| Enterprise | $249/mo | Unlimited |

---

## Files in This Skill

| File | Purpose |
|------|---------|
| `SKILL.md` | This guide — all tools, examples, best practices |
| `WalletBot.mo` | ICP canister wrapping MeneseSDK (production use) |
| `scripts/wallet_commands.py` | Python CLI for dfx calls (prototyping/testing) |
| `references/api-surface.md` | Full API — every type definition and function signature |
| `references/automation.md` | Deep dive — timer bots, DeFi yield, strategy patterns, custom contracts |
