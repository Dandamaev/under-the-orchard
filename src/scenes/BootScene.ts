import Phaser from 'phaser';
import { TILE } from '../constants';
import { TILE_KINDS, type TileKind } from '../logic/grid';
import { TILESET_KEY } from '../objects/tilemap';

// Placeholder textures: [key, color]. Real art replaces these later.
const PLACEHOLDERS: ReadonlyArray<readonly [string, number]> = [
  ['grass', 0x5a8f3c],
  ['soil', 0x6b4a2b],
  ['player', 0xe0b050],
];

// Placeholder tile colors; strip order comes from TILE_KINDS.
const TILE_COLORS: Record<TileKind, number> = {
  grass: 0x5a8f3c,
  soil: 0x6b4a2b,
  wall: 0x7a7a82,
  tree: 0x2d5a27,
  mine_entrance: 0x15110d,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    for (const [key, color] of PLACEHOLDERS) {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, TILE, TILE);
      g.generateTexture(key, TILE, TILE);
    }

    // One 16x16 cell per tile kind, side by side.
    g.clear();
    TILE_KINDS.forEach((kind, i) => {
      g.fillStyle(TILE_COLORS[kind], 1);
      g.fillRect(i * TILE, 0, TILE, TILE);
    });
    g.generateTexture(TILESET_KEY, TILE * TILE_KINDS.length, TILE);
    g.destroy();

    this.scene.start('Garden');
    this.scene.launch('UI');
  }
}
