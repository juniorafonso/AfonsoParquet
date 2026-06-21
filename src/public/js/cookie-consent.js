/**
 * Cookie Consent Manager
 * Handles cookie consent banner and analytics loading
 * Compliant with nLPD (Swiss) and RGPD (EU)
 */

(function() {
  'use strict';
  
  const CONSENT_COOKIE_NAME = 'afonso_cookie_consent';
  const CONSENT_COOKIE_DAYS = 365;
  
  // Get cookie value by name
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  
  // Set cookie
  function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax;Secure`;
  }
  
  // Load Google Analytics
  function loadGA4() {
    if (!window.GA4_MEASUREMENT_ID || window.GA4_MEASUREMENT_ID === '') return;
    
    // Create script tag for gtag.js
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${window.GA4_MEASUREMENT_ID}`;
    document.head.appendChild(script);
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', window.GA4_MEASUREMENT_ID, {
      'anonymize_ip': true,
      'cookie_flags': 'SameSite=Lax;Secure'
    });
    
    window.gtag = gtag;
    console.log('[Analytics] GA4 loaded');
  }
  
  // Load Meta Pixel
  function loadMetaPixel() {
    if (!window.META_PIXEL_ID || window.META_PIXEL_ID === '') return;
    
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    
    fbq('init', window.META_PIXEL_ID);
    fbq('track', 'PageView');
    console.log('[Analytics] Meta Pixel loaded');
  }
  
  // Track custom event (Lead conversion for devis submission)
  window.trackLeadEvent = function(eventName, data) {
    // GA4 event
    if (window.gtag) {
      gtag('event', eventName, data);
    }
    
    // Meta Pixel event
    if (window.fbq) {
      fbq('track', 'Lead', data);
    }
  };
  
  // Show cookie banner
  function showBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.style.display = 'block';
      // Trigger animation
      setTimeout(() => banner.classList.add('show'), 10);
    }
  }
  
  // Hide cookie banner
  function hideBanner() {
    const banner = document.getElementById('cookie-consent-banner');
    if (banner) {
      banner.classList.remove('show');
      setTimeout(() => banner.style.display = 'none', 300);
    }
  }
  
  // Accept cookies
  function acceptCookies() {
    setCookie(CONSENT_COOKIE_NAME, 'accepted', CONSENT_COOKIE_DAYS);
    hideBanner();
    loadAnalytics();
  }
  
  // Decline cookies
  function declineCookies() {
    setCookie(CONSENT_COOKIE_NAME, 'declined', CONSENT_COOKIE_DAYS);
    hideBanner();
  }
  
  // Load analytics if consent given
  function loadAnalytics() {
    loadGA4();
    loadMetaPixel();
  }
  
  // Initialize on page load
  function init() {
    const consent = getCookie(CONSENT_COOKIE_NAME);
    
    if (consent === 'accepted') {
      loadAnalytics();
    } else if (consent !== 'declined') {
      // No consent yet, show banner
      showBanner();
    }
    
    // Bind button events
    const acceptBtn = document.getElementById('cookie-accept');
    const declineBtn = document.getElementById('cookie-decline');
    
    if (acceptBtn) acceptBtn.addEventListener('click', acceptCookies);
    if (declineBtn) declineBtn.addEventListener('click', declineCookies);
  }
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
})();
