#!/usr/bin/env bash
# Runs once inside the container (postCreateCommand). Idempotent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DATA_DIR="$REPO_ROOT/tmp/data"
FIXTURE_NAME="monaco-latest.osm.pbf"
FIXTURE_URL="https://download.geofabrik.de/europe/${FIXTURE_NAME}"

echo "init: marking $REPO_ROOT as a safe git directory"
git config --global --add safe.directory "$REPO_ROOT"

mkdir -p "$DATA_DIR"

# The pnpm-store named volume is mounted at this path (see devcontainer.json).
# Docker creates it root-owned; hand it to the current user, then point pnpm at it.
PNPM_STORE_DIR="/opt/pnpm/store"
if [ -d "$PNPM_STORE_DIR" ]; then
  if [ ! -w "$PNPM_STORE_DIR" ]; then
    echo "init: making $PNPM_STORE_DIR writable for $(id -un)"
    sudo -n chown "$(id -u):$(id -g)" "$PNPM_STORE_DIR"
  fi
  pnpm config set store-dir "$PNPM_STORE_DIR" --global
  echo "init: pnpm store is $(pnpm store path)"
fi

# The claude-code devcontainer feature npm-installs as root into the vite-plus Node
# prefix, so Claude Code's auto-updater can't write there. Hand the package scope to
# the current user.
if CLAUDE_BIN="$(command -v claude)"; then
  CLAUDE_SCOPE_DIR="$(dirname "$(dirname "$(dirname "$(readlink -f "$CLAUDE_BIN")")")")"
  if [ "$(basename "$CLAUDE_SCOPE_DIR")" = "@anthropic-ai" ] && [ ! -w "$CLAUDE_SCOPE_DIR" ]; then
    echo "init: making $CLAUDE_SCOPE_DIR writable for $(id -un)"
    sudo -n chown -R "$(id -u):$(id -g)" "$CLAUDE_SCOPE_DIR"
  fi
fi

if [ -s "$DATA_DIR/$FIXTURE_NAME" ]; then
  echo "init: $FIXTURE_NAME already present, skipping download"
  exit 0
fi

echo "init: downloading $FIXTURE_NAME (small smoke-test fixture, ~0.7 MB)"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

curl -fsSL --retry 3 -o "$tmp/$FIXTURE_NAME" "$FIXTURE_URL"
curl -fsSL --retry 3 -o "$tmp/$FIXTURE_NAME.md5" "$FIXTURE_URL.md5"

# Integrity check against the checksum Geofabrik publishes next to the file.
(cd "$tmp" && md5sum -c "$FIXTURE_NAME.md5")

mv "$tmp/$FIXTURE_NAME" "$DATA_DIR/$FIXTURE_NAME"
echo "init: saved $DATA_DIR/$FIXTURE_NAME"
echo "init: OpenStreetMap data (c) OpenStreetMap contributors, ODbL. Extract by Geofabrik."
