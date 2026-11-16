// The reference against the saved candid, and the drift check against planted drifts.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { methodsOf, referenceOf, drift, CONTROLLERS, REFUSED } from './lib.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const did = readFileSync(join(HERE, 'gateway.did'), 'utf8');
const surface = readFileSync(join(HERE, '..', 'ai-agents', 'references', 'api-surface.md'), 'utf8');
const facts = JSON.parse(readFileSync(join(HERE, 'methods-source.json'), 'utf8'));
const gw = JSON.parse(readFileSync(join(HERE, 'gateway.json'), 'utf8'));
const listed = JSON.parse(readFileSync(join(HERE, '..', 'docs', 'api', 'methods.json'), 'utf8')).map((m) => m.name);

test('every method of the candid is in the reference once, and no other', () => {
  const names = methodsOf(did).map((m) => m.name);
  const fromText = [...did.slice(did.indexOf('service :')).matchAll(/^ {2}([A-Za-z_]\w*)\s*:/gm)].map((m) => m[1]).sort();
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual([...names].sort(), fromText);
  assert.deepEqual([...listed].sort(), fromText, 'docs/api/methods.json is not the saved candid: run node generate.mjs');
  assert.ok(names.length > 300);
});

test('signatures and kinds come from the candid', () => {
  const m = Object.fromEntries(methodsOf(did).map((x) => [x.name, x]));
  assert.deepEqual([m.sendICP.args, m.sendICP.query], ['to: principal, amount: nat64', false]);
  assert.equal(m.getMyIcrcWallet.query, true);
  assert.match(m.getMyIcrcWallet.returns, /icpAccountId: blob/);
  assert.match(m.sendBitcoin.returns, /txid: text/);
});

test("the source-derived lists name only methods the gateway has; groups and costs follow them", () => {
  const names = new Set(methodsOf(did).map((m) => m.name));
  for (const g of Object.values(facts.groups)) assert.ok(surface.includes(g.replace(' · ', ' -- ')), `${g} is not an SDK group`);
  for (const n of [...Object.keys(facts.groups), ...facts.uses_action, ...facts.controllers_only, ...Object.keys(facts.refused), ...Object.keys(facts.notes)]) {
    assert.ok(names.has(n), `${n} is not a gateway method`);
  }
  assert.equal(facts.module, gw.moduleHash, 'methods-source.json was read from another module than gateway.did');
  const ref = Object.fromEntries(referenceOf(did, surface, facts).methods.map((x) => [x.name, x]));
  assert.equal(ref.swapClmm.group, CONTROLLERS);
  assert.equal(ref.addICPLiquidity.group, REFUSED);
  assert.equal(ref.getMyBitcoinAddress.cost, 'one action');
  assert.equal(ref.getGatewayPricing.cost, 'no action');
  assert.equal(ref.getMyIcrcWallet.group, 'Send · All Chains');
  assert.equal(ref.exp_signBtcTransfer.group, 'Sign-Only · exp_ Experimental');
  for (const x of Object.values(ref)) {
    if (x.availability === 'everyone') assert.ok(!/controller|admin|debug|test/i.test(x.group), `${x.name} in ${x.group}`);
  }
});

test('the drift check passes on the saved gateway and fails on each planted drift', () => {
  const base = { savedDid: did, liveDid: did, savedModule: gw.moduleHash, liveModule: gw.moduleHash, listedNames: listed };
  assert.deepEqual(drift(base), []);
  // Another module.
  assert.match(drift({ ...base, liveModule: 'ff'.repeat(32) }).join(), /module hash/);
  // A method removed from the live gateway.
  const removed = did.replace(/^ {2}sendICP: [^\n]*\n/m, '');
  assert.notEqual(removed, did);
  assert.match(drift({ ...base, liveDid: removed }).join(), /in the reference, not on the gateway: sendICP/);
  // A method added to the live gateway.
  const added = did.replace(/service : \{\n/, 'service : {\n  newMethod: () -> (text) query;\n');
  assert.match(drift({ ...base, liveDid: added }).join(), /not in the reference: newMethod/);
  // A changed signature, same names.
  const changed = did.replace('sendICP: (to: principal, amount: nat64)', 'sendICP: (to: principal, amount: nat)');
  assert.notEqual(changed, did);
  assert.match(drift({ ...base, liveDid: changed }).join(), /candid text differs/);
});
