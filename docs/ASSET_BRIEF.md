# Under the Orchard — Asset Brief for Image Generation

> **Для Гаджи (RU):** этот файл можно целиком отдать другой нейросети (ChatGPT/DALL·E, Midjourney, PixelLab, Retro Diffusion и т.п.). Написан на английском — генераторы картинок понимают его лучше.
> Совет: обычные генераторы плохо рисуют «честный» пиксель-арт 16×16. Лучше всего — специализированные пиксель-генераторы (PixelLab, Retro Diffusion). Если используешь обычный — проси картинку крупно (например, 512×512 на один спрайт), потом уменьшай до 16×16 **без сглаживания** (Nearest Neighbor) и подчищай руками в Aseprite/LibreSprite.
> Порядок: сначала делай раздел **Priority 1** — это то, что нужно прототипу (этапы P1–P3).

---

## 1. The game in short

**Under the Orchard** is a cozy top-down 2D farming game. The hero inherits an abandoned fruit orchard on a hillside. On the **surface**: grass, fruit trees, crop beds, a small house. **Under the orchard**, entered through the roots of an old tree, is a **mine** made of floors with rocks and ore. Mood: warm, calm, unhurried, no stress, no combat. "A game to relax in the evening."

The art must be **original**. It belongs to the general cozy farming genre, but do **not** copy or imitate the look, characters, or sprites of any existing game (e.g. Stardew Valley).

## 2. Style guide

- **Pixel art**, crisp hard pixels, **no anti-aliasing, no blur, no gradients, no soft shadows**.
- **Base grid: 16×16 px per tile.** Everything aligns to this grid.
- **Camera:** top-down with slight 3/4 perspective (we see the top and a bit of the front of objects — like classic top-down RPGs).
- **Outlines:** 1 px dark outline, colored (dark brown / dark purple), not pure black.
- **Light source:** top-left. Shading in 2–3 tones per color, flat.
- **Palette:** limited, soft and warm. Aim for ~24–32 colors total across the game.
  - Surface: warm greens, ochre, honey yellow, soft browns, cream.
  - Mine: bluish-violet, slate grey, cool teal; ore accents are the only bright spots.
- **Background:** transparent PNG for all sprites (except full ground tiles, which fill the whole 16×16).

### Suggested palette (starting point, can adjust)

| Use | Hex |
|---|---|
| Outline dark | `#2b1d1a` |
| Grass dark / mid / light | `#3f6b3a` / `#5f8f45` / `#8fb35a` |
| Soil dark / mid / light | `#5a3b26` / `#7a5236` / `#9c6f45` |
| Wet soil | `#4a3022` |
| Wood / bark | `#6b4a2f`, `#8a6440` |
| Ochre / honey | `#c9913d`, `#e8b85a` |
| Cream / highlight | `#f3e3b5` |
| Mine stone dark / mid / light | `#2e2a3d` / `#4a4560` / `#6e6a8a` |
| Mine floor | `#3a3550` |
| Coal | `#1e1c24` with `#4a4560` highlights |
| Copper ore | `#c46a3a`, `#e89a5a` |
| Fruit red / orange | `#c8443a`, `#e07a3a` |

## 3. Technical requirements

- Format: **PNG, 32-bit with transparency**, exact pixel sizes listed below (not upscaled). Optionally also deliver a ×4 preview.
- Spritesheets: frames in a **regular grid with no gaps and no padding**, left-to-right, top-to-bottom.
- File names: `snake_case`, English (e.g. `player_walk.png`, `crop_turnip.png`).
- Characters: the **feet** should be at the bottom-center of the frame (the game uses a small hitbox at the feet).
- Tiles that repeat (grass, soil, mine floor) must **tile seamlessly**.

---

## 3.1 Status — what is already delivered (Nov 2026)

> **Для Гаджи (RU):** что уже готово и подключено в игру, а что ещё нужно. Отмечай здесь по мере того, как добавляешь ассеты.

| Asset | File | Status |
|---|---|---|
| Hero, hat variant | `player_male.png` (80×96) | ✅ in game (character select) |
| Hero, headscarf variant | `player_female.png` (80×96) | ✅ in game (character select) |
| Hero, neutral | `player.png` | ⛔ not used (back view reads as a face without eyes) |
| Surface tiles (grass ×3, path, soil, tilled, watered, hedge) | `tiles_garden.png` (128×16) | ✅ grass + soil in game; tilled/watered → P3; hedge not used (see 4.2) |
| Mine entrance | `mine_entrance.png` (32×32) | ✅ in game |
| Trees | — | ❌ needed (placeholders now) |
| House | — | ❌ needed (placeholder block now) |
| Fence + border wall | — | ❌ needed (placeholders now) |
| Mine tiles, rocks | — | ❌ needed for P2 |
| Crops, item icons, hotbar UI | — | ❌ needed for P2–P3 |

