/**
 * MeneseSDK — Custom Smart Contract Calls
 *
 * Call ANY EVM smart contract directly from your MeneseSDK wallet:
 *
 *   callEvmContractWrite(contract, functionSelector, argsHexes, rpcEndpoint, chainId, value, quoteId?)
 *     → Execute a state-changing function (costs gas + $0.10)
 *
 *   callEvmContractRead(contract, functionSelector, argsHexes, rpcEndpoint)
 *     → Read contract state (FREE — no gas, no billing)
 *
 * Function selectors use Solidity notation: "transfer(address,uint256)"
 * Arguments are hex-encoded, left-padded to 32 bytes.
 *
 * This lets you interact with ANY deployed contract:
 *   - ERC20 tokens (transfer, approve, balanceOf)
 *   - NFT contracts (mint, transfer)
 *   - Custom DeFi protocols
 *   - DAO governance (vote, propose)
 *   - Any contract on Ethereum, Arbitrum, Base, Polygon, BSC, Optimism
 *
 * Cost: Write = $0.10 (sign operation), Read = FREE
 *
 * Tested: Feb 12, 2026 on mainnet canister urs2a-ziaaa-aaaad-aembq-cai
 */

import { createMeneseActor } from "./menese-config";

const ETH_RPC = "https://eth.llamarpc.com";
const ARB_RPC = "https://arb1.arbitrum.io/rpc";

// ══════════════════════════════════════════════════════════════
// WRITE — Execute transactions on any contract
// ══════════════════════════════════════════════════════════════

// callEvmContractWrite params:
//   contract: "0x..." (contract address, 20 bytes)
//   functionSelector: "functionName(type1,type2)" (Solidity signature)
//   argsHexes: ["0x..."] (each arg as 32-byte hex, NO 0x prefix needed — the canister handles encoding)
//   rpcEndpoint: your RPC URL
//   chainId: 1 (ETH), 42161 (ARB), 8453 (BASE), etc.
//   value: 0 for non-payable, or ETH amount in wei for payable functions
//   quoteId: optional gas quote ID
//
// Returns: { ok: { expectedTxHash, nonce, senderAddress, note }, err: text }

// ── ERC20 Transfer ──────────────────────────────────────────
async function transferERC20(
  tokenContract: string,
  recipientAddress: string,
  amount: bigint,
  rpcEndpoint: string,
  chainId: number,
) {
  const menese = await createMeneseActor();

  // Pad address to 32 bytes (remove 0x, left-pad with zeros)
  const addrHex = recipientAddress.replace("0x", "").padStart(64, "0");
  // Pad amount to 32 bytes
  const amountHex = amount.toString(16).padStart(64, "0");

  console.log(`Transferring ERC20 on chain ${chainId}...`);
  const result = await menese.callEvmContractWrite(
    tokenContract,
    "transfer(address,uint256)",
    [addrHex, amountHex],
    rpcEndpoint,
    BigInt(chainId),
    BigInt(0),     // value: 0 (non-payable function)
    [],            // quoteId: optional
  ) as any;

  if ("ok" in result) {
    console.log("TX:", result.ok.expectedTxHash);
    console.log("From:", result.ok.senderAddress);
  } else {
    console.error("Transfer failed:", result.err);
  }
  return result;
}

// ── ERC20 Approve ───────────────────────────────────────────
async function approveERC20(
  tokenContract: string,
  spenderAddress: string,
  amount: bigint,
  rpcEndpoint: string,
  chainId: number,
) {
  const menese = await createMeneseActor();

  const spenderHex = spenderAddress.replace("0x", "").padStart(64, "0");
  const amountHex = amount.toString(16).padStart(64, "0");

  console.log(`Approving ERC20 spend...`);
  const result = await menese.callEvmContractWrite(
    tokenContract,
    "approve(address,uint256)",
    [spenderHex, amountHex],
    rpcEndpoint,
    BigInt(chainId),
    BigInt(0),
    [],
  ) as any;

  if ("ok" in result) {
    console.log("Approval TX:", result.ok.expectedTxHash);
  } else {
    console.error("Approval failed:", result.err);
  }
  return result;
}

// ── Call any payable function ────────────────────────────────
// For functions that require sending ETH along with the call
async function callPayableFunction(
  contract: string,
  functionSig: string,
  args: string[],
  ethValue: bigint,
  rpcEndpoint: string,
  chainId: number,
) {
  const menese = await createMeneseActor();

  console.log(`Calling ${functionSig} with ${ethValue} wei...`);
  const result = await menese.callEvmContractWrite(
    contract,
    functionSig,
    args,
    rpcEndpoint,
    BigInt(chainId),
    ethValue,
    [],
  ) as any;

  if ("ok" in result) {
    console.log("TX:", result.ok.expectedTxHash);
  } else {
    console.error("Call failed:", result.err);
  }
  return result;
}

