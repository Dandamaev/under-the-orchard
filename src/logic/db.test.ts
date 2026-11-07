import { describe, expect, it } from 'vitest';
import { getItem, isTool, ITEM_IDS, maxStackOf, START_INVENTORY } from './db';

describe('db', () => {
  it('tools do not stack, resources do', () => {
    expect(maxStackOf('pickaxe_wood')).toBe(1);
    expect(maxStackOf('stone')).toBe(99);
  });

  it('unknown id throws', () => {
    expect(() => getItem('nope')).toThrow();
    expect(() => maxStackOf('nope')).toThrow();
  });

  it('start inventory references known items', () => {
    for (const s of START_INVENTORY) {
      expect(ITEM_IDS).toContain(s.id);
      expect(s.count).toBeGreaterThan(0);
    }
  });

  it('isTool matches tool kind', () => {
    expect(isTool('pickaxe_wood', 'pickaxe')).toBe(true);
    expect(isTool('hoe', 'pickaxe')).toBe(false);
    expect(isTool('stone', 'pickaxe')).toBe(false);
  });
});
