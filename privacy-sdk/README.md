# Privacy SDK

Private ICP balances for any app on the Internet Computer. Your users can move ICP into a private
balance, send it privately, send a payment someone can claim later, and move it back out. Proofs
are made in the user's browser; keys and notes never leave it.

The SDK talks to the live shielded ledger. Its source, the trusted-setup ceremony and the full
ceremony record are public in
[Menese-Protocol/Shielded-Ledger-Hivemind](https://github.com/Menese-Protocol/Shielded-Ledger-Hivemind).

| Canister | ID |
|---|---|
| shielded ledger | `3pwrb-oiaaa-aaaao-bbqba-cai` |
| shielded directory | `3gv25-yaaaa-aaaao-bbqaq-cai` |
| token (ICP) | `ryjl3-tyaaa-aaaaa-aaaba-cai` |

## Fees

The ledger charges the same fees to every app that uses it:

| Action | Fee |
|---|---|
| make private (shield) | free (only the ICP ledger's own fees) |
| private send | 0.1 ICP |
| claimable payment | 0.3 ICP in total, paid by the sender (it is two private transfers, plus the recipient's claim) |
| move out (unshield) | ICP network fee + 0.3% of the amount |

`engine.quote(...)` returns the exact cost of an action before the user confirms it.

## What is in this folder

| Path | What it does |
|---|---|
| `src/engine/core.ts` | `PrivateEngine`: the high-level API, with progress reporting and fee quotes |
| `src/engine/plan.ts` | plans the steps an action needs (each transfer spends two notes, so small top-ups and merges are added and quoted up front) |
| `src/types.ts` | data types (progress, fees, quotes, activity) and ICP amount helpers |
| `src/enabled.ts` | one anonymous query: has this principal turned on private balance? |
| `src/mainnet.ts` | the mainnet network settings |
| `src/zk/` | the client underneath: notes, proofs, transfers, claim envelopes, key loading |
| `src/zk/prover-pkg/` | the prover, compiled to wasm from `demo-frontend/prover-wasm` in the ledger repository |
| `claim-scan-wasm/` | source of the claim scanner (`src/zk/claim-scan-pkg/` is its wasm build) |
| `tools/split-zk-keys.mjs` | prepares the proving keys for your app to serve |
| `tools/build-wasm.sh` | rebuilds both wasm modules from source, byte for byte |
| `CLAIMABLE-PAYMENTS.md` | how claimable payments work: envelopes, claiming, taking back, finding a payment |

## Install

```
npm install @dfinity/agent@^3.4.3 @dfinity/principal@^3.4.3 @dfinity/identity@^3.4.3 \
    @dfinity/auth-client@^3.4.3 @dfinity/candid@^3.4.3 @dfinity/vetkeys@^0.4.0 tweetnacl@^1.0.3
```

Copy `src/` into your app. The workers are ES modules, so your bundler must support
`new Worker(new URL(...), { type: "module" })` (Vite does).

## Serve the proving keys

Proofs need the ceremony's proving keys (8.9 MB). Take them from `ceremony-launch-p14/final/` in
the ledger repository and split them for serving:

```
node tools/split-zk-keys.mjs <ledger repo>/ceremony-launch-p14/final public/zk-keys
```

The script checks every file against the ceremony manifest. The client checks them again before
use, against the manifest and against the verifying keys the ledger certifies on chain, so a
changed key file is refused rather than used.

## Use it

```ts
import { PrivateEngine } from "./engine/core";
import { mainnet } from "./mainnet";

const engine = new PrivateEngine(
  mainnet("/zk-keys"),
  identity, // the user's signed-in identity (e.g. from @dfinity/auth-client)
  () => new Worker(new URL("./zk/prover-worker.js", import.meta.url), { type: "module" }),
  () => new Worker(new URL("./zk/claim-scan-worker.js", import.meta.url), { type: "module" }),
);

await engine.open();              // derive this account's keys (vetKeys)
await engine.enable();            // once per account: publish its private address
const snapshot = await engine.sync();

await engine.makePrivate(100_000_000n, onProgress);                  // 1 ICP in
const quote = await engine.quote("send", 50_000_000n, recipient);    // exact cost first
await engine.sendPrivately(recipient, 50_000_000n, onProgress);      // 0.5 ICP, private
await engine.moveOut(25_000_000n, onProgress);                       // back to public ICP
```

`sendPrivately` to a principal that has not turned on private balance sends a claimable payment:
the recipient finds it after signing in (`snapshot.incoming`) and calls `engine.claim(id)`; until
then the sender can take it back with `engine.takeBack(id)`. Payments never expire. How it works
is described in [CLAIMABLE-PAYMENTS.md](./CLAIMABLE-PAYMENTS.md).

`onProgress` receives each step (`keys`, `prepare`, `approve`, `prove`, `submit`, `confirm`) with
real progress, so you can show the user where the action is.

## Rebuild the wasm yourself

The two wasm modules are reproducible builds. With rustc 1.95.0, wasm-pack 0.13.1 and wasm-opt 123:

```
git clone https://github.com/Menese-Protocol/Shielded-Ledger-Hivemind.git
tools/build-wasm.sh Shielded-Ledger-Hivemind
```

The script stages the sources at `/src` (set `PRIVACY_SDK_CANONICAL_SRC` to change it; the path is
part of the hash) and prints:

```
cbf5088fb928a2265c1bc1cf450ef1fab0cbce867dd15ba537ad5d6e43790e2d  src/zk/prover-pkg/pool_prover_wasm_bg.wasm
83d00feeca0ac3a3d8a5cf24c989de2ce1aae85582d83897d86ce12f44d86b98  src/zk/claim-scan-pkg/claim_scan_wasm_bg.wasm
```

## What the client does for privacy

- Private transfers are sent from a fresh one-time identity each time, so the network does not see
  which user made them.
- Address lookups and ledger reads are made anonymously.
- Only "make private" and "move out" are signed by the user's own principal, because they move
  public ICP, which the ICP ledger shows anyway.
- Notes and activity stored in the browser are encrypted with a key derived from the user's vetKey.
- The client refuses to prove against a ledger whose verifying keys are not frozen.

## License

MIT, see [LICENSE](../LICENSE).
