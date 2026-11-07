import { describe, expect, it } from 'vitest';
import { createRng, pickWeighted, randInt } from './rng';

describe('createRng', () => {
  it('gives the same sequence for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 20; i++) expect(a()).toBe(b());
  });

  it('gives different sequences for different seeds', () => {
    expect(createRng(1)()).not.toBe(createRng(2)());
  });

  it('stays within [0, 1)', () => {
    const r = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('randInt', () => {
  it('stays in bounds and reaches both ends', () => {
    const r = createRng(3);
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) {
      const v = randInt(r, 2, 5);
      expect(v).toBeGreaterThanOrEqual(2);
      expect(v).toBeLessThanOrEqual(5);
      seen.add(v);
    }
    expect(seen.has(2)).toBe(true);
    expect(seen.has(5)).toBe(true);
  });
});

describe('pickWeighted', () => {
  it('never picks zero-weight keys and roughly follows weights', () => {
    const r = createRng(9);
    const counts: Record<string, number> = { a: 0, b: 0, c: 0 };
    for (let i = 0; i < 2000; i++) counts[pickWeighted(r, { a: 80, b: 20, c: 0 })]++;
    expect(counts.c).toBe(0);
    expect(counts.a).toBeGreaterThan(counts.b * 2);
    expect(counts.b).toBeGreaterThan(0);
  });

  it('throws without positive weights', () => {
    expect(() => pickWeighted(createRng(1), { a: 0 })).toThrow();
  });
});
