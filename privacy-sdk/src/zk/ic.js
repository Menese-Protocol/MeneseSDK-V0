// IC agent + typed actors for the shielded-ledger client (Menese DeFi Team).
import { HttpAgent, Actor, AnonymousIdentity } from "@dfinity/agent";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { Principal } from "@dfinity/principal";
import { HOST, CANISTERS } from "./config.js";
import { idlFactory as ledgerIdl } from "./declarations/zk_ledger.did.js";

// The ICRC-1/2 surface the client uses on the pool's token (ICP on mainnet): balance, fee, approve.
const tokenIdl = ({ IDL }) => {
  const Account = IDL.Record({ owner: IDL.Principal, subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)) });
  const ApproveError = IDL.Variant({
    GenericError: IDL.Record({ message: IDL.Text, error_code: IDL.Nat }),
    TemporarilyUnavailable: IDL.Null,
    Duplicate: IDL.Record({ duplicate_of: IDL.Nat }),
    BadFee: IDL.Record({ expected_fee: IDL.Nat }),
    AllowanceChanged: IDL.Record({ current_allowance: IDL.Nat }),
    CreatedInFuture: IDL.Record({ ledger_time: IDL.Nat64 }),
    TooOld: IDL.Null,
    Expired: IDL.Record({ ledger_time: IDL.Nat64 }),
    InsufficientFunds: IDL.Record({ balance: IDL.Nat }),
  });
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ["query"]),
    icrc1_fee: IDL.Func([], [IDL.Nat], ["query"]),
    icrc2_approve: IDL.Func(
      [IDL.Record({
        fee: IDL.Opt(IDL.Nat),
        memo: IDL.Opt(IDL.Vec(IDL.Nat8)),
        from_subaccount: IDL.Opt(IDL.Vec(IDL.Nat8)),
        created_at_time: IDL.Opt(IDL.Nat64),
        amount: IDL.Nat,
        expected_allowance: IDL.Opt(IDL.Nat),
        expires_at: IDL.Opt(IDL.Nat64),
        spender: Account,
      })],
      [IDL.Variant({ Ok: IDL.Nat, Err: ApproveError })],
      [],
    ),
  });
};

// The directory's interface (src/ShieldedDirectory.mo in the ledger repository), small enough to declare inline.
const directoryIdl = ({ IDL }) => {
  const Entry = IDL.Record({ shielded_pk: IDL.Text, enc_pk: IDL.Text });
  const Unit = IDL.Variant({ ok: IDL.Null, err: IDL.Text });
  const Limits = IDL.Record({
    derivations_per_caller_per_day: IDL.Nat,
    derivations_per_hour: IDL.Nat,
    cycles_reserve: IDL.Nat,
  });
  return IDL.Service({
    vetkey_public_key: IDL.Func([], [IDL.Vec(IDL.Nat8)], []),
    derive_shielded_key: IDL.Func([IDL.Vec(IDL.Nat8)], [IDL.Variant({ ok: IDL.Vec(IDL.Nat8), err: IDL.Text })], []),
    register: IDL.Func([IDL.Text, IDL.Text], [Unit], []),
    set_birthday: IDL.Func([IDL.Vec(IDL.Nat8)], [Unit], []),
    get_birthday: IDL.Func([], [IDL.Opt(IDL.Vec(IDL.Nat8))], []),
    lookup: IDL.Func([IDL.Principal], [IDL.Opt(Entry)], ["query"]),
    lookup_certified: IDL.Func([IDL.Principal], [IDL.Opt(Entry)], []),
    count: IDL.Func([], [IDL.Nat], ["query"]),
    status: IDL.Func([], [IDL.Record({
      vetkd_key_name: IDL.Text,
      administrator: IDL.Principal,
      limits: Limits,
      registered: IDL.Nat,
      derivations_this_hour: IDL.Nat,
      cycles: IDL.Nat,
    })], ["query"]),
    set_limits: IDL.Func([Limits], [IDL.Variant({ ok: Limits, err: IDL.Text })], []),
    set_administrator: IDL.Func([IDL.Principal], [Unit], []),
  });
};

async function agentFor(identity) {
  const agent = new HttpAgent({ host: HOST, identity });
  // Root key must only be fetched against a local replica; on mainnet the
  // hardcoded NNS root key in the agent is the trust anchor.
  if (HOST.includes("127.0.0.1") || HOST.includes("localhost")) {
    await agent.fetchRootKey();
  }
  return agent;
}

/// Boot-time read-only ledger actor. The verifying-key anchor must be read BEFORE any
/// identity exists, because the keyset is loaded before the user connects.
export async function anonymousLedger() {
  const agent = await agentFor(new AnonymousIdentity());
  return Actor.createActor(ledgerIdl, { agent, canisterId: CANISTERS.zk_ledger });
}

/// Read-only directory actor with no identity: an address lookup made this way does not tell the
/// network who is about to pay whom.
export async function anonymousDirectory() {
  const agent = await agentFor(new AnonymousIdentity());
  return Actor.createActor(directoryIdl, { agent, canisterId: CANISTERS.directory });
}

/// The token balance of `principal`'s default account, read with no identity: one query, so the
/// screen can show the public balance before the private session (prover, vetKey, scan) is open.
export async function anonymousTokenBalance(principal) {
  const agent = await agentFor(new AnonymousIdentity());
  const token = Actor.createActor(tokenIdl, { agent, canisterId: CANISTERS.token });
  return token.icrc1_balance_of({ owner: principal, subaccount: [] });
}

/// A ledger actor signed by a brand-new identity, used for ONE private transfer and dropped. A
/// private transfer is authorised by its proof, not by its sender, so the network sees each one
/// come from a principal it has never seen and never will again, instead of from the user.
export async function oneTimeLedger() {
  const identity = Ed25519KeyIdentity.generate();
  const agent = await agentFor(identity);
  return { ledger: Actor.createActor(ledgerIdl, { agent, canisterId: CANISTERS.zk_ledger }), sender: identity.getPrincipal() };
}

export async function actorsFor(identity) {
  const agent = await agentFor(identity);
  return {
    principal: identity.getPrincipal(),
    ledger: Actor.createActor(ledgerIdl, { agent, canisterId: CANISTERS.zk_ledger }),
    token: Actor.createActor(tokenIdl, { agent, canisterId: CANISTERS.token }),
    directory: Actor.createActor(directoryIdl, { agent, canisterId: CANISTERS.directory }),
  };
}

export const poolPrincipal = () => Principal.fromText(CANISTERS.zk_ledger);

// ---- hex <-> bytes ----
export const hexToBytes = (h) => {
  const clean = h.startsWith("0x") ? h.slice(2) : h;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(2 * i, 2), 16);
  return out;
};
export const bytesToHex = (b) =>
  Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
