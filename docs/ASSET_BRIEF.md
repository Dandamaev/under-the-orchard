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
> Где лежат файлы: `public/assets/` — то, что реально грузит игра; `docs/assets/` — архив исходников и превью (туда же клади всё, что прислала нейросеть, даже неудачное); `dist/` — результат сборки, руками не трогать. Новый ассет попадает в игру, только когда его положили в `public/assets/` и подключили в коде.
>
> **Note (Nov 2026):** все тайлы, камни, иконки и репа ниже со статусом «✅ own simple art» нарисованы Claude в текущей простой 16×16-палитре как рабочие спрайты прототипа — НЕ финальный стиль. Красивый Stardew-стиль придёт позже (см. память `art-direction-preference`). Скрипт-генератор: `scratchpad/gen_assets.ps1` (вне репо) — пиксельные карты прямо в коде, легко перерисовать.

| Asset | File | Status |
|---|---|---|
| Hero, hat variant | `player_male.png` (80×96) | ✅ in game (character select) |
| Hero, headscarf variant | `player_female.png` (80×96) | ✅ in game (character select) |
| Hero, neutral | `player.png` | ⛔ not used (back view reads as a face without eyes) |
| Surface + mine tiles (12-frame atlas, see 4.2) | `tiles_garden.png` (192×16) | ✅ own simple art — grass×3, bare/tilled/watered soil, stone wall, tree, mine floor/wall, ladders up/down, all in game |
| Mine entrance | `mine_entrance.png` (32×32) | ✅ in game (AI, kept) |
| Breakable rocks | `rock_rock/coal/copper.png` | ✅ own simple art — in game |
| Item icons | `item_<id>.png` ×8 | ✅ own simple art — pickaxe, hoe, can, turnip seeds, turnip, stone, coal, copper in hotbar |
| Turnip crop (4 stages) | `crop_turnip.png` (64×16) | ✅ own simple art — in game (P3) |
| Trees (decor 32×48), house, fence | — | ⬜ later — garden currently uses the 16×16 tree/wall tiles above; big decorative trees & house are future (need map changes) |
| Tool animations (swing/water) | — | ⬜ later — tools work without an animation |
| Hotbar frame / effects (4.9) | — | ⬜ later — hotbar uses a drawn frame; effects are polish |

Feedback on the delivered hero sprites: format is perfect. Next time please add the **1 px colored outline** from the style guide — the green clothes partly blend with the grass. In the **back view (row 2)** the head is one big dark blob; show a bit of hat brim / hair shape and the neck so it reads as "seen from behind".

Feedback on `mine_entrance.png`: good — it already has the outline and palette we want; use it as the **style reference** for trees and the house.

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
- One sheet per variant (`player_male.png`, `player_female.png`), same layout; rows = directions in order **down, up, left, right**:
  - Columns 1: **idle** (1 frame)
  - Columns 2–5: **walk** (4 frames)
  - → sheet size 5 × 16 = 80 px wide, 4 × 24 = 96 px tall.
- Next (needed for P2–P3): tool use animation, **both variants**, separate sheets `player_male_tools.png` / `player_female_tools.png`, 16×24 frames, rows **down, up, left, right**:
  - Columns 1–3: **swing** (raise → hit → recover; used for pickaxe and hoe, the tool itself is drawn in the hand)
  - Columns 4–6: **water** (tilt the watering can)
  - → sheet size 6 × 16 = 96 px wide, 96 px tall. The tool may stick out of the 16 px width only if you widen the frame for **all** frames — tell us the new frame size.

#### 4.2 Surface tiles (16×16 each) → `tiles_garden.png`
The game reads tiles **by their position** in the strip. **Never reorder existing frames** — fix a frame in place, and add new tiles **at the end** (frame 8, 9, …).

Current strip (128×16, 8 frames):

