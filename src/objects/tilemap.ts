import Phaser from 'phaser';
import { TILE } from '../constants';
import { SOLID_KINDS, TILE_KINDS, type Grid } from '../logic/grid';

export const TILESET_KEY = 'tiles';

export interface BuiltTilemap {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
  widthInPixels: number;
  heightInPixels: number;
}

// Grid -> Phaser tilemap. Tile index == index in TILE_KINDS (matches the strip).
export function buildTilemap(scene: Phaser.Scene, grid: Grid): BuiltTilemap {
  const data = grid.cells.map((row) => row.map((kind) => TILE_KINDS.indexOf(kind)));
  const map = scene.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
  const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE, TILE, 0, 0);
  if (!tileset) throw new Error(`Tileset texture '${TILESET_KEY}' is missing`);
  const layer = map.createLayer(0, tileset, 0, 0);
  if (!layer) throw new Error('Failed to create tilemap layer');

  // Collision is ready for the player (step 3); nothing collides yet.
  const solid = SOLID_KINDS.map((kind) => TILE_KINDS.indexOf(kind));
  layer.setCollision(solid);

  return { map, layer, widthInPixels: map.widthInPixels, heightInPixels: map.heightInPixels };
}
