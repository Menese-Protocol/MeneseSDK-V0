#!/usr/bin/env bash
# Build the two wasm modules the client loads, reproducibly — Menese Team.
#
#   src/zk/prover-pkg/      the prover, from demo-frontend/prover-wasm in the ledger repository
#   src/zk/claim-scan-pkg/  the claim scanner, from claim-scan-wasm/ in this folder
#
# Usage: tools/build-wasm.sh <ledger repository checkout>
#
# rustc records absolute source paths inside a binary, and Cargo derives symbol hashes from each
# package's absolute path. So the sources are staged to one agreed path ($PRIVACY_SDK_CANONICAL_SRC,
# default /src) and every remaining machine path is remapped. Two builds staged this way produce
# byte-identical modules, and the modules carry no path of the machine that built them.
set -euo pipefail

LEDGER="${1:?usage: tools/build-wasm.sh <ledger repository checkout>}"
LEDGER="$(cd "$LEDGER" && pwd)"
SDK="$(cd "$(dirname "$0")/.." && pwd)"
CANON="${PRIVACY_SDK_CANONICAL_SRC:-/src}"
CARGO_HOME_DIR="${CARGO_HOME:-$HOME/.cargo}"

[ -f "$LEDGER/demo-frontend/prover-wasm/Cargo.toml" ] || { echo "$LEDGER is not the ledger repository" >&2; exit 2; }

EXPECT_RUSTC="1.95.0"
EXPECT_WASM_PACK="0.13.1"
EXPECT_WASM_OPT="123"
rustc_ver="$(rustc --version 2>/dev/null | awk '{print $2}')"
wp_ver="$(wasm-pack --version 2>/dev/null | awk '{print $2}')"
wo_ver="$(wasm-opt --version 2>/dev/null | awk '{print $3}')"
[ "$rustc_ver" = "$EXPECT_RUSTC" ]  || echo "WARNING: rustc $rustc_ver != pinned $EXPECT_RUSTC (output will differ)" >&2
[ "$wp_ver" = "$EXPECT_WASM_PACK" ] || echo "WARNING: wasm-pack $wp_ver != pinned $EXPECT_WASM_PACK (output will differ)" >&2
[ "$wo_ver" = "$EXPECT_WASM_OPT" ]  || echo "WARNING: wasm-opt $wo_ver != pinned $EXPECT_WASM_OPT (output will differ)" >&2

mkdir -p "$CANON" 2>/dev/null || { echo "cannot create $CANON; set PRIVACY_SDK_CANONICAL_SRC to a writable path (the path is part of the hash)" >&2; exit 2; }
[ -z "$(ls -A "$CANON")" ] || { echo "$CANON is not empty; the build stages into it and removes what it staged" >&2; exit 2; }
cleanup() { find "$CANON" -mindepth 1 -maxdepth 1 -exec rm -rf {} +; }
trap cleanup EXIT

# the prover links the ledger repository's circuit and vendored crates, which inherit from its Cargo
# workspace, and Cargo loads a workspace only with all of its members present: stage the repository
tar -C "$LEDGER" -cf - --exclude=target --exclude=pkg --exclude=.git --exclude=node_modules \
    --exclude=ceremony-launch-p14/final . | tar -x -C "$CANON"
tar -C "$SDK" -cf - --exclude=target --exclude=pkg claim-scan-wasm | tar -x -C "$CANON"

export RUSTFLAGS="--remap-path-prefix=$CANON=/src --remap-path-prefix=$CARGO_HOME_DIR=/cargo"
build() { # <crate dir under $CANON> <output dir>
  rm -rf "$2"
  (cd "$CANON/$1" && wasm-pack build --target web --release --out-dir "$2")
  rm -f "$2/.gitignore" "$2/package.json" "$2/README.md" "$2"/*.d.ts
}
build demo-frontend/prover-wasm "$SDK/src/zk/prover-pkg"
build claim-scan-wasm "$SDK/src/zk/claim-scan-pkg"

echo
for f in "$SDK"/src/zk/prover-pkg/*_bg.wasm "$SDK"/src/zk/claim-scan-pkg/*_bg.wasm; do
  echo "$(sha256sum "$f" | awk '{print $1}')  ${f#"$SDK"/}"
done
