import { describe, expect, it } from 'vitest';
import { PLANTS } from './logic/farm';
import { GameState } from './state';

const CELL = { col: 3, row: 4 };

// A state with one ripe turnip on CELL.
function ripeState(): GameState {
  const s = new GameState();
  s.till(CELL);
  s.plots.get('3,4')!.plant = 'turnip';
  s.plots.get('3,4')!.stage = PLANTS.turnip.daysPerStage.length;
  return s;
}

describe('GameState.harvest', () => {
  it('adds the crop, empties the plot and emits events', () => {
    const s = ripeState();
    const events: string[] = [];
    s.events.on('inventoryChanged', () => events.push('inv'));
    s.events.on('farmChanged', () => events.push('farm'));
    expect(s.harvest(CELL)).toBe(true);
    expect(s.inventory.slots.some((x) => x?.id === 'turnip' && x.count === 1)).toBe(true);
    expect(s.plots.get('3,4')).toMatchObject({ plant: null, stage: 0 });
    expect(events).toEqual(['inv', 'farm']);
  });

  it('stacks repeated harvests', () => {
    const s = ripeState();
    s.harvest(CELL);
    s.plots.get('3,4')!.plant = 'turnip';
    s.plots.get('3,4')!.stage = PLANTS.turnip.daysPerStage.length;
    s.harvest(CELL);
    expect(s.inventory.slots.find((x) => x?.id === 'turnip')?.count).toBe(2);
  });

  it('keeps the crop ripe and changes nothing when the hotbar is full', () => {
    const s = ripeState();
    s.addItem('stone', 999); // fills every empty slot
    const before = JSON.stringify(s.inventory.slots);
    let fired = 0;
    s.events.on('inventoryChanged', () => fired++);
    s.events.on('farmChanged', () => fired++);
    expect(s.harvest(CELL)).toBe(false);
    expect(JSON.stringify(s.inventory.slots)).toBe(before);
    expect(s.plots.get('3,4')).toMatchObject({ plant: 'turnip', stage: PLANTS.turnip.daysPerStage.length });
    expect(fired).toBe(0);
  });

  it('still stacks onto an existing turnip stack when all slots are used', () => {
    const s = ripeState();
    s.addItem('turnip', 1);
    s.addItem('stone', 999);
    expect(s.harvest(CELL)).toBe(true);
    expect(s.inventory.slots.find((x) => x?.id === 'turnip')?.count).toBe(2);
  });
});
