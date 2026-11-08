import Phaser from 'phaser';
import { SCREEN_H } from '../constants';
import { isLeaving } from './transition';

const HOTBAR_ZONE_Y = SCREEN_H - 30; // presses below this line belong to the hotbar

// Held Space / mouse button with a cooldown. Shared by the garden and the mine.
export class ActionInput {
  private readonly spaceKey: Phaser.Input.Keyboard.Key | undefined;
  private mouseHeld = false;
  private lastFireAt = -Infinity;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly cooldownMs: number,
  ) {
    const kb = scene.input.keyboard;
    this.spaceKey = kb?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    scene.input.on('pointerdown', this.onPointerDown);
    scene.input.on('pointerup', this.onPointerUp);
    // The scene instance is reused, so always unsubscribe.
    scene.events.once('shutdown', () => {
      if (this.spaceKey) kb?.removeKey(this.spaceKey);
      scene.input.off('pointerdown', this.onPointerDown);
      scene.input.off('pointerup', this.onPointerUp);
    });
  }

  // True when the button is held, cooldown passed and no scene transition runs.
  isReady(): boolean {
    if (isLeaving()) return false;
    if (!(this.spaceKey?.isDown || this.mouseHeld)) return false;
    return this.scene.time.now - this.lastFireAt >= this.cooldownMs;
  }

  // Call when an action really happened: starts the cooldown.
  fire(): void {
    this.lastFireAt = this.scene.time.now;
  }

  // A press that starts on the hotbar is not an action.
  private onPointerDown = (p: Phaser.Input.Pointer): void => {
    if (p.y < HOTBAR_ZONE_Y) this.mouseHeld = true;
  };

  private onPointerUp = (): void => {
    this.mouseHeld = false;
  };
}
