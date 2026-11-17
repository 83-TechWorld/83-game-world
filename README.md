# Kids Games 4u

A growing collection of browser games — one hub, many games. Goal: **50 games**, all deployed from this single repo.

**Live:** deployed to Netlify from `dist/` (see `netlify.toml`).

## Games

| # | Game | Type | Where |
|---|------|------|-------|
| 1 | 🔤 Alphabet Adventure | Phaser scene | `src/scenes/AlphaAdventure.ts` |
| 2 | 🔢 Number Adventure | Phaser scene | `src/scenes/NumberAdventure.ts` |
| 3 | 🏗️ Building Blocks | Phaser scene | `src/scenes/BuildingBlocksScene.ts` |
| 4 | 🎯 Shape Match | Phaser scene | `src/scenes/ShapeMatchScene.ts` |
| 5 | 🕵️ Stick Spy Ops | Standalone (canvas) | `public/games/stick-spy-ops/` → `/games/stick-spy-ops/` |
| 6 | 🚴 Stick Cycle Race | Standalone (canvas) | `public/games/stick-cycle-race/` → `/games/stick-cycle-race/` |
| 7 | 🧟 Zombie Block Siege | Standalone (canvas) | `public/games/zombie-block-siege/` → `/games/zombie-block-siege/` |

The full list lives in **`src/catalog.ts`** — the single registry the home screen renders from.

## Project layout

```
83-game-world/
├── index.html              # hub entry (Vite)
├── src/
│   ├── main.ts             # Phaser config; registers scene-based games
│   ├── catalog.ts          # ⭐ registry of ALL games (scene + standalone)
│   └── scenes/             # Phaser games (one file each) + HomeScene
├── public/
│   ├── assets/             # shared images/audio
│   └── games/              # ⭐ standalone games, one folder each
│       ├── _template/      # copy me to start a new standalone game
│       ├── stick-spy-ops/  # self-contained index.html
│       └── stick-cycle-race/
├── netlify.toml            # build: npm run build, publish: dist
└── vite.config.ts
```

Vite copies `public/` into `dist/` as-is, so every folder under `public/games/` ships with the hub and is served at `/games/<slug>/`.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
npm run preview    # serve dist/ locally
```

## Adding a game

### Option A — standalone game (any engine, vanilla JS, canvas…)
1. Copy `public/games/_template/` to `public/games/<slug>/`.
2. Build the game inside that folder (keep it self-contained; keep the `← KIDS GAMES 4U` home link).
3. Register it in `src/catalog.ts`:
   ```ts
   { id: '<slug>', title: 'My Game', emoji: '🎮', description: 'One line',
     kind: 'url', url: '/games/<slug>/', category: 'arcade', color: 0x06b6d4, available: true }
   ```

### Option B — Phaser scene (shares the hub's engine, assets and audio)
1. Create `src/scenes/MyGameScene.ts` with `super({ key: 'MyGameScene' })`.
2. Add it to the `scene: [...]` array in `src/main.ts`.
3. Register it in `src/catalog.ts` with `kind: 'scene', scene: 'MyGameScene'`.

Rules of thumb: Phaser scenes for small kids' learning games that share assets; standalone folders for bigger or engine-specific games. Mark a game `available: false` to show it as "coming soon" without launching it.

## Deploy

Push to `main` → Netlify builds `npm run build` and publishes `dist/`. Standalone games deploy automatically because they live in `public/`.

## Roadmap to 50
Track ideas in `src/catalog.ts` as `available: false` entries, so the hub shows what's coming.


## Dashboard & kids games (v2)

- The dashboard (`src/main.ts`, `src/hub.css`) is plain DOM/CSS — no Phaser. Add a game by adding one entry to `src/catalog.ts`.
- Learning games (`alphabet-safari`, `number-rocket`, `block-builder`, `shape-dash`, `word-zoo`) share `public/games/_shared/kids.js` + `kids.css`
  (level map, stars, praise owl, speech, drag/tap placement, confetti). A new learning game is one `index.html` that calls `K.start({id,title,emoji,worlds,levels,build})`.
  Progress is stored in `localStorage` key `dg_<id>`; the dashboard shows the stars.
- The old Phaser scenes in `src/scenes/` are no longer used (kept for reference; safe to delete).
