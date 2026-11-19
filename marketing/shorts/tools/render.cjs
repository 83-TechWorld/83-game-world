// Frame-by-frame render of compose.html to a Reels/Shorts-ready MP4.
//   node render.cjs <game>            full render -> out/<game>/<game>-short.mp4
//   node render.cjs <game> snap 0,2,5 stills only -> out/<game>/snap.png (contact sheet)
const { chromium } = require('playwright-core')
const { spawn, execFileSync } = require('child_process')
const path = require('path'), fs = require('fs')
const [GAME, MODE, TIMES] = process.argv.slice(2)
const FPS = 30, OUT = path.join(__dirname, 'out', GAME)

;(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--allow-file-access-from-files', '--force-color-profile=srgb'] })
  try {
    const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 })
    page.on('pageerror', e => console.log('pageerror', e.message)); page.on('console', m => m.type() === 'error' && console.log('console', m.text()))
    // clips in compose.html point at recorded moments ("level-set@+0.2"), so re-recording a game keeps the edit in sync
    await page.addInitScript({ content: `window.EVENTS=${JSON.stringify(JSON.parse(fs.readFileSync(path.join(OUT, 'events.json'), 'utf8')).events)}` })
    await page.goto('file://' + path.join(__dirname, `compose.html?game=${GAME}`)); await page.evaluate(() => window.ready)
    const cdp = await page.context().newCDPSession(page)
    const shot = async t => { await page.evaluate(t => window.seek(t), t); const r = await cdp.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1080, height: 1920, scale: 1 } }); return Buffer.from(r.data, 'base64') }
    if (MODE === 'meta') { const m = await page.evaluate(() => ({ dur: window.DUR, endAt: C.endAt, clips: C.clips, caps: C.caps })); fs.writeFileSync(path.join(OUT, 'timeline.json'), JSON.stringify(m, null, 1)); console.log('meta ok'); return }
    if (MODE === 'snap') {
      const ts = TIMES.split(',').map(Number), files = []
      for (const t of ts) { const f = path.join(OUT, `snap_${String(Math.round(t * 100)).padStart(5, '0')}.png`); fs.writeFileSync(f, await shot(t)); files.push(f) }
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', ...files.flatMap(f => ['-i', f]), '-filter_complex', files.map((_, i) => `[${i}]scale=270:480[s${i}]`).join(';') + ';' + files.map((_, i) => `[s${i}]`).join('') + `hstack=inputs=${files.length}`, path.join(OUT, 'snap.png')])
      files.forEach(f => fs.unlinkSync(f)); console.log('snap ->', path.join(OUT, 'snap.png')); return
    }
    const dur = await page.evaluate(() => window.DUR), n = Math.round(dur * FPS), file = path.join(OUT, `${GAME}-short.mp4`)
    // H.264 High, yuv420p, limited range, bt709, silent AAC, faststart: the format Instagram and YouTube accept without re-washing colours
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo',
      '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-profile:v', 'high', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p',
      '-color_range', 'tv', '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', file], { stdio: ['pipe', 'inherit', 'inherit'] })
    const t0 = Date.now()
    for (let i = 0; i < n; i++) { const buf = await shot(i / FPS); if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r)); if (i % 150 === 0) console.log(`frame ${i}/${n}`) }
    ff.stdin.end(); await new Promise(r => ff.on('close', r))
    console.log(`${file} (${n} frames in ${((Date.now() - t0) / 1000).toFixed(0)}s)`)
  } finally { await browser.close() }
})().catch(e => { console.error(e); process.exit(1) })
