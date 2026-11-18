/* Full-screen action games have no room for text below the game, so their guide
   opens from an "About this game" button that shows whenever the player is not in a round. */
(function () {
  function init() {
    var guide = document.getElementById('game-guide');
    if (!guide) return;
    var css = document.createElement('style');
    css.textContent =
      '#guide-open{position:fixed;left:10px;bottom:10px;z-index:60;border:0;border-radius:99px;padding:9px 14px;background:#fff;color:#1c2a55;font:800 13px system-ui,sans-serif;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)}' +
      '#game-guide{position:fixed;inset:0;z-index:70;overflow:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;padding:56px max(16px,calc(50vw - 370px)) 40px;background:#fff;color:#1c2a55;font:500 16px/1.55 system-ui,sans-serif;user-select:text;-webkit-user-select:text}' +
      '#game-guide h2{font-size:23px;line-height:1.25;margin:0 0 10px}#game-guide h3{font-size:18px;margin:20px 0 4px}#game-guide p{margin:6px 0}#game-guide a{color:#2848c7;font-weight:700}' +
      '#guide-close{position:fixed;right:14px;top:10px;z-index:71;border:0;border-radius:99px;padding:9px 14px;background:#1c2a55;color:#fff;font:800 14px system-ui,sans-serif;cursor:pointer}';
    document.head.appendChild(css);

    var open = document.createElement('button');
    open.id = 'guide-open'; open.type = 'button'; open.textContent = '📖 About this game';
    var close = document.createElement('button');
    close.id = 'guide-close'; close.type = 'button'; close.textContent = '✕ Back to game'; close.hidden = true;
    document.body.appendChild(open); document.body.appendChild(close);

    function show(on) { guide.hidden = !on; close.hidden = !on; if (on) { guide.scrollTop = 0; close.focus(); } else open.focus(); }
    open.onclick = function () { show(true); };
    close.onclick = function () { show(false); };
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !guide.hidden) show(false); });
    // Games with a #menu screen use it as the signal: Stick Cycle Race runs a demo race behind its menu.
    var menu = document.getElementById('menu');
    function inRound() { return menu ? menu.classList.contains('hidden') : !!(window.GNav && GNav.playing); }
    setInterval(function () { open.hidden = inRound() || !guide.hidden; }, 300);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
