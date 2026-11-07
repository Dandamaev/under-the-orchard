import mineJson from '../data/mine.json';
import type { Cell, Grid } from './grid';
import { pickWeighted, randInt, type Rng } from './rng';

export interface RockDef {
  hits: number;
  drop: string; // item id from items.json
  color: string;
}

export interface FloorRule {
  from: number;
  to: number | null; // null = "and deeper"
  rockCount: [number, number]; // inclusive
  weights: Record<string, number>;
}

export interface MineRules {
  rocks: Record<string, RockDef>;
  floors: FloorRule[];
}

export interface Rock {
  col: number;
  row: number;
  type: string;
  hp: number;
  hasLadder: boolean;
}

export interface HitResult {
  broken: boolean;
  drop: string | null;
  ladder: boolean;
}

// JSON is widened by TS; the cast is the single trust point.
export const MINE_RULES = mineJson as unknown as MineRules;

export function ruleForFloor(rules: MineRules, floor: number): FloorRule {
  const rule = rules.floors.find((r) => floor >= r.from && (r.to === null || floor <= r.to));
  if (!rule) throw new Error(`No mine rule for floor ${floor}`);
  return rule;
}

export function generateFloor(cave: Grid, floor: number, rules: MineRules, rng: Rng): Rock[] {
  const rule = ruleForFloor(rules, floor);

  // Free floor cells, minus the spawn cell and its 8 neighbours (player must not start boxed in).
  const free: Cell[] = [];
  for (let row = 0; row < cave.height; row++) {
    for (let col = 0; col < cave.width; col++) {
      if (cave.cells[row][col] !== 'mine_floor') continue;
      if (Math.abs(col - cave.spawn.col) <= 1 && Math.abs(row - cave.spawn.row) <= 1) continue;
      free.push({ col, row });
    }
  }

  // Fisher-Yates shuffle, then take the first N: no repeated cells.
  for (let i = free.length - 1; i > 0; i--) {
    const j = randInt(rng, 0, i);
    [free[i], free[j]] = [free[j], free[i]];
  }

  const count = Math.min(randInt(rng, rule.rockCount[0], rule.rockCount[1]), free.length);
  const rocks: Rock[] = free.slice(0, count).map(({ col, row }) => {
    const type = pickWeighted(rng, rule.weights);
    const def = rules.rocks[type];
    if (!def) throw new Error(`Unknown rock type: ${type}`);
    return { col, row, type, hp: def.hits, hasLadder: false };
  });

  // Exactly one rock hides the way down.
  if (rocks.length > 0) rocks[randInt(rng, 0, rocks.length - 1)].hasLadder = true;
  return rocks;
}

// One pickaxe hit = 1 damage (only the wooden pickaxe exists in the prototype).
export function hitRock(rock: Rock, rules: MineRules): HitResult {
  if (rock.hp <= 0) return { broken: false, drop: null, ladder: false }; // no double drop
  rock.hp -= 1;
  if (rock.hp > 0) return { broken: false, drop: null, ladder: false };
  return { broken: true, drop: rules.rocks[rock.type].drop, ladder: rock.hasLadder };
}

// Whole (not yet broken) rock on a cell.
export function rockAt(rocks: Rock[], cell: Cell): Rock | undefined {
  return rocks.find((r) => r.hp > 0 && r.col === cell.col && r.row === cell.row);
}
