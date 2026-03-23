/**
 * PixelCraft AI — Cookie Consent & Privacy System
 * Production-ready | Lightweight | No dependencies
 * Stores consent in localStorage, guards tracking scripts,
 * supports keyboard nav, manage-preferences panel, floating badge.
 */

(function () {
  'use strict';

  /* ── Constants ────────────────────────────────────────────── */
  const LS_KEY       = 'pc_consent_v1';
  const PREFS_KEY    = 'pc_consent_prefs_v1';
  const POLICY_BASE  = '/';   // root-relative; adjust if hosted in a subdir

  const LINKS = {
    terms   : 'terms-conditions.html',
    privacy : 'privacy-policy.html',
    cookies : 'cookies-policy.html',
  };

  /* ── Helpers ──────────────────────────────────────────────── */
  function getConsent()  { try { return JSON.parse(localStorage.getItem(LS_KEY)); }  catch { return null; } }
  function getPrefs()    { try { return JSON.parse(localStorage.getItem(PREFS_KEY)); } catch { return null; } }

  function saveConsent(prefs) {
    const payload = {
      accepted  : true,
      timestamp : new Date().toISOString(),
      analytics : prefs.analytics,
      ads       : prefs.ads,
      social    : prefs.social,
    };
    localStorage.setItem(LS_KEY, JSON.stringify(payload));
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }

  /* ── Tracking guard ───────────────────────────────────────── */
  /**
   * Call this BEFORE loading GA / Adsense / any tracking.
   * Returns true if the user has consented (analytics accepted).
   */
  window.pcConsentAllowsTracking = function () {
    const c = getConsent();
    return c && c.accepted && c.analytics !== false;
  };

  window.pcConsentAllowsAds = function () {
    const c = getConsent();
    return c && c.accepted && c.ads !== false;
  };

  /* ── Render HTML ──────────────────────────────────────────── */
  function buildModal() {
    const html = `
    <div id="cc-overlay" role="dialog" aria-modal="true"
         aria-labelledby="cc-modal-title" aria-describedby="cc-modal-desc">
      <div id="cc-modal" tabindex="-1">

        <!-- Header -->
        <div class="cc-header">
          <div class="cc-icon-wrap" aria-hidden="true">🔐</div>
          <div class="cc-title-group">
            <span class="cc-eyebrow">Required</span>
            <h2 class="cc-title" id="cc-modal-title">Privacy &amp; Consent</h2>
          </div>
        </div>

        <!-- Description -->
        <p class="cc-description" id="cc-modal-desc">
          Welcome to <strong>PixelCraft AI</strong>! Before you dive in,
          we need your consent. We use cookies to keep our tools running
          smoothly, remember your preferences, and (optionally) to help us
          understand how people use our site so we can improve it.
          Your privacy matters — we never sell your data.
        </p>

        <!-- Policy Quick-Links -->
        <div class="cc-policy-links" aria-label="Legal documents">
          <a href="${LINKS.terms}" target="_blank" class="cc-policy-link" rel="noopener">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Terms &amp; Conditions
          </a>
          <a href="${LINKS.privacy}" target="_blank" class="cc-policy-link" rel="noopener">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Privacy Policy
          </a>
          <a href="${LINKS.cookies}" target="_blank" class="cc-policy-link" rel="noopener">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="10" r="3"/><path d="M7 20.662V19a5 5 0 0 1 10 0v1.662"/></svg>
            Cookies Policy
          </a>
        </div>

        <div class="cc-divider" aria-hidden="true"></div>

        <!-- Checkboxes -->
        <div class="cc-checks">
          <!-- Terms -->
          <label class="cc-check-label" id="cc-label-terms">
            <input type="checkbox" class="cc-check-input" id="cc-chk-terms"
                   aria-required="true" aria-label="Accept Terms and Conditions" />
            <span class="cc-check-box" aria-hidden="true">
              <svg class="cc-check-tick" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="cc-check-text">
              <strong>I accept the Terms &amp; Conditions</strong><br/>
              I have read and agree to the
              <a href="${LINKS.terms}" target="_blank" rel="noopener">Terms &amp; Conditions</a>
              governing the use of PixelCraft AI.
            </span>
          </label>

          <!-- Cookies -->
          <label class="cc-check-label" id="cc-label-cookies">
            <input type="checkbox" class="cc-check-input" id="cc-chk-cookies"
                   aria-required="true" aria-label="Agree to Cookies and Privacy Policy" />
            <span class="cc-check-box" aria-hidden="true">
              <svg class="cc-check-tick" width="12" height="12" viewBox="0 0 12 12" fill="none">
                <polyline points="2,6 5,9 10,3" stroke="white" stroke-width="2"
                          stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            <span class="cc-check-text">
              <strong>I agree to Cookies &amp; Privacy Policy</strong><br/>
              I consent to the use of essential &amp; functional cookies as described in the
              <a href="${LINKS.privacy}" target="_blank" rel="noopener">Privacy Policy</a> and
              <a href="${LINKS.cookies}" target="_blank" rel="noopener">Cookies Policy</a>.
            </span>
          </label>
        </div>

        <!-- Actions -->
        <div class="cc-actions">
          <button id="cc-accept-btn" disabled
                  aria-disabled="true"
                  aria-label="Accept all and continue to website">
            ✓ &nbsp;Accept &amp; Continue
          </button>
          <button id="cc-manage-btn"
                  aria-expanded="false"
                  aria-controls="cc-prefs-panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41"/></svg>
            Manage Preferences
          </button>
        </div>

        <!-- Manage Preferences Panel -->
        <div id="cc-prefs-panel" aria-hidden="true">
          <div class="cc-prefs-inner">
            <p class="cc-prefs-title">⚙️ Cookie Preferences</p>

            <div class="cc-pref-row">
              <div class="cc-pref-info">
                <h4>Essential Cookies</h4>
                <p>Required for the site to function. Cannot be disabled.</p>
              </div>
              <label class="cc-toggle" aria-label="Essential cookies — always on">
                <input type="checkbox" checked disabled />
                <span class="cc-toggle-track"></span>
              </label>
            </div>

            <div class="cc-pref-row">
              <div class="cc-pref-info">
                <h4>Analytics Cookies</h4>
                <p>Help us understand how visitors interact with our tools.</p>
              </div>
              <label class="cc-toggle" aria-label="Toggle analytics cookies">
                <input type="checkbox" id="cc-pref-analytics" checked />
                <span class="cc-toggle-track"></span>
              </label>
            </div>

            <div class="cc-pref-row">
              <div class="cc-pref-info">
                <h4>Advertising Cookies</h4>
                <p>Used by Google AdSense to show relevant ads.</p>
              </div>
              <label class="cc-toggle" aria-label="Toggle advertising cookies">
                <input type="checkbox" id="cc-pref-ads" checked />
                <span class="cc-toggle-track"></span>
              </label>
            </div>

            <div class="cc-pref-row">
              <div class="cc-pref-info">
                <h4>Social Cookies</h4>
                <p>Enable social media sharing and embedded content.</p>
              </div>
              <label class="cc-toggle" aria-label="Toggle social cookies">
                <input type="checkbox" id="cc-pref-social" checked />
                <span class="cc-toggle-track"></span>
              </label>
            </div>
          </div>
        </div>

        <!-- Footer note -->
        <p class="cc-footer-note">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          Your data is protected. We never sell personal information.
        </p>

      </div>
    </div>

    <!-- Floating consent badge (shown after acceptance) -->
    <div id="cc-floating-badge" role="button" tabindex="0"
         aria-label="Manage your cookie preferences" title="Cookie Preferences">
      <span class="cc-badge-dot" aria-hidden="true"></span>
      Cookie Preferences
    </div>
    `;

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.insertAdjacentElement('afterbegin', wrapper);
  }

  /* ── Wire up interactions ─────────────────────────────────── */
  function init() {
    const overlay     = document.getElementById('cc-overlay');
    const modal       = document.getElementById('cc-modal');
    const chkTerms    = document.getElementById('cc-chk-terms');
    const chkCookies  = document.getElementById('cc-chk-cookies');
    const labelTerms  = document.getElementById('cc-label-terms');
    const labelCookies= document.getElementById('cc-label-cookies');
    const acceptBtn   = document.getElementById('cc-accept-btn');
    const manageBtn   = document.getElementById('cc-manage-btn');
    const prefsPanel  = document.getElementById('cc-prefs-panel');
    const badge       = document.getElementById('cc-floating-badge');

    /* ── Checkbox toggle helper ── */
    function toggleCheck(chk, label) {
      chk.checked = !chk.checked;
      label.classList.toggle('checked', chk.checked);
      updateAcceptBtn();
    }

    function updateAcceptBtn() {
      const ok = chkTerms.checked && chkCookies.checked;
      acceptBtn.disabled = !ok;
      acceptBtn.setAttribute('aria-disabled', String(!ok));
    }

    /* Click on label area */
    [labelTerms, labelCookies].forEach(label => {
      label.addEventListener('click', (e) => {
        // Don't double-fire when clicking internal links
        if (e.target.tagName === 'A') return;
        const chk = label.querySelector('.cc-check-input');
        chk.checked = !chk.checked;
        label.classList.toggle('checked', chk.checked);
        updateAcceptBtn();
      });
    });

    /* Keyboard: Space on label = toggle */
    [labelTerms, labelCookies].forEach(label => {
      label.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          const chk = label.querySelector('.cc-check-input');
          chk.checked = !chk.checked;
          label.classList.toggle('checked', chk.checked);
          updateAcceptBtn();
        }
      });
      label.setAttribute('tabindex', '0');
      label.setAttribute('role', 'checkbox');
    });

    /* Native checkbox change (keyboard) */
    chkTerms.addEventListener('change', () => {
      labelTerms.classList.toggle('checked', chkTerms.checked);
      updateAcceptBtn();
    });
    chkCookies.addEventListener('change', () => {
      labelCookies.classList.toggle('checked', chkCookies.checked);
      updateAcceptBtn();
    });

    /* ── Manage preferences toggle ── */
    manageBtn.addEventListener('click', () => {
      const isOpen = prefsPanel.classList.toggle('cc-prefs-open');
      prefsPanel.setAttribute('aria-hidden', String(!isOpen));
      manageBtn.setAttribute('aria-expanded', String(isOpen));
      manageBtn.innerHTML = isOpen
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polyline points="18 15 12 9 6 15"/></svg> Hide Preferences`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M12 2v2M12 20v2M2 12h2M20 12h2M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41"/></svg> Manage Preferences`;
    });

    /* ── Accept & Continue ── */
    acceptBtn.addEventListener('click', () => {
      const prefs = {
        analytics : document.getElementById('cc-pref-analytics')?.checked ?? true,
        ads       : document.getElementById('cc-pref-ads')?.checked       ?? true,
        social    : document.getElementById('cc-pref-social')?.checked    ?? true,
      };
      saveConsent(prefs);
      hideModal();
      showBadge();
      loadTrackingScripts(prefs);

      // Dispatch custom event for other scripts to hook into
      document.dispatchEvent(new CustomEvent('pcConsentAccepted', { detail: prefs }));
    });

    /* ── Floating badge — opens preferences modal ── */
    badge.addEventListener('click', () => reopenManageModal());
    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') reopenManageModal();
    });

    /* ── Keyboard trap inside modal ── */
    overlay.addEventListener('keydown', trapFocus);
    overlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        // Don't allow closing without consent — UX standard
      }
    });

    /* ── Show modal with animation ── */
    requestAnimationFrame(() => {
      overlay.classList.add('cc-visible');
      // Focus modal for keyboard users
      setTimeout(() => modal.focus(), 450);
    });
  }

  /* ── Focus trap ──────────────────────────────────────────── */
  function trapFocus(e) {
    if (e.key !== 'Tab') return;
    const modal = document.getElementById('cc-modal');
    const focusable = modal.querySelectorAll(
      'a, button:not(:disabled), input, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last)  { e.preventDefault(); first.focus(); }
    }
  }

  /* ── Hide / Show ─────────────────────────────────────────── */
  function hideModal() {
    const overlay = document.getElementById('cc-overlay');
    if (!overlay) return;
    overlay.classList.remove('cc-visible');
    setTimeout(() => overlay.remove(), 500);
  }

  function showBadge() {
    const badge = document.getElementById('cc-floating-badge');
    if (!badge) return;
    setTimeout(() => badge.classList.add('cc-badge-visible'), 600);
  }

  /* ── Reopen manage modal (from badge) ─────────────────────── */
  function reopenManageModal() {
    // Build a lightweight re-open experience — just re-inits with prefs loaded
    buildModal();
    const savedPrefs = getPrefs() || {};
    // Pre-check both checkboxes (already consented)
    const chkTerms   = document.getElementById('cc-chk-terms');
    const chkCookies = document.getElementById('cc-chk-cookies');
    const labelT     = document.getElementById('cc-label-terms');
    const labelC     = document.getElementById('cc-label-cookies');
    if (chkTerms)   { chkTerms.checked   = true; labelT.classList.add('checked'); }
    if (chkCookies) { chkCookies.checked = true; labelC.classList.add('checked'); }

    // Restore saved prefs
    const analyticsEl = document.getElementById('cc-pref-analytics');
    const adsEl       = document.getElementById('cc-pref-ads');
    const socialEl    = document.getElementById('cc-pref-social');
    if (analyticsEl) analyticsEl.checked = savedPrefs.analytics !== false;
    if (adsEl)       adsEl.checked       = savedPrefs.ads       !== false;
    if (socialEl)    socialEl.checked    = savedPrefs.social    !== false;

    // Update accept button
    const acceptBtn = document.getElementById('cc-accept-btn');
    if (acceptBtn) {
      acceptBtn.disabled = false;
      acceptBtn.setAttribute('aria-disabled', 'false');
      acceptBtn.textContent = '✓  Save & Continue';
    }

    // Remove old badge
    const oldBadge = document.getElementById('cc-floating-badge');
    if (oldBadge) oldBadge.remove();

    init();
  }

  /* ── Load tracking scripts after consent ─────────────────── */
  function loadTrackingScripts(prefs) {
    // Analytics (Google Analytics already loaded in <head>; just enable)
    if (prefs.analytics && typeof gtag === 'function') {
      gtag('consent', 'update', {
        analytics_storage: 'granted',
        ad_storage        : prefs.ads ? 'granted' : 'denied',
      });
    }

    // You can dynamically inject other scripts here, e.g.:
    // if (prefs.social) { ... inject FB pixel ... }
  }

  /* ── Entry point ──────────────────────────────────────────── */
  function main() {
    const consent = getConsent();

    if (consent && consent.accepted) {
      // Already consented — fire tracking immediately and show badge
      loadTrackingScripts(getPrefs() || { analytics: true, ads: true, social: true });

      // Show floating badge after page load
      const badgeEl = document.createElement('div');
      badgeEl.id        = 'cc-floating-badge';
      badgeEl.role      = 'button';
      badgeEl.tabIndex  = 0;
      badgeEl.setAttribute('aria-label', 'Manage your cookie preferences');
      badgeEl.title     = 'Cookie Preferences';
      badgeEl.innerHTML = `<span class="cc-badge-dot" aria-hidden="true"></span> Cookie Preferences`;
      badgeEl.addEventListener('click', () => reopenManageModal());
      badgeEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') reopenManageModal();
      });
      document.body.appendChild(badgeEl);

      // Short delay so it doesn't flash instantly on page load
      setTimeout(() => badgeEl.classList.add('cc-badge-visible'), 1200);

    } else {
      // First visit — set GA to denied until consent is given
      if (typeof gtag === 'function') {
        gtag('consent', 'default', {
          analytics_storage: 'denied',
          ad_storage        : 'denied',
        });
      }
      buildModal();
      init();
    }
  }

  /* ── Boot ─────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }

})();