Feedback on the delivered hero sprites: format is perfect. Next time please add the **1 px colored outline** from the style guide — the green clothes partly blend with the grass.

## 3.2 How the garden map is laid out (so sizes fit)

The garden is a 40×25 tile grid. Things that matter for art sizes:
- **Orchard trees** stand in rows: one tree every **3 tiles horizontally** and every **2 tiles vertically**. Only the **trunk base tile** blocks the player; the canopy is drawn above and may overlap the tree behind it (the game sorts by depth).
- **House**: a block of **6×4 tiles (96×64 px)** near the top of the map; the whole block is solid.
- **Fence**: a horizontal fence line with **1-tile openings** (gates/gaps) that the player walks through.
- **Border**: the whole map is enclosed by a solid border (wall/hedge), horizontal on top/bottom, vertical on the sides.
- **Mine entrance**: 2×2 tiles; the top row is solid (canopy/roots), the player steps onto the bottom row to enter.

## 4. Asset list

### Priority 1 — needed for the prototype

#### 4.1 Hero (player character) — ✅ delivered (two variants)
- The player picks one of two heroes at the start: **straw hat** (`player_male.png`) or **headscarf** (`player_female.png`). Keep any new hero sprites (tool animations) in both variants.
- Friendly young gardener/miner: simple work clothes (earthy colors), small backpack or apron. Readable silhouette at 16 px wide.
- Frame size: **16×24 px** (character is a bit taller than one tile).
- Directions: **down, up, left, right** (right can be a mirror of left — say so if mirrored).
- Sheet `player.png`, rows = directions in order **down, up, left, right**:
  - Columns 1: **idle** (1 frame)
  - Columns 2–5: **walk** (4 frames)
  - → sheet size 5 × 16 = 80 px wide, 4 × 24 = 96 px tall.
- Later (Priority 2): tool use animation — swing (pickaxe/hoe), water (watering can), 3 frames per direction.

#### 4.2 Surface tiles (16×16 each) → `tiles_garden.png`
1. Grass (2–3 variants, seamless; one with tiny flowers)
2. Dirt path
3. Untilled soil patch
4. Tilled soil (hoed bed)
5. Tilled soil, **watered** (darker, wet)
6. ~~Wall / hedge~~ — the delivered hedge tile has a brown strip at the bottom, so a row of them looks striped. **Do not reuse it for the border** — see 4.3c.
7. **Mine entrance** — ✅ delivered `mine_entrance.png` (32×32).

#### 4.3 Trees → `trees.png` or one PNG per tree
- **Orchard fruit tree** (apple-like, original design): **32×48 px** (2 tiles wide, 3 tall). The **trunk base sits on the bottom row, centered** — that single tile is the only solid part. Canopy must look fine when it overlaps the tree behind it (trees are 3 tiles apart horizontally, 2 tiles vertically). Versions: without fruit, with fruit.
- **Simple tree** (non-fruit, decorative/forest edge): 32×48 px, same anchor rule.
- **Small tree / bush**: 16×16 px (fully solid, one tile).
- **Old great tree** above the mine entrance (landmark, gnarled, huge roots): ~48×64 px, designed to sit **behind/above** `mine_entrance.png` so the opening stays visible at the bottom.

#### 4.3b House → `house.png`
- The hero's small cozy cottage: **96×64 px** (6×4 tiles), slight 3/4 view — roof on top, front wall with a **door at the bottom center** and 1–2 windows.
- Warm palette: wooden walls or light stone, roof in muted red/brown or thatch; a tiny chimney is welcome.
- Transparent background around the shape. The whole 6×4 footprint is solid in the game (no interior for now).
- Optional later: a second "upgraded" version of the same size.

#### 4.3c Fence and border wall (16×16 each) → `fence.png`, `border.png`
Both are **tile sets that connect seamlessly** when placed next to each other.
- **Wooden fence** (inside the garden):
  1. Horizontal piece (left-right, seamless)
  2. Vertical piece (top-bottom, seamless)
  3. 4 corners (top-left, top-right, bottom-left, bottom-right)
  4. End posts (left end, right end) — used next to a 1-tile opening
  5. Optional: open gate piece (16×16)
