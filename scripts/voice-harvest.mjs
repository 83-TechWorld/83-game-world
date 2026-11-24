// Collects every line the kids games can speak, for the recorded Kokoro voice.
//   node scripts/voice-harvest.mjs        -> writes public/voice/<game>.json and scripts/voice-lines.json
// Then record the new lines:  marketing/shorts/tools/.venv/bin/python scripts/voice_synth.py
//
// Each game's code is parsed and every string literal and fixed part of a template string is kept as a phrase.
// Every word is also recorded alone, so lines built at run time ("Tap the " + word) can be joined from pieces.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import * as acorn from 'acorn'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const gamesDir = path.join(root, 'public/games')
const kidsJs = fs.readFileSync(path.join(gamesDir, '_shared/kids.js'), 'utf8')

// Must match speakText() and chunks() in public/games/_shared/kids.js
function speakText(t) {
  t = String(t)
  t = t.replace(/(\d{1,2}):(\d{2}):(\d{2})/g, (a, h, m, sec) => `${+h} ${+m === 0 ? "o'clock" : +m < 10 ? 'oh ' + (+m) : +m} and ${+sec} seconds`)
  t = t.replace(/(\d{1,2}):(\d{2})/g, (a, h, m) => `${+h} ${+m === 0 ? "o'clock" : +m < 10 ? 'oh ' + (+m) : +m}`)
  t = t.replace(/(^|[\s(])-(\d)/g, '$1minus $2').replace(/°C/g, ' degrees Celsius').replace(/\bkm\b/g, 'kilometers')
  return t.replace(/[^\w\s!?.,']/g, ' ').replace(/\s+/g, ' ').trim()
}
const chunks = t => (t.match(/[^.!?]+[.!?]*\s*/g) || [t]).map(x => x.trim()).filter(Boolean)
// Must match vKey() in kids.js
export const voiceKey = t => String(t).toLowerCase().replace(/[^a-z0-9']+/g, ' ').split(' ').map(w => w.replace(/^'+|'+$/g, '')).filter(Boolean).join(' ')

const CODEY = /[<>{};=#\\|`$]|https?:|\.(png|svg|js|css|mp3|json|html)\b|\bpx\b|rgba?\(|^--|^[.#@]|^[a-z]+-[a-z-]+$|^[a-z]+[A-Z]\w*$|^\w+\(/
function strings(src) {
  const out = []
  let ast
  try { ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'script', allowReturnOutsideFunction: true }) } catch (e) { console.warn('  parse error:', e.message); return out }
  const walk = n => {
    if (!n || typeof n.type !== 'string') return
    if (n.type === 'Literal' && typeof n.value === 'string') out.push(n.value)
    else if (n.type === 'TemplateLiteral') n.quasis.forEach(q => out.push(q.value.cooked || ''))
    for (const k in n) { const v = n[k]; if (k === 'type') continue; if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v.type === 'string') walk(v) }
  }
  walk(ast)
  return out
}
function phrasesOf(raw) {
  const s = String(raw).trim()
  if (!s || s.length > 400 || !/[A-Za-z]{2,}|^[A-Za-z]$/.test(s) || CODEY.test(s)) return []
  return chunks(speakText(s)).filter(c => /[a-z]/i.test(c))
}

const shared = new Map()   // key -> text to record
const add = (map, text) => { const k = voiceKey(text); if (!k) return; const prev = map.get(k); if (!prev || (/[!?.]$/.test(text) && !/[!?.]$/.test(prev))) map.set(k, text) }
for (const s of strings(kidsJs)) for (const p of phrasesOf(s)) add(shared, p)
// numbers and letters are often joined into lines at run time
for (let i = 0; i <= 120; i++) add(shared, String(i))
for (const n of [150, 200, 250, 300, 365, 500, 1000]) add(shared, String(n))
for (const c of 'abcdefghijklmnopqrstuvwxyz') add(shared, c)

const all = new Map(shared), manifests = {}
const games = fs.readdirSync(gamesDir).filter(g => !g.startsWith('_') && fs.existsSync(path.join(gamesDir, g, 'index.html')))
for (const g of games) {
  const html = fs.readFileSync(path.join(gamesDir, g, 'index.html'), 'utf8')
  if (!/_shared\/kids\.js/.test(html)) continue
  const scripts = [...html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1])
  const mine = new Map(shared)
  for (const sc of scripts) for (const s of strings(sc)) for (const p of phrasesOf(s)) add(mine, p)
  // every word alone, so run-time lines can be pieced together
  for (const k of [...mine.keys()]) for (const w of k.split(' ')) if (w && !mine.has(w)) mine.set(w, w)
  for (const [k, t] of mine) add(all, t)
  manifests[g] = [...mine.keys()].sort()
  console.log(g.padEnd(22), manifests[g].length, 'lines')
}
fs.mkdirSync(path.join(root, 'public/voice'), { recursive: true })
for (const g in manifests) fs.writeFileSync(path.join(root, 'public/voice', g + '.json'), JSON.stringify(manifests[g]))
const lines = [...all].map(([k, t]) => ({ k, t })).sort((a, b) => a.k < b.k ? -1 : 1)
fs.writeFileSync(path.join(root, 'scripts/voice-lines.json'), JSON.stringify(lines, null, 0))
console.log('total unique lines:', lines.length)
