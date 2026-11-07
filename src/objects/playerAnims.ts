import Phaser from 'phaser';
import type { Facing } from '../logic/facing';

export const FRAME_W = 16;
export const FRAME_H = 24;
const FRAMES_PER_ROW = 5; // frame 0 = idle, 1..4 = walk
const WALK_FPS = 8;
// Sheet rows, top to bottom.
const ROWS: readonly Facing[] = ['down', 'up', 'left', 'right'];

export const idleKey = (texture: string, facing: Facing): string => `${texture}_idle_${facing}`;
export const walkKey = (texture: string, facing: Facing): string => `${texture}_walk_${facing}`;

// Create idle/walk animations for one character sheet (safe to call twice).
export function createPlayerAnims(scene: Phaser.Scene, texture: string): void {
  ROWS.forEach((facing, row) => {
    const first = row * FRAMES_PER_ROW;
    if (!scene.anims.exists(idleKey(texture, facing))) {
      scene.anims.create({ key: idleKey(texture, facing), frames: [{ key: texture, frame: first }], frameRate: 1 });
    }
    if (!scene.anims.exists(walkKey(texture, facing))) {
      scene.anims.create({
        key: walkKey(texture, facing),
        frames: scene.anims.generateFrameNumbers(texture, { start: first + 1, end: first + 4 }),
        frameRate: WALK_FPS,
        repeat: -1,
      });
    }
  });
}
