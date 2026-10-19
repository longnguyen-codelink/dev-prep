#!/usr/bin/env bash
# Checks every tool exists, then runs the pipeline end to end on the small Monaco fixture.
# Exits non-zero on the first problem.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FIXTURE="$REPO_ROOT/tmp/data/monaco-latest.osm.pbf"

fail() { echo "FAIL: $*" >&2; exit 1; }

echo "== tools =="
for tool in git jq pnpm http-server tippecanoe tile-join osmium ogr2ogr ogrinfo claude; do
  command -v "$tool" >/dev/null 2>&1 || fail "$tool is not installed"
done
echo "git:         $(git --version)"
echo "jq:          $(jq --version)"
echo "pnpm:        $(pnpm --version)"
echo "http-server: $(http-server --version)"
echo "tippecanoe:  $(tippecanoe --version 2>&1 | head -1)"
echo "osmium:      $(osmium --version | head -1)"
echo "gdal:        $(ogr2ogr --version)"
echo "claude:      $(claude --version | head -1)"
ogrinfo --formats | grep -q 'OSM -vector-' || fail "GDAL has no OSM driver"

echo "== pipeline smoke test (Monaco) =="
[ -s "$FIXTURE" ] || fail "missing $FIXTURE (run: bash .devcontainer/commands/init.sh)"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

osmium tags-filter "$FIXTURE" w/highway -o "$work/highways.osm.pbf"
[ -s "$work/highways.osm.pbf" ] || fail "tags-filter produced no output"

osmium extract -b 7.40,43.72,7.45,43.76 "$work/highways.osm.pbf" -o "$work/clipped.osm.pbf"
[ -s "$work/clipped.osm.pbf" ] || fail "extract produced no output"

ogr2ogr -f GeoJSON "$work/roads.geojson" "$work/clipped.osm.pbf" lines
count="$(jq '.features | length' "$work/roads.geojson")"
[ "$count" -gt 0 ] || fail "GeoJSON has no road features"
echo "roads exported: $count features"

tippecanoe -q -Z10 -z14 --force -l roads -o "$work/roads.pmtiles" "$work/roads.geojson"
[ -s "$work/roads.pmtiles" ] || fail "tippecanoe produced no output"
echo "pmtiles built: $(wc -c < "$work/roads.pmtiles") bytes"

echo "OK: all tools present and the pipeline ran end to end"
