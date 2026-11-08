import Phaser from 'phaser';
import { GRASS_COLOR, TILE } from '../constants';
import gardenJson from '../data/maps/garden.json';
import { getItem } from '../logic/db';
import { farmAction, PLANTS, type FarmAction } from '../logic/farm';
import { findBlockOrigin, parseMap, TILE_KINDS, type Grid, type MapData } from '../logic/grid';
import { ActionInput } from '../objects/actionInput';
import { Player } from '../objects/Player';
import { buildTilemap } from '../objects/tilemap';
import { state } from '../state';
import { floatText, Hint } from '../objects/hint';
import { fadeInScene, fadeToScene, isLeaving } from '../objects/transition';
import { MINE_ENTRANCE_KEY } from './BootScene';

// Above any y-sorted object (world is < 1000 px tall).
const MARKER_DEPTH = 10000;
const ACTION_COOLDOWN_MS = 250; // pace of held Space / mouse button
const NIGHT_FADE_MS = 300; // each half of the new-day fade

// Garden world: tilemap from the ASCII map plus the walking player.
export class GardenScene extends Phaser.Scene {
  private player!: Player;
  private frontMarker!: Phaser.GameObjects.Rectangle;
  private grid!: Grid;
  private hint!: Hint;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private actionInput!: ActionInput;
  private fromMine = false;
  private sleeping = false; // true while the screen is dark: input is ignored
  private crops = new Map<string, Phaser.GameObjects.Image>(); // key "col,row"

  constructor() {
    super('Garden');
  }

  init(data: { from?: 'mine' }): void {
    this.fromMine = data?.from === 'mine';
  }

  create(): void {
    this.cameras.main.setBackgroundColor(GRASS_COLOR);
    const grid = parseMap(gardenJson as MapData);
    this.grid = grid;
    const { layer, widthInPixels, heightInPixels } = buildTilemap(this, grid);
    this.layer = layer;

    // 2x2 entrance sprite on the roof block's top-left cell. Depth = bottom of the solid roof row:
    // the player behind the crown is hidden by it, on the walkable row in front is drawn over it.
    const mine = findBlockOrigin(grid, 'mine_roof');
    if (mine) {
      this.add.image(mine.col * TILE, mine.row * TILE, MINE_ENTRANCE_KEY).setOrigin(0, 0).setDepth((mine.row + 1) * TILE);
    }

    // Safety net in case the map forgets a border wall.
    this.physics.world.setBounds(0, 0, widthInPixels, heightInPixels);

    // Back from the mine: stand just below the entrance block (middle of its 2 columns).
    let cx = (grid.spawn.col + 0.5) * TILE;
    let cy = (grid.spawn.row + 0.5) * TILE;
    const entrance = findBlockOrigin(grid, 'mine_entrance');
    if (this.fromMine && entrance) {
      cx = (entrance.col + 1) * TILE;
      cy = (entrance.row + 1.5) * TILE;
    }
    this.player = new Player(this, cx, cy, state.character);
    this.player.facing = 'down';
    this.physics.add.collider(this.player, layer);

    // Highlight of the cell the held tool would act on; hidden otherwise.
    this.frontMarker = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0, 0).setStrokeStyle(1, 0xffffff).setDepth(MARKER_DEPTH).setVisible(false);

    // Camera stops at map edges; roundPixels keeps the pixel grid steady.
    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.cameras.main.startFollow(this.player, true);

    this.hint = new Hint(this);
    this.crops = new Map(); // scene objects were destroyed on restart
    this.renderPlots();
    state.setFloor(0);
    fadeInScene(this);

    // Unsubscribe on shutdown: the scene instance is reused when returning from the mine.
    const kb = this.input.keyboard;
    this.sleeping = false;
    kb?.on('keydown-E', this.onInteract);
    kb?.on('keydown-N', this.onNewDay);
    this.actionInput = new ActionInput(this, ACTION_COOLDOWN_MS);
    state.events.on('farmChanged', this.renderPlots);
    state.events.on('dayChanged', this.renderPlots);
    this.events.once('shutdown', () => {
      kb?.off('keydown-E', this.onInteract);
      kb?.off('keydown-N', this.onNewDay);
      state.events.off('farmChanged', this.renderPlots);
      state.events.off('dayChanged', this.renderPlots);
    });
  }

  private onEntrance(): boolean {
    const { col, row } = this.player.cell();
    return this.grid.cells[row]?.[col] === 'mine_entrance';
  }

  private onInteract = (): void => {
    if (isLeaving() || this.sleeping || !this.onEntrance()) return;
    fadeToScene(this, 'Mine', { floor: 1 }, this.player);
  };

  // What a press would do on the cell in front of the player (null = nothing).
  private currentAction(): FarmAction | null {
    const cell = this.player.frontCell();
    const stack = state.inventory.selectedStack();
    const held = stack ? getItem(stack.id) : null;
    return farmAction(state.plots, cell, this.grid.cells[cell.row]?.[cell.col], held, PLANTS);
  }

  private doAction(action: FarmAction): void {
    this.actionInput.fire();
    const cell = this.player.frontCell();
    if (action === 'harvest') {
      if (!state.harvest(cell)) floatText(this, this.player, 'Нет места');
    } else if (action === 'till') state.till(cell);
    else if (action === 'plant') state.plantSeed(cell);
    else state.water(cell);
  }

  // Fade out, advance the day in the dark, fade back in. Scene is not restarted.
  private onNewDay = (): void => {
    if (this.sleeping || isLeaving()) return;
    this.sleeping = true;
    this.player.halt();
    const cam = this.cameras.main;
    cam.once('camerafadeoutcomplete', () => {
      state.nextDay();
      cam.once('camerafadeincomplete', () => {
        this.sleeping = false;
      });
      cam.fadeIn(NIGHT_FADE_MS, 0, 0, 0);
    });
    cam.fadeOut(NIGHT_FADE_MS, 0, 0, 0);
  };

  // Tiles and crop sprites come from state.plots, so the garden rebuilds itself after the mine.
  private renderPlots = (): void => {
    const seen = new Set<string>();
    for (const [key, plot] of state.plots) {
      const [col, row] = key.split(',').map(Number);
      const kind = plot.watered ? 'soil_watered' : 'soil_tilled';
      this.layer.putTileAt(TILE_KINDS.indexOf(kind), col, row);

      if (plot.plant === null) continue;
      seen.add(key);
      let sprite = this.crops.get(key);
      if (!sprite) {
        sprite = this.add.image((col + 0.5) * TILE, (row + 0.5) * TILE, `crop_${plot.plant}`);
        sprite.setDepth((row + 1) * TILE); // same bottom-edge sorting as the player
        this.crops.set(key, sprite);
      }
      sprite.setTexture(`crop_${plot.plant}`, plot.stage);
    }
    // Drop sprites of cells that no longer hold a plant.
    for (const [key, sprite] of this.crops) {
      if (!seen.has(key)) {
        sprite.destroy();
        this.crops.delete(key);
      }
    }
  };

  update(): void {
    if (isLeaving()) return;
    if (this.sleeping) {
      this.player.halt();
      this.frontMarker.setVisible(false);
      return;
    }
    this.player.update();

    const front = this.player.frontCell();
    const action = this.currentAction();
    this.frontMarker.setPosition(front.col * TILE, front.row * TILE).setVisible(action !== null);
    if (action && this.actionInput.isReady()) this.doAction(action);

    this.hint.update(this.player, this.onEntrance() ? 'E — спуститься' : null);
  }
}
