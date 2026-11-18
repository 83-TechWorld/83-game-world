/* Kids Games 4u ad loader.
   Nothing loads until `client` is filled in, so the site stays ad-free until AdSense approves it.

   After approval:
     1. Paste your publisher ID into `client` (looks like ca-pub-1234567890123456).
     2. Create two display ad units in AdSense and paste their numeric IDs into `slots`.
     3. Run `npm run seo` to write ads.txt and the AdSense verification tag.

   Every request is tagged for child treatment, which turns off personalised ads and remarketing. */
(function () {
  var CONFIG = {
    client: 'ca-pub-3661874605610386',
    slots: { homeTop: '', homeMiddle: '' },
    nextClicksPerAd: 3,      // offer an ad on every 3rd "Next" press
    frequencyHint: '180s',   // ask Google for at least 3 minutes between full-screen ads
    waitForAdMs: 1500        // never hold a child on the win screen longer than this
  };

  var enabled = /^ca-pub-\d{16}$/.test(CONFIG.client);
  // Local testing must never request real ads: that counts as invalid traffic.
  var testMode = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var ready = false, nextClicks = 0;

  function tagChild(el) {
    el.setAttribute('data-ad-client', CONFIG.client);
    el.setAttribute('data-tag-for-age-treatment', '1');
  }

  if (enabled) {
    window.adsbygoogle = window.adsbygoogle || [];
    window.adBreak = window.adConfig = function (o) { window.adsbygoogle.push(o); };
    var s = document.createElement('script');
    s.async = true;
    s.crossOrigin = 'anonymous';
    s.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + CONFIG.client;
    tagChild(s);
    s.setAttribute('data-ad-frequency-hint', CONFIG.frequencyHint);
    if (testMode) s.setAttribute('data-adbreak-test', 'on');
    s.onload = function () { ready = true; window.adConfig({ preloadAdBreaks: 'on', sound: 'on' }); };
    (document.head || document.documentElement).appendChild(s);
  }

  window.KGAds = {
    /* Runs done() once, after an ad if one shows. Blocked or missing ads never stop the game. */
    levelBreak: function (done, hooks) {
      hooks = hooks || {};
      nextClicks++;
      if (!ready || nextClicks % CONFIG.nextClicksPerAd) { done(); return; }
      var finished = false, started = false, timer;
      function finish() { if (finished) return; finished = true; clearTimeout(timer); done(); }
      timer = setTimeout(function () { if (!started) finish(); }, CONFIG.waitForAdMs);
      try {
        window.adBreak({
          type: 'next',
          name: 'next-level',
          beforeAd: function () { started = true; clearTimeout(timer); if (hooks.pause) hooks.pause(); },
          afterAd: function () { if (hooks.resume) hooks.resume(); },
          adBreakDone: finish
        });
      } catch (e) { finish(); }
    },

    /* Returns a labelled banner element, or null when ads are off. Add it to the page straight away. */
    banner: function (slotName) {
      var slot = CONFIG.slots[slotName];
      if (!enabled || !slot) return null;
      var box = document.createElement('aside');
      box.className = 'ad-slot';
      box.setAttribute('aria-label', 'Advertisement');
      box.innerHTML = '<small>Advertisement</small>';
      var ins = document.createElement('ins');
      ins.className = 'adsbygoogle';
      ins.style.display = 'block';
      tagChild(ins);
      ins.setAttribute('data-ad-slot', slot);
      ins.setAttribute('data-ad-format', 'horizontal');
      ins.setAttribute('data-full-width-responsive', 'true');
      if (testMode) ins.setAttribute('data-adtest', 'on');
      box.appendChild(ins);
      requestAnimationFrame(function () { try { window.adsbygoogle.push({}); } catch (e) {} });
      return box;
    }
  };
})();
