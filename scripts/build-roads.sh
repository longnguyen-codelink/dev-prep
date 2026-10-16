#!/usr/bin/env bash
# Builds a roads GeoJSON for one area: filter highways from the Vietnam PBF, clip with a
# boundary polygon, export to GeoJSON, then link it into src/data/. Times every step.
# Needs osmium and ogr2ogr: run it inside the dev container.
# Usage: scripts/build-roads.sh <boundary.geojson> <name>
#   e.g. scripts/build-roads.sh data/hcmc-boundary.geojson hcmc-roads
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
INPUT="$REPO_ROOT/data/vietnam/vietnam-260101.osm.pbf"

[ $# -eq 2 ] || { echo "usage: $0 <boundary.geojson> <name>" >&2; exit 2; }
BOUNDARY="$1"
NAME="$2"
[ -f "$BOUNDARY" ] || { echo "build: boundary not found: $BOUNDARY" >&2; exit 1; }
[ -s "$INPUT" ] || { echo "build: missing $INPUT (run scripts/fetch-vietnam.sh)" >&2; exit 1; }
for tool in osmium ogr2ogr; do
  command -v "$tool" >/dev/null 2>&1 || { echo "build: $tool is not installed" >&2; exit 1; }
done

HIGHWAYS="$REPO_ROOT/data/vn-highways.osm.pbf"
CLIPPED="$REPO_ROOT/data/$NAME.osm.pbf"
OUTPUT="$REPO_ROOT/data/$NAME.geojson"
LINK="$REPO_ROOT/src/data/$NAME.geojson"

step() {
  local label="$1"; shift
  local start end
  start="$(date +%s)"
  "$@"
  end="$(date +%s)"
  echo "build: $label took $((end - start))s"
}
nonempty() { [ -s "$1" ] || { echo "build: step produced no output: $1" >&2; exit 1; }; }

total_start="$(date +%s)"

step "filter highways" osmium tags-filter "$INPUT" w/highway -o "$HIGHWAYS" --overwrite
nonempty "$HIGHWAYS"

step "clip to $(basename "$BOUNDARY")" osmium extract -p "$BOUNDARY" "$HIGHWAYS" -o "$CLIPPED" --overwrite
nonempty "$CLIPPED"

rm -f "$OUTPUT"
step "export geojson" ogr2ogr -f GeoJSON -lco RFC7946=YES "$OUTPUT" "$CLIPPED" lines
nonempty "$OUTPUT"

# ogr2ogr writes one feature per line, so counting lines is cheap even for a huge file.
features="$(grep -c '^{ "type": "Feature"' "$OUTPUT" || true)"
[ "$features" -gt 0 ] || { echo "build: no features in $OUTPUT" >&2; exit 1; }

mkdir -p "$REPO_ROOT/src/data"
ln -sfn "../../data/$NAME.geojson" "$LINK"

total_end="$(date +%s)"
echo "build: $NAME: $features features, $(wc -c < "$OUTPUT") bytes"
echo "build: total $((total_end - total_start))s, linked into src/data/$NAME.geojson"
