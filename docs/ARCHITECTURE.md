# Under the Orchard — архитектура веб-прототипа (v0.3)

> Документ для ветки `prototype` (TypeScript + Phaser 3 + Vite в Docker). Описывает, **как устроен код**, а не что в игре происходит — это в `docs/GAME_DESIGN.md`.
> Прототип черновой: здесь только то, что нужно для P0–P3. Крафт, сон, сохранение — не в прототипе.

## 0. Главная идея в трёх строках

1. **Логика игры** (инвентарь, грядки, генерация этажа, день) — обычный TypeScript без Phaser, в папке `src/logic/` + общее состояние `src/state.ts`. Его легко тестировать и потом переписать на GDScript почти один в один.
2. **Сцены Phaser** (`src/scenes/`) только рисуют, читают ввод и вызывают логику. Об изменениях узнают через события.
3. **Данные** (предметы, растения, правила этажей, карты) — JSON в `src/data/`.

Правило, которое легко проверить: **в `src/logic/` и `src/state.ts` нет `import ... from 'phaser'`.**

---

## 1. Структура папок

```
Under the Orchard/
├── CLAUDE.md
├── docs/
│   ├── GAME_DESIGN.md
│   └── ARCHITECTURE.md
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── package.json
├── package-lock.json        # создаётся npm install в контейнере, коммитим
├── tsconfig.json
├── vite.config.ts           # и настройки Vitest
├── index.html
├── public/assets/           # PNG-ассеты (тайлы сада, спрайты героев, вход в шахту)
└── src/
    ├── main.ts              # создаёт Phaser.Game, список сцен
    ├── constants.ts         # TILE = 16, размер экрана, HOTBAR_SIZE и т.п.
    ├── state.ts             # GameState: день, инвентарь, грядки, этаж + события (без Phaser)
    ├── logic/               # чистая логика, БЕЗ Phaser
    │   ├── emitter.ts       # крошечный типизированный emitter (аналог сигналов Godot)
    │   ├── rng.ts           # детерминированный ГСЧ с seed (для тестов генерации)
    │   ├── grid.ts          # разбор ASCII-карты в сетку тайлов
    │   ├── facing.ts        # направление взгляда и «клетка перед игроком»
    │   ├── db.ts            # типизированный доступ к JSON (аналог ItemDB)
    │   ├── inventory.ts     # слоты, стаки, выбранный слот
    │   ├── farm.ts          # вскопать / посадить / прошёл день / собрать
    │   ├── mine.ts          # генерация этажа, удар по камню, дроп
    │   └── *.test.ts        # тесты Vitest рядом с модулями
    ├── scenes/
    │   ├── BootScene.ts     # грузит PNG, собирает тайлсет и текстуры-заглушки, запускает CharacterSelect
    │   ├── CharacterSelectScene.ts  # выбор героя перед стартом
    │   ├── GardenScene.ts   # сад
    │   ├── MineScene.ts     # ОДИН класс для всех этажей, номер этажа — параметр
    │   └── UIScene.ts       # хотбар и «День N» поверх игры
    ├── objects/
    │   ├── Player.ts        # спрайт игрока: ходьба, направление взгляда (общий для сада и шахты)
    │   ├── playerAnims.ts   # анимации ходьбы/стойки из листа спрайтов
    │   ├── transition.ts    # (P2) затемнение + смена сцены
    │   └── tilemap.ts       # хелпер: сетка из grid.ts → Phaser Tilemap с коллизиями
    └── data/
        ├── items.json
        ├── plants.json
        ├── mine.json
        └── maps/
            ├── garden.json
            └── mine-cave.json
```

Почему `src/data/`, а не `data/` в корне: JSON импортируется прямо в код (`import items from './data/items.json'`) — Vite сам подхватывает изменения, TypeScript видит структуру, не нужен асинхронный загрузчик. В Godot-версии папка станет `data/` в корне проекта — смысл тот же.

Папок «на вырост» (services, managers, ecs, utils) нет. Появится реальная нужда — добавим.

---

## 2. Сцены и переходы

| Сцена | Что делает | Как запускается |
|---|---|---|
| `BootScene` | Грузит PNG из `public/assets`, собирает полоску-тайлсет `tiles` на canvas (арт, где он есть, иначе цветной квадрат), рисует текстуры-заглушки для камней и иконок предметов, создаёт анимации героев. Потом запускает `CharacterSelect`. | Первая в списке сцен |
| `CharacterSelectScene` | Выбор героя (в шляпе / в косынке). По Enter запускает `Garden` и `UI`. | `scene.start('CharacterSelect')` из Boot |
| `GardenScene` | Карта сада, игрок, грядки, вход в шахту. Клавиша `N` — «новый день» (вместо сна, сна в прототипе нет; появится в P3). | `scene.start('Garden', { from })` |
| `MineScene` | Этаж шахты: стены пещеры, камни, лестница вверх, спрятанная лестница вниз. | `scene.start('Mine', { floor })` |
| `UIScene` | Хотбар (9 слотов, клавиши 1–9 и колёсико), надпись «День N», в шахте — «Этаж N». Работает всё время поверх других сцен. | `scene.launch('UI')` один раз из CharacterSelect |

В `main.ts` сцена `Mine` стоит в списке **до** `UI` — тогда хотбар рисуется поверх неё (порядок в списке = порядок отрисовки).

Переходы:

```
Boot ──> CharacterSelect ──> Garden ──(на входе M, нажал E)──> Mine {floor: 1}
                               ^                                 │
                               │                    (на лестнице вниз, нажал E,
                               │                     она была под камнем)
                               │                                 v
                               └──(на лестнице вверх, нажал E)── Mine {floor: n+1}
```

- **Один `MineScene` на все этажи.** Переход на следующий этаж = `this.scene.start('Mine', { floor: n + 1 })` — сцена перезапускается с новыми данными. В `init(data)` берём номер этажа, в `create()` генерируем этаж через `logic/mine.ts`.
- **Лестница вверх** с любого этажа ведёт сразу в сад (решено автором).
- **Сад при возвращении** строится заново из `state` (грядки хранятся в состоянии, а не в сцене). Параметр `from: 'mine'` ставит игрока **под входом в шахту** (взгляд вниз), а не в `spawn`.
- **Этаж не сохраняется**: при каждом входе генерируется заново (камни на нём восстанавливаются). Запоминаем только номер текущего этажа (`state.mine.floor`, 0 = в саду). «Самый глубокий этаж» не храним, пока он ни на что не влияет.
- `UIScene` не перезапускается при смене сцен — она просто остаётся сверху.
- Подробно о входе, лестницах и появлении игрока — раздел 10.1.

Ввод и взаимодействие (общее для сада и шахты):
- Движение: стрелки / WASD, Arcade Physics, коллизии со слоем стен тайлмапа. Диагональ разрешена (две клавиши сразу), скорость по диагонали нормализована. **Взгляд** — всегда одно из 4 направлений (вверх/вниз/влево/вправо). Камера следует за игроком, ограничена размером карты. Подробно — раздел 9.
- Действие: `Space` или левая кнопка мыши (можно держать — повтор с кулдауном) — применить предмет из выбранного слота к **клетке перед игроком** (`player.frontCell()`). Кирка → камень (P2), мотыга → земля, семя → вскопанная грядка, пустая рука / любой предмет на спелом растении → собрать (P3).
- Переходы между сценами (вход в шахту, лестницы) — **по кнопке `E`**, когда игрок стоит на клетке перехода (решение автора). `Space`/ЛКМ остаются за инструментами.
- Экран: 480×270 пикселей игры, `pixelArt: true`, `Scale.FIT` (растягивается на окно браузера без размытия).

---

## 3. Состояние и связь систем

### Где что живёт

