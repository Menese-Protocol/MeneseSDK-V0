# MeneseSDK — Developer Billing Integration Guide

## Overview

When you build an app using MeneseSDK, your users can sign cross-chain transactions (Solana, Ethereum, Cardano, SUI, XRP, etc.) through our backend. You pay one subscription — your users pay nothing.

This guide shows you how to set up **canister-side user registration**, the secure way to bill all your users under your developer subscription.

## How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                     YOUR APPLICATION                            │
│                                                                 │
│  ┌──────────────┐         ┌──────────────────┐                  │
│  │  Your        │  login  │  Your Backend    │                  │
│  │  Frontend    │────────>│  Canister        │                  │
│  │  (browser)   │         │  (Motoko/Rust)   │                  │
│  └──────┬───────┘         └────────┬─────────┘                  │
│         │                          │                            │
│         │                          │ registerUserForBilling()   │
│         │                          │ (one-time, on first login) │
│         │                          ▼                            │
│         │                 ┌──────────────────┐                  │
│         │  signing calls  │  MeneseSDK       │                  │
│         │────────────────>│  Backend         │                  │
│         │  (direct, user  │  (urs2a-...)     │                  │
│         │   is the caller)│                  │                  │
│         │                 │  Bills YOUR      │                  │
│         │                 │  subscription    │                  │
│         │<────────────────│  Returns signed  │                  │
│         │  signed tx      │  transaction     │                  │
│         │                 └──────────────────┘                  │
│         │                                                       │
│         ▼                                                       │
│  User broadcasts tx                                             │
│  from their browser                                             │
│  (Solscan, Etherscan...)                                        │
└─────────────────────────────────────────────────────────────────┘
```

**Key point:** The user calls MeneseSDK signing endpoints directly from the browser. Their principal is the caller, so their chain-specific wallets (Solana, EVM, etc.) are derived correctly. But billing goes to YOUR subscription because your backend pre-registered them.

## Step-by-Step Setup

### Step 1: Buy a Subscription

Purchase a subscription tier on the MeneseSDK canister (`urs2a-ziaaa-aaaad-aembq-cai`). You can do this from dfx or from our dashboard.

| Tier | Price/Month | Actions | Best For |
|------|-------------|---------|----------|
| Basic | $20 | 100 | Testing, small apps |
| Developer | $45.50 | 1,000 | Production apps |
| Pro | $128.70 | 5,000 | High-volume apps |
| Enterprise | $323.70 | Unlimited | Scale without limits |

**Actions = actual transaction signings** (e.g., `exp_signSolTransfer`, `exp_signEvmSend`). User registration is free — it does not consume actions.

```bash
# Example: purchase Developer tier with ICP
# First, approve the SDK canister to pull ICP from your account:
dfx canister call ryjl3-tyaaa-aaaaa-aaaba-cai icrc2_approve '(record {
  spender = record { owner = principal "urs2a-ziaaa-aaaad-aembq-cai" };
  amount = 650_000;
})'

# Then purchase:
dfx canister call urs2a-ziaaa-aaaad-aembq-cai purchasePackage '(variant { Developer }, "ICP", 6_500_000 : nat)'
```

### Step 2: Register Your Backend Canister

Your backend canister needs to be registered as a developer canister. Call this once from **your own identity** (not the canister):

```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-BACKEND-CANISTER-ID", "My App Name")'
```

This returns your developer key (for legacy use — you won't need it with this approach).

### Step 3: Add User Registration to Your Backend

When a user logs into your app, your backend canister calls `registerUserForBilling` on the MeneseSDK backend. This maps the user's principal to your developer subscription.

#### Motoko Example

```motoko
import Result "mo:base/Result";
import Principal "mo:base/Principal";

actor MyAppBackend {

  // Reference to MeneseSDK backend
  let menese : actor {
    registerUserForBilling : (Principal) -> async Result.Result<(), Text>;
    unregisterUserFromBilling : (Principal) -> async Result.Result<(), Text>;
    getRegisteredUsers : () -> async Result.Result<[Principal], Text>;
  } = actor "urs2a-ziaaa-aaaad-aembq-cai";

  // Call this when a user logs in for the first time
  // or on every login — it's idempotent (safe to call multiple times)
  public shared ({ caller }) func onUserLogin() : async Result.Result<(), Text> {
    // `caller` is the user's Internet Identity principal
    await menese.registerUserForBilling(caller);
  };

  // Optional: remove a user (e.g., banned, account deleted)
  public shared ({ caller }) func removeUser(user : Principal) : async Result.Result<(), Text> {
    // Add your own admin check here
    await menese.unregisterUserFromBilling(user);
  };

  // Optional: see all your registered users
  public shared func listBilledUsers() : async Result.Result<[Principal], Text> {
    await menese.getRegisteredUsers();
  };
};
```

#### Rust Example

```rust
use candid::Principal;
use ic_cdk::api::call::call;

const MENESE_SDK: &str = "urs2a-ziaaa-aaaad-aembq-cai";

#[ic_cdk::update]
async fn on_user_login() -> Result<(), String> {
    let user = ic_cdk::caller();
    let sdk = Principal::from_text(MENESE_SDK).unwrap();

    let (result,): (Result<(), String>,) = call(sdk, "registerUserForBilling", (user,))
        .await
        .map_err(|e| format!("Call failed: {:?}", e))?;

    result
}
```

### Step 4: Frontend — Call SDK Signing Endpoints Directly

Your frontend calls MeneseSDK endpoints directly. The user's principal is the caller (so their wallets are derived correctly), and billing automatically goes to your subscription.

```typescript
import { Actor, HttpAgent } from "@dfinity/agent";
import { idlFactory } from "./menese_sdk.did"; // Generate from candid

