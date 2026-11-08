import Phaser from 'phaser';

export const DIGIT_FONT_KEY = 'digits';

// 3x5 pixel digits, rows top to bottom; '1' = lit pixel.
const GLYPHS: readonly string[][] = [
  ['111', '101', '101', '101', '111'], // 0
  ['010', '110', '010', '010', '111'], // 1
  ['111', '001', '111', '100', '111'], // 2
  ['111', '001', '111', '001', '111'], // 3
  ['101', '101', '111', '001', '001'], // 4
  ['111', '100', '111', '001', '111'], // 5
  ['111', '100', '111', '101', '111'], // 6
  ['111', '001', '001', '001', '001'], // 7
  ['111', '101', '111', '101', '111'], // 8
  ['111', '101', '111', '001', '111'], // 9
];
const CELL_W = 5; // glyph + 1 px outline on each side
const CELL_H = 7;
const FILL = '#ffffff';
const OUTLINE = '#000000';

// Tiny outlined digits for stack counts: the 8 px text font is too big for a 22 px slot.
export function buildDigitFont(scene: Phaser.Scene): void {
  const canvas = scene.textures.createCanvas(DIGIT_FONT_KEY, CELL_W * GLYPHS.length, CELL_H);
  if (!canvas) throw new Error('Failed to create digit font texture');
  const ctx = canvas.getContext();

  const eachPixel = (draw: (x: number, y: number) => void): void => {
    GLYPHS.forEach((rows, i) => {
      rows.forEach((row, y) => {
        [...row].forEach((bit, x) => {
          if (bit === '1') draw(i * CELL_W + 1 + x, 1 + y);
        });
      });
    });
  };
  // Outline first (3x3 around every lit pixel), then the fill on top.
  ctx.fillStyle = OUTLINE;
  eachPixel((x, y) => ctx.fillRect(x - 1, y - 1, 3, 3));
  ctx.fillStyle = FILL;
  eachPixel((x, y) => ctx.fillRect(x, y, 1, 1));
  canvas.refresh();

  // Despite its typing, Parse returns the full cache entry ({ data, texture, frame }).
  const entry = Phaser.GameObjects.RetroFont.Parse(scene, {
    image: DIGIT_FONT_KEY,
    width: CELL_W,
    height: CELL_H,
    chars: '0123456789',
    charsPerRow: GLYPHS.length,
    'spacing.x': 0,
    'spacing.y': 0,
    'offset.x': 0,
    'offset.y': 0,
    lineSpacing: 0,
  });
  scene.cache.bitmapFont.add(DIGIT_FONT_KEY, entry);
}
