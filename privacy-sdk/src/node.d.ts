// Types for node.js (the engine in Node). This file names no Node types, so a browser project that
// type-checks src/ is not affected by it.
import type { PrivateEngine, ZkNetwork } from "./engine/core";
import type { ReceiptCheck } from "./receipt";
import type { Receipt } from "./types";

export interface NodeEngineOptions {
  /// Folder for the encrypted note cache; omit to keep nothing on disk.
  cacheDir?: string;
  /// Folder with the proving keys (tools/split-zk-keys.mjs output); needed only for actions that prove.
  keysDir?: string;
  /// Claim scan worker threads (default: from the machine's cores).
  scanWorkers?: number;
}

export declare function createNodeEngine(network: ZkNetwork, identity: any, options?: NodeEngineOptions): PrivateEngine;
export declare function checkReceipt(receipt: Receipt | string, network?: ZkNetwork, options?: { proverWasm?: Uint8Array }): Promise<ReceiptCheck>;
export declare function verifyReceipt(receipt: Receipt | string, network?: ZkNetwork, options?: { proverWasm?: Uint8Array }): Promise<boolean>;
export declare function fileStore(dir: string): { get(k: string): Promise<any>; set(k: string, v: any): Promise<void>; delete(k: string): Promise<void> };
export declare function folderFetch(dir: string): typeof fetch;
export declare const nodeProverWorker: () => any;
export declare const nodeScanWorker: () => any;
export declare function readProverWasm(): Promise<Uint8Array>;
export declare function readScanWasm(): Promise<Uint8Array>;
