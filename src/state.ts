import { Emitter } from './logic/emitter';

// Event name -> payload. Keep in sync with docs/ARCHITECTURE.md section 3.
export type GameEvents = {
  dayChanged: number;
};

// Spritesheet keys of the playable characters.
export type CharacterKey = 'player_male' | 'player_female';

const START_DAY = 1;

// Single shared game state. Only its methods mutate data and emit events.
export class GameState {
  day = START_DAY;
  character: CharacterKey = 'player_male';
  readonly events = new Emitter<GameEvents>();

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
