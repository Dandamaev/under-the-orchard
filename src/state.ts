import { HOTBAR_SIZE } from './constants';
import { getItem, maxStackOf, START_INVENTORY } from './logic/db';
import { Emitter } from './logic/emitter';
import {
  advanceDay,
  PLANTS,
  plant as plantCrop,
  plotKey,
  till as tillPlot,
  water as waterPlot,
  type Plot,
} from './logic/farm';
import type { Cell } from './logic/grid';
import { Inventory } from './logic/inventory';

// Event name -> payload. Keep in sync with docs/ARCHITECTURE.md section 3.
export type GameEvents = {
  dayChanged: number;
  inventoryChanged: void;
  slotSelected: number;
  floorChanged: number;
  farmChanged: void;
};

// Spritesheet keys of the playable characters.
export type CharacterKey = 'player_male' | 'player_female';

const START_DAY = 1;

// Single shared game state. Only its methods mutate data and emit events.
export class GameState {
  day = START_DAY;
  character: CharacterKey = 'player_male';
  floor = 0; // 0 = garden, 1+ = mine floor
  readonly plots = new Map<string, Plot>(); // key "col,row"; tilled cells only
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

  setFloor(n: number): void {
    this.floor = n;
    this.events.emit('floorChanged', n);
  }

  till(cell: Cell): void {
    if (this.plots.has(plotKey(cell))) return;
    tillPlot(this.plots, cell);
    this.events.emit('farmChanged');
  }

  // Plants the seed from the selected slot; caller checked farmAction === 'plant'.
  plantSeed(cell: Cell): void {
    const stack = this.inventory.selectedStack();
    const plantId = stack ? getItem(stack.id).plant : undefined;
    if (!stack || !plantId) throw new Error('Selected slot holds no seed');
    plantCrop(this.plots, cell, plantId);
    this.inventory.removeAt(this.inventory.selected, 1);
    this.events.emit('inventoryChanged');
    this.events.emit('farmChanged');
  }

  // Caller checked farmAction === 'water'.
  water(cell: Cell): void {
    waterPlot(this.plots, cell);
    this.events.emit('farmChanged');
  }

  // dayChanged alone is enough: the garden re-renders plots on it too.
  nextDay(): void {
    advanceDay(this.plots, PLANTS);
    this.day += 1;
    this.events.emit('dayChanged', this.day);
  }
}

export const state = new GameState();
