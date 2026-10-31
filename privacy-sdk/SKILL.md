---
name: menese-privacy-sdk
description: Add private ICP balances and private payments to a web app with the Menese Privacy SDK (the live shielded ledger on the Internet Computer). Covers setup from an empty folder, serving and checking the proving keys, sign-in, how the app talks to the shielded ledger, the shielded directory and the ICP ledger, making ICP private, private sends, claimable payments, moving out, fees, progress and error handling. Use when someone asks to add privacy, private payments, private balances, private checkout, shielded ICP or the Menese Privacy SDK to an app, even if they are not a developer.
---

# Menese Privacy SDK: guide for AI coding agents

Everything in this file comes from the code in this folder (`privacy-sdk/src`) and from the live
canisters. When this file and the code disagree, the code wins: read `src/engine/core.ts` first.

## 1. What it does, in plain words

Your app's users get a **private ICP balance** next to their normal one. They can:

| Action | Method | What happens |
|---|---|---|
| Make private | `engine.makePrivate(amount, onProgress)` | ICP moves from their normal balance into their private balance |
| Send privately | `engine.sendPrivately(to, amount, onProgress)` | pays another principal; nobody can follow the payment or look up either balance |
| Claimable payment | same `sendPrivately`, to someone who has never used private balance | the recipient finds it when they sign in and claims it; the sender can take it back until then |
| Move out | `engine.moveOut(amount, onProgress)` | ICP goes back to their normal balance |

Proofs are made in the user's browser. The user's keys and notes never leave the browser, and your
app's server never sees them. You do not run any backend for this: the SDK talks to canisters
that are already live.

**Who this is for.** If the person asking is not a developer, do the whole setup for them
(section 4 "Starting from nothing"), explain each step in one plain sentence, and ask them only for
things you cannot do yourself: signing in with Internet Identity, and putting ICP in an account to test.

## 2. The live network

| Canister | ID | What the SDK uses it for |
|---|---|---|
| shielded ledger | `3pwrb-oiaaa-aaaao-bbqba-cai` | holds the pool, checks every proof, keeps the public log of notes |
| shielded directory | `3gv25-yaaaa-aaaao-bbqaq-cai` | derives each user's private key (vetKeys), keeps each user's private address |
| ICP ledger | `ryjl3-tyaaa-aaaaa-aaaba-cai` | the normal ICP balance; "make private" approves the pool to take ICP from it |

All three are set by `mainnet()` in `src/mainnet.ts`, with host `https://icp-api.io` and vetKD key
`key_1`. Do not change these values.

Fees on the live ledger (read on 31 Oct 2026; the engine reads them again in `open()`):

