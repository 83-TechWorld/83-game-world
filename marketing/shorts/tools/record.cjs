// Records real gameplay of one game as phone-sized footage: node record.cjs <game>
// Output: out/<game>/footage.mp4 (30 fps, 780x1560, or 1560x780 for landscape games) + out/<game>/events.json (seconds into the footage)
const { chromium } = require('playwright-core')
const { spawn, execFileSync } = require('child_process')
const fs = require('fs'), path = require('path')
const ROOT = path.resolve(__dirname, '../../..') // the site repo
const GAME = process.argv[2]
const OUT = path.join(__dirname, 'out', GAME); fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT + '/f', { recursive: true })
const PORT = 4300 + Math.floor(Math.random() * 400)
const sleep = ms => new Promise(r => setTimeout(r, ms))

// shows a soft touch ripple wherever the bot taps, so viewers can follow the play
const TOUCH = `addEventListener('pointerdown',e=>{const d=document.createElement('div');d.style.cssText='position:fixed;z-index:99999;pointer-events:none;left:'+(e.clientX-26)+'px;top:'+(e.clientY-26)+'px;width:52px;height:52px;border-radius:50%;background:rgba(255,255,255,.55);border:3px solid rgba(40,50,90,.55);box-shadow:0 0 0 6px rgba(255,255,255,.25);transition:transform .45s ease-out,opacity .45s ease-out';document.documentElement.appendChild(d);requestAnimationFrame(()=>{d.style.transform='scale(1.7)';d.style.opacity='0'});setTimeout(()=>d.remove(),500)},true);
const st=document.createElement('style');st.textContent='#guide-open{display:none!important}';addEventListener('DOMContentLoaded',()=>document.head.appendChild(st));`

const GAMES = require('./bots.cjs')

;(async () => {
  const bot = GAMES[GAME]; if (!bot) throw new Error('unknown game ' + GAME)
  const [PW, PH] = bot.size || [390, 780] // landscape games set size: [780, 390]
  const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore', detached: true })
  for (let i = 0; i < 60; i++) { try { await fetch(`http://localhost:${PORT}/`); break } catch { await sleep(100) } }
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--autoplay-policy=no-user-gesture-required', `--window-size=${PW},${PH}`, '--force-device-scale-factor=2'] })
  try {
    const ctx = await browser.newContext({ viewport: { width: PW, height: PH }, deviceScaleFactor: 2 })
    await ctx.addInitScript({ content: `try{localStorage.setItem('dg_muted','1');if(!sessionStorage.getItem('__seed')){sessionStorage.setItem('__seed','1');${bot.storage || ''}}}catch(e){};` + TOUCH })
    const page = await ctx.newPage()
    page.on('pageerror', e => console.log('pageerror', e.message))
    await page.goto(`http://localhost:${PORT}${bot.url}`); await page.waitForLoadState('networkidle'); await sleep(600)

    const cdp = await ctx.newCDPSession(page), frames = []
    let t0 = null
    let stopped = false
    cdp.on('Page.screencastFrame', async f => {
      if (stopped) return
      const ts = f.metadata.timestamp; if (t0 === null) t0 = ts
      const file = `f/${String(frames.length).padStart(5, '0')}.jpg`; fs.writeFileSync(path.join(OUT, file), Buffer.from(f.data, 'base64'))
      frames.push({ file, t: ts - t0 }); try { await cdp.send('Page.screencastFrameAck', { sessionId: f.sessionId }) } catch {}
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: PW * 2, maxHeight: PH * 2, everyNthFrame: 1 })
    while (t0 === null) await sleep(20)
    const start = Date.now() / 1000 - (Date.now() / 1000 - t0) // wall clock and frame clock are both epoch seconds
    const events = []
    const mark = name => { const t = Date.now() / 1000 - start; events.push({ name, t: +t.toFixed(2) }); console.log(t.toFixed(1).padStart(6), name) }
    // tap: tag an element inside the page, then click it for real (so the ripple and game input are genuine)
    const tap = async (fnSrc, arg) => {
      const ok = await page.evaluate(([src, a]) => { document.querySelectorAll('[data-bot]').forEach(e => e.removeAttribute('data-bot')); const el = new Function('a', src)(a); if (!el) return false; el.setAttribute('data-bot', '1'); return true }, [fnSrc, arg])
      if (ok) await page.click('[data-bot="1"]', { timeout: 3000, force: true }).catch(e => console.log('tap failed', e.message.split('\n')[0]))
      return ok
    }
    const drag = async (fromSel, toSel) => {
      const a = await page.locator(fromSel).first().boundingBox(), b = await page.locator(toSel).first().boundingBox(); if (!a || !b) return false
      await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down()
      for (let i = 1; i <= 18; i++) { const k = i / 18, e = k < .5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2; await page.mouse.move(a.x + a.width / 2 + (b.x + b.width / 2 - a.x - a.width / 2) * e, a.y + a.height / 2 + (b.y + b.height / 2 - a.y - a.height / 2) * e); await sleep(22) }
      await page.mouse.up(); return true
    }
    await bot.run({ page, tap, drag, mark, sleep })
    await sleep(400); mark('end')
    stopped = true; await cdp.send('Page.stopScreencast')
    const end = events[events.length - 1].t
    // variable-rate frames -> constant 30 fps, short GOP so the composer can seek to any frame quickly
    const list = frames.map((f, i) => `file '${f.file}'\nduration ${Math.max(0.001, ((frames[i + 1] ? frames[i + 1].t : end) - f.t)).toFixed(4)}`).join('\n') + `\nfile '${frames[frames.length - 1].file}'\n`
    fs.writeFileSync(path.join(OUT, 'list.txt'), list)
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', 'list.txt', '-vf', `fps=30,scale=${PW * 2}:${PH * 2}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '14', '-g', '10', '-preset', 'medium', '-movflags', '+faststart', 'footage.mp4'], { cwd: OUT })
    fs.writeFileSync(path.join(OUT, 'events.json'), JSON.stringify({ duration: end, events }, null, 1))
    fs.rmSync(path.join(OUT, 'f'), { recursive: true })
    console.log(`footage ${end.toFixed(1)}s from ${frames.length} frames -> ${OUT}/footage.mp4`)
  } finally { await browser.close(); try { process.kill(-srv.pid) } catch {} }
})().catch(e => { console.error(e); process.exit(1) })
