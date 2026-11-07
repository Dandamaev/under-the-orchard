import Phaser from 'phaser';
import { HOTBAR_SIZE, SCREEN_H, SCREEN_W } from '../constants';
import { state } from '../state';

const SLOT_SIZE = 22;
const SLOT_GAP = 2;
const BAR_MARGIN = 4;
const SLOT_COLOR = 0x2a2218;
const SLOT_BORDER = 0xf4ecd8;
const SELECTED_BORDER = 0xf4c542; // same as the hero select highlight
const SLOT_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'] as const;

interface SlotView {
  frame: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  count: Phaser.GameObjects.Text;
}

// HUD drawn over the game scenes; stays running across scene changes.
export class UIScene extends Phaser.Scene {
  private dayText!: Phaser.GameObjects.Text;
  private slots: SlotView[] = [];

  constructor() {
    super('UI');
  }

  create(): void {
    const barW = HOTBAR_SIZE * SLOT_SIZE + (HOTBAR_SIZE - 1) * SLOT_GAP;
    const x0 = (SCREEN_W - barW) / 2;
    const y0 = SCREEN_H - SLOT_SIZE - BAR_MARGIN;

    // Objects are created once; renderHotbar only updates them.
    this.slots = [];
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      const x = x0 + i * (SLOT_SIZE + SLOT_GAP);
      const frame = this.add.rectangle(x, y0, SLOT_SIZE, SLOT_SIZE, SLOT_COLOR).setOrigin(0);
      const icon = this.add.image(x + SLOT_SIZE / 2, y0 + SLOT_SIZE / 2, '__DEFAULT').setVisible(false);
      const count = this.add
        .text(x + SLOT_SIZE - 2, y0 + SLOT_SIZE - 1, '', { fontFamily: 'monospace', fontSize: '8px', color: '#ffffff' })
        .setOrigin(1, 1)
        .setStroke('#000000', 2);
      this.slots.push({ frame, icon, count });
    }

    this.dayText = this.add.text(BAR_MARGIN, BAR_MARGIN, '', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#f4ecd8',
    });
    this.renderDay(state.day);
    this.renderHotbar();

    // Slot input lives here because this scene runs all the time.
    SLOT_KEYS.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => state.selectSlot(i));
    });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (dy !== 0) state.cycleSlot(dy > 0 ? 1 : -1);
    });

    // Unsubscribe on shutdown so restarts don't stack handlers.
    state.events.on('dayChanged', this.renderDay);
    state.events.on('inventoryChanged', this.renderHotbar);
    state.events.on('slotSelected', this.renderHotbar);
    this.events.once('shutdown', () => {
      state.events.off('dayChanged', this.renderDay);
      state.events.off('inventoryChanged', this.renderHotbar);
      state.events.off('slotSelected', this.renderHotbar);
    });
  }

  private renderDay = (day: number): void => {
    this.dayText.setText(`День ${day}`);
  };

  private renderHotbar = (): void => {
    const { slots, selected } = state.inventory;
    this.slots.forEach((view, i) => {
      const stack = slots[i];
      if (stack) {
        view.icon.setTexture(`item_${stack.id}`).setVisible(true);
        view.count.setText(stack.count > 1 ? String(stack.count) : '');
      } else {
        view.icon.setVisible(false);
        view.count.setText('');
      }
      const isSelected = i === selected;
      view.frame.setStrokeStyle(isSelected ? 2 : 1, isSelected ? SELECTED_BORDER : SLOT_BORDER);
    });
  };
}
