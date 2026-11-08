import Phaser from 'phaser';
import { TILE } from '../constants';
import { MINE_RULES } from '../logic/mine';
import { ITEM_IDS } from '../logic/db';
import { PLANTS } from '../logic/farm';
import { TILE_KINDS } from '../logic/grid';
import { createPlayerAnims, FRAME_H, FRAME_W } from '../objects/playerAnims';
import { GARDEN_TILES_KEY, GRASS_FRAMES, KIND_FRAMES, TILESET_KEY, TILESET_SLOTS } from '../objects/tilemap';

export const MINE_ENTRANCE_KEY = 'mine_entrance';
const CHARACTER_KEYS = ['player_male', 'player_female'] as const;
const CROP_FRAME = 16;
// Placeholder figure size (w, h) per growth stage, used only for plants without a PNG yet.
const CROP_SIZES: [number, number][] = [[4, 3], [4, 7], [10, 10], [10, 12]];
// Plants shipping a real sprite sheet 'assets/crop_<id>.png' (one 16x16 frame per stage).
const CROP_SHEETS: readonly string[] = ['turnip'];

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
    // Item icons and rocks: one PNG per id/type, keyed so scenes find them directly ('item_<id>', 'rock_<type>').
    for (const id of ITEM_IDS) this.load.image(`item_${id}`, `assets/item_${id}.png`);
    for (const type of Object.keys(MINE_RULES.rocks)) this.load.image(`rock_${type}`, `assets/rock_${type}.png`);
    // Crops with art; the rest fall back to generated placeholders in create().
    for (const id of CROP_SHEETS) {
      this.load.spritesheet(`crop_${id}`, `assets/crop_${id}.png`, { frameWidth: CROP_FRAME, frameHeight: CROP_FRAME });
    }
  }

  create(): void {
    this.buildTileset();
    this.buildCropTextures();
    for (const key of CHARACTER_KEYS) createPlayerAnims(this, key);

    this.scene.start('CharacterSelect');
  }

  // Generated 'crop_<plantId>' strip for plants without a PNG; a loaded sheet wins.
  // Figures grow with the stage; the last one is the ripe crop.
  private buildCropTextures(): void {
    for (const [id, def] of Object.entries(PLANTS)) {
      const key = `crop_${id}`;
      if (this.textures.exists(key)) continue; // real sprite already loaded
      const frames = def.stageColors.length;
      const canvas = this.textures.createCanvas(key, CROP_FRAME * frames, CROP_FRAME);
      if (!canvas) throw new Error(`Failed to create ${key} texture`);
      const ctx = canvas.getContext();
      def.stageColors.forEach((color, i) => {
        const [w, h] = CROP_SIZES[Math.min(i, CROP_SIZES.length - 1)];
        const x = i * CROP_FRAME + Math.floor((CROP_FRAME - w) / 2);
        const y = Math.floor((CROP_FRAME - h) / 2);
        ctx.fillStyle = color;
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#1a1410';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      });
      canvas.refresh();
      for (let i = 0; i < frames; i++) canvas.add(i, 0, i * CROP_FRAME, 0, CROP_FRAME, CROP_FRAME);
    }
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
        // Every kind maps to a frame now; magenta flags a forgotten one.
        ctx.fillStyle = '#ff00ff';
        ctx.fillRect(slot * TILE, 0, TILE, TILE);
      }
    });
    GRASS_FRAMES.slice(1).forEach((frame, i) => drawFrame(TILE_KINDS.length + i, frame));
    canvas.refresh();
  }
}
