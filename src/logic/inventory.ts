export interface Stack {
  id: string;
  count: number;
}

export class Inventory {
  readonly slots: (Stack | null)[];
  selected = 0;

  // maxStackOf is injected so logic stays independent of the item data.
  constructor(
    size: number,
    private readonly maxStackOf: (id: string) => number,
  ) {
    this.slots = Array.from({ length: size }, () => null);
  }

  // Returns how many items did NOT fit.
  add(id: string, count: number): number {
    const max = this.maxStackOf(id);
    let left = count;
    // Top up existing stacks first, then use empty slots.
    for (const slot of this.slots) {
      if (left <= 0) break;
      if (slot && slot.id === id && slot.count < max) {
        const put = Math.min(max - slot.count, left);
        slot.count += put;
        left -= put;
      }
    }
    for (let i = 0; i < this.slots.length && left > 0; i++) {
      if (this.slots[i] === null) {
        const put = Math.min(max, left);
        this.slots[i] = { id, count: put };
        left -= put;
      }
    }
    return left;
  }

  // Taking more than is there is a caller bug, so it throws.
  removeAt(index: number, count: number): void {
    const slot = this.slots[index];
    if (!slot) throw new Error(`Slot ${index} is empty`);
    if (count > slot.count) {
      throw new Error(`Slot ${index} holds ${slot.count}, cannot remove ${count}`);
    }
    slot.count -= count;
    if (slot.count === 0) this.slots[index] = null;
  }

  select(index: number): void {
    if (!Number.isInteger(index) || index < 0 || index >= this.slots.length) {
      throw new RangeError(`Slot out of range: ${index}`);
    }
    this.selected = index;
  }

  cycle(dir: 1 | -1): void {
    const n = this.slots.length;
    this.selected = (this.selected + dir + n) % n;
  }

  selectedStack(): Stack | null {
    return this.slots[this.selected];
  }
}