| Action | Fee |
|---|---|
| make private | free, plus two ICP network fees (2 × 0.0001 ICP) from the normal balance |
| private send | 0.1 ICP from the private balance |
| claimable payment | 0.3 ICP from the private balance, all paid by the sender (two transfers plus the recipient's claim) |
| move out | 0.3% of the amount (rounded up) + 0.0001 ICP |

Never hard-code fees in the screen. Show `engine.quote(...)` before every send and move out.

## 3. How the app connects to each canister

Your code calls the engine. The engine makes these calls (all in `src/zk/ic.js`, `src/zk/wallet.js`,
`src/zk/claims.js`, `src/zk/auth.js`):

| Call | Canister | Signed by | Why |
|---|---|---|---|
| `derive_shielded_key` | directory | the user | once per `open()`: gets the user's vetKey, encrypted to a one-use browser key |
| `vetkey_public_key` | directory | the user | the client derives this key itself from `key_1` and refuses a mismatch |
| `register` | directory | the user | once per account: files the private address (`enable()`, or the first action does it) |
| `lookup` | directory | nobody (anonymous) | "does this principal have a private balance?" |
| `get_birthday` / `set_birthday` | directory | the user | lets a new device start scanning from the right place |
| `verifying_key_anchor` | shielded ledger | anonymous | the certified verifying keys the proving keys must match |
| `required_transfer_fee`, `protocol_fee_status` | shielded ledger | anonymous | live fees |
| log reads (notes, claim envelopes) | shielded ledger | anonymous | find the user's notes and payments without saying whose they are |
| shield (make private) | shielded ledger | the user | public ICP moves in; the ICP ledger shows this anyway |
| private transfer | shielded ledger | a brand-new identity each time | the proof authorises it, so the user's principal never appears |
| unshield (move out) | shielded ledger | the user | public ICP moves out to the user |
| `icrc2_approve`, `icrc1_balance_of` | ICP ledger | the user / anonymous | allowance for make private; normal balance |

Two small helpers work without opening the engine:

```ts
import { isPrivateEnabled } from "./privacy/enabled";          // anonymous directory lookup
import { publicBalanceOf } from "./privacy/engine/core";        // anonymous ICP balance
import { mainnet } from "./privacy/mainnet";

const net = mainnet("/zk-keys");
const hasPrivate = await isPrivateEnabled(net, principal.toText());
const publicE8s = await publicBalanceOf(net, principal);
```

The directory allows **20 key derivations per principal per day** (and 5,000 per hour in total).
Each `open()` uses one. Open the engine once per signed-in session and keep it (section 5).

## 4. Setup

### Requirements

- A browser app with a bundler that supports module workers written as
  `new Worker(new URL("...", import.meta.url), { type: "module" })` and wasm loaded the same way.
  Vite does both with no configuration. Use Vite unless the project already has something else.
- The engine runs in the browser only (Web Workers, IndexedDB, localStorage, WebCrypto). Never
  import it in server code. In Next.js or another server-rendering framework, load it only on the
  client (for example `dynamic(() => import(...), { ssr: false })`).
- Node 18 or newer for the key tool.

### Starting from nothing

If there is no app yet:

```bash
npm create vite@latest my-private-app -- --template react-ts
cd my-private-app
npm install
```

### Step 1: copy the SDK source

```bash
git clone https://github.com/Menese-Protocol/MeneseSDK-V0.git
mkdir -p src/privacy
cp -r MeneseSDK-V0/privacy-sdk/src/* src/privacy/
```

Keep the folder layout exactly as it is (`engine/`, `zk/`, `types.ts`, `mainnet.ts`, `enabled.ts`):
the files import each other with relative paths, and the wasm files are found next to their glue code.
Do not edit, rebuild or replace anything under `zk/prover-pkg/` or `zk/claim-scan-pkg/`.

### Step 2: install the dependencies

```bash
npm install @dfinity/agent@^3.4.3 @dfinity/principal@^3.4.3 @dfinity/identity@^3.4.3 \
    @dfinity/auth-client@^3.4.3 @dfinity/candid@^3.4.3 @dfinity/vetkeys@^0.4.0 tweetnacl@^1.0.3
```

### Step 2b: TypeScript settings

The SDK mixes TypeScript (`engine/`) with plain JavaScript (`zk/`). A new Vite TypeScript project
refuses both by default, so `npm run build` fails until you change two settings in
`tsconfig.app.json` (inside `compilerOptions`):

```json
"erasableSyntaxOnly": false,
"noImplicitAny": false
```

Then delete `src/privacy/engine/plan.test.ts` (it needs the `vitest` test runner), or install
`vitest` if the project runs tests.

### Step 3: serve the proving keys

Proofs need the ceremony's proving keys (8.9 MB). They are published in the ledger repository:

```bash
git clone --depth 1 --filter=blob:none --sparse https://github.com/Menese-Protocol/Shielded-Ledger-Hivemind.git
git -C Shielded-Ledger-Hivemind sparse-checkout set ceremony-launch-p14/final
node MeneseSDK-V0/privacy-sdk/tools/split-zk-keys.mjs Shielded-Ledger-Hivemind/ceremony-launch-p14/final public/zk-keys
```

The script checks both proving keys against `SETUP-MANIFEST.json` and prints, for each, a line
ending in `joined hash matches the manifest`. If it throws, stop: the files are wrong.

`public/zk-keys` is then served by your app at `/zk-keys`, and `mainnet("/zk-keys")` points the
engine there. If the app is served under a sub-path, pass that path instead (for example
`mainnet("/shop/zk-keys")`). The keys must come from your app's own origin, or from a host that
allows it with CORS.

The client checks the keys again every time it loads them: against the manifest, and against the
verifying keys the ledger certifies on chain. A changed key file is refused, not used.

### Step 4: sign the user in

The engine needs the user's signed-in ICP identity. Use Internet Identity through
`@dfinity/auth-client` (the SDK's `src/zk/auth.js` has ready helpers):

```ts
import { existingSession, loginWithInternetIdentity, logout } from "./privacy/zk/auth.js";

const identity = (await existingSession()) ?? (await loginWithInternetIdentity());
```

A private balance belongs to the user's **principal**. Internet Identity gives a different principal
on each app domain, so the same person on a different domain sees a different (empty) private
balance. Keep the app on one domain. If it must move, set Internet Identity's `derivationOrigin`
to the original domain before users put money in.

Do not use a random throwaway identity for real money: its private balance is lost when the tab closes.

### Step 5: create the engine

```ts
import { PrivateEngine } from "./privacy/engine/core";
import { mainnet } from "./privacy/mainnet";

const engine = new PrivateEngine(
  mainnet("/zk-keys"),
  identity,
  () => new Worker(new URL("./privacy/zk/prover-worker.js", import.meta.url), { type: "module" }),
  () => new Worker(new URL("./privacy/zk/claim-scan-worker.js", import.meta.url), { type: "module" }),
);
```

Write the two `new Worker(new URL(...))` calls literally, as above, with the path relative to the
file they are in. Bundlers only find workers written in this exact shape.

If the app sets a Content-Security-Policy: `script-src` needs `'wasm-unsafe-eval'`, `worker-src`
needs `'self'`, and `connect-src` needs `https://icp-api.io`.

## 5. Using it

### Lifecycle

```ts
await engine.open();     // derives this user's keys (one directory derivation), reads live fees
const snap = await engine.sync();   // notes, balances, incoming claimable payments, unclaimed sends
// ... actions ...
engine.close();          // on sign-out: stops the workers
```

- Create **one engine per signed-in user** and keep it for the session (a React context or a
  module-level variable). Do not create it inside a component render.
- In React, `StrictMode` runs effects twice in development. Guard `open()` (for example with a ref
  or a module-level promise) so it runs once; otherwise every page load uses two of the user's
  20 daily derivations.
- `open()` throws `"This account already has a different private address. Nothing was changed."`
  if the principal registered with other keys. Show the message; do not try to work around it.
- `engine.enable()` turns on private balance for the account (files its address once). Until then
  payments to it arrive as claimable payments. `makePrivate` and `claim` call it themselves, so a
  separate "turn on" button is optional.
- Call `sync()` after `open()` and before any `quote()`. Every action syncs again when it finishes.
  `sync(onScan)` reports `(done, total)` while it looks for claimable payments; show it on first sign-in.

`snapshot` (returned by `sync()`, also `engine.snapshot`):

| Field | Meaning |
|---|---|
| `privateE8s` | private balance |
| `publicE8s` | normal ICP balance |
| `noteCount` | how many notes make up the private balance |
| `incoming` | claimable payments to this user: `{ id, amountE8s, receivedAt }` |
| `pendingSent` | this user's claimable payments not yet claimed: `{ id, to, amountE8s }` |
| `registered` | private balance is turned on |

### Amounts

All amounts are `bigint` in e8s (1 ICP = `100_000_000n`). Never use JavaScript numbers for money.
Use the helpers in `src/types.ts`:

```ts
import { parseIcp, formatIcp, E8S } from "./privacy/types";
const amount = parseIcp(input);          // "1.5" -> 150_000_000n, null if not a valid amount
label.textContent = formatIcp(amount);   // 150_000_000n -> "1.5"
```

### Make private

```ts
await engine.makePrivate(amount, onProgress);
```

The normal balance must cover `amount` + 0.0002 ICP. The very first time, the engine also makes
1 e8s private as a second note (a balance must have two notes to move), which costs another
0.0002 ICP. Keep at least 0.0003 ICP in the normal balance at all times: the engine may need it to
prepare the private balance before a send.

### Send privately (always quote first)

```ts
const q = await engine.quote("send", amount, recipientPrincipalText);
if (!q.possible) { show(q.reason); return; }
// show: formatIcp(q.privateFeesE8s) from the private balance,
//       formatIcp(q.publicFeesE8s) ICP network fees (when not zero),
//       q.claimable ? "They will claim it when they sign in" : "Arrives in their private balance"
const result = await engine.sendPrivately(recipientPrincipalText, amount, onProgress);
// result.claimable, result.reference (a code like "6-1-9" for claimable payments)
```

The recipient is a principal as text. The engine looks it up in the directory (anonymously) and
picks a direct private send or a claimable payment by itself. Before a send the engine may add
preparation steps (combining notes, or a 1 e8s top-up); `quote` already includes their cost, so
the fee shown is the fee paid.

### Claimable payments

- Incoming: list `snapshot.incoming`; to accept one, `await engine.claim(payment.id, onProgress)`.
  The amount shown is what lands; the sender already paid the claim fee.
- Sent and not yet claimed: list `snapshot.pendingSent`; to cancel one,
  `await engine.takeBack(payment.id, onProgress)`.
- Payments never expire. Whichever of claim or take-back reaches the ledger first wins.
- `result.reference` opens nothing on its own and shows no amount, so it is safe to share in any chat.

How it works in detail: `CLAIMABLE-PAYMENTS.md` in this folder.

### Move out

```ts
const q = await engine.quote("moveOut", amount);
if (!q.possible) { show(q.reason); return; }
await engine.moveOut(amount, onProgress);   // ICP arrives in the user's normal balance
```

### Progress

Every action takes an `onProgress(p)` callback (it is required). `p.step` is one of `keys`,
`prepare`, `approve`, `prove`, `submit`, `confirm`, and `p.fraction` (0 to 1) is real progress for
the whole action. The first action on a device downloads the proving keys (8.9 MB) during `keys`;
`p.bytes` gives `{ done, total }` so you can show the download. Later actions load them from the
device. A proof takes a few seconds of CPU and runs in a worker, so the page stays responsive.
Disable the action button until the promise settles.

### Activity list

The ledger keeps no history for the user. If the app shows one, add entries yourself after each
action and store them with `engine.saveActivity(list)` / `engine.loadActivity()`: they are
encrypted on the device with a key derived from the user's vetKey (`Activity` type in `src/types.ts`).

## 6. Errors and what to tell the user

Every refused action throws before anything moves, with a message meant for people. Show it as is.

| Message (start) | Meaning | What to do |
|---|---|---|
| `Enter an amount.` / `Enter who to pay.` | empty input | ask for it |
| `Your private balance is empty.` | nothing private yet | offer "Make private" |
| `Not enough in your private balance for this, including the fee(s).` | amount + fees > balance | show the quote, suggest a smaller amount |
| `Keep at least 0.0003 ICP in your ICP balance...` | no ICP for a preparation step | ask them to add a little ICP to the normal balance |
| `The ledger refused ... Nothing was moved.` | the ledger rejected the step | `sync()`, then let them try again |
| `vetKey derivation failed: ...` | directory refused (often the daily limit) | try again later; do not loop |
| `The ledger's proof keys are not locked yet...` | ledger keys not frozen | stop; never bypass |
| `The proving keys do not belong to this ledger's verifying keys.` / `keyset asset ... returned HTTP ...` | wrong or missing key files | redo Step 3 and check the `/zk-keys` URL |
| `The first part went through, but the second part has no notes to spend...` | a claimable payment stopped halfway | `sync()`; the first part is safe and can be taken back or completed |

## 7. Rules for the agent

Do:
- Copy the SDK source as it is and call it through `PrivateEngine`.
- Show `quote(...)` before every send and move out, with the fee in ICP.
- Keep amounts as `bigint` e8s and format them with `formatIcp`.
- Keep one engine per signed-in user and close it on sign-out.

Never:
- Set `requireFrozenKeys` to `false`, or change the canister ids, host or `key_1` in `mainnet.ts`.
- Call the shielded ledger or directory methods yourself "to keep it simple". The engine's order of
  calls (fresh identity per transfer, anonymous reads, envelope on every transfer) is what keeps
  users private.
- Log, store, upload or send to any server: notes, the vetKey, the account object, witnesses or
  proofs. Do not add analytics around the engine's internals.
- Edit or rebuild the wasm files or the proving keys. To check them, use `tools/build-wasm.sh`
  (see `README.md`); it must print the same hashes.
- Run the engine on a server, in Node, or during server rendering.

## 8. Checking it works

First, without spending anything: `npm run build` must finish, and `dist/assets/` must contain
`prover-worker-*.js`, `claim-scan-worker-*.js`, `pool_prover_wasm_bg-*.wasm` and
`claim_scan_wasm_bg-*.wasm`. Open the app; the first action's `keys` step must reach 8,903,520 bytes.

Then run these on the deployed app with a real Internet Identity, in order. Each one costs real ICP, so
use small amounts and tell the user before each one.

1. Sign in, `open()`, `sync()`: no error; `snapshot.publicE8s` matches the user's ICP balance.
2. Make 0.01 ICP private: `privateE8s` goes up by 0.01 ICP; `snapshot.registered` is `true`, and
   `isPrivateEnabled` returns `true` in a new tab (it remembers answers within a tab, so call
   `markPrivateEnabled(net, principal)` after the first action).
3. With a second Internet Identity that has never used private balance, send it 0.01 ICP: the quote
   says claimable and 0.3 ICP in fees (so the private balance must be at least 0.31 ICP for this
   step); the second account sees it in `incoming` after sign-in and claims it.
4. Send 0.01 ICP from the second account back to the first: direct private send, 0.1 ICP fee.
5. Move out 0.01 ICP: the normal balance goes up by 0.01 ICP; the private balance goes down by
   0.01 ICP + the quoted fee.
6. Reload the page: balances are the same after `sync()`, and the key download does not repeat.

## More

- `README.md`: install, keys, rebuilding the wasm byte for byte.
- `CLAIMABLE-PAYMENTS.md`: envelopes, claiming, taking back, finding a payment.
- Ledger source, trusted-setup ceremony and its record:
  [Menese-Protocol/Shielded-Ledger-Hivemind](https://github.com/Menese-Protocol/Shielded-Ledger-Hivemind).
