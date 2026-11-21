# Gateway API reference: generator and drift check

`docs/api/` lists every public method of the signing gateway canister `urs2a-ziaaa-aaaad-aembq-cai`. It is
generated, not written by hand:

| File | What it holds |
|---|---|
| `gateway.did` | The gateway's candid interface, read from the canister's certified state. |
| `gateway.json` | The canister id, the module hash and the candid sha256 the reference was generated from. |
| `methods-source.json` | Read from the gateway's source at that module: which methods use one action of the caller's plan, which only the gateway's controllers may call, which the gateway refuses for every caller, and notes on single methods. |
| `../ai-agents/references/api-surface.md` | The SDK's grouping of the methods. A method it does not list appears under "Other calls". |

Output: `docs/api/README.md` (read on GitHub), `docs/api/index.html` (a static page with search) and
`docs/api/methods.json`.

## Commands

```sh
npm ci
npm test               # the reference against the saved candid; the drift check against injected drifts
npm run check          # exit 1 when the live gateway differs: module hash, candid text, or method list
npm run links          # every external link in the pages answers 200 with no credentials
npm run generate       # rewrite docs/api from the saved files
npm run generate:live  # read the live candid first; refused when the live module is not the one
                       # methods-source.json was read from
```

`check` and `generate:live` read the canister's `read_state` (`candid` and `module_hash`), verified against the
Internet Computer's root key. Nothing is signed and no cycles are spent.

## When the gateway is upgraded

`npm run check` fails on the new module hash. Re-read the gateway's source at the new module for
`methods-source.json`: a method uses an
action when its body, directly or through a private helper, calls `chargeOp`, `chargeAccess` or
`chargeAccessWithKey`; it is controller-only when it refuses every caller that is not a controller before any other
work. Then `npm run generate:live`, `npm test`, `npm run links`.
