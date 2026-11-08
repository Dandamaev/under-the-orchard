import Phaser from 'phaser';
import { TILE } from '../constants';
import { grassVariant, SOLID_KINDS, TILE_KINDS, type Grid } from '../logic/grid';

export const TILESET_KEY = 'tiles';
export const GARDEN_TILES_KEY = 'tiles_garden';

// Frames of tiles_garden.png used as grass; variant 0 is the plain one.
export const GRASS_FRAMES: readonly number[] = [1, 0, 7];
// Frame of tiles_garden.png drawn for each kind; kinds missing here stay colored placeholders.
export const KIND_FRAMES: Partial<Record<(typeof TILE_KINDS)[number], number>> = {
  grass: GRASS_FRAMES[0],
  soil: 2,
  soil_tilled: 4,
  soil_watered: 5,
  // The mine entrance sprite is drawn over plain grass.
  mine_entrance: GRASS_FRAMES[0],
  mine_roof: GRASS_FRAMES[0],
};

// Tileset layout: one slot per TILE_KINDS, then extra grass variants (variant v>=1 -> slot KINDS+v-1).
export const TILESET_SLOTS = TILE_KINDS.length + GRASS_FRAMES.length - 1;

export interface BuiltTilemap {
  map: Phaser.Tilemaps.Tilemap;
  layer: Phaser.Tilemaps.TilemapLayer;
  widthInPixels: number;
  heightInPixels: number;
}

function tileIndex(kind: (typeof TILE_KINDS)[number], col: number, row: number): number {
  const base = TILE_KINDS.indexOf(kind);
  if (kind !== 'grass') return base;
  const v = grassVariant(col, row, GRASS_FRAMES.length);
  return v === 0 ? base : TILE_KINDS.length + v - 1;
}

// Grid -> Phaser tilemap. Solid indices come from SOLID_KINDS only (variants are grass).
export function buildTilemap(scene: Phaser.Scene, grid: Grid): BuiltTilemap {
  const data = grid.cells.map((line, row) => line.map((kind, col) => tileIndex(kind, col, row)));
  const map = scene.make.tilemap({ data, tileWidth: TILE, tileHeight: TILE });
  const tileset = map.addTilesetImage(TILESET_KEY, TILESET_KEY, TILE, TILE, 0, 0);
  if (!tileset) throw new Error(`Tileset texture '${TILESET_KEY}' is missing`);
  const layer = map.createLayer(0, tileset, 0, 0);
  if (!layer) throw new Error('Failed to create tilemap layer');

  const solid = SOLID_KINDS.map((kind) => TILE_KINDS.indexOf(kind));
  layer.setCollision(solid);

  return { map, layer, widthInPixels: map.widthInPixels, heightInPixels: map.heightInPixels };
}
