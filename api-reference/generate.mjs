// Writes docs/api/README.md (read on GitHub) and docs/api/index.html (a static page) from gateway.did, the SDK's
// grouping in ai-agents/references/api-surface.md, and methods-source.json.
//   node generate.mjs            from the saved gateway.did
//   node generate.mjs --live     reads the live candid first and saves it (gateway.did, gateway.json)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { referenceOf, markdownOf, htmlOf } from './lib.mjs';
import { readLive } from './read-live.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'docs', 'api');
const gw = JSON.parse(readFileSync(join(HERE, 'gateway.json'), 'utf8'));
const facts = JSON.parse(readFileSync(join(HERE, 'methods-source.json'), 'utf8'));

if (process.argv.includes('--live')) {
  const live = await readLive(gw.canister);
  if (live.moduleHash !== facts.module) {
    console.error(`The live module is ${live.moduleHash}; methods-source.json was read from ${facts.module}.`);
    console.error('Read the gateway source at the live module again (charges, controller-only and refused methods) first.');
    process.exit(1);
  }
  writeFileSync(join(HERE, 'gateway.did'), live.did);
  Object.assign(gw, { moduleHash: live.moduleHash, candidSha256: live.candidSha256, readAt: new Date().toISOString().slice(0, 10) });
  writeFileSync(join(HERE, 'gateway.json'), JSON.stringify(gw, null, 2) + '\n');
}

const did = readFileSync(join(HERE, 'gateway.did'), 'utf8');
const surface = readFileSync(join(ROOT, 'ai-agents', 'references', 'api-surface.md'), 'utf8');
const ref = referenceOf(did, surface, facts);
mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'README.md'), markdownOf(ref, gw));
writeFileSync(join(OUT, 'index.html'), htmlOf(ref, gw));
writeFileSync(join(OUT, 'methods.json'), JSON.stringify(ref.methods.map(({ name, query, cost, availability, group }) => ({ name, query, cost, availability, group })), null, 1) + '\n');
console.log(`wrote docs/api: ${ref.methods.length} methods in ${ref.groups.length} groups`);
