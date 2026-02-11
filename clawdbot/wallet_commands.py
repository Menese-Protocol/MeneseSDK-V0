#!/usr/bin/env python3
"""
wallet_commands.py — MeneseSDK wallet operations via dfx CLI

Usage:
    python3 wallet_commands.py addresses              # Get all 15 chain addresses
    python3 wallet_commands.py balance sol             # Check SOL balance
    python3 wallet_commands.py balance icp             # Check ICP balance
    python3 wallet_commands.py send sol 0.01 <addr>    # Send 0.01 SOL
    python3 wallet_commands.py send icp 1.5 <principal> # Send 1.5 ICP
    python3 wallet_commands.py send btc 0.001 <addr>   # Send BTC
    python3 wallet_commands.py account                  # Check billing status

Calls MeneseSDK canister (urs2a-ziaaa-aaaad-aembq-cai) via dfx.
All address/balance queries are FREE. Sends cost $0.05 each.

Tested: Feb 11, 2026
"""

import subprocess
import json
import sys

CANISTER_ID = "urs2a-ziaaa-aaaad-aembq-cai"
NETWORK = "ic"  # "ic" for mainnet, "local" for local replica


def dfx_call(method: str, args: str = "()", is_query: bool = False) -> str:
    """Call a canister method via dfx and return the raw output."""
    cmd = [
        "dfx", "canister", "call",
        "--network", NETWORK,
        CANISTER_ID,
        method, args,
    ]
    if is_query:
        cmd.insert(3, "--query")

    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
    if result.returncode != 0:
        return f"ERROR: {result.stderr.strip()}"
    return result.stdout.strip()


def get_addresses():
    """Get wallet addresses on all 15 chains."""
    print("Fetching addresses on all chains...\n")

    # getAllAddresses returns a record with all chains
    output = dfx_call("getAllAddresses")
    print("Your multi-chain wallet addresses:\n")
    print(output)
    return output


def get_balance(chain: str):
    """Check balance on a specific chain."""
    chain = chain.lower()

    method_map = {
        "sol": ("getMySolanaBalance", 1e9, "SOL"),
        "solana": ("getMySolanaBalance", 1e9, "SOL"),
        "icp": ("getICPBalance", 1e8, "ICP"),
        "xrp": ("getMyXrpBalance", 1e6, "XRP"),
        "sui": ("getMySuiBalance", 1e9, "SUI"),
        "eth": ("getMyEvmBalance", 1e18, "ETH"),
        "ethereum": ("getMyEvmBalance", 1e18, "ETH"),
    }

    if chain not in method_map:
        print(f"Unsupported chain: {chain}")
        print(f"Supported: {', '.join(method_map.keys())}")
        return

    method, divisor, symbol = method_map[chain]

    if chain in ("eth", "ethereum"):
        # EVM balance requires RPC endpoint param
        output = dfx_call(method, '("ethereum")')
    else:
        output = dfx_call(method)

    print(f"{symbol} balance: {output}")


def send_tokens(chain: str, amount: str, to_address: str):
    """Send tokens on a specific chain."""
    chain = chain.lower()

    if chain in ("sol", "solana"):
        lamports = int(float(amount) * 1e9)
        print(f"Sending {amount} SOL ({lamports} lamports) to {to_address}...")
        output = dfx_call("sendSolTransaction", f'("{to_address}", {lamports})')

    elif chain == "icp":
        e8s = int(float(amount) * 1e8)
        print(f"Sending {amount} ICP ({e8s} e8s) to {to_address}...")
        output = dfx_call("sendICP", f'(principal "{to_address}", {e8s})')

    elif chain in ("btc", "bitcoin"):
        satoshis = int(float(amount) * 1e8)
        print(f"Sending {amount} BTC ({satoshis} satoshis) to {to_address}...")
        output = dfx_call("sendBitcoin", f'("{to_address}", {satoshis})')

    elif chain in ("eth", "ethereum"):
        wei = int(float(amount) * 1e18)
        print(f"Sending {amount} ETH ({wei} wei) to {to_address}...")
        output = dfx_call(
            "sendEvmNativeTokenAutonomous",
            f'("ethereum", "{to_address}", "{wei}", null)'
        )

    elif chain in ("arb", "arbitrum"):
        wei = int(float(amount) * 1e18)
        print(f"Sending {amount} ETH on Arbitrum to {to_address}...")
        output = dfx_call(
            "sendEvmNativeTokenAutonomous",
            f'("arbitrum", "{to_address}", "{wei}", null)'
        )

    elif chain == "xrp":
        drops = int(float(amount) * 1e6)
        print(f"Sending {amount} XRP ({drops} drops) to {to_address}...")
        output = dfx_call(
            "sendXrpAutonomous",
            f'("{to_address}", "{drops}", null)'
        )

    elif chain == "sui":
        mist = int(float(amount) * 1e9)
        print(f"Sending {amount} SUI ({mist} mist) to {to_address}...")
        output = dfx_call("sendSui", f'("{to_address}", {mist})')

    elif chain == "ton":
        nanotons = int(float(amount) * 1e9)
        print(f"Sending {amount} TON ({nanotons} nanotons) to {to_address}...")
        output = dfx_call("sendTonSimple", f'("{to_address}", {nanotons})')

    else:
        print(f"Unsupported chain for send: {chain}")
        print("Supported: sol, icp, btc, eth, arb, xrp, sui, ton")
        return

    print(f"\nResult: {output}")


def get_account():
    """Check billing account status."""
    output = dfx_call("getMyGatewayAccount")
    print("Billing account status:\n")
    print(output)


def print_usage():
    print("""
MeneseSDK Wallet Commands
========================

  addresses                    Get addresses on all 15 chains (FREE)
  balance <chain>              Check balance (FREE)
  send <chain> <amount> <to>   Send tokens ($0.05)
  account                      Check billing status (FREE)

Chains: sol, icp, btc, eth, arb, xrp, sui, ton

Examples:
  python3 wallet_commands.py addresses
  python3 wallet_commands.py balance sol
  python3 wallet_commands.py send sol 0.01 5xK2...abc
  python3 wallet_commands.py send icp 1.0 aaaaa-aa
""")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1].lower()

    if command == "addresses":
        get_addresses()
    elif command == "balance":
        if len(sys.argv) < 3:
            print("Usage: wallet_commands.py balance <chain>")
            sys.exit(1)
        get_balance(sys.argv[2])
    elif command == "send":
        if len(sys.argv) < 5:
            print("Usage: wallet_commands.py send <chain> <amount> <address>")
            sys.exit(1)
        send_tokens(sys.argv[2], sys.argv[3], sys.argv[4])
    elif command == "account":
        get_account()
    else:
        print(f"Unknown command: {command}")
        print_usage()
        sys.exit(1)
