import { HOTBAR_SIZE } from './constants';
import { maxStackOf, START_INVENTORY } from './logic/db';
import { Emitter } from './logic/emitter';
import { Inventory } from './logic/inventory';

// Event name -> payload. Keep in sync with docs/ARCHITECTURE.md section 3.
export type GameEvents = {
  dayChanged: number;
  inventoryChanged: void;
  slotSelected: number;
};

// Spritesheet keys of the playable characters.
export type CharacterKey = 'player_male' | 'player_female';

const START_DAY = 1;

// Single shared game state. Only its methods mutate data and emit events.
export class GameState {
  day = START_DAY;
  character: CharacterKey = 'player_male';
  readonly inventory = new Inventory(HOTBAR_SIZE, maxStackOf);
  readonly events = new Emitter<GameEvents>();

  constructor() {
    // No event: UIScene reads the inventory when it is created.
    for (const { id, count } of START_INVENTORY) this.inventory.add(id, count);
  }

  // Returns how many items did NOT fit.
  addItem(id: string, count: number): number {
    const left = this.inventory.add(id, count);
    if (left < count) this.events.emit('inventoryChanged');
    return left;
  }

  selectSlot(index: number): void {
    this.inventory.select(index);
    this.events.emit('slotSelected', index);
  }

  cycleSlot(dir: 1 | -1): void {
    this.inventory.cycle(dir);
    this.events.emit('slotSelected', this.inventory.selected);
  }

  // Chosen before the garden starts, so no event is needed.
  setCharacter(key: CharacterKey): void {
    this.character = key;
  }

  nextDay(): void {
    this.day += 1;
    this.events.emit('dayChanged', this.day);
  }
}

export const state = new GameState();
