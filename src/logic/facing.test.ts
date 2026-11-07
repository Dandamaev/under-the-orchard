import { describe, expect, it } from 'vitest';
import { cellInFront, resolveFacing } from './facing';

describe('resolveFacing', () => {
  it('keeps prev with no input', () => {
    expect(resolveFacing('left', 0, 0)).toBe('left');
  });

  it('single direction wins', () => {
    expect(resolveFacing('down', 1, 0)).toBe('right');
    expect(resolveFacing('down', -1, 0)).toBe('left');
    expect(resolveFacing('left', 0, -1)).toBe('up');
    expect(resolveFacing('left', 0, 1)).toBe('down');
  });

  it('diagonal keeps prev if it is among pressed', () => {
    expect(resolveFacing('right', 1, -1)).toBe('right');
    expect(resolveFacing('up', 1, -1)).toBe('up');
    expect(resolveFacing('left', -1, 1)).toBe('left');
    expect(resolveFacing('down', -1, 1)).toBe('down');
  });

  it('diagonal otherwise picks horizontal', () => {
    expect(resolveFacing('up', 1, 1)).toBe('right');
    expect(resolveFacing('right', -1, -1)).toBe('left');
    expect(resolveFacing('left', 1, 1)).toBe('right');
  });
});

describe('cellInFront', () => {
  it('returns the neighbour for each facing', () => {
    expect(cellInFront(5, 5, 'up')).toEqual({ col: 5, row: 4 });
    expect(cellInFront(5, 5, 'down')).toEqual({ col: 5, row: 6 });
    expect(cellInFront(5, 5, 'left')).toEqual({ col: 4, row: 5 });
    expect(cellInFront(5, 5, 'right')).toEqual({ col: 6, row: 5 });
  });
});
