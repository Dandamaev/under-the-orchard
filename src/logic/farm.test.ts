import { describe, expect, it } from 'vitest';
import itemsJson from '../data/items.json';
import { ITEM_IDS, getItem } from './db';
import {
  PLANTS,
  advanceDay,
  farmAction,
  harvest,
  isRipe,
  plant,
  plotKey,
  till,
  water,
  type HeldItem,
  type Plants,
  type Plots,
} from './farm';

// Fake plant: independent of plants.json. First stage needs two watered days.
const FAKE: Plants = {
  bean: {
    seed: 's',
    harvest: 'h',
    harvestCount: 1,
    daysPerStage: [2, 1, 1],
    stageColors: ['#000', '#111', '#222', '#333'],
  },
};
const cell = { col: 3, row: 4 };
const hoe: HeldItem = { kind: 'tool', tool: 'hoe' };
const can: HeldItem = { kind: 'tool', tool: 'watering_can' };
const pick: HeldItem = { kind: 'tool', tool: 'pickaxe' };
const seed: HeldItem = { kind: 'seed', plant: 'bean' };

const planted = (id = 'bean'): Plots => {
  const plots: Plots = new Map();
  till(plots, cell);
  plant(plots, cell, id);
  return plots;
};
const get = (plots: Plots) => plots.get(plotKey(cell))!;

describe('farmAction', () => {
  it('hoe tills soil without a record only', () => {
    const plots: Plots = new Map();
    expect(farmAction(plots, cell, 'soil', hoe, FAKE)).toBe('till');
    expect(farmAction(plots, cell, 'grass', hoe, FAKE)).toBeNull();
    expect(farmAction(plots, cell, undefined, hoe, FAKE)).toBeNull();
    till(plots, cell);
    expect(farmAction(plots, cell, 'soil', hoe, FAKE)).toBeNull();
  });

  it('seed plants only on empty tilled soil', () => {
    const plots: Plots = new Map();
    expect(farmAction(plots, cell, 'soil', seed, FAKE)).toBeNull();
    till(plots, cell);
    expect(farmAction(plots, cell, 'soil', seed, FAKE)).toBe('plant');
    plant(plots, cell, 'bean');
    expect(farmAction(plots, cell, 'soil', seed, FAKE)).toBeNull();
  });

  it('can waters tilled dry cells only', () => {
    const plots: Plots = new Map();
    expect(farmAction(plots, cell, 'soil', can, FAKE)).toBeNull();
    till(plots, cell);
    expect(farmAction(plots, cell, 'soil', can, FAKE)).toBe('water');
    water(plots, cell);
    expect(farmAction(plots, cell, 'soil', can, FAKE)).toBeNull();
  });

  it('ripe plant is harvested with any item or empty hand', () => {
    const plots = planted();
    get(plots).stage = 3;
    for (const held of [hoe, can, seed, pick, null]) {
      expect(farmAction(plots, cell, 'soil', held, FAKE)).toBe('harvest');
    }
  });

  it('empty hand does nothing on an unripe plant', () => {
    expect(farmAction(planted(), cell, 'soil', null, FAKE)).toBeNull();
  });

  it('pickaxe does nothing on farm cells', () => {
    const plots: Plots = new Map();
    expect(farmAction(plots, cell, 'soil', pick, FAKE)).toBeNull();
    till(plots, cell);
    expect(farmAction(plots, cell, 'soil', pick, FAKE)).toBeNull();
  });
});

