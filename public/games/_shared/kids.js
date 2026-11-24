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
// soft, cute sounds: rounded sine/triangle tones only (no buzzy sawtooth/square)
const sfx={pop:()=>tone(560,.11,'sine',.11,0,880),ok:()=>{tone(784,.14,'triangle',.12);tone(1175,.22,'sine',.11,.1);},bad:()=>{tone(392,.16,'triangle',.08,0,330);tone(311,.24,'triangle',.08,.15,262);},cheer:()=>[523,659,784,1046,1318].forEach((f,i)=>tone(f,.22,'triangle',.11,i*.09)),star:()=>tone(988,.16,'sine',.11,0,1568),whoosh:()=>tone(300,.3,'sine',.07,0,900),tick:()=>tone(1320,.05,'sine',.05)};
// ---------- voice ----------
// One voice for every game: a clear Indian-English voice (female first), the same voice from the first line to the last,
// and helpers that light up each word/letter on screen exactly while it is being spoken.
const RATE=.9,PITCH=1.08; // a little higher pitch = friendly, cute voice for kids
// macOS gives Chrome many novelty/"Eloquence" voices (Eddy, Flo, Grandma, Reed...) that sound robotic: never use them
const BAD_VOICE=/novelty|bad news|good news|whisper|bells|boing|bubbles|cellos|zarvox|trinoids|organ|jester|albert|fred|junior|kathy|ralph|wobble|bahh|superstar|eddy|\bflo\b|grandma|grandpa|\breed\b|rocko|sandy|shelley/i;
function scoreVoice(v){const n=v.name||'',l=(v.lang||'').replace('_','-').toLowerCase();if(BAD_VOICE.test(n))return -1;let s=0;
 if(l==='en-in')s+=100;else if(/^en-(gb|au|za|nz|ie)/.test(l))s+=40;else if(l.startsWith('en'))s+=20;else return -1;
 // always a girl's voice when one exists: female names win over everything else (Indian-English first)
 if(/neerja|tara|isha|sangeeta|veena|heera|swara|lekha|priya|female|samantha|karen|moira|tessa|serena|kate|fiona|victoria|zira|susan|hazel|libby|sonia|aria|jenny|emma/i.test(n))s+=80;
 else if(/rishi|aman|ravi|prabhat|prakash|daniel|alex|tom\b|david|mark|george|guy|ryan|arthur|oliver|\bmale/i.test(n))s-=40;
 if(/natural|neural|premium|enhanced|online/i.test(n))s+=25; // Edge "Natural" and macOS premium voices sound the most human
 if(/^google/i.test(n)&&l!=='en-in')s-=15; // Chrome's online Google voices stop mid-sentence on long lines
 if(v.localService)s+=6;return s;}
let VOICE=null,VSCORE=0,voicesReady=false;
function refreshVoice(){let vs=[];try{vs=window.speechSynthesis.getVoices()||[];}catch(e){}if(!vs.length)return;voicesReady=true;
 for(const v of vs){const s=scoreVoice(v);if(s>VSCORE||(VOICE&&v.voiceURI===VOICE.voiceURI)&&s>=VSCORE){VSCORE=s;VOICE=v;}}}
try{if(window.speechSynthesis){refreshVoice();window.speechSynthesis.addEventListener('voiceschanged',refreshVoice);}}catch(e){}
// Chrome fills the voice list a moment after page load: wait for it so the first line is not spoken by a random default voice
function whenVoices(f){if(voicesReady||!window.speechSynthesis)return f();let done=false;const go=()=>{if(done)return;done=true;clearInterval(iv);refreshVoice();f();};
 const iv=setInterval(()=>{refreshVoice();if(voicesReady)go();},100);setTimeout(go,1500);}
