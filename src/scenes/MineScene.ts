import Phaser from 'phaser';
import { TILE } from '../constants';
import caveJson from '../data/maps/mine-cave.json';
import { isTool } from '../logic/db';
import { parseMap, TILE_KINDS, type MapData } from '../logic/grid';
import { generateFloor, hitRock, MINE_RULES, type Rock } from '../logic/mine';
import { createRng } from '../logic/rng';
import { ActionInput } from '../objects/actionInput';
import { burst, ROCK_CRUMBS, ROCK_DUST } from '../objects/effects';
import { playSfx } from '../objects/sfx';
import { floatText, Hint } from '../objects/hint';
import { Player } from '../objects/Player';
import { buildTilemap } from '../objects/tilemap';
import { fadeInScene, fadeToScene, isLeaving } from '../objects/transition';
import { state } from '../state';

const MINE_BG_COLOR = '#1a1620';
const MARKER_DEPTH = 10000; // above any y-sorted object
const HIT_COOLDOWN_MS = 250; // pace of held Space / mouse button
const FLASH_MS = 60;
const SHRINK_MS = 80;

interface RockView {
  rock: Rock;
  image: Phaser.GameObjects.Image;
}

// One mine floor: cave tilemap, rocks as static sprites, the hero.
export class MineScene extends Phaser.Scene {
  private floor = 1;
  private player!: Player;
  private grid!: ReturnType<typeof parseMap>;
  private layer!: Phaser.Tilemaps.TilemapLayer;
  private hint!: Hint;
  private frontMarker!: Phaser.GameObjects.Rectangle;
  // Keyed "col,row"; only whole rocks are kept here.
  private rocks = new Map<string, RockView>();
  private actionInput!: ActionInput;

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
    this.layer = layer;
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

    // Highlight of the rock the pickaxe would hit; hidden otherwise.
    this.frontMarker = this.add.rectangle(0, 0, TILE, TILE).setOrigin(0, 0).setStrokeStyle(1, 0xffffff).setDepth(MARKER_DEPTH).setVisible(false);
    this.hint = new Hint(this);

    this.cameras.main.setBounds(0, 0, widthInPixels, heightInPixels);
    this.cameras.main.startFollow(this.player, true);

    state.setFloor(this.floor);
    fadeInScene(this);

    // Unsubscribe on shutdown: the scene instance is reused between floors.
    const kb = this.input.keyboard;
    kb?.on('keydown-E', this.onInteract);
    this.actionInput = new ActionInput(this, HIT_COOLDOWN_MS);
    this.events.once('shutdown', () => {
      kb?.off('keydown-E', this.onInteract);
    });
  }

  private onInteract = (): void => {
    if (isLeaving()) return;
    const { col, row } = this.player.cell();
    const kind = this.grid.cells[row]?.[col];
    if (kind === 'ladder_up') {
      fadeToScene(this, 'Garden', { from: 'mine' }, this.player);
    } else if (kind === 'ladder_down') {
      fadeToScene(this, 'Mine', { floor: this.floor + 1 }, this.player);
    }
  };

  private targetView(): RockView | undefined {
    const { col, row } = this.player.frontCell();
    return this.rocks.get(`${col},${row}`);
  }

  private tryHit(): void {
    const held = state.inventory.selectedStack();
    if (!held || !isTool(held.id, 'pickaxe')) return;
    const view = this.targetView();
    if (!view) return;
    this.actionInput.fire();

    const { rock, image } = view;
    const result = hitRock(rock, MINE_RULES);
    if (!result.broken) {
      this.playHitFeedback(image);
      burst(this, rock.col, rock.row, ROCK_DUST);
      playSfx(this, 'hit');
      return;
    }
    burst(this, rock.col, rock.row, ROCK_CRUMBS);
    playSfx(this, 'break');

    // Drop from the map and the physics world at once: walkable now, no double hits.
    this.rocks.delete(`${rock.col},${rock.row}`);
    (image as Phaser.Physics.Arcade.Image).disableBody(false, false);
    this.tweens.killTweensOf(image);
    image.clearTint();
    this.tweens.add({ targets: image, scale: 0, duration: SHRINK_MS, onComplete: () => image.destroy() });

    if (result.drop) {
      if (state.addItem(result.drop, 1) > 0) floatText(this, this.player, 'Нет места');
      else playSfx(this, 'pickup');
    }
    if (result.ladder) this.revealLadderDown(rock.col, rock.row);
  }

  // Walkable tile: ladder_down is not in SOLID_KINDS, so no collision to update.
  private revealLadderDown(col: number, row: number): void {
    this.grid.cells[row][col] = 'ladder_down';
    this.layer.putTileAt(TILE_KINDS.indexOf('ladder_down'), col, row);
  }

  private playHitFeedback(image: Phaser.GameObjects.Image): void {
    const baseX = (Math.floor(image.x / TILE) + 0.5) * TILE;
    this.tweens.killTweensOf(image);
    image.x = baseX;
    image.setTintFill(0xffffff);
    this.time.delayedCall(FLASH_MS, () => {
      if (image.active) image.clearTint();
    });
    // Only the image shakes; the static body stays put.
    this.tweens.add({ targets: image, x: baseX + 1, duration: 40, yoyo: true, repeat: 2, onComplete: () => (image.x = baseX) });
  }

  update(): void {
    if (isLeaving()) return;
    this.player.update();

    const front = this.player.frontCell();
    this.frontMarker.setPosition(front.col * TILE, front.row * TILE).setVisible(this.targetView() !== undefined);
    if (this.actionInput.isReady()) this.tryHit();

    const { col, row } = this.player.cell();
    const here = this.grid.cells[row]?.[col];
    this.hint.update(this.player, here === 'ladder_up' ? 'E — подняться' : here === 'ladder_down' ? 'E — спуститься' : null);
  }
}
