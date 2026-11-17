/**
 * D-Games — single registry of every game shown on the dashboard.
 *
 * Every game is a standalone folder under public/games/<slug>/ (index.html + assets).
 * Vite copies public/ into dist/, so games deploy with the hub and open at
 * /games/<slug>/index.html (use the explicit index.html: the dev server does not
 * resolve folder URLs).
 *
 * To add a game: drop the folder in, add one entry below. That's it.
 * Learning games built with public/games/_shared/kids.js save their progress to
 * localStorage key `dg_<id>` ({stars:{level:n}, max}) and the dashboard shows it.
 */
export type GameGroup = 'learn' | 'action';
export type Motion = 'wiggle' | 'spin' | 'bounce' | 'float' | 'shake' | 'pulse';

export interface GameEntry {
  id: string;            // slug, unique; also the progress key (dg_<id>) for kids.js games
  title: string;
  emoji: string;
  description: string;
  url: string;
  group: GameGroup;
  color: string;         // accent colour (css)
  motion: Motion;        // idle animation of the icon
  tagline: string;       // mascot says this on hover
  available: boolean;
  ageRange?: string;
  isNew?: boolean;
}

export const GAMES: GameEntry[] = [
  { id: 'alphabet-safari', title: 'Alphabet Safari', emoji: '🔤', description: 'Hunt the letters through jungle, ocean and space. 10 levels!', url: '/games/alphabet-safari/index.html', group: 'learn', color: '#22c55e', motion: 'bounce', tagline: 'Let us learn our ABC with the animals!', available: true, ageRange: '3-6', isNew: true },
  { id: 'number-rocket', title: 'Number Rocket', emoji: '🚀', description: 'Count, add and blast off across the planets. 10 levels!', url: '/games/number-rocket/index.html', group: 'learn', color: '#6366f1', motion: 'float', tagline: '3, 2, 1… blast off with numbers!', available: true, ageRange: '3-7', isNew: true },
  { id: 'block-builder', title: 'Block Builder', emoji: '🧱', description: 'Build houses, rockets and forts. Then build from memory!', url: '/games/block-builder/index.html', group: 'learn', color: '#f97316', motion: 'wiggle', tagline: 'Pick your colors and build something big!', available: true, ageRange: '4-8', isNew: true },
  { id: 'shape-dash', title: 'Shape Dash', emoji: '🔷', description: 'Steer each shape to its hole and dodge the buzzy bees!', url: '/games/shape-dash/index.html', group: 'learn', color: '#06b6d4', motion: 'spin', tagline: 'Circle, square, star… which hole is yours?', available: true, ageRange: '3-8', isNew: true },
  { id: 'word-zoo', title: 'Word Zoo', emoji: '🦁', description: 'Fruits, veggies, farm, wild and sea animals: match, sort and spell!', url: '/games/word-zoo/index.html', group: 'learn', color: '#ec4899', motion: 'shake', tagline: 'Meet the animals and learn new words!', available: true, ageRange: '4-8', isNew: true },
  { id: 'planet-parade', title: 'Planet Parade', emoji: '🪐', description: 'Meet the planets! Order them by distance, size and heat. The Sun is the hottest! 16 levels.', url: '/games/planet-parade/index.html', group: 'learn', color: '#7c3aed', motion: 'spin', tagline: 'Big, small, hot or cold? Let us explore space!', available: true, ageRange: '4-9', isNew: true },
  { id: 'tick-tock-clock', title: 'Tick Tock Clock', emoji: '⏰', description: 'Learn to tell time! Drag the hour, minute and second hands. 21 levels.', url: '/games/tick-tock-clock/index.html', group: 'learn', color: '#f59e0b', motion: 'wiggle', tagline: 'Tick tock! Can you set the clock?', available: true, ageRange: '4-9', isNew: true },
  { id: 'stick-spy-ops', title: 'Stick Spy Ops', emoji: '🕵️', description: '20-mission stick-figure spy shooter. Name your hero & enemies!', url: '/games/stick-spy-ops/index.html', group: 'action', color: '#0891b2', motion: 'pulse', tagline: 'Shh… sneak up on the spies!', available: true, ageRange: '8+' },
  { id: 'stick-cycle-race', title: 'Stick Cycle Race', emoji: '🚴', description: '20-level cycle race. Pick your color, grab boosters, outrun the ghost!', url: '/games/stick-cycle-race/index.html', group: 'action', color: '#f59e0b', motion: 'bounce', tagline: 'Pedal fast! The ghost is coming!', available: true, ageRange: '6+' },
  { id: 'zombie-block-siege', title: 'Zombie Block Siege', emoji: '🧟', description: '15 levels. Hide behind bricks, pick your gun, beat the fire-breathing boss!', url: '/games/zombie-block-siege/index.html', group: 'action', color: '#16a34a', motion: 'shake', tagline: 'Hide behind the bricks and shoot!', available: true, ageRange: '10+' },
  { id: 'rough-note-showdown', title: 'Rough Note Showdown', emoji: '🎲', description: 'The old notebook dice game! Draw your stickman, grab a gun, be the last one standing. 2-6 players or CPU!', url: '/games/rough-note-showdown/index.html', group: 'action', color: '#dc2626', motion: 'wiggle', tagline: 'Roll the dice and shoot your friends on paper!', available: true, ageRange: '6+', isNew: true },
];

export const availableGames = () => GAMES.filter(g => g.available);
