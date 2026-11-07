import Phaser from 'phaser';
import { GRASS_COLOR, TILE } from '../constants';
import gardenJson from '../data/maps/garden.json';
import { parseMap, type MapData } from '../logic/grid';
import { buildTilemap } from '../objects/tilemap';

// Garden world: tilemap from the ASCII map. Player and follow camera come next.
export class GardenScene extends Phaser.Scene {
  constructor() {
    super('Garden');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(GRASS_COLOR);
    const grid = parseMap(gardenJson as MapData);
    const { widthInPixels, heightInPixels } = buildTilemap(this, grid);

    // Temporary: static view on spawn (replaced by startFollow in step 4).
    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.cameras.main.centerOn((grid.spawn.col + 0.5) * TILE, (grid.spawn.row + 0.5) * TILE);
  }
}
