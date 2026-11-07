import Phaser from 'phaser';
import { TILE } from '../constants';
import caveJson from '../data/maps/mine-cave.json';
import { parseMap, type MapData } from '../logic/grid';
import { generateFloor, MINE_RULES, type Rock } from '../logic/mine';
import { createRng } from '../logic/rng';
import { Hint } from '../objects/hint';
import { Player } from '../objects/Player';
import { buildTilemap } from '../objects/tilemap';
import { fadeInScene, fadeToScene, isLeaving } from '../objects/transition';
import { state } from '../state';

const MINE_BG_COLOR = '#1a1620';
const MARKER_DEPTH = 10000; // above any y-sorted object

interface RockView {
  rock: Rock;
  image: Phaser.GameObjects.Image;
}

// One mine floor: cave tilemap, rocks as static sprites, the hero.
export class MineScene extends Phaser.Scene {
  private floor = 1;
  private player!: Player;
  private grid!: ReturnType<typeof parseMap>;
  private hint!: Hint;
  private frontMarker!: Phaser.GameObjects.Rectangle;
  // Keyed "col,row"; used by pickaxe hits in the next step.
  private rocks = new Map<string, RockView>();

  constructor() {
    super('Mine');
  }

  init(data: { floor: number }): void {
    this.floor = data.floor;
  }

  create(): void {
    this.cameras.main.setBackgroundColor(MINE_BG_COLOR);
    // Fresh grid every time: later steps edit it (ladder down) without touching the next floor.
    this.grid = parseMap(caveJson as MapData, 'mine_floor');
    const { layer, widthInPixels, heightInPixels } = buildTilemap(this, this.grid);
    this.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);

    const rockGroup = this.physics.add.staticGroup();
    this.rocks.clear();
    const seed = Math.floor(Math.random() * 2 ** 32);
    for (const rock of generateFloor(this.grid, this.floor, MINE_RULES, createRng(seed))) {
      const image = rockGroup.create((rock.col + 0.5) * TILE, (rock.row + 0.5) * TILE, `rock_${rock.type}`) as Phaser.GameObjects.Image;
      image.setDepth((rock.row + 1) * TILE);
      this.rocks.set(`${rock.col},${rock.row}`, { rock, image });
    }

    const { spawn } = this.grid;
    this.player = new Player(this, (spawn.col + 0.5) * TILE, (spawn.row + 0.5) * TILE, state.character);
    this.player.facing = 'down';
    this.physics.add.collider(this.player, layer);
    this.physics.add.collider(this.player, rockGroup);

    // TEMP debug: frame on the cell in front of the player (real target highlight comes with hits).
    this.frontMarker = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0, 0).setStrokeStyle(1, 0xffffff).setDepth(MARKER_DEPTH);
    this.hint = new Hint(this);

    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.cameras.main.startFollow(this.player, true);

    state.setFloor(this.floor);
    fadeInScene(this);

    // Unsubscribe on shutdown: the scene instance is reused between floors.
    const kb = this.input.keyboard;
    kb?.on('keydown-E', this.onInteract);
    this.events.once('shutdown', () => kb?.off('keydown-E', this.onInteract));
  }

  private onInteract = (): void => {
    if (isLeaving()) return;
    const { col, row } = this.player.cell();
    if (this.grid.cells[row]?.[col] === 'ladder_up') {
      fadeToScene(this, 'Garden', { from: 'mine' }, this.player);
    }
  };

  update(): void {
    if (isLeaving()) return;
    this.player.update();

    const front = this.player.frontCell();
    this.frontMarker.setPosition(front.col * TILE, front.row * TILE);

    const { col, row } = this.player.cell();
    this.hint.update(this.player, this.grid.cells[row]?.[col] === 'ladder_up' ? 'E — подняться' : null);
  }
}