`src/state.ts` — один объект `GameState` (аналог autoload-синглтонов `GameState` + `Inventory` в Godot). Модуль экспортирует единственный экземпляр.

| Данные | Где | Тип (примерно) |
|---|---|---|
| Текущий день | `state.day` | `number` |
| Выбранный герой | `state.character` | `CharacterKey` |
| Инвентарь (хотбар) | `state.inventory` | `Inventory` из `logic/inventory.ts` |
| Грядки сада (P3) | `state.plots` | `Map<string, Plot>`, ключ `"x,y"` |
| Шахта | `state.mine` | `{ floor: number }` (0 = в саду) |
| События | `state.events` | `Emitter<GameEvents>` |

Камни текущего этажа (с их «здоровьем») живут в `MineScene` как результат `generateFloor(...)` — они нужны только пока ты на этаже.

### Как системы общаются

- **Логика (`logic/*`) — чистые функции и маленькие классы.** Ничего не знают о Phaser и событиях: данные внутрь — результат наружу. Пример: `hitRock(rock, rules) → { broken, drop, ladder }`, `advanceDay(plots, plantsDb)`.
- **`state.ts` — единственное место, которое меняет общее состояние и сообщает об этом.** У него несколько методов-действий: `addItem`, `selectSlot`, `cycleSlot`, `setFloor` (P2), `nextDay`, `removeItem` (P3). Каждый вызывает логику и потом `events.emit(...)`. Так событие нельзя «забыть».
- **Сцены** вызывают методы `state` и подписываются на события.

События (весь список на прототип):

| Событие | Когда | Кто слушает |
|---|---|---|
| `inventoryChanged` | добавили/убрали предмет | `UIScene` перерисовывает хотбар |
| `slotSelected` (`index`) | сменили слот | `UIScene` подсвечивает слот |
| `dayChanged` (`day`) | `nextDay()` | `UIScene` (надпись), `GardenScene` (перерисовать растения) |
| `floorChanged` (`floor`) | `setFloor()`: вошёл в шахту, спустился, вышел в сад (0) | `UIScene` показывает/прячет «Этаж N» |

Подписки делаем в `create()` сцены и **снимаем при её закрытии** (`this.events.once('shutdown', () => state.events.off(...))`), иначе после перезапуска сцены обработчики накопятся.

Пример потока «разбил камень»:

```
MineScene: игрок нажал Space, перед ним камень
  → logic/mine.ts hitRock(rock, rules)   // hp 3 → 2 → 1 → 0, broken = true, drop = 'coal'
  → state.addItem('coal', 1)             // inventory.add + emit('inventoryChanged'); вернул 0 = всё влезло
  → MineScene убирает спрайт камня; если под ним лестница — ставит тайл ladder_down
UIScene: получил inventoryChanged → перерисовал хотбар
```

Почему свой emitter, а не `Phaser.Events.EventEmitter`: 20 строк кода, ноль зависимостей, логика остаётся без Phaser, и это прямой аналог сигналов Godot.

---

## 4. Данные (`src/data/*.json`)

Формат — простой JSON, типы описаны интерфейсами в `logic/db.ts`. Цвет (`color`) — для квадратов-заглушек, пока нет спрайтов.

### `items.json` — предметы и стартовый хотбар

```json
{
  "items": {
    "pickaxe_wood": { "name": "Деревянная кирка", "kind": "tool", "tool": "pickaxe", "color": "#a0703c" },
    "hoe":          { "name": "Мотыга",           "kind": "tool", "tool": "hoe",     "color": "#7a5a3a" },
    "watering_can": { "name": "Лейка",            "kind": "tool", "tool": "watering_can", "color": "#5a8ab0" },
    "seed_turnip":  { "name": "Семена репы",      "kind": "seed", "plant": "turnip", "color": "#d8c88a", "maxStack": 99 },
    "turnip":       { "name": "Репа",             "kind": "crop", "color": "#e6d6f0", "maxStack": 99 },
    "stone":        { "name": "Камень",           "kind": "resource", "color": "#8a8a8a", "maxStack": 99 },
    "coal":         { "name": "Уголь",            "kind": "resource", "color": "#2e2e2e", "maxStack": 99 },
    "copper_ore":   { "name": "Медная руда",      "kind": "resource", "color": "#c47a3a", "maxStack": 99 }
  },
  "startInventory": [
    { "id": "pickaxe_wood", "count": 1 },
    { "id": "hoe", "count": 1 },
    { "id": "watering_can", "count": 1 },
    { "id": "seed_turnip", "count": 5 }
  ]
}
```

Инструменты не стакаются (нет `maxStack` → 1). Иконка предмета в хотбаре — текстура `item_<id>` (пока `BootScene` рисует её квадратом цвета `color`; появится PNG с тем же ключом — подменяем загрузку, код хотбара не меняется). Неизвестный `id` — ошибка (`logic/db.ts` бросает исключение), а не тихий пропуск.

### `plants.json` — растения

```json
{
  "turnip": {
    "seed": "seed_turnip",
    "harvest": "turnip",
    "harvestCount": 1,
    "daysPerStage": [1, 1, 1],
    "stageColors": ["#6b4a2b", "#7fbf5a", "#5aa040", "#e6d6f0"]
  }
}
```

4 стадии: посажено → росток → выросло → спелое. `daysPerStage` — сколько **политых** дней до следующей стадии (3 перехода). Растение растёт только за день, в который его полили лейкой; на «новый день» отметка полива сбрасывается. Неполитое не растёт и не вянет (без стресса). Репа при ежедневном поливе созревает за 3 дня.

### `mine.json` — камни и правила этажей

```json
{
  "rocks": {
    "rock":   { "hits": 2, "drop": "stone",      "color": "#9a9a9a" },
    "coal":   { "hits": 3, "drop": "coal",       "color": "#3a3a3a" },
    "copper": { "hits": 5, "drop": "copper_ore", "color": "#c47a3a" }
  },
  "floors": [
    { "from": 1, "to": 4,    "rockCount": [12, 18], "weights": { "rock": 80, "coal": 20 } },
    { "from": 5, "to": null, "rockCount": [14, 20], "weights": { "rock": 60, "coal": 20, "copper": 20 } }
  ]
}
```

Генерация (`logic/mine.ts`): взять форму пещеры из `maps/mine-cave.json` → выбрать правило по номеру этажа (`to: null` = «и глубже») → поставить `rockCount` камней (`[min, max]` включительно) на свободные клетки пола по весам → **один** из камней прячет лестницу вниз (гарантированно). ГСЧ с seed — чтобы в тестах генерация была предсказуемой. `drop` — id из `items.json`, за камень даётся 1 штука. `color` — для текстуры-заглушки `rock_<тип>` (позже подменяется PNG с тем же ключом). Подробно — раздел 10.1.

---

## 5. Карты

**Решение: ASCII-карты в JSON + Phaser Tilemap, построенный из массива в коде. Tiled не используем.**

`maps/garden.json`:

```json
{
  "legend": { "#": "wall", "T": "tree", ".": "grass", "s": "soil", "M": "mine_entrance", "R": "mine_roof", "P": "spawn" },
  "rows": [
    "##############################",
    "#............................#",
    "#..T.....ssssss.......T......#",
    "#........ssssss..............#",
    "#..P.....ssssss.........M....#",
    "#............................#",
    "##############################"
  ]
}
```

(Реальная карта больше экрана — 40×25 тайлов = 640×400 px при экране 480×270, чтобы камера ездила. Полный текст — в плане P1, раздел 9.)

