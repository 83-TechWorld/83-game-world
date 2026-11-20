/**
 * Kids Games 4u — single registry of every game shown on the dashboard.
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
  { id: 'where-is-kitty', title: 'Where Is Kitty?', emoji: '🐱', description: 'Learn in, on, by, up, off, out, to and at. Watch Kitty move, drag Kitty, fill the gap!', url: '/games/where-is-kitty/index.html', group: 'learn', color: '#f97316', motion: 'bounce', tagline: 'Is Kitty in the box or on the box?', available: true, ageRange: '4-8', isNew: true },
  { id: 'spell-gaps', title: 'Spell Gaps', emoji: '✏️', description: 'Find the missing letters! Easy words for every letter A to Z. 10 levels.', url: '/games/spell-gaps/index.html', group: 'learn', color: '#14b8a6', motion: 'wiggle', tagline: 'a _ p l e… which letter is missing?', available: true, ageRange: '4-8', isNew: true },
  { id: 'safety-scout', title: 'Safety Scout', emoji: '🦸', description: 'Safe or unsafe? School, playground, road, fire drills and strangers. Earn 5 badges and a certificate!', url: '/games/safety-scout/index.html', group: 'learn', color: '#ef4444', motion: 'pulse', tagline: 'Safe or unsafe? You decide, Safety Scout!', available: true, ageRange: '5-10', isNew: true },
  { id: 'habit-hero', title: 'Habit Hero', emoji: '🦸‍♀️', description: 'Good habits from sunrise to bedtime! Brush germs, healthy plate, tidy toys, pack your bag. 11 levels.', url: '/games/habit-hero/index.html', group: 'learn', color: '#8b5cf6', motion: 'float', tagline: 'Good habits make you a hero!', available: true, ageRange: '4-9', isNew: true },
  { id: 'memory-matrix', title: 'Memory Matrix', emoji: '🧠', description: 'Remember where each picture hides! Missing pictures, swaps and look-alikes. 20 levels.', url: '/games/memory-matrix/index.html', group: 'learn', color: '#7c3aed', motion: 'pulse', tagline: 'Look, remember, and find it!', available: true, ageRange: '4-10', isNew: true },
  { id: 'build-crew', title: 'Build Crew', emoji: '👷', description: 'Remember the blueprint, build it, then survive the 2-minute disaster check! 20 levels.', url: '/games/build-crew/index.html', group: 'learn', color: '#f59e0b', motion: 'bounce', tagline: 'Build it strong, then test it!', available: true, ageRange: '5-10', isNew: true },
  { id: 'color-grid-slide', title: 'Color Grid Slide', emoji: '🧩', description: 'Slide the colored caps into their matching columns. Stones, arrows and rainbow pads! 20 levels.', url: '/games/color-grid-slide/index.html', group: 'learn', color: '#3b82f6', motion: 'spin', tagline: 'Slide, sort, and think ahead!', available: true, ageRange: '5-12', isNew: true },
  { id: 'stick-spy-ops', title: 'Stick Spy Ops', emoji: '🕵️', description: '20-mission stick-figure spy shooter. Name your hero & enemies!', url: '/games/stick-spy-ops/index.html', group: 'action', color: '#0891b2', motion: 'pulse', tagline: 'Shh… sneak up on the spies!', available: true, ageRange: '8+' },
  { id: 'stick-cycle-race', title: 'Stick Cycle Race', emoji: '🚴', description: '20-level cycle race. Pick your color, grab boosters, outrun the ghost!', url: '/games/stick-cycle-race/index.html', group: 'action', color: '#f59e0b', motion: 'bounce', tagline: 'Pedal fast! The ghost is coming!', available: true, ageRange: '6+' },
  { id: 'zombie-block-siege', title: 'Zombie Block Siege', emoji: '🧟', description: '15 levels. Hide behind bricks, pick your gun, beat the fire-breathing boss!', url: '/games/zombie-block-siege/index.html', group: 'action', color: '#16a34a', motion: 'shake', tagline: 'Hide behind the bricks and shoot!', available: true, ageRange: '10+' },
  { id: 'sky-blaster', title: 'Sky Blaster', emoji: '🚀', description: 'Jetpack through the sky, grab power stars and turn flying zombies into dancing ghosts! 15 levels.', url: '/games/sky-blaster/index.html', group: 'action', color: '#0ea5e9', motion: 'float', tagline: 'Zoom, dodge and blast!', available: true, ageRange: '6+', isNew: true },
  { id: 'rough-note-showdown', title: 'Rough Note Showdown', emoji: '🎲', description: 'The old notebook dice game! Draw your stickman, grab a gun, be the last one standing. 2-6 players or CPU!', url: '/games/rough-note-showdown/index.html', group: 'action', color: '#dc2626', motion: 'wiggle', tagline: 'Roll the dice and shoot your friends on paper!', available: true, ageRange: '6+', isNew: true },
];

export const availableGames = () => GAMES.filter(g => g.available);
