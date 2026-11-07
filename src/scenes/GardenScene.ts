import Phaser from 'phaser';
import { GRASS_COLOR, TILE } from '../constants';
import gardenJson from '../data/maps/garden.json';
import { parseMap, type MapData } from '../logic/grid';
import { Player } from '../objects/Player';
import { buildTilemap } from '../objects/tilemap';

// Garden world: tilemap from the ASCII map plus the walking player.
export class GardenScene extends Phaser.Scene {
  private player!: Player;

  constructor() {
    super('Garden');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(GRASS_COLOR);
    const grid = parseMap(gardenJson as MapData);
    const { layer, widthInPixels, heightInPixels } = buildTilemap(this, grid);

    // Safety net in case the map forgets a border wall.
    this.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);

    const cx = (grid.spawn.col + 0.5) * TILE;
    const cy = (grid.spawn.row + 0.5) * TILE;
    this.player = new Player(this, cx, cy);
    this.physics.add.collider(this.player, layer);

    // Camera stops at map edges; roundPixels keeps the pixel grid steady.
    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.cameras.main.startFollow(this.player, true);
  }

  update(): void {
    this.player.update();
  }
}
