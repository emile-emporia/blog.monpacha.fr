/* ============================================================
   TOP 5 LITIÈRES — FR · JS
   - Gestion du consentement RGPD (réutilisé du rebuild 7-raisons)
   - Sticky CTA bas (apparaît au scroll, mobile + desktop)
   - Smooth scroll des ancres internes
   ============================================================ */

/* ===== sticky CTA bas ===== */
(function(){
  var sticky = document.querySelector('.sticky-bottom');
  if (!sticky) return;
  var threshold = 600;
  function onScroll(){
    if (window.scrollY > threshold) sticky.classList.add('is-visible');
    else sticky.classList.remove('is-visible');
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
})();

/* ===== compte à rebours jusqu'à minuit (réel, se réinitialise chaque jour) ===== */
(function(){
  var box = document.getElementById('cd');
  if (!box) return;
  var h = box.querySelector('[data-cd="h"]'), m = box.querySelector('[data-cd="m"]'), s = box.querySelector('[data-cd="s"]');
  function pad(n){ return (n<10?'0':'') + n; }
  function tick(){
    var now = new Date();
    var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    var diff = Math.max(0, Math.floor((end - now) / 1000));
    h.textContent = pad(Math.floor(diff/3600));
    m.textContent = pad(Math.floor((diff%3600)/60));
    s.textContent = pad(diff%60);
  }
  tick();
  setInterval(tick, 1000);
})();

/* ===== smooth scroll ancres ===== */
(function(){
  document.addEventListener('click', function(e){
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute('href');
    if (id.length < 2) return;
    var t = document.querySelector(id);
    if (!t) return;
    e.preventDefault();
    t.scrollIntoView({ behavior:'smooth', block:'start' });
  });
})();

/* ===== modal vidéo désabonnement ===== */
(function(){
  var modal = document.getElementById('desabo-modal');
  if (!modal) return;
  var link = document.getElementById('desabo-link');
  var vid = document.getElementById('desabo-video');
  function open(e){
    if(e){ e.preventDefault(); }
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    if(vid){
      try{
        vid.muted=false; vid.volume=1; try{ vid.currentTime=0; }catch(_){}
        var p=vid.play();
        if(p && p.catch){ p.catch(function(){ vid.muted=true; vid.play().catch(function(){}); }); }
      }catch(_){}
    }
  }
  function close(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); if(vid){ try{ vid.pause(); }catch(_){} } }
  if (link) link.addEventListener('click', open);
  modal.addEventListener('click', function(e){ if(e.target===modal || e.target.closest('.dz-close')) close(); });
  document.addEventListener('keydown', function(e){ if(e.key==='Escape' && modal.classList.contains('open')) close(); });
})();

