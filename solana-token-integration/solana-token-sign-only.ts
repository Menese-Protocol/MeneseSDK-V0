/**
 * MeneseSDK client-mode Solana token transfer.
 *
 * Flow:
 * 1. Browser reads mint.owner and decimals from Solana RPC.
 * 2. SDK canister derives canonical source/destination ATAs.
 * 3. SDK canister signs CreateATAIdempotent + TransferChecked.
 * 4. Browser broadcasts the signed transaction via Solana RPC.
 *
 * Deployed on the production SDK canister:
 * urs2a-ziaaa-aaaad-aembq-cai
 *
 * Pass an authenticated MeneseSDK actor created from your generated
 * declarations or @dfinity/agent setup:
 *
 * const actor = createActor("urs2a-ziaaa-aaaad-aembq-cai", { agent });
 * await signAndSendSolanaToken({ actor, mint, destOwner, amountBaseUnits });
 */

export const DEFAULT_SOLANA_RPC = "https://api.mainnet-beta.solana.com";
export const SPL_TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM_ID = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export type MeneseResult<T> = { ok: T } | { err: string };

export type MeneseSolanaTokenActor = {
  exp_deriveSolanaTokenTransferAccounts(
    destOwner: string,
    mint: string,
    tokenProgramId: string,
  ): Promise<MeneseResult<SolanaTokenTransferAccounts>> | MeneseResult<SolanaTokenTransferAccounts>;

  exp_signSplTransferSafeDerived(
    amount: bigint,
    decimals: number,
    destOwner: string,
    mint: string,
    tokenProgramId: string,
    recentBlockhash: string,
  ): Promise<MeneseResult<SignedSolTokenTransferTx>> | MeneseResult<SignedSolTokenTransferTx>;

  exp_signSplTransferSafeChecked?(
    amount: bigint,
    decimals: number,
    sourceAta: string,
    destAta: string,
    destOwner: string,
    mint: string,
    tokenProgramId: string,
    recentBlockhash: string,
  ): Promise<MeneseResult<SignedSolTokenTransferTx>> | MeneseResult<SignedSolTokenTransferTx>;
};

export type SolanaMintInfo = {
  mint: string;
  tokenProgramId: string;
  decimals: number;
};

export type SolanaTokenTransferAccounts = {
  signerAddress: string;
  sourceAta: string;
  destAta: string;
  destOwner: string;
  mint: string;
  tokenProgramId: string;
};

export type SignedSolTokenTransferTx = {
  signedTxBase64: string;
  signatureBase58: string;
  signerAddress: string;
  purpose: string;
  sourceAta: string;
  destAta: string;
  destOwner: string;
  mint: string;
  tokenProgramId: string;
};

export type SolanaTokenTransferResult = {
  signature: string;
  mintInfo: SolanaMintInfo;
  accounts: SolanaTokenTransferAccounts;
  signed: SignedSolTokenTransferTx;
};

async function solanaRpc<T>(rpcUrl: string, method: string, params: unknown[] = []): Promise<T> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: crypto.randomUUID(),
      method,
      params,
    }),
  });

  if (!response.ok) {
    throw new Error(`Solana RPC ${method} failed with HTTP ${response.status}`);
  }

  const json = await response.json();
  if (json.error) {
    throw new Error(`Solana RPC ${method} failed: ${json.error.message ?? JSON.stringify(json.error)}`);
  }
  return json.result as T;
}

function unwrap<T>(result: MeneseResult<T>, label: string): T {
  if ("ok" in result) return result.ok;
  throw new Error(`${label}: ${result.err}`);
}

export function assertSupportedTokenProgram(tokenProgramId: string) {
  if (tokenProgramId !== SPL_TOKEN_PROGRAM_ID && tokenProgramId !== TOKEN_2022_PROGRAM_ID) {
    throw new Error(`Unsupported token program: ${tokenProgramId}`);
  }
}

