import './hub.css'
import { GAMES, GameEntry } from './catalog'

const $ = <T extends HTMLElement>(s: string, r: ParentNode = document) => r.querySelector(s) as T
const h = (tag: string, cls = '', html = '') => { const e = document.createElement(tag); if (cls) e.className = cls; e.innerHTML = html; return e }

// ---- tiny sound (silent if the browser blocks it) ----
let AC: AudioContext | null = null
function blip(f = 600, f2 = 900, d = 0.12, v = 0.07) {
  try {
    AC = AC || new (window.AudioContext || (window as any).webkitAudioContext)()
    if (AC.state === 'suspended') AC.resume()
    const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain()
    o.type = 'sine'; o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f2, t + d)
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d)
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d)
  } catch { /* ignore */ }
}

function progress(id: string): { s: number; max: number } | null {
  try {
    const o = JSON.parse(localStorage.getItem('dg_' + id) || 'null')
    if (!o) return null
    const s = Object.values(o.stars || {}).reduce((a: number, b: any) => a + (b as number), 0)
    return { s, max: o.max || 30 }
  } catch { return null }
}

const app = $('#app')
app.innerHTML = ''

// ---- sky: sun, clouds, flyers, hills (parallax) ----
const sky = h('div', 'sky')
sky.appendChild(h('div', 'sun'))
;[['8%', 90, 70], ['22%', 70, 95], ['48%', 110, 120], ['64%', 60, 80]].forEach(([top, size, dur], i) => {
  const c = h('div', 'cloud', '☁️'); c.style.top = top as string; c.style.fontSize = size + 'px'
  c.style.animationDuration = dur + 's'; c.style.animationDelay = -i * 22 + 's'; (c.style as any)['--d'] = (6 + i * 4) + 'px'; sky.appendChild(c)
})
;[['🎈', '30%', 55], ['✈️', '14%', 38], ['🦋', '55%', 48], ['🐦', '40%', 30]].forEach(([e, top, dur], i) => {
  const f = h('div', 'fly', e as string); f.style.top = top as string; f.style.animationDuration = dur + 's'; f.style.animationDelay = -i * 11 + 's'; sky.appendChild(f)
})
const hill = (c1: string, c2: string, d: string, path: string) => {
  const e = h('div', 'hill', `<svg viewBox="0 0 1440 200" preserveAspectRatio="none" height="${c2 === '1' ? 150 : 120}"><path d="${path}" fill="${c1}"/></svg>`); (e.style as any)['--d'] = d; return e
}
sky.appendChild(hill('#9be37a', '1', '14px', 'M0 90 Q240 20 480 80 T960 70 T1440 60 L1440 200 L0 200Z'))
sky.appendChild(hill('#5fc15d', '2', '28px', 'M0 120 Q300 50 620 110 T1240 100 T1440 90 L1440 200 L0 200Z'))
app.appendChild(sky)
addEventListener('pointermove', e => {
  sky.style.setProperty('--mx', String((e.clientX / innerWidth - 0.5) * 2))
  sky.style.setProperty('--my', String((e.clientY / innerHeight - 0.5) * 2))
})

// ---- hero title ----
const hero = h('header', 'hero')
const COLORS = ['#ff5a6a', '#ff9a3a', '#ffc61a', '#3fcf6a', '#3ea0ff', '#a45cff', '#ff5aa5']
const h1 = h('h1')
'D-GAMES'.split('').forEach((ch, i) => { const s = h('span', '', ch); s.style.setProperty('--i', String(i)); s.style.setProperty('--c', COLORS[i % COLORS.length]); s.onpointerenter = () => blip(400 + i * 90, 700 + i * 90); h1.appendChild(s) })
hero.appendChild(h1)
hero.appendChild(h('div', 'tag', '🎮 Play · Learn · Have fun!'))
app.appendChild(hero)

// ---- stars + filter chips ----
const totalEl = h('div', 'stars')
document.body.appendChild(totalEl)
const refreshStars = () => {
  const t = GAMES.reduce((a, g) => a + (progress(g.id)?.s || 0), 0)
  totalEl.textContent = `⭐ ${t} stars`
}
refreshStars()
const chips = h('div', 'chips')
const FILTERS: [string, string][] = [['all', '🌈 All games'], ['learn', '🧠 Learn & Play'], ['action', '⚡ Action Zone']]
FILTERS.forEach(([k, label], i) => {
  const b = h('button', 'chip' + (i === 0 ? ' on' : ''), label)
  b.onclick = () => {
    blip(500, 800); chips.querySelectorAll('.chip').forEach(c => c.classList.remove('on')); b.classList.add('on')
    shelves.forEach(([g, el]) => el.classList.toggle('hide', k !== 'all' && k !== g))
  }
  chips.appendChild(b)
})
app.appendChild(chips)