/* ===== consentement RGPD (vanilla) ===== */
(function(){
  var CONSENT_KEY = 'pacha_cookie_consent';
  var CONSENT_LOG_URL = 'https://script.google.com/macros/s/AKfycbzKHZmkAiE57mG_VZtaoBReIcM0ehPHa7bI_rTnrqdF4gqDenGY6ORYWmUwcNrx189D6g/exec';

  function getConsent(){
    try{
      var raw = localStorage.getItem(CONSENT_KEY);
      if(!raw) return null;
      var data = JSON.parse(raw);
      if(Date.now() - data.timestamp > 33696000000){ localStorage.removeItem(CONSENT_KEY); return null; }
      return data.value;
    }catch(e){ localStorage.removeItem(CONSENT_KEY); return null; }
  }
  function getConsentCategories(){
    try{
      var raw = localStorage.getItem(CONSENT_KEY);
      if(!raw) return null;
      var data = JSON.parse(raw);
      if(Date.now() - data.timestamp > 33696000000){ localStorage.removeItem(CONSENT_KEY); return null; }
      return data.categories || null;
    }catch(e){ localStorage.removeItem(CONSENT_KEY); return null; }
  }
  function setConsent(value, categories){
    try{
      localStorage.setItem(CONSENT_KEY, JSON.stringify({
        value:value, timestamp:Date.now(),
        categories:categories || (value === 'accepted' ? ['necessary','analytics','marketing','functional'] : ['necessary'])
      }));
    }catch(e){}
  }
  function setConvergeConsent(analytics, marketing){
    if(typeof cvg === 'function'){
      cvg({ "method":"consent", "analytics":analytics?"granted":"denied", "marketing":marketing?"granted":"denied" });
    }
  }
  function logConsent(decision){
    try{
      var data = { decision:decision, timestamp:new Date().toISOString(), url:window.location.href, userAgent:navigator.userAgent };
      if(navigator.sendBeacon){ navigator.sendBeacon(CONSENT_LOG_URL, JSON.stringify(data)); }
    }catch(e){}
  }
  function hideBanner(){
    document.querySelectorAll('#cookie-banner').forEach(function(b){ b.style.setProperty('display','none','important'); });
    document.querySelectorAll('.cky-modal').forEach(function(m){ m.classList.remove('cky-modal-open'); });
    document.querySelectorAll('.cky-overlay').forEach(function(o){ o.style.setProperty('display','none','important'); });
  }
  function acceptCookies(e){ if(e) e.preventDefault(); setConsent('accepted'); setConvergeConsent(true,true); logConsent('accepted'); hideBanner(); }
  function rejectCookies(e){ if(e) e.preventDefault(); setConsent('rejected'); setConvergeConsent(false,false); logConsent('rejected'); hideBanner(); }
  function savePreferences(e){
    if(e) e.preventDefault();
    var categories = ['necessary'];
    var fn = document.getElementById('ckySwitchfunctional');
    var an = document.getElementById('ckySwitchanalytics');
    var ad = document.getElementById('ckySwitchadvertisement');
    if(fn && fn.checked) categories.push('functional');
    if(an && an.checked) categories.push('analytics');
    if(ad && ad.checked) categories.push('marketing');
    var hasA = categories.indexOf('analytics') !== -1;
    var hasM = categories.indexOf('marketing') !== -1;
    setConsent((hasA||hasM) ? 'accepted' : 'rejected', categories);
    setConvergeConsent(hasA, hasM);
    logConsent('partial:' + categories.join(','));
    hideBanner();
  }
  window.reopenCookieBanner = function(){ localStorage.removeItem(CONSENT_KEY); var b=document.getElementById('cookie-banner'); if(b) b.style.display=''; };

  var consent = getConsent();
  if(consent === 'accepted'){
    hideBanner();
    var cats = getConsentCategories();
    setConvergeConsent(cats && cats.indexOf('analytics')!==-1, cats && cats.indexOf('marketing')!==-1);
  } else if(consent === 'rejected'){ hideBanner(); }

  document.addEventListener('click', function(e){
    var t = e.target;
    if(t.closest('#accept-cookies') || t.closest('.cky-btn-accept')){ acceptCookies(e); return; }
    if(t.closest('#reject-cookies') || t.closest('.cky-btn-reject')){ rejectCookies(e); return; }
    if(t.closest('#preferences-cookies') || t.closest('#preferences-cookies-2')){
      var m=document.querySelector('.cky-modal'); if(m) m.classList.add('cky-modal-open');
      var o=document.querySelector('.cky-overlay'); if(o) o.style.display='block';
      var b=document.getElementById('cookie-banner'); if(b) b.style.display='none';
      return;
    }
    if(t.closest('.cky-btn-close')){
      var m2=document.querySelector('.cky-modal'); if(m2) m2.classList.remove('cky-modal-open');
      var o2=document.querySelector('.cky-overlay'); if(o2) o2.style.display='none';
      return;
    }
    if(t.closest('.cky-btn-preferences')){ savePreferences(e); return; }
    if(t.closest('.cky-overlay')){
      var m3=document.querySelector('.cky-modal'); if(m3) m3.classList.remove('cky-modal-open');
      e.target.style.display='none';
      return;
    }
  });

  /* place la bannière au-dessus du sticky CTA visible */
  (function(){
    function adjust(){
      var banner = document.getElementById('cookie-banner');
      if(!banner || banner.style.display === 'none') return;
      var off = 0;
      document.querySelectorAll('.sticky-bottom').forEach(function(el){
        var cs = getComputedStyle(el);
        if(cs.display === 'none' || cs.visibility === 'hidden') return;
        var r = el.getBoundingClientRect();
        if(r.height < 5) return;
        if(r.bottom > window.innerHeight - 5 && r.bottom < window.innerHeight + 200 && r.top < window.innerHeight){ off = Math.max(off, r.height); }
      });
      banner.style.bottom = off > 0 ? off + 'px' : '';
    }
    document.addEventListener('DOMContentLoaded', adjust);
    window.addEventListener('scroll', adjust, { passive:true });
    window.addEventListener('resize', adjust);
    setInterval(adjust, 400);
  })();
})();
