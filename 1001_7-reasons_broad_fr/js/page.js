/* ===== keep-40-carousel.js ===== */
(function(){

(function(){
  var scroller = document.getElementById('pvr-scroller');
  var track = document.getElementById('pvr-track');
  if(!scroller || !track) return;
  // duplique le set pour une boucle infinie
  track.innerHTML = track.innerHTML + track.innerHTML;
  var half = function(){ return track.scrollWidth / 2; };

  var vidPlaying = false, userActive = false, resumeT, dragging = false, sx = 0, sl = 0, moved = false;

  var pos = scroller.scrollLeft || 0;
  // Vitesse en pixels PAR MILLISECONDE (constante quel que soit le nombre d'images/seconde)
  var pxPerMs = (window.innerWidth < 900 ? 1.5 : 0.7) / 16.67;
  var last = null;
  function step(ts){
    if(last === null) last = ts;
    var dt = ts - last; last = ts;
    if(dt > 60) dt = 16.67; // évite un saut si l'onglet a été en arrière-plan
    var h = half();
    if(!vidPlaying && !userActive && !dragging){
      pos += pxPerMs * dt;
      if(h>0 && pos>=h){ pos -= h; }
      scroller.scrollLeft = pos;
    } else {
      pos = scroller.scrollLeft;
      if(h>0){ if(pos>=h){ pos-=h; scroller.scrollLeft=pos; } else if(pos<=0){ pos+=h; scroller.scrollLeft=pos; } }
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);

  // Scroll manuel infini (gauche/droite) — pause le défilement auto, qui reprend ~1,2 s après l'arrêt.
  function userOn(){ userActive = true; clearTimeout(resumeT); }
  function userOff(){ clearTimeout(resumeT); resumeT = setTimeout(function(){ userActive = false; }, 1200); }
  scroller.addEventListener('touchstart', userOn, {passive:true});
  scroller.addEventListener('touchend', userOff, {passive:true});
  scroller.addEventListener('wheel', function(e){ if(Math.abs(e.deltaX) > Math.abs(e.deltaY)){ userOn(); userOff(); } }, {passive:true});
  scroller.addEventListener('pointerdown', function(e){ if(e.pointerType!=='mouse') return; dragging=true; moved=false; sx=e.clientX; sl=scroller.scrollLeft; userOn(); });
  scroller.addEventListener('pointermove', function(e){ if(!dragging) return; var dx=e.clientX-sx; if(Math.abs(dx)>4) moved=true; scroller.scrollLeft = sl - dx; });
  scroller.addEventListener('pointerup', function(){ if(!dragging) return; dragging=false; userOff(); });
  scroller.addEventListener('pointerleave', function(){ if(dragging){ dragging=false; userOff(); } });

  // autoplay muet des vidéos visibles (sans bouton)
  var vids = track.querySelectorAll('video');
  vids.forEach(function(v){ v.muted=true; var card=v.closest('.pvr-card'); if(card && !card.querySelector('.pvr-play2')){ var b=document.createElement('span'); b.className='pvr-play2'; b.innerHTML='<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>'; (v.parentNode||card).appendChild(b); } });
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){
      entries.forEach(function(en){
        var v=en.target, card=v.closest('.pvr-card');
        if(en.isIntersecting){ v.play().catch(function(){}); }
        else if(card && !card.classList.contains('is-playing')){ v.pause(); }
      });
    },{root:scroller,rootMargin:'80px',threshold:0.25});
    vids.forEach(function(v){ io.observe(v); });
  } else { vids.forEach(function(v){ v.play().catch(function(){}); }); }

  // clic = relance du début AVEC le son + arrêt du défilement (re-clic = remet en muet, reprend)
  track.addEventListener('click', function(e){
    if(moved){ moved=false; return; }
    var card = e.target.closest('.pvr-card--video, .pvr-card--vq, .pvr-card--rev');
    if(!card) return;
    var v = card.querySelector('video'); if(!v) return;
    if(card.classList.contains('is-playing')){
      card.classList.remove('is-playing'); v.muted=true; vidPlaying=false;
    } else {
      document.querySelectorAll('.pvr-card.is-playing').forEach(function(c){ if(c!==card){ c.classList.remove('is-playing'); var ov=c.querySelector('video'); if(ov){ ov.muted=true; } } });
      card.classList.add('is-playing'); v.muted=false; try{v.currentTime=0;}catch(err){} v.play().catch(function(){}); vidPlaying=true;
    }
  });
})();

})();
/* ===== keep-39-desabo-video.js ===== */
(function(){

  (function(){
    var box=document.getElementById('pdvid-7rp'); if(!box) return;
    var v=box.querySelector('video'); if(!v) return;
    box.addEventListener('click',function(){
      if(!box.classList.contains('playing')){box.classList.add('playing');v.muted=false;var p=v.play();if(p&&p.catch){p.catch(function(){v.muted=true;v.play().catch(function(){});});}}
      else{if(v.paused){v.play();}else{v.pause();}}
    });
    box.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();box.click();}});
  })();
  
})();
/* ===== keep-41-lazy-video.js ===== */
(function(){

// Lazy videos via IntersectionObserver
(function(){
  var vids = document.querySelectorAll('.pgt-page video[data-lazy="autoplay"]');
  if (!vids.length) return;
  if (!('IntersectionObserver' in window)){
    vids.forEach(function(v){
      var srcs = v.querySelectorAll('source[data-src]');
      srcs.forEach(function(s){ s.src = s.dataset.src; });
      v.load(); v.play().catch(function(){});
    });
    return;
  }
  var io = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting){
        var v = e.target;
        var srcs = v.querySelectorAll('source[data-src]');
        srcs.forEach(function(s){ s.src = s.dataset.src; });
        v.load();
        v.play().catch(function(){});
        io.unobserve(v);
      }
    });
  }, { rootMargin: '200px' });
  vids.forEach(function(v){ io.observe(v); });
})();

})();
/* ===== keep-42-sticky-cta.js ===== */
(function(){

// Sticky CTA bottom — apparait au scroll sur mobile uniquement
(function(){
  var sticky = document.querySelector('.pgt-page .sticky-bottom');
  if (!sticky) return;
  var threshold = 120;
  function onScroll(){
    if (window.innerWidth > 880) { sticky.classList.add('is-visible'); return; }
    if (window.scrollY > threshold) sticky.classList.add('is-visible');
    else sticky.classList.remove('is-visible');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();

})();
/* ===== keep-44-trustbar.js ===== */
(function(){

// Trust bar — auto-scroll si overflow détecté en desktop (mobile géré par @media)
(function(){
  var trust = document.querySelector('.pgt-page .trust');
  var track = trust ? trust.querySelector('.trust-track') : null;
  if (!trust || !track) return;
  function checkOverflow(){
    if (window.innerWidth <= 880){ trust.classList.remove('is-overflow'); return; }
    var items = Array.prototype.slice.call(track.children).filter(function(el){ return !el.hasAttribute('aria-hidden'); });
    var trackGap = parseFloat(getComputedStyle(track).gap) || 0;
    var itemsWidth = 0;
    items.forEach(function(it, i){ itemsWidth += it.offsetWidth; if (i > 0) itemsWidth += trackGap; });
    var cs = getComputedStyle(trust);
    var paddingX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
    var inner = trust.clientWidth - paddingX;
    if (itemsWidth > inner){ trust.classList.add('is-overflow'); } else { trust.classList.remove('is-overflow'); }
  }
  if ('fonts' in document){ document.fonts.ready.then(checkOverflow); }
  checkOverflow();
  var resizeT;
  window.addEventListener('resize', function(){ clearTimeout(resizeT); resizeT = setTimeout(checkOverflow, 100); });
})();

})();
/* ===== keep-38-chips.js ===== */
(function(){

document.addEventListener('click',function(e){
  var close=e.target.closest('.pgt-page .pgt-chip-close');
  if(close){ e.stopPropagation(); var w=close.closest('.pgt-chip'); if(w){ w.classList.remove('is-open'); } return; }
  if(e.target.closest('.pgt-page .pgt-chip-pop')){ return; }
  var chip=e.target.closest('.pgt-page .pgt-chip');
  var open=document.querySelectorAll('.pgt-page .pgt-chip.is-open');
  if(chip){ e.stopPropagation(); var was=chip.classList.contains('is-open'); open.forEach(function(o){o.classList.remove('is-open');}); if(!was){ chip.classList.add('is-open');
    var vf=chip.querySelector('iframe[data-src]'); if(vf && !vf.src){ vf.src=vf.getAttribute('data-src'); }
    var pop=chip.querySelector('.pgt-chip-pop');
    if(pop){ pop.style.transform='translateX(-50%)'; pop.style.setProperty('--pgt-arrow','0px'); var r=pop.getBoundingClientRect(), pad=10, shift=0; if(r.left<pad){shift=pad-r.left;} else if(r.right>window.innerWidth-pad){shift=window.innerWidth-pad-r.right;} if(shift){ pop.style.transform='translateX(calc(-50% + '+shift+'px))'; pop.style.setProperty('--pgt-arrow',(-shift)+'px'); } }
  } }
  else { open.forEach(function(o){o.classList.remove('is-open');}); }
});

})();
/* ===== consent.js ===== */
(function(){

  // --- RGPD Consent Management (vanilla JS) ---
  var CONSENT_KEY = 'pacha_cookie_consent';
  var CONSENT_LOG_URL = 'https://script.google.com/macros/s/AKfycbzKHZmkAiE57mG_VZtaoBReIcM0ehPHa7bI_rTnrqdF4gqDenGY6ORYWmUwcNrx189D6g/exec';

  // --- Action 5: 13-month consent expiration (CNIL) ---
  function getConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      // Check if consent is older than 13 months (13 * 30 * 24 * 60 * 60 * 1000 = 33696000000)
      if (Date.now() - data.timestamp > 33696000000) {
        localStorage.removeItem(CONSENT_KEY);
        return null;
      }
      return data.value;
    } catch(e) {
      // Legacy format (plain string) — clear it
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
  }

  function getConsentCategories() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (Date.now() - data.timestamp > 33696000000) {
        localStorage.removeItem(CONSENT_KEY);
        return null;
      }
      return data.categories || null;
    } catch(e) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
  }

  function setConsent(value, categories) {
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        value: value,
        timestamp: Date.now(),
        categories: categories || (value === 'accepted' ? ['necessary','analytics','marketing','functional'] : ['necessary'])
      }));
    } catch(e) {}
  }

  // --- Action 7: Category-aware script activation ---
  function activateTrackingScripts(categories) {
    categories = categories || ['necessary', 'analytics', 'marketing', 'functional'];
    // Activate external scripts with data-src and matching data-consent-category
    document.querySelectorAll('script[data-src][data-consent-category]').forEach(function(el) {
      if (categories.indexOf(el.getAttribute('data-consent-category')) !== -1 && !el.src) {
        var newScript = document.createElement('script');
        newScript.src = el.getAttribute('data-src');
        newScript.async = true;
        el.parentNode.insertBefore(newScript, el.nextSibling);
      }
    });
    // Execute inline consent scripts
    document.querySelectorAll('script[data-consent-inline][data-consent-category]').forEach(function(el) {
      if (categories.indexOf(el.getAttribute('data-consent-category')) !== -1 && !el.dataset.executed) {
        el.dataset.executed = 'true';
        try { eval(el.textContent); } catch(e) {}
      }
    });
  }

  function deactivateTrackingScripts() {
    // Nothing to deactivate — scripts simply do not get loaded
  }

  // --- Shopify Customer Privacy API: propagates consent to Klaviyo, Pinterest,
  //     Triple Whale, Shopify Analytics, and other Shopify app embeds ---
  function applyShopifyConsent(analytics, marketing) {
    function _set() {
      try {
        window.Shopify.customerPrivacy.setTrackingConsent({
          analytics: !!analytics,
          marketing: !!marketing,
          preferences: !!analytics,
          sale_of_data: !!marketing
        }, function() {});
      } catch(e) {}
    }
    if (window.Shopify && window.Shopify.customerPrivacy && typeof window.Shopify.customerPrivacy.setTrackingConsent === 'function') {
      _set();
    } else {
      document.addEventListener('shopifyCustomerPrivacyApiLoaded', _set, { once: true });
    }
  }

  // --- Action 4: Google Consent Mode v2 update ---
  function setGoogleConsentMode(granted) {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage': granted ? 'granted' : 'denied',
        'ad_user_data': granted ? 'granted' : 'denied',
        'ad_personalization': granted ? 'granted' : 'denied',
        'analytics_storage': granted ? 'granted' : 'denied'
      });
    }
  }

  // --- Action 8: Converge consent API ---
  function setConvergeConsent(analytics, marketing) {
    if (typeof cvg === 'function') {
      cvg({
        "method": "consent",
        "analytics": analytics ? "granted" : "denied",
        "marketing": marketing ? "granted" : "denied"
      });
    }
  }

  // --- Action 9: Server-side consent logging ---
  function logConsent(decision) {
    try {
      var data = {
        decision: decision,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      };
      if (navigator.sendBeacon) {
        navigator.sendBeacon(CONSENT_LOG_URL, JSON.stringify(data));
      }
    } catch(e) {}
  }

  function hideBanner() {
    document.querySelectorAll('#cookie-banner').forEach(function(banner) {
      banner.style.setProperty('display', 'none', 'important');
    });
    document.querySelectorAll('.cky-modal').forEach(function(modal) {
      modal.classList.remove('cky-modal-open');
    });
    document.querySelectorAll('.cky-overlay').forEach(function(overlay) {
      overlay.style.setProperty('display', 'none', 'important');
    });
  }

  // --- Action 2: Fixed acceptCookies ---
  function acceptCookies(e) {
    if (e) e.preventDefault();
    setConsent('accepted');
    activateTrackingScripts();
    setConvergeConsent(true, true);
    setGoogleConsentMode(true);
    applyShopifyConsent(true, true);
    logConsent('accepted');
    hideBanner();
  }

  // --- Action 2: Fixed rejectCookies ---
  function rejectCookies(e) {
    if (e) e.preventDefault();
    setConsent('rejected');
    deactivateTrackingScripts();
    setConvergeConsent(false, false);
    setGoogleConsentMode(false);
    applyShopifyConsent(false, false);
    logConsent('rejected');
    hideBanner();
  }

  // --- Action 7: Save granular preferences ---
  function savePreferences(e) {
    if (e) e.preventDefault();
    var categories = ['necessary'];
    var functionalToggle = document.getElementById('ckySwitchfunctional');
    var analyticsToggle = document.getElementById('ckySwitchanalytics');
    var advertisementToggle = document.getElementById('ckySwitchadvertisement');
    var performanceToggle = document.getElementById('ckySwitchperformance');

    if (functionalToggle && functionalToggle.checked) categories.push('functional');
    if (analyticsToggle && analyticsToggle.checked) categories.push('analytics');
    if (advertisementToggle && advertisementToggle.checked) categories.push('marketing');
    if (performanceToggle && performanceToggle.checked) categories.push('functional');

    var hasAnalytics = categories.indexOf('analytics') !== -1;
    var hasMarketing = categories.indexOf('marketing') !== -1;
    var decision = (hasAnalytics || hasMarketing) ? 'partial' : 'rejected';

    setConsent(decision === 'rejected' ? 'rejected' : 'accepted', categories);
    activateTrackingScripts(categories);
    setConvergeConsent(hasAnalytics, hasMarketing);
    applyShopifyConsent(hasAnalytics, hasMarketing);

    // Granular Google Consent Mode update
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage': hasMarketing ? 'granted' : 'denied',
        'ad_user_data': hasMarketing ? 'granted' : 'denied',
        'ad_personalization': hasMarketing ? 'granted' : 'denied',
        'analytics_storage': hasAnalytics ? 'granted' : 'denied'
      });
    }

    logConsent('partial:' + categories.join(','));
    hideBanner();
  }

  // --- Action 6: Reopen cookie banner from footer ---
  function reopenCookieBanner() {
    localStorage.removeItem(CONSENT_KEY);
    var banner = document.getElementById('cookie-banner');
    if (banner) banner.style.display = '';
  }
  window.reopenCookieBanner = reopenCookieBanner;

  // --- On page load: check existing consent ---
  var consent = getConsent();
  if (consent === 'accepted') {
    hideBanner();
    var cats = getConsentCategories();
    activateTrackingScripts(cats);
    var hasAnalytics = cats && cats.indexOf('analytics') !== -1;
    var hasMarketing = cats && cats.indexOf('marketing') !== -1;
    setConvergeConsent(hasAnalytics, hasMarketing);
    applyShopifyConsent(hasAnalytics, hasMarketing);
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage': hasMarketing ? 'granted' : 'denied',
        'ad_user_data': hasMarketing ? 'granted' : 'denied',
        'ad_personalization': hasMarketing ? 'granted' : 'denied',
        'analytics_storage': hasAnalytics ? 'granted' : 'denied'
      });
    }
  } else if (consent === 'rejected') {
    hideBanner();
    applyShopifyConsent(false, false);
  } else {
    // No consent yet — default everything to denied so Shopify apps don't track
    applyShopifyConsent(false, false);
  }
  // If consent is null (no consent or expired), banner stays visible

  // --- Event delegation ---
  document.addEventListener('click', function(e) {
    var target = e.target;
    if (target.closest('#accept-cookies') || target.closest('.cky-btn-accept')) {
      acceptCookies(e);
      return;
    }
    if (target.closest('#reject-cookies') || target.closest('.cky-btn-reject')) {
      rejectCookies(e);
      return;
    }
    if (target.closest('#preferences-cookies') || target.closest('#preferences-cookies-2')) {
      var modal = document.querySelector('.cky-modal');
      if (modal) modal.classList.add('cky-modal-open');
      var overlay = document.querySelector('.cky-overlay');
      if (overlay) overlay.style.display = 'block';
      var banner = document.getElementById('cookie-banner');
      if (banner) banner.style.display = 'none';
      return;
    }
    if (target.closest('.cky-btn-close')) {
      var modal = document.querySelector('.cky-modal');
      if (modal) modal.classList.remove('cky-modal-open');
      var overlay = document.querySelector('.cky-overlay');
      if (overlay) overlay.style.display = 'none';
      return;
    }
    if (target.closest('.cky-btn-preferences')) {
      // "Enregistrer mes preferences" button — save granular preferences
      savePreferences(e);
      return;
    }
    if (target.closest('.show-desc')) {
      document.querySelectorAll('.half-description').forEach(function(el) { el.classList.add('cky-hide'); });
      document.querySelectorAll('.opened-description').forEach(function(el) { el.classList.remove('cky-hide'); });
      return;
    }
    if (target.closest('.hide-desc')) {
      document.querySelectorAll('.half-description').forEach(function(el) { el.classList.remove('cky-hide'); });
      document.querySelectorAll('.opened-description').forEach(function(el) { el.classList.add('cky-hide'); });
      return;
    }
    var accordion = target.closest('.cky-accordion');
    if (accordion && target.type !== 'checkbox') {
      document.querySelectorAll('.cky-accordion').forEach(function(el) {
        if (el !== accordion) el.classList.remove('cky-accordion-active');
      });
      accordion.classList.toggle('cky-accordion-active');
      return;
    }
  });

  // --- Adjust cookie banner position above any visible sticky bottom bar ---
  (function() {
    var STICKY_SELECTORS = '.sticky-bar, .sticky-bottom-cta, .v2-sticky-cta, .v2bis-sticky-cta, .sticky-bottom, .sticky-mini-cta, .mh_mobile_sticky_buttons_o7';
    function adjustBanner() {
      var banner = document.getElementById('cookie-banner');
      if (!banner || banner.style.display === 'none') return;
      var maxOffset = 0;
      document.querySelectorAll(STICKY_SELECTORS).forEach(function(el) {
        if (el === banner || banner.contains(el)) return;
        var cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') return;
        var rect = el.getBoundingClientRect();
        if (rect.height < 5) return;
        // Sticky bar visible at bottom of viewport (within 20px of bottom)
        if (rect.bottom > window.innerHeight - 5 && rect.bottom < window.innerHeight + 200 && rect.top < window.innerHeight) {
          maxOffset = Math.max(maxOffset, rect.height);
        }
      });
      banner.style.bottom = maxOffset > 0 ? maxOffset + 'px' : '';
    }
    // Run on load, scroll, resize, and class changes
    document.addEventListener('DOMContentLoaded', adjustBanner);
    window.addEventListener('scroll', adjustBanner, { passive: true });
    window.addEventListener('resize', adjustBanner);
    // Lightweight polling for sticky bars that toggle .show via JS
    setInterval(adjustBanner, 400);
  })();

})();