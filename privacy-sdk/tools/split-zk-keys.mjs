// Copy the ceremony keyset into the directory an app serves its keys from, and split each proving key into
// 1 MiB parts with a `<name>.parts.json` index (see fetchLarge in src/zk/keyset.js).
// The whole files are copied too. The app checks the joined bytes against SETUP-MANIFEST.json and
// the ledger's certified verifying-key anchor, so the parts carry no trust of their own.
//
//   node tools/split-zk-keys.mjs <keyset dir> <out dir>
//
// The keyset is published in the ledger repository under ceremony-launch-p14/final/.
import { createHash } from "node:crypto";
import { copyFileSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const PART_BYTES = 1024 * 1024;
const FILES = ["SETUP-MANIFEST.json", "transfer_pk.bin", "deposit_pk.bin", "transfer_vk.hex", "deposit_vk.hex"];
const LARGE = ["transfer_pk.bin", "deposit_pk.bin"];

const source = process.argv[2];
const target = process.argv[3];
if (!source || !target) {
  console.error("usage: node tools/split-zk-keys.mjs <keyset dir> <out dir>");
  process.exit(1);
}
const out = resolve(target);
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const manifest = JSON.parse(readFileSync(join(source, "SETUP-MANIFEST.json"), "utf8"));
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");

for (const name of FILES) copyFileSync(join(source, name), join(out, name));

for (const name of LARGE) {
  const bytes = readFileSync(join(source, name));
  const field = name.replace(".bin", "_sha256");
  if (sha256(bytes) !== manifest[field]) throw new Error(`${name} does not match the manifest's ${field}`);
  const parts = [];
  for (let offset = 0, i = 0; offset < bytes.length; offset += PART_BYTES, i++) {
    const part = `${name}.${String(i).padStart(3, "0")}`;
    writeFileSync(join(out, part), bytes.subarray(offset, offset + PART_BYTES));
    parts.push(part);
  }
  writeFileSync(join(out, `${name}.parts.json`), JSON.stringify({ size: bytes.length, parts }) + "\n");
  // the parts must join back to the manifest hash before anything is published
  const joined = Buffer.concat(parts.map((part) => readFileSync(join(out, part))));
  if (sha256(joined) !== manifest[field]) throw new Error(`${name}: parts do not join back to the manifest hash`);
  console.log(`${name}: ${bytes.length} bytes in ${parts.length} parts, joined hash matches the manifest`);
}
console.log(`wrote ${readdirSync(out).length} files to ${out}`);
