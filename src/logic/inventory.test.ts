import { describe, expect, it } from 'vitest';
import { HOTBAR_SIZE } from '../constants';
import { Inventory } from './inventory';

// Fake items: independent of items.json.
const max = (id: string): number => (id === 'tool' || id === 'tool2' ? 1 : 10);
const make = (size = HOTBAR_SIZE): Inventory => new Inventory(size, max);

describe('Inventory.add', () => {
  it('starts empty with the given size', () => {
    const inv = make();
    expect(inv.slots).toHaveLength(HOTBAR_SIZE);
    expect(inv.slots.every((s) => s === null)).toBe(true);
    expect(make(4).slots).toHaveLength(4);
  });

  it('puts first item into slot 0', () => {
    const inv = make();
    expect(inv.add('stone', 3)).toBe(0);
    expect(inv.slots[0]).toEqual({ id: 'stone', count: 3 });
  });

  it('tops up an existing stack', () => {
    const inv = make();
    inv.add('stone', 3);
    inv.add('stone', 4);
    expect(inv.slots[0]).toEqual({ id: 'stone', count: 7 });
    expect(inv.slots[1]).toBeNull();
  });

  it('overflow spills into the next empty slot', () => {
    const inv = make();
    inv.add('stone', 8);
    expect(inv.add('stone', 5)).toBe(0);
    expect(inv.slots[0]).toEqual({ id: 'stone', count: 10 });
    expect(inv.slots[1]).toEqual({ id: 'stone', count: 3 });
  });

  it('tops up earlier stacks before opening new slots', () => {
    const inv = make();
    inv.add('stone', 10);
    inv.add('coal', 1);
    inv.add('stone', 2); // slot 0 full -> slot 2 (after coal)
    inv.slots[0]!.count = 5;
    inv.add('stone', 3);
    expect(inv.slots[0]).toEqual({ id: 'stone', count: 8 });
    expect(inv.slots[2]).toEqual({ id: 'stone', count: 2 });
  });

  it('one add can fill several slots', () => {
    const inv = make();
    expect(inv.add('stone', 25)).toBe(0);
    expect(inv.slots.slice(0, 3).map((s) => s?.count)).toEqual([10, 10, 5]);
  });

  it('non-stackable tools take one slot each', () => {
    const inv = make();
    inv.add('tool', 1);
    inv.add('tool', 1);
    inv.add('tool2', 1);
    expect(inv.slots.slice(0, 3)).toEqual([
      { id: 'tool', count: 1 },
      { id: 'tool', count: 1 },
      { id: 'tool2', count: 1 },
    ]);
  });

  it('full inventory returns the remainder and changes nothing', () => {
    const inv = make(2);
    inv.add('stone', 10);
    inv.add('coal', 10);
    expect(inv.add('stone', 4)).toBe(4);
    expect(inv.add('tool', 1)).toBe(1);
    expect(inv.slots).toEqual([
      { id: 'stone', count: 10 },
      { id: 'coal', count: 10 },
    ]);
  });

  it('partial fit returns only the difference', () => {
    const inv = make(2);
    inv.add('stone', 10);
    inv.add('coal', 6);
    expect(inv.add('coal', 9)).toBe(5);
    expect(inv.slots[1]).toEqual({ id: 'coal', count: 10 });
  });

  it('adding zero is a no-op', () => {
    const inv = make();
    expect(inv.add('stone', 0)).toBe(0);
    expect(inv.slots[0]).toBeNull();
  });
});

describe('Inventory.removeAt', () => {
  it('decreases the stack', () => {
    const inv = make();
    inv.add('stone', 5);
    inv.removeAt(0, 2);
    expect(inv.slots[0]).toEqual({ id: 'stone', count: 3 });
  });

  it('empties the slot at zero', () => {
    const inv = make();
    inv.add('stone', 2);
    inv.removeAt(0, 2);
    expect(inv.slots[0]).toBeNull();
  });

  it('throws on an empty slot or too many, changing nothing', () => {
    const inv = make();
    expect(() => inv.removeAt(0, 1)).toThrow();
    inv.add('stone', 2);
    expect(() => inv.removeAt(0, 3)).toThrow();
    expect(inv.slots[0]).toEqual({ id: 'stone', count: 2 });
  });
});

describe('Inventory selection', () => {
  it('starts at slot 0 and selects in range', () => {
    const inv = make();
    expect(inv.selected).toBe(0);
    inv.select(8);
    expect(inv.selected).toBe(8);
    inv.select(0);
    expect(inv.selected).toBe(0);
  });

  it('select out of range throws and keeps the selection', () => {
    const inv = make();
    inv.select(3);
    expect(() => inv.select(-1)).toThrow();
    expect(() => inv.select(HOTBAR_SIZE)).toThrow();
    expect(() => inv.select(1.5)).toThrow();
    expect(inv.selected).toBe(3);
  });

  it('cycle wraps in both directions', () => {
    const inv = make();
    inv.cycle(-1);
    expect(inv.selected).toBe(HOTBAR_SIZE - 1);
    inv.cycle(1);
    expect(inv.selected).toBe(0);
    inv.cycle(1);
    expect(inv.selected).toBe(1);
  });

  it('selectedStack is null for an empty slot', () => {
    const inv = make();
    inv.add('stone', 2);
    expect(inv.selectedStack()).toEqual({ id: 'stone', count: 2 });
    inv.select(1);
    expect(inv.selectedStack()).toBeNull();
  });
});
