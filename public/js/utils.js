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

// ===== PWA CONFIGURATION =====
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('PWA: Service Worker registered'))
      .catch(err => console.error('PWA: Service Worker error', err));
  });
}

// Global PWA Install Handling
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showPWAInstallBanner();
});

function showPWAInstallBanner() {
  if (document.getElementById('pwa-install-banner')) return;

  const banner = document.createElement('div');
  banner.id = 'pwa-install-banner';
  banner.className = 'pwa-install-banner';
  banner.innerHTML = `
    <div class="pwa-content">
      <div class="pwa-icon-mini">🎨</div>
      <div class="pwa-text">
        <strong>Install PixelCraft AI</strong>
        <span>Add to home screen for 1-click access</span>
      </div>
      <button class="pwa-install-btn" id="pwa-install-trigger">Install 🚀</button>
      <button class="pwa-close-btn">&times;</button>
    </div>
  `;

  // Add styles dynamically if not present
  if (!document.getElementById('pwa-styles')) {
    const style = document.createElement('style');
    style.id = 'pwa-styles';
    style.innerHTML = `
      .pwa-install-banner {
        position: fixed;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        background: rgba(15, 23, 42, 0.95);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 10px 16px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.1);
        box-shadow: 0 20px 40px rgba(0,0,0,0.4);
        width: max-content;
        max-width: 95vw;
        animation: pwaSlideUp 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      }
      .pwa-content { display: flex; align-items: center; gap: 12px; }
      .pwa-icon-mini { font-size: 1.5rem; }
      .pwa-text { display: flex; flex-direction: column; color: white; }
      .pwa-text strong { font-size: 0.9rem; font-family: 'Outfit', sans-serif; }
      .pwa-text span { font-size: 0.75rem; opacity: 0.7; }
      .pwa-install-btn { 
        background: #2563EB; color: white; border: none; padding: 8px 16px; 
        border-radius: 12px; font-weight: 600; font-size: 0.85rem; cursor: pointer;
        transition: 0.2s;
      }
      .pwa-install-btn:hover { background: #1d4ed8; transform: scale(1.05); }
      .pwa-close-btn { 
        background: none; border: none; color: rgba(255,255,255,0.4); 
        cursor: pointer; font-size: 1.4rem; padding: 0 4px;
      }
      @keyframes pwaSlideUp { from { transform: translate(-50%, 100px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(banner);

  banner.querySelector('#pwa-install-trigger').addEventListener('click', () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') banner.remove();
      deferredPrompt = null;
    });
  });

  banner.querySelector('.pwa-close-btn').addEventListener('click', () => {
    banner.style.display = 'none';
  });
}

window.addEventListener('appinstalled', () => {
  const banner = document.getElementById('pwa-install-banner');
  if (banner) banner.remove();
  console.log('PWA installed');
});
