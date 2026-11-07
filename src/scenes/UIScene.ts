import Phaser from 'phaser';
import { HOTBAR_SIZE, SCREEN_H, SCREEN_W } from '../constants';
import { state } from '../state';

const SLOT_SIZE = 22;
const SLOT_GAP = 2;
const BAR_MARGIN = 4;
const SLOT_COLOR = 0x2a2218;
const SLOT_BORDER = 0xf4ecd8;

// HUD drawn over the game scenes; stays running across scene changes.
export class UIScene extends Phaser.Scene {
  private dayText!: Phaser.GameObjects.Text;

  constructor() {
    super('UI');
  }

  create(): void {
    const barW = HOTBAR_SIZE * SLOT_SIZE + (HOTBAR_SIZE - 1) * SLOT_GAP;
    const x0 = (SCREEN_W - barW) / 2;
    const y0 = SCREEN_H - SLOT_SIZE - BAR_MARGIN;

    for (let i = 0; i < HOTBAR_SIZE; i++) {
      this.add
        .rectangle(x0 + i * (SLOT_SIZE + SLOT_GAP), y0, SLOT_SIZE, SLOT_SIZE, SLOT_COLOR)
        .setOrigin(0)
        .setStrokeStyle(1, SLOT_BORDER);
    }

    this.dayText = this.add.text(BAR_MARGIN, BAR_MARGIN, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f4ecd8',
    });
    this.renderDay(state.day);

    // Unsubscribe on shutdown so restarts don't stack handlers.
    state.events.on('dayChanged', this.renderDay);
    this.events.once('shutdown', () => state.events.off('dayChanged', this.renderDay));
  }

  private renderDay = (day: number): void => {
    this.dayText.setText(`День ${day}`);
  };
}
