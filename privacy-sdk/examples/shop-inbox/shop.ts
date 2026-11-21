// A shop's payment inbox. It holds the shop's own identity, keeps its orders in orders.json, and
// marks an order paid when a private payment with that order id arrives in the shop's private
// balance, for at least the order's price. Each paid order gets a receipt in receipts/, which
// anyone can check with `npm run verify receipts/<order>.json`.
//
//   npm run start            mainnet, the shop identity in shop-identity.json (created on first run)
//
// Environment: SHOP_DIR (orders.json, receipts/, the cache and the identity; default this folder),
// ZK_KEYS (the proving keys' folder, from tools/split-zk-keys.mjs; needed to claim payments),
// NETWORK (a JSON file with a network object; default mainnet), POLL_MS (default 15000).
import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from "node:fs";
import { join } from "node:path";
import { Ed25519KeyIdentity } from "@dfinity/identity";
import { createNodeEngine } from "./privacy/node.js";
import { mainnet } from "./privacy/mainnet";
import { formatIcp } from "./privacy/types";
import type { ReceivedPayment } from "./privacy/types";

const dir = process.env.SHOP_DIR ?? import.meta.dirname;
const network = process.env.NETWORK ? JSON.parse(readFileSync(process.env.NETWORK, "utf8")) : mainnet("/zk-keys");
const pollMs = Number(process.env.POLL_MS ?? 15_000);
const ZK_KEYS_SET = Boolean(process.env.ZK_KEYS);

// ---- the shop's own identity (keep this file secret: it controls the shop's private balance) ----
const identityFile = join(dir, "shop-identity.json");
if (!existsSync(identityFile)) writeFileSync(identityFile, JSON.stringify(Ed25519KeyIdentity.generate().toJSON()), { mode: 0o600 });
const identity = Ed25519KeyIdentity.fromJSON(readFileSync(identityFile, "utf8"));

// ---- orders: { "<order id>": { priceE8s, status, reference?, paidE8s?, paidAt? } } ----
type Order = { priceE8s: string; status: "open" | "paid" | "underpaid"; reference?: string; paidE8s?: string; paidAt?: string };
const ordersFile = join(dir, "orders.json");
const loadOrders = (): Record<string, Order> => JSON.parse(readFileSync(ordersFile, "utf8"));
const saveOrders = (orders: Record<string, Order>) => {
  writeFileSync(`${ordersFile}.tmp`, JSON.stringify(orders, null, 2));
  renameSync(`${ordersFile}.tmp`, ordersFile);
};
const log = (event: string, fields: object = {}) => console.log(JSON.stringify({ at: new Date().toISOString(), event, ...fields }));

const engine = createNodeEngine(network, identity, { cacheDir: join(dir, "cache"), keysDir: process.env.ZK_KEYS });
await engine.open();
await engine.enable(); // once: from now on payments arrive straight into the private balance
log("open", { shop: identity.getPrincipal().toText() });

// Called once per payment that is in the shop's private balance (and again for each after a
// restart), so it must be safe to repeat: an order already paid stays paid.
engine.onPayment(async (p: ReceivedPayment) => {
  const id = typeof p.orderId === "string" ? p.orderId : null;
  const orders = loadOrders();
  const order = id === null ? undefined : orders[id];
  if (!order) return log("payment without a known order", { reference: p.reference, amount: formatIcp(p.amountE8s), orderId: id });
  if (order.status === "paid") return;
  if (p.amountE8s < BigInt(order.priceE8s)) {
    orders[id!] = { ...order, status: "underpaid", reference: p.reference, paidE8s: String(p.amountE8s) };
    saveOrders(orders);
    return log("underpaid", { orderId: id, reference: p.reference, amount: formatIcp(p.amountE8s), price: formatIcp(BigInt(order.priceE8s)) });
  }
  orders[id!] = { ...order, status: "paid", reference: p.reference, paidE8s: String(p.amountE8s), paidAt: new Date(p.receivedAt).toISOString() };
  saveOrders(orders);
  // the receipt: this payment's opening, for a dispute; it shows nothing else
  mkdirSync(join(dir, "receipts"), { recursive: true });
  writeFileSync(join(dir, "receipts", `${id}.json`), JSON.stringify(await engine.receipt(p.reference), null, 2));
  log("paid", { orderId: id, reference: p.reference, amount: formatIcp(p.amountE8s) });
});

let stopping = false;
const stop = () => {
  stopping = true;
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);

while (!stopping) {
  try {
    const snap = await engine.sync();
    // payments sent before the shop turned on private balance wait to be claimed; claiming moves
    // them into the private balance, and onPayment then reports them
    for (const p of snap.received.filter((x: ReceivedPayment) => x.status === "claimable")) {
      if (!ZK_KEYS_SET) {
        log("claimable payment waiting (set ZK_KEYS to claim it)", { reference: p.reference });
        continue;
      }
      log("claiming", { reference: p.reference });
      await engine.claim(p.claimId!, () => {});
    }
    log("synced", { private: formatIcp(snap.privateE8s), payments: snap.received.length });
  } catch (e) {
    log("error", { message: (e as Error).message });
  }
  for (let waited = 0; waited < pollMs && !stopping; waited += 250) await new Promise((r) => setTimeout(r, 250));
}
engine.close();
log("stopped");
