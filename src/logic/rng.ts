// Small seeded RNG so floor generation is reproducible in tests.

export type Rng = () => number; // [0, 1)

// mulberry32
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Inclusive on both ends.
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

// Keys are picked proportionally to their weights; zero weights never win.
export function pickWeighted(rng: Rng, weights: Record<string, number>): string {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  if (entries.length === 0) throw new Error('pickWeighted: no positive weights');
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [key, w] of entries) {
    roll -= w;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0]; // float safety net
}