// iOS/Safari only allow speech after a tap: speak a silent word on the first tap to unlock it
try{document.addEventListener('pointerdown',function unlock(){document.removeEventListener('pointerdown',unlock,true);try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;window.speechSynthesis.speak(u);}catch(e){}},true);}catch(e){}
function speakText(t){t=String(t);
 t=t.replace(/(\d{1,2}):(\d{2}):(\d{2})/g,(a,h,m,sec)=>`${+h} ${+m===0?"o'clock":+m<10?'oh '+(+m):+m} and ${+sec} seconds`);
 t=t.replace(/(\d{1,2}):(\d{2})/g,(a,h,m)=>`${+h} ${+m===0?"o'clock":+m<10?'oh '+(+m):+m}`);
 t=t.replace(/(^|[\s(])-(\d)/g,'$1minus $2').replace(/°C/g,' degrees Celsius').replace(/\bkm\b/g,'kilometers');
 return t.replace(/[^\w\s!?.,']/g,' ').replace(/\s+/g,' ').trim();}
let sayTok=0;const KEEP=[];
function clearLit(){document.querySelectorAll('.lit').forEach(e=>e.classList.remove('lit'));}
let BUSY=0;
function stopVoice(){sayTok++;BUSY=0;clearLit();try{window.speechSynthesis&&window.speechSynthesis.cancel();}catch(e){}try{if(typeof AU!=='undefined'&&AU&&CUR){AU.onended=AU.onerror=null;AU.pause();CUR=false;}}catch(e){}}
// speak one short piece; done(ok) is called once. onWord(charIndex) follows the voice; onTimeline(ms) is the fallback when the browser gives no word events
function ttsOne(text,o,tok,done){let fin=false,fb=0,gotB=false;const est=Math.max(600,text.length*72/(o.rate||RATE))+250;
 const end=ok=>{if(fin)return;fin=true;clearTimeout(fb);done(ok);};
 if(muted||!window.speechSynthesis||!text){if(o.onTimeline)o.onTimeline(est);fb=setTimeout(()=>end(true),text?est:50);return;}
 const s=window.speechSynthesis,u=new SpeechSynthesisUtterance(text);
 if(VOICE){u.voice=VOICE;u.lang=VOICE.lang;}else u.lang='en-IN';u.rate=o.rate||RATE;u.pitch=PITCH;u.volume=1;
 u.onstart=()=>{if(o.onTimeline)setTimeout(()=>{if(!gotB&&!fin&&tok===sayTok)o.onTimeline(est-300);},300);};
 u.onboundary=e=>{if(tok!==sayTok||(e.name&&e.name!=='word'))return;gotB=true;if(o.onWord)o.onWord(e.charIndex);};
 u.onend=()=>end(true);u.onerror=e=>end(!(e&&/interrupted|canceled/.test(e.error)));
 KEEP.push(u);if(KEEP.length>6)KEEP.shift(); // keep references: Chrome can garbage-collect a speaking utterance and never fire onend
 try{if(s.paused)s.resume();s.speak(u);}catch(e){end(true);return;}
 fb=setTimeout(()=>end(true),est*2+3000);}
// ---------- recorded voice: Kokoro af_heart clips in /voice/c, listed per game in /voice/<game>.json ----------
// A line is played from one recorded clip, or joined from recorded pieces (lines built at run time, like "Tap the" + "tiger").
// Anything never recorded (such as a name a child typed) falls back to the device voice.
const GAME_ID=(location.pathname.match(/\/games\/([^/]+)/)||[])[1];
let VMAN=null,VDONE=!GAME_ID;const VWAIT=[];const vReady=()=>{VDONE=true;VWAIT.splice(0).forEach(f=>f());};
try{if(GAME_ID)fetch('/voice/'+GAME_ID+'.json').then(r=>r.ok?r.json():null).then(a=>{if(Array.isArray(a))VMAN=new Set(a);vReady();}).catch(vReady);}catch(e){VDONE=true;}
// the first line can come before the list has loaded: wait for it a little
function whenManifest(f){if(VDONE)return f();VWAIT.push(f);setTimeout(()=>{const i=VWAIT.indexOf(f);if(i>=0){VWAIT.splice(i,1);f();}},1500);}
const vKey=t=>String(t).toLowerCase().replace(/[^a-z0-9']+/g,' ').split(' ').map(w=>w.replace(/^'+|'+$/g,'')).filter(Boolean).join(' ');
function voiceId(k){let h=0x811c9dc5;for(let i=0;i<k.length;i++){h^=k.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(36);}
const clipUrl=k=>'/voice/c/'+voiceId(k)+'.mp3';
// split a line into the longest recorded pieces; at = where each piece starts in the text (for word highlighting)
function pieces(text){const words=[],re=/\S+/g;let m;while((m=re.exec(text))){for(const w of vKey(m[0]).split(' '))if(w)words.push({w,at:m.index,end:m.index+m[0].length});}
 const out=[];let i=0;while(i<words.length){let j=words.length,hit=null;for(;j>i;j--){const k=words.slice(i,j).map(x=>x.w).join(' ');if(VMAN.has(k)){hit=k;break;}}
  if(hit){out.push({k:hit,at:words[i].at});i=j;}else{const last=out[out.length-1];if(last&&!last.k){last.text+=' '+words[i].w;}else out.push({text:words[i].w,at:words[i].at});i++;}}
 return out;}
const AU=typeof Audio!=='undefined'?new Audio():null;let CUR=false;
// iOS only lets an audio element play after a tap: start it silently on the first tap so later lines can play
try{document.addEventListener('pointerdown',function un(){document.removeEventListener('pointerdown',un,true);if(!AU||CUR)return;AU.muted=true;AU.src=clipUrl('great job');const p=AU.play();if(p&&p.then)p.then(()=>{AU.pause();AU.muted=false;}).catch(()=>{AU.muted=false;});else AU.muted=false;},true);}catch(e){}
function speakOne(text,o,tok,done){
 if(muted||!text||!VMAN||!AU)return ttsOne(text,o,tok,done);
 const segs=pieces(text);if(!segs.some(s=>s.k))return ttsOne(text,o,tok,done);
 let fin=false,i=0;const rate=(o.rate||RATE)/RATE,end=ok=>{if(fin)return;fin=true;clearTimeout(guard);CUR=false;done(ok);};
 const guard=setTimeout(()=>end(true),Math.max(600,text.length*90/rate)*2+4000);
 segs.forEach(s=>{if(s.k)try{fetch(clipUrl(s.k));}catch(e){}}); // warm the cache so pieces join without gaps
 const next=()=>{if(fin||tok!==sayTok)return;if(i>=segs.length)return end(true);const s=segs[i++];if(o.onWord)o.onWord(s.at);
  if(!s.k)return ttsOne(s.text,o,tok,()=>next());
  // a clip ends on 'ended', or by a timer from its length in case the browser never sends 'ended'
  let over=false,cg=0;const clipDone=()=>{if(over)return;over=true;clearTimeout(cg);AU.onended=AU.onerror=AU.onloadedmetadata=null;if(!fin&&tok===sayTok)setTimeout(next,segs.length>1?40:0);};
  CUR=true;AU.onended=clipDone;AU.onerror=()=>{if(over)return;over=true;clearTimeout(cg);AU.onended=AU.onerror=AU.onloadedmetadata=null;ttsOne(s.text||s.k,o,tok,()=>next());};
  AU.onloadedmetadata=()=>{if(!isFinite(AU.duration))return;const ms=AU.duration*1000/rate;cg=setTimeout(clipDone,ms+450);if(segs.length===1&&o.onTimeline)o.onTimeline(ms);};
  AU.src=clipUrl(s.k);AU.playbackRate=rate;try{AU.preservesPitch=true;}catch(e){}
  const p=AU.play();if(p&&p.catch)p.catch(()=>{if(!fin&&tok===sayTok){AU.onended=AU.onerror=null;ttsOne(s.k,o,tok,()=>next());}});};
 next();}
// start a new voice job: stops whatever is speaking. The callback runs when the job finishes, but not if a newer line replaced it.
function job(run,cb){stopVoice();const tok=sayTok;BUSY=tok;const fin=()=>{if(tok===sayTok){BUSY=0;clearLit();if(cb)cb();}};
 // Chrome drops a speak() fired right after cancel(), so wait a moment
 setTimeout(()=>{if(tok!==sayTok)return;whenManifest(()=>whenVoices(()=>{if(tok===sayTok)run(tok,fin);}));},120);}
const chunks=t=>(t.match(/[^.!?]+[.!?]*\s*/g)||[t]).map(x=>x.trim()).filter(Boolean);
// steps: [{t:'text', el:element lit while it is spoken, rate, gap:ms pause after}]
function runSteps(steps,tok,fin){let i=0;const next=()=>{if(tok!==sayTok)return;if(i>=steps.length)return fin();const st=steps[i++];clearLit();if(st.el)st.el.classList.add('lit');
  speakOne(speakText(st.t),{rate:st.rate},tok,ok=>{if(tok!==sayTok)return;if(st.el)st.el.classList.remove('lit');if(!ok)return fin();setTimeout(next,st.gap!=null?st.gap:90);});};next();}
// true while a line is still being spoken
const speaking=()=>BUSY!==0&&BUSY===sayTok;
// run fn after at least ms, and never while the voice is still talking (so the game does not move on mid-sentence)
function after(fn,ms){const t0=Date.now();const chk=()=>{if(speaking()&&Date.now()-t0<12000)return setTimeout(chk,100);fn();};setTimeout(()=>{if(speaking()){const w=()=>{if(speaking()&&Date.now()-t0<12000)return setTimeout(w,100);setTimeout(fn,250);};w();}else fn();},ms||0);}
// plain speech (long text is spoken sentence by sentence so Chrome never cuts it off)
function say(t,rate,cb){job((tok,fin)=>runSteps(chunks(String(t)).map(c=>({t:c,rate,gap:60})),tok,fin),cb);}
// speak a list of steps in order, lighting up each step's element while it is spoken (e.g. spelling letter by letter)
function saySeq(steps,cb){job((tok,fin)=>runSteps(steps,tok,fin),cb);}
// show text in el and light up each word as it is spoken. o.key: word to colour; o.hide: word to show as 🔊 (so the answer is not written)
function sayLine(el,text,o,cb){o=o||{};const t=speakText(text),parts=[];el.innerHTML='';const re=/\S+/g;let m;
 while((m=re.exec(t))){const raw=m[0],w=raw.toLowerCase().replace(/[^a-z']/g,'');const s=h('span','w'+(o.key&&w===o.key?' kw':''));s.textContent=o.hide&&w===o.hide?'🔊':raw;el.appendChild(s);el.appendChild(document.createTextNode(' '));parts.push({s,at:m.index});}
 const timers=[];const lit=ci=>{let cur=null;for(const p of parts)if(p.at<=ci)cur=p;parts.forEach(p=>p.s.classList.toggle('lit',p===cur));};
 job((tok,fin)=>speakOne(t,{rate:o.rate,onWord:lit,onTimeline:ms=>parts.forEach(p=>timers.push(setTimeout(()=>{if(tok===sayTok)lit(p.at);},ms*p.at/t.length)))},tok,()=>{timers.forEach(clearTimeout);parts.forEach(p=>p.s.classList.remove('lit'));fin();}),cb);}
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
  const guide=document.getElementById('game-guide');
  const coach=h('div','coach','<div class="owl">🦉</div><div class="bub"></div>');document.body.appendChild(coach);
  let coachT=null;function coachSay(t,speak,cb){const b=coach.querySelector('.bub');b.textContent=t;b.classList.add('show');clearTimeout(coachT);coachT=setTimeout(()=>b.classList.remove('show'),cb?6000:2600);if(speak!==false)say(t,undefined,cb);else if(cb)setTimeout(cb,1200);}
  header.querySelector('#snd').onclick=e=>{muted=!muted;try{localStorage.setItem('dg_muted',muted?'1':'0');}catch(_){}e.target.textContent=muted?'🔇':'🔊';if(muted)stopVoice();audio();sfx.pop();};
  const totalStars=()=>Object.values(save.stars).reduce((a,b)=>a+b,0);
  const refreshTot=()=>{header.querySelector('#tot').textContent='⭐ '+totalStars()+' / '+save.max;};
  let timerId=null;const stopTimer=()=>{clearInterval(timerId);timerId=null;};
  function setWorld(w){const W=(cfg.worlds||{})[w]||{bg:['#bfe9ff','#7cc6ff'],deco:['⭐','☁️']};document.documentElement.style.setProperty('--c1',W.bg[0]);document.documentElement.style.setProperty('--c2',W.bg[1]);
    bg.innerHTML='';for(let i=0;i<14;i++){const s=h('span','',W.deco[i%W.deco.length]);s.style.left=(Math.random()*95)+'%';s.style.top=(8+Math.random()*80)+'%';s.style.fontSize=(30+Math.random()*34)+'px';s.style.animationDelay=(-Math.random()*8)+'s';s.style.animationDuration=(6+Math.random()*6)+'s';bg.appendChild(s);}}
  function showMap(){window.GNav&&GNav.leave();document.querySelectorAll(".modal").forEach(x=>x.remove());stopTimer();main.innerHTML='';refreshTot();const first=cfg.levels[0].world;setWorld(first);
    const worlds=[];cfg.levels.forEach((L,i)=>{let w=worlds.find(x=>x.k===L.world);if(!w){w={k:L.world,items:[]};worlds.push(w);}w.items.push(i);});
    const wrap=h('div','map');main.appendChild(wrap);
    for(const w of worlds){const W=(cfg.worlds||{})[w.k]||{label:w.k,deco:['⭐']};const box=h('div','world',`<h2>${W.deco[0]} ${W.label}</h2>`),lvls=h('div','lvls');
      for(const i of w.items){const L=cfg.levels[i],unlocked=i<save.unlocked,s=save.stars[i]||0,b=h('button','lv'+(i===save.unlocked-1&&!s?' next':''),`<b>${unlocked?i+1:'🔒'}</b><small>${L.name}</small><span class="st">${'⭐'.repeat(s)}${'☆'.repeat(unlocked?3-s:0)}</span>`);b.disabled=!unlocked;b.onclick=()=>{audio();sfx.whoosh();play(i);};lvls.appendChild(b);}
      box.appendChild(lvls);wrap.appendChild(box);}
    if(cfg.onMap)try{cfg.onMap(main,save,wrap);}catch(e){} // game-specific extras on the level map (e.g. badge shelf)
    if(guide){guide.hidden=false;main.appendChild(guide);}
    const nxt=Math.min(save.unlocked,cfg.levels.length);coachSay(save.unlocked>1?'Welcome back! Ready for level '+nxt+'?':'Hi! Let us start with level 1!');}
  function play(i){window.GNav&&GNav.enter(()=>showMap());stopTimer();const L=cfg.levels[i];main.innerHTML='';setWorld(L.world);let mistakes=0,over=false;
    const hud=h('div','hud',`<span class="lt">${i+1}. ${L.name}</span><div class="prog"><i></i></div><span class="tm" style="display:none"></span><button>🗺 Levels</button>`);
    const stage=h('div','stage');main.appendChild(hud);main.appendChild(stage);hud.querySelector('button').onclick=()=>{sfx.pop();showMap();};
    const api={level:L,index:i,stage,mistakes:()=>mistakes,coach:coachSay,sfx,say,confetti,
      bad(msg){mistakes++;coachSay(msg||pick(TRY));},
      progress(d,t){hud.querySelector('.prog i').style.width=Math.round(100*d/t)+'%';},
      timer(sec,onEnd){const el=hud.querySelector('.tm');el.style.display='';let left=sec;const draw=()=>{el.textContent='⏱ '+Math.floor(left/60)+':'+String(left%60).padStart(2,'0');el.classList.toggle('low',left<=15);};draw();stopTimer();
        timerId=setInterval(()=>{if(over)return stopTimer();left--;if(left<=15&&left>0)sfx.tick();draw();if(left<=0){stopTimer();api.lose(onEnd);}},1000);},
      win(stars){if(over)return;over=true;stopTimer();after(()=>api._win(stars),0);},
      _win(stars){if(!main.contains(stage))return;const s=stars||(mistakes===0?3:mistakes<=3?2:1);if(s>(save.stars[i]||0))save.stars[i]=s;if(i+2>save.unlocked)save.unlocked=Math.min(cfg.levels.length,i+2);persist();refreshTot();
        const last=i===cfg.levels.length-1;sfx.cheer();confetti(last?260:140);const pr=pick(PRAISE);say(pr+(last?' You finished every level!':''));
        const m=h('div','modal',`<div class="card"><h1>${last?'🏆 All Done!':pr}</h1><p>${s===3?'Perfect! Three stars!':s===2?'Great work! Try for three stars!':'You did it! Try again for more stars!'}</p><div class="stars">${[1,2,3].map(k=>`<span data-k="${k}">⭐</span>`).join('')}</div><div class="btns"></div></div>`);
        const bt=m.querySelector('.btns');const mk=(t,c,f)=>{const b=h('button','btn '+c,t);b.onclick=()=>{m.remove();f();};bt.appendChild(b);};
        if(!last)mk('▶ Next','pri',()=>{const go=()=>play(i+1);window.KGAds?KGAds.levelBreak(go,{pause(){stopVoice();if(AC&&AC.suspend)AC.suspend();},resume:audio}):go();});mk('🔁 Again','',()=>play(i));mk('🗺 Levels','',showMap);document.body.appendChild(m);
        m.querySelectorAll('.stars span').forEach((sp,k)=>{if(k<s)setTimeout(()=>{sp.classList.add('on');sfx.star();},350+k*380);});},
      lose(msg){if(over)return;over=true;stopTimer();sfx.bad();const m=h('div','modal',`<div class="card"><h1>⏰ Oh no!</h1><p>${typeof msg==='string'?msg:'Time is up!'} Do not worry, practice makes you stronger! 💪</p><div class="btns"></div></div>`);const bt=m.querySelector('.btns');
        const a=h('button','btn pri','🔁 Try again');a.onclick=()=>{m.remove();play(i);};const b=h('button','btn','🗺 Levels');b.onclick=()=>{m.remove();showMap();};bt.appendChild(a);bt.appendChild(b);document.body.appendChild(m);say('Do not worry. Try again!');}};
    window.__K={api,cfg,save,play,showMap};
    cfg.build(L,api,stage,i);}
  window.__K={cfg,save,play,showMap};
  showMap();
}
window.K={h,shuffle,sample,pick,sfx,say,saySeq,sayLine,stopVoice,after,speaking,confetti,drag,placement,start,audio,PRAISE,TRY};
})();