export function toBaseUnits(decimalAmount: string, decimals: number): bigint {
  const trimmed = decimalAmount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Amount must be a positive decimal string");
  }

  const [whole, fractional = ""] = trimmed.split(".");
  if (fractional.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimal places`);
  }

  const paddedFractional = fractional.padEnd(decimals, "0");
  return BigInt(`${whole}${paddedFractional}`.replace(/^0+(?=\d)/, ""));
}

export async function getSolanaMintInfo(
  mint: string,
  rpcUrl = DEFAULT_SOLANA_RPC,
): Promise<SolanaMintInfo> {
  const result = await solanaRpc<{
    value: null | {
      owner: string;
      data: {
        parsed?: {
          info?: {
            decimals?: number;
          };
        };
      };
    };
  }>(rpcUrl, "getParsedAccountInfo", [
    mint,
    { commitment: "confirmed", encoding: "jsonParsed" },
  ]);

  if (!result.value) throw new Error(`Mint account not found: ${mint}`);

  const tokenProgramId = result.value.owner;
  assertSupportedTokenProgram(tokenProgramId);

  const decimals = result.value.data.parsed?.info?.decimals;
  if (typeof decimals !== "number") {
    throw new Error(`Unable to read decimals for mint ${mint}`);
  }

  return { mint, tokenProgramId, decimals };
}

export async function getLatestBlockhash(rpcUrl = DEFAULT_SOLANA_RPC): Promise<string> {
  const result = await solanaRpc<{ value: { blockhash: string } }>(
    rpcUrl,
    "getLatestBlockhash",
    [{ commitment: "confirmed" }],
  );
  return result.value.blockhash;
}

export async function sendSignedSolanaTransaction(
  signedTxBase64: string,
  rpcUrl = DEFAULT_SOLANA_RPC,
): Promise<string> {
  return await solanaRpc<string>(rpcUrl, "sendTransaction", [
    signedTxBase64,
    {
      encoding: "base64",
      skipPreflight: false,
      maxRetries: 3,
      preflightCommitment: "confirmed",
    },
  ]);
}

export async function deriveSolanaTokenTransferAccounts(params: {
  actor: MeneseSolanaTokenActor;
  destOwner: string;
  mint: string;
  tokenProgramId: string;
}): Promise<SolanaTokenTransferAccounts> {
  const result = await params.actor.exp_deriveSolanaTokenTransferAccounts(
    params.destOwner,
    params.mint,
    params.tokenProgramId,
  );

  return unwrap(result, "derive token accounts");
}

export async function signSolanaTokenTransfer(params: {
  actor: MeneseSolanaTokenActor;
  amountBaseUnits: bigint;
  decimals: number;
  destOwner: string;
  mint: string;
  tokenProgramId: string;
  recentBlockhash: string;
}): Promise<SignedSolTokenTransferTx> {
  const result = await params.actor.exp_signSplTransferSafeDerived(
    params.amountBaseUnits,
    params.decimals,
    params.destOwner,
    params.mint,
    params.tokenProgramId,
    params.recentBlockhash,
  );

  return unwrap(result, "sign token transfer");
}

export async function signAndSendSolanaToken(params: {
  actor: MeneseSolanaTokenActor;
  rpcUrl?: string;
  mint: string;
  destOwner: string;
  amountBaseUnits: bigint;
}): Promise<SolanaTokenTransferResult> {
  const rpcUrl = params.rpcUrl ?? DEFAULT_SOLANA_RPC;

  const mintInfo = await getSolanaMintInfo(params.mint, rpcUrl);
  const accounts = await deriveSolanaTokenTransferAccounts({
    actor: params.actor,
    destOwner: params.destOwner,
    mint: params.mint,
    tokenProgramId: mintInfo.tokenProgramId,
  });

  const recentBlockhash = await getLatestBlockhash(rpcUrl);
  const signed = await signSolanaTokenTransfer({
    actor: params.actor,
    amountBaseUnits: params.amountBaseUnits,
    decimals: mintInfo.decimals,
    destOwner: params.destOwner,
    mint: params.mint,
    tokenProgramId: mintInfo.tokenProgramId,
    recentBlockhash,
  });

  const signature = await sendSignedSolanaTransaction(signed.signedTxBase64, rpcUrl);
  return { signature, mintInfo, accounts, signed };
}
