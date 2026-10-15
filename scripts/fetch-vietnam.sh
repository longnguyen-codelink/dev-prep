#!/usr/bin/env bash
# Downloads the pinned Vietnam OSM extract into data/vietnam/ and verifies its md5.
# Resumable (keeps a .part file and continues with -C -) and idempotent.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST_DIR="$REPO_ROOT/data/vietnam"
NAME="vietnam-260101.osm.pbf"
URL="https://download.geofabrik.de/asia/${NAME}"

mkdir -p "$DEST_DIR"

md5_of() {
  if command -v md5sum >/dev/null 2>&1; then md5sum "$1" | cut -d' ' -f1; else md5 -q "$1"; fi
}

expected="$(curl -fsSL --retry 3 "$URL.md5" | cut -d' ' -f1)"
[ -n "$expected" ] || { echo "fetch: could not read the published md5" >&2; exit 1; }

if [ -s "$DEST_DIR/$NAME" ] && [ "$(md5_of "$DEST_DIR/$NAME")" = "$expected" ]; then
  echo "fetch: $NAME already present and verified, skipping"
  exit 0
fi

echo "fetch: downloading $NAME (~318 MB) from Geofabrik (resumable)"
curl -fL -C - --retry 10 --retry-all-errors --retry-delay 5 -o "$DEST_DIR/$NAME.part" "$URL"

actual="$(md5_of "$DEST_DIR/$NAME.part")"
if [ "$actual" != "$expected" ]; then
  echo "fetch: md5 mismatch (expected $expected, got $actual); keeping .part for inspection" >&2
  exit 1
fi

mv "$DEST_DIR/$NAME.part" "$DEST_DIR/$NAME"
echo "fetch: saved $DEST_DIR/$NAME ($(wc -c < "$DEST_DIR/$NAME") bytes), md5 verified"
echo "fetch: OpenStreetMap data (c) OpenStreetMap contributors, ODbL. Extract by Geofabrik."
