/* D-Games shared touch controls. Turns on-screen buttons into keyboard events and canvas touches into mouse events,
   so the existing desktop games work on phones/tablets without changing their game code. */
(function(){
  window.DTouch={init:function(cfg){
    var isTouch=(window.matchMedia&&matchMedia('(pointer:coarse)').matches)||'ontouchstart' in window||navigator.maxTouchPoints>0;
    if(!isTouch&&!(location.search.indexOf('touch=1')>=0))return;
    var cv=document.getElementById(cfg.canvas||'c'),menu=document.getElementById(cfg.menu||'menu');
    if(!cv)return;
    var st=document.createElement('style');
    st.textContent='#dt{position:fixed;inset:0;z-index:20;pointer-events:none;font-family:system-ui,sans-serif;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}'+
    '#dt .g{position:absolute;bottom:max(12px,env(safe-area-inset-bottom));display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap}'+
    '#dt .gl{left:max(12px,env(safe-area-inset-left))}#dt .gr{right:max(12px,env(safe-area-inset-right));justify-content:flex-end;max-width:46vw}'+
    '#dt button{pointer-events:auto;touch-action:none;width:62px;height:62px;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:rgba(10,20,30,.45);color:#fff;font-size:24px;font-weight:900;line-height:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:0;-webkit-tap-highlight-color:transparent;backdrop-filter:blur(2px)}'+
    '#dt button small{font-size:9px;letter-spacing:.5px;margin-top:2px;opacity:.9}#dt button.on{background:rgba(255,210,60,.65);transform:scale(.93)}#dt button.big{width:92px;height:92px;font-size:34px}'+
    '#dt .pz{position:absolute;top:max(8px,env(safe-area-inset-top));right:max(8px,env(safe-area-inset-right));width:44px;height:44px;font-size:18px}'+
    '#dt .hint{position:absolute;top:8px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;font-size:12px;padding:5px 12px;border-radius:14px;white-space:nowrap;transition:opacity 1s}'+
    '#dt .rot{position:absolute;left:0;right:0;top:40%;text-align:center;color:#fff;font-size:15px;background:rgba(0,0,0,.6);padding:10px;display:none}'+
    '#'+cv.id+'{touch-action:none}html,body{overscroll-behavior:none;-webkit-user-select:none;user-select:none}';
    document.head.appendChild(st);
    var root=document.createElement('div');root.id='dt';document.body.appendChild(root);
    function kev(type,code){try{window.dispatchEvent(new KeyboardEvent(type,{code:code,key:code,bubbles:true,cancelable:true}));}catch(e){}}
    function mk(def,parent,cls){
      var b=document.createElement('button');b.type='button';b.innerHTML=def.l+(def.t?'<small>'+def.t+'</small>':'');if(cls)b.className=cls;if(def.big)b.classList.add('big');
      var down=false;
      function dn(e){e.preventDefault();if(down)return;down=true;b.classList.add('on');try{b.setPointerCapture(e.pointerId);}catch(x){}kev('keydown',def.k);if(navigator.vibrate)try{navigator.vibrate(8)}catch(x){}}
      function up(e){e.preventDefault();if(!down)return;down=false;b.classList.remove('on');kev('keyup',def.k);}
      b.addEventListener('pointerdown',dn);b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);
      b.addEventListener('contextmenu',function(e){e.preventDefault()});
      parent.appendChild(b);return b;
    }
    var gl=document.createElement('div');gl.className='g gl';var gr=document.createElement('div');gr.className='g gr';root.appendChild(gl);root.appendChild(gr);
    (cfg.left||[]).forEach(function(d){mk(d,gl)});(cfg.right||[]).forEach(function(d){mk(d,gr)});
    if(cfg.pause!==false)mk({l:'⏸',k:'KeyP'},root,'pz');
    var hint=null;if(cfg.hint){hint=document.createElement('div');hint.className='hint';hint.textContent=cfg.hint;root.appendChild(hint);}
    var rot=document.createElement('div');rot.className='rot';rot.textContent='📱 Turn your phone sideways (landscape) for the best view';root.appendChild(rot);
    /* touch on the canvas = aim + hold to shoot (also taps for "next level" screens) */
    var aimId=null;
    function me(type,t){return new MouseEvent(type,{clientX:t.clientX,clientY:t.clientY,bubbles:true,cancelable:true,button:0});}
    cv.addEventListener('touchstart',function(e){e.preventDefault();if(aimId!==null)return;var t=e.changedTouches[0];aimId=t.identifier;cv.dispatchEvent(me('mousemove',t));cv.dispatchEvent(me('mousedown',t));if(hint)hint.style.opacity=0;},{passive:false});
    cv.addEventListener('touchmove',function(e){e.preventDefault();for(var i=0;i<e.changedTouches.length;i++){var t=e.changedTouches[i];if(t.identifier===aimId)cv.dispatchEvent(me('mousemove',t));}},{passive:false});
    function end(e){for(var i=0;i<e.changedTouches.length;i++){if(e.changedTouches[i].identifier===aimId){aimId=null;window.dispatchEvent(new MouseEvent('mouseup',{bubbles:true}));}}}
    cv.addEventListener('touchend',end);cv.addEventListener('touchcancel',end);
    /* show controls only while playing (menu hidden) */
    setInterval(function(){
      var playing=!menu||menu.classList.contains('hidden')||getComputedStyle(menu).display==='none';
      gl.style.display=gr.style.display=playing?'flex':'none';var pz=root.querySelector('.pz');if(pz)pz.style.display=playing?'flex':'none';
      rot.style.display=(playing&&innerHeight>innerWidth)?'block':'none';
      if(hint&&!playing)hint.style.opacity=1;
    },200);
    document.addEventListener('gesturestart',function(e){e.preventDefault()});
  }};
})();