| Frame | Content | In game | Verdict |
|---|---|---|---|
| 0 | Grass with tiny flowers | grass variant (rare) | ✅ keep |
| 1 | Grass, plain | main grass | ✅ keep |
| 2 | Light dirt, untilled | not yet (path / bare soil) | ✅ keep |
| 3 | Dark soil with furrows | the crop field (`soil`) | ✅ keep — this is the "tilled bed" look |
| 4 | Light horizontal stripes | not used | ⚠️ **redo**: reads as wooden planks, not soil. Replace with **tilled soil, dry**: same furrows as frame 3 but a bit lighter |
| 5 | Very dark soil with furrows | not used | ⚠️ **redo**: too close to frame 3. Make **tilled soil, watered** = exactly frame 4's furrows, darker and wet (a few dark-blue-brown puddle pixels) — the dry → wet change must be obvious at a glance |
| 6 | Hedge with brown strip at the bottom | not used | ⛔ do not reuse for the border (a row looks striped) — see 4.3c |
| 7 | Grass, plain variant | grass variant | ✅ keep |

Rule for the tilled pair (frames 4 and 5): **identical shape**, only the colors differ — the game swaps one for the other when the player waters.

**Mine entrance** — ✅ delivered `mine_entrance.png` (32×32).

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

#### 4.4 Mine tiles (16×16 each) → `tiles_mine.png`, one row in **this exact frame order**:
0–2. Cave floor (3 variants, seamless; frame 0 = the plain one)
3. Cave wall (top surface + front face, so walls look raised)
4. **Ladder down** (hole in floor with ladder)
5. **Ladder up** (ladder leaning to the ceiling with a little light from above)

#### 4.5 Breakable rocks (16×16, transparent)
1. Small stone (2 variants)
2. Stone with **coal** veins
3. Stone with **copper ore** (orange glints)
4. Optional: 2-frame "cracked" state for each (shown after the first hit)
5. Small debris/particle sprite 4×4 or 8×8 (rock chips)

#### 4.6 Crops (16×16 per stage) → `crop_<plant>.png`: `crop_turnip.png` (needed now), `crop_carrot.png`
One file per plant, a horizontal strip, **one frame per growth stage** (frame number = stage). Turnip and carrot have **4 stages** → 64×16 px:
0. Seeds just planted (tiny bump in soil)
1. Sprout
2. Young plant
3. Ready to harvest (vegetable visible)

Rules:
- Draw them **without** the soil underneath (transparent) — they are placed on top of the tilled-soil tile, which can be **dry or wet** (frames 4/5 of `tiles_garden.png`); the plant must read well on both.
- The plant **grows visibly** every stage (bigger and/or fuller) — this is the "visible progress" the game is about.
- The **ripe stage must be obvious at a glance** (the vegetable pokes out, brighter color) — the player harvests it by walking up and pressing the action key.
- Keep everything inside 16×16, anchored to the **bottom-center** (the game sorts plants by their bottom edge, like the hero). Leaves may reach the top edge of the frame.
- Plants never wither in this game — no dead/dry versions needed.
- The ripe vegetable should look like its item icon (4.7: turnip, carrot), and the seed bump should hint at the seed packet.

#### 4.6b Plants on the map (decor, Priority 2)
Not needed for the prototype, listed so the style stays consistent:
- Grass tufts (2 variants), small wildflowers (2–3 colors), a fern — 16×16, transparent, walkable decor.
- Berry bush 16×16 (with/without berries).

#### 4.7 Item icons (16×16, transparent) → `items.png`
One row, **this exact frame order** (the game looks icons up by position; new icons go at the end):
0 wooden pickaxe, 1 hoe, 2 watering can, 3 stone, 4 wood log, 5 coal, 6 copper ore, 7 turnip seeds, 8 carrot seeds, 9 turnip, 10 carrot → 176×16 px.

Icon rules: the tool icon must match the tool drawn in the hero's hand (4.1). Ore icons must match their rock (4.5): same coal black, same copper orange, so the player connects "this rock → this item". Icons are shown inside a 20×20 slot, with the stack count drawn by the game in the bottom-right corner — keep the bottom-right 6×6 px of the icon free of important detail.

