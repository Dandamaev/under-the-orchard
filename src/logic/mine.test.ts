import { describe, expect, it } from 'vitest';
import cave from '../data/maps/mine-cave.json';
import items from '../data/items.json';
import { parseMap, type Grid } from './grid';
import { generateFloor, hitRock, MINE_RULES, rockAt, ruleForFloor, type Rock } from './mine';
import { createRng } from './rng';

const grid = (): Grid => parseMap(cave, 'mine_floor');
const seeds = Array.from({ length: 50 }, (_, i) => i + 1);
const gen = (floor: number, seed: number): Rock[] => generateFloor(grid(), floor, MINE_RULES, createRng(seed));

describe('mine-cave.json', () => {
  const g = grid();

  it('parses to 34x20 with spawn (7, 3) under ladder_up (7, 2)', () => {
    expect(g.width).toBe(34);
    expect(g.height).toBe(20);
    expect(g.spawn).toEqual({ col: 7, row: 3 });
    expect(g.cells[3][7]).toBe('mine_floor');
    expect(g.cells[2][7]).toBe('ladder_up');
  });

  it('has all floor cells connected (flood fill from spawn)', () => {
    const walkable = (c: number, r: number): boolean =>
      g.cells[r]?.[c] === 'mine_floor' || g.cells[r]?.[c] === 'ladder_up';
    let total = 0;
    for (let r = 0; r < g.height; r++) for (let c = 0; c < g.width; c++) if (walkable(c, r)) total++;
    const seen = new Set<string>([`${g.spawn.col},${g.spawn.row}`]);
    const stack = [g.spawn];
    while (stack.length) {
      const { col, row } = stack.pop()!;
      for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const c = col + dc;
        const r = row + dr;
        if (walkable(c, r) && !seen.has(`${c},${r}`)) {
          seen.add(`${c},${r}`);
          stack.push({ col: c, row: r });
        }
      }
    }
    expect(seen.size).toBe(total);
  });
});

describe('ruleForFloor', () => {
  it('picks rules by depth', () => {
    expect(ruleForFloor(MINE_RULES, 1).from).toBe(1);
    expect(ruleForFloor(MINE_RULES, 4).from).toBe(1);
    expect(ruleForFloor(MINE_RULES, 5).from).toBe(5);
    expect(ruleForFloor(MINE_RULES, 100).from).toBe(5);
  });
  it('throws for floor 0', () => {
    expect(() => ruleForFloor(MINE_RULES, 0)).toThrow();
  });
});

describe('generateFloor', () => {
  it('respects count, floor cells, uniqueness, spawn clearance and a single ladder', () => {
    const g = grid();
    for (const floor of [1, 5]) {
      const [min, max] = ruleForFloor(MINE_RULES, floor).rockCount;
      for (const seed of seeds) {
        const rocks = gen(floor, seed);
        expect(rocks.length).toBeGreaterThanOrEqual(min);
        expect(rocks.length).toBeLessThanOrEqual(max);
        expect(new Set(rocks.map((r) => `${r.col},${r.row}`)).size).toBe(rocks.length);
        for (const r of rocks) {
          expect(g.cells[r.row][r.col]).toBe('mine_floor');
          const near = Math.abs(r.col - g.spawn.col) <= 1 && Math.abs(r.row - g.spawn.row) <= 1;
          expect(near).toBe(false);
          expect(r.hp).toBe(MINE_RULES.rocks[r.type].hits);
        }
        expect(rocks.filter((r) => r.hasLadder)).toHaveLength(1);
      }
    }
  });

  it('has no copper on floors 1-4', () => {
    for (let floor = 1; floor <= 4; floor++) {
      for (const seed of seeds) expect(gen(floor, seed).some((r) => r.type === 'copper')).toBe(false);
    }
  });

  it('can have copper on floor 5', () => {
    expect(seeds.some((s) => gen(5, s).some((r) => r.type === 'copper'))).toBe(true);
  });

  it('is deterministic for the same seed', () => {
    expect(gen(3, 123)).toEqual(gen(3, 123));
    expect(gen(3, 123)).not.toEqual(gen(3, 124));
  });

  it('caps rocks at the number of free cells (5 free here, rule wants 12+)', () => {
    const tiny = parseMap(
      {
        legend: { '#': 'mine_wall', '.': 'mine_floor', P: 'spawn' },
        rows: ['#########', '#P......#', '#########'],
      },
      'mine_floor',
    );
    const rocks = generateFloor(tiny, 1, MINE_RULES, createRng(1));
    expect(rocks).toHaveLength(5);
    expect(rocks.filter((r) => r.hasLadder)).toHaveLength(1);
  });
});

describe('hitRock', () => {
  const fresh = (type: string): Rock => ({ col: 0, row: 0, type, hp: MINE_RULES.rocks[type].hits, hasLadder: false });

  it.each([
    ['rock', 2, 'stone'],
    ['coal', 3, 'coal'],
    ['copper', 5, 'copper_ore'],
  ])('%s breaks on hit %i and drops %s', (type, hits, drop) => {
    const rock = fresh(type);
    for (let i = 1; i < hits; i++) expect(hitRock(rock, MINE_RULES)).toEqual({ broken: false, drop: null, ladder: false });
    expect(hitRock(rock, MINE_RULES)).toEqual({ broken: true, drop, ladder: false });
  });

  it('gives no second drop on extra hits', () => {
    const rock = fresh('rock');
    hitRock(rock, MINE_RULES);
    hitRock(rock, MINE_RULES);
    expect(hitRock(rock, MINE_RULES)).toEqual({ broken: false, drop: null, ladder: false });
  });

  it('reports the ladder when the broken rock hides it', () => {
    const rock = { ...fresh('rock'), hasLadder: true };
    hitRock(rock, MINE_RULES);
    expect(hitRock(rock, MINE_RULES).ladder).toBe(true);
  });
});

describe('rockAt', () => {
  it('finds only whole rocks', () => {
    const rock: Rock = { col: 2, row: 3, type: 'rock', hp: 2, hasLadder: false };
    expect(rockAt([rock], { col: 2, row: 3 })).toBe(rock);
    expect(rockAt([rock], { col: 3, row: 3 })).toBeUndefined();
    rock.hp = 0;
    expect(rockAt([rock], { col: 2, row: 3 })).toBeUndefined();
  });
});

describe('mine.json data', () => {
  it('every drop is an item in items.json', () => {
    for (const def of Object.values(MINE_RULES.rocks)) expect(Object.keys(items.items)).toContain(def.drop);
  });
  it('every weight key is a known rock type', () => {
    for (const f of MINE_RULES.floors) for (const k of Object.keys(f.weights)) expect(MINE_RULES.rocks[k]).toBeDefined();
  });
});