- `s` — земля, которую можно вскопать мотыгой (грядки только там).
- `P` — не тайл, а **маркер**: парсер запоминает его клетку как точку появления и кладёт туда траву.
- Твёрдые (коллизия): `wall`, `tree`, `mine_roof` (крона над входом), `mine_wall`. Остальное проходимое. Вход в шахту — блок 2×2: верхняя строка `RR` (твёрдая), нижняя `MM` (стоишь на ней и жмёшь `E` — спускаешься в шахту, P2).
- `mine-cave.json` — та же схема: `#` `mine_wall`, `.` `mine_floor`, `U` `ladder_up`, `P` точка появления (под ней пол шахты: `parseMap(map, 'mine_floor')`). Лестница вниз (`ladder_down`) в карте не рисуется — её ставит код на месте разбитого камня.
- `logic/grid.ts` превращает строки в сетку тайлов, `objects/tilemap.ts` строит из неё `this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 })`. Тайлсет — **одна текстура-полоска** `tiles` (по квадрату 16×16 на каждый вид тайла, в порядке `TILE_KINDS` из `grid.ts`), её рисует `BootScene`. Номер тайла в тайлмапе = индекс вида в `TILE_KINDS`. Коллизии — `layer.setCollision([...индексы твёрдых])`.

Почему так: не нужен внешний редактор, тайлсет и экспорт; карту видно и правится прямо в тексте; дифф в git читаемый; этаж шахты и сад используют один формат. Когда появится настоящий арт — заменим генерацию текстур на картинку тайлсета, формат карт не меняется. В Godot карты всё равно будут рисоваться в `TileMapLayer`, так что вкладываться в Tiled ради прототипа нет смысла.

---

## 6. Docker-окружение

Принципы:
- Node есть **только в контейнере**. Один сервис `dev` на всё: dev-сервер, сборка, тесты, разовые npm-команды.
- Код примонтирован с диска `D:` (bind mount). На Windows изменения файлов **не доходят** до контейнера как события файловой системы, поэтому Vite следит за файлами **опросом (polling)**.
- `node_modules` лежит в именованном Docker-volume, а не на диске Windows: быстрее, нет конфликтов Linux/Windows-бинарников (esbuild, rollup). На хосте появится пустая папка `node_modules/` — это точка монтирования, она в `.gitignore`.
- Зависимости ставятся **при старте контейнера** (`npm install && npm run dev`), а не при сборке образа. Так volume никогда не «протухает» после изменения `package.json`. Если ничего не поменялось, `npm install` занимает пару секунд.
- Путь с пробелами (`Under the Orchard`) не мешает: в compose используется относительный путь `.`, а имя проекта задано явно (`name:`), иначе Docker склеит его из имени папки.
- Образ: `node:24-bookworm-slim` — Node 24 LTS (поддержка до апреля 2028), Debian slim, а не Alpine: у esbuild/rollup меньше сюрпризов с glibc.

### `Dockerfile`

```dockerfile
# Dev image for the web prototype. Dependencies are installed at container
# start into the node_modules volume (see docker-compose.yml), not baked in.
FROM node:24-bookworm-slim

WORKDIR /app

EXPOSE 5173

CMD ["npm", "run", "dev"]
```

### `docker-compose.yml`

```yaml
# Explicit name: the folder name has spaces.
name: under-the-orchard

services:
  dev:
    build: .
    image: under-the-orchard-dev
    working_dir: /app
    init: true                      # Ctrl+C stops the server cleanly
    command: sh -c "npm install && npm run dev"
    ports:
      - "5173:5173"
    volumes:
      - .:/app                      # source code from Windows (bind mount)
      - node_modules:/app/node_modules  # deps stay inside Docker
    environment:
      - CHOKIDAR_USEPOLLING=true    # file watching over a Windows bind mount

volumes:
  node_modules:
```

### `.dockerignore`

```
node_modules
dist
.git
```

### `package.json`

```json
{
  "name": "under-the-orchard",
  "private": true,
  "version": "0.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "phaser": "~3.90.0"
  },
  "devDependencies": {
    "typescript": "~5.9.0",
    "vite": "^7.0.0",
    "vitest": "^5.1.0"
  }
}
```

Vitest поднят с 3.2 до 5.1: в 3.x есть уязвимости (tinypool, @vitest/mocker), `npm audit` после обновления — 0. Vitest 5 совместим с Vite 7.

