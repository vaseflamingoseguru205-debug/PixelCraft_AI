// ===== SHARED UTILITIES =====

// Toast Notifications
function showToast(msg, type = 'default') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', default: 'ℹ️' };
  toast.innerHTML = `<span>${icons[type] || icons.default}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(30px)'; toast.style.transition = 'all 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Download canvas/blob/dataURL
function downloadFile(dataURL, filename) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  a.click();
  showToast('Download started!', 'success');
}

// File to DataURL
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// File to Image
function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = reject;
    img.src = url;
  });
}

// Format file size
function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

// Drag & Drop enhancement
function setupDragDrop(area, onFile) {
  area.addEventListener('dragover', e => { e.preventDefault(); area.classList.add('drag-over'); });
  area.addEventListener('dragleave', () => area.classList.remove('drag-over'));
  area.addEventListener('drop', e => {
    e.preventDefault();
    area.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  });
}

// Draw image to canvas scaled
function drawImageToCanvas(canvas, img, maxW = 800, maxH = 600) {
  let w = img.naturalWidth, h = img.naturalHeight;
  if (w > maxW) { h = h * maxW / w; w = maxW; }
  if (h > maxH) { w = w * maxH / h; h = maxH; }
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return ctx;
}

// Navbar scroll effect
document.addEventListener('DOMContentLoaded', () => {
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }
  // Hamburger
  const hamburger = document.querySelector('.nav-hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  }
  // FAQ
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });
});

// Copy Functions
window.copyUPIAnimated = function() {
  navigator.clipboard.writeText('9067693696@axl');
  const btn = document.getElementById('copyUpiBtn');
  btn.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="tick-anim">
      <circle cx="12" cy="12" r="10" stroke="#10b981" stroke-width="2" fill="rgba(16,185,129,0.2)"/>
      <path d="M8 12l3 3 5-6" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  const style = document.createElement('style');
  style.innerHTML = `
    .tick-anim {
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
    .tick-anim path {
      stroke-dasharray: 20;
      stroke-dashoffset: 20;
      animation: drawTick 0.5s ease 0.2s forwards;
    }
    @keyframes popIn { 0% { transform: scale(0); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes drawTick { to { stroke-dashoffset: 0; } }
  `;
  document.head.appendChild(style);
  setTimeout(() => {
    btn.innerHTML = '<span>Copy</span>';
    style.remove();
  }, 2500);
}

window.copyPhoneAlert = function() {
  navigator.clipboard.writeText('+91 9067693696');
  showToast('Phone number copied!', 'success');
}

// ===== Light Cookie Consent =====
document.addEventListener("DOMContentLoaded", async () => {
  const excludedPages = ["privacy-policy", "terms-conditions", "disclaimer", "about-us", "contact-us", "cookies-policy"];
  const currentUrl = window.location.href.toLowerCase();
  const isExcluded = excludedPages.some(page => currentUrl.includes(page));

  // Clear consent when logout is clicked
  document.addEventListener("click", (e) => {
    if (e.target.closest('a[href="/logout"]')) {
      localStorage.removeItem("pc_cookie_consent_min");
      sessionStorage.removeItem("pc_cookie_consent_session");
    }
  });

  if (!isExcluded) {
    let currentUserEmail = null;
    try {
      const res = await fetch("/api/auth/status");
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user && data.user.email) {
          currentUserEmail = data.user.email;
        }
      }
    } catch (e) {}

    // Check both localStorage and sessionStorage
    // sessionStorage is for the "reload" / "fresh session" behavior the user requested
    let consentData = null;
    try {
      const lsRaw = localStorage.getItem("pc_cookie_consent_min");
      const ssRaw = sessionStorage.getItem("pc_cookie_consent_session");
      
      // If the user wants it on reload, we prioritize checking a flag that resets on reload
      // But they also want "Do not show again after acceptance" in the SAME session.
      // So we use sessionStorage to track acceptance in the current window session.
      if (ssRaw) {
        consentData = JSON.parse(ssRaw);
      } else if (lsRaw) {
        // Fallback to localStorage if no session data yet
        consentData = JSON.parse(lsRaw);
      }
    } catch(e) {}

    let needsConsent = true;
    if (consentData && consentData.accepted) {
      // Email must match whatever is currently logged in, or both null
      const emailMatches = consentData.email === currentUserEmail;
      if (emailMatches) {
        needsConsent = false;
      }
    }

    if (needsConsent) {
      const cc = document.createElement("div");
      cc.id = "minimal-cookie-consent";
      const prefix = currentUrl.includes("/tools/") || currentUrl.includes("\\tools\\") ? "../" : "./";
      cc.innerHTML = `
        <style>
          #minimal-cookie-consent {
            position: fixed;
            bottom: 24px;
            left: 24px;
            right: 24px;
            width: auto;
            max-width: 440px;
            background: rgba(15, 23, 42, 0.95);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            border: 1px solid rgba(59, 130, 246, 0.3);
            border-radius: 20px;
            padding: 24px 28px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(59, 130, 246, 0.15);
            z-index: 99999;
            transform: translateY(120%);
            opacity: 0;
            transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.5s ease;
            color: #f8fafc;
            font-family: inherit;
          }
          #minimal-cookie-consent.cc-show {
            transform: translateY(0);
            opacity: 1;
          }
          /* Lock tools until accepted */
          .tools-grid, .tool-workspace, .tool-card {
            pointer-events: none !important;
            filter: blur(3px) grayscale(0.5);
            transition: filter 0.5s ease;
            user-select: none;
          }
          .cc-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 12px;
          }
          .cc-icon {
            font-size: 1.6rem;
            background: rgba(59, 130, 246, 0.1);
            padding: 8px;
            border-radius: 12px;
            border: 1px solid rgba(59, 130, 246, 0.2);
          }
          .cc-title {
            font-weight: 800;
            font-size: 1.15rem;
            color: #fff;
            letter-spacing: -0.01em;
          }
          .cc-text {
            font-size: 0.9rem;
            line-height: 1.6;
            margin-bottom: 16px;
            color: #94a3b8;
          }
          .cc-links-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 8px 12px;
            margin-bottom: 24px;
            padding: 12px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.05);
          }
          .cc-link-item {
            font-size: 0.82rem;
            color: #60a5fa;
            text-decoration: none;
            font-weight: 500;
            transition: color 0.2s;
          }
          .cc-link-item:hover {
            color: #93c5fd;
            text-decoration: underline;
          }
          .cc-link-sep {
            color: rgba(255, 255, 255, 0.1);
            font-size: 0.8rem;
          }
          .cc-accept-btn {
            width: 100%;
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            color: #fff;
            border: none;
            padding: 14px;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
          }
          .cc-accept-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
          }
          @media (max-width: 480px) {
            #minimal-cookie-consent {
              left: 16px;
              right: 16px;
              bottom: 16px;
              width: auto;
              max-width: none;
              padding: 20px;
            }
          }
        </style>
        <div class="cc-header">
          <span class="cc-icon">🔒</span>
          <span class="cc-title">Tool Access Locked</span>
        </div>
        <div class="cc-text">
          Please accept our privacy & cookie policy to unlock and use PixelCraft AI's professional tools. We respect your data and privacy.
        </div>
        <div class="cc-links-grid">
          <a href="${prefix}privacy-policy.html" class="cc-link-item">Privacy Policy</a> <span class="cc-link-sep">|</span>
          <a href="${prefix}terms-conditions.html" class="cc-link-item">Terms &amp; Conditions</a> <span class="cc-link-sep">|</span>
          <a href="${prefix}disclaimer.html" class="cc-link-item">Disclaimer</a> <span class="cc-link-sep">|</span>
          <a href="${prefix}about-us.html" class="cc-link-item">About Us</a> <span class="cc-link-sep">|</span>
          <a href="${prefix}contact-us.html" class="cc-link-item">Contact Us</a> <span class="cc-link-sep">|</span>
          <a href="${prefix}cookies-policy.html" class="cc-link-item">Cookies Policy</a>
        </div>
        <button class="cc-accept-btn" id="cc-accept-all">Accept &amp; Unlock Tools</button>
      `;
      document.body.appendChild(cc);

      requestAnimationFrame(() => {
        setTimeout(() => {
          cc.classList.add("cc-show");
        }, 800);
      });

      document.getElementById("cc-accept-all").addEventListener("click", () => {
        const data = JSON.stringify({
          accepted: true,
          timestamp: Date.now(),
          email: currentUserEmail
        });
        localStorage.setItem("pc_cookie_consent_min", data);
        sessionStorage.setItem("pc_cookie_consent_session", data);
        
        // Unlock tools
        const style = document.createElement('style');
        style.innerHTML = `
          .tools-grid, .tool-workspace, .tool-card {
            pointer-events: auto !important;
            filter: none !important;
            user-select: auto !important;
          }
        `;
        document.head.appendChild(style);
        
        cc.classList.remove("cc-show");
        setTimeout(() => cc.remove(), 600);
      });
    }
  }
});
