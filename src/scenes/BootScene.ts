import Phaser from 'phaser';
import { TILE } from '../constants';

// Placeholder textures: [key, color]. Real art replaces these later.
const PLACEHOLDERS: ReadonlyArray<readonly [string, number]> = [
  ['grass', 0x5a8f3c],
  ['soil', 0x6b4a2b],
  ['player', 0xe0b050],
];

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    for (const [key, color] of PLACEHOLDERS) {
      g.clear();
      g.fillStyle(color, 1);
      g.fillRect(0, 0, TILE, TILE);
      g.generateTexture(key, TILE, TILE);
    }
    g.destroy();

    this.scene.start('Garden');
    this.scene.launch('UI');
  }
}