Later icons (Priority 2) **continue the same strip**, in this order: 11 copper pickaxe, 12 copper bar, 13 torch, 14 iron ore, 15 iron bar, 16 crystal, 17 glowing mushroom, 18 coin. Do not draw them now unless asked; the numbers are reserved so the order never changes.

#### 4.8 UI
- Hotbar slot 20×20 px (normal) + selected/highlighted version. The hotbar has **9 slots** in one row at the bottom of a 480×270 screen.
- Simple wooden/parchment frame for the hotbar (9-slice friendly, corners 6×6). The same frame is reused for the character select screen and the day indicator.
- **Target cursor** 16×16: a thin bracket-style frame (4 corner marks, transparent center) shown on the tile in front of the hero — the tile the tool will hit. 2 frames: normal and "pulse" (slightly brighter).
- **Day indicator** icon 12×12: a small sun (shown next to "Day N" text in the top corner).
- **Key hint** 10×10: a tiny key cap with the letter **E** (shown over the mine entrance / ladders: "press E").
- Small digit font is not needed (the game uses a regular font for counts and text).

#### 4.9 Effects (small sprites, transparent)
- **Rock chips**: 3–4 tiny pieces 4×4 (grey-violet; plus a copper-orange and a coal-black variant), flying out when a rock is hit.
- **Rock break puff**: 3-frame dust puff, 16×16.
- **Hoe dirt**: 3-frame soil puff, 16×16 (when tilling).
- **Water splash**: 3-frame droplets, 16×16 (when watering).
- **Harvest sparkle**: 3-frame small star sparkle, 16×16 (crop is ready / collected).
- **Item pickup**: the game moves the item icon itself toward the hotbar — no extra sprite needed.
→ one sheet `effects.png`, 16×16 frames, one effect per row in the order above (chips in row 1 as 4×4 pieces placed in the first 16×16 frames).

### Priority 2 — after the prototype

- Furniture: bed (16×32), workbench (32×16), storage chest (16×16). (The house itself moved to Priority 1 → 4.3b.)
- Furnace for smelting ore into bars (32×32, 2 frames: cold / burning) — only if smelting stays in the design.
- Item icons 11–18 (copper pickaxe, bars, torch, iron, crystal, mushroom, coin) — order fixed in 4.7.
- Copper pickaxe also as a **held tool** in the hero tool animation (same layout as 4.1, recolored head).
- Wooden paths. (Fence moved to Priority 1 → 4.3c.)
- Fruit trees by season (spring blossom, summer green, autumn fruit, winter bare).
- Fruit tree **growth stages** (same 32×48 frame, trunk base anchored the same way): sapling → young tree → mature (= the 4.3 tree) — strip `tree_fruit_growth.png`.
- More crops, same 4-stage 16×16 format as 4.6: potato, pumpkin, strawberry; plus fruit tree kinds: apple, pear, plum.
- Seed and produce icons for them continue `items.png` after the reserved numbers in 4.7 (19 onwards), in the order the crops are added.
- Mine decor: glowing mushrooms, torches (2–4 frame flicker), crystals, underground lake edge tiles.
- Deep ore rocks: iron, crystal (same format as 4.5).
- Soft friendly cave creature (non-hostile), 16×16, 2-frame idle.
- Shipping box near the house, coin icon.
- Optional NPC: wandering merchant, same format as the hero.

---

## 5. Example prompts

Use the style block + one asset description.

**Style block (prepend to every prompt):**
> Original pixel art game asset, cozy top-down farming game, slight 3/4 view, 16x16 pixel grid, crisp hard pixels, no anti-aliasing, no blur, 1px colored dark-brown outline, light from top-left, flat 2–3 tone shading, soft warm limited palette, transparent background, not in the style of any existing game.

**Hero tool animations** (do it twice: once for the straw-hat hero, once for the headscarf hero; attach the existing `player_male.png` / `player_female.png` as reference):
> Spritesheet of the same character as the reference image, same colors and proportions, 1px dark-brown outline. 16x24 pixel frames, 4 rows (facing down, up, left, right), 6 columns: 3 frames swinging a small wooden pickaxe (raise, hit, recover), 3 frames pouring a watering can. Feet at bottom-center of each frame. No gaps between frames.

