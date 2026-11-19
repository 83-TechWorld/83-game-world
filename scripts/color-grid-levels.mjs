#!/usr/bin/env node
/**
 * Builds the 20 Color Grid Slide levels and writes them into public/games/color-grid-slide/index.html.
 *   node scripts/color-grid-levels.mjs
 *
 * Every level is guaranteed solvable: the start board is made by playing the game's own moves backwards
 * from a sorted board (one-way gates and colour-swap pads included). It uses the exact rule code from the
 * game page (between //CORE-START and //CORE-END), so the game and this script can never disagree.
 * Seeds are fixed, so re-running gives the same levels.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const file = path.join(root, 'public/games/color-grid-slide/index.html')
let html = fs.readFileSync(file, 'utf8')
const core = html.match(/\/\/CORE-START[^\n]*\n([\s\S]*?)\/\/CORE-END/)[1]
const { step, apply, legal, solved, solve, prevColor, isTok, DIRS } = new Function(core + '\nreturn {step,apply,legal,solved,solve,prevColor,isTok,DIRS}')()

const rows = s => s.trim().split('\n').map(x => x.trim()).join('')
const rng = seed => () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 }
const count = b => b.reduce((m, t) => (isTok(t) && (m[t] = (m[t] || 0) + 1), m), {})

// one backwards move: a cap at X goes back to the empty cell E, undoing the forward move E -> X (and the colour change if X is a pad)
function scramble(L, b, steps, rand) {
  let last = -1
  for (let s = 0; s < steps; s++) {
    const opts = []
    for (let e = 0; e < b.length; e++) {
      if (b[e] !== '.') continue
      for (const d in DIRS) {
        const n = L.n, r = (e / n | 0) + DIRS[d][0], c = e % n + DIRS[d][1]
        if (r < 0 || c < 0 || r >= n || c >= n) continue
        const x = r * n + c
        if (!isTok(b[x]) || x === last) continue
        // forward move E -> X must be legal: pretend the cap sits on E
        const t = b.slice(); t[e] = L.floor[x] === '*' ? prevColor(L, b[x]) : b[x]; t[x] = '.'
        if (step(L, t, e, d) === x) opts.push([x, e, t])
      }
    }
    if (!opts.length) break
    const [x, e, t] = opts[rand() * opts.length | 0]
    b = t; last = e
  }
  return b
}

const C3 = 'BYR', C4 = 'BYRG', C5 = 'BYRGP'
const noAdjSame = (L, b) => b.every((t, i) => !isTok(t) || ![[0, 1], [1, 0]].some(([dr, dc]) => { const r = (i / L.n | 0) + dr, c = i % L.n + dc; return r < L.n && c < L.n && b[r * L.n + c] === t }))
const SPECS = [
  { name: 'Slide In', colors: C3, par: 3, tip: 'Tap a cap next to the empty hole to slide it in.', coach: 'Slide each cap into its color column!', solved: `.YR\nBYR\nBYR`, exact: true },
  { name: 'Column Swap', colors: C3, par: 8, tip: 'Blue and Red swapped sides! Loop them around.', coach: 'Blue and red are in the wrong columns!', solved: `.YR\nBYR\nBYR`, check: (L, b) => [0, 3, 6].some(i => b[i] === 'R') && [2, 5, 8].some(i => b[i] === 'B') },
  { name: 'Corner Trap', colors: C3, par: 12, tip: 'Plan a path through the corners.', coach: 'Move the corner caps step by step!', solved: `BY.\nBYR\nBYR`, check: (L, b) => b[0] !== 'B' && b[2] !== 'R' && b[6] !== 'B' && b[8] !== 'R' },
  { name: 'Checkerboard', colors: C3, par: 16, tip: 'No two caps of the same color touch. Sort them!', coach: 'A checkerboard mix-up!', solved: `.YR\nBYR\nBYR`, check: noAdjSame },
  { name: 'Classic Boss', colors: C3, par: 18, cap: 24, tip: 'Boss level! Sort everything before you run out of moves.', coach: 'Boss level! Watch your moves!', solved: `.YR\nBYR\nBYR` },
  { name: 'Stone Center', colors: C3, par: 14, tip: 'The stone in the middle never moves. Go around it!', coach: 'A stone! Slide around it.', solved: `BY.\nB#R\nBYR` },
  { name: 'Twisty Track', colors: C3, par: 16, tip: 'Two stones make a twisty track.', coach: 'Two stones block the way!', solved: `B.#\nBYR\n#YR` },
  { name: 'Hello Green', colors: C4, par: 18, tip: 'A bigger board with a new Green column and two holes.', coach: 'Green is here! Two empty holes.', solved: `BY..\nBYRG\nBYRG\nBYRG` },
  { name: 'Squeeze', colors: C4, par: 24, tip: 'Only one hole now. Think before you slide!', coach: 'Only one hole now!', solved: `BYR.\nBYRG\nBYRG\nBYRG` },
  { name: 'The Maze', colors: C4, par: 28, tip: 'Boss level! Two stones turn the board into a maze.', coach: 'Boss level! A maze of stones!', solved: `BYRG\nB#RG\nBY#G\nBYR.` },
  { name: 'One-Way Arrows', colors: C4, par: 20, tip: 'Arrows only let caps slide the way they point.', coach: 'Follow the arrows!', solved: `BY..\nBYRG\nBYRG\nBYRG`, floor: `....\n.>..\n..<.\n....`, check: (L, b) => [5, 10].some(i => isTok(b[i])) },
  { name: 'Rainbow Pad', colors: C4, par: 22, tip: 'A cap that lands on the rainbow pad changes color: Blue, Yellow, Red, Green.', coach: 'The rainbow pad changes colors!', solved: `BYR.\nBYRG\nBYRG\nBYRG`, floor: `....\n....\n.*..\n....`, check: 'counts' },
  { name: 'Uneven Stock', colors: C4, par: 25, tip: 'Too many of one color! Use the rainbow pad to fix it.', coach: 'Too many of one color! Use the pad.', solved: `BYR.\nBYRG\nBYRG\nBYRG`, floor: `....\n.*..\n....\n....`, check: 'counts2' },
  { name: 'Mirror Board', colors: C4, par: 30, tip: 'The top row is the bottom row backwards!', coach: 'A mirror board!', start: `GRYB\nRB.Y\nYGBR\nBYRG` },
  { name: 'Timed Rush', colors: C4, par: 32, time: 120, tip: 'Boss level! Arrows and a rainbow pad, against the clock.', coach: 'Boss level! Beat the clock!', solved: `BYR.\nBYRG\nBYRG\nBYRG`, floor: `....\n.>..\n..*.\n...^`, check: 'counts' },
  { name: 'Mega Grid', colors: C5, par: 28, tip: 'Purple joins in! Three holes: push a whole line at once.', coach: 'Purple is here! Tap a cap to push a whole line.', solved: `BY.G.\nBYR.P\nBYRGP\nBYRGP\nBYRGP` },
  { name: 'Four Pillars', colors: C5, par: 35, tip: 'Four stone pillars split the board into rooms.', coach: 'Four stone pillars!', solved: `BYRGP\nB#R#P\nBYRGP\nB#R#P\nBY.G.` },
  { name: 'Conveyor Loop', colors: C5, par: 38, tip: 'The arrows on the edges go round like a conveyor belt.', coach: 'A conveyor loop!', solved: `BY.GP\nBYRGP\nBYRGP\nBYRGP\nBYR.P`, floor: `..>..\n.....\n^...v\n.....\n..<..` },
  { name: 'Double Chameleon', colors: C5, par: 42, tip: 'Two rainbow pads! Plan a few moves ahead.', coach: 'Two rainbow pads!', solved: `BYRG.\nBYRGP\nBYRGP\nBYRGP\nBYRGP`, floor: `.....\n.*...\n.....\n...*.\n.....`, check: 'counts2' },
  { name: 'Grand Finale', colors: C5, par: 48, cap: 60, tip: 'The grand finale: stones, arrows and a rainbow pad!', coach: 'Grand finale! Use everything you learned.', solved: `BYRGP\nBYRGP\nB#R#P\nBYRGP\nBYRG.`, floor: `.....\n.....\n..v..\n.....\n.<.*.`, check: 'counts' },
]

const out = []
for (const [i, S] of SPECS.entries()) {
  const n = Math.round(Math.sqrt(rows(S.solved || S.start).length))
  const floor = (S.floor ? rows(S.floor) : '.'.repeat(n * n)).split('')
  const L = { n, colors: S.colors.split(''), floor }
  const w = n === 3 ? 1 : n === 4 ? 1.6 : 2.2, budget = n === 3 ? 400000 : n === 4 ? 1500000 : 2500000
  let best = null
  if (S.start) {
    const b = rows(S.start).split(''), sol = solve(L, b, budget, 1.3)
    if (!sol) throw new Error(S.name + ': hand-made start could not be solved')
    best = { b, sol }
  } else {
    const goal = rows(S.solved).split('')
    if (!solved(L, goal)) throw new Error(S.name + ': solved board is not sorted')
    const want = S.par, tol = Math.max(1, Math.round(want * .2))
    for (let seed = 1; seed < 600 && !(best && Math.abs(best.sol.length - want) <= tol); seed++) {
      const rand = rng(i * 7919 + seed)
      const b = scramble(L, goal.slice(), S.exact ? want : Math.round(want * (1.5 + rand() * 2.5)), rand)
      if (solved(L, b)) continue
      const c0 = count(goal), c1 = count(b), diff = Object.keys({ ...c0, ...c1 }).filter(k => c0[k] !== c1[k]).length
      if (S.check === 'counts' && diff < 1) continue
      if (S.check === 'counts2' && diff < 2) continue
      if (typeof S.check === 'function' && !S.check(L, b)) continue
      const sol = solve(L, b, budget, w)
      if (!sol) continue
      if (!best || Math.abs(sol.length - want) < Math.abs(best.sol.length - want)) best = { b, sol }
    }
    if (!best) throw new Error(S.name + ': no level found')
  }
  // replay the solution with the game rules to be sure it really solves the board
  let t = best.b.slice()
  for (const [f, to] of best.sol) { if (!legal(L, t).some(m => m[0] === f && m[1] === to)) throw new Error(S.name + ': bad move'); t = apply(L, t, f, to) }
  if (!solved(L, t)) throw new Error(S.name + ': solution does not solve')
  const par = best.sol.length, cap = S.cap ? Math.max(S.cap, par + 8) : 0
  out.push({ name: S.name, n, colors: S.colors, board: best.b.join(''), floor: floor.join(''), par, ...(cap ? { cap } : {}), ...(S.time ? { time: S.time } : {}), tip: S.tip, coach: S.coach, sol: best.sol })
  console.log(String(i + 1).padStart(2), S.name.padEnd(17), `${n}x${n}`, 'par', String(par).padStart(2), '(wanted', S.par + ')', cap ? 'cap ' + cap : '', JSON.stringify(count(best.b)))
}
html = html.replace(/\/\*LEVELS\*\/[\s\S]*?\/\*\/LEVELS\*\//, () => '/*LEVELS*/' + JSON.stringify(out) + '/*/LEVELS*/')
fs.writeFileSync(file, html)
console.log('wrote', out.length, 'levels')
