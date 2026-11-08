import plantsJson from '../data/plants.json';
import type { Cell, TileKind } from './grid';
import type { ItemKind, ToolKind } from './db';

export interface PlantDef {
  seed: string;
  harvest: string;
  harvestCount: number;
  daysPerStage: number[]; // watered days needed per stage transition
  stageColors: string[]; // length = daysPerStage.length + 1
}
export type Plants = Record<string, PlantDef>;

export const PLANTS: Plants = plantsJson;

// Only tilled cells have a record; untilled soil = no entry.
export interface Plot {
  plant: string | null;
  stage: number;
  growth: number; // watered days lived on the current stage
  watered: boolean;
}

export type FarmAction = 'till' | 'plant' | 'water' | 'harvest';

// Subset of ItemDef that farm rules care about.
export interface HeldItem {
  kind: ItemKind;
  tool?: ToolKind;
  plant?: string;
}

export type Plots = Map<string, Plot>;

export function plotKey(cell: Cell): string {
  return `${cell.col},${cell.row}`;
}

export function isRipe(plot: Plot, plants: Plants): boolean {
  if (plot.plant === null) return false;
  const def = plants[plot.plant];
  if (!def) throw new Error(`Unknown plant id: ${plot.plant}`);
  return plot.stage >= def.daysPerStage.length;
}

// Single place deciding what a press does; used by both highlight and action.
export function farmAction(
  plots: Plots,
  cell: Cell,
  kind: TileKind | undefined,
  held: HeldItem | null,
  plants: Plants,
): FarmAction | null {
  const plot = plots.get(plotKey(cell));
  if (plot && isRipe(plot, plants)) return 'harvest'; // works with any/empty hand
  if (!held) return null;
  if (held.tool === 'hoe') return kind === 'soil' && !plot ? 'till' : null;
  if (held.kind === 'seed') return plot && plot.plant === null ? 'plant' : null;
  if (held.tool === 'watering_can') return plot && !plot.watered ? 'water' : null;
  return null;
}

export function till(plots: Plots, cell: Cell): void {
  plots.set(plotKey(cell), { plant: null, stage: 0, growth: 0, watered: false });
}

export function plant(plots: Plots, cell: Cell, plantId: string): void {
  const plot = mustGet(plots, cell);
  plot.plant = plantId;
  plot.stage = 0;
  plot.growth = 0;
}

export function water(plots: Plots, cell: Cell): void {
  mustGet(plots, cell).watered = true;
}

export function harvest(plots: Plots, cell: Cell): void {
  const plot = mustGet(plots, cell);
  plot.plant = null;
  plot.stage = 0;
  plot.growth = 0;
}

// Only watered plants grow; unwatered ones neither grow nor wither.
export function advanceDay(plots: Plots, plants: Plants): void {
  for (const plot of plots.values()) {
    if (plot.plant !== null && plot.watered && !isRipe(plot, plants)) {
      plot.growth += 1;
      if (plot.growth >= plants[plot.plant].daysPerStage[plot.stage]) {
        plot.stage += 1;
        plot.growth = 0;
      }
    }
    plot.watered = false;
  }
}

function mustGet(plots: Plots, cell: Cell): Plot {
  const plot = plots.get(plotKey(cell));
  if (!plot) throw new Error(`No plot at ${plotKey(cell)}`);
  return plot;
}