**Tilled soil fix:**
> Two 16x16 seamless ground tiles side by side (32x16 total): left — dry hoed soil with horizontal furrows, warm medium brown; right — the exact same furrows but wet, darker brown with a few tiny dark puddle pixels. Same shape, only colors differ. No transparency.

**Fruit tree:**
> Orchard fruit tree, 32x48 pixels, round soft canopy in warm greens, short thick trunk, a few red fruits. Second version without fruits. Transparent background.

**House:**
> Small cozy cottage for a farming game, 96x64 pixels, slight 3/4 top-down view, warm wooden walls, muted red roof, small chimney, door at bottom center, two windows. Transparent background.

**Fence and border:**
> Tileset of a wooden garden fence, each tile 16x16 pixels: horizontal piece, vertical piece, four corners, left and right end posts. Pieces connect seamlessly. Plus a low mossy stone wall tileset for the map border: horizontal, vertical, four outer corners, seamless. Transparent background.

**Mine rocks:**
> Set of breakable rocks for a cave, each 16x16 pixels: plain grey-violet stone (2 variants), stone with black coal veins, stone with shiny orange copper ore. Cool bluish-violet palette, transparent background.

**Mine tiles:**
> Cave tileset, each tile 16x16 pixels, strip 80x16: three seamless cave floor variants (dark blue-violet stone, small pebbles), a raised cave wall tile (lighter top surface, darker front face), a hole in the floor with a wooden ladder going down. Plus a separate 16x16 tile: wooden ladder going up with a soft beam of warm light from above. Cool bluish-violet palette.

**Crops:**
> Horizontal strip of 4 growth stages of a turnip crop, each 16x16 pixels (64x16 total): seed bump, sprout, young leaves, ripe turnip with purple-white top showing. Each stage clearly bigger than the previous, ripe stage clearly different. Plant anchored to the bottom-center of each frame. No soil, transparent background; must read well on both dry and wet brown soil.

> Same for carrot: seed bump, sprout, feathery young leaves, ripe carrot with orange top showing, 64x16 total.

**Item icons:**
> Item icon sheet, each icon 16x16 pixels, one row, no gaps, in this exact order: wooden pickaxe, hoe, watering can, stone, wood log, coal lump, copper ore, turnip seeds packet, carrot seeds packet, turnip, carrot. Clear readable silhouettes, 1px dark outline, transparent background.

**Hotbar UI:**
> Inventory hotbar slot for a cozy pixel art game, 20x20 pixels, wooden frame with a parchment-colored inside; second version highlighted with a warm honey-yellow border. Plus a 9-slice wooden panel frame, 18x18 pixels with 6x6 corners. Transparent background.

**Small UI pieces:**
> Small pixel art UI elements, transparent background: a 16x16 target cursor made of four thin corner brackets (honey-yellow, transparent center), two frames (normal, brighter); a 12x12 sun icon; a 10x10 keyboard key cap with the letter E. Crisp pixels, 1px dark outline.

**Effects:**
> Pixel art effect spritesheet, 16x16 frames, transparent background, rows: tiny rock chips (grey-violet, coal-black, copper-orange), 3-frame dust puff, 3-frame brown soil puff, 3-frame blue water splash droplets, 3-frame small golden sparkle. Soft warm palette, no blur.

**Later icons (Priority 2, only when asked):**
> Item icons continuing the same style, 16x16 each, one row in this order: copper pickaxe, copper bar, torch, iron ore, iron bar, crystal, glowing mushroom, coin. Same outline and palette as the existing icons. Transparent background.

---

## 6. Checklist before delivering

- [ ] Exact pixel size, no scaling or blur
- [ ] Transparent background where required
- [ ] Ground tiles tile seamlessly
- [ ] Same palette and outline style across all assets
- [ ] Spritesheets on a regular grid, no padding
- [ ] Original design, no resemblance to existing games' sprites