Phaser зафиксирован на ветке 3.90 (`~`), чтобы случайно не уехать на Phaser 4. Перед первым `npm install` исполнитель может проверить актуальные версии: `docker compose run --rm dev npm view phaser@3 version` и т.п.; если какая-то версия не находится — взять ближайшую стабильную, не меняя мажор.

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src", "vite.config.ts"]
}
```

### `vite.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './', // dist/ works from any folder or static host
  server: {
    host: '0.0.0.0', // reachable from Windows through the port mapping
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true, // Windows bind mount: no inotify events reach the container
      interval: 300,
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

### `index.html`

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Under the Orchard</title>
    <style>html, body { margin: 0; height: 100%; background: #1d1a16; }</style>
  </head>
  <body>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

Про hot reload: при изменении `.ts` Vite перезагружает страницу целиком (Phaser-игра стартует заново). Для прототипа это нормально — частичную замену модулей (HMR) для Phaser не настраиваем.

### Команды (PowerShell, из папки проекта)

```powershell
cd "D:\Gadji\01_Projects\Under the Orchard"

docker compose up                 # dev-сервер → http://localhost:5173 (Ctrl+C — стоп)
docker compose up --build         # то же, если менялся Dockerfile
docker compose down               # остановить и удалить контейнер

docker compose run --rm dev npm install <пакет>      # разовая npm-команда
docker compose run --rm dev npm test                 # тесты один раз
docker compose run --rm dev npm run typecheck        # проверка типов
docker compose run --rm dev npm run build            # сборка → dist/ на диске D:
docker compose run --rm -p 4173:4173 dev npm run preview   # посмотреть сборку → http://localhost:4173

docker compose down -v            # «всё сломалось»: удалить и node_modules-volume, потом снова up
```

`docker compose run` заменяет команду сервиса, поэтому `npm install` из `command` при этом не выполняется — выполняется только то, что написано после `dev`.

---

## 7. Тесты

- **Vitest**, только для `src/logic/` (чистая логика). Сцены и рисование не тестируем — их проверяет человек или `playtester` в браузере.
- Тест лежит рядом с модулем: `inventory.ts` → `inventory.test.ts`.
- Что стоит покрыть: разбор карты (размер, точка появления, ошибки на кривых строках и неизвестных символах); выбор направления взгляда и клетка перед игроком; стаки и переполнение хотбара; рост растения по дням и сбор только спелого; генерация этажа (лестница вниз есть всегда, на этажах 1–4 нет меди, на 5+ может быть — с фиксированным seed); удар по камню (нужное число ударов, правильный дроп).
- Запуск: `docker compose run --rm dev npm test`. Режим наблюдения: `docker compose run --rm dev npm run test:watch` (polling из `vite.config.ts` действует и здесь).

---

## 8. План этапа P0 (для `gameplay-dev`)

Каждый шаг — отдельная проверка и отдельный коммит.

**Шаг 1. Docker-окружение.**
Создать `Dockerfile`, `docker-compose.yml`, `.dockerignore` (содержимое — раздел 6).
*Готово, когда:* `docker compose build` проходит без ошибок, а `docker compose run --rm dev node -v` печатает `v24.x.x`.
Коммит: `chore: add Docker dev environment`

**Шаг 2. Проект Vite + TypeScript + Phaser.**
Создать `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts` с одной временной сценой (фон цвета травы и надпись «Under the Orchard»). Выполнить `docker compose run --rm dev npm install`.
*Готово, когда:* появился `package-lock.json`; на диске D: `node_modules/` пустая (зависимости в volume); `docker compose run --rm dev npm run typecheck` без ошибок.
Коммит: `chore: scaffold Vite + TypeScript + Phaser project`

**Шаг 3. Запуск в браузере и автообновление.**
`docker compose up`, открыть `http://localhost:5173`.
*Готово, когда:* видна зелёная сцена с надписью, растянутая на окно без размытия; после правки текста надписи в `src/main.ts` и сохранения страница сама обновляется за 1–2 секунды; в консоли браузера (F12) нет ошибок.
Коммит не нужен, если файлы не менялись.

**Шаг 4. Каркас сцен и состояния.**
Разложить по структуре из раздела 1: `BootScene` (генерирует 2–3 цветные текстуры) → `GardenScene` (пустой мир-заглушка) + `UIScene` (пустая полоска хотбара внизу с надписью «День 1»). Создать `constants.ts`, `logic/emitter.ts`, `state.ts` с полем `day` и событием `dayChanged` (без механик). Один тест `logic/emitter.test.ts`.
*Готово, когда:* в браузере сад-заглушка и поверх неё полоска хотбара с «День 1»; `docker compose run --rm dev npm test` — зелёный; в `src/logic/` и `src/state.ts` нет импорта `phaser`.
Коммит: `feat: scene skeleton, game state and event emitter`

**Шаг 5. Сборка.**
`docker compose run --rm dev npm run build`, затем `docker compose run --rm -p 4173:4173 dev npm run preview`.
*Готово, когда:* в `D:\...\Under the Orchard\dist\` есть `index.html` и `assets/`; на `http://localhost:4173` открывается та же сцена; `dist/` не попадает в `git status`.
После шага: обновить строку «Текущий этап» в `CLAUDE.md` на P1.

Дальше — P1 (ходьба, раздел 9), P2 (шахта), P3 (грядка) — отдельные планы.

---

## 9. План этапа P1 «Ходим» (для `gameplay-dev`)

**Цель:** по саду можно ходить: игрок, движение, столкновения со стенами и деревьями, камера едет за игроком, хотбар остаётся на месте.

### 9.1 Решения этапа

**Движение — Arcade Physics, а не по сетке.** Игрок двигается плавно, с постоянной скоростью, и останавливается сразу, как только отпустили клавишу (без разгона и инерции). Ходьба по клеткам (шаг ровно на 16 px) выглядит «дёрганой» и хуже ощущается в уютной игре; Stardew Valley тоже ходит свободно. Arcade Physics уже есть в Phaser, сама разруливает столкновения с тайлмапом — своей физики не пишем. В Godot это `CharacterBody2D` + `move_and_slide()`, перенос прямой.

**Игрок меньше тайла, хитбокс = весь спрайт:** заглушка игрока — квадрат 12×12 (`PLAYER_SIZE` в `Player.ts`), тело совпадает с ним целиком. Так игрок пролезает в проход шириной в 1 клетку, не прицеливаясь до пикселя, и видимое никогда не заходит на твёрдые клетки. (Изначально был хитбокс 12×10 у «ног» спрайта 16×16 — с плоским квадратом это выглядело как ошибка: верх и бока залезали на стены. Хитбокс «у ног» вернём, когда появится настоящий спрайт персонажа.)

> *Обновлено в P1+:* заглушку сменил настоящий спрайт героя 16×24, поэтому хитбокс снова «у ног» — 10×6 (`BODY_W`/`BODY_H` в `Player.ts`), голова может перекрывать твёрдые клетки сверху (перспектива вида сверху). Клетка игрока — по центру этого хитбокса.

**Управление:** WASD и стрелки одновременно. Диагональ разрешена: две клавиши → движение по диагонали, вектор нормализуется (иначе по диагонали в 1,41 раза быстрее). Противоположные клавиши гасят друг друга. «4 стороны» из дизайна — это 4 направления **взгляда** (и будущей анимации), а не запрет диагонали.

**Скорость:** `const PLAYER_SPEED = 80` (px/с ≈ 5 клеток/с) **вверху `objects/Player.ts`** — по правилу из `constants.ts`: баланс лежит в своём модуле, в `constants.ts` только общее (TILE, размер экрана).

**Направление взгляда (`logic/facing.ts`) — закладываем сейчас**, потому что почти бесплатно, а в P2 нужно для удара по клетке перед игроком:
- `type Facing = 'up' | 'down' | 'left' | 'right'`;
- `resolveFacing(prev: Facing, dx: number, dy: number): Facing` — `dx, dy` из {-1, 0, 1}. Нет ввода → `prev`. Одно направление → оно. Диагональ → если `prev` одно из двух нажатых, оставить `prev` (взгляд не «дрожит», когда добавляешь вторую клавишу), иначе горизонтальное;
- `cellInFront(col: number, row: number, facing: Facing): { col: number; row: number }`.
Клетка игрока = клетка центра его тела: `Math.floor(body.center.x / TILE)`. Начальный взгляд — `'down'`.

**Камера:** `cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels)` + `startFollow(player, true)`. У края карты камера упирается, игрок продолжает идти. `physics.world.setBounds(...)` на тот же размер — страховка, если в карте забудут стену. В конфиге игры `roundPixels: true`, чтобы пиксели не дрожали при движении камеры. `UIScene` — отдельная сцена со своей камерой, она выше `Garden` в списке сцен, поэтому хотбар рисуется поверх и никуда не едет. Ничего для этого делать не нужно.

**Логика в `src/logic/`:** только `grid.ts` (разбор карты) и `facing.ts`. Движение, скорость и коллизии — это Phaser, в логику их не тащим. `state.ts` в P1 не меняется.

### 9.2 Карта сада `src/data/maps/garden.json`

40×25 тайлов. Сад со строем деревьев слева сверху, дом-заглушка (`#`-блок), забор с проходом в 1 клетку (проверка хитбокса), участок земли под грядки, старое дерево и вход в шахту у его корней. Нижняя стена уходит под хотбар — это нормально.

```json
{
  "legend": { "#": "wall", "T": "tree", ".": "grass", "s": "soil", "M": "mine_entrance", "P": "spawn" },
  "rows": [
    "########################################",
    "#......................................#",
    "#..T..T..T..T..T.......................#",
    "#..................######..............#",
    "#..T..T..T..T..T...######...........T..#",
    "#..................######..............#",
    "#..T..T..T..T..T...######..............#",
    "#......................................#",
    "#..T..T..T..T..T.....P............T....#",
    "#......................................#",
    "#..T..T..T..T..T..........ssssssss.....#",
    "#.........................ssssssss.....#",
    "########.########.........ssssssss.....#",
    "#.........................ssssssss.....#",
    "#......................................#",
    "#....T.................................#",
    "#.....................T................#",
    "#.............................TTT......#",
    "#...........T.................TTT......#",
    "#..............................M.......#",
    "#..T...................................#",
    "#.......T..............................#",
    "#....................................T.#",
    "#......................................#",
    "########################################"
  ]
}
```

| Символ | Вид | В P1 |
|---|---|---|
| `#` | `wall` | коллизия; цвет тёмно-коричневый |
| `T` | `tree` | коллизия; тёмно-зелёный |
| `.` | `grass` | проходимо; `#5a8f3c` (как сейчас) |
| `s` | `soil` | проходимо; `#6b4a2b` (как сейчас), без поведения |
| `M` | `mine_entrance` | проходимо; чёрный/тёмно-серый, без поведения |
| `P` | маркер `spawn` | точка появления, под ней трава |

Цвета — заглушки, исполнитель выбирает сам, лишь бы различались.

### 9.3 Шаги

Каждый шаг — отдельная проверка и отдельный коммит.

**Шаг 1. Карта сада и её разбор.**
Создать `src/data/maps/garden.json` (текст выше) и `src/logic/grid.ts`:
`TILE_KINDS = ['grass', 'soil', 'wall', 'tree', 'mine_entrance'] as const`, `type TileKind`, `SOLID_KINDS` (`wall`, `tree`), `parseMap(map: { legend: Record<string, string>; rows: string[] }) → { width, height, cells: TileKind[][], spawn: { col, row } }`. `cells[row][col]`. Ошибка (throw с понятным текстом), если: строки разной длины; символ не из легенды; значение легенды не из `TILE_KINDS` и не `spawn`; `P` не ровно один. Тест `src/logic/grid.test.ts`: маленькая карта 4×3 → правильные размер, клетки и spawn (под ним `grass`); каждая из ошибок; и что реальный `garden.json` разбирается: 40×25, spawn в `(21, 8)`.
*Готово, когда:* `docker compose run --rm dev npm test` зелёный; `npm run typecheck` без ошибок; в `grid.ts` нет импорта `phaser`.
Коммит: `feat: garden ASCII map and grid parser`

**Шаг 2. Карта на экране.**
`BootScene`: вместо отдельных `grass`/`soil` рисовать одну полоску `tiles` шириной `TILE_KINDS.length × 16` (цвет на каждый вид, порядок как в `TILE_KINDS`); `player` остаётся отдельной текстурой. Создать `src/objects/tilemap.ts`: `buildTilemap(scene, grid) → { map, layer }` — превращает `cells` в индексы, `make.tilemap`, `addTilesetImage('tiles')`, `createLayer`, `layer.setCollision(индексы SOLID_KINDS)`. `GardenScene.create()`: `parseMap(garden)` → `buildTilemap`; временно `cameras.main.setBounds(...)` и `centerOn(spawn)`, чтобы было видно середину карты.
*Готово, когда:* в браузере видна часть сада вокруг точки появления: дом-блок, ряды деревьев, кусок земли; цвета различимы, без щелей и размытия между тайлами; хотбар и «День 1» поверх; в консоли (F12) нет ошибок.
Коммит: `feat: render garden tilemap from ASCII map`

**Шаг 3. Игрок ходит и упирается в стены.**
В `main.ts` включить физику: `physics: { default: 'arcade', arcade: { debug: false } }` и `roundPixels: true`. Создать `src/objects/Player.ts` — класс на основе `Phaser.Physics.Arcade.Sprite` с текстурой `player`: `PLAYER_SPEED` вверху файла, квадрат 12×12 с хитбоксом на весь спрайт, метод `update()` читает WASD + стрелки (`scene.input.keyboard.addKeys(...)`), считает `dx, dy`, ставит скорость с нормализацией по диагонали, без ввода — скорость 0. `GardenScene`: создать игрока в центре клетки `spawn`, `physics.add.collider(player, layer)`, `physics.world.setBounds(...)`, вызывать `player.update()` из `update()` сцены. Камеру пока не трогать.
*Готово, когда:* игрок (жёлтый квадрат) появляется под домом; ходит WASD и стрелками; отпустил клавишу — сразу стоит; по диагонали не быстрее, чем по прямой (на глаз); упирается в дом, деревья и забор, не застревает и не проходит сквозь; пролезает в проход в заборе (клетка 8 в строке 12). Для проверки хитбокса можно временно поставить `debug: true` — тогда видны рамки тел; перед коммитом вернуть `false`.
Коммит: `feat: player movement with arcade physics and collisions`

**Шаг 4. Камера едет за игроком.**
`GardenScene`: убрать временный `centerOn`, оставить `setBounds` на размер карты, добавить `cameras.main.startFollow(player, true)`.
*Готово, когда:* камера держит игрока в центре; у краёв карты камера останавливается, за краем не видно пустоты, игрок доходит до стены; хотбар и «День 1» стоят на месте, пока мир едет; картинка не дрожит при движении (если дрожит — проверить `roundPixels`).
Коммит: `feat: camera follows player within map bounds`

**Шаг 5. Направление взгляда.**
Создать `src/logic/facing.ts` (`Facing`, `resolveFacing`, `cellInFront` — раздел 9.1) и тест `src/logic/facing.test.ts`: каждое из 4 направлений; без ввода взгляд не меняется; диагональ сохраняет прежний взгляд, если он среди нажатых, иначе горизонтальный; `cellInFront` для всех 4 направлений. В `Player.ts`: поле `facing: Facing = 'down'`, обновлять в `update()`, метод `frontCell(): { col, row }` (клетка тела + `cellInFront`). В `GardenScene` — полупрозрачная рамка 16×16 на `player.frontCell()` (временный помощник для проверки; в P2 станет подсветкой цели удара).
*Готово, когда:* `npm test` зелёный (тесты `grid` и `facing`), в `facing.ts` нет `phaser`; в браузере рамка всегда стоит на соседней клетке в сторону последнего движения; остановился — рамка остаётся; зажал «вправо» и добавил «вверх» — рамка остаётся справа.
Коммит: `feat: player facing direction and front cell marker`

**После P1:** обновить строку «Текущий этап» в `CLAUDE.md` на P2; `playtester` проходит чеклисты шагов 3–5 в браузере.

---

## 10. План этапа P2 «Шахта» (для `gameplay-dev`)

**Цель:** из сада спускаешься в шахту, киркой разбиваешь камни перед собой, ресурсы сразу попадают в хотбар; под одним из камней — лестница вниз; с 5-го этажа попадается медь; лестница вверх возвращает в сад.
**Готово, когда:** спустился, разбил камни, ресурсы в хотбаре.

### 10.1 Решения этапа

**Вход в шахту и лестницы — по кнопке `E` (решение автора).** Если клетка игрока (центр хитбокса у ног) — `mine_entrance` (`MM` под кроной), `ladder_up` или `ladder_down`, то нажатие `E` (`keydown-E`, одно нажатие — один переход) запускает переход: вход → `Mine { floor: 1 }`, `ladder_up` → в сад, `ladder_down` → этаж ниже. Пока игрок стоит на такой клетке, над ним небольшая подсказка «E — спуститься» / «E — подняться» (текст в мире, исчезает, когда сошёл с клетки).
*Почему кнопка:* случайно не «провалишься», проходя мимо, — переход всегда осознанный. `E` — отдельная клавиша «взаимодействие», поэтому `Space` остаётся только за инструментами и в P3 не будет путаницы «копать или спуститься».
*Где появляется игрок:* на клетке **рядом** с переходом, а не на нём: в саду — под входом, в шахте — под лестницей вверх. С кнопкой «отскок» и так невозможен, но так подсказка не висит над героем сразу после появления.

**Переход — мягкое затемнение.** `objects/transition.ts`: `fadeToScene(scene, key, data)` — ставит флаг «уходим» (повторно не срабатывает), останавливает игрока, `cameras.main.fadeOut(FADE_MS)` и по окончании `scene.start(key, data)`. Новая сцена в `create()` делает `fadeIn(FADE_MS)`. `FADE_MS = 200` вверху файла. Это несколько строк Phaser, но переход сразу ощущается мягко, а не рывком; один хелпер на три места.

**Где появляется игрок:**

| Откуда → куда | Клетка появления | Взгляд |
|---|---|---|
| CharacterSelect → сад | `spawn` (`P` в `garden.json`) | вниз |
| шахта → сад (`from: 'mine'`) | под блоком входа: `findBlockOrigin(grid, 'mine_entrance')`, строка `+1`; по X — посередине блока 2×2 (граница колонок 31/32) | вниз |
| сад → этаж 1, этаж n → n+1 | `spawn` (`P` в `mine-cave.json`, стоит прямо под `U`) | вниз |

`GardenScene.init(data: { from?: 'mine' })`. Позиция «посередине блока» — `x = (origin.col + 1) * TILE`, `y` — центр клетки под `MM`. Взгляд вниз — сцена ставит `player.facing = 'down'` сразу после создания (это и так значение по умолчанию; просто не терять его).

**Как `MineScene` узнаёт этаж:** `init(data: { floor: number })` → `this.floor = data.floor`; в `create()` — `state.setFloor(this.floor)` (событие `floorChanged` → `UIScene` пишет «Этаж N» под «День N»). `GardenScene.create()` вызывает `state.setFloor(0)` — надпись прячется. Номер нужен на экране, чтобы проверить «медь с 5-го этажа».

**Клетка игрока:** в `Player` добавить `cell(): Cell` (клетка центра хитбокса); `frontCell()` пользуется им. Сцены смотрят `grid.cells[row][col]` под `player.cell()` — по нему решают, показывать ли подсказку и срабатывает ли `E`.

**Генерация этажа (`logic/mine.ts`, без Phaser):**
1. Форма пещеры — `src/data/maps/mine-cave.json` (раздел 10.2), одна на все этажи. `MineScene.create()` каждый раз заново делает `parseMap(caveJson, 'mine_floor')` — получается свежая сетка, её можно менять (поставить лестницу вниз), не боясь испортить следующий этаж.
2. `ruleForFloor(rules, floor)` — правило из `mine.json` (`from ≤ floor ≤ to`, `to: null` = бесконечно). Нет правила (например, `floor = 0`) — исключение.
3. `generateFloor(cave: Grid, floor: number, rules: MineRules, rng: Rng): Rock[]`:
   - свободные клетки = все `mine_floor`, **кроме** клетки `spawn` и 8 соседних (игрок не появляется зажатым камнями);
   - количество = `randInt(rng, min, max)`, но не больше числа свободных клеток;
   - клетки без повторов (перемешать список свободных клеток через rng и взять первые N), тип — `pickWeighted(rng, weights)`;
   - ровно у **одного** камня (случайного) `hasLadder = true`;
   - `Rock = { col, row, type, hp, hasLadder }`, `hp` = `hits` из `mine.json`.
   Камни могут перегородить проход — это не тупик: любой камень разбивается. В самой форме пещеры тупиков нет (все клетки пола связаны — проверено заливкой).
4. `hitRock(rock, rules) → { broken: boolean; drop: string | null; ladder: boolean }` — уменьшает `rock.hp` на 1 (деревянная кирка = 1 урон; других кирок в прототипе нет). При `hp === 0`: `broken = true`, `drop` = `rules.rocks[type].drop`, `ladder = rock.hasLadder`. Удар по уже разбитому — `broken: false, drop: null` (защита от двойного дропа).
5. `rockAt(rocks, cell): Rock | undefined` — целый камень на клетке.
6. Seed: `logic/rng.ts` — `createRng(seed: number): Rng` (mulberry32, ~10 строк), `type Rng = () => number` в `[0, 1)`, `randInt(rng, min, max)` (включительно), `pickWeighted(rng, weights: Record<string, number>): string`. В игре seed — `Math.floor(Math.random() * 2 ** 32)` при каждом входе на этаж; в тестах — фиксированный.

**Камни — спрайты, а не тайлы.** Каждый камень — элемент `this.physics.add.staticGroup()`: `group.create(x, y, 'rock_<type>')` в центре клетки, `setDepth((row + 1) * TILE)` (сортировка по низу, как у игрока и входа в сад). `physics.add.collider(player, rocks)`. Сцена хранит `Map<"col,row", { rock: Rock; image: Image }>`.
*Почему не тайлы:* спрайт можно трясти и подсвечивать при ударе (тайл — нет), он правильно перекрывает голову игрока по глубине, а позже заменяется картинкой без правки тайлсета. Пол под камнем — обычный `mine_floor` в тайлмапе.

**Удар:**
- Ввод: `Space` или левая кнопка мыши. В `update()` проверяем «зажато ли» + кулдаун `HIT_COOLDOWN_MS = 250` (вверху `MineScene.ts`): нажал раз — один удар, держишь — бьёт в ровном темпе. Меньше кликов — меньше усталости (столп «без стресса»).
- Удар происходит, только если в выбранном слоте предмет с `tool: 'pickaxe'` (`isTool(id, 'pickaxe')` из `db.ts`) и на `player.frontCell()` есть целый камень. Иначе ничего не происходит и кулдаун не тратится.
- Отклик на каждый удар (без частиц): камень вспыхивает белым (`setTintFill(0xffffff)` на 60 мс, потом `clearTint()`) и вздрагивает (твин `x` ±1 px, `yoyo`, 2 повтора). Твин двигает только картинку, статичное тело остаётся на месте — так и надо.
- Разбит: короткий твин «сжался в точку» (`scale → 0`, 80 мс) → `destroy()` (тело уходит вместе с картинкой; сразу после удара камень из `Map` убираем, чтобы по нему нельзя было ударить во время твина). Ресурс **сразу** `state.addItem(drop, 1)` — без предмета на земле и без подбора.
- Если `ladder: true` — `grid.cells[row][col] = 'ladder_down'` и `layer.putTileAt(индекс ladder_down, col, row)`. Тайл проходимый; встал на него и нажал `E` → `fadeToScene(this, 'Mine', { floor: this.floor + 1 })`.
- Подсветка цели: рамка 16×16 (как временная рамка из P1) видна в шахте **только если перед игроком целый камень** — понятно, во что попадёшь. В саду рамка остаётся как есть до P3.

**Полный хотбар — камень всё равно разбивается, лишнее пропадает, над героем всплывает «Нет места».** `state.addItem` возвращает, сколько не влезло; если больше 0 — `MineScene` показывает короткий текст над игроком (поднимается и тает за ~600 мс).
*Почему:* в прототипе нет ни выбрасывания предметов, ни сундука. Если бы камень при полном хотбаре не ломался, игрок не смог бы найти лестницу вниз и застрял бы навсегда — это хуже потери одного камня. Переполнение на практике редкое: 9 слотов, стаки по 99, всего 7 видов предметов. В полной версии решится сундуком (раздел 5.2 GDD).

**Инвентарь (`logic/inventory.ts`, без Phaser):**

```ts
interface Stack { id: string; count: number }
class Inventory {
  readonly slots: (Stack | null)[];   // length = size
  selected: number;                   // 0..size-1
  constructor(size: number, maxStackOf: (id: string) => number);
  add(id: string, count: number): number; // returns how many did NOT fit
  select(index: number): void;            // out of range -> throws
  cycle(dir: 1 | -1): void;               // wraps: 8 -> 0, 0 -> 8
  selectedStack(): Stack | null;
}
```

- `add`: сначала доливает в уже лежащие стаки того же `id` (слева направо) до `maxStack`, потом занимает пустые слоты слева направо. Что не влезло — возвращает числом.
- `maxStackOf` передаётся снаружи (из `db.ts`) — тесты работают с выдуманными предметами и не зависят от `items.json`.
- Удаление (`remove`) понадобится для семян в P3 — тогда и добавим.

**`logic/db.ts` (аналог `ItemDB`):** тип `ItemDef` (`name`, `kind`, `tool?`, `plant?`, `color`, `maxStack?`) поверх `items.json`; `getItem(id)` (неизвестный id — исключение), `maxStackOf(id)` (нет `maxStack` → 1), `isTool(id, tool)`, `ITEM_IDS`, `START_INVENTORY`. Типы `mine.json` (`MineRules`) — в `logic/mine.ts`, рядом с тем, кто их использует.

**`state.ts`:**
- `inventory = new Inventory(HOTBAR_SIZE, maxStackOf)`, в конструкторе — заполнить из `START_INVENTORY` (без события: `UIScene` при создании и так читает состояние).
- `addItem(id, count): number` → `inventory.add`; если что-то добавилось — `emit('inventoryChanged')`; возвращает остаток.
- `selectSlot(i)`, `cycleSlot(dir)` → `emit('slotSelected', index)`.
- `mine = { floor: 0 }`, `setFloor(n)` → `emit('floorChanged', n)`.
- В `GameEvents` добавить `inventoryChanged: void`, `slotSelected: number`, `floorChanged: number`.

**Хотбар (`UIScene`):**
- В `create()` один раз создать на каждый слот рамку, иконку 14×14 (`item_<id>`, скрыта у пустого слота) и текст количества (8 px, моноширинный, правый нижний угол, только если `count > 1`). `renderHotbar()` по `inventoryChanged`/`slotSelected` обновляет текстуру, видимость и текст всех 9 слотов — без пересоздания объектов.
- Выбранный слот — рамка `0xf4c542` (как в выборе героя) толщиной 2; остальные — как сейчас.
- Ввод слотов — в `UIScene` (она работает всегда): `keydown-ONE` … `keydown-NINE` → `state.selectSlot(0..8)`; `this.input.on('wheel', (_p, _o, _dx, dy) => state.cycleSlot(dy > 0 ? 1 : -1))`.

**Текстуры-заглушки (`BootScene`):** один маленький хелпер «квадрат цвета `color` с тёмной обводкой» (`Graphics.generateTexture`): иконки `item_<id>` — 14×14, камни `rock_<type>` — 16×16 со скруглением (чтобы отличались от плоского пола). Появится PNG — грузим его под тем же ключом, остальной код не меняется. Тайлы шахты (`mine_floor`, `mine_wall`, `ladder_up`, `ladder_down`) — через уже существующий `TILE_COLORS`: кадров в `KIND_FRAMES` у них нет, значит, они автоматически станут цветными квадратами.

**Тайлы шахты в `logic/grid.ts`:** дописать в **конец** `TILE_KINDS`: `'mine_floor', 'mine_wall', 'ladder_up', 'ladder_down'` (в конец — чтобы индексы садовых тайлов не сдвинулись; слоты вариантов травы в `tilemap.ts` считаются от длины `TILE_KINDS` сами). `SOLID_KINDS` += `'mine_wall'`. `parseMap(map, spawnKind: TileKind = 'grass')` — какой тайл класть под маркер `P`. Фон камеры шахты — тёмный (`#1a1620`), сине-фиолетовая гамма по GDD (раздел 7).

### 10.2 Данные

`items.json` и `mine.json` — формат из раздела 4 **без изменений** (план P0 не устарел). `plants.json` в P2 не создаём — это P3. Итого в `src/data/` после P2: `items.json`, `mine.json`, `maps/garden.json`, `maps/mine-cave.json`.

`src/data/maps/mine-cave.json` — 34×20 тайлов (544×320 px, больше экрана — камера ездит), 404 клетки пола, все связаны между собой:

```json
{
  "legend": { "#": "mine_wall", ".": "mine_floor", "U": "ladder_up", "P": "spawn" },
  "rows": [
    "##################################",
    "#####......########......#########",
    "####...U....######........########",
    "###....P.....####..........#######",
    "##...........................#####",
    "##.......##...................####",
    "#.......####.........##........###",
    "#........##.........####.......###",
    "#...................####........##",
    "##...................##.........##",
    "###.............................##",
    "####......###...............##..##",
    "####.....#####.............####.##",
    "###.......###...............##..##",
    "##..............................##",
    "##.......................#......##",
    "###.....####............###....###",
    "####...######..........#####..####",
    "######.....#######.......#########",
    "##################################"
  ]
}
```

`U` — клетка `(7, 2)`, `spawn` — `(7, 3)` прямо под ней.

| Тайл | Твёрдый | Цвет-заглушка (на выбор исполнителя, лишь бы различались) |
|---|---|---|
| `mine_floor` | нет | тёмный серо-фиолетовый |
| `mine_wall` | да | почти чёрный фиолетовый |
| `ladder_up` | нет | светло-коричневый |
| `ladder_down` | нет | очень тёмный коричневый (провал) |

### 10.3 Шаги

Каждый шаг — отдельная проверка и отдельный коммит. Шаги 1 и 3 — чистая логика с тестами, без сцен.

**Шаг 1. Предметы и инвентарь (логика).**
Создать `src/data/items.json` (раздел 4), `src/logic/db.ts`, `src/logic/inventory.ts` (раздел 10.1). Тесты `src/logic/db.test.ts`: `maxStackOf('pickaxe_wood') === 1`, `maxStackOf('stone') === 99`; неизвестный id → исключение; все id из `startInventory` есть в `items`. `src/logic/inventory.test.ts` (с выдуманным `maxStackOf`): добавление в пустой → слот 0; тот же id доливается в стак; переполнение стака → остаток в следующий пустой слот; инструменты (стак 1) — каждый в свой слот; полный инвентарь → `add` возвращает остаток, лежащее не меняется; влезло частично → вернулась только разница; `select` вне диапазона → исключение; `cycle` по кругу в обе стороны; `selectedStack()` у пустого слота — `null`.
*Готово, когда:* `docker compose run --rm dev npm test` зелёный; `npm run typecheck` без ошибок; в `db.ts` и `inventory.ts` нет `phaser`.
Коммит: `feat: item data and inventory logic`

**Шаг 2. Хотбар показывает инвентарь.**
`state.ts`: `inventory`, стартовый набор, `addItem`, `selectSlot`, `cycleSlot`, события `inventoryChanged`, `slotSelected`. `BootScene`: хелпер цветных текстур, иконки `item_<id>` для всех предметов. `UIScene`: иконки, числа, выделение, клавиши 1–9, колёсико; подписки снимаются на `shutdown`. Для проверки стаков в браузере — **временно** клавиша `G` в `GardenScene`: `state.addItem('stone', 10)`; убрать в шаге 5.
*Готово, когда:* в саду в хотбаре слева 4 квадрата разного цвета (кирка, мотыга, лейка, семена с числом 5), остальные 5 слотов пустые; выделен слот 1; клавиши 1–9 переносят выделение, колёсико — по кругу в обе стороны; `G` добавляет серый квадрат «10», потом «20»…, после 99 появляется второй стак; тесты зелёные; в консоли нет ошибок.
Коммит: `feat: hotbar shows inventory with slot selection`

**Шаг 3. Генерация этажа и удар (логика).**
Создать `src/logic/rng.ts`, `src/data/mine.json` (раздел 4), `src/data/maps/mine-cave.json` (раздел 10.2), `src/logic/mine.ts` (`MineRules`, `Rock`, `ruleForFloor`, `generateFloor`, `hitRock`, `rockAt`). В `grid.ts`: 4 новых вида в конец `TILE_KINDS`, `mine_wall` в `SOLID_KINDS`, параметр `spawnKind` у `parseMap`; поправить старый тест про `SOLID_KINDS`.
Тесты: `rng.test.ts` — одинаковый seed → одинаковая последовательность, числа в `[0, 1)`, `randInt` не выходит за границы и достаёт обе; `grid.test.ts` — `mine-cave.json` разбирается 34×20, spawn `(7, 3)`, под ним `mine_floor`, `U` в `(7, 2)`; `mine.test.ts` — `ruleForFloor` для 1, 4, 5, 100 и исключение для 0; на 50 seed'ах: число камней в пределах `rockCount`, все на `mine_floor`, без повторов, не в 3×3 вокруг spawn, ровно одна лестница; этажи 1–4 — ни одной меди, этаж 5 — медь встречается хотя бы на одном seed; одинаковый seed → одинаковый этаж; маленькая пещера с 5 свободными клетками → камней не больше 5; `hitRock`: обычный камень разбит на 2-й удар, уголь на 3-й, медь на 5-й, дроп правильный, лишний удар второго дропа не даёт; все `drop` из `mine.json` есть в `items.json`.
*Готово, когда:* `npm test` зелёный, `typecheck` без ошибок, в `rng.ts`/`mine.ts` нет `phaser`; сад в браузере выглядит как раньше (новые тайлы не сдвинули садовые).
Коммит: `feat: mine floor generation and rock hit logic`

**Шаг 4. Сцена шахты и переходы.**
Создать `src/objects/transition.ts` и `src/scenes/MineScene.ts` (тайлмап пещеры, камни-спрайты со статичными телами, игрок, камера, коллайдеры с пещерой и камнями); добавить `Mine` в `main.ts` перед `UI`. `BootScene`: цвета тайлов шахты, текстуры `rock_<type>`. `Player.cell()`. `GardenScene`: `init({ from })`, появление под входом, переход по `E` на клетке `mine_entrance` + подсказка «E — спуститься», `state.setFloor(0)`. `MineScene`: переход в сад по `E` на `ladder_up` + подсказка «E — подняться». `state.setFloor` + `floorChanged`, надпись «Этаж N» в `UIScene`.
*Готово, когда:* подошёл ко входу в саду, встал в проём — над героем подсказка «E — спуститься»; прошёл мимо — ничего не происходит; нажал `E` — экран мягко гаснет, открывается тёмная пещера, герой стоит под лестницей вверх, сверху «Этаж 1»; камни трёх видов (на этаже 1 — двух: серые и тёмные) разбросаны по полу, игрок в них упирается и обходит; рядом с точкой появления камней нет; камера ездит по пещере, хотбар поверх; встал на лестницу вверх (подсказка «E — подняться») и нажал `E` — снова сад, герой стоит **под** входом лицом вниз, надпись «Этаж» пропала; повторный вход — камни расставлены иначе; в консоли нет ошибок.
Коммит: `feat: mine scene with entrance and ladder up`

**Шаг 5. Удар киркой, ресурсы в хотбар.**
`MineScene`: ввод `Space`/ЛКМ с кулдауном, проверка кирки в выбранном слоте, `hitRock`, вспышка и дрожь, «сжатие» и удаление разбитого камня, `state.addItem(drop, 1)`, текст «Нет места» при остатке, рамка-подсветка камня перед игроком. Удалить временную клавишу `G` из шага 2.
*Готово, когда:* с киркой в руке (слот 1) встал лицом к серому камню — вокруг него рамка; `Space` — камень вспыхнул и дрогнул, второй удар — исчез, в хотбаре появился «Камень» (серый квадрат), следующие складываются в тот же слот с числом; тёмный (уголь) разбивается с 3-го удара; зажатый `Space` бьёт ровно, не «пулемётом»; клик мышью тоже бьёт; выбрал мотыгу (2) — камень не реагирует; удар в стену или в пустоту ничего не делает.
Коммит: `feat: break rocks with pickaxe, drops go to hotbar`

**Шаг 6. Лестница вниз и глубина.**
`MineScene`: при `ladder: true` поставить тайл `ladder_down`; встал на него и нажал `E` — `fadeToScene(this, 'Mine', { floor: this.floor + 1 })`.
*Готово, когда:* разбивая камни, под одним из них открывается лестница вниз; встал на неё и нажал `E` — «Этаж 2», новые камни, герой у лестницы вверх; на этажах 1–4 только серые и тёмные камни; с «Этажа 5» встречаются медные (рыжие), они бьются с 5-го удара, в хотбаре появляется «Медная руда»; лестница вверх с любого этажа — сразу в сад, ресурсы на месте; после нескольких переходов подряд один удар добавляет ровно 1 ресурс и хотбар обновляется один раз (обработчики не накопились).
Коммит: `feat: hidden ladder down to deeper mine floors`

**После P2:** обновить строку «Текущий этап» в `CLAUDE.md` на P3; `playtester` проходит чеклисты шагов 2, 4–6 в браузере.

---

## 11. Ключевые решения

| Решение | Альтернативы | Почему так |
|---|---|---|
| **Логика в `src/logic/` без Phaser + один `state.ts` с событиями** | Всё внутри сцен; `this.registry` / `game.events` Phaser; библиотека состояния (zustand и т.п.) | Логику можно тестировать без браузера; `state.ts` + события = прямой аналог autoload + сигналов Godot, перенос будет механическим. Отдельный слой «сервисов» не нужен. |
| **Карты — ASCII в JSON, тайлмап строится в коде из цветных квадратов** | Tiled + тайлсет; рисовать прямоугольники без тайлмапа | Ни одного внешнего инструмента; коллизии и камера Phaser работают «из коробки» на тайлмапе; сад и шахта в одном формате. |
| **Один `MineScene`, номер этажа — параметр; этаж каждый раз генерируется заново** | Отдельная сцена на этаж; хранить состояние каждого этажа | Меньше кода, нет хранения, совпадает с дизайном «форма фиксирована, камни случайно». |
| **JSON импортируется в код (`src/data/`)** | Загрузка через `this.load.json` из `public/` | Синхронно, с типами, с автообновлением, без экрана загрузки. |
| **`node_modules` в volume, `npm install` при старте контейнера** | Ставить зависимости в образ (`RUN npm ci`); `node_modules` на диске Windows | Volume не устаревает после изменения зависимостей; на Windows-диске установка медленная и ломается на нативных бинарниках. |
| **Движение — Arcade Physics, плавно, без инерции** | Ходьба по сетке (шаг = клетка, с твином); своя проверка коллизий | Плавный контроль приятнее для уютной игры; коллизии с тайлмапом Phaser делает сам; аналог `CharacterBody2D` в Godot. |
| **Диагональ разрешена и нормализована; взгляд — 4 направления** | Строго 4 направления движения | Строгие 4 стороны ощущаются «деревянно» при свободной (не клеточной) ходьбе; цели действий всё равно в 4 сторонах, как в дизайне. Запретить диагональ — правка пары строк в `Player.ts`. |
| **Polling вместо переноса проекта в WSL2** | Держать репозиторий внутри WSL2 (там работает inotify) | Проект остаётся на `D:`, автор работает как привык; цена — немного CPU, для прототипа неважно. |
| **Переходы — встал на клетку и нажал `E` (вход, лестницы), с затемнением** | Наступил — перешёл; мгновенная смена сцены | Решение автора: переход всегда осознанный, случайно не провалишься. `E` — отдельная клавиша взаимодействия, `Space` остаётся за инструментами. |
| **Камни — спрайты со статичными телами, пол — тайлмап** | Камни как твёрдые тайлы тайлмапа | У спрайта есть вспышка и дрожь при ударе, правильная глубина относительно игрока, лёгкая замена на PNG. |
| **Полный хотбар: камень разбивается, лишнее пропадает с подсказкой «Нет места»** | Не давать разбить камень | Выбросить предметы в прототипе нельзя — запрет на разбивание мог бы навсегда закрыть путь к лестнице вниз. |
| **Дроп сразу в инвентарь** | Предмет падает на землю, его подбирают | Меньше кода (нет подбора и физики предметов), быстрее короткий цикл «ударил → получил». |

---

## 12. Открытые вопросы к автору

Все вопросы закрыты автором:
1. **Лестница вверх** с любого этажа ведёт сразу в сад.
2. **Полив лейкой в P3 — есть:** растение растёт только в политый день; лейка в стартовом инвентаре.
3. **Медь:** разбивается деревянной киркой, но за 5 ударов (обычный камень — 2, уголь — 3).
4. **Хотбар — 9 слотов** (клавиши 1–9 и колёсико).
5. **Ходьба:** свободная, с диагональю (скорость выровнена); взгляд — в 4 стороны.
6. **Стартовый инвентарь** — из `items.json`: кирка, мотыга, лейка, 5 семян репы.
7. **Переходы (вход, лестницы):** по кнопке `E`, стоя на клетке перехода; над героем подсказка.
8. **Полный хотбар:** камень всё равно разбивается, лишнее пропадает, над героем «Нет места».
