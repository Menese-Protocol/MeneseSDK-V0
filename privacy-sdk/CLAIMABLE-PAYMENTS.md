# Claimable payments

A claimable payment is a private payment to an ICP principal that has never used the shielded
ledger. The recipient claims it the first time they sign in. Until then the sender can take it
back. Payments do not expire.

An ordinary private transfer needs the recipient's shielded address, which exists only once the
recipient has derived their vetKey and registered it in the shielded directory. A claimable
payment removes that step: it is addressed to the principal itself.

## How it works

1. **One-time key.** The sender derives a one-time spend key from their own spend key and the
   nullifier of the transfer's first input:
   `otk_nk = SHA-512("picp-claim-otk/v1" ‖ sender_nk ‖ nf_1)`, reduced into the scalar field. The
   value is locked to that key. Because the key is deterministic, the sender can rebuild it from
   their own history at any time.
2. **Envelope.** The opening of the note `(version, part, parts, value, rcm, otk_nk)` is encrypted
   with vetKeys identity-based encryption, under the directory's derived public key, with the
   recipient's principal as the identity. That is the identity the directory derives the
   recipient's own vetKey for, so the recipient's vetKey opens it. The recipient needs no new key
   and no registration to receive.
3. **Binding.** The envelope travels with the transfer. The proof's public `recipient_binding`
   input is `SHA-256("picp-claim-envelope/v1" ‖ ledger principal ‖ envelope)` with the top byte
   cleared, so an envelope cannot be swapped or removed without the proof failing. This uses the
   existing transfer circuit and trusted setup.
4. **Claim log.** The ledger appends each envelope, with the position of its note and the time, to
   a public claim log (`claim_envelopes`, `claim_status`).
5. **Claim.** On sign-in, the recipient's client opens envelopes with the recipient's vetKey,
   rebuilds each note, checks its commitment against the ledger, and spends the one-time notes
   into the recipient's own shielded address.
6. **Take back.** The sender spends the same one-time notes back to themselves. Whichever spend
   arrives first succeeds; the other is rejected as `nullifier-spent`.

A transfer always spends exactly two notes, so a recipient who holds nothing else needs two
notes to claim. A claimable payment is therefore sent as two transfers that each create one note
for the same one-time key (the `part` and `parts` fields), and is claimed in one transfer.

## What the ledger enforces

Values read from the live ledger (`3pwrb-oiaaa-aaaao-bbqba-cai`):

| Rule | Live value |
|---|---|
| every private transfer carries an envelope (`claim_status().required`) | `true` |
| envelope length (`claim_status().envelope_len`) | 216 bytes |
| note ciphertext length (`get_note_shape()`) | 584 bytes |
| ephemeral key length (`get_note_shape()`) | 32 bytes |

On transfers that are not claimable payments, the client attaches a decoy envelope of the same
length (an encryption of random bytes to a random identity), inside `privateTransferEx`, so no
caller has to remember to do it. Every note plaintext is padded to 512 bytes before encryption.
The ledger refuses an output of any other shape (`REJECT:ephemeral-key-shape`,
`REJECT:note-ciphertext-shape`). The result is that a reader of the public chain, without keys,
sees the same shape for a claimable payment as for any other private transfer, and an envelope
does not reveal its recipient.

## Finding a payment

The recipient searches the claim log once, at their first sign-in. After they register, later
payments to them are ordinary private notes.

- **By reference.** `sendPrivately` returns a payment reference such as `6-1-9`: the claim-log
  index of the first envelope, the offsets of the other parts, and a Damm check digit. The
  reference opens nothing without the recipient's vetKey and shows no amount, so it can be sent
  over any channel. `claimsByReference` (`src/zk/claims.js`) reads only the log pages holding
  those envelopes, anonymously.
- **By scan.** `engine.sync()` scans the log newest first with the claim scanner
  (`claim-scan-wasm`, run in a pool of Web Workers). The scanner discards an envelope early when
  its payload lacks the fixed structure; a payload that passes is decrypted in full, with the
  subgroup and Fujisaki–Okamoto checks of ic-vetkeys' `IbeCiphertext::decrypt`, and then again by
  `@dfinity/vetkeys` before use.

Measured in headless Chromium on an x86-64 server, over 10,000 envelopes of which 10 were real
(every run found exactly the 10):

| Search | Per envelope | 10,000 envelopes |
|---|---|---|
| `@dfinity/vetkeys` in JavaScript, 1 thread | 5.06 ms | 50.6 s |
| claim scanner, 4 workers | 0.65 ms | 6.5 s |
| claim scanner, 8 workers | 0.32 ms | 3.2 s |
| by reference (2 envelopes and one page read, in Node) | | 175 ms end to end |

Sealing one envelope takes 8.3 ms in the browser.

## Trust

- The client does not take the directory's public key on trust. It derives the key itself from
  the IC's published vetKD master key (`key_1`) and the directory's canister id, compares it with
  what the directory reports, and refuses a mismatch (`directory-key-mismatch`, in
  `src/zk/envelope.js`). A changed directory cannot redirect payments.
- The vetKD threshold of the IC subnet can derive any principal's key. Shielded account keys
  already rest on the same assumption; claimable payments add no new party.
- Each private transfer is submitted from a fresh one-time identity. The proof authorises the
  transfer, so the user's principal does not appear on it.

## Fees

A claimable payment costs the sender three private send fees, 0.3 ICP at today's fee: one for
each of the two transfers, and one prepaid for the recipient's claim, so the recipient receives
the full amount. `engine.quote(...)` returns the exact amount before the user confirms.

## Tests

The ledger side (envelope length, binding, the claim log, the `required` switch, refusal of
envelopes on unshields, and the log surviving an upgrade) is covered by
`soak/src/bin/claim_battery.rs` in
[Shielded-Ledger-Hivemind](https://github.com/Menese-Protocol/Shielded-Ledger-Hivemind), which
runs the real ledger wasm with real Groth16 proofs.

## References

- Zcash ZIP 324, *URI-Encapsulated Payments*: fund a one-time key, hand the key to the recipient,
  who sweeps it; the sender can reclaim until then.
- DFINITY vetKeys, identity-based encryption (`IbeCiphertext`, `@dfinity/vetkeys`): encryption to
  an identity before it has requested its key.
- D. Boneh and M. Franklin, *Identity-Based Encryption from the Weil Pairing*, CRYPTO 2001.
- H. M. Damm, *Total anti-symmetrische Quasigruppen*, 2004 (the check digit in the payment
  reference).
