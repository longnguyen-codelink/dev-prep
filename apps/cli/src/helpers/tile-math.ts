import { MAPLIBRE_TILE_SIZE } from "./constants.ts";

export type View = { center: [number, number]; zoom: number; width: number; height: number };
export type TileCoord = { z: number; x: number; y: number };

/** The tiles MapLibre requests to fill a window of `width` x `height` CSS pixels (no extra buffer). */
export function tilesCoveringView(view: View): TileCoord[] {
  const z = Math.floor(view.zoom);
  const worldPixels = MAPLIBRE_TILE_SIZE * 2 ** view.zoom;
  const [lng, lat] = view.center;
  const sinLat = Math.sin((lat * Math.PI) / 180);

  // Web Mercator position of the view's center, in pixels from the world's top-left corner.
  const centerX = ((lng + 180) / 360) * worldPixels;
  const centerY = (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldPixels;

  const tilePixels = MAPLIBRE_TILE_SIZE * 2 ** (view.zoom - z); // size of one tile on screen
  const lastIndex = 2 ** z - 1;
  const x0 = Math.max(0, Math.floor((centerX - view.width / 2) / tilePixels));
  const x1 = Math.min(lastIndex, Math.floor((centerX + view.width / 2) / tilePixels));
  const y0 = Math.max(0, Math.floor((centerY - view.height / 2) / tilePixels));
  const y1 = Math.min(lastIndex, Math.floor((centerY + view.height / 2) / tilePixels));

  const tiles: TileCoord[] = [];
  for (let x = x0; x <= x1; x++) {
    for (let y = y0; y <= y1; y++) tiles.push({ z, x, y });
  }
  return tiles;
}