- **Border of the map** (low stone wall **or** dense hedge, pick one, without the bottom strip):
  1. Horizontal piece (seamless)
  2. Vertical piece (seamless)
  3. 4 outer corners
  - Must look like a solid, slightly raised edge in 3/4 view (top surface + a bit of the front face).

#### 4.4 Mine tiles (16×16 each) → `tiles_mine.png`
1. Cave floor (2–3 variants, seamless)
2. Cave wall (top surface + front face, so walls look raised)
3. **Ladder down** (hole in floor with ladder)
4. **Ladder up** (ladder leaning to the ceiling with a little light from above)

#### 4.5 Breakable rocks (16×16, transparent)
1. Small stone (2 variants)
2. Stone with **coal** veins
3. Stone with **copper ore** (orange glints)
4. Optional: 2-frame "cracked" state for each (shown after the first hit)
5. Small debris/particle sprite 4×4 or 8×8 (rock chips)

#### 4.6 Crops (16×16 per stage) → `crop_turnip.png`, `crop_carrot.png`
For **turnip** and **carrot**, a horizontal strip of **4 growth stages**:
1. Seeds just planted (tiny bump in soil)
2. Sprout
3. Young plant
4. Ready to harvest (vegetable visible)
Draw them **without** the soil underneath (transparent) — they are placed on top of the tilled-soil tile.

#### 4.7 Item icons (16×16, transparent) → `items.png`
Tools: wooden pickaxe, hoe, watering can.
Resources: stone, wood (log), coal, copper ore.
Seeds: turnip seeds (packet or seeds), carrot seeds.
Produce: turnip, carrot.

#### 4.8 UI
- Hotbar slot 20×20 px (normal) + selected/highlighted version.
- Simple wooden/parchment frame for the hotbar (9-slice friendly, corners 6×6).
- Small digit font is not needed (the game uses a regular font).

### Priority 2 — after the prototype

- Furniture: bed (16×32), workbench (32×16), storage chest (16×16). (The house itself moved to Priority 1 → 4.3b.)
- Wooden paths. (Fence moved to Priority 1 → 4.3c.)
- Fruit trees by season (spring blossom, summer green, autumn fruit, winter bare).
- Mine decor: glowing mushrooms, torches (2–4 frame flicker), crystals, underground lake edge tiles.
- Deep ores: iron, crystal.
- Copper pickaxe icon.
- Soft friendly cave creature (non-hostile), 16×16, 2-frame idle.
- Shipping box near the house, coin icon.
- Optional NPC: wandering merchant, same format as the hero.

---

## 5. Example prompts

Use the style block + one asset description.

**Style block (prepend to every prompt):**
> Original pixel art game asset, cozy top-down farming game, slight 3/4 view, 16x16 pixel grid, crisp hard pixels, no anti-aliasing, no blur, 1px colored dark-brown outline, light from top-left, flat 2–3 tone shading, soft warm limited palette, transparent background, not in the style of any existing game.

**Hero spritesheet:**
> Spritesheet of a friendly young gardener character, gender-neutral, earthy work clothes, straw hat, small apron. 16x24 pixel frames, 4 rows (facing down, up, left, right), 5 columns (1 idle + 4 walk cycle frames). Feet at bottom-center of each frame. No gaps between frames.

**Fruit tree:**
> Orchard fruit tree, 32x48 pixels, round soft canopy in warm greens, short thick trunk, a few red fruits. Second version without fruits. Transparent background.

**House:**
> Small cozy cottage for a farming game, 96x64 pixels, slight 3/4 top-down view, warm wooden walls, muted red roof, small chimney, door at bottom center, two windows. Transparent background.

**Fence and border:**
> Tileset of a wooden garden fence, each tile 16x16 pixels: horizontal piece, vertical piece, four corners, left and right end posts. Pieces connect seamlessly. Plus a low mossy stone wall tileset for the map border: horizontal, vertical, four outer corners, seamless. Transparent background.

**Mine rocks:**
> Set of breakable rocks for a cave, each 16x16 pixels: plain grey-violet stone (2 variants), stone with black coal veins, stone with shiny orange copper ore. Cool bluish-violet palette, transparent background.

**Crops:**
> Horizontal strip of 4 growth stages of a turnip crop, each 16x16 pixels: seed bump, sprout, young leaves, ripe turnip with purple-white top showing. No soil, transparent background.

---

## 6. Checklist before delivering

- [ ] Exact pixel size, no scaling or blur
- [ ] Transparent background where required
- [ ] Ground tiles tile seamlessly
- [ ] Same palette and outline style across all assets
- [ ] Spritesheets on a regular grid, no padding
- [ ] Original design, no resemblance to existing games' sprites
