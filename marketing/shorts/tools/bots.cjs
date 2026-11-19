// Scripted players. Each one plays correctly with human-like pauses and marks moments the video can cut to.
const stars = (n, s = 3) => JSON.stringify(Object.fromEntries([...Array(n)].map((_, i) => [i, s])))
const until = async (page, fn, ms = 15000) => { try { await page.waitForFunction(fn, null, { timeout: ms, polling: 100 }); return true } catch { return false } }
const winModal = () => !!document.querySelector('.modal .btn.pri, .modal h1')

// kids.js games: open a level straight from the map with a real tap
const openLevel = async ({ page, tap, sleep }, i) => { await tap(`return document.querySelectorAll('.lv')[${i}]`); await sleep(500) }
const backToMap = async ({ page, tap, sleep }) => { await tap(`return [...document.querySelectorAll('.modal .btn')].find(b=>/Levels/.test(b.textContent))`); await sleep(700) }

module.exports = {
  'memory-matrix': {
    url: '/games/memory-matrix/index.html',
    storage: `localStorage.setItem('dg_memory-matrix',JSON.stringify({unlocked:20,stars:${stars(14)},max:60}));`,
    async run(b) {
      const { page, tap, mark, sleep } = b
      await sleep(1200); mark('map')
      await page.evaluate(() => document.querySelector('main').scrollTo({ top: 0 }))
      // a few boards from different modes: find, chain on a 4x4, missing picture
      for (const [lv, label] of [[4, 'space'], [17, 'mega'], [10, 'missing']]) {
        await openLevel(b, lv); mark('level-' + label)
        let guard = 0
        while (guard++ < 60) {
          if (await page.evaluate(winModal)) { mark('win-' + label); await sleep(2600); break }
          const ready = await page.evaluate(() => [...document.querySelectorAll('.btn.pri')].some(x => /Ready/.test(x.textContent)))
          if (ready) { mark('peek-' + label); await sleep(2400); await tap(`return [...document.querySelectorAll('.btn.pri')].find(x=>/Ready/.test(x.textContent))`); await sleep(700); continue }
          const did = await tap(`
            const ch=[...document.querySelectorAll('.choices .choice')].find(c=>c._ok&&!c.disabled&&!c.classList.contains('good'));if(ch)return ch;
            const line=(document.querySelector('.say-line')||{}).textContent||'';
            if(/swapped/i.test(line))return [...document.querySelectorAll('.cell')].find(c=>c._sw&&!c.classList.contains('ok'));
            const cur=document.querySelector('.tg.cur');if(!cur||cur.classList.contains('got'))return null;
            return [...document.querySelectorAll('.cell.flip')].find(c=>c.querySelector('.face span').textContent===cur.textContent);`)
          if (did) { mark('tap-' + label); await sleep(900) } else await sleep(250)
        }
        if (lv !== 10) await backToMap(b)
      }
    },
  },

  'safety-scout': {
    url: '/games/safety-scout/index.html',
    storage: `localStorage.setItem('dg_safety-scout',JSON.stringify({unlocked:5,stars:${stars(4)},max:15}));localStorage.setItem('dg_safety-scout_name','Little Scout');`,
    async run(b) {
      const { page, tap, mark, sleep } = b
      await sleep(1200); mark('map')
      for (const [lv, label, rounds] of [[0, 'hall', 4], [2, 'road', 6], [3, 'fire', 4]]) {
        await openLevel(b, lv); mark('level-' + label)
        let answered = 0, guard = 0
        while (answered < rounds && guard++ < 80) {
          const kind = await page.evaluate(() => document.querySelector('.fb') ? null : document.querySelector('.sbtn:not([disabled])') ? 'q' : document.querySelector('.spot') ? 'spot' : null)
          if (kind) await sleep(kind === 'q' ? 1500 : 2000) // let viewers read the question first
          const did = await tap(`
            const nx=document.querySelector('.fb .btn.pri');if(nx)return null;
            const sb=[...document.querySelectorAll('.sbtn')].find(x=>x._ok&&!x.disabled);if(sb)return sb;
            const sp=[...document.querySelectorAll('.spot')].find(x=>x._bad&&!x.classList.contains('good'));if(sp)return sp;
            const steps=[...document.querySelectorAll('.steps .step')];if(steps.length)return steps.reduce((a,c)=>c._i<a._i?c:a);
            return null;`)
          if (did) {
            const kind = await page.evaluate(() => document.querySelector('.fb') ? 'answer' : document.querySelector('.steps .step') ? 'step' : 'answer')
            mark('tap-' + label); await sleep(kind === 'step' ? 650 : 400)
            if (await page.evaluate(() => !!document.querySelector('.fb'))) { answered++; mark('right-' + label); await sleep(1700); await tap(`return document.querySelector('.fb .btn.pri')`); await sleep(500) }
          } else await sleep(300)
        }
        await page.evaluate(() => window.__K && __K.showMap()); await sleep(900)
      }
      // all five badges earned: open the certificate
      await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('dg_safety-scout')); s.stars['4'] = 3; s.unlocked = 5; localStorage.setItem('dg_safety-scout', JSON.stringify(s)) })
      await page.reload(); await sleep(1200); mark('badges')
      await page.evaluate(() => { const b = [...document.querySelectorAll('.btn')].find(x => /certificate/i.test(x.textContent)); b && b.scrollIntoView({ block: 'center' }) }); await sleep(900)
      await tap(`return [...document.querySelectorAll('.btn')].find(x=>/certificate/i.test(x.textContent))`); await sleep(400); mark('certificate'); await sleep(3200)
    },
  },

  'habit-hero': {
    url: '/games/habit-hero/index.html',
    storage: `localStorage.setItem('dg_habit-hero',JSON.stringify({unlocked:11,stars:${stars(8)},max:33}));`,
    async run(b) {
      const { page, tap, drag, mark, sleep } = b
      await sleep(1200); mark('map')
      for (const [lv, label, rounds] of [[0, 'sunrise', 4], [4, 'plate', 1], [10, 'night', 4]]) {
        await openLevel(b, lv); mark('level-' + label)
        let answered = 0, guard = 0
        while (answered < rounds && guard++ < 90) {
          // sorting: drag each food or school item into its basket
          const tile = await page.evaluate(() => { const t = [...document.querySelectorAll('.tray .tile')]; if (!t.length) return null; document.querySelectorAll('[data-src],[data-dst]').forEach(e => { e.removeAttribute('data-src'); e.removeAttribute('data-dst') }); const s = [...document.querySelectorAll('.slot, .basket')].find(x => x._s && x._s.key === t[0]._t.k); t[0].setAttribute('data-src', 1); s.setAttribute('data-dst', 1); return true })
          if (tile) { await drag('[data-src]', '[data-dst]'); mark('drag-' + label); await sleep(450); if (await page.evaluate(() => !!document.querySelector('.fb'))) { answered++; await sleep(2200) } continue }
          const ready = await page.evaluate(() => [...document.querySelectorAll('.hc')].length === 2 && ![...document.querySelectorAll('.hc')].some(x => x.disabled))
          if (ready) { await sleep(1300); await tap(`return [...document.querySelectorAll('.hc')].find(x=>x._good)`); mark('right-' + label); answered++; await sleep(1900); await tap(`return document.querySelector('.fb .btn.pri')`); await sleep(400); continue }
          await sleep(250)
        }
        await page.evaluate(() => window.__K && __K.showMap()); await sleep(900)
      }
    },
  },

  'rough-note-showdown': {
    url: '/games/rough-note-showdown/index.html',
    storage: '',
    async run(b) {
      const { page, tap, mark, sleep } = b
      await sleep(1000); mark('setup')
      await sleep(1200); await tap(`return document.querySelector('[data-t="0"]')`); await sleep(900) // make both players the computer
      await tap(`return document.getElementById('startBtn')`); mark('start')
      for (let i = 0; i < 60; i++) {
        await sleep(1000)
        if (await page.evaluate(() => /win|wins|winner|champion/i.test((document.querySelector('.ov') || {}).textContent || ''))) { mark('gameover'); await sleep(3500); break }
        if (i === 14) { await tap(`return document.getElementById('fastBtn')`); mark('fast') }
      }
    },
  },
  // ---------- second batch ----------
  'tick-tock-clock': {
    url: '/games/tick-tock-clock/index.html',
    storage: `localStorage.setItem('dg_tick-tock-clock',JSON.stringify({unlocked:21,stars:${stars(9)},max:63}));`,
    async run(b) {
      const { page, tap, mark, sleep } = b
      await sleep(1200); mark('map')
      // read the clock: pick the right time
      await openLevel(b, 3); mark('level-read')
      for (let q = 0; q < 3; q++) { await page.waitForSelector('.choice[data-good]:not(:disabled)'); await sleep(1500); await tap(`return document.querySelector('.choice[data-good]:not(:disabled)')`); mark('right-read'); await sleep(1500) }
      await page.evaluate(() => __K.showMap()); await sleep(800)
      // set the clock: drag the minute hand, then the hour hand, then Check
      await openLevel(b, 4); mark('level-set')
      for (let q = 0; q < 3; q++) {
        await page.waitForSelector('.go'); await sleep(1200)
        const g = await page.evaluate(() => {
          const [h, m] = document.querySelector('.tgt').textContent.trim().split(':').map(Number)
          const svg = document.querySelector('.ckrow svg') || document.querySelector('svg'); const r = svg.getBoundingClientRect()
          const ang = n => { const e = document.querySelector(`.hand[data-h="${n}"]`); const tr = (e.getAttribute('transform') || '') + ' ' + (e.style.transform || ''); const mm = tr.match(/rotate\(([-\d.]+)/); return mm ? +mm[1] : 0 }
          return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, k: r.width / 224, cur: { minute: ang('minute'), hour: ang('hour') }, want: { minute: (m * 6) % 360, hour: ((h % 12) * 30 + m * .5) % 360 } }
        })
        for (const [n, len] of [['minute', 72], ['hour', 44]]) {
          const at = a => [g.cx + Math.sin(a * Math.PI / 180) * len * g.k, g.cy - Math.cos(a * Math.PI / 180) * len * g.k]
          let a0 = g.cur[n], a1 = g.want[n]; let d = ((a1 - a0) % 360 + 540) % 360 - 180; if (Math.abs(d) < 1) d = 0
          await page.mouse.move(...at(a0)); await page.mouse.down()
          const steps = Math.max(8, Math.round(Math.abs(d) / 6))
          for (let i = 1; i <= steps; i++) { const e = i / steps, k = e < .5 ? 2 * e * e : 1 - (-2 * e + 2) ** 2 / 2; await page.mouse.move(...at(a0 + d * k)); await sleep(16) }
          await page.mouse.up(); mark('drag-' + n); await sleep(350)
        }
        await sleep(400); await tap(`return document.querySelector('.go')`); mark('right-set'); await sleep(1700)
      }
    },
  },

  'planet-parade': {
    url: '/games/planet-parade/index.html',
    storage: `localStorage.setItem('dg_planet-parade',JSON.stringify({unlocked:16,stars:${stars(9)},max:48}));`,
    async run(b) {
      const { page, tap, drag, mark, sleep } = b
      await sleep(1200); mark('map')
      await openLevel(b, 0); mark('level-name')
      for (let q = 0; q < 3; q++) { await page.waitForSelector('.choice[data-good]:not(:disabled)'); await sleep(1400); await tap(`return document.querySelector('.choice[data-good]:not(:disabled)')`); mark('right-name'); await sleep(2400) }
      await page.evaluate(() => __K.showMap()); await sleep(800)
      // put the planets in order from the Sun with real drags
      await openLevel(b, 2); mark('level-order'); await sleep(1500)
      for (let i = 0; i < 8; i++) {
        const ok = await page.evaluate(() => { document.querySelectorAll('[data-src],[data-dst]').forEach(e => { e.removeAttribute('data-src'); e.removeAttribute('data-dst') }); const slot = [...document.querySelectorAll('.slot')].find(s => s._s && !s._s.pre && !s.classList.contains('ok')); if (!slot) return false; const t = [...document.querySelectorAll('.tray .tile')].find(t => t._t.key === slot._s.key); if (!t) return false; t.setAttribute('data-src', 1); slot.setAttribute('data-dst', 1); return true })
        if (!ok) break; await drag('[data-src]', '[data-dst]'); mark('drag-order'); await sleep(500)
      }
      mark('done-order'); await sleep(2600)
      if (await page.evaluate(() => !!document.querySelector('.modal'))) { mark('win-order'); await sleep(1500) }
      await page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __K.showMap() }); await sleep(800)
      await openLevel(b, 9); mark('level-hot')
      for (let q = 0; q < 2; q++) { await page.waitForSelector('.choice[data-good]:not(:disabled)'); await sleep(1400); await tap(`return document.querySelector('.choice[data-good]:not(:disabled)')`); mark('right-hot'); await sleep(2400) }
    },
  },

  'spell-gaps': {
    url: '/games/spell-gaps/index.html',
    storage: `localStorage.setItem('dg_spell-gaps',JSON.stringify({unlocked:10,stars:${stars(6)},max:30}));`,
    async run(b) {
      const { page, tap, mark, sleep } = b
      await sleep(1200); mark('map')
      for (const [lv, label, words] of [[0, 'gap', 3], [6, 'two', 2], [8, 'listen', 2]]) {
        await openLevel(b, lv); mark('level-' + label)
        let done = 0, guard = 0, lastWord = ''
        while (done < words && guard++ < 80) {
          const st = await page.evaluate(() => { const cur = document.querySelector('.wrow .lt.cur'); return { cur: cur ? cur.textContent : null, word: [...document.querySelectorAll('.wrow .lt')].map(x => x.textContent).join('') } })
          if (st.cur) {
            if (st.word !== lastWord) { lastWord = st.word; await sleep(1400) } else await sleep(500)
            await tap(`const c=document.querySelector('.wrow .lt.cur');if(!c)return null;return [...document.querySelectorAll('.choices .choice.let')].find(x=>x.textContent===c.textContent&&!x.disabled&&!x.classList.contains('used'))`, null)
            mark('tap-' + label)
            const fin = await page.evaluate(() => !document.querySelector('.wrow .lt.cur'))
            if (fin) { done++; mark('word-' + label); await sleep(2600) }
          } else await sleep(250)
        }
        await page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __K.showMap() }); await sleep(900)
      }
    },
  },

  'where-is-kitty': {
    url: '/games/where-is-kitty/index.html',
    storage: `localStorage.setItem('dg_where-is-kitty',JSON.stringify({unlocked:7,stars:${stars(4)},max:21}));`,
    async run(b) {
      const { page, tap, drag, mark, sleep } = b
      await sleep(1200); mark('map')
      // move Kitty yourself: drag the cat in, on or by the box
      await openLevel(b, 1); mark('level-drag')
      for (let r = 0; r < 4; r++) {
        await page.waitForSelector('.zone'); await sleep(1500)
        const ok = await page.evaluate(() => { const t = (document.querySelector('.say-line') || {}).textContent || ''; const m = t.match(/cat (in|on|by) the box/); if (!m) return false; document.querySelectorAll('[data-src],[data-dst]').forEach(e => { e.removeAttribute('data-src'); e.removeAttribute('data-dst') }); document.querySelector('.scene .actor').setAttribute('data-src', 1); document.querySelector(`.zone[data-k="${m[1]}"]`).setAttribute('data-dst', 1); return true })
        if (!ok) { await sleep(400); continue }
        await drag('[data-src]', '[data-dst]'); mark('right-drag'); await sleep(2600)
      }
      await page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __K.showMap() }); await sleep(900)
      // watch Kitty and pick the word, then fill-the-gap sentences
      for (const [lv, label] of [[4, 'watch'], [5, 'sent']]) {
        await openLevel(b, lv); mark('level-' + label)
        for (let q = 0; q < 3; q++) {
          await page.waitForSelector('.choices .choice.wordc:not(:disabled)'); await sleep(lv === 4 ? 2200 : 1600)
          await tap(`const s=document.querySelector('#app .say-line, .say-line');const html=s.innerHTML;
            let w=Object.keys(P).find(k=>P[k].q&&blankHTML(P[k].q)===html);
            if(!w){const it=SENT.find(x=>blankHTML(x[0])===html);if(it)w=it[1];}
            return [...document.querySelectorAll('.choices .choice.wordc')].find(x=>x.textContent===w&&!x.disabled)`)
          mark('right-' + label); await sleep(2600)
        }
        await page.evaluate(() => { document.querySelectorAll('.modal').forEach(m => m.remove()); __K.showMap() }); await sleep(900)
      }
    },
  },
}
