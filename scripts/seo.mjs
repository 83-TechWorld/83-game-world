#!/usr/bin/env node
/**
 * Kids Games 4u — SEO generator.  Run:  node scripts/seo.mjs
 *
 * Writes (idempotent, safe to re-run any time):
 *   - <head> SEO block (title, description, canonical, Open Graph, Twitter, JSON-LD) in index.html and every public/games/<slug>/index.html
 *   - public/sitemap.xml, public/robots.txt, public/manifest.webmanifest
 * To change the domain, edit SITE below and re-run. When you add a game, add one entry to GAMES and re-run.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { GUIDES, NEW_GAMES, NEW_ABOUT } from './game-guides.mjs'
import { sitePages, FOOTER_LINKS } from './site-pages.mjs'

const SITE = 'https://kidsgames4u.com'          // <-- your domain (no trailing slash)
const BRAND = 'Kids Games 4u'
const TODAY = new Date().toISOString().slice(0, 10)
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const GAMES = [
  { slug: 'alphabet-safari', name: 'Alphabet Safari', title: 'Alphabet Safari – Free ABC Game for Kids', age: [3, 6], genre: 'Educational',
    desc: 'Free ABC game for kids aged 3-6. Learn letters, vowels, uppercase and lowercase and letter sounds in jungle, ocean, space and candy worlds. 10 fun levels with stars and cheers.',
    kw: 'alphabet game for kids, ABC game, learn letters, phonics game, vowels for kids, preschool alphabet game online' },
  { slug: 'number-rocket', name: 'Number Rocket', title: 'Number Rocket – Free Counting & Math Game for Kids', age: [3, 7], genre: 'Educational',
    desc: 'Free number game for kids aged 3-7. Count objects, put numbers in order, find the bigger number and add up to 20 on a rocket trip across the planets. 10 levels.',
    kw: 'counting game for kids, number game, kindergarten math game, learn numbers 1 to 20, addition for kids, free math games online' },
  { slug: 'block-builder', name: 'Block Builder', title: 'Block Builder – Free Colour & Memory Building Game', age: [4, 8], genre: 'Educational',
    desc: 'Free building game for kids aged 4-8. Choose colours and build houses, trees, rockets and forts, then rebuild them from memory. Trains colours, patterns and memory in 10 levels.',
    kw: 'building blocks game for kids, colour matching game, memory game for kids, pattern game, kids puzzle game online' },
  { slug: 'shape-dash', name: 'Shape Dash', title: 'Shape Dash – Free Shapes & Colours Game for Kids', age: [3, 8], genre: 'Educational',
    desc: 'Free shapes game for kids aged 3-8. Steer circles, squares, triangles and stars into the matching hole while you dodge buzzy bees. Learn shapes and colours in 10 levels.',
    kw: 'shape game for kids, learn shapes, shapes and colors game, toddler game online, preschool shapes' },
  { slug: 'word-zoo', name: 'Word Zoo', title: 'Word Zoo – Free English Words Game: Fruits & Animals', age: [4, 8], genre: 'Educational',
    desc: 'Free English vocabulary game for kids aged 4-8. Match, sort, listen and spell fruits, vegetables, farm animals, wild animals and sea animals. 10 levels with spoken words.',
    kw: 'english words game for kids, vocabulary game, fruits and vegetables game, animals game for kids, spelling game, learn english online' },
  { slug: 'planet-parade', name: 'Planet Parade', title: 'Planet Parade – Free Solar System Game for Kids', age: [4, 9], genre: 'Educational',
    desc: 'Free planets game for kids aged 4-9. Learn the 8 planets, order them from the Sun, from big to small and from hot to cold. The Sun is the hottest! 16 space levels.',
    kw: 'solar system game for kids, planets game, learn planets in order, space game for kids, science game online, astronomy for kids' },
  { slug: 'tick-tock-clock', name: 'Tick Tock Clock', title: 'Tick Tock Clock – Learn to Tell Time Game for Kids', age: [4, 9], genre: 'Educational',
    desc: 'Free clock game for kids aged 4-9. Learn to tell time: o\'clock, half past, quarter past, minutes and seconds. Drag the hour, minute and second hands in 21 levels.',
    kw: 'telling time game, learn to tell time, clock game for kids, analog clock game, hours and minutes game, AM PM game' },
  ...NEW_GAMES,
  { slug: 'stick-spy-ops', name: 'Stick Spy Ops', title: 'Stick Spy Ops – Free Stick Figure Spy Game', age: [8, 99], genre: 'Action',
    desc: 'Free stick figure spy shooter with 20 missions. Sneak, hide in cover and take down enemies. Name your hero and enemies after your friends.',
    kw: 'stick figure game, spy game online, stickman shooter, free browser action game, stick game' },
  { slug: 'stick-cycle-race', name: 'Stick Cycle Race', title: 'Stick Cycle Race – Free Cycle Racing Game', age: [6, 99], genre: 'Action',
    desc: 'Free 20-level cycle race. Pick your colour, grab boosters, sprint past the other riders and outrun the ghost. Plays on phone, tablet and computer.',
    kw: 'bicycle racing game, cycle race game online, kids racing game, stickman bike game, free browser racing game' },
  { slug: 'zombie-block-siege', name: 'Zombie Block Siege', title: 'Zombie Block Siege – Free Stickman Zombie Shooter', age: [10, 99], genre: 'Action',
    desc: 'Free stickman zombie shooter with 15 levels. Hide behind bricks, choose your gun and beat the fire-breathing boss. Name the hero and zombies after your friends.',
    kw: 'zombie shooting game, stickman zombie game, free zombie game online, browser shooter, brick wall defense game' },
  { slug: 'sky-blaster', name: 'Sky Blaster: Zombie Flight', title: 'Sky Blaster: Zombie Flight – Free Cartoon Jetpack Shooter for Kids', age: [6, 99], genre: 'Action',
    desc: 'Free cartoon jetpack shooter for kids. Fly through sunny clouds, sunset canyons and starry skies, grab power stars and turn goofy flying zombies into dancing ghosts. 15 levels with Mega-Zombie bosses.',
    kw: 'jetpack game, kids shooter game, flying zombie game, cartoon space shooter, side scrolling shooter for kids, free browser action game' },
  { slug: 'friend-rescue', name: 'Friend Rescue Quest', title: 'Friend Rescue Quest – Free Platform Adventure for Kids: Rescue 12 Friends', age: [6, 99], genre: 'Action',
    desc: 'Free cartoon platform adventure for kids. Run, jump over lava, swim, climb vines and solve switch puzzles to rescue 12 friends from the Gloop King. Name the hero and every friend, and each rescued friend joins your squad with a new power.',
    kw: 'platform game for kids, rescue game, adventure game for kids, jump and run game, puzzle platformer, name your hero game' },
  { slug: 'rough-note-showdown', name: 'Rough Note Showdown', title: 'Rough Note Showdown – Classic Notebook Dice Game', age: [6, 99], genre: 'Strategy',
    desc: 'The classic school notebook game with dice for 2-6 players or vs the computer. Draw your stickman, grab a gun and be the last one standing.',
    kw: 'notebook game, dice game for friends, paper pen game, last digit game, multiplayer dice game online, school rough note game' },
]

// Visible "About this game" content (shown under the level map and in <noscript>): real text for readers and search engines.
const ABOUT = {
  'alphabet-safari': { intro: 'Alphabet Safari is a free ABC game that helps preschool and kindergarten children learn the English alphabet. Kids travel through jungle, ocean, space, candy and dinosaur worlds, putting letters in order, finding missing letters and matching sounds.', skills: ['Recognising letters A to Z', 'Alphabetical order', 'Uppercase and lowercase letters', 'Vowels and consonants', 'Letter sounds (phonics)'], how: 'Drag a letter into its box, or tap the letter and then tap the box. Finish each level to earn up to three stars and unlock the next world.' },
  'number-rocket': { intro: 'Number Rocket is a free counting and early maths game for children. Kids blast off across the Moon, Mars and Saturn while they count, order numbers, compare which is bigger and add small numbers up to 20.', skills: ['Counting objects', 'Number order 1 to 20', 'Skip counting by twos', 'Bigger and smaller numbers', 'Simple addition'], how: 'Put the numbers in order, tap the right answer, or add up the objects. The owl coach cheers every correct answer.' },
  'block-builder': { intro: 'Block Builder is a free building and memory game for children. Kids pick colours and fill in blueprints for houses, trees, rockets and forts, then try to rebuild them from memory.', skills: ['Colour recognition', 'Patterns and shapes', 'Visual memory', 'Planning and focus'], how: 'Pick a colour, then tap the matching box in the blueprint. In memory levels, look carefully first, because the colours disappear.' },
  'shape-dash': { intro: 'Shape Dash is a free shapes and colours game for toddlers and young children. Kids steer circles, squares, triangles and stars into the matching hole while dodging buzzy bees.', skills: ['Naming basic shapes', 'Matching shapes and colours', 'Hand and eye control', 'Quick thinking'], how: 'Use the arrow buttons or keys, or press and drag, to move the shape to the hole with the same shape.' },
  'word-zoo': { intro: 'Word Zoo is a free English vocabulary game for children. Kids match, sort, listen to and spell the names of fruits, vegetables, farm animals, wild animals and sea animals.', skills: ['New English words', 'Fruits and vegetables', 'Domestic, wild and water animals', 'Sorting into groups', 'Spelling'], how: 'Drag or tap a word, then tap the matching picture. In sorting levels, put each animal or food in its home. In spelling levels, tap the letters in order.' },
  'planet-parade': { intro: 'Planet Parade is a free solar system game for children. Kids meet the eight planets and the Sun, then put them in order by distance from the Sun, by size and by temperature.', skills: ['Names of the 8 planets', 'Order of the planets from the Sun', 'Big and small planets', 'Hot and cold: the Sun is the hottest', 'Fun space facts'], how: 'Tap the right planet, or drag the planets into the right order. After each answer the owl coach tells a fun fact.' },
  'tick-tock-clock': { intro: 'Tick Tock Clock is a free game that teaches children to tell the time on an analogue clock. Levels grow from o\'clock and half past to quarter times, exact minutes, seconds, AM and PM and daily routines.', skills: ['Hour hand and minute hand', 'O\'clock, half past and quarter past', 'Reading minutes and seconds', 'Setting the clock to a time', 'AM and PM and how many hours pass'], how: 'Read the clock and pick the right time, or drag the hands of the clock to show the time you are asked for, then press Check.' },
  'stick-spy-ops': { intro: 'Stick Spy Ops is a free stick figure spy game with 20 missions. Sneak past guards, hide in cover and take down enemy agents. Give your hero and the enemies the names of your friends.', skills: [], how: 'Move with A and D or the arrow keys, jump with W or Space, crouch with S to hide in cover and aim with the mouse. On a phone, use the on-screen buttons and touch the screen to aim.' },
  'stick-cycle-race': { intro: 'Stick Cycle Race is a free 20-level cycling game. Choose your colour, pedal fast, grab boosters and try to beat the other riders and the ghost.', skills: [], how: 'Hold the pedal button (or Space or D) to go, press W and S to change lane, and hold Shift to sprint when you have stamina.' },
  'zombie-block-siege': { intro: 'Zombie Block Siege is a free stickman zombie shooter with 15 levels. Hide behind brick walls, choose your gun, rebuild your wall and defeat the fire-breathing boss at the end of every level.', skills: [], how: 'Move with A and D, crouch with S, aim and shoot with the mouse, reload with R and rebuild bricks with E. On a phone, touch the screen to aim and shoot.' },
  'sky-blaster': { intro: 'Sky Blaster: Zombie Flight is a bright cartoon side-scrolling shooter. A kid pilot with a jetpack and aviator goggles flies through sunny clouds, sunset canyons and a starry night, blasting goofy zombies that fly with propeller hats, balloons and jetpacks. There is no gore: every zombie turns into green smoke and a little dancing ghost.', skills: [], how: 'Drag to fly, or use the arrow keys or WASD. Your blaster fires by itself, or turn auto-fire off and shoot with Space. Swoop close to the zombies to grab the glowing power stars: they upgrade your blaster from Pea-Shooter to Twin Laser to Super Mega-Blast. Flying close without touching gives a Close! bonus that charges your shield. Each level adds more zombies, Tank Zombies arrive from level 2 and a Mega-Zombie boss waits at levels 5, 10 and 15.' },
  'friend-rescue': { intro: 'Friend Rescue Quest is a bright cartoon platform adventure. The Gloop King has locked 12 friends in cages, and the hero runs, jumps, swims and climbs through meadows, lava fields, jungles, lagoons, caves, sky islands, a sea temple and a castle to set them free. Players type in the hero\'s name and every friend\'s name, and each rescued friend joins the squad, follows the hero and brings a new power.', skills: [], how: 'Reach the cage at the end of each level and open it, finding the key first when the cage has a lock. Then run to the rainbow portal with your new friend. Bop goofy gloops on the head, punch them, or trap them in bubbles. Friends give powers: Double Jump, Friend Helper to hold switches, Super Punch for cracked rocks and Leaf Glide.' },
  'rough-note-showdown': { intro: 'Rough Note Showdown is the classic school notebook dice game for 2 to 6 players or against the computer. Roll the dice, draw your stickman part by part, get a gun and shoot your rivals\' rows. The last player standing wins.', skills: [], how: 'Roll the dice. The number decides which row you hit: 0 or 1 is row 1, 2 or 3 is row 3, and so on. Every hit draws more of your stickman, and an armed row earns bullets.' },
  ...NEW_ABOUT,
};
const LEARN = ['alphabet-safari', 'number-rocket', 'block-builder', 'shape-dash', 'word-zoo', 'planet-parade', 'tick-tock-clock', ...NEW_GAMES.map(g => g.slug)]

// AdSense publisher ID lives in one place: public/games/_shared/ads.js
const AD_CLIENT = (fs.readFileSync(path.join(root, 'public/games/_shared/ads.js'), 'utf8').match(/client: '(ca-pub-\d{16})'/) || [])[1]

const HOME = {
  title: `${BRAND} – Free Online Learning Games for Kids`,
  desc: 'Free kids games online: learn the alphabet, numbers, shapes, English words, planets and how to tell time. Safe, fun, no sign-up. Play on phone, tablet or computer.',
  kw: 'kids games, free kids games, educational games for kids, learning games online, preschool games, alphabet game, number game, telling time game, solar system game, toddler games, Kids Games 4u',
}
const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const OG = `${SITE}/og-image.png`

function head({ title, desc, kw, url, type = 'website', ld, script }) {
  return `<!--SEO-->
    <title>${esc(title)}</title>${AD_CLIENT ? `\n    <meta name="google-adsense-account" content="${AD_CLIENT}" />` : ''}
    <script src="/games/_shared/${script}"></script>
    <meta name="description" content="${esc(desc)}" />
    <meta name="keywords" content="${esc(kw)}" />
    <meta name="robots" content="index,follow,max-image-preview:large" />
    <meta name="theme-color" content="#7cc6ff" />
    <link rel="canonical" href="${url}" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
    <meta property="og:site_name" content="${BRAND}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(desc)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${OG}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:locale" content="en" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(desc)}" />
    <meta name="twitter:image" content="${OG}" />
    <script type="application/ld+json">${JSON.stringify(ld)}</script>
    <!--/SEO-->`
}

function inject(file, block, bodyBlock) {
  let s = fs.readFileSync(file, 'utf8')
  s = s.replace(/\s*<!--SEO-->[\s\S]*?<!--\/SEO-->/g, '').replace(/\s*<!--SEO-BODY-->[\s\S]*?<!--\/SEO-BODY-->/g, '')
  s = s.replace(/<title>[\s\S]*?<\/title>/i, '')
  s = s.replace(/\s*<meta\s+(name="(description|keywords|robots)"|property="og:[^"]*")[^>]*>/gi, '')
  s = s.replace(/<\/head>/i, `    ${block}\n  </head>`)
  if (bodyBlock) s = /<div id="app"><\/div>/.test(s) ? s.replace(/(<div id="app"><\/div>)/, `$1\n    ${bodyBlock}`) : s.replace(/(<body[^>]*>)/i, `$1\n    ${bodyBlock}`)
  fs.writeFileSync(file, s)
}

// ----- home -----
const homeLd = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: BRAND, url: SITE + '/', inLanguage: 'en', description: HOME.desc },
  { '@context': 'https://schema.org', '@type': 'Organization', name: BRAND, url: SITE + '/', logo: `${SITE}/icon-512.png` },
  { '@context': 'https://schema.org', '@type': 'CollectionPage', name: HOME.title, url: SITE + '/', isFamilyFriendly: true, audience: { '@type': 'PeopleAudience', suggestedMinAge: 3, suggestedMaxAge: 12 },
    mainEntity: { '@type': 'ItemList', itemListElement: GAMES.map((g, i) => ({ '@type': 'ListItem', position: i + 1, url: `${SITE}/games/${g.slug}/index.html`, name: g.title })) } },
]
const noscript = `<!--SEO-BODY-->
    <noscript>
      <main style="font-family:system-ui,sans-serif;max-width:760px;margin:30px auto;padding:0 16px">
        <h1>${BRAND}: free online learning games for kids</h1>
        <p>${esc(HOME.desc)}</p>
        <ul>${GAMES.map(g => `<li><a href="/games/${g.slug}/index.html">${esc(g.title)}</a>: ${esc(g.desc)}</li>`).join('')}</ul>
        <p>Guides for parents and teachers: <a href="/parents/index.html">Parents' Corner</a>. Latest games: <a href="/whats-new/index.html">What's New</a>.</p>
        <p>Please turn on JavaScript to play.</p>
      </main>
    </noscript>
    <!--/SEO-BODY-->`
inject(path.join(root, 'index.html'), head({ ...HOME, url: SITE + '/', ld: homeLd, script: 'ads.js' }), noscript)

// ----- each game -----
for (const g of GAMES) {
  const file = path.join(root, 'public/games', g.slug, 'index.html')
  if (!fs.existsSync(file)) { console.warn('missing', file); continue }
  const url = `${SITE}/games/${g.slug}/index.html`
  const ld = [
    { '@context': 'https://schema.org', '@type': ['VideoGame', 'WebApplication'], name: g.name, url, description: g.desc, applicationCategory: g.genre === 'Educational' ? 'EducationalApplication' : 'GameApplication',
      genre: g.genre, operatingSystem: 'Any (web browser)', browserRequirements: 'Requires JavaScript', inLanguage: 'en', isAccessibleForFree: true, isFamilyFriendly: true,
      audience: { '@type': 'PeopleAudience', suggestedMinAge: g.age[0], ...(g.age[1] < 99 ? { suggestedMaxAge: g.age[1] } : {}) },
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }, publisher: { '@type': 'Organization', name: BRAND, url: SITE + '/' } },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: BRAND, item: SITE + '/' },
      { '@type': 'ListItem', position: 2, name: LEARN.includes(g.slug) ? 'Learn & Play' : 'Action games', item: SITE + '/' },
      { '@type': 'ListItem', position: 3, name: g.name, item: url }] },
  ]
  const A = ABOUT[g.slug], rel = GAMES.filter(x => x.slug !== g.slug && (LEARN.includes(x.slug) === LEARN.includes(g.slug))).slice(0, 6)
  const G = GUIDES[g.slug], ages = g.age[1] < 99 ? `${g.age[0]}-${g.age[1]}` : `${g.age[0]}+`, skills = A.skills.length ? A.skills : G.skills
  // Real HTML in the page. kids.js shows it under the level map; guide.js opens it on full-screen action games.
  const body = `<!--SEO-BODY-->
    <noscript><style>html,body{height:auto!important;overflow:auto!important}#game-guide{display:block!important}</style></noscript>
    <section id="game-guide" class="about-game" hidden>
      <h2>About ${esc(g.name)}: a free game for ages ${ages}</h2>
      <p>${esc(A.intro)}</p>
      <p>${esc(G.more)}</p>
      <h3>How to play</h3><p>${esc(A.how)}</p>
      <h3>Controls</h3><p>${esc(G.controls)}</p>
      <h3>Skills kids practise</h3><ul>${skills.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <h3>For parents and teachers</h3><p>${esc(G.parents)}</p>
      <h3>More free games</h3><p>${rel.map(x => `<a href="/games/${x.slug}/index.html">${esc(x.name)}</a>`).join(' &middot; ')} &middot; <a href="/">All games</a></p>
      <p>${FOOTER_LINKS.map(([t, u]) => `<a href="${u}">${t}</a>`).join(' &middot; ')}</p>
    </section>
    <!--/SEO-BODY-->`
  inject(file, head({ title: `${g.title} | ${BRAND}`, desc: g.desc, kw: g.kw + ', ' + BRAND, url, type: 'website', ld, script: LEARN.includes(g.slug) ? 'ads.js' : 'guide.js' }), body)
}

// ----- about / contact / privacy -----
const PAGES = sitePages({ BRAND, GAMES, LEARN })
for (const p of PAGES) {
  const url = `${SITE}/${p.slug}/index.html`
  const tags = `<title>${esc(p.title)}</title>\n<meta name="description" content="${esc(p.desc)}" />\n<link rel="canonical" href="${url}" />${AD_CLIENT ? `\n<meta name="google-adsense-account" content="${AD_CLIENT}" />` : ''}\n</head>`
  fs.mkdirSync(path.join(root, 'public', p.slug), { recursive: true })
  fs.writeFileSync(path.join(root, 'public', p.slug, 'index.html'), p.html.replace('</head>', () => tags))
}
if (AD_CLIENT) fs.writeFileSync(path.join(root, 'public/ads.txt'), `google.com, ${AD_CLIENT.replace('ca-', '')}, DIRECT, f08c47fec0942fa0\n`)

// template should never be indexed
const tpl = path.join(root, 'public/games/_template/index.html')
if (fs.existsSync(tpl)) { let s = fs.readFileSync(tpl, 'utf8'); if (!/name="robots"/.test(s)) s = s.replace(/<\/head>/i, '  <meta name="robots" content="noindex" />\n</head>'); fs.writeFileSync(tpl, s) }

// ----- sitemap / robots / manifest -----
const urls = [{ loc: SITE + '/', pr: '1.0', cf: 'weekly' }, ...GAMES.map(g => ({ loc: `${SITE}/games/${g.slug}/index.html`, pr: LEARN.includes(g.slug) ? '0.9' : '0.7', cf: 'monthly' })), ...PAGES.map(p => ({ loc: `${SITE}/${p.slug}/index.html`, pr: p.pr || '0.3', cf: p.cf || 'yearly' }))]
fs.writeFileSync(path.join(root, 'public/sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u.loc}</loc><lastmod>${TODAY}</lastmod><changefreq>${u.cf}</changefreq><priority>${u.pr}</priority></url>`).join('\n')}\n</urlset>\n`)
fs.writeFileSync(path.join(root, 'public/robots.txt'), `User-agent: *\nAllow: /\nDisallow: /games/_template/\n\nSitemap: ${SITE}/sitemap.xml\n`)
fs.writeFileSync(path.join(root, 'public/manifest.webmanifest'), JSON.stringify({ name: BRAND, short_name: 'KidsGames4u', description: HOME.desc, start_url: '/', display: 'standalone', background_color: '#bfe9ff', theme_color: '#7cc6ff', categories: ['education', 'games', 'kids'],
  icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }, { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }] }, null, 2))
console.log('SEO written for', SITE, '-', urls.length, 'urls')
