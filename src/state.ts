import { Emitter } from './logic/emitter';

// Event name -> payload. Keep in sync with docs/ARCHITECTURE.md section 3.
export type GameEvents = {
  dayChanged: number;
};

const START_DAY = 1;

// Single shared game state. Only its methods mutate data and emit events.
export class GameState {
  day = START_DAY;
  readonly events = new Emitter<GameEvents>();

  nextDay(): void {
    this.day += 1;
    this.events.emit('dayChanged', this.day);
  }
}

export const state = new GameState();
