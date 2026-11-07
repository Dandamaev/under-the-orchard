import itemsJson from '../data/items.json';

export type ItemKind = 'tool' | 'seed' | 'crop' | 'resource';
export type ToolKind = 'pickaxe' | 'hoe' | 'watering_can';

export interface ItemDef {
  name: string;
  kind: ItemKind;
  tool?: ToolKind;
  plant?: string;
  color: string;
  maxStack?: number;
}

export interface StartStack {
  id: string;
  count: number;
}

// JSON is widened to string kinds by TS; the cast is the single trust point.
const ITEMS = itemsJson.items as Record<string, ItemDef>;

export const ITEM_IDS: string[] = Object.keys(ITEMS);
export const START_INVENTORY: StartStack[] = itemsJson.startInventory;

// Unknown id is a data bug: fail loudly instead of skipping silently.
export function getItem(id: string): ItemDef {
  const def = ITEMS[id];
  if (!def) throw new Error(`Unknown item id: ${id}`);
  return def;
}

export function maxStackOf(id: string): number {
  return getItem(id).maxStack ?? 1;
}

export function isTool(id: string, tool: ToolKind): boolean {
  return getItem(id).tool === tool;
}