const MENESE_SDK_CANISTER = "urs2a-ziaaa-aaaad-aembq-cai";

// Create agent with user's Internet Identity
const agent = new HttpAgent({ identity: userIdentity });
const sdk = Actor.createActor(idlFactory, {
  agent,
  canisterId: MENESE_SDK_CANISTER,
});

// ---- On first login, register via YOUR backend ----
const yourBackend = /* your backend actor */;
await yourBackend.onUserLogin(); // This registers the user for billing

// ---- Sign transactions (billed to developer, not user) ----

// Solana transfer
const solResult = await sdk.exp_signSolTransfer(
  recipientAddress,
  amountLamports
);
// Returns: { ok: { signedTx: "base64...", fromAddress: "user's SOL address" } }

// User broadcasts from browser
const tx = solResult.ok.signedTx;
const sig = await solanaConnection.sendRawTransaction(
  Buffer.from(tx, "base64")
);

// EVM transfer
const evmResult = await sdk.exp_signEvmSend(
  "ethereum",    // chain
  toAddress,     // recipient
  amountWei,     // amount in wei
  []             // optional data
);

// SUI transfer
const suiResult = await sdk.exp_signSuiTransfer(
  recipientAddress,
  amountMist
);
```

**No API keys in your frontend code. No `registerSession()` call. Just sign and broadcast.**

## How Billing Resolution Works

When a user calls a signing endpoint, MeneseSDK resolves billing in this order:

```
1. Is caller whitelisted?          → Free (admin/internal use)
2. Is caller a registered canister? → Bill that canister's developer
3. Is caller in userToDev mapping?  → Bill the mapped developer  ← THIS IS YOU
4. Default                         → Bill the caller directly
```

Your users hit path #3 because your backend registered them via `registerUserForBilling`.

## FAQ

### Does each user need their own subscription?
**No.** You buy ONE subscription. All your users share your action budget.

### Does user registration consume actions?
**No.** `registerUserForBilling` is free. Only actual signing operations (sending SOL, swapping tokens, etc.) consume actions.

### Can I call `registerUserForBilling` on every login?
**Yes.** It's idempotent — calling it again for the same user just updates the mapping (no-op if already mapped to you).

### What happens when my subscription expires or runs out of actions?
Your users' signing calls will fail with a "Subscription required" error. Top up or upgrade your tier to restore service.

### Can a user be registered under two developers?
**No.** The last `registerUserForBilling` call wins. If Developer A registers a user, then Developer B registers the same user, the user is billed to Developer B.

### How do I monitor my usage?
```bash
# Check your subscription status
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyDeveloperAccount

# Check per-canister usage
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getMyCanisterUsage '(principal "YOUR-CANISTER-ID")'

# List all users billed to you
dfx canister call urs2a-ziaaa-aaaad-aembq-cai getRegisteredUsers
```

### What about Internet Identity giving different principals per app?
That's fine. Your backend canister sees the user's principal **for your app**. That same principal is what the user uses when calling MeneseSDK from your frontend. The mapping is consistent within your app.

### Is registerSession (the old key-based method) still available?
Yes, for backward compatibility. But we recommend `registerUserForBilling` because:
- No API keys exposed in frontend JavaScript
- No risk of key theft
- Your backend canister is cryptographically authenticated by the IC
- Simpler integration — no key management

### What signing endpoints are available?

| Endpoint | Chain | What It Does |
|----------|-------|--------------|
| `exp_signSolTransfer` | Solana | Sign SOL transfer |
| `exp_signSplTransfer` | Solana | Sign SPL token transfer |
| `exp_signRaydiumSwap` | Solana | Sign Raydium DEX swap |
| `exp_signEvmSend` | EVM (ETH/BSC/etc.) | Sign native token transfer |
| `exp_signEvmSwap` | EVM | Sign DEX swap |
| `exp_signSuiTransfer` | SUI | Sign SUI transfer |
| `exp_signXrpPayment` | XRP | Sign XRP payment |
| `exp_signCardanoSend` | Cardano | Sign ADA transfer |
| `exp_signBtcTransfer` | Bitcoin | Sign BTC transfer |
| `exp_signTonTransfer` | TON | Sign TON transfer |
| `exp_signNearTransfer` | NEAR | Sign NEAR transfer |
| `exp_signAptosTransfer` | Aptos | Sign APT transfer |
| `exp_signTronTransfer` | Tron | Sign TRX transfer |
| `exp_signLtcTransfer` | Litecoin | Sign LTC transfer |

All endpoints return a signed transaction that the user broadcasts from their browser.

## Security Model

| Concern | How It's Handled |
|---------|-----------------|
| Key theft | No keys — canister identity is the auth |
| User impersonation | Impossible — IC verifies caller principals cryptographically |
| Billing fraud | Only your registered canister can add users to your bill |
| Unregistered usage | Unregistered users are billed to themselves (they need their own subscription) |
| Rogue user spending | Monitor via `getRegisteredUsers` + `getMyDeveloperAccount`. Upgrade tier if needed |

## Quick Start Checklist

- [ ] Buy a subscription (Developer tier recommended for starting out)
- [ ] Register your backend canister with `registerDeveloperCanister`
- [ ] Add `registerUserForBilling(caller)` to your backend's login flow
- [ ] Call MeneseSDK signing endpoints directly from your frontend
- [ ] User broadcasts signed transactions from their browser
- [ ] Monitor usage with `getMyDeveloperAccount`
