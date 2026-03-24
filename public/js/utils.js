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
document.addEventListener("DOMContentLoaded", () => {
  const excludedPages = ["privacy-policy", "terms-conditions", "disclaimer", "about-us", "contact-us", "cookies-policy"];
  const currentUrl = window.location.href.toLowerCase();
  const isExcluded = excludedPages.some(page => currentUrl.includes(page));

  if (!isExcluded && !localStorage.getItem("pc_cookie_consent_min")) {
    const cc = document.createElement("div");
    cc.id = "minimal-cookie-consent";
    cc.innerHTML = `
      <style>
        #minimal-cookie-consent {
          position: fixed;
          bottom: 24px;
          left: 24px;
          width: calc(100% - 48px);
          max-width: 360px;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
          z-index: 99999;
          transform: translateY(40px);
          opacity: 0;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease;
          color: #f8fafc;
          font-family: inherit;
        }
        #minimal-cookie-consent.cc-show {
          transform: translateY(0);
          opacity: 1;
        }
        .cc-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 12px;
        }
        .cc-icon {
          font-size: 1.3rem;
        }
        .cc-title {
          font-weight: 700;
          font-size: 1.05rem;
          color: #fff;
        }
        .cc-text {
          font-size: 0.9rem;
          line-height: 1.6;
          margin-bottom: 20px;
          color: #cbd5e1;
        }
        .cc-actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }
        .cc-accept-btn {
          flex: 1;
          background: #2563eb;
          color: #fff;
          border: none;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s, transform 0.2s;
          text-align: center;
        }
        .cc-accept-btn:hover {
          background: #1d4ed8;
          transform: translateY(-2px);
        }
        .cc-manage-btn {
          font-size: 0.9rem;
          color: #94a3b8;
          text-decoration: none;
          background: none;
          border: none;
          cursor: pointer;
          transition: color 0.3s;
          padding: 8px;
        }
        .cc-manage-btn:hover {
          color: #e2e8f0;
          text-decoration: underline;
        }
        @media (max-width: 480px) {
          #minimal-cookie-consent {
            left: 16px;
            bottom: 16px;
            width: calc(100% - 32px);
          }
          .cc-actions {
            flex-direction: column;
            align-items: stretch;
          }
          .cc-manage-btn {
            margin-top: 4px;
          }
        }
      </style>
      <div class="cc-header">
        <span class="cc-icon">🍪</span>
        <span class="cc-title">Privacy & Cookies</span>
      </div>
      <div class="cc-text">
        We use cookies to ensure you get the best experience and to personalize content.
      </div>
      <div class="cc-actions">
        <button class="cc-accept-btn" id="cc-accept-all">Accept All</button>
        <button class="cc-manage-btn" id="cc-manage-prefs">Manage Preferences</button>
      </div>
    `;
    document.body.appendChild(cc);

    const manageBtn = document.getElementById("cc-manage-prefs");
    const prefix = currentUrl.includes("/tools/") || currentUrl.includes("\\tools\\") ? "../" : "./";
    manageBtn.onclick = () => { window.location.href = prefix + "cookies-policy.html"; };

    requestAnimationFrame(() => {
      setTimeout(() => {
        cc.classList.add("cc-show");
      }, 500);
    });

    document.getElementById("cc-accept-all").addEventListener("click", () => {
      localStorage.setItem("pc_cookie_consent_min", "true");
      cc.classList.remove("cc-show");
      setTimeout(() => cc.remove(), 400);
    });
  }
});
