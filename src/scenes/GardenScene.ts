import Phaser from 'phaser';
import { GRASS_COLOR } from '../constants';

// Empty world stub: just grass. Map, player and plots come in P1+.
export class GardenScene extends Phaser.Scene {
  constructor() {
    super('Garden');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(GRASS_COLOR);
  }
}
