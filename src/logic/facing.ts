import type { Cell } from './grid';

export type { Cell };
export type Facing = 'up' | 'down' | 'left' | 'right';

// dx, dy in {-1, 0, 1}. Keeps prev when it is still held, so adding a
// second key does not make the facing jitter.
export function resolveFacing(prev: Facing, dx: number, dy: number): Facing {
  if (dx === 0 && dy === 0) return prev;
  const horizontal: Facing | null = dx < 0 ? 'left' : dx > 0 ? 'right' : null;
  const vertical: Facing | null = dy < 0 ? 'up' : dy > 0 ? 'down' : null;
  if (horizontal && vertical) return prev === horizontal || prev === vertical ? prev : horizontal;
  return (horizontal ?? vertical) as Facing;
}

export function cellInFront(col: number, row: number, facing: Facing): Cell {
  switch (facing) {
    case 'up':
      return { col, row: row - 1 };
    case 'down':
      return { col, row: row + 1 };
    case 'left':
      return { col: col - 1, row };
    case 'right':
      return { col: col + 1, row };
  }
}
