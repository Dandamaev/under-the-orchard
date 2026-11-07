// Pure ASCII-map parser. No engine imports, so it stays unit-testable.

// Order matters: the tile index in the tileset strip equals the index here.
// mine_roof = solid top half of the 2x2 mine entrance; mine_entrance = walkable bottom half.
// Mine kinds are appended at the end so garden indices never shift.
export const TILE_KINDS = [
  'grass', 'soil', 'wall', 'tree', 'mine_entrance', 'mine_roof',
  'mine_floor', 'mine_wall', 'ladder_up', 'ladder_down',
] as const;
export type TileKind = (typeof TILE_KINDS)[number];

// Kinds that block movement.
export const SOLID_KINDS: readonly TileKind[] = ['wall', 'tree', 'mine_roof', 'mine_wall'];

// Legend value for the spawn marker: not a tile, the cell becomes grass.
const SPAWN_MARKER = 'spawn';

export interface MapData {
  legend: Record<string, string>;
  rows: string[];
}

export interface Cell {
  col: number;
  row: number;
}

export interface Grid {
  width: number;
  height: number;
  cells: TileKind[][]; // cells[row][col]
  spawn: Cell;
}

function isTileKind(value: string): value is TileKind {
  return (TILE_KINDS as readonly string[]).includes(value);
}

// spawnKind = tile placed under the spawn marker (grass in the garden, mine_floor in the mine).
export function parseMap(map: MapData, spawnKind: TileKind = 'grass'): Grid {
  const { legend, rows } = map;
  if (rows.length === 0) throw new Error('Map has no rows');

  // Validate legend values up front for a clear message.
  for (const [symbol, kind] of Object.entries(legend)) {
    if (kind !== SPAWN_MARKER && !isTileKind(kind)) {
      throw new Error(`Legend symbol '${symbol}' maps to unknown kind '${kind}'`);
    }
  }

  const width = rows[0].length;
  const cells: TileKind[][] = [];
  const spawns: Cell[] = [];

  rows.forEach((line, row) => {
    if (line.length !== width) {
      throw new Error(`Row ${row} has length ${line.length}, expected ${width}`);
    }
    const out: TileKind[] = [];
    for (let col = 0; col < line.length; col++) {
      const symbol = line[col];
      const kind = legend[symbol];
      if (kind === undefined) {
        throw new Error(`Unknown symbol '${symbol}' at row ${row}, col ${col}`);
      }
      if (kind === SPAWN_MARKER) {
        spawns.push({ col, row });
        out.push(spawnKind);
      } else {
        out.push(kind as TileKind); // checked above
      }
    }
    cells.push(out);
  });

  if (spawns.length !== 1) {
    throw new Error(`Map must have exactly one spawn marker, found ${spawns.length}`);
  }

  return { width, height: rows.length, cells, spawn: spawns[0] };
}

// Top-left cell of the first block of `kind` (row-major scan), e.g. the 2x2 mine entrance.
export function findBlockOrigin(grid: Grid, kind: TileKind): Cell | undefined {
  for (let row = 0; row < grid.height; row++) {
    const col = grid.cells[row].indexOf(kind);
    if (col >= 0) return { col, row };
  }
  return undefined;
}

// Deterministic grass variant per cell (no flicker, no RNG state). 0 = plain, others rarer.
export function grassVariant(col: number, row: number, variantCount: number): number {
  if (variantCount <= 1) return 0;
  const h = (Math.imul(col, 73856093) ^ Math.imul(row, 19349663)) >>> 0;
  const r = h % 10;
  if (r === 0) return 1; // rare: flowers
  if (r < 3) return Math.min(2, variantCount - 1);
  return 0;
}