describe('advanceDay', () => {
  it('watered plant grows, watered flag resets', () => {
    const plots = planted();
    get(plots).stage = 1; // needs 1 day
    water(plots, cell);
    advanceDay(plots, FAKE);
    expect(get(plots)).toMatchObject({ stage: 2, growth: 0, watered: false });
  });

  it('unwatered plant neither grows nor regresses', () => {
    const plots = planted();
    water(plots, cell);
    advanceDay(plots, FAKE); // growth 1
    advanceDay(plots, FAKE); // skipped watering
    advanceDay(plots, FAKE);
    expect(get(plots)).toMatchObject({ plant: 'bean', stage: 0, growth: 1 });
  });

  it('resets watered on every plot, including empty ones', () => {
    const plots: Plots = new Map();
    till(plots, { col: 0, row: 0 });
    till(plots, { col: 1, row: 0 });
    water(plots, { col: 0, row: 0 });
    water(plots, { col: 1, row: 0 });
    advanceDay(plots, FAKE);
    expect([...plots.values()].every((p) => !p.watered)).toBe(true);
  });

  it('first stage needs two watered days when daysPerStage is [2,1,1]', () => {
    const plots = planted();
    water(plots, cell);
    advanceDay(plots, FAKE);
    expect(get(plots).stage).toBe(0);
    water(plots, cell);
    advanceDay(plots, FAKE);
    expect(get(plots)).toMatchObject({ stage: 1, growth: 0 });
  });

  it('ripe plant stops growing', () => {
    const plots = planted();
    get(plots).stage = 3;
    water(plots, cell);
    advanceDay(plots, FAKE);
    expect(get(plots)).toMatchObject({ stage: 3, growth: 0 });
    expect(isRipe(get(plots), FAKE)).toBe(true);
  });

  it('empty tilled plot is untouched except watered', () => {
    const plots: Plots = new Map();
    till(plots, cell);
    water(plots, cell);
    advanceDay(plots, FAKE);
    expect(get(plots)).toEqual({ plant: null, stage: 0, growth: 0, watered: false });
  });
});

describe('turnip full cycle', () => {
  it('daily watering: ripe on day 4, not before', () => {
    const plots: Plots = new Map();
    till(plots, cell);
    plant(plots, cell, 'turnip');
    for (let i = 0; i < 3; i++) {
      expect(isRipe(get(plots), PLANTS)).toBe(false);
      water(plots, cell);
      advanceDay(plots, PLANTS);
    }
    expect(isRipe(get(plots), PLANTS)).toBe(true);
    expect(farmAction(plots, cell, 'soil', null, PLANTS)).toBe('harvest');
  });

  it('skipped watering delays ripening without wilting', () => {
    const plots: Plots = new Map();
    till(plots, cell);
    plant(plots, cell, 'turnip');
    water(plots, cell);
    advanceDay(plots, PLANTS);
    advanceDay(plots, PLANTS); // no water
    expect(get(plots)).toMatchObject({ plant: 'turnip', stage: 1 });
    for (let i = 0; i < 2; i++) {
      water(plots, cell);
      advanceDay(plots, PLANTS);
    }
    expect(isRipe(get(plots), PLANTS)).toBe(true);
  });

  it('unripe turnip cannot be harvested', () => {
    const plots: Plots = new Map();
    till(plots, cell);
    plant(plots, cell, 'turnip');
    expect(farmAction(plots, cell, 'soil', null, PLANTS)).toBeNull();
    expect(farmAction(plots, cell, 'soil', hoe, PLANTS)).toBeNull();
  });

  it('after harvest the cell is empty but still tilled', () => {
    const plots = planted('turnip');
    get(plots).stage = 3;
    harvest(plots, cell);
    expect(get(plots)).toMatchObject({ plant: null, stage: 0, growth: 0 });
    expect(farmAction(plots, cell, 'soil', seed, PLANTS)).toBe('plant');
    expect(farmAction(plots, cell, 'soil', hoe, PLANTS)).toBeNull();
  });
});

describe('plant data', () => {
  it('stageColors length is daysPerStage length + 1', () => {
    for (const [id, def] of Object.entries(PLANTS)) {
      expect(def.stageColors, id).toHaveLength(def.daysPerStage.length + 1);
    }
  });

  it('seed and harvest exist in items.json', () => {
    for (const def of Object.values(PLANTS)) {
      expect(ITEM_IDS).toContain(def.seed);
      expect(ITEM_IDS).toContain(def.harvest);
    }
  });

  it('seed items and plants point at each other', () => {
    for (const id of ITEM_IDS) {
      const item = getItem(id);
      if (item.kind !== 'seed') continue;
      expect(item.plant, id).toBeDefined();
      expect(PLANTS[item.plant!], id).toBeDefined();
      expect(PLANTS[item.plant!].seed).toBe(id);
    }
    for (const def of Object.values(PLANTS)) {
      expect(getItem(def.seed).kind).toBe('seed');
    }
  });

  it('start inventory has 20 turnip seeds', () => {
    const s = itemsJson.startInventory.find((x) => x.id === 'seed_turnip');
    expect(s?.count).toBe(20);
  });
});
