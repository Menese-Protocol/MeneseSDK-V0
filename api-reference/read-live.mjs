// The gateway's live candid and module hash, read from the subnet's certified state (read_state), so the answer is
// verified against the Internet Computer's root key, not taken from a boundary node on trust.
import { HttpAgent, CanisterStatus } from '@icp-sdk/core/agent';
import { Principal } from '@icp-sdk/core/principal';
import { createHash } from 'node:crypto';

export async function readLive(canister, host = 'https://icp-api.io') {
  const agent = await HttpAgent.create({ host });
  const status = await CanisterStatus.request({ canisterId: Principal.fromText(canister), agent, paths: ['candid', 'module_hash'] });
  const did = status.get('candid');
  const hash = status.get('module_hash');
  if (typeof did !== 'string' || typeof hash !== 'string') throw new Error('the gateway answered no candid or module hash');
  return { did, moduleHash: hash.replace(/^0x/, ''), candidSha256: createHash('sha256').update(did).digest('hex') };
}
