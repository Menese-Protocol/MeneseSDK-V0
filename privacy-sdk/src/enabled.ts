// Whether an account has turned on private balance: one anonymous query to the directory, so the app
// can decide what to do after sign-in without loading the private engine or deriving a vetKey.
// Small on purpose: the app shell imports it; the engine is still loaded only for accounts that use it.
import { Actor, HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import type { ZkNetwork } from "./engine/core";

const directoryIdl = ({ IDL }: any) =>
  IDL.Service({
    lookup: IDL.Func([IDL.Principal], [IDL.Opt(IDL.Record({ shielded_pk: IDL.Text, enc_pk: IDL.Text }))], ["query"]),
  });

// answers already known in this tab, so the shell and the Private screen ask the directory once
const known = new Map<string, boolean>();

const key = (network: ZkNetwork, principal: string) => `${network.directory}/${principal}`;

export async function isPrivateEnabled(network: ZkNetwork, principal: string): Promise<boolean> {
  const k = key(network, principal);
  const cached = known.get(k);
  if (cached !== undefined) return cached;
  const agent = HttpAgent.createSync({ host: network.host });
  if (network.host.includes("127.0.0.1") || network.host.includes("localhost")) await agent.fetchRootKey();
  const directory = Actor.createActor(directoryIdl, { agent, canisterId: network.directory });
  // anonymous: the question does not tell the network who is asking about this account
  const entry = (await directory.lookup(Principal.fromText(principal))) as unknown[];
  const enabled = entry.length > 0;
  known.set(k, enabled);
  return enabled;
}

/// Called once the account has registered in this tab, so the next check needs no query.
export function markPrivateEnabled(network: ZkNetwork, principal: string) {
  known.set(key(network, principal), true);
}
