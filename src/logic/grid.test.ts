import { describe, expect, it } from 'vitest';
import garden from '../data/maps/garden.json';
import { findBlockOrigin, grassVariant, parseMap, SOLID_KINDS, TILE_KINDS } from './grid';

const legend = { '#': 'wall', T: 'tree', '.': 'grass', s: 'soil', M: 'mine_entrance', R: 'mine_roof', P: 'spawn' };

describe('parseMap', () => {
  const small = parseMap({ legend, rows: ['#T#M', '#P.s', '####'] });

  it('parses size and cells (row-major)', () => {
    expect(small.width).toBe(4);
    expect(small.height).toBe(3);
    expect(small.cells[0]).toEqual(['wall', 'tree', 'wall', 'mine_entrance']);
    expect(small.cells[1][3]).toBe('soil');
  });

  it('puts spawn at P with grass underneath', () => {
    expect(small.spawn).toEqual({ col: 1, row: 1 });
    expect(small.cells[1][1]).toBe('grass');
  });

  it('marks wall, tree, mine roof and mine wall as solid only', () => {
    expect([...SOLID_KINDS].sort()).toEqual(['mine_roof', 'mine_wall', 'tree', 'wall']);
    for (const k of SOLID_KINDS) expect(TILE_KINDS).toContain(k);
  });

  it('throws on rows of different length', () => {
    expect(() => parseMap({ legend, rows: ['#P#', '##'] })).toThrow(/Row 1/);
  });

  it('throws on a symbol missing from the legend', () => {
    expect(() => parseMap({ legend, rows: ['#P?'] })).toThrow(/Unknown symbol '\?'/);
  });

  it('throws on a legend value that is not a tile kind', () => {
    expect(() => parseMap({ legend: { ...legend, X: 'lava' }, rows: ['#PX'] })).toThrow(/unknown kind 'lava'/);
  });

  it('throws when there is no spawn', () => {
    expect(() => parseMap({ legend, rows: ['###'] })).toThrow(/exactly one spawn.*found 0/);
  });

  it('throws when there is more than one spawn', () => {
    expect(() => parseMap({ legend, rows: ['PP#'] })).toThrow(/exactly one spawn.*found 2/);
  });
});

describe('garden.json', () => {
  it('parses to 40x25 with spawn at (21, 8)', () => {
    const grid = parseMap(garden);
    expect(grid.width).toBe(40);
    expect(grid.height).toBe(25);
    expect(grid.spawn).toEqual({ col: 21, row: 8 });
    expect(grid.cells[8][21]).toBe('grass');
  });
});

describe('garden mine entrance', () => {
  const grid = parseMap(garden);

  it('is a 2x2 block: solid roof row above walkable entrance row', () => {
    const o = findBlockOrigin(grid, 'mine_roof');
    expect(o).toEqual({ col: 31, row: 18 });
    if (!o) return;
    expect(grid.cells[o.row].slice(o.col, o.col + 2)).toEqual(['mine_roof', 'mine_roof']);
    expect(grid.cells[o.row + 1].slice(o.col, o.col + 2)).toEqual(['mine_entrance', 'mine_entrance']);
    expect(SOLID_KINDS).not.toContain('mine_entrance');
  });
});

describe('grassVariant', () => {
  it('is deterministic and within range', () => {
    for (let i = 0; i < 200; i++) {
      const v = grassVariant(i, i * 3, 3);
      expect(v).toBe(grassVariant(i, i * 3, 3));
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(3);
    }
  });
  it('returns 0 for a single variant', () => {
    expect(grassVariant(5, 5, 1)).toBe(0);
  });
});
