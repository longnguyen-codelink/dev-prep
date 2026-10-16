#!/usr/bin/env bash
# Copies the MapLibre files the page needs from node_modules into src/vendor/.
# MapLibre 6 is ESM-only: the main module loads the worker module from its own folder,
# so both .mjs files must sit side by side.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SRC_DIR="$REPO_ROOT/node_modules/maplibre-gl/dist"
DEST_DIR="$REPO_ROOT/src/vendor"
FILES=(maplibre-gl.mjs maplibre-gl-worker.mjs maplibre-gl.css)

[ -d "$SRC_DIR" ] || { echo "vendor: $SRC_DIR not found (run: pnpm install)" >&2; exit 1; }

mkdir -p "$DEST_DIR"
for f in "${FILES[@]}"; do
  [ -s "$SRC_DIR/$f" ] || { echo "vendor: missing or empty $SRC_DIR/$f" >&2; exit 1; }
  cp "$SRC_DIR/$f" "$DEST_DIR/$f"
  [ -s "$DEST_DIR/$f" ] || { echo "vendor: copy failed for $f" >&2; exit 1; }
done

version="$(grep -m1 '"version"' "$REPO_ROOT/node_modules/maplibre-gl/package.json" | sed 's/[^0-9.]//g')"
echo "vendor: copied ${#FILES[@]} files from maplibre-gl $version into src/vendor/"
ls -la "$DEST_DIR" | tail -n +2
