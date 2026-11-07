import Phaser from 'phaser';
import { SCREEN_H, SCREEN_W } from '../constants';
import { idleKey, walkKey } from '../objects/playerAnims';
import { state, type CharacterKey } from '../state';

const BG_COLOR = '#1c1812';
const TEXT_COLOR = '#f4ecd8';
const HIGHLIGHT_COLOR = 0xf4c542;
const SPRITE_SCALE = 4; // integer scale keeps pixels crisp
const CARD_W = 100;
const CARD_H = 140;
const CARD_GAP = 40;
const CARD_Y = 140;

interface Choice {
  key: CharacterKey;
  label: string;
}

const CHOICES: readonly Choice[] = [
  { key: 'player_male', label: 'В шляпе' },
  { key: 'player_female', label: 'В косынке' },
];

interface Card {
  sprite: Phaser.GameObjects.Sprite;
  frame: Phaser.GameObjects.Rectangle;
}

// Shown once before the game: pick a hero, then start Garden + UI.
export class CharacterSelectScene extends Phaser.Scene {
  private cards: Card[] = [];
  private selected = 0;

  constructor() {
    super('CharacterSelect');
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BG_COLOR);
    this.cards = [];
    this.selected = Math.max(0, CHOICES.findIndex((c) => c.key === state.character));

    const textStyle = { fontFamily: 'monospace', color: TEXT_COLOR };
    this.add.text(SCREEN_W / 2, 30, 'Выбери героя', { ...textStyle, fontSize: '20px' }).setOrigin(0.5);
    this.add
      .text(SCREEN_W / 2, SCREEN_H - 20, '←/→ — выбрать, Enter — начать', { ...textStyle, fontSize: '12px' })
      .setOrigin(0.5);

    const totalW = CHOICES.length * CARD_W + (CHOICES.length - 1) * CARD_GAP;
    const x0 = (SCREEN_W - totalW) / 2 + CARD_W / 2;

    CHOICES.forEach((choice, i) => {
      const x = x0 + i * (CARD_W + CARD_GAP);
      const frame = this.add.rectangle(x, CARD_Y, CARD_W, CARD_H).setStrokeStyle(2, HIGHLIGHT_COLOR);
      const sprite = this.add.sprite(x, CARD_Y - 12, choice.key).setScale(SPRITE_SCALE);
      this.add.text(x, CARD_Y + CARD_H / 2 - 16, choice.label, { ...textStyle, fontSize: '12px' }).setOrigin(0.5);

      // Click picks and confirms in one go.
      frame.setFillStyle(0xffffff, 0.001).setInteractive({ useHandCursor: true });
      sprite.setInteractive({ useHandCursor: true });
      const pick = (): void => {
        this.selected = i;
        this.confirm();
      };
      frame.on('pointerdown', pick);
      sprite.on('pointerdown', pick);

      this.cards.push({ sprite, frame });
    });
    this.refresh();

    const kb = this.input.keyboard;
    if (!kb) throw new Error('Keyboard plugin is unavailable');
    kb.on('keydown-LEFT', () => this.move(-1));
    kb.on('keydown-A', () => this.move(-1));
    kb.on('keydown-RIGHT', () => this.move(1));
    kb.on('keydown-D', () => this.move(1));
    kb.on('keydown-ENTER', () => this.confirm());
    kb.on('keydown-SPACE', () => this.confirm());
  }

  private move(dir: number): void {
    this.selected = (this.selected + dir + CHOICES.length) % CHOICES.length;
    this.refresh();
  }

  // Selected card: frame + walk animation; the others stand still.
  private refresh(): void {
    this.cards.forEach((card, i) => {
      const key = CHOICES[i].key;
      const on = i === this.selected;
      card.frame.setStrokeStyle(2, HIGHLIGHT_COLOR, on ? 1 : 0);
      card.sprite.setAlpha(on ? 1 : 0.7);
      card.sprite.play(on ? walkKey(key, 'down') : idleKey(key, 'down'));
    });
  }

  private confirm(): void {
    state.setCharacter(CHOICES[this.selected].key);
    this.input.keyboard?.removeAllListeners();
    this.scene.start('Garden');
    this.scene.launch('UI');
  }
}
