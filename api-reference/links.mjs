// Every external link in the generated pages answers 200 to a request with no credentials.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const pages = ['README.md', 'index.html'].map((f) => readFileSync(join(HERE, '..', 'docs', 'api', f), 'utf8'));
const urls = [...new Set(pages.flatMap((p) => [...p.matchAll(/https:\/\/[^\s"')<>\]]+/g)].map((m) => m[0])))].sort();
let bad = 0;
for (const url of urls) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'menese-sdk-link-check' } });
  console.log(res.status, url);
  if (res.status !== 200) bad++;
}
process.exit(bad ? 1 : 0);
