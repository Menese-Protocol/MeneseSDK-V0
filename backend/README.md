# MeneseSDK Backend (Motoko) Integration Examples

Canister-to-canister integration examples for calling MeneseSDK from your own ICP canister.

## How It Works

Your canister calls MeneseSDK's public functions via inter-canister calls.
Since the `caller` is your **canister principal** (not a human), you must first
register your canister as a developer canister — then all operations bill YOUR
developer account automatically.

## Setup

### 1. Register your canister (one-time)

From `dfx` or your frontend, call with your human identity:

```bash
dfx canister call urs2a-ziaaa-aaaad-aembq-cai registerDeveloperCanister \
  '(principal "YOUR-CANISTER-ID", "MyApp")'
```

This returns your developer key (`msk_xxxxx...`). All calls from your canister
will now bill your developer account.

### 2. Add MeneseSDK to your canister

Copy the `MeneseInterface.mo` file into your project. It defines the remote
actor type with only the functions you need.

### 3. Call MeneseSDK from your code

```motoko
import Menese "MeneseInterface";

let menese = Menese.mainnet();
let addr = await menese.getMySolanaAddress();
```

## Examples

| File | Use Case |
|------|----------|
| `MeneseInterface.mo` | Shared actor type definition (import this) |
| `01-BasicIntegration.mo` | Get addresses and balances, send tokens |
| `02-AutomationBot.mo` | Automated trading: timer-based swap + sweep |
| `03-MerchantPayments.mo` | Accept payments, verify, sweep to treasury |

## Canister ID

**Mainnet:** `urs2a-ziaaa-aaaad-aembq-cai`

## Billing

When your canister calls MeneseSDK, the caller is your canister's principal.
If registered via `registerDeveloperCanister`, operations bill your developer
account. Otherwise, the canister itself needs credits deposited.

| Operation | Cost |
|-----------|------|
| Sign/Send | $0.05 |
| Swap      | $0.075 |
| Bridge    | $0.10 |
| Query     | FREE |
