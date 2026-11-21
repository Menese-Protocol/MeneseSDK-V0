# Payment references, order ids, the shop inbox and receipts

A shop that takes private payments needs four things: a reference for each payment that both sides
can quote, the shop's order id carried with the payment, a list of the payments that arrived, and a
way to show one payment to someone else (support, an accountant, a dispute) without giving away
anything more. All four work on the live shielded ledger as it is. The ledger, its circuit and its
verifying keys are unchanged; everything here is in the client.

## Payment references

`sendPrivately` returns a `reference` for every payment.

| Payment | Reference | Made of |
|---|---|---|
| straight into a private balance | `48213-0-7` | log position of the transfer, output slot `0` (the payment note), Damm check digit |
| claimable | `6-1-9` | claim-log index of the first envelope, offset of the second part, Damm check digit |

A claimable reference never has a `0` after its first number, so the two kinds cannot be confused,
and both are checked by the same rule: each number is length-prefixed, the Damm check digit covers
them all, and numbers are written without leading zeros. Every single-digit typing error and every
swap of two neighbouring digits is refused. A reference opens nothing and shows no amount; it names a
position the public log shows anyway, so it can be sent in any chat. `parsePaymentReference`
(`src/zk/claims.js`) reads either kind.

The payer gets the reference from the ledger's reply (a private transfer appends its two outputs in
one message, payment note first), checked against the log before it is returned. The person paid
sees the same reference in `snapshot.received`.

## Order ids

```ts
await engine.sendPrivately(shop, amount, onProgress, { orderId: "ORD-10023" });
```

`orderId` is a string of at most 32 bytes in UTF-8, or at most 32 bytes (for example the SHA-256 of
the invoice). It is sealed inside the payment for the recipient alone, the way a Zcash memo rides in
the encrypted note plaintext (ZIP-302):

- **Direct payment.** The payment note's plaintext carries `pay = { s, o, t }`: a 32-byte random
  payment seed `s`, the order id `o`, and whether it was text or bytes (`t`). Note plaintexts are
  padded to 512 bytes, so a note with an order id is exactly as long on the log as one without.
- **Claimable payment.** Each part's note ciphertext is sealed to a key derived from the payment's
  one-time key (`claimNoteBox`), which only the recipient (from the envelope) and the sender know.
- **Bound to the payment.** The note's commitment randomness is
  `rcm = field(SHA-512("picp-pay-rcm/v1" ‖ s ‖ t ‖ |o| ‖ o))`. `rcm` is a free witness of the transfer
  statement, so this needs no circuit change, and the random `s` keeps it uniform. The order id is
  therefore fixed by the commitment on the log: nobody, the payer included, can change it later, and a
  recipient's client accepts an order id only if it reproduces the committed `rcm`.

Recipients on earlier versions of the client open these notes as before and ignore the extra fields.

## The inbox

`engine.sync()` returns `snapshot.received`, newest first:

```ts
{ reference, amountE8s, orderId, receivedAt, status, kind, claimId }
```

- **Direct payments** are found by the same scan that finds the account's notes. A payment to the
  account is an output 1 that is the account's while the output 2 next to it is not (it is the payer's
  change); every transfer the account makes itself has both outputs its own. This needs no marker, so
  payments made with earlier client versions are listed too (without an order id).
- **Claimable payments** come from the claim scan. They are `"claimable"` until claimed with
  `engine.claim(claimId)`, then `"paid"`; `"takenBack"` if the payer took one back first.
- **`engine.onPayment(listener)`** calls the listener once for each payment that is in the private
  balance: a direct payment when it is first seen, a claimable one once it is claimed. A restarted
  engine reports earlier payments again on its first sync, so a listener should do something that is
  safe to repeat (mark an order paid).

The record of payments received is kept in the encrypted note cache. A cache written by an earlier
client version has no such record; the engine then scans once from the account's birthday and keeps
the record from there on.

## Receipts

```ts
const receipt = await engine.receipt(reference);   // payer or shop
const ok = await verifyReceipt(receipt);           // anyone: no keys, anonymous reads
```

A receipt is plain JSON: the reference, the principal paid, the amount, the order id, and the opening
of the payment's note (the payment seed). `verifyReceipt` (`src/receipt.ts`; `src/node.js` in Node)
reads the note at the reference's position and the recipient's private address from the directory,
anonymously, and recomputes the commitment. It is true only when the amount, the recipient, the order
id and the position are all exactly what was paid. `checkReceipt` returns the reason when it is not.

- **What it shows.** That one payment: its amount, recipient, order id and position. Not a balance,
  not another payment, not a key, and not who paid. Knowing a note's opening does not let anyone spend
  it or see when it is spent.
- **Who can make one.** The payer (from the record its change note keeps on the log) and the person
  paid (from its own note). For a payment made with an earlier client version, only the person paid.
- **Claimable payments** get a receipt once claimed. It names the payment's one-time key (spent by
  then, so worth nothing), opens both parts, and opens the note the claim created for the recipient,
  whose transfer spent exactly those parts. Before the claim there is no receipt: proving where an
  unclaimed payment sits would mean giving out the key that can still move it.

## Trust

Nothing changes for anyone who shares nothing. A reference is public information. An order id is
readable only with the recipient's key (or the payment's one-time key). A receipt is made only by a
party to the payment, for that payment, when they choose to.

## References

- Zcash ZIP-302, *Standardized Memo Field Format*: a memo inside the encrypted note plaintext,
  outside the commitment.
- Zcash ZIP-311, *Zcash Payment Disclosures*: proving one shielded payment to a third party.
- Monero `get_tx_proof` / `check_tx_proof`: a payer proves a payment to an address and its amount.
- Zcash ZIP-321, *Payment Request URIs*: amount and memo bound into a payment request.
- Stripe PaymentIntents `metadata.order_id`: every payment carries the merchant's order key.
- H. M. Damm, *Total anti-symmetrische Quasigruppen*, 2004: the check digit.
