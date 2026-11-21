// Checks a payment receipt the way a third party would: no identity, no keys, anonymous reads.
//   npm run verify receipts/ORD-10023.json
import { readFileSync } from "node:fs";
import { checkReceipt } from "./privacy/node.js";
import { mainnet } from "./privacy/mainnet";
import { formatIcp } from "./privacy/types";

const network = process.env.NETWORK ? JSON.parse(readFileSync(process.env.NETWORK, "utf8")) : mainnet("/zk-keys");
const check = await checkReceipt(readFileSync(process.argv[2], "utf8"), network);
if (check.valid) {
  const p = check.payment;
  console.log(`valid: ${formatIcp(p.amountE8s)} ICP to ${p.recipient}, order ${p.orderId ?? "(none)"}, reference ${p.reference}`);
} else {
  console.log(`not valid: ${check.reason}`);
  process.exitCode = 1;
}
