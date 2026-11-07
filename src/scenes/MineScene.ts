import Phaser from 'phaser';
import { SCREEN_H, TILE } from '../constants';
import caveJson from '../data/maps/mine-cave.json';
import { isTool } from '../logic/db';
import { parseMap, type MapData } from '../logic/grid';
import { generateFloor, hitRock, MINE_RULES, type Rock } from '../logic/mine';
import { createRng } from '../logic/rng';
import { Hint } from '../objects/hint';
import { Player } from '../objects/Player';
import { FRAME_H } from '../objects/playerAnims';
import { buildTilemap } from '../objects/tilemap';
import { fadeInScene, fadeToScene, isLeaving } from '../objects/transition';
import { state } from '../state';

const MINE_BG_COLOR = '#1a1620';
const MARKER_DEPTH = 10000; // above any y-sorted object
const HIT_COOLDOWN_MS = 250; // pace of held Space / mouse button
const FLASH_MS = 60;
const SHRINK_MS = 80;
const NO_ROOM_MS = 600;
const HOTBAR_ZONE_Y = SCREEN_H - 30; // presses below this line belong to the hotbar

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
  // Keyed "col,row"; only whole rocks are kept here.
  private rocks = new Map<string, RockView>();
  private spaceKey: Phaser.Input.Keyboard.Key | undefined;
  private mouseHeld = false;
  private lastHitAt = -Infinity;

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
    this.spaceKey = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.mouseHeld = false;
    this.lastHitAt = -Infinity;
    this.input.on('pointerdown', this.onPointerDown);
    this.input.on('pointerup', this.onPointerUp);
    this.events.once('shutdown', () => {
      kb?.off('keydown-E', this.onInteract);
      if (this.spaceKey) kb?.removeKey(this.spaceKey);
      this.spaceKey = undefined;
      this.input.off('pointerdown', this.onPointerDown);
      this.input.off('pointerup', this.onPointerUp);
    });
  }

  private onInteract = (): void => {
    if (isLeaving()) return;
    const { col, row } = this.player.cell();
    if (this.grid.cells[row]?.[col] === 'ladder_up') {
      fadeToScene(this, 'Garden', { from: 'mine' }, this.player);
    }
  };

  // A press that starts on the hotbar is not a hit.
  private onPointerDown = (p: Phaser.Input.Pointer): void => {
    if (p.y < HOTBAR_ZONE_Y) this.mouseHeld = true;
  };

  private onPointerUp = (): void => {
    this.mouseHeld = false;
  };

  private targetView(): RockView | undefined {
    const { col, row } = this.player.frontCell();
    return this.rocks.get(`${col},${row}`);
  }

  private tryHit(): void {
    if (this.time.now - this.lastHitAt < HIT_COOLDOWN_MS) return;
    const held = state.inventory.selectedStack();
    if (!held || !isTool(held.id, 'pickaxe')) return;
    const view = this.targetView();
    if (!view) return;
    this.lastHitAt = this.time.now;

    const { rock, image } = view;
    const result = hitRock(rock, MINE_RULES);
    if (!result.broken) {
      this.playHitFeedback(image);
      return;
    }

    // Drop from the map and the physics world at once: walkable now, no double hits.
    this.rocks.delete(`${rock.col},${rock.row}`);
    (image as Phaser.Physics.Arcade.Image).disableBody(false, false);
    this.tweens.killTweensOf(image);
    image.clearTint();
    this.tweens.add({ targets: image, scale: 0, duration: SHRINK_MS, onComplete: () => image.destroy() });

    if (result.drop && state.addItem(result.drop, 1) > 0) this.showNoRoom();
    // TODO(step 6): if (result.ladder) turn the cell into ladder_down.
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

  private showNoRoom(): void {
    const text = this.add
      .text(Math.round(this.player.x), Math.round(this.player.y - FRAME_H / 2 - 4), 'Нет места', { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' })
      .setOrigin(0.5, 1)
      .setStroke('#000000', 2)
      .setDepth(MARKER_DEPTH + 2);
    this.tweens.add({ targets: text, y: text.y - 10, alpha: 0, duration: NO_ROOM_MS, onComplete: () => text.destroy() });
  }

  update(): void {
    if (isLeaving()) return;
    this.player.update();

    const front = this.player.frontCell();
    this.frontMarker.setPosition(front.col * TILE, front.row * TILE).setVisible(this.targetView() !== undefined);
    if (this.spaceKey?.isDown || this.mouseHeld) this.tryHit();

    const { col, row } = this.player.cell();
    this.hint.update(this.player, this.grid.cells[row]?.[col] === 'ladder_up' ? 'E — подняться' : null);
  }
}
