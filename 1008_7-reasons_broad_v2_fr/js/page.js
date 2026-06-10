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