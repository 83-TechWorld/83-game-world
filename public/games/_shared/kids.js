/* Kids Games 4u shared kids library: shell (level map, HUD, results), sounds, speech, drag/tap placement, confetti. */
(function(){
'use strict';
const h=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;};
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]];}return a;};
const sample=(a,n)=>shuffle(a).slice(0,n);
const pick=a=>a[Math.random()*a.length|0];
let AC=null,muted=false;try{muted=localStorage.getItem('dg_muted')==='1';}catch(e){}
function audio(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}if(AC&&AC.state==='suspended')try{AC.resume();}catch(e){}}
function tone(f,d,type,v,delay,f2){if(muted||!AC)return;try{const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(v||.12,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+d);}catch(e){}}
const sfx={pop:()=>tone(520,.12,'sine',.12,0,900),ok:()=>{tone(660,.12,'triangle',.14);tone(880,.18,'triangle',.14,.1);},bad:()=>tone(240,.25,'sawtooth',.06,0,140),cheer:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,.22,'triangle',.12,i*.09)),star:()=>tone(900,.15,'sine',.12,0,1500),whoosh:()=>tone(300,.3,'sine',.08,0,900),tick:()=>tone(1000,.04,'square',.04)};
function speakText(t){t=String(t);
 t=t.replace(/(\d{1,2}):(\d{2}):(\d{2})/g,(a,h,m,sec)=>`${+h} ${+m===0?"o'clock":+m<10?'oh '+(+m):+m} and ${+sec} seconds`);
 t=t.replace(/(\d{1,2}):(\d{2})/g,(a,h,m)=>`${+h} ${+m===0?"o'clock":+m<10?'oh '+(+m):+m}`);
 t=t.replace(/(^|[\s(])-(\d)/g,'$1minus $2').replace(/°C/g,' degrees Celsius').replace(/\bkm\b/g,'kilometers');
 return t.replace(/[^\w\s!?.,']/g,' ');}
function say(t,rate,cb){let fired=false;const fin=()=>{if(!fired){fired=true;if(cb)cb();}};t=speakText(t);
 if(muted){if(cb)setTimeout(fin,1400);return;}
 try{const s=window.speechSynthesis;if(!s){if(cb)setTimeout(fin,1800);return;}s.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=rate||.9;u.pitch=1.15;u.lang='en-US';
  if(cb){const t0=Date.now(),minMs=Math.min(t.length*40,9000),early=()=>{const w=minMs-(Date.now()-t0);if(w>0)setTimeout(fin,w);else fin();};u.onend=early;u.onerror=early;setTimeout(fin,Math.max(2500,t.length*95)+3500);}s.speak(u);}catch(e){if(cb)setTimeout(fin,1800);}}
const PRAISE=['Awesome!','Great job!','You rock!','Brilliant!','Super smart!','Well done!','Fantastic!','Wow, amazing!','Perfect!','You are a star!'];
const TRY=['Oops! Try again!','Almost! You can do it!','Not that one, try again!','Keep going, you are close!','Nice try! Once more!'];
// ---------- confetti ----------
let fx=null,fxc=null,parts=[],fxOn=false;
function confetti(n,x,y){if(!fx){fx=h('canvas');fx.id='fx';document.body.appendChild(fx);fxc=fx.getContext('2d');}
  fx.width=innerWidth;fx.height=innerHeight;const cols=['#ff5a6a','#ffd23b','#3ec6ff','#7dff5a','#b46bff','#ff9a3a'];
  for(let i=0;i<(n||90);i++){const a=Math.random()*Math.PI*2,s=3+Math.random()*9;parts.push({x:x==null?innerWidth/2:x,y:y==null?innerHeight*.35:y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-5,r:4+Math.random()*6,c:pick(cols),rot:Math.random()*6,vr:Math.random()*.4-.2,l:90+Math.random()*50});}
  if(!fxOn){fxOn=true;requestAnimationFrame(fxLoop);}}
function fxLoop(){fxc.clearRect(0,0,fx.width,fx.height);for(const p of parts){p.vy+=.28;p.x+=p.vx;p.y+=p.vy;p.vx*=.99;p.rot+=p.vr;p.l--;fxc.save();fxc.translate(p.x,p.y);fxc.rotate(p.rot);fxc.fillStyle=p.c;fxc.globalAlpha=Math.min(1,p.l/30);fxc.fillRect(-p.r,-p.r/2,p.r*2,p.r);fxc.restore();}
  parts=parts.filter(p=>p.l>0&&p.y<fx.height+20);if(parts.length)requestAnimationFrame(fxLoop);else{fxOn=false;fxc.clearRect(0,0,fx.width,fx.height);}}
// ---------- drag + tap ----------
function drag(el,o){el.style.touchAction='none';
  el.addEventListener('pointerdown',e=>{if(e.button>0)return;audio();e.preventDefault();const sx=e.clientX,sy=e.clientY;let moved=false;try{el.setPointerCapture(e.pointerId);}catch(_){}
    const move=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;if(!moved&&Math.hypot(dx,dy)>8){moved=true;el.classList.add('dragging');el.style.transition='none';}
      if(moved){el.style.transform=`translate(${dx}px,${dy}px) scale(1.12)`;const t=hit(ev);for(const s of o.targets())s.classList.toggle('hot',s===t);}};
    const hit=ev=>{for(const t of o.targets()){const r=t.getBoundingClientRect();if(ev.clientX>=r.left-6&&ev.clientX<=r.right+6&&ev.clientY>=r.top-6&&ev.clientY<=r.bottom+6)return t;}return null;};
    const up=ev=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',up);el.removeEventListener('pointercancel',up);try{el.releasePointerCapture(e.pointerId);}catch(_){}
      el.classList.remove('dragging');for(const s of o.targets())s.classList.remove('hot');
      if(!moved){el.style.transform='';if(o.onTap)o.onTap(el);return;}
      const t=hit(ev),ok=t&&o.onDrop(el,t);
      if(!ok&&el.isConnected){el.style.transition='transform .28s cubic-bezier(.3,1.6,.5,1)';el.style.transform='';}};
    el.addEventListener('pointermove',move);el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);});}
// ---------- placement: tiles -> slots (drag or tap) ----------
function placement(box,o){box.innerHTML='';const row=h('div','slots'),tray=h('div','tray');if(o.cell){box.style.setProperty('--cell',o.cell+'px');box.style.setProperty('--fs',(o.fs||Math.round(o.cell*.5))+'px');}
  const slotEls=o.slots.map((s,i)=>{const e=h('div','slot'+(s.pre?' pre':''),s.pre?(s.html!=null?s.html:s.key):(s.ph||''));e.dataset.i=i;e._s=s;row.appendChild(e);return e;});
  let remaining=o.multi?o.tiles.length:o.slots.filter(s=>!s.pre).length,selected=null,done=false;
  function place(tileEl,slotEl){const t=tileEl._t,s=slotEl._s;if(!o.multi&&slotEl.classList.contains('ok'))return false;
    const good=o.accepts?o.accepts(t,s):t.key===s.key;
    if(good){tileEl.remove();selected=null;remaining--;sfx.ok();
      if(o.multi){slotEl._n=(slotEl._n||0)+1;slotEl.classList.add('ok');const c=slotEl.querySelector('.cnt')||slotEl.appendChild(h('div','cnt'));c.innerHTML=(c.innerHTML||'')+t.html;slotEl.classList.remove('ok');void slotEl.offsetWidth;slotEl.classList.add('ok');}
      else{slotEl.classList.add('ok');slotEl.innerHTML=t.html;}
      if(o.onCorrect)o.onCorrect(t,s,slotEl);if(!remaining&&!done){done=true;setTimeout(()=>o.onDone&&o.onDone(),380);}return true;}
    slotEl.classList.remove('shake');tileEl.classList.remove('shake');void tileEl.offsetWidth;slotEl.classList.add('shake');tileEl.classList.add('shake');sfx.bad();if(tileEl===selected){tileEl.classList.remove('sel');selected=null;}
    if(o.onWrong)o.onWrong(t,s);return false;}
  const tiles=shuffle(o.tiles).map(t=>{const e=h('div','tile',t.html);e._t=t;tray.appendChild(e);
    drag(e,{targets:()=>slotEls,onDrop:place,onTap:el=>{if(selected===el){el.classList.remove('sel');selected=null;return;}if(selected)selected.classList.remove('sel');selected=el;el.classList.add('sel');sfx.pop();if(o.onPick)o.onPick(t);}});return e;});
  slotEls.forEach(se=>se.addEventListener('click',()=>{if(selected&&selected.isConnected)place(selected,se);}));
  box.appendChild(row);box.appendChild(tray);
  return{slotEls,tray,tiles,get remaining(){return remaining;},
    solve(){for(const se of slotEls){if(!o.multi&&se.classList.contains('ok')||se._s.pre)continue;const te=[...tray.children].find(te=>(o.accepts?o.accepts(te._t,se._s):te._t.key===se._s.key));if(te)place(te,se);}
      if(o.multi)for(const te of [...tray.children]){const se=slotEls.find(se=>o.accepts(te._t,se._s));if(se)place(te,se);}}};}
// ---------- shell ----------
function load(id){try{return JSON.parse(localStorage.getItem('dg_'+id)||'null');}catch(e){return null;}}
function start(cfg){
  const save=Object.assign({unlocked:1,stars:{}},load(cfg.id)||{});save.max=cfg.levels.length*3;
  const persist=()=>{try{localStorage.setItem('dg_'+cfg.id,JSON.stringify({unlocked:save.unlocked,stars:save.stars,max:save.max}));}catch(e){}};
  const app=document.getElementById('app'),bg=h('div');bg.id='bg';app.appendChild(bg);
  const header=h('header','',`<a class="back" href="/index.html">← KIDS GAMES 4U</a><h1 class="ttl">${cfg.emoji} ${cfg.title}</h1><div class="chip" id="tot">⭐ 0</div><button class="snd" id="snd">${muted?'🔇':'🔊'}</button>`);app.appendChild(header);
  const main=h('main');app.appendChild(main);
  const coach=h('div','coach','<div class="owl">🦉</div><div class="bub"></div>');document.body.appendChild(coach);
  let coachT=null;function coachSay(t,speak,cb){const b=coach.querySelector('.bub');b.textContent=t;b.classList.add('show');clearTimeout(coachT);coachT=setTimeout(()=>b.classList.remove('show'),cb?6000:2600);if(speak!==false)say(t,undefined,cb);else if(cb)setTimeout(cb,1200);}
  header.querySelector('#snd').onclick=e=>{muted=!muted;try{localStorage.setItem('dg_muted',muted?'1':'0');}catch(_){}e.target.textContent=muted?'🔇':'🔊';if(muted)try{speechSynthesis.cancel();}catch(_){}audio();sfx.pop();};
  const totalStars=()=>Object.values(save.stars).reduce((a,b)=>a+b,0);
  const refreshTot=()=>{header.querySelector('#tot').textContent='⭐ '+totalStars()+' / '+save.max;};
  let timerId=null;const stopTimer=()=>{clearInterval(timerId);timerId=null;};
  function setWorld(w){const W=(cfg.worlds||{})[w]||{bg:['#bfe9ff','#7cc6ff'],deco:['⭐','☁️']};document.documentElement.style.setProperty('--c1',W.bg[0]);document.documentElement.style.setProperty('--c2',W.bg[1]);
    bg.innerHTML='';for(let i=0;i<14;i++){const s=h('span','',W.deco[i%W.deco.length]);s.style.left=(Math.random()*95)+'%';s.style.top=(8+Math.random()*80)+'%';s.style.fontSize=(30+Math.random()*34)+'px';s.style.animationDelay=(-Math.random()*8)+'s';s.style.animationDuration=(6+Math.random()*6)+'s';bg.appendChild(s);}}
  function showMap(){stopTimer();main.innerHTML='';refreshTot();const first=cfg.levels[0].world;setWorld(first);
    const worlds=[];cfg.levels.forEach((L,i)=>{let w=worlds.find(x=>x.k===L.world);if(!w){w={k:L.world,items:[]};worlds.push(w);}w.items.push(i);});
    const wrap=h('div','map');main.appendChild(wrap);
    for(const w of worlds){const W=(cfg.worlds||{})[w.k]||{label:w.k,deco:['⭐']};const box=h('div','world',`<h2>${W.deco[0]} ${W.label}</h2>`),lvls=h('div','lvls');
      for(const i of w.items){const L=cfg.levels[i],unlocked=i<save.unlocked,s=save.stars[i]||0,b=h('button','lv'+(i===save.unlocked-1&&!s?' next':''),`<b>${unlocked?i+1:'🔒'}</b><small>${L.name}</small><span class="st">${'⭐'.repeat(s)}${'☆'.repeat(unlocked?3-s:0)}</span>`);b.disabled=!unlocked;b.onclick=()=>{audio();sfx.whoosh();play(i);};lvls.appendChild(b);}
      box.appendChild(lvls);wrap.appendChild(box);}
    const ad=document.getElementById('about-data');if(ad){try{const d=JSON.parse(ad.textContent);main.appendChild(h('section','about-game',`<h2>About ${d.name}: a free game for kids ${d.ages}</h2><p>${d.intro}</p>${d.skills&&d.skills.length?`<h3>What kids learn</h3><ul>${d.skills.map(x=>`<li>${x}</li>`).join('')}</ul>`:''}<h3>How to play</h3><p>${d.how}</p><h3>More free games</h3><p>${d.related.map(r=>`<a href="${r.url}">${r.name}</a>`).join(' &middot; ')} &middot; <a href="/">All Kids Games 4u games</a></p>`));}catch(e){}}
    const nxt=Math.min(save.unlocked,cfg.levels.length);coachSay(save.unlocked>1?'Welcome back! Ready for level '+nxt+'?':'Hi! Let us start with level 1!');}
  function play(i){stopTimer();const L=cfg.levels[i];main.innerHTML='';setWorld(L.world);let mistakes=0,over=false;
    const hud=h('div','hud',`<span class="lt">${i+1}. ${L.name}</span><div class="prog"><i></i></div><span class="tm" style="display:none"></span><button>🗺 Levels</button>`);
    const stage=h('div','stage');main.appendChild(hud);main.appendChild(stage);hud.querySelector('button').onclick=()=>{sfx.pop();showMap();};
    const api={level:L,index:i,stage,mistakes:()=>mistakes,coach:coachSay,sfx,say,confetti,
      bad(msg){mistakes++;coachSay(msg||pick(TRY));},
      progress(d,t){hud.querySelector('.prog i').style.width=Math.round(100*d/t)+'%';},
      timer(sec,onEnd){const el=hud.querySelector('.tm');el.style.display='';let left=sec;const draw=()=>{el.textContent='⏱ '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');el.classList.toggle('low',left<=15);};draw();stopTimer();
        timerId=setInterval(()=>{if(over)return stopTimer();left--;if(left<=15&&left>0)sfx.tick();draw();if(left<=0){stopTimer();api.lose(onEnd);}},1000);},
      win(stars){if(over)return;over=true;stopTimer();const s=stars||(mistakes===0?3:mistakes<=3?2:1);if(s>(save.stars[i]||0))save.stars[i]=s;if(i+2>save.unlocked)save.unlocked=Math.min(cfg.levels.length,i+2);persist();refreshTot();
        const last=i===cfg.levels.length-1;sfx.cheer();confetti(last?260:140);const pr=pick(PRAISE);say(pr+(last?' You finished every level!':''));
        const m=h('div','modal',`<div class="card"><h1>${last?'🏆 All Done!':pr}</h1><p>${s===3?'Perfect! Three stars!':s===2?'Great work! Try for three stars!':'You did it! Try again for more stars!'}</p><div class="stars">${[1,2,3].map(k=>`<span data-k="${k}">⭐</span>`).join('')}</div><div class="btns"></div></div>`);
        const bt=m.querySelector('.btns');const mk=(t,c,f)=>{const b=h('button','btn '+c,t);b.onclick=()=>{m.remove();f();};bt.appendChild(b);};
        if(!last)mk('▶ Next','pri',()=>play(i+1));mk('🔁 Again','',()=>play(i));mk('🗺 Levels','',showMap);document.body.appendChild(m);
        m.querySelectorAll('.stars span').forEach((sp,k)=>{if(k<s)setTimeout(()=>{sp.classList.add('on');sfx.star();},350+k*380);});},
      lose(msg){if(over)return;over=true;stopTimer();sfx.bad();const m=h('div','modal',`<div class="card"><h1>⏰ Oh no!</h1><p>${typeof msg==='string'?msg:'Time is up!'} Do not worry, practice makes you stronger! 💪</p><div class="btns"></div></div>`);const bt=m.querySelector('.btns');
        const a=h('button','btn pri','🔁 Try again');a.onclick=()=>{m.remove();play(i);};const b=h('button','btn','🗺 Levels');b.onclick=()=>{m.remove();showMap();};bt.appendChild(a);bt.appendChild(b);document.body.appendChild(m);say('Do not worry. Try again!');}};
    window.__K={api,cfg,save,play,showMap};
    cfg.build(L,api,stage,i);}
  window.__K={cfg,save,play,showMap};
  showMap();
}
window.K={h,shuffle,sample,pick,sfx,say,confetti,drag,placement,start,audio,PRAISE,TRY};
})();
