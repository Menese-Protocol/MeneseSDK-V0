// Copies the SDK source next to the example, as an app copies it (README "Install").
import { cpSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";

const from = process.env.PRIVACY_SDK_SRC ?? fileURLToPath(new URL("../../src", import.meta.url));
const to = fileURLToPath(new URL("./privacy", import.meta.url));
rmSync(to, { recursive: true, force: true });
cpSync(from, to, { recursive: true });
console.log(`copied ${from} to ${to}`);
