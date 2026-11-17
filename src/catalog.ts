/**
 * 83GameWorld — single registry of every game.
 *
 * Two kinds of games live here:
 *  - Phaser scenes (kind: 'scene'): registered in src/main.ts and launched in-app.
 *  - Standalone games (kind: 'url'): one self-contained folder under public/games/<slug>/
 *    (index.html + assets). Vite copies public/ into dist/, so they deploy with the hub
 *    and open at /games/<slug>/. Great for canvas / vanilla-JS / any-engine games.
 *
 * To add a game: drop it in, add one entry below. That's it.
 */
export type GameKind = 'scene' | 'url';
export type GameCategory = 'learning' | 'action' | 'puzzle' | 'arcade' | 'creative';

export interface GameEntry {
  id: string;            // slug, unique
  title: string;
  emoji: string;
  description: string;
  kind: GameKind;
  scene?: string;        // kind === 'scene'
  url?: string;          // kind === 'url'
  category: GameCategory;
  color: number;         // accent (hex)
  available: boolean;
  ageRange?: string;     // e.g. '3-6', '8+'
  isNew?: boolean;       // shows a NEW ribbon on the hub
}

export const GAMES: GameEntry[] = [
  { id: 'alphabet-adventure', title: 'Alphabet Adventure', emoji: '🔤', description: 'Learn and arrange letters A to Z',
    kind: 'scene', scene: 'AlphabetAdventure', category: 'learning', color: 0x3b82f6, available: true, ageRange: '3-6' },
  { id: 'number-adventure', title: 'Number Adventure', emoji: '🔢', description: 'Learn and arrange numbers 1 to 20',
    kind: 'scene', scene: 'NumberAdventure', category: 'learning', color: 0x10b981, available: true, ageRange: '3-6' },
  { id: 'building-blocks', title: 'Building Blocks', emoji: '🏗️', description: 'Build structures with colorful blocks',
    kind: 'scene', scene: 'BuildingBlocksScene', category: 'creative', color: 0x8b5cf6, available: true, ageRange: '3-7' },
  { id: 'shape-match', title: 'Shape Match', emoji: '🎯', description: 'Match shapes using arrow keys',
    kind: 'scene', scene: 'ShapeMatchScene', category: 'puzzle', color: 0xf59e0b, available: true, ageRange: '3-6' },
  { id: 'stick-spy-ops', title: 'Stick Spy Ops', emoji: '🕵️', description: '20-mission stick-figure spy shooter. Name your hero & enemies!',
    kind: 'url', url: '/games/stick-spy-ops/index.html', category: 'action', color: 0x06b6d4, available: true, ageRange: '8+', isNew: true },
  { id: 'stick-cycle-race', title: 'Stick Cycle Race', emoji: '🚴', description: '20-level cycle race. Pick your color, grab boosters, outrun the ghost!',
    kind: 'url', url: '/games/stick-cycle-race/index.html', category: 'arcade', color: 0xf59e0b, available: true, ageRange: '6+', isNew: true },
  { id: 'zombie-block-siege', title: 'Zombie Block Siege', emoji: '🧟', description: '15 levels. Hide behind bricks, pick your gun, beat the fire-breathing boss!',
    kind: 'url', url: '/games/zombie-block-siege/index.html', category: 'action', color: 0x22c55e, available: true, ageRange: '10+', isNew: true },
];

export const availableGames = () => GAMES.filter(g => g.available);
