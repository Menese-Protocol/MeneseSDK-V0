// The gateway's API reference, drawn from its candid. Pure functions only: generate.mjs writes the pages,
// check.mjs compares them with the live canister, lib.test.mjs tests both.

/** Splits candid text at each `;` that closes a member at bracket depth 0. */
export function splitTop(text) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of text) {
    if (ch === '(' || ch === '{') depth++;
    if (ch === ')' || ch === '}') depth--;
    if (ch === ';' && depth === 0) {
      out.push(cur.replace(/\s+/g, ' ').trim());
      cur = '';
    } else cur += ch;
  }
  return out.filter(Boolean);
}

const stripComments = (did) => did.replace(/\/\/[^\n]*/g, '');

/** Every method of the candid's service: name, arguments, answer (named types written out two levels deep) and
 *  whether it is a query. Sorted by name. */
export function methodsOf(didText) {
  const did = stripComments(didText);
  const at = did.indexOf('service :');
  if (at < 0) throw new Error('no service in the candid');
  const types = new Map(
    splitTop(did.slice(0, at))
      .filter((t) => t.startsWith('type '))
      .map((t) => {
        const eq = t.indexOf('=');
        return [t.slice(5, eq).trim(), t.slice(eq + 1).trim()];
      }),
  );
  const expand = (text, depth) =>
    depth === 0 ? text : text.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (w) => (types.has(w) ? expand(types.get(w), depth - 1) : w));
  const open = did.indexOf('{', at);
  return splitTop(did.slice(open + 1, did.lastIndexOf('}')))
    .map((m) => {
      const colon = m.indexOf(':');
      const name = m.slice(0, colon).trim();
      const sig = m.slice(colon + 1).trim();
      const arrow = sig.lastIndexOf('->');
      const args = sig.slice(0, arrow).trim().replace(/^\(|\)$/g, '');
      const rest = sig.slice(arrow + 2).trim();
      const mode = / (composite_query|query)$/.exec(rest)?.[1] ?? 'update';
      const returns = rest.replace(/ (composite_query|query)$/, '').trim().replace(/^\(|\)$/g, '');
      return { name, args: expand(args, 1), returns: expand(returns, 2), query: mode !== 'update' };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The SDK's own grouping of the methods (ai-agents/references/api-surface.md): each `### Heading` and the method
 *  names in the code block under it. The cost notes in brackets are left out of the heading. */
export function categoriesOf(surfaceMd) {
  const byMethod = new Map();
  const order = [];
  let heading = null;
  let inCode = false;
  for (const line of surfaceMd.split('\n')) {
    const h = /^###\s+(.+?)\s*$/.exec(line);
    if (h) {
      heading = h[1].replace(/\s*\([^)]*\)\s*$/, '').replace(/\s+--\s+/g, ' · ').trim();
      if (!order.includes(heading)) order.push(heading);
      continue;
    }
    if (line.startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    const m = inCode && heading ? /^([A-Za-z_]\w*)\s*:/.exec(line) : null;
    if (m && !byMethod.has(m[1])) byMethod.set(m[1], heading);
  }
  return { byMethod, order };
}

export const OTHER = 'Other calls';
export const CONTROLLERS = 'Gateway controllers only';
export const REFUSED = 'Not available';

/** Each method with its group, cost and availability. */
export function referenceOf(didText, surfaceMd, facts) {
  const { byMethod, order } = categoriesOf(surfaceMd);
  const charged = new Set(facts.uses_action);
  const controllers = new Set(facts.controllers_only);
  const methods = methodsOf(didText).map((m) => {
    const availability = controllers.has(m.name) ? 'controllers' : m.name in facts.refused ? 'refused' : 'everyone';
    // The SDK's group; a method it does not list yet: the group methods-source.json names, or for an exp_ method the
    // SDK's group of exp_ methods.
    const exp = order.find((g) => g.includes('exp_'));
    const sdkGroup = byMethod.get(m.name) ?? facts.groups?.[m.name] ?? (m.name.startsWith('exp_') && exp ? exp : undefined);
    const group = availability === 'controllers' ? CONTROLLERS : availability === 'refused' ? REFUSED : sdkGroup ?? OTHER;
    return {
      ...m,
      group: group === CONTROLLERS || group === REFUSED || !/admin|controller|debug|test/i.test(sdkGroup ?? '') ? group : OTHER,
      cost: charged.has(m.name) ? 'one action' : 'no action',
      availability,
      note: facts.refused[m.name] ?? facts.notes[m.name] ?? null,
    };
  });
  const groups = [...order.filter((g) => !/admin|controller|debug|test/i.test(g)), OTHER, REFUSED, CONTROLLERS].filter((g) =>
    methods.some((m) => m.group === g),
  );
  return { methods, groups };
}

/** What moved between the saved gateway and the live one: module hash, candid text, the method list. Empty = same. */
export function drift({ savedDid, liveDid, savedModule, liveModule, listedNames }) {
  const out = [];
  if (savedModule !== liveModule) out.push(`module hash ${savedModule} -> ${liveModule}`);
  if (savedDid !== liveDid) out.push('candid text differs from gateway.did');
  const live = methodsOf(liveDid).map((m) => m.name);
  const listed = new Set(listedNames);
  const missing = live.filter((n) => !listed.has(n));
  const extra = [...listed].filter((n) => !live.includes(n));
  if (missing.length) out.push(`not in the reference: ${missing.join(', ')}`);
  if (extra.length) out.push(`in the reference, not on the gateway: ${extra.join(', ')}`);
  return out;
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const mdCell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function markdownOf(ref, gw) {
  const lines = [
    '# Menese signing gateway: API reference',
    '',
    `Every public method of the gateway canister \`${gw.canister}\`, generated from its live candid interface.`,
    '',
    `- Module \`${gw.moduleHash}\`, candid sha256 \`${gw.candidSha256}\`, read ${gw.readAt}.`,
    `- ${ref.methods.length} methods. Each call either uses one action of the caller's plan or none (\`getGatewayPricing\` lists the plans).`,
    '- Methods reserved to the gateway\'s controllers, and methods the gateway refuses for every caller, are listed apart at the end.',
    '- Regenerate and check: [`api-reference/`](../../api-reference/README.md).',
    '',
    '## Groups',
    '',
    ...ref.groups.map((g) => `- [${g}](#${anchor(g)}) (${ref.methods.filter((m) => m.group === g).length})`),
    '',
  ];
  for (const g of ref.groups) {
    lines.push(`## ${g}`, '', '| Method | Kind | Cost | Arguments | Answer |', '|---|---|---|---|---|');
    for (const m of ref.methods.filter((x) => x.group === g)) {
      const name = m.note ? `\`${m.name}\`<br>${mdCell(m.note)}` : `\`${m.name}\``;
      lines.push(`| ${name} | ${m.query ? 'query' : 'update'} | ${m.availability === 'everyone' ? m.cost : '–'} | \`${mdCell(m.args || '()')}\` | \`${mdCell(m.returns || '()')}\` |`);
    }
    lines.push('');
  }
  return lines.join('\n');
}

export const anchor = (g) => g.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function htmlOf(ref, gw) {
  const rows = (g) =>
    ref.methods
      .filter((m) => m.group === g)
      .map(
        (m) => `<li id="${esc(m.name)}" data-name="${esc(m.name.toLowerCase())}"><div class="top"><a href="#${esc(m.name)}"><code>${esc(m.name)}</code></a>` +
          `<span class="tag">${m.query ? 'query' : 'update'}</span>${m.availability === 'everyone' ? `<span class="tag ${m.cost === 'one action' ? 'paid' : ''}">${m.cost}</span>` : ''}</div>` +
          `<pre>(${esc(m.args)}) → ${esc(m.returns || '()')}</pre>${m.note ? `<p>${esc(m.note)}</p>` : ''}</li>`,
      )
      .join('\n');
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Menese signing gateway: API reference</title>
<meta name="description" content="Every public method of the Menese signing gateway, generated from its live candid interface.">
<style>
:root { --bg: #fbfaf7; --fg: #1d1b18; --dim: #6b655c; --line: #e4dfd5; --card: #ffffff; --accent: #7a2e2e; }
@media (prefers-color-scheme: dark) { :root { --bg: #15130f; --fg: #ece7de; --dim: #a39c90; --line: #2e2a24; --card: #1d1a16; --accent: #e0a35a; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 15px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
main { max-width: 980px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 26px; margin: 0 0 8px; } h2 { font-size: 19px; margin: 32px 0 8px; }
p, li { overflow-wrap: anywhere; } .dim { color: var(--dim); }
code, pre { font: 13px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace; }
pre { white-space: pre-wrap; overflow-wrap: anywhere; margin: 6px 0 0; color: var(--dim); }
ul.calls { list-style: none; padding: 0; margin: 0; border: 1px solid var(--line); border-radius: 10px; background: var(--card); }
ul.calls li { padding: 12px 14px; border-top: 1px solid var(--line); } ul.calls li:first-child { border-top: 0; }
ul.calls p { margin: 6px 0 0; }
.top { display: flex; flex-wrap: wrap; gap: 8px; align-items: baseline; }
.top a { color: var(--fg); text-decoration: none; } .top a code { font-weight: 600; }
.tag { font-size: 12px; color: var(--dim); border: 1px solid var(--line); border-radius: 999px; padding: 0 8px; }
.tag.paid { color: var(--accent); border-color: currentColor; }
input[type=search] { width: 100%; font: inherit; padding: 10px 12px; border: 1px solid var(--line); border-radius: 8px; background: var(--card); color: var(--fg); margin: 16px 0 4px; }
nav a { color: var(--accent); } a { color: var(--accent); }
</style>
</head>
<body>
<main>
<h1>Menese signing gateway: API reference</h1>
<p>Every public method of the gateway canister <code>${esc(gw.canister)}</code>, generated from its live candid interface: module <code>${esc(gw.moduleHash.slice(0, 16))}…</code>, read ${esc(gw.readAt)}.</p>
<p class="dim">${ref.methods.length} methods. Each call either uses one action of the caller's plan or none (<a href="#getGatewayPricing"><code>getGatewayPricing</code></a> lists the plans). Methods reserved to the gateway's controllers, and methods the gateway refuses for every caller, are listed apart at the end.</p>
<nav><p>${ref.groups.map((g) => `<a href="#${anchor(g)}">${esc(g)}</a>`).join(' · ')}</p></nav>
<label><span class="dim">Find a method</span><input type="search" id="find" placeholder="sendICP, getMyIcrcWallet, swap…" autocomplete="off" spellcheck="false"></label>
${ref.groups.map((g) => `<h2 id="${anchor(g)}">${esc(g)}</h2>\n<ul class="calls">\n${rows(g)}\n</ul>`).join('\n')}
<p class="dim">Source: <a href="https://github.com/Menese-Protocol/MeneseSDK-V0">Menese SDK</a> · <a href="https://dashboard.internetcomputer.org/canister/${esc(gw.canister)}">the gateway canister</a></p>
</main>
<script>
const find = document.getElementById('find');
find.addEventListener('input', () => {
  const words = find.value.toLowerCase().split(/\\s+/).filter(Boolean);
  for (const li of document.querySelectorAll('ul.calls li')) li.hidden = !words.every((w) => li.dataset.name.includes(w));
  for (const ul of document.querySelectorAll('ul.calls')) {
    const shown = [...ul.children].some((li) => !li.hidden);
    ul.hidden = !shown; ul.previousElementSibling.hidden = !shown;
  }
});
</script>
</body>
</html>
`;
}
