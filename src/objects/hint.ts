import Phaser from 'phaser';
import { FRAME_H } from './playerAnims';
import type { Player } from './Player';

const HINT_DEPTH = 10001; // above the debug marker
const HINT_GAP = 4; // px above the sprite's head

// Small in-world text above the hero, e.g. "E — descend".
export class Hint {
  private readonly text: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.text = scene.add
      .text(0, 0, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' })
      .setOrigin(0.5, 1)
      .setStroke('#000000', 2)
      .setDepth(HINT_DEPTH)
      .setVisible(false);
  }

  // Pass null to hide.
  update(player: Player, message: string | null): void {
    if (message === null) {
      this.text.setVisible(false);
      return;
    }
    this.text.setText(message).setPosition(Math.round(player.x), Math.round(player.y - FRAME_H / 2 - HINT_GAP)).setVisible(true);
  }
}

const FLOAT_DEPTH = 10002; // above the hint
const FLOAT_MS = 600;
const FLOAT_RISE = 10; // px

// One-shot text that rises above the hero and fades, e.g. "Нет места".
export function floatText(scene: Phaser.Scene, player: Player, message: string): void {
  const text = scene.add
    .text(Math.round(player.x), Math.round(player.y - FRAME_H / 2 - HINT_GAP), message, { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' })
    .setOrigin(0.5, 1)
    .setStroke('#000000', 2)
    .setDepth(FLOAT_DEPTH);
  scene.tweens.add({ targets: text, y: text.y - FLOAT_RISE, alpha: 0, duration: FLOAT_MS, onComplete: () => text.destroy() });
}
