import Phaser from 'phaser';
import { FONT, HOTBAR_SIZE, SCREEN_H, SCREEN_W } from '../constants';
import { getItem } from '../logic/db';
import { DIGIT_FONT_KEY } from '../objects/digitFont';
import { state } from '../state';

const SLOT_SIZE = 22;
const SLOT_GAP = 2;
const BAR_MARGIN = 4;
const SLOT_COLOR = 0x2a2218;
const SLOT_BORDER = 0xf4ecd8;
const SELECTED_BORDER = 0xf4c542; // same as the hero select highlight
const DAY_POPUP_HOLD_MS = 400;
const DAY_POPUP_FADE_MS = 600;
const PANEL_COLOR = 0x1a1410;
const PANEL_ALPHA = 0.85;
const PANEL_PAD = 8;
// Shown on H; keep in sync with the input handlers in the scenes.
const CONTROLS = [
  'WASD / стрелки — ходить',
  '1–9 / колёсико — выбрать предмет',
  'Space / ЛКМ — действие предметом',
  'E — спуститься / подняться',
  'N — лечь спать (новый день)',
  'H — скрыть эту подсказку',
];
const SLOT_KEYS = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'] as const;

interface SlotView {
  frame: Phaser.GameObjects.Rectangle;
  icon: Phaser.GameObjects.Image;
  count: Phaser.GameObjects.BitmapText;
}

// HUD drawn over the game scenes; stays running across scene changes.
export class UIScene extends Phaser.Scene {
  private dayText!: Phaser.GameObjects.Text;
  private floorText!: Phaser.GameObjects.Text;
  private slots: SlotView[] = [];
  private itemName!: Phaser.GameObjects.Text;
  private controls!: Phaser.GameObjects.Container;

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
      const count = this.add.bitmapText(x + SLOT_SIZE - 1, y0 + SLOT_SIZE - 1, DIGIT_FONT_KEY, '').setOrigin(1, 1);
      this.slots.push({ frame, icon, count });
    }

    this.dayText = this.add.text(BAR_MARGIN, BAR_MARGIN, '', {
      fontFamily: FONT,
      fontSize: '8px',
      color: '#f4ecd8',
    });
    this.floorText = this.add.text(BAR_MARGIN, BAR_MARGIN + 14, '', {
      fontFamily: FONT,
      fontSize: '8px',
      color: '#f4ecd8',
    });
    // Name of the held item, just above the hotbar.
    this.itemName = this.add
      .text(SCREEN_W / 2, y0 - 2, '', { fontFamily: FONT, fontSize: '8px', color: '#f4ecd8' })
      .setOrigin(0.5, 1)
      .setStroke('#000000', 2);
    this.add
      .text(SCREEN_W - BAR_MARGIN, BAR_MARGIN, 'H — управление', { fontFamily: FONT, fontSize: '8px', color: '#f4ecd8' })
      .setOrigin(1, 0)
      .setStroke('#000000', 2);
    this.controls = this.buildControls();

    this.renderDay(state.day);
    this.renderFloor(state.floor);
    this.renderHotbar();

    // Slot input lives here because this scene runs all the time.
    SLOT_KEYS.forEach((key, i) => {
      this.input.keyboard?.on(`keydown-${key}`, () => state.selectSlot(i));
    });
    this.input.keyboard?.on('keydown-H', this.toggleControls);
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => {
      if (dy !== 0) state.cycleSlot(dy > 0 ? 1 : -1);
    });

    // Unsubscribe on shutdown so restarts don't stack handlers.
    state.events.on('dayChanged', this.renderDay);
    state.events.on('dayChanged', this.popupDay);
    state.events.on('floorChanged', this.renderFloor);
    state.events.on('inventoryChanged', this.renderHotbar);
    state.events.on('slotSelected', this.renderHotbar);
    this.events.once('shutdown', () => {
      state.events.off('dayChanged', this.renderDay);
      state.events.off('dayChanged', this.popupDay);
      state.events.off('floorChanged', this.renderFloor);
      state.events.off('inventoryChanged', this.renderHotbar);
      state.events.off('slotSelected', this.renderHotbar);
    });
  }

  // Centered panel listing the keys; open on start so a new player sees it once.
  private buildControls(): Phaser.GameObjects.Container {
    const text = this.add.text(0, 0, CONTROLS.join('\n'), {
      fontFamily: FONT,
      fontSize: '8px',
      color: '#f4ecd8',
      lineSpacing: 4,
    });
    const w = text.width + PANEL_PAD * 2;
    const h = text.height + PANEL_PAD * 2;
    const bg = this.add.rectangle(0, 0, w, h, PANEL_COLOR, PANEL_ALPHA).setOrigin(0).setStrokeStyle(1, SLOT_BORDER);
    text.setPosition(PANEL_PAD, PANEL_PAD);
    return this.add.container(Math.round((SCREEN_W - w) / 2), Math.round((SCREEN_H - h) / 2) - 20, [bg, text]);
  }

  private toggleControls = (): void => {
    this.controls.setVisible(!this.controls.visible);
  };

  private renderDay = (day: number): void => {
    this.dayText.setText(`День ${day}`);
  };

  // Big "Day N" in the middle of the screen; UIScene is not faded by the night fade.
  private popupDay = (day: number): void => {
    const text = this.add
      .text(SCREEN_W / 2, SCREEN_H / 2, `День ${day}`, { fontFamily: FONT, fontSize: '24px', color: '#f4ecd8' })
      .setOrigin(0.5)
      .setStroke('#000000', 4);
    this.tweens.add({
      targets: text,
      alpha: 0,
      delay: DAY_POPUP_HOLD_MS,
      duration: DAY_POPUP_FADE_MS,
      onComplete: () => text.destroy(),
    });
  };

  // Floor 0 is the garden: no label.
  private renderFloor = (floor: number): void => {
    this.floorText.setText(floor > 0 ? `Этаж ${floor}` : '');
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
    const held = slots[selected];
    this.itemName.setText(held ? getItem(held.id).name : '');
  };
}
