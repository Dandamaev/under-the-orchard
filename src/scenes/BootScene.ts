import Phaser from 'phaser';
import { TILE } from '../constants';
import { TILE_KINDS, type TileKind } from '../logic/grid';
import { createPlayerAnims, FRAME_H, FRAME_W } from '../objects/playerAnims';
import { GARDEN_TILES_KEY, GRASS_FRAMES, KIND_FRAMES, TILESET_KEY, TILESET_SLOTS } from '../objects/tilemap';

export const MINE_ENTRANCE_KEY = 'mine_entrance';
const CHARACTER_KEYS = ['player_male', 'player_female'] as const;

// Placeholder colors for kinds without art yet (wall, tree).
const TILE_COLORS: Partial<Record<TileKind, number>> = {
  wall: 0x7a7a82,
  tree: 0x2d5a27,
};

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload(): void {
    for (const key of CHARACTER_KEYS) {
      this.load.spritesheet(key, `assets/${key}.png`, { frameWidth: FRAME_W, frameHeight: FRAME_H });
    }
    this.load.spritesheet(GARDEN_TILES_KEY, `assets/${GARDEN_TILES_KEY}.png`, { frameWidth: TILE, frameHeight: TILE });
    this.load.image(MINE_ENTRANCE_KEY, `assets/${MINE_ENTRANCE_KEY}.png`);
  }

  create(): void {
    this.buildTileset();
    for (const key of CHARACTER_KEYS) createPlayerAnims(this, key);

    this.scene.start('Garden');
    this.scene.launch('UI');
  }

  // Compose the 'tiles' strip: slots follow TILE_KINDS, then extra grass variants.
  private buildTileset(): void {
    const canvas = this.textures.createCanvas(TILESET_KEY, TILE * TILESET_SLOTS, TILE);
    if (!canvas) throw new Error('Failed to create tileset canvas');
    const ctx = canvas.getContext();
    const source = this.textures.get(GARDEN_TILES_KEY).getSourceImage() as CanvasImageSource;

    const drawFrame = (slot: number, frame: number): void => {
      ctx.drawImage(source, frame * TILE, 0, TILE, TILE, slot * TILE, 0, TILE, TILE);
    };
    TILE_KINDS.forEach((kind, slot) => {
      const frame = KIND_FRAMES[kind];
      if (frame !== undefined) {
        drawFrame(slot, frame);
      } else {
        ctx.fillStyle = `#${(TILE_COLORS[kind] ?? 0xff00ff).toString(16).padStart(6, '0')}`;
        ctx.fillRect(slot * TILE, 0, TILE, TILE);
      }
    });
    GRASS_FRAMES.slice(1).forEach((frame, i) => drawFrame(TILE_KINDS.length + i, frame));
    canvas.refresh();
  }
}
