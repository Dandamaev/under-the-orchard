import type Phaser from 'phaser';
import type { Player } from './Player';

const FADE_MS = 200;

// One transition at a time: ignores repeated E presses while the screen fades out.
let leaving = false;

export function isLeaving(): boolean {
  return leaving;
}

// Fade out, then start another scene (or restart this one with new data).
export function fadeToScene(scene: Phaser.Scene, key: string, data: object, player?: Player): void {
  if (leaving) return;
  leaving = true;
  player?.halt();
  const cam = scene.cameras.main;
  cam.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
  cam.fadeOut(FADE_MS, 0, 0, 0);
}

// Call from create() of every scene that can be entered through fadeToScene.
export function fadeInScene(scene: Phaser.Scene): void {
  leaving = false;
  scene.cameras.main.fadeIn(FADE_MS, 0, 0, 0);
}