// ══════════════════════════════════════════════════════════════
// READ — Query any contract state (FREE)
// ══════════════════════════════════════════════════════════════

// callEvmContractRead params:
//   contract: "0x..." (contract address)
//   functionSelector: "functionName(type1,type2)" (Solidity signature)
//   argsHexes: ["0x..."] (each arg as 32-byte hex)
//   rpcEndpoint: your RPC URL
//
// Returns: { ok: text (hex-encoded return data), err: text }
// You must decode the hex result yourself.

// ── Read ERC20 Balance ──────────────────────────────────────
async function getERC20Balance(
  tokenContract: string,
  walletAddress: string,
  rpcEndpoint: string,
): Promise<bigint | null> {
  const menese = await createMeneseActor();

  const addrHex = walletAddress.replace("0x", "").padStart(64, "0");

  const result = await menese.callEvmContractRead(
    tokenContract,
    "balanceOf(address)",
    [addrHex],
    rpcEndpoint,
  ) as any;

  if ("ok" in result) {
    // Result is hex-encoded uint256
    const hex = result.ok.replace("0x", "");
    const balance = BigInt("0x" + hex);
    console.log(`Balance: ${balance}`);
    return balance;
  } else {
    console.error("Read failed:", result.err);
    return null;
  }
}

// ── Read ERC20 Allowance ────────────────────────────────────
async function getERC20Allowance(
  tokenContract: string,
  ownerAddress: string,
  spenderAddress: string,
  rpcEndpoint: string,
): Promise<bigint | null> {
  const menese = await createMeneseActor();

  const ownerHex = ownerAddress.replace("0x", "").padStart(64, "0");
  const spenderHex = spenderAddress.replace("0x", "").padStart(64, "0");

  const result = await menese.callEvmContractRead(
    tokenContract,
    "allowance(address,address)",
    [ownerHex, spenderHex],
    rpcEndpoint,
  ) as any;

  if ("ok" in result) {
    const hex = result.ok.replace("0x", "");
    return BigInt("0x" + hex);
  }
  return null;
}

// ── Read any contract function ──────────────────────────────
async function readContract(
  contract: string,
  functionSig: string,
  args: string[],
  rpcEndpoint: string,
): Promise<string | null> {
  const menese = await createMeneseActor();

  const result = await menese.callEvmContractRead(
    contract,
    functionSig,
    args,
    rpcEndpoint,
  ) as any;

  if ("ok" in result) {
    return result.ok;
  }
  console.error("Read failed:", result.err);
  return null;
}

// ══════════════════════════════════════════════════════════════
// EXAMPLE USAGE
// ══════════════════════════════════════════════════════════════

const USDC_ETH = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT_ETH = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

async function main() {
  // Read USDC balance for any address (FREE)
  await getERC20Balance(USDC_ETH, "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", ETH_RPC);

  // Read USDT allowance (FREE)
  await getERC20Allowance(
    USDT_ETH,
    "0xYourAddress",
    "0xUniswapRouterAddress",
    ETH_RPC,
  );

  // Transfer 10 USDC on Ethereum ($0.10)
  await transferERC20(USDC_ETH, "0xRecipient", BigInt(10_000_000), ETH_RPC, 1);

  // Transfer 10 USDC on Arbitrum ($0.10, much cheaper gas)
  await transferERC20(USDC_ETH, "0xRecipient", BigInt(10_000_000), ARB_RPC, 42161);

  // Read totalSupply of any token (FREE)
  const totalSupply = await readContract(
    USDC_ETH,
    "totalSupply()",
    [],
    ETH_RPC,
  );
  if (totalSupply) {
    console.log("USDC total supply:", BigInt("0x" + totalSupply.replace("0x", "")));
  }

  // Call a custom payable function (e.g., mint NFT for 0.08 ETH)
  // await callPayableFunction(
  //   "0xNFTContractAddress",
  //   "mint(uint256)",
  //   ["0000000000000000000000000000000000000000000000000000000000000001"], // tokenId=1
  //   BigInt("80000000000000000"), // 0.08 ETH
  //   ETH_RPC,
  //   1,
  // );
}

main().catch(console.error);
