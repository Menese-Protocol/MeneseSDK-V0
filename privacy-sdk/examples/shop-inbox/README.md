# Shop inbox

A shop's server that takes private ICP payments. It runs the Privacy SDK in Node with the shop's
own identity, and marks an order paid when a payment with that order id arrives in the shop's
private balance for at least the order's price. Every paid order gets a receipt.

```
npm install
npm run setup                       # copies ../../src into ./privacy
cp orders.example.json orders.json
ZK_KEYS=/path/to/zk-keys npm run start
```

`ZK_KEYS` is the folder `tools/split-zk-keys.mjs` writes (see the SDK README). The shop needs it
only to claim payments sent before it turned on private balance; it turns it on at its first start.

On its first start the shop creates `shop-identity.json`. That file controls the shop's private
balance: keep it secret and back it up. The shop's principal is printed as `"event":"open"`;
customers pay it.

## The customer's side

```ts
const { reference } = await engine.sendPrivately(shopPrincipal, 150_000_000n, onProgress, { orderId: "ORD-10023" });
```

## What the shop does

- `engine.onPayment(listener)` reports each payment once it is in the private balance. The listener
  looks up `orderId` in `orders.json`. If the amount covers the price, it marks the order `paid`,
  keeps the payment's `reference`, and writes `receipts/<order id>.json`. Otherwise it marks it `underpaid`.
- A payment sent before the shop turned on private balance shows as `"claimable"` in
  `snapshot.received`. The shop claims it, and it is then reported like any other.
- After a restart the listener sees earlier payments again. An order already `paid` stays as it is.

## Receipts

```
npm run verify receipts/ORD-10023.json
valid: 1.5 ICP to <shop principal>, order ORD-10023, reference 48213-0-7
```

The check needs no keys and no sign-in. A receipt shows that one payment (amount, principal paid,
order id, reference) and nothing else, so the shop or the customer can give it to support or an
arbiter.