// ---- mascot ----
const mascot = h('div', 'mascot', `
  <svg class="kid" viewBox="0 0 120 160">
    <g stroke="#27315a" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <line x1="60" y1="62" x2="60" y2="112"/><line x1="60" y1="112" x2="42" y2="150"/><line x1="60" y1="112" x2="80" y2="150"/>
      <line x1="60" y1="74" x2="30" y2="98"/>
      <g class="wv"><line x1="60" y1="74" x2="96" y2="46"/></g>
      <circle cx="60" cy="38" r="23" fill="#ffd9a8"/>
      <path d="M37 33 Q60 4 83 33 Q60 24 37 33Z" fill="#3ec6ff"/>
      <circle cx="52" cy="42" r="3" fill="#27315a"/><circle cx="68" cy="42" r="3" fill="#27315a"/>
      <path d="M50 50 Q60 60 70 50" />
    </g>
  </svg><div class="bubble">Hi, I am Dhakshith! Pick a game!</div>`)
hero.appendChild(mascot)
const bubble = $('.bubble', mascot)
const SAYS = ['Hi, I am Dhakshith! Pick a game!', 'Learning is super fun!', 'Collect all the stars! ⭐', 'You are so smart!', 'Which game do you want to play?']
let si = 0, hovering = false
const say = (t: string) => { bubble.textContent = t; bubble.style.animation = 'none'; void bubble.offsetWidth; bubble.style.animation = '' }
setInterval(() => { if (!hovering) { si = (si + 1) % SAYS.length; say(SAYS[si]) } }, 5000)

// ---- portal (the "open the game" animation) ----
const portal = h('div', 'portal'); document.body.appendChild(portal)
function openGame(g: GameEntry, card: HTMLElement) {
  const r = card.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2
  blip(300, 1200, 0.5, 0.09)
  for (let i = 0; i < 16; i++) {
    const s = h('div', 'spark', ['⭐', '✨', '🎉', '💫'][i % 4]); s.style.left = cx + 'px'; s.style.top = cy + 'px'
    const a = (i / 16) * Math.PI * 2, d = 90 + Math.random() * 120
    s.style.setProperty('--dx', Math.cos(a) * d + 'px'); s.style.setProperty('--dy', Math.sin(a) * d + 'px'); document.body.appendChild(s); setTimeout(() => s.remove(), 1000)
  }
  card.style.transform = 'scale(1.12) rotate(-3deg)'; card.style.transition = 'transform .3s cubic-bezier(.3,1.6,.5,1)'
  portal.style.setProperty('--px', cx + 'px'); portal.style.setProperty('--py', cy + 'px')
  portal.style.background = `radial-gradient(circle at 50% 40%, color-mix(in srgb, ${g.color} 70%, #fff), ${g.color})`
  portal.innerHTML = `<div class="big">${g.emoji}</div><div class="t">${g.title}</div><div class="dots"><span>.</span><span>.</span><span>.</span></div>`
  setTimeout(() => portal.classList.add('go'), 280)
  setTimeout(() => { window.location.href = g.url }, 1250)
}
// coming back with the browser Back button: close the portal again
addEventListener('pageshow', e => { if ((e as PageTransitionEvent).persisted) { portal.classList.remove('go'); refreshStars(); document.querySelectorAll<HTMLElement>('.card').forEach(c => { c.style.transform = '' }) } })

// ---- shelves + cards ----
const SHELVES: [string, string][] = [['learn', '🧠 Learn &amp; Play'], ['action', '⚡ Action Zone']]
const shelves: [string, HTMLElement][] = []
let n = 0
for (const [grp, title] of SHELVES) {
  const list = GAMES.filter(g => g.available && g.group === grp)
  if (!list.length) continue
  const sec = h('section', 'shelf', `<h2>${title}</h2>`), grid = h('div', 'grid')
  list.forEach(g => {
    const p = progress(g.id)
    const card = h('div', 'card', `
      ${g.isNew ? '<div class="ribbon">NEW</div>' : ''}
      <div class="ico m-${g.motion}"><i>${g.emoji}</i></div>
      <h3>${g.title}</h3><p>${g.description}</p>
      <div class="meta">${g.ageRange ? `<span class="age">Age ${g.ageRange}</span>` : ''}<span>${g.group === 'learn' ? 'LEARN' : 'ACTION'}</span></div>
      ${p ? `<div class="pb"><i style="width:${Math.min(100, Math.round((100 * p.s) / p.max))}%"></i></div><div class="pt">⭐ ${p.s} / ${p.max}</div>` : '<div class="pt">&nbsp;</div>'}`)
    const cw = h('div', 'cw'); cw.style.setProperty('--n', String(n++)); cw.appendChild(card)
    card.style.setProperty('--c', g.color)
    card.tabIndex = 0; card.setAttribute('role', 'link'); card.setAttribute('aria-label', 'Play ' + g.title)
    card.onpointerenter = () => { hovering = true; say(g.tagline); blip(520, 780, 0.1, 0.05) }
    card.onpointerleave = () => { hovering = false; card.style.transform = ''; card.style.transition = 'transform .3s' }
    card.onpointermove = e => {
      const r = card.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5
      card.style.transition = 'none'; card.style.transform = `perspective(700px) rotateY(${x * 14}deg) rotateX(${-y * 12}deg) translateY(-6px)`
    }
    card.onclick = () => openGame(g, card)
    card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openGame(g, card) } }
    grid.appendChild(cw)
  })
  sec.appendChild(grid); app.appendChild(sec); shelves.push([grp, sec])
}
;(window as any).__hub = { openGame, GAMES }
