// Fails (exit 1) when the live gateway differs from the reference: another module, other candid text, or a
// method the reference leaves out or lists in excess. Reads the live canister's certified state; signs nothing.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drift } from './lib.mjs';
import { readLive } from './read-live.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const gw = JSON.parse(readFileSync(join(HERE, 'gateway.json'), 'utf8'));
const listed = JSON.parse(readFileSync(join(HERE, '..', 'docs', 'api', 'methods.json'), 'utf8')).map((m) => m.name);
const live = await readLive(gw.canister);
const moved = drift({ savedDid: readFileSync(join(HERE, 'gateway.did'), 'utf8'), liveDid: live.did, savedModule: gw.moduleHash, liveModule: live.moduleHash, listedNames: listed });
if (moved.length) {
  for (const m of moved) console.error('DRIFT', m);
  process.exit(1);
}
console.log(`same as the live gateway: module ${live.moduleHash.slice(0, 16)}…, ${listed.length} methods`);
