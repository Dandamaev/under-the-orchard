import Phaser from 'phaser';
import { GRASS_COLOR, SCREEN_H, SCREEN_W } from './constants';
import { BootScene } from './scenes/BootScene';
import { GardenScene } from './scenes/GardenScene';
import { UIScene } from './scenes/UIScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: SCREEN_W,
  height: SCREEN_H,
  pixelArt: true,
  backgroundColor: GRASS_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, GardenScene, UIScene],
});
