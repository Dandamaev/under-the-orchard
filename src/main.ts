import Phaser from 'phaser';
import { GRASS_COLOR, SCREEN_H, SCREEN_W } from './constants';
import { BootScene } from './scenes/BootScene';
import { CharacterSelectScene } from './scenes/CharacterSelectScene';
import { GardenScene } from './scenes/GardenScene';
import { MineScene } from './scenes/MineScene';
import { UIScene } from './scenes/UIScene';

new Phaser.Game({
  type: Phaser.AUTO,
  width: SCREEN_W,
  height: SCREEN_H,
  pixelArt: true,
  roundPixels: true,
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: 0 }, debug: false } },
  backgroundColor: GRASS_COLOR,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, CharacterSelectScene, GardenScene, MineScene, UIScene],
});
