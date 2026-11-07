import Phaser from 'phaser';
import { GRASS_COLOR, TILE } from '../constants';
import gardenJson from '../data/maps/garden.json';
import { findBlockOrigin, parseMap, type MapData } from '../logic/grid';
import { Player } from '../objects/Player';
import { buildTilemap } from '../objects/tilemap';
import { state } from '../state';
import { MINE_ENTRANCE_KEY } from './BootScene';

// Above any y-sorted object (world is < 1000 px tall).
const MARKER_DEPTH = 10000;

// Garden world: tilemap from the ASCII map plus the walking player.
export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private frontMarker!: Phaser.GameObjects.Rectangle;

  constructor() {
    super('Garden');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(GRASS_COLOR);
    const grid = parseMap(gardenJson as MapData);
    const { layer, widthInPixels, heightInPixels } = buildTilemap(this, grid);

    // 2x2 entrance sprite on the roof block's top-left cell. Depth = bottom of the solid roof row:
    // the player behind the crown is hidden by it, on the walkable row in front is drawn over it.
    const mine = findBlockOrigin(grid, 'mine_roof');
    if (mine) {
      this.add.image(mine.col * TILE, mine.row * TILE, MINE_ENTRANCE_KEY).setOrigin(0, 0).setDepth((mine.row + 1) * TILE);
    }

    // Safety net in case the map forgets a border wall.
    this.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);

    const cx = (grid.spawn.col + 0.5) * TILE;
    const cy = (grid.spawn.row + 0.5) * TILE;
    this.player = new Player(this, cx, cy, state.character);
    this.physics.add.collider(this.player, layer);

    // TEMP debug: thin unfilled frame on the cell in front of the player.
    this.frontMarker = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0, 0).setStrokeStyle(1, 0xffffff).setDepth(MARKER_DEPTH);

    // Camera stops at map edges; roundPixels keeps the pixel grid steady.
    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.cameras.main.startFollow(this.player, true);
  }

  update(): void {
    this.player.update();

    // TEMP debug highlight of the target cell; P2 replaces it with real tool feedback.
    const { col, row } = this.player.frontCell();
    this.frontMarker.setPosition(col * TILE, row * TILE);
  }
}
