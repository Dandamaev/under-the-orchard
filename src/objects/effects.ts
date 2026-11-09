import Phaser from 'phaser';
import { TILE } from '../constants';

const FX_DEPTH = 9000; // above y-sorted objects, below the cell marker

export interface BurstOptions {
  colors: number[];
  count: number;
  spread: number; // max horizontal travel, px
  rise: number; // max upward travel before falling, px
  ms: number;
}

export const DIRT: BurstOptions = { colors: [0x6b4a2b, 0x8a6240, 0x4e341d], count: 6, spread: 7, rise: 6, ms: 320 };
export const SPLASH: BurstOptions = { colors: [0x8fd0ff, 0xc8ecff, 0x5a9ad0], count: 7, spread: 6, rise: 8, ms: 360 };
export const SEED_PUFF: BurstOptions = { colors: [0xd8c88a, 0x6b4a2b], count: 4, spread: 4, rise: 3, ms: 240 };
export const ROCK_DUST: BurstOptions = { colors: [0xb0b0b0, 0x8a8a8a], count: 3, spread: 5, rise: 4, ms: 200 };
export const ROCK_CRUMBS: BurstOptions = { colors: [0x9a9a9a, 0x6e6e6e, 0x4a4a4a], count: 9, spread: 10, rise: 9, ms: 420 };

// 1-2 px chips that pop up from the cell centre and fall; plain rectangles, no particle system.
export function burst(scene: Phaser.Scene, col: number, row: number, opts: BurstOptions): void {
  const cx = (col + 0.5) * TILE;
  const cy = (row + 0.5) * TILE;
  for (let i = 0; i < opts.count; i++) {
    const size = Math.random() < 0.5 ? 1 : 2;
    const color = opts.colors[i % opts.colors.length];
    const chip = scene.add.rectangle(cx, cy, size, size, color).setDepth(FX_DEPTH);
    const dx = Phaser.Math.FloatBetween(-opts.spread, opts.spread);
    const peak = cy - Phaser.Math.FloatBetween(opts.rise / 2, opts.rise);
    const land = cy + Phaser.Math.FloatBetween(1, 4);
    scene.tweens.add({ targets: chip, x: cx + dx, duration: opts.ms });
    // Up then down: a cheap arc.
    scene.tweens.chain({
      targets: chip,
      tweens: [
        { y: peak, duration: opts.ms * 0.4, ease: 'Quad.easeOut' },
        { y: land, alpha: 0, duration: opts.ms * 0.6, ease: 'Quad.easeIn' },
      ],
      onComplete: () => chip.destroy(),
    });
  }
}

// Ghost copy of a harvested crop that hops up and fades (the real sprite is gone already).
export function hopAway(scene: Phaser.Scene, col: number, row: number, texture: string, frame: number): void {
  const x = (col + 0.5) * TILE;
  const y = (row + 0.5) * TILE;
  const ghost = scene.add.image(x, y, texture, frame).setDepth(FX_DEPTH);
  scene.tweens.add({ targets: ghost, y: y - 10, alpha: 0, duration: 300, ease: 'Quad.easeOut', onComplete: () => ghost.destroy() });
}
